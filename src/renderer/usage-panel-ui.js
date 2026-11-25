(function (root) {
  'use strict';

  const SUITE_VERSION = '1.0.0';
  const USAGE_TEMPLATE_RAW = `/* @INSERT_USAGE_TEMPLATE */`;
  const USAGE_STYLES_RAW = `/* @INSERT_USAGE_STYLES */`;

  function hasUnbuiltTemplate(str) {
    return typeof str !== 'string' || str.includes('/* @INSERT_USAGE_TEMPLATE */');
  }

  /**
   * Mount the unified "Local Recorded Usage" (#badge-tokens + #panel-tokens) Shadow DOM UI
   * wired to the shared TelemetryHub.
   */
  function mountUsagePanel(options = {}) {
    const win = options.window || (typeof window !== 'undefined' ? window : null);
    const doc = options.document || (typeof document !== 'undefined' ? document : null);
    if (!doc) throw new Error('Document is required to mount Usage Panel UI');

    const core = options.core || root.__AGUsageCore || root.__AGContextMeterCore || null;
    const hub = options.telemetryHub || win?.__AGUnifiedTelemetry || null;
    const templateHtml = typeof options.templateHtml === 'string'
      ? options.templateHtml
      : (hasUnbuiltTemplate(USAGE_TEMPLATE_RAW) ? '' : USAGE_TEMPLATE_RAW);
    const stylesCss = typeof options.stylesCss === 'string'
      ? options.stylesCss
      : (USAGE_STYLES_RAW.includes('/* @INSERT_USAGE_STYLES */') ? '' : USAGE_STYLES_RAW);

    try {
      doc.getElementById?.('ag-usage-suite-host')?.remove?.();
      doc.getElementById?.('ag-context-meter-host')?.remove?.();
    } catch {}

    const host = doc.createElement('div');
    host.id = 'ag-usage-suite-host';
    host.setAttribute('data-dock', 'floating');
    host.setAttribute('data-theme', 'dark');
    if (host.style) host.style.webkitAppRegion = 'no-drag';

    const shadow = typeof host.attachShadow === 'function' ? host.attachShadow({ mode: 'open' }) : host;
    if (shadow === host) {
      host.innerHTML = `<style>${stylesCss}</style>${templateHtml}`;
    } else {
      const styleEl = doc.createElement('style');
      styleEl.textContent = stylesCss;
      const wrapper = doc.createElement('div');
      wrapper.innerHTML = templateHtml;
      shadow.appendChild?.(styleEl);
      while (wrapper.firstChild) shadow.appendChild?.(wrapper.firstChild);
    }

    const cleanupCallbacks = [];
    function registerCleanup(fn) {
      if (typeof fn === 'function') cleanupCallbacks.push(fn);
    }

    function el(id) {
      if (!shadow) return null;
      if (typeof shadow.getElementById === 'function') return shadow.getElementById(id);
      if (typeof shadow.querySelector === 'function') return shadow.querySelector(`#${id}`);
      return null;
    }

    function escapeHtml(s) {
      return String(s ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    }

    function addClass(node, cls) {
      if (!node) return;
      if (node.classList?.add) node.classList.add(cls);
      else if (typeof node.className === 'string' && !node.className.split(/\s+/).includes(cls)) {
        node.className = `${node.className} ${cls}`.trim();
      }
    }

    function removeClass(node, cls) {
      if (!node) return;
      if (node.classList?.remove) node.classList.remove(cls);
      else if (typeof node.className === 'string') {
        node.className = node.className.split(/\s+/).filter(c => c && c !== cls).join(' ');
      }
    }

    function hasClass(node, cls) {
      if (!node) return false;
      if (node.classList?.contains) return Boolean(node.classList.contains(cls));
      return typeof node.className === 'string' && node.className.split(/\s+/).includes(cls);
    }

    function formatTokensK(n) {
      if (core?.formatTokensK) return core.formatTokensK(n);
      const val = Number(n) || 0;
      if (val >= 1e9) return `${(val / 1e9).toFixed(2)}B`;
      if (val >= 1e6) return `${(val / 1e6).toFixed(2)}M`;
      if (val >= 1e3) return `${(val / 1e3).toFixed(1)}K`;
      return String(Math.round(val));
    }

    let isHydratingUiControls = false;
    function runWithUiHydration(fn) {
      const prev = isHydratingUiControls;
      isHydratingUiControls = true;
      try {
        return fn();
      } finally {
        isHydratingUiControls = prev;
      }
    }

    const ANTIGRAVITY_TOKEN_DATA = {
      activeSource: 'all',
      tokenView: 'tokens',
      costScope: 'period',
      costMode: 'ref',
      costDetailsExpanded: false,
      raw: null,
      callsByDate: {},
      planStatus: null
    };

    const state = {
      disposed: false,
      started: false,
      tokensOpen: false,
      colorsDrawerExpanded: false,
      historyTimer: null,
      unsubs: [],
      titlebarObserver: null,
      resizeObserver: null,
      lastBridgeSyncAt: 0
    };

    function getBridgeInfo() {
      const url = options.bridgeUrl || win?.__AG_METER_LIVE_BRIDGE__?.url || '';
      const token = options.bridgeToken || win?.__AG_METER_LIVE_BRIDGE__?.token || '';
      if (!url || !token) return null;
      return { url: String(url).replace(/\/+$/, ''), token: String(token) };
    }

    async function callBridge(route, payload = {}) {
      const info = getBridgeInfo();
      const fetchFn = options.fetch || (win?.fetch ? win.fetch.bind(win) : null);
      if (!info || !fetchFn) return { ok: false, error: t('dropdown.noPersistBridge') };
      try {
        const resp = await fetchFn(`${info.url}${route}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-AG-Context-Token': info.token
          },
          body: JSON.stringify(payload)
        });
        if (!resp || !resp.ok) {
          return { ok: false, error: `HTTP ${resp ? resp.status : 'err'}` };
        }
        return await resp.json();
      } catch (e) {
        return { ok: false, error: e?.message || t('dropdown.persistErr') };
      }
    }

    async function saveSettingsPayloadBridge(payload) {
      return callBridge('/save-settings', payload);
    }

    function toggleTokenColorsDrawer(forceExpand) {
      const drawer = el('token-color-drawer');
      const body = el('token-color-drawer-body');
      const btn = el('btn-toggle-token-colors');
      const topBtn = el('btn-token-colors-top');
      if (!body) return;
      const next = typeof forceExpand === 'boolean' ? forceExpand : body.hidden;
      state.colorsDrawerExpanded = next;
      body.hidden = !next;
      drawer?.classList?.toggle?.('is-expanded', next);
      if (btn) {
        btn.setAttribute?.('aria-expanded', next ? 'true' : 'false');
        const chev = btn.querySelector?.('.drawer-chevron');
        if (chev) chev.textContent = next ? t('drawer.collapseSettings') : t('drawer.expandSettings');
      }
      if (topBtn) {
        topBtn.setAttribute?.('aria-pressed', next ? 'true' : 'false');
      }
    }

    /* @INSERT_USAGE_I18N */
    /* @INSERT_USAGE_COLORS */
    /* @INSERT_USAGE_HEATMAP */
    /* @INSERT_USAGE_DROPDOWN */

    function updateBadgeTokensText(data) {
      const badgeText = el('badge-tokens-text');
      const badgeBtn = el('badge-tokens');
      if (!badgeText) return;
      const dailyMap = getActiveDailyMap(data || ANTIGRAVITY_TOKEN_DATA.raw || {});
      const todayStr = getTodayLocalStr();
      let totalTok = 0;
      for (const row of Object.values(dailyMap)) {
        totalTok += Number(row?.total || 0);
      }
      const todayTok = dailyMap[todayStr]?.total ?? 0;
      if (!data && !ANTIGRAVITY_TOKEN_DATA.raw && totalTok === 0 && todayTok === 0) {
        badgeText.textContent = 'Tokens --';
        badgeBtn?.removeAttribute?.('title');
        return;
      }
      const todayFmt = formatTokensK(todayTok);
      const totalFmt = formatTokensK(totalTok);
      const todaySpan = doc.createElement('span');
      todaySpan.className = 'ag-badge-today';
      todaySpan.textContent = t('tokens.badge.todayShort', { val: todayFmt });
      const sepSpan = doc.createElement('span');
      sepSpan.className = 'ag-badge-sep';
      sepSpan.setAttribute('aria-hidden', 'true');
      sepSpan.textContent = ' · ';
      const totalSpan = doc.createElement('span');
      totalSpan.className = 'ag-badge-total';
      totalSpan.textContent = totalFmt;
      badgeText.textContent = '';
      if (typeof badgeText.replaceChildren === 'function') {
        badgeText.replaceChildren(todaySpan, sepSpan, totalSpan);
      } else {
        badgeText.appendChild(todaySpan);
        badgeText.appendChild(sepSpan);
        badgeText.appendChild(totalSpan);
      }
      if (badgeBtn) {
        badgeBtn.setAttribute('title', t('tokens.badge.fullTitle', { today: todayFmt, total: totalFmt }));
      }
    }

    function renderTokenCards(data) {
      const dailyMap = getActiveDailyMap(data || ANTIGRAVITY_TOKEN_DATA.raw || {});
      const rawData = data || ANTIGRAVITY_TOKEN_DATA.raw || {};
      const todayStr = getTodayLocalStr();
      const monthPrefix = todayStr.slice(0, 7);
      const yearPrefix = todayStr.slice(0, 4);

      let totalVal = 0;
      let monthVal = 0;
      let yearVal = 0;
      let totalSteps = 0;
      let activeDaysYear = 0;
      const todayDates = [todayStr];
      const monthDates = [];
      const yearDates = [];

      for (const [ds, row] of Object.entries(dailyMap)) {
        const tot = Number(row?.total || 0);
        totalVal += tot;
        totalSteps += Number(row?.steps || 0);
        if (ds.startsWith(monthPrefix)) {
          monthVal += tot;
          monthDates.push(ds);
        }
        if (ds.startsWith(yearPrefix)) {
          yearVal += tot;
          yearDates.push(ds);
          if (tot > 0) activeDaysYear++;
        }
      }
      const todayVal = dailyMap[todayStr]?.total ?? 0;

      const allDates = Object.keys(dailyMap).sort();
      const totalStats = core?.calculateIntervalCost ? core.calculateIntervalCost(dailyMap, allDates, undefined, { todayStr }) : { totalCostUSD: 0, dailyAverageUSD: 0 };
      const todayStats = core?.calculateIntervalCost ? core.calculateIntervalCost(dailyMap, todayDates, undefined, { todayStr }) : { totalCostUSD: 0 };
      const monthStats = core?.calculateIntervalCost ? core.calculateIntervalCost(dailyMap, monthDates, undefined, { todayStr }) : { totalCostUSD: 0, dailyAverageUSD: 0 };
      const yearStats = core?.calculateIntervalCost ? core.calculateIntervalCost(dailyMap, yearDates, undefined, { todayStr }) : { totalCostUSD: 0 };

      const tTotal = el('t-total');
      const tTotalCost = el('t-total-cost');
      const tToday = el('t-today');
      const tTodaySub = el('t-today-sub');
      const tTodayCost = el('t-today-cost');
      const tMonth = el('t-month');
      const tMonthSub = el('t-month-sub');
      const tMonthCost = el('t-month-cost');
      const tYear = el('t-year');
      const tYearSub = el('t-year-sub');
      const tYearCost = el('t-year-cost');

      if (tTotal) tTotal.textContent = formatTokensK(totalVal);
      if (tTotalCost) {
        const usd = Number(totalStats.totalCostUSD || 0);
        const cny = usd * 7.2;
        const avgStr = t('tokens.dailyAvg', { val: Number(totalStats.dailyAverageUSD || 0).toFixed(2) });
        tTotalCost.textContent = `≈ $${usd.toFixed(2)}${avgStr}`;
        tTotalCost.setAttribute?.('title', `≈ $${usd.toFixed(2)} (¥${cny.toFixed(1)})${avgStr}`);
      }
      if (tToday) tToday.textContent = formatTokensK(todayVal);
      if (tTodaySub) {
        const nChats = hub?.getSessionUsageMap?.().size ?? (rawData.summary?.totalConversations || 0);
        tTodaySub.textContent = t('tokens.card.todaySub', { n: nChats });
      }
      if (tTodayCost) tTodayCost.textContent = `≈ $${Number(todayStats.totalCostUSD || 0).toFixed(2)}`;

      if (tMonth) tMonth.textContent = formatTokensK(monthVal);
      if (tMonthSub) {
        const dayOfMonth = Math.max(1, Number(todayStr.slice(8, 10)) || 1);
        tMonthSub.textContent = t('tokens.card.monthSub', { val: formatTokensK(monthVal / dayOfMonth) });
      }
      if (tMonthCost) tMonthCost.textContent = `≈ $${Number(monthStats.totalCostUSD || 0).toFixed(2)}`;

      if (tYear) tYear.textContent = formatTokensK(yearVal);
      if (tYearSub) tYearSub.textContent = t('tokens.card.yearSub', { n: activeDaysYear });
      if (tYearCost) tYearCost.textContent = `≈ $${Number(yearStats.totalCostUSD || 0).toFixed(2)}`;

      const metaEl = el('tokens-meta');
      if (metaEl) {
        const srcName = ANTIGRAVITY_TOKEN_DATA.activeSource === 'cli'
          ? t('tokens.src.cli')
          : (ANTIGRAVITY_TOKEN_DATA.activeSource === 'desktop' ? t('tokens.srcDesktopLabel') : t('tokens.srcAllLabel'));
        metaEl.textContent = `${srcName} · ${totalSteps.toLocaleString()} steps`;
      }
    }

    function renderPlanDetail(planStatus) {
      const ps = planStatus || ANTIGRAVITY_TOKEN_DATA.planStatus || {};
      const tierEl = el('plan-summary-tier');
      const acctEl = el('plan-summary-account');
      const priceBadge = el('plan-summary-price-badge');
      const srcPill = el('plan-summary-source-pill');

      const tierName = ps.planName || ps.tierName || t('common.unknown');
      if (tierEl) tierEl.textContent = tierName;
      if (acctEl) acctEl.textContent = ps.email || t('plan.account.unknown');

      if (priceBadge) {
        if (ps.isZeroExtraCost || ps.actualPricePaid === 0) {
          priceBadge.textContent = `${ps.currencySymbol || '$'}0 ${t('plan.summary.freeWithPlan')}`;
        } else if (ps.actualPricePaid !== null && ps.actualPricePaid !== undefined && ps.actualPricePaid !== '') {
          const sym = ps.currencySymbol || core?.CURRENCY_SYMBOLS?.[ps.currency] || '$';
          const cur = ps.currency || 'USD';
          const cny = core?.convertToCNY ? core.convertToCNY(Number(ps.actualPricePaid), cur, ps.region) : Number(ps.actualPricePaid);
          const cnyStr = cur !== 'CNY' && Number.isFinite(cny) ? ` (${t('plan.cnyShort', { val: cny.toFixed(1) })})` : '';
          priceBadge.textContent = `${sym}${ps.actualPricePaid}${t('plan.summary.perMonth')}${cnyStr}`;
        } else if (ps.publicRefPriceUsd) {
          priceBadge.textContent = `$${ps.publicRefPriceUsd}${t('plan.summary.perMonth')}`;
        } else {
          priceBadge.textContent = t('cost.unknown');
        }
      }

      if (srcPill) {
        srcPill.textContent = ps.priceSource === 'custom'
          ? t('plan.summary.custom')
          : (ps.identified ? t('plan.summary.identified') : t('plan.summary.unknown'));
      }

      const dtPlan = el('dt-plan-name');
      const dtEmail = el('dt-account-email');
      const dtAcq = el('dt-acq-source');
      const dtPrice = el('dt-price-text');
      const dtValRow = el('row-validity');
      const dtValText = el('dt-validity-text');
      const dtNoteRow = el('row-note');
      const dtNoteText = el('dt-note-text');
      const dtPromptRow = el('row-prompt-credits');
      const dtPromptVal = el('dt-prompt-credits');
      const dtFlowRow = el('row-flow-credits');
      const dtFlowVal = el('dt-flow-credits');
      const dtUpdated = el('dt-updated-at');

      if (dtPlan) dtPlan.textContent = tierName;
      if (dtEmail) dtEmail.textContent = ps.email || t('plan.account.unknown');
      if (dtAcq) dtAcq.textContent = localizeAcquisitionSource(ps.acquisitionSourceName || ps.acquisitionSource);

      if (dtPrice) {
        if (ps.isZeroExtraCost || ps.actualPricePaid === 0) {
          dtPrice.textContent = `${ps.currencySymbol || '$'}0 ${t('plan.summary.freeWithPlan')}`;
        } else if (ps.actualPricePaid !== null && ps.actualPricePaid !== undefined && ps.actualPricePaid !== '') {
          const sym = ps.currencySymbol || '$';
          const cycle = localizeBillingCycleLabel(ps.billingCycle);
          dtPrice.textContent = `${sym}${ps.actualPricePaid} · ${cycle}`;
        } else if (ps.publicRefPriceUsd) {
          dtPrice.textContent = t('cost.publicRefMonthly', { p: ps.publicRefPriceUsd });
        } else {
          dtPrice.textContent = t('common.notProvided');
        }
      }

      const modePresetBtn = el('btn-price-mode-preset');
      const modeCustomBtn = el('btn-price-mode-custom');
      const isCustomMode = ps.priceMode === 'custom' || (ps.priceSource === 'custom' && !ps.priceMode);
      modePresetBtn?.classList?.toggle?.('active', !isCustomMode);
      modeCustomBtn?.classList?.toggle?.('active', isCustomMode);

      if (dtValRow && dtValText) {
        if (ps.validEnd) {
          const isExpired = ps.validEnd < getTodayLocalStr();
          dtValRow.style.display = '';
          dtValText.textContent = t(isExpired ? 'plan.validity.expired' : 'plan.validity.active', { date: ps.validEnd });
        } else {
          dtValRow.style.display = 'none';
        }
      }

      if (dtNoteRow && dtNoteText) {
        if (ps.note) {
          dtNoteRow.style.display = '';
          dtNoteText.textContent = ps.note;
        } else {
          dtNoteRow.style.display = 'none';
        }
      }

      if (dtPromptRow && dtPromptVal) {
        if (ps.availablePromptCredits !== undefined || ps.monthlyPromptCredits !== undefined) {
          dtPromptRow.style.display = '';
          dtPromptVal.textContent = t('plan.credits.avail', {
            avail: ps.availablePromptCredits ?? '—',
            monthly: ps.monthlyPromptCredits ?? '—'
          });
        } else {
          dtPromptRow.style.display = 'none';
        }
      }

      if (dtFlowRow && dtFlowVal) {
        if (ps.availableFlowCredits !== undefined || ps.monthlyFlowCredits !== undefined) {
          dtFlowRow.style.display = '';
          dtFlowVal.textContent = t('plan.credits.avail', {
            avail: ps.availableFlowCredits ?? '—',
            monthly: ps.monthlyFlowCredits ?? '—'
          });
        } else {
          dtFlowRow.style.display = 'none';
        }
      }

      if (dtUpdated) {
        dtUpdated.textContent = ps.updatedAt ? String(ps.updatedAt).slice(0, 19).replace('T', ' ') : t('plan.summary.justNow');
      }

      refreshDirectCountryDisplay(ps.country);
      refreshDirectRegionDisplay(ps.region);
      refreshDirectCurrencyDisplay(ps.currency);
    }

    function renderActiveCostEstimateView() {
      const rawData = ANTIGRAVITY_TOKEN_DATA.raw || {};
      const dailyMap = getActiveDailyMap(rawData);
      const ps = ANTIGRAVITY_TOKEN_DATA.planStatus || {};
      const todayStr = getTodayLocalStr();
      const monthPrefix = todayStr.slice(0, 7);
      const isAllScope = ANTIGRAVITY_TOKEN_DATA.costScope === 'all';
      const dates = Object.keys(dailyMap).filter(d => isAllScope || d.startsWith(monthPrefix)).sort();

      const titleEl = el('cost-title');
      const tagEl = el('cost-period-tag');
      const heroEl = el('cost-ref-total');
      const subSpendEl = el('cost-sub-spend-pill');
      const quickEditBtn = el('btn-quick-edit-plan');

      if (titleEl) titleEl.textContent = isAllScope ? t('cost.titleAll') : t('cost.title');
      if (tagEl) tagEl.textContent = isAllScope ? t('cost.allHistory') : t('cost.periodTag');

      let inTok = 0;
      let cacheTok = 0;
      let outTok = 0;
      for (const ds of dates) {
        const row = dailyMap[ds] || {};
        inTok += Number(row.input || 0);
        cacheTok += Number(row.cache || 0);
        outTok += Number(row.output || 0);
      }

      let refSummary = {
        inputCostUSD: 0,
        cacheCostUSD: 0,
        outputCostUSD: 0,
        totalCostUSD: 0,
        matchedTier: { inputPerMillion: 0.30, cacheReadPerMillion: 0.03, outputPerMillion: 2.50 },
        modelDisplayName: 'Gemini 3.8 Flash Standard'
      };
      if (core?.calculateReferenceModelCost) {
        refSummary = core.calculateReferenceModelCost({
          inputTokens: inTok,
          cacheTokens: cacheTok,
          outputTokens: outTok,
          totalTokens: inTok + cacheTok + outTok
        }) || refSummary;
      }

      const activeSource = ANTIGRAVITY_TOKEN_DATA.activeSource || 'all';
      const identSourceEstimate = isAllScope
        ? (rawData.costEstimateBySource?.[activeSource] || rawData.costEstimate)
        : (activeSource === 'all' ? rawData.costEstimateCurrentMonth : rawData.costEstimateBySource?.[activeSource]);
      const identCost = Number(identSourceEstimate?.pricedCostUSD || 0);
      const identCount = Number(identSourceEstimate?.pricedRequestsCount || 0);
      const hybridObj = isAllScope
        ? (rawData.referenceCost?.hybrid?.hybrid)
        : (rawData.referenceCost?.currentMonthHybrid?.hybrid);

      let inputCostUSD = Number(refSummary.inputCostUSD || 0);
      let cacheCostUSD = Number(refSummary.cacheCostUSD || 0);
      let outputCostUSD = Number(refSummary.outputCostUSD || 0);
      let heroUsd = Number(refSummary.totalCostUSD || 0);

      if (ANTIGRAVITY_TOKEN_DATA.costMode === 'identified') {
        heroUsd = identCost;
        const cat = identSourceEstimate?.byCategory || {};
        const catSum = (cat.inputTokens || 0) + (cat.cacheTokens || 0) + (cat.outputTokens || 0);
        inputCostUSD = catSum > 0 ? (heroUsd * ((cat.inputTokens || 0) / catSum)) : 0;
        cacheCostUSD = catSum > 0 ? (heroUsd * ((cat.cacheTokens || 0) / catSum)) : 0;
        outputCostUSD = catSum > 0 ? (heroUsd * ((cat.outputTokens || 0) / catSum)) : 0;
      } else if (ANTIGRAVITY_TOKEN_DATA.costMode === 'hybrid') {
        if (activeSource === 'all' && hybridObj && Number.isFinite(hybridObj.combinedTotalUSD)) {
          heroUsd = Number(hybridObj.combinedTotalUSD || 0);
        } else if (identCount > 0) {
          heroUsd = Math.max(heroUsd, identCost);
        }
      }

      if (heroEl) heroEl.textContent = t('cost.approx', { val: heroUsd.toFixed(2) });

      if (subSpendEl) {
        if (ps.isZeroExtraCost || ps.actualPricePaid === 0) {
          subSpendEl.textContent = `${t('cost.subSpendLabel')}: ${ps.currencySymbol || '$'}0 (${t('cost.freePromo')})`;
          if (quickEditBtn) quickEditBtn.style.display = 'none';
        } else if (ps.actualPricePaid !== null && ps.actualPricePaid !== undefined && ps.actualPricePaid !== '') {
          const sym = ps.currencySymbol || '$';
          subSpendEl.textContent = `${t('cost.subSpendLabel')}: ${sym}${ps.actualPricePaid} (${localizeBillingCycleLabel(ps.billingCycle)})`;
          if (quickEditBtn) quickEditBtn.style.display = 'none';
        } else {
          subSpendEl.textContent = t('cost.subUnknown');
          if (quickEditBtn) quickEditBtn.style.display = '';
        }
      }

      const cIn = el('cost-card-input');
      const cInTok = el('cost-card-input-tok');
      const cCa = el('cost-card-cache');
      const cCaTok = el('cost-card-cache-tok');
      const cOut = el('cost-card-output');
      const cOutTok = el('cost-card-output-tok');
      if (cIn) cIn.textContent = `$${inputCostUSD.toFixed(2)}`;
      if (cInTok) cInTok.textContent = `${formatTokensK(inTok)} tok`;
      if (cCa) cCa.textContent = `$${cacheCostUSD.toFixed(2)}`;
      if (cCaTok) cCaTok.textContent = t('cost.tokCacheDiscount', { tok: formatTokensK(cacheTok) });
      if (cOut) cOut.textContent = `$${outputCostUSD.toFixed(2)}`;
      if (cOutTok) cOutTok.textContent = `${formatTokensK(outTok)} tok`;

      const covEl = el('cost-coverage-note');
      if (covEl) {
        if (ANTIGRAVITY_TOKEN_DATA.costMode === 'identified') {
          covEl.textContent = identCount > 0
            ? t('cost.identSub', { n: identCount })
            : t('cost.identSubNone');
        } else if (ANTIGRAVITY_TOKEN_DATA.costMode === 'hybrid') {
          covEl.textContent = t('cost.hybridSub', {
            known: identCost.toFixed(2),
            res: Math.max(0, heroUsd - identCost).toFixed(2)
          });
        } else {
          const tier = refSummary.matchedTier || {};
          covEl.textContent = t('cost.refSub', {
            model: refSummary.modelDisplayName || 'gemini-3.8-flash',
            in: tier.inputPerMillion ?? 0.30,
            ca: tier.cacheReadPerMillion ?? 0.03,
            out: tier.outputPerMillion ?? 2.50
          });
        }
      }

      const summaryLine = el('cost-usage-summary-line');
      if (summaryLine) {
        summaryLine.textContent = t('cost.usageSummary', {
          total: formatTokensK(inTok + cacheTok + outTok),
          cache: formatTokensK(cacheTok)
        });
      }

      const diffBox = el('cost-diff-box');
      if (diffBox) {
        if (isAllScope) {
          diffBox.textContent = t('cost.diffAll');
        } else if (ps.isZeroExtraCost || ps.actualPricePaid === 0) {
          diffBox.textContent = t('cost.diffFree', { val: heroUsd.toFixed(2) });
        } else if (ps.actualPricePaid !== null && ps.actualPricePaid !== undefined && ps.actualPricePaid !== '' && (ps.currency === 'USD' || !ps.currency)) {
          const diff = heroUsd - Number(ps.actualPricePaid);
          diffBox.textContent = t('cost.diffPaid', { sign: diff >= 0 ? '+' : '-', val: Math.abs(diff).toFixed(2) });
        } else {
          diffBox.textContent = t('cost.diffUnknown');
        }
      }

      const subLine = el('cost-sub-spend-line');
      if (subLine) {
        if (ps.isZeroExtraCost || ps.actualPricePaid === 0) {
          subLine.textContent = t('cost.subLineFree', { sym: ps.currencySymbol || '$', src: localizeAcquisitionSource(ps.acquisitionSourceName || ps.acquisitionSource) });
        } else if (ps.actualPricePaid !== null && ps.actualPricePaid !== undefined && ps.actualPricePaid !== '') {
          const sym = ps.currencySymbol || '$';
          subLine.textContent = t('cost.subLinePaid', {
            sym,
            val: ps.actualPricePaid,
            cny: '',
            cycle: localizeBillingCycleLabel(ps.billingCycle),
            exp: ''
          });
        } else {
          subLine.textContent = '';
        }
      }

      const bdEl = el('cost-model-breakdown');
      if (bdEl) {
        const entries = Object.entries(identSourceEstimate?.byModel || {});
        if (!entries.length) {
          bdEl.textContent = t('cost.breakdownNone');
        } else {
          const details = entries.slice(0, 6).map(([m, info]) => `${m}: $${Number(info?.costUSD || 0).toFixed(2)}`).join(' · ');
          bdEl.textContent = t('cost.breakdownPrefix', { details, note: '' });
        }
      }
    }

    function applyTokenHistoryPayload(payload) {
      if (!payload || typeof payload !== 'object') return;
      const normalizedPayload = core?.normalizeTokenHistoryPayload
        ? core.normalizeTokenHistoryPayload(payload)
        : payload;
      const prevPs = ANTIGRAVITY_TOKEN_DATA.planStatus || {};
      ANTIGRAVITY_TOKEN_DATA.raw = normalizedPayload;

      let plan = normalizedPayload.planStatus || prevPs;
      const localSnap = getStoredCustomPlanSnapshot(plan?.email || 'default');
      if (core?.resolveEffectivePlanStatus && Object.keys(localSnap).length && !normalizedPayload.customPlanSettings) {
        plan = core.resolveEffectivePlanStatus(plan, localSnap);
      } else if (core?.resolveEffectivePlanStatus && normalizedPayload.customPlanSettings) {
        plan = core.resolveEffectivePlanStatus(plan, normalizedPayload.customPlanSettings);
      }
      ANTIGRAVITY_TOKEN_DATA.planStatus = plan;

      updateBadgeTokensText(normalizedPayload);
      renderTokenCards(normalizedPayload);
      renderPlanDetail(plan);
      renderActiveCostEstimateView();
      renderHeatmapGrid(normalizedPayload);
    }

    async function syncTokenHistoryFromHost(force = false) {
      if (state.disposed) return;
      const now = Date.now();
      if (!force && now - state.lastBridgeSyncAt < 3000) return;
      state.lastBridgeSyncAt = now;

      const cachedUserStatus = hub?.getUserStatus?.() ?? undefined;
      const res = await callBridge('/token-history', { force, cachedUserStatus });
      if (res && res.ok && res.data) {
        applyTokenHistoryPayload(res.data);
      }
    }

    async function recordModelCallsRemote(calls) {
      if (!Array.isArray(calls) || !calls.length || state.disposed) return;
      const res = await callBridge('/record-calls', { calls });
      if (res && res.ok && res.changed) {
        await syncTokenHistoryFromHost(true);
      }
    }

    function switchTokenSource(src) {
      const valid = new Set(['all', 'desktop', 'cli']);
      const next = valid.has(src) ? src : 'all';
      ANTIGRAVITY_TOKEN_DATA.activeSource = next;
      heatmapRangeOffset = 0;
      for (const s of valid) {
        el(`src-tab-${s}`)?.classList?.toggle?.('active', s === next);
      }
      updateBadgeTokensText();
      renderTokenCards();
      renderActiveCostEstimateView();
      renderHeatmapGrid();
    }

    function switchTokenView(view) {
      const next = view === 'cost' ? 'cost' : 'tokens';
      ANTIGRAVITY_TOKEN_DATA.tokenView = next;
      el('tok-view-tokens')?.classList?.toggle?.('active', next === 'tokens');
      el('tok-view-cost')?.classList?.toggle?.('active', next === 'cost');
      const panel = el('panel-tokens');
      const mainView = el('tokens-main-view');
      const costCard = el('cost-estimate-card');
      if (next === 'cost') {
        addClass(panel, 'cost-compact-view');
        if (mainView) mainView.style.display = 'none';
        if (costCard) {
          costCard.style.display = '';
          toggleCostDetails(true);
        }
      } else {
        removeClass(panel, 'cost-compact-view');
        if (mainView) mainView.style.display = '';
        if (costCard) costCard.style.display = '';
      }
      renderActiveCostEstimateView();
      positionFloatingPanels();
    }

    function toggleCostDetails(forceExpand) {
      const body = el('cost-details-body');
      const btn = el('btn-toggle-cost-details');
      const next = typeof forceExpand === 'boolean' ? forceExpand : !ANTIGRAVITY_TOKEN_DATA.costDetailsExpanded;
      ANTIGRAVITY_TOKEN_DATA.costDetailsExpanded = next;
      if (body) body.style.display = next ? 'flex' : 'none';
      if (btn) btn.textContent = next ? t('cost.btnCollapse') : t('cost.btnExpand');
      positionFloatingPanels();
    }

    function updateSegmentedLanguageButtons() {
      const langs = ['zh-CN', 'zh-TW', 'en'];
      for (const l of langs) {
        const btn = el(`btn-top-lang-${l}`);
        btn?.classList?.toggle?.('is-active', currentPanelLanguage === l);
      }
    }

    function applyPanelLanguage(lang, opts = {}) {
      const normalized = normalizePanelLanguage(lang);
      currentPanelLanguage = normalized;
      try {
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem('ag_panel_language', normalized);
          localStorage.setItem('__agy_ctx_lang__', normalized === 'en' ? 'en' : 'zh');
          localStorage.setItem('__ag_usage_lang__', normalized);
        }
      } catch {}

      applyStaticPanelTranslations();
      updateSegmentedLanguageButtons();
      syncCurrencyCountrySelectOptions();
      updateBadgeTokensText();
      renderTokenCards();
      renderPlanDetail(ANTIGRAVITY_TOKEN_DATA.planStatus);
      renderActiveCostEstimateView();
      renderHeatmapGrid();
      applyTheme();
      toggleTokenColorsDrawer(state.colorsDrawerExpanded);
      const costToggleBtn = el('btn-toggle-cost-details');
      if (costToggleBtn) {
        costToggleBtn.textContent = ANTIGRAVITY_TOKEN_DATA.costDetailsExpanded ? t('cost.btnCollapse') : t('cost.btnExpand');
      }
      const planToggleBtn = el('btn-toggle-plan-detail');
      if (planToggleBtn) {
        planToggleBtn.textContent = planDetailExpanded ? t('plan.detail.toggleClose') : t('plan.detail.toggleOpen');
      }

      if (!opts.fromHub && hub?.setLanguage && hub.getLanguage?.() !== normalized) {
        hub.setLanguage(normalized, { persist: true });
      }
      if (!opts.skipPersist) {
        void saveSettingsPayloadBridge({ panelLanguage: normalized });
      }
    }

    async function restoreSettingsFromHost() {
      const res = await callBridge('/get-settings', {});
      if (!res || !res.ok || !res.settings) return;
      const st = res.settings;
      if (st.panelLanguage) {
        applyPanelLanguage(st.panelLanguage, { skipPersist: true });
      }
      if (st.savedHeatView) {
        switchHeatView(st.savedHeatView, true);
      }
      if (st.customPlan && typeof st.customPlan === 'object') {
        applyCustomPlanObjectLocally(st.customPlan, st.customPlan.email || 'default');
      }
    }

    function positionFloatingPanels() {
      const panel = el('panel-tokens');
      if (!panel || panel.hidden) return;
      try {
        const vw = (win && win.innerWidth) || 1280;
        const vh = (win && win.innerHeight) || 800;
        const badge = el('badge-tokens');
        const br = badge?.getBoundingClientRect?.();
        const pw = Math.min(hasClass(panel, 'cost-compact-view') ? 560 : 660, vw - 24);
        let top = br && (br.width > 0 || br.height > 0) ? Math.round(br.bottom + 8) : 44;
        let left = br && (br.width > 0 || br.height > 0) ? Math.round(br.right - pw) : Math.round(vw - pw - 12);
        left = Math.max(12, Math.min(vw - pw - 12, left));
        top = Math.max(36, Math.min(vh - 180, top));
        panel.style.left = `${left}px`;
        panel.style.top = `${top}px`;
      } catch {}
    }

    function showPanel(open) {
      const panel = el('panel-tokens');
      const badge = el('badge-tokens');
      if (!panel) return;
      state.tokensOpen = Boolean(open);
      panel.hidden = !state.tokensOpen;
      badge?.setAttribute?.('aria-expanded', state.tokensOpen ? 'true' : 'false');
      if (state.tokensOpen) {
        positionFloatingPanels();
        void syncTokenHistoryFromHost(true);
      } else {
        closeAllDropdowns();
        closeColorPicker(true);
        hideHeatPop();
      }
    }

    function toggleTokens() {
      showPanel(!state.tokensOpen);
    }

    function findDockTarget() {
      if (!doc || typeof doc.querySelector !== 'function') return null;

      // 1. Antigravity 2.x standalone chat/workbench titlebar: dock to the left of the right button cluster
      const agTitlebar = doc.querySelector('[class*="@container/titlebar"]');
      if (agTitlebar) {
        const directChildren = Array.from(agTitlebar.children || []);
        const rightGroup = directChildren.find(ch => {
          const cls = typeof ch?.className === 'string' ? ch.className : '';
          return cls.split(/\s+/).includes('shrink-0');
        }) || agTitlebar.lastElementChild || directChildren[directChildren.length - 1] || null;

        if (rightGroup && rightGroup !== (agTitlebar.firstElementChild || directChildren[0])) {
          return { container: rightGroup, mode: 'antd-right' };
        }
        return { container: agTitlebar, mode: 'antd-tb' };
      }

      // 2. Classic VS Code workbench titlebar selectors
      const selectors = [
        '.part.titlebar .titlebar-right .actions-container',
        '.part.titlebar .titlebar-right',
        '.titlebar-right',
        'header .actions-container'
      ];
      for (const sel of selectors) {
        const found = doc.querySelector(sel);
        if (found) return { container: found, mode: 'classic' };
      }
      return null;
    }

    function computeFloatingRightOffset() {
      const vw = (win && win.innerWidth) || 1280;
      const defaultRight = 12;
      if (!doc || typeof doc.querySelectorAll !== 'function') return defaultRight;
      try {
        const anchors = doc.querySelectorAll(
          'button[aria-label="More actions"], button[aria-label="Toggle Overview Panel"], button[aria-label="Toggle Side Panel"], [data-testid="toggle-aux-sidebar"], div.absolute.right-0.z-50'
        );
        let minLeft = vw;
        let foundTopBarAnchor = false;
        for (const node of anchors) {
          const r = node?.getBoundingClientRect?.();
          if (!r || r.width <= 0 || r.height <= 0) continue;
          if (r.top < 60 && r.left > vw * 0.4 && r.left < minLeft) {
            minLeft = r.left;
            foundTopBarAnchor = true;
          }
        }
        if (foundTopBarAnchor) {
          return Math.max(defaultRight, Math.ceil(vw - minLeft + 8));
        }
      } catch {}
      return defaultRight;
    }

    function ensureHostDocked() {
      if (state.disposed) return;
      const dockTarget = findDockTarget();
      if (dockTarget && dockTarget.container) {
        const { container: dockParent, mode } = dockTarget;
        host.setAttribute('data-dock', 'flow');
        if (host.style) {
          host.style.top = '';
          host.style.right = '';
          host.style.marginRight = '6px';
        }
        if (mode === 'antd-right') {
          const firstChild = dockParent.firstElementChild || dockParent.firstChild || null;
          if (host.parentElement !== dockParent) {
            if (firstChild && typeof dockParent.insertBefore === 'function') {
              dockParent.insertBefore(host, firstChild);
            } else {
              dockParent.appendChild?.(host);
            }
          }
        } else if (host.parentElement !== dockParent) {
          const firstAction = dockParent.querySelector?.('.action-item, .window-controls-container');
          if (firstAction && typeof dockParent.insertBefore === 'function') {
            dockParent.insertBefore(host, firstAction);
          } else {
            dockParent.appendChild?.(host);
          }
        }
      } else if (doc.body) {
        host.setAttribute('data-dock', 'floating');
        if (host.parentElement !== doc.body) {
          doc.body.appendChild?.(host);
        }
        if (host.style) {
          host.style.top = '6px';
          host.style.right = `${computeFloatingRightOffset()}px`;
          host.style.marginRight = '';
        }
      }
    }

    function bindPanelEvents() {
      el('badge-tokens')?.addEventListener('click', e => {
        e?.stopPropagation?.();
        toggleTokens();
      });
      el('btn-close-tokens')?.addEventListener('click', () => showPanel(false));

      el('btn-theme-tokens')?.addEventListener('click', () => cycleTheme());
      el('btn-token-colors-top')?.addEventListener('click', () => {
        if (!state.tokensOpen) {
          showPanel(true);
          toggleTokenColorsDrawer(true);
        } else {
          toggleTokenColorsDrawer();
        }
        if (state.colorsDrawerExpanded) {
          el('token-color-drawer')?.scrollIntoView?.({ behavior: 'smooth', block: 'nearest' });
        }
      });
      el('btn-toggle-token-colors')?.addEventListener('click', () => toggleTokenColorsDrawer());

      ['zh-CN', 'zh-TW', 'en'].forEach(l => {
        el(`btn-top-lang-${l}`)?.addEventListener('click', e => {
          e?.stopPropagation?.();
          applyPanelLanguage(l);
        });
      });

      ['all', 'desktop', 'cli'].forEach(s => {
        el(`src-tab-${s}`)?.addEventListener('click', () => switchTokenSource(s));
      });
      ['tokens', 'cost'].forEach(v => {
        el(`tok-view-${v}`)?.addEventListener('click', () => switchTokenView(v));
      });

      el('btn-toggle-plan-detail')?.addEventListener('click', () => setPlanDetailExpanded(!planDetailExpanded));
      el('plan-summary-price-badge')?.addEventListener('click', () => setPlanDetailExpanded(!planDetailExpanded));
      el('btn-toggle-cost-details')?.addEventListener('click', () => toggleCostDetails());

      el('cost-scope-period')?.addEventListener('click', () => {
        ANTIGRAVITY_TOKEN_DATA.costScope = 'period';
        el('cost-scope-period')?.classList?.add?.('active');
        el('cost-scope-all')?.classList?.remove?.('active');
        renderActiveCostEstimateView();
      });
      el('cost-scope-all')?.addEventListener('click', () => {
        ANTIGRAVITY_TOKEN_DATA.costScope = 'all';
        el('cost-scope-all')?.classList?.add?.('active');
        el('cost-scope-period')?.classList?.remove?.('active');
        renderActiveCostEstimateView();
      });

      ['ref', 'hybrid', 'identified'].forEach(m => {
        el(`cost-mode-${m}`)?.addEventListener('click', () => {
          ANTIGRAVITY_TOKEN_DATA.costMode = m;
          ['ref', 'hybrid', 'identified'].forEach(x => {
            el(`cost-mode-${x}`)?.classList?.toggle?.('active', x === m);
          });
          renderActiveCostEstimateView();
        });
      });

      el('btn-heat-prev')?.addEventListener('click', () => shiftHeatRange(-1));
      el('btn-heat-next')?.addEventListener('click', () => shiftHeatRange(1));
      ['daily', 'weekly', 'monthly', 'yearly', 'cum'].forEach(v => {
        el(`heat-tab-${v}`)?.addEventListener('click', () => switchHeatView(v));
      });

      if (doc && doc.addEventListener) {
        const onDocClickClose = e => {
          try {
            const path = typeof e?.composedPath === 'function' ? e.composedPath() : [];
            const insideSuite = path.includes(host) || (host.contains && host.contains(e?.target));
            if (!insideSuite) {
              if (!el('color-picker-popover')?.hidden) closeColorPicker();
              if (state.tokensOpen) showPanel(false);
            }
          } catch {}
        };
        const onKeyDown = e => {
          if (e?.key === 'Escape') {
            if (!el('color-picker-popover')?.hidden) closeColorPicker();
            else if (state.tokensOpen) showPanel(false);
          }
        };
        doc.addEventListener('click', onDocClickClose);
        doc.addEventListener('keydown', onKeyDown);
        registerCleanup(() => {
          doc.removeEventListener('click', onDocClickClose);
          doc.removeEventListener('keydown', onKeyDown);
        });
      }

      if (win && win.addEventListener) {
        const onResize = () => {
          ensureHostDocked();
          positionFloatingPanels();
          positionColorPickerPopover();
        };
        win.addEventListener('resize', onResize);
        registerCleanup(() => win.removeEventListener('resize', onResize));
      }
    }

    function start() {
      if (state.started || state.disposed) return controller;
      state.started = true;

      initColorBindings();
      initDropdownAndPlanBindings();
      bindPanelEvents();
      ensureHostDocked();

      const initialLang = hub?.getLanguage?.() || 'zh-CN';
      applyPanelLanguage(initialLang, { fromHub: true, skipPersist: true });

      if (hub) {
        if (typeof hub.subscribeFinalizedCalls === 'function') {
          state.unsubs.push(hub.subscribeFinalizedCalls(calls => {
            void recordModelCallsRemote(calls);
          }));
        }
        if (typeof hub.subscribeLanguage === 'function') {
          state.unsubs.push(hub.subscribeLanguage(lang => {
            applyPanelLanguage(lang, { fromHub: true, skipPersist: true });
          }));
        }
        if (typeof hub.subscribeUserStatus === 'function') {
          state.unsubs.push(hub.subscribeUserStatus(rawStatus => {
            if (rawStatus && core?.parseUserPlanStatus) {
              const parsedPlan = core.parseUserPlanStatus(rawStatus);
              const snap = getStoredCustomPlanSnapshot(parsedPlan?.email || 'default');
              const effective = core.resolveEffectivePlanStatus ? core.resolveEffectivePlanStatus(parsedPlan, snap) : parsedPlan;
              ANTIGRAVITY_TOKEN_DATA.planStatus = effective;
              renderPlanDetail(effective);
              renderActiveCostEstimateView();
            }
          }));
        }
      }

      try {
        const tb = doc.querySelector?.('[class*="@container/titlebar"]') || doc.querySelector?.('.part.titlebar');
        if (tb && typeof MutationObserver === 'function') {
          state.titlebarObserver = new MutationObserver(() => ensureHostDocked());
          state.titlebarObserver.observe(tb, { childList: true, subtree: true });
        } else if (doc.body && typeof MutationObserver === 'function') {
          state.titlebarObserver = new MutationObserver(() => ensureHostDocked());
          state.titlebarObserver.observe(doc.body, { childList: true, subtree: true });
        }
        if (win && typeof ResizeObserver === 'function' && doc.body) {
          state.resizeObserver = new ResizeObserver(() => {
            ensureHostDocked();
            positionFloatingPanels();
          });
          state.resizeObserver.observe(doc.body);
        }
      } catch {}

      if (options.autoSync !== false) {
        void restoreSettingsFromHost();
        void syncTokenHistoryFromHost(true);
        state.historyTimer = setInterval(() => {
          void syncTokenHistoryFromHost(false);
        }, 60000);
      }

      return controller;
    }

    function dispose() {
      if (state.disposed) return;
      state.disposed = true;
      if (state.historyTimer) { clearInterval(state.historyTimer); state.historyTimer = null; }
      if (saveFeedbackTimer) { clearTimeout(saveFeedbackTimer); saveFeedbackTimer = null; }
      if (state.titlebarObserver) { state.titlebarObserver.disconnect(); state.titlebarObserver = null; }
      if (state.resizeObserver) { state.resizeObserver.disconnect(); state.resizeObserver = null; }
      for (const unsub of state.unsubs) {
        try { unsub(); } catch {}
      }
      state.unsubs = [];
      for (const fn of cleanupCallbacks) {
        try { fn(); } catch {}
      }
      cleanupCallbacks.length = 0;
      try { host.remove?.(); } catch {}
    }

    const controller = {
      version: SUITE_VERSION,
      host,
      shadow,
      start,
      dispose,
      showPanel,
      toggleTokens,
      switchTokenSource,
      switchTokenView,
      switchHeatView,
      applyPanelLanguage,
      applyTokenHistoryPayload,
      syncTokenHistoryFromHost,
      recordModelCallsRemote,
      getLanguage: () => currentPanelLanguage,
      isDisposed: () => state.disposed,
      el
    };

    return controller;
  }

  const exported = {
    SUITE_VERSION,
    mountUsagePanel
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = exported;
  } else {
    root.__AGUsagePanelModule = exported;
  }
})(globalThis);
