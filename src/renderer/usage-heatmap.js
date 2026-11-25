  // Module: Heatmaps & Summary Bar (Daily / Weekly / Monthly / Yearly / Cumulative)
  const DAILY_WINDOW_WEEKS = 52;
  const DAILY_WINDOW_DAYS = DAILY_WINDOW_WEEKS * 7;
  const WEEKLY_WINDOW_WEEKS = 12;
  const MONTHLY_WINDOW_MONTHS = 12;
  const YEARLY_WINDOW_YEARS = 6;
  let currentHeatView = 'daily';
  let heatmapRangeOffset = 0;
  let lastHeatNavState = { canPrev: false, canNext: false };

  function pad2(n) {
    return String(n).padStart(2, '0');
  }

  function toYmd(d) {
    return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
  }

  function ymdToDayIndex(ymd) {
    const [y, m, d] = String(ymd).split('-').map(Number);
    return Math.floor(Date.UTC(y, (m || 1) - 1, d || 1) / 86400000);
  }

  function dayIndexToYmd(idx) {
    const d = new Date(idx * 86400000);
    return `${d.getUTCFullYear()}-${pad2(d.getUTCMonth() + 1)}-${pad2(d.getUTCDate())}`;
  }

  function getWeekStartIdx(dayIdx) {
    const d = new Date(dayIdx * 86400000);
    const dow = d.getUTCDay();
    return dayIdx - (dow === 0 ? 6 : dow - 1);
  }

  function getTodayLocalStr() {
    return toYmd(new Date());
  }

  function normalizeDayRecord(raw) {
    if (!raw || typeof raw !== 'object') return { total: 0, input: 0, output: 0, cache: 0, steps: 0 };
    const input = Number(raw.input ?? raw.prompt ?? 0);
    const output = Number(raw.output ?? 0);
    const cache = Number(raw.cache ?? raw.cacheRead ?? 0);
    const total = Number(raw.total ?? (input + output + cache));
    return { total, input, output, cache, steps: Number(raw.steps || 0) };
  }

  function getActiveDailyMap(data) {
    const src = ANTIGRAVITY_TOKEN_DATA.activeSource || 'all';
    const d = data || ANTIGRAVITY_TOKEN_DATA.raw || {};
    const rawMap = (d.dailyMapBySource && d.dailyMapBySource[src]) || d.dailyMap || {};
    const normalized = {};
    for (const [k, v] of Object.entries(rawMap)) {
      if (/^\d{4}-\d{2}-\d{2}$/.test(k)) normalized[k] = normalizeDayRecord(v);
    }
    return normalized;
  }

  function getFirstUseDate(data, dailyMap) {
    const keys = Object.keys(dailyMap || {})
      .filter(k => /^\d{4}-\d{2}-\d{2}$/.test(k) && (dailyMap[k]?.total || 0) > 0)
      .sort();
    if (keys.length) return keys[0];
    const d = data || ANTIGRAVITY_TOKEN_DATA.raw || {};
    const fallback = d.firstUseDate || d.summary?.firstUseDate || null;
    return (typeof fallback === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(fallback)) ? fallback : null;
  }

  function formatDateSpanLabel(startStr, endStr) {
    if (!startStr && !endStr) return '—';
    if (!endStr || startStr === endStr) return startStr || endStr;
    if (startStr.slice(0, 4) === endStr.slice(0, 4)) {
      return `${startStr} ~ ${endStr.slice(5)}`;
    }
    return `${startStr} ~ ${endStr}`;
  }

  function computeTimelineWindow(view, dailyMap, firstUse, rawOffset = 0, todayStr = getTodayLocalStr()) {
    const today = todayStr || getTodayLocalStr();
    const todayIdx = ymdToDayIndex(today);
    const hasValidFirst = Boolean(firstUse && /^\d{4}-\d{2}-\d{2}$/.test(firstUse));
    const minDateStr = hasValidFirst && firstUse <= today ? firstUse : today;
    const minIdx = ymdToDayIndex(minDateStr);
    const offset = Number.isFinite(rawOffset) ? Math.trunc(rawOffset) : 0;

    if (view === 'weekly') {
      const todayWeekStart = getWeekStartIdx(todayIdx);
      const firstWeekStart = getWeekStartIdx(minIdx);
      const totalWeeks = Math.max(1, Math.floor((todayWeekStart - firstWeekStart) / 7) + 1);
      let safeOffset = 0;
      let winStartWeekStart;
      if (totalWeeks <= WEEKLY_WINDOW_WEEKS) {
        winStartWeekStart = firstWeekStart;
      } else {
        const latestStartWeek = todayWeekStart - (WEEKLY_WINDOW_WEEKS - 1) * 7;
        const maxPagesBack = Math.ceil((latestStartWeek - firstWeekStart) / (WEEKLY_WINDOW_WEEKS * 7));
        safeOffset = Math.max(-maxPagesBack, Math.min(0, offset));
        winStartWeekStart = Math.max(firstWeekStart, latestStartWeek + safeOffset * WEEKLY_WINDOW_WEEKS * 7);
      }
      const winEndWeekStart = winStartWeekStart + (WEEKLY_WINDOW_WEEKS - 1) * 7;
      return {
        view,
        todayStr: today,
        minDateStr,
        minIdx,
        todayIdx,
        safeOffset,
        winStartWeekStart,
        winEndWeekStart,
        canPrev: winStartWeekStart > firstWeekStart,
        canNext: safeOffset < 0
      };
    }

    if (view === 'monthly') {
      const todayYmIdx = Number(today.slice(0, 4)) * 12 + (Number(today.slice(5, 7)) - 1);
      const firstYmIdx = Number(minDateStr.slice(0, 4)) * 12 + (Number(minDateStr.slice(5, 7)) - 1);
      const totalMonths = Math.max(1, todayYmIdx - firstYmIdx + 1);
      let safeOffset = 0;
      let startYmIdx;
      if (totalMonths <= MONTHLY_WINDOW_MONTHS) {
        startYmIdx = firstYmIdx;
      } else {
        const latestStartYm = todayYmIdx - MONTHLY_WINDOW_MONTHS + 1;
        const maxPagesBack = Math.ceil((latestStartYm - firstYmIdx) / MONTHLY_WINDOW_MONTHS);
        safeOffset = Math.max(-maxPagesBack, Math.min(0, offset));
        startYmIdx = Math.max(firstYmIdx, latestStartYm + safeOffset * MONTHLY_WINDOW_MONTHS);
      }
      const endYmIdx = startYmIdx + MONTHLY_WINDOW_MONTHS - 1;
      const monthItems = [];
      for (let idx = startYmIdx; idx <= endYmIdx; idx++) {
        monthItems.push({
          year: Math.floor(idx / 12),
          month: (idx % 12) + 1
        });
      }
      return {
        view,
        todayStr: today,
        minDateStr,
        minIdx,
        todayIdx,
        safeOffset,
        startYmIdx,
        endYmIdx,
        monthItems,
        canPrev: startYmIdx > firstYmIdx,
        canNext: safeOffset < 0
      };
    }

    if (view === 'yearly') {
      const curYear = Number(today.slice(0, 4));
      const firstYear = Number(minDateStr.slice(0, 4));
      const totalYears = Math.max(1, curYear - firstYear + 1);
      let safeOffset = 0;
      let startYear;
      if (totalYears <= YEARLY_WINDOW_YEARS) {
        startYear = firstYear;
      } else {
        const latestStartYear = curYear - YEARLY_WINDOW_YEARS + 1;
        const maxPagesBack = Math.ceil((latestStartYear - firstYear) / YEARLY_WINDOW_YEARS);
        safeOffset = Math.max(-maxPagesBack, Math.min(0, offset));
        startYear = Math.max(firstYear, latestStartYear + safeOffset * YEARLY_WINDOW_YEARS);
      }
      const endYear = startYear + YEARLY_WINDOW_YEARS - 1;
      const years = [];
      for (let y = startYear; y <= endYear; y++) years.push(y);
      return {
        view,
        todayStr: today,
        minDateStr,
        minIdx,
        todayIdx,
        curYear,
        safeOffset,
        startYear,
        endYear,
        years,
        canPrev: startYear > firstYear,
        canNext: safeOffset < 0
      };
    }

    const totalDays = Math.max(1, todayIdx - minIdx + 1);
    let safeOffset = 0;
    let winStartIdx;
    if (totalDays <= DAILY_WINDOW_DAYS) {
      winStartIdx = minIdx;
    } else {
      const latestStart = todayIdx - DAILY_WINDOW_DAYS + 1;
      const stepDays = 26 * 7;
      const maxPagesBack = Math.ceil((latestStart - minIdx) / stepDays);
      safeOffset = Math.max(-maxPagesBack, Math.min(0, offset));
      winStartIdx = Math.max(minIdx, latestStart + safeOffset * stepDays);
    }
    const winEndIdx = winStartIdx + DAILY_WINDOW_DAYS - 1;
    return {
      view,
      todayStr: today,
      minDateStr,
      minIdx,
      todayIdx,
      safeOffset,
      winStartIdx,
      winEndIdx,
      winStartStr: dayIndexToYmd(winStartIdx),
      winEndStr: dayIndexToYmd(winEndIdx),
      canPrev: winStartIdx > minIdx,
      canNext: safeOffset < 0
    };
  }

  function hideHeatPop() {
    const pop = el('heat-pop');
    if (pop) pop.hidden = true;
  }

  function showHeatPop(anchorEl, html) {
    const pop = el('heat-pop');
    if (!pop) return;
    pop.innerHTML = html;
    pop.hidden = false;
    try {
      const vw = (typeof window !== 'undefined' && window.innerWidth) || 1280;
      const vh = (typeof window !== 'undefined' && window.innerHeight) || 800;
      const r = anchorEl?.getBoundingClientRect?.();
      const pw = pop.offsetWidth || 220;
      const ph = pop.offsetHeight || 90;
      let left = r ? Math.round(r.left + r.width / 2 - pw / 2) : Math.round((vw - pw) / 2);
      let top = r ? Math.round(r.top - ph - 8) : 120;
      if (top < 12 && r) top = Math.round(r.bottom + 8);
      left = Math.max(8, Math.min(vw - pw - 8, left));
      top = Math.max(8, Math.min(vh - ph - 8, top));
      pop.style.left = `${left}px`;
      pop.style.top = `${top}px`;
    } catch {}
  }

  function formatDayBreakdownHtml(titleLine, row, costUsd, extraLine = '') {
    const r = normalizeDayRecord(row);
    const prompt = formatTokensK(r.input);
    const out = formatTokensK(r.output);
    const cache = formatTokensK(r.cache);
    const total = formatTokensK(r.total);
    const parts = [
      `<div class="heat-pop-date">${escapeHtml(titleLine)}</div>`,
      `<div class="heat-pop-tok">${escapeHtml(total)} tokens · ≈ $${Number(costUsd || 0).toFixed(2)}</div>`,
      `<div class="heat-pop-detail">${escapeHtml(t('heat.prompt'))}: ${escapeHtml(prompt)} · ${escapeHtml(t('heat.output'))}: ${escapeHtml(out)} · ${escapeHtml(t('heat.cache'))}: ${escapeHtml(cache)}</div>`
    ];
    if (extraLine) {
      parts.push(`<div class="heat-pop-models">${escapeHtml(extraLine)}</div>`);
    }
    return parts.join('');
  }

  function updateSummaryBar(intervalStats) {
    const tokEl = el('hs-tokens');
    const costEl = el('hs-cost');
    const avgEl = el('hs-daily-avg');
    const activeAvgEl = el('hs-active-avg');
    const roiEl = el('hs-sub-ratio');
    const stats = intervalStats || { totalTokens: 0, totalCostUSD: 0, dailyAverageUSD: 0, activeDailyAverageUSD: 0, activeDays: 0 };

    if (tokEl) tokEl.textContent = formatTokensK(stats.totalTokens || 0);
    if (costEl) costEl.textContent = `≈ $${Number(stats.totalCostUSD || 0).toFixed(2)}`;
    if (avgEl) avgEl.textContent = `$${Number(stats.dailyAverageUSD || 0).toFixed(2)}`;
    if (activeAvgEl) {
      activeAvgEl.textContent = t('heat.activeDays', {
        avg: Number(stats.activeDailyAverageUSD || 0).toFixed(2),
        days: stats.activeDays || 0
      });
    }

    if (roiEl) {
      const ps = ANTIGRAVITY_TOKEN_DATA.planStatus || {};
      const paid = ps.actualPricePaid !== null && ps.actualPricePaid !== undefined ? Number(ps.actualPricePaid) : null;
      const cur = ps.currency || 'USD';
      let monthlyUsd = null;
      if (ps.isZeroExtraCost || paid === 0) {
        roiEl.textContent = t('cost.freePromo');
        return;
      }
      if (paid && Number.isFinite(paid) && paid > 0) {
        if (cur === 'USD') monthlyUsd = paid;
        else if (core?.convertToCNY) monthlyUsd = core.convertToCNY(paid, cur, ps.region) / 7.2;
      } else if (ps.publicRefPriceUsd && Number.isFinite(Number(ps.publicRefPriceUsd))) {
        monthlyUsd = Number(ps.publicRefPriceUsd);
      }
      if (monthlyUsd && monthlyUsd > 0 && stats.totalCostUSD > 0) {
        roiEl.textContent = t('heat.roi', { ratio: (stats.totalCostUSD / monthlyUsd).toFixed(1) });
      } else {
        roiEl.textContent = '—';
      }
    }
  }

  function updateNavButtonsState() {
    const prevBtn = el('btn-heat-prev');
    const nextBtn = el('btn-heat-next');
    if (prevBtn) prevBtn.disabled = !lastHeatNavState.canPrev;
    if (nextBtn) nextBtn.disabled = !lastHeatNavState.canNext;
  }

  function bindCellHover(cellEl, htmlBuilder) {
    cellEl.addEventListener('mouseenter', () => showHeatPop(cellEl, htmlBuilder()));
    cellEl.addEventListener('click', e => {
      e?.stopPropagation?.();
      showHeatPop(cellEl, htmlBuilder());
    });
    cellEl.addEventListener('mouseleave', () => hideHeatPop());
  }

  function renderDailyOrCumHeatmap(dailyMap, firstUse, isCum = false) {
    const grid = el('heatmap-grid');
    if (!grid) return;
    grid.innerHTML = '';

    const todayStr = getTodayLocalStr();
    const win = computeTimelineWindow(isCum ? 'cum' : 'daily', dailyMap, firstUse, heatmapRangeOffset, todayStr);
    heatmapRangeOffset = win.safeOffset;
    lastHeatNavState = { canPrev: win.canPrev, canNext: win.canNext };
    updateNavButtonsState();

    const dayList = [];
    for (let idx = win.winStartIdx; idx <= win.winEndIdx; idx++) {
      dayList.push(dayIndexToYmd(idx));
    }

    const rangeLabel = el('heat-range-label');
    if (rangeLabel) {
      rangeLabel.textContent = formatDateSpanLabel(win.winStartStr, win.winEndStr);
    }

    const values = [];
    let runningTotal = 0;
    if (isCum) {
      for (const [ds, row] of Object.entries(dailyMap)) {
        if (ds >= win.minDateStr && ds < win.winStartStr && ds <= todayStr) {
          runningTotal += Number(row?.total || 0);
        }
      }
    }
    const dayPoints = dayList.map(ds => {
      const row = normalizeDayRecord(dailyMap[ds]);
      const isFuture = ds > todayStr;
      if (!isFuture) runningTotal += row.total;
      const val = isCum ? (isFuture ? 0 : runningTotal) : (isFuture ? 0 : row.total);
      if (!isFuture && val > 0) values.push(val);
      return { ds, row, val, isFuture };
    });

    const maxVal = values.length ? Math.max(...values) : 0;
    const weeksWrap = document.createElement('div');
    weeksWrap.className = 'heat-grid-weeks';

    const intervalDates = [];
    let colEl = null;
    dayPoints.forEach((pt, idx) => {
      if (idx % 7 === 0) {
        colEl = document.createElement('div');
        colEl.className = 'heat-day-col';
        weeksWrap.appendChild(colEl);
      }
      const cell = document.createElement('button');
      cell.type = 'button';
      cell.className = 'heat-cell';
      cell.setAttribute('data-date', pt.ds);
      if (pt.isFuture) cell.classList.add('is-future');
      if (pt.ds === todayStr) cell.classList.add('is-today');
      if (firstUse && pt.ds === firstUse) cell.classList.add('is-first-use');
      const lvl = pt.isFuture
        ? 0
        : (core?.getLvlForRange ? core.getLvlForRange(pt.val, isCum ? 'cum' : 'day', maxVal) : (pt.val > 0 ? 2 : 0));
      cell.setAttribute('data-level', String(lvl));
      cell.setAttribute('aria-label', `${pt.ds}: ${formatTokensK(pt.val)}`);

      if (!pt.isFuture) intervalDates.push(pt.ds);

      bindCellHover(cell, () => {
        if (pt.isFuture) {
          return `<div class="heat-pop-date">${escapeHtml(pt.ds)}</div><div class="heat-pop-detail">${escapeHtml(t('heat.future'))}</div>`;
        }
        const cost = core?.getDailyModelCost ? core.getDailyModelCost(pt.row, pt.ds).costUSD : 0;
        let tags = '';
        if (pt.ds === todayStr) tags += t('heat.today');
        if (firstUse && pt.ds === firstUse) tags += t('heat.firstUse');
        const extra = isCum ? t('heat.cumTotal', { avg: Number(cost).toFixed(2) }) : '';
        return formatDayBreakdownHtml(`${pt.ds}${tags}${isCum ? t('heat.cumSuffix') : ''}`, pt.row, cost, extra);
      });

      colEl?.appendChild(cell);
    });

    grid.appendChild(weeksWrap);
    const stats = core?.calculateIntervalCost
      ? core.calculateIntervalCost(dailyMap, intervalDates, undefined, { todayStr })
      : { totalTokens: 0, totalCostUSD: 0, dailyAverageUSD: 0, activeDailyAverageUSD: 0, activeDays: 0 };
    updateSummaryBar(stats);
  }

  function renderHeatmapWeekly(dailyMap, firstUse) {
    const grid = el('heatmap-grid');
    if (!grid) return;
    grid.innerHTML = '';

    const todayStr = getTodayLocalStr();
    const win = computeTimelineWindow('weekly', dailyMap, firstUse, heatmapRangeOffset, todayStr);
    heatmapRangeOffset = win.safeOffset;
    lastHeatNavState = { canPrev: win.canPrev, canNext: win.canNext };
    updateNavButtonsState();

    const weekBuckets = [];
    for (let wStartIdx = win.winStartWeekStart; wStartIdx <= win.winEndWeekStart; wStartIdx += 7) {
      const isFuture = wStartIdx > win.todayIdx;
      if (isFuture) {
        weekBuckets.push({
          startStr: dayIndexToYmd(wStartIdx),
          endStr: dayIndexToYmd(wStartIdx + 6),
          dates: [],
          sum: { total: 0, input: 0, output: 0, cache: 0 },
          isFuture: true
        });
        continue;
      }
      const effStartIdx = Math.max(wStartIdx, win.minIdx);
      const effEndIdx = Math.min(wStartIdx + 6, win.todayIdx);
      const dates = [];
      const sum = { total: 0, input: 0, output: 0, cache: 0 };
      for (let dIdx = effStartIdx; dIdx <= effEndIdx; dIdx++) {
        const ymd = dayIndexToYmd(dIdx);
        dates.push(ymd);
        const r = normalizeDayRecord(dailyMap[ymd]);
        sum.total += r.total;
        sum.input += r.input;
        sum.output += r.output;
        sum.cache += r.cache;
      }
      weekBuckets.push({
        startStr: dayIndexToYmd(Math.max(wStartIdx, win.minIdx)),
        endStr: dayIndexToYmd(wStartIdx + 6),
        dates,
        sum,
        isFuture: false
      });
    }

    const rangeLabel = el('heat-range-label');
    if (rangeLabel) {
      rangeLabel.textContent = weekBuckets.length
        ? formatDateSpanLabel(weekBuckets[0].startStr, weekBuckets[weekBuckets.length - 1].endStr)
        : '—';
    }

    const maxTotal = Math.max(0, ...weekBuckets.map(b => b.sum.total));
    const wrap = document.createElement('div');
    wrap.className = 'heatmap-monthly-grid';
    const allDates = [];

    for (const b of weekBuckets) {
      if (!b.isFuture) allDates.push(...b.dates);
      const stats = (!b.isFuture && core?.calculateIntervalCost)
        ? core.calculateIntervalCost(dailyMap, b.dates, undefined, { todayStr })
        : { totalCostUSD: 0, dailyAverageUSD: 0 };
      const lvl = b.isFuture
        ? 0
        : (core?.getLvlForRange ? core.getLvlForRange(b.sum.total, 'week', maxTotal) : (b.sum.total > 0 ? 2 : 0));
      const card = document.createElement('div');
      card.className = 'heat-month-card';
      if (b.isFuture) card.classList.add('is-future');
      card.setAttribute('data-level', String(lvl));
      card.setAttribute('data-week-start', b.startStr);
      card.setAttribute('data-week-end', b.endStr);
      const weekName = b.startStr === b.endStr
        ? b.startStr.slice(5)
        : `${b.startStr.slice(5)}–${b.endStr.slice(5)}`;
      card.innerHTML = `<div class="heat-month-name">${escapeHtml(weekName)}</div><div class="heat-month-val">${escapeHtml(b.isFuture ? '—' : formatTokensK(b.sum.total))}</div><div class="heat-month-sub">${b.isFuture ? '—' : `≈ $${Number(stats.totalCostUSD || 0).toFixed(2)}`}</div>`;
      bindCellHover(card, () => b.isFuture
        ? `<div class="heat-pop-date">${escapeHtml(formatDateSpanLabel(b.startStr, b.endStr))}</div><div class="heat-pop-detail">${escapeHtml(t('heat.future'))}</div>`
        : formatDayBreakdownHtml(
          formatDateSpanLabel(b.startStr, b.endStr),
          b.sum,
          stats.totalCostUSD,
          t('heat.weeklyTotal', { avg: Number(stats.dailyAverageUSD || 0).toFixed(2) })
        ));
      wrap.appendChild(card);
    }

    grid.appendChild(wrap);
    const totalStats = core?.calculateIntervalCost
      ? core.calculateIntervalCost(dailyMap, allDates, undefined, { todayStr })
      : { totalTokens: 0, totalCostUSD: 0, dailyAverageUSD: 0, activeDailyAverageUSD: 0, activeDays: 0 };
    updateSummaryBar(totalStats);
  }

  function renderHeatmapMonthly(dailyMap, firstUse) {
    const grid = el('heatmap-grid');
    if (!grid) return;
    grid.innerHTML = '';

    const todayStr = getTodayLocalStr();
    const win = computeTimelineWindow('monthly', dailyMap, firstUse, heatmapRangeOffset, todayStr);
    heatmapRangeOffset = win.safeOffset;
    lastHeatNavState = { canPrev: win.canPrev, canNext: win.canNext };
    updateNavButtonsState();

    const monthItems = Array.isArray(win.monthItems) ? win.monthItems : [];
    const rangeLabel = el('heat-range-label');
    if (rangeLabel && monthItems.length) {
      const firstM = monthItems[0];
      const lastM = monthItems[monthItems.length - 1];
      if (firstM.year === lastM.year && firstM.month === 1 && lastM.month === 12) {
        rangeLabel.textContent = t('tokens.range.year', { y: firstM.year });
      } else {
        rangeLabel.textContent = `${firstM.year}-${pad2(firstM.month)} ~ ${lastM.year}-${pad2(lastM.month)}`;
      }
    }

    const months = [];
    const allDates = [];
    const curMonthPrefix = todayStr.slice(0, 7);
    for (const mi of monthItems) {
      const targetYear = mi.year;
      const m = mi.month;
      const mPrefix = `${targetYear}-${pad2(m)}`;
      const isFuture = mPrefix > curMonthPrefix;
      const daysInMonth = new Date(targetYear, m, 0).getDate();
      const fullDates = [];
      if (!isFuture) {
        for (let day = 1; day <= daysInMonth; day++) {
          const ymd = `${mPrefix}-${pad2(day)}`;
          if (ymd >= win.minDateStr && ymd <= todayStr) {
            fullDates.push(ymd);
            allDates.push(ymd);
          }
        }
      }
      const sum = { total: 0, input: 0, output: 0, cache: 0 };
      for (const ds of fullDates) {
        if (!dailyMap[ds]) continue;
        const r = normalizeDayRecord(dailyMap[ds]);
        sum.total += r.total;
        sum.input += r.input;
        sum.output += r.output;
        sum.cache += r.cache;
      }
      const stats = (!isFuture && core?.calculateIntervalCost)
        ? core.calculateIntervalCost(dailyMap, fullDates, undefined, { todayStr })
        : { totalCostUSD: 0, dailyAverageUSD: 0, activeDays: 0 };
      months.push({ year: targetYear, m, mPrefix, sum, stats, isFuture });
    }

    const maxTotal = Math.max(0, ...months.map(x => x.sum.total));
    const wrap = document.createElement('div');
    wrap.className = 'heatmap-monthly-grid';

    for (const item of months) {
      const isPeak = !item.isFuture && maxTotal > 0 && item.sum.total === maxTotal;
      const lvl = item.isFuture ? 0 : (core?.getLvlForRange ? core.getLvlForRange(item.sum.total, 'month', maxTotal) : (item.sum.total > 0 ? 2 : 0));
      const card = document.createElement('div');
      card.className = 'heat-month-card';
      if (item.isFuture) card.classList.add('is-future');
      card.setAttribute('data-level', String(lvl));
      card.setAttribute('data-month', item.mPrefix);
      const titleText = t('tokens.range.month', { y: item.year, m: item.m });
      const peakBadge = isPeak ? ` · ${t('heat.peak')}` : '';
      card.innerHTML = `<div class="heat-month-name">${escapeHtml(titleText)}${escapeHtml(peakBadge)}</div><div class="heat-month-val">${escapeHtml(item.isFuture ? '—' : formatTokensK(item.sum.total))}</div><div class="heat-month-sub">${item.isFuture ? '—' : `≈ $${Number(item.stats.totalCostUSD || 0).toFixed(2)}`}</div>`;

      bindCellHover(card, () => {
        if (item.isFuture) {
          return `<div class="heat-pop-date">${escapeHtml(titleText)}</div><div class="heat-pop-detail">${escapeHtml(t('heatmap.pop.future'))}</div>`;
        }
        const suffix = (item.mPrefix === curMonthPrefix ? t('heatmap.pop.inProgress') : '') + (isPeak ? t('heatmap.pop.peak') : '');
        const extra = t('heatmap.pop.monthlyDet', {
          avg: Number(item.stats.dailyAverageUSD || 0).toFixed(2),
          days: item.stats.activeDays || 0
        });
        return formatDayBreakdownHtml(`${titleText}${suffix}`, item.sum, item.stats.totalCostUSD, extra);
      });
      wrap.appendChild(card);
    }

    grid.appendChild(wrap);
    const totalStats = core?.calculateIntervalCost
      ? core.calculateIntervalCost(dailyMap, allDates, undefined, { todayStr })
      : { totalTokens: 0, totalCostUSD: 0, dailyAverageUSD: 0, activeDailyAverageUSD: 0, activeDays: 0 };
    updateSummaryBar(totalStats);
  }

  function renderHeatmapYearly(dailyMap, firstUse) {
    const grid = el('heatmap-grid');
    if (!grid) return;
    grid.innerHTML = '';

    const todayStr = getTodayLocalStr();
    const win = computeTimelineWindow('yearly', dailyMap, firstUse, heatmapRangeOffset, todayStr);
    heatmapRangeOffset = win.safeOffset;
    lastHeatNavState = { canPrev: win.canPrev, canNext: win.canNext };
    updateNavButtonsState();

    const years = win.years;
    const rangeLabel = el('heat-range-label');
    if (rangeLabel) {
      rangeLabel.textContent = win.startYear === win.endYear
        ? t('tokens.range.year', { y: win.startYear })
        : `${win.startYear}–${win.endYear}`;
    }

    const allDates = [];
    const wrap = document.createElement('div');
    wrap.className = 'heatmap-yearly-grid';

    const yearRows = years.map(y => {
      const isFuture = y > win.curYear;
      const fullDates = [];
      const sum = { total: 0, input: 0, output: 0, cache: 0 };
      if (!isFuture) {
        const yStartIdx = Math.max(win.minIdx, ymdToDayIndex(`${y}-01-01`));
        const yEndIdx = Math.min(win.todayIdx, ymdToDayIndex(`${y}-12-31`));
        for (let idx = yStartIdx; idx <= yEndIdx; idx++) {
          const ds = dayIndexToYmd(idx);
          fullDates.push(ds);
          allDates.push(ds);
          if (!dailyMap[ds]) continue;
          const r = normalizeDayRecord(dailyMap[ds]);
          sum.total += r.total;
          sum.input += r.input;
          sum.output += r.output;
          sum.cache += r.cache;
        }
      }
      const stats = (!isFuture && core?.calculateIntervalCost)
        ? core.calculateIntervalCost(dailyMap, fullDates, undefined, { todayStr })
        : { totalCostUSD: 0, activeDays: 0 };
      return { y, sum, stats, isFuture };
    });

    const maxTotal = Math.max(0, ...yearRows.map(r => r.sum.total));
    for (const yr of yearRows) {
      const lvl = yr.isFuture
        ? 0
        : (core?.getLvlForRange ? core.getLvlForRange(yr.sum.total, 'year', maxTotal) : (yr.sum.total > 0 ? 2 : 0));
      const card = document.createElement('div');
      card.className = 'heat-year-card';
      if (yr.isFuture) card.classList.add('is-future');
      card.setAttribute('data-level', String(lvl));
      card.setAttribute('data-year', String(yr.y));
      const label = t('tokens.range.year', { y: yr.y });
      card.innerHTML = `<div class="heat-year-title">${escapeHtml(label)}</div><div class="heat-year-val">${escapeHtml(yr.isFuture ? '—' : formatTokensK(yr.sum.total))}</div><div class="heat-year-sub">${yr.isFuture ? '—' : `≈ $${Number(yr.stats.totalCostUSD || 0).toFixed(2)} · ${yr.stats.activeDays || 0}d`}</div>`;
      bindCellHover(card, () => yr.isFuture
        ? `<div class="heat-pop-date">${escapeHtml(label)}</div><div class="heat-pop-detail">${escapeHtml(t('heat.future'))}</div>`
        : formatDayBreakdownHtml(label, yr.sum, yr.stats.totalCostUSD));
      wrap.appendChild(card);
    }

    grid.appendChild(wrap);
    const totalStats = core?.calculateIntervalCost
      ? core.calculateIntervalCost(dailyMap, allDates, undefined, { todayStr })
      : { totalTokens: 0, totalCostUSD: 0, dailyAverageUSD: 0, activeDailyAverageUSD: 0, activeDays: 0 };
    updateSummaryBar(totalStats);
  }

  function renderHeatmapGrid(data = null) {
    const dailyMap = getActiveDailyMap(data);
    const firstUse = getFirstUseDate(data, dailyMap);
    const firstUseEl = el('heat-first-use');
    if (firstUseEl) {
      firstUseEl.textContent = firstUse
        ? t('tokens.firstUse', { date: firstUse })
        : t('tokens.heat.firstUsePlaceholder');
    }

    if (currentHeatView === 'weekly') {
      renderHeatmapWeekly(dailyMap, firstUse);
    } else if (currentHeatView === 'monthly') {
      renderHeatmapMonthly(dailyMap, firstUse);
    } else if (currentHeatView === 'yearly') {
      renderHeatmapYearly(dailyMap, firstUse);
    } else if (currentHeatView === 'cum') {
      renderDailyOrCumHeatmap(dailyMap, firstUse, true);
    } else {
      renderDailyOrCumHeatmap(dailyMap, firstUse, false);
    }
  }

  function switchHeatView(view, skipPersist = false) {
    const valid = new Set(['daily', 'weekly', 'monthly', 'yearly', 'cum']);
    const next = valid.has(view) ? view : 'daily';
    currentHeatView = next;
    heatmapRangeOffset = 0;

    for (const v of valid) {
      el(`heat-tab-${v}`)?.classList?.toggle?.('active', v === next);
    }

    renderHeatmapGrid();
    if (!skipPersist) {
      saveSettingsPayloadBridge?.({ savedHeatView: next })?.catch?.(() => {});
    }
  }

  function shiftHeatRange(delta) {
    if (!Number.isFinite(delta) || delta === 0) return;
    if (delta < 0 && !lastHeatNavState.canPrev) return;
    if (delta > 0 && !lastHeatNavState.canNext) return;
    heatmapRangeOffset = Math.min(0, heatmapRangeOffset + Math.trunc(delta));
    renderHeatmapGrid();
  }
