(function (root) {
  'use strict';

  const CAPSULE_VERSION = '2.0.0';
  const RING_RADIUS = 6.5;
  const RING_CIRCUMFERENCE = Number((2 * Math.PI * RING_RADIUS).toFixed(2));
  const MORANDI_3A = {
    green: '#5E9E8E',
    yellow: '#C6A265',
    red: '#C26C77'
  };
  const SCHEME1_CTX_COLORS = {
    green: '#4ea84e',
    amber: '#d4940a',
    red: '#e06c75'
  };
  const SCHEME1_QUOTA_COLORS = {
    green: '#4ea84e',
    amber: '#f59e0b',
    red: '#ef4444'
  };
  const SEGMENT_COLORS = {
    cache: '#10b981',
    input: '#38bdf8',
    output: '#f59e0b'
  };

  const CAPSULE_I18N = {
    'zh-CN': {
      used: '已用',
      contextUsed: '当前上下文占用',
      remaining: '剩余可用容量',
      remainShort: '剩余',
      compactionLimit: '自动压缩阈值',
      genSpeed: '输出生成速度',
      avg: '均值',
      cacheHit: 'Prompt 缓存命中率',
      cache: '缓存',
      input: '新入',
      output: '输出',
      estDelta: '实时估算增量',
      compressed: '已触发自动压缩',
      warnHigh: '接近自动压缩阈值，建议适时归档上下文',
      quota5h: '5小时额度',
      quotaWeekly: '每周额度',
      steps: '步数',
      switchHint: '点击切换: English',
      resetsSoon: '即将重置',
      resetsLt1m: '<1m 后重置',
      resetsIn: '{dur} 后重置'
    },
    'zh-TW': {
      used: '已用',
      contextUsed: '目前上下文佔用',
      remaining: '剩餘可用容量',
      remainShort: '剩餘',
      compactionLimit: '自動壓縮閾值',
      genSpeed: '輸出生成速度',
      avg: '均值',
      cacheHit: 'Prompt 快取命中率',
      cache: '快取',
      input: '新入',
      output: '輸出',
      estDelta: '即時估算增量',
      compressed: '已觸發自動壓縮',
      warnHigh: '接近自動壓縮閾值，建議適時歸檔上下文',
      quota5h: '5小時額度',
      quotaWeekly: '每週額度',
      steps: '步數',
      switchHint: '點擊切換: English',
      resetsSoon: '即將重置',
      resetsLt1m: '<1m 後重置',
      resetsIn: '{dur} 後重置'
    },
    en: {
      used: 'used',
      contextUsed: 'Context Used',
      remaining: 'Remaining Capacity',
      remainShort: 'Remain',
      compactionLimit: 'Compaction Limit',
      genSpeed: 'Generation Speed',
      avg: 'avg',
      cacheHit: 'Prompt Cache Hit',
      cache: 'Cache',
      input: 'Input',
      output: 'Output',
      estDelta: 'Estimated Delta',
      compressed: 'Auto-compressed',
      warnHigh: 'Approaching auto-compaction threshold',
      quota5h: '5-Hour',
      quotaWeekly: 'Weekly',
      steps: 'Steps',
      switchHint: 'Click to switch: 中文',
      resetsSoon: 'Resets soon',
      resetsLt1m: 'Resets in <1m',
      resetsIn: 'Resets in {dur}'
    }
  };

  function normalizeCapsuleLang(raw) {
    if (!raw || typeof raw !== 'string') return 'zh-CN';
    const s = raw.trim();
    const low = s.toLowerCase();
    if (low === 'en' || low.startsWith('en-')) return 'en';
    if (low === 'zh-tw' || low === 'zh-hant' || low === 'tw' || low === 'zh-hk') return 'zh-TW';
    return 'zh-CN';
  }

  function getCapsuleText(lang, key, params) {
    const norm = normalizeCapsuleLang(lang);
    const dict = CAPSULE_I18N[norm] || CAPSULE_I18N['zh-CN'];
    let text = dict[key] !== undefined ? dict[key] : (CAPSULE_I18N['zh-CN'][key] || '');
    if (params) {
      for (const [k, v] of Object.entries(params)) {
        text = text.replace(`{${k}}`, String(v));
      }
    }
    return text;
  }

  function getMorandi3AColor(usagePercent) {
    if (usagePercent >= 80) return MORANDI_3A.red;
    if (usagePercent >= 50) return MORANDI_3A.yellow;
    return MORANDI_3A.green;
  }

  function getContextRingColor(usagePercent) {
    if (usagePercent >= 80) return SCHEME1_CTX_COLORS.red;
    if (usagePercent >= 50) return SCHEME1_CTX_COLORS.amber;
    return SCHEME1_CTX_COLORS.green;
  }

  function getQuotaRingColor(remainingFraction) {
    const pct = Math.max(0, Math.min(100, Math.round((Number(remainingFraction) || 0) * 100)));
    if (pct <= 10) return SCHEME1_QUOTA_COLORS.red;
    if (pct <= 25) return SCHEME1_QUOTA_COLORS.amber;
    return SCHEME1_QUOTA_COLORS.green;
  }

  function getQuotaHudBarColor(remainingFraction) {
    const pct = Math.max(0, Math.min(100, Math.round((Number(remainingFraction) || 0) * 100)));
    if (pct <= 10) return '#ef4444';
    if (pct <= 25) return '#f59e0b';
    return '#64748b';
  }

  function formatResetText(resetTimeMs, lang, parseResetFn) {
    const ms = typeof resetTimeMs === 'number' ? resetTimeMs : (parseResetFn ? parseResetFn(resetTimeMs) : 0);
    if (!ms || ms <= 0) return '';
    const diffMs = ms - Date.now();
    if (!Number.isFinite(diffMs) || diffMs <= 0) {
      if (diffMs > -120000) return getCapsuleText(lang, 'resetsSoon');
      return '';
    }
    const totalMins = Math.floor(diffMs / 60000);
    if (totalMins <= 0) return getCapsuleText(lang, 'resetsLt1m');
    const days = Math.floor(totalMins / (24 * 60));
    const hours = Math.floor((totalMins % (24 * 60)) / 60);
    const mins = totalMins % 60;
    let dur = '';
    if (days > 0) dur = hours > 0 ? `${days}d ${hours}h` : `${days}d`;
    else if (hours > 0) dur = mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
    else dur = `${mins}m`;
    return getCapsuleText(lang, 'resetsIn', { dur });
  }

  function isLightMode(refEl, doc, win) {
    const html = doc.documentElement;
    const body = doc.body;
    const hasClass = (el, cls) => Boolean(el && el.classList && el.classList.contains(cls));
    if (
      hasClass(html, 'light') || hasClass(body, 'light') ||
      hasClass(html, 'theme-light') || hasClass(body, 'theme-light') ||
      hasClass(html, 'light-theme') || hasClass(body, 'light-theme') ||
      hasClass(body, 'vscode-light') || hasClass(body, 'vs-light')
    ) return true;
    if (
      hasClass(html, 'dark') || hasClass(body, 'dark') ||
      hasClass(html, 'theme-dark') || hasClass(body, 'theme-dark') ||
      hasClass(html, 'dark-theme') || hasClass(body, 'dark-theme') ||
      hasClass(body, 'vscode-dark') || hasClass(body, 'vs-dark')
    ) return false;
    const themeAttr = ((html && html.getAttribute('data-theme')) || (body && body.getAttribute('data-theme')) || '').toLowerCase();
    if (themeAttr.includes('light')) return true;
    if (themeAttr.includes('dark')) return false;

    const getStyle = win && win.getComputedStyle ? win.getComputedStyle.bind(win) : null;
    if (getStyle) {
      let cur = refEl || body || html;
      let depth = 0;
      while (cur && depth < 10) {
        depth++;
        try {
          const bg = getStyle(cur).backgroundColor;
          const m = bg && bg.match(/\d+(\.\d+)?/g);
          if (m && m.length >= 3) {
            const alpha = m.length >= 4 ? Number(m[3]) : 1;
            if (alpha > 0.15) {
              const lum = (0.299 * Number(m[0]) + 0.587 * Number(m[1]) + 0.114 * Number(m[2])) / 255;
              return lum > 0.55;
            }
          }
        } catch {}
        cur = cur.parentElement;
      }
      try {
        const cs = (html && getStyle(html).colorScheme) || '';
        if (cs.includes('light')) return true;
      } catch {}
    }
    return false;
  }

  /**
   * Mount the Scheme 1 Context + Quota Capsule strip and Scheme 5 Quota HUD popover onto .agy-composer-footer.
   */
  function createCapsuleController(options = {}) {
    const hub = options.hub;
    if (!hub) throw new Error('TelemetryHub is required for Capsule UI');
    const win = options.window || (typeof window !== 'undefined' ? window : null);
    const doc = options.document || (typeof document !== 'undefined' ? document : null);
    const telMod = options.telemetryModule || root.__AGUnifiedTelemetryModule || {};
    const formatTokenValue = telMod.formatTokenValue || (v => String(Math.round(Number(v) || 0)));
    const parseResetTimeMs = telMod.parseResetTimeMs || (() => 0);

    let activeTooltipTarget = null;
    let activeQuotaTarget = null;
    let tooltipEl = null;
    let quotaTooltipEl = null;
    let styleEl = null;
    let mutationTimer = null;
    let domObserver = null;
    let unsubSession = null;
    let unsubLang = null;
    let disposed = false;

    function ensureStyles() {
      if (!doc || !doc.head) return;
      if (styleEl && doc.head.contains(styleEl)) return;
      const existing = doc.getElementById ? doc.getElementById('__agy_capsule_styles__') : null;
      if (existing) {
        styleEl = existing;
        return;
      }
      styleEl = doc.createElement('style');
      styleEl.id = '__agy_capsule_styles__';
      styleEl.textContent = [
        '@keyframes agy-ctx-dot-pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.42;transform:scale(.82)}}',
        '.agy-ctx-speed-dot{animation:agy-ctx-dot-pulse 1.6s ease-in-out infinite;}'
      ].join('');
      doc.head.appendChild(styleEl);
    }

    function resolveLanguage() {
      const rawLang = (typeof hub.getLanguage === 'function' ? hub.getLanguage() : null) ||
        (typeof hub.getShortLanguage === 'function' && hub.getShortLanguage() === 'en' ? 'en' : 'zh-CN');
      return normalizeCapsuleLang(rawLang);
    }

    function positionPopover(el, anchorBtn) {
      if (!anchorBtn || !el || !anchorBtn.getBoundingClientRect || !el.getBoundingClientRect || !win) return;
      const rect = anchorBtn.getBoundingClientRect();
      const elRect = el.getBoundingClientRect();
      let left = rect.left + rect.width / 2 - elRect.width / 2;
      left = Math.max(8, Math.min((win.innerWidth || 1200) - elRect.width - 8, left));
      let top = rect.top - elRect.height - 8;
      if (top < 8) top = rect.bottom + 8;
      el.style.left = Math.round(left) + 'px';
      el.style.top = Math.round(top) + 'px';
    }

    function ensureTooltipEl() {
      if (!doc) return null;
      if (tooltipEl && doc.body && doc.body.contains(tooltipEl)) return tooltipEl;
      tooltipEl = doc.createElement('div');
      tooltipEl.id = '__agy_ctx_capsule_tooltip__';
      tooltipEl.className = 'notranslate';
      tooltipEl.setAttribute('translate', 'no');
      tooltipEl.style.cssText = [
        'position: fixed',
        'z-index: 999999',
        'pointer-events: none',
        'opacity: 0',
        'transform: translateY(3px)',
        'transition: opacity 0.14s ease, transform 0.14s ease',
        'padding: 11px 13px',
        'border-radius: 10px',
        'box-sizing: border-box',
        'font-family: var(--font-sans, inherit)',
        'font-size: 12px',
        'font-weight: 400',
        'line-height: 1.45',
        'font-variant-numeric: tabular-nums',
        'min-width: 268px',
        'max-width: 308px',
        'backdrop-filter: blur(22px)',
        '-webkit-backdrop-filter: blur(22px)'
      ].join(';');
      tooltipEl.style.opacity = '0';
      if (doc.body) doc.body.appendChild(tooltipEl);
      return tooltipEl;
    }

    function ensureQuotaTooltipEl() {
      if (!doc) return null;
      if (quotaTooltipEl && doc.body && doc.body.contains(quotaTooltipEl)) return quotaTooltipEl;
      quotaTooltipEl = doc.createElement('div');
      quotaTooltipEl.id = '__agy_quota_hud_tooltip__';
      quotaTooltipEl.className = 'notranslate';
      quotaTooltipEl.setAttribute('translate', 'no');
      quotaTooltipEl.style.cssText = [
        'position: fixed',
        'z-index: 999999',
        'pointer-events: none',
        'opacity: 0',
        'transform: translateY(3px)',
        'transition: opacity 0.14s ease, transform 0.14s ease',
        'min-width: 228px',
        'max-width: 272px',
        'padding: 9px 11px',
        'border-radius: 8px',
        'box-sizing: border-box',
        'font-family: ui-monospace, SFMono-Regular, Menlo, monospace',
        'font-size: 11px',
        'font-weight: 400',
        'line-height: 1.35',
        'font-variant-numeric: tabular-nums',
        'backdrop-filter: blur(18px)',
        '-webkit-backdrop-filter: blur(18px)'
      ].join(';');
      quotaTooltipEl.style.opacity = '0';
      if (doc.body) doc.body.appendChild(quotaTooltipEl);
      return quotaTooltipEl;
    }

    function hideTooltip() {
      activeTooltipTarget = null;
      if (tooltipEl && tooltipEl.style) {
        tooltipEl.style.opacity = '0';
        tooltipEl.style.transform = 'translateY(3px)';
      }
    }

    function hideQuotaTooltip() {
      activeQuotaTarget = null;
      if (quotaTooltipEl && quotaTooltipEl.style) {
        quotaTooltipEl.style.opacity = '0';
        quotaTooltipEl.style.transform = 'translateY(3px)';
      }
    }

    function replaceChildrenCompat(el, nodes) {
      if (typeof el.replaceChildren === 'function') {
        el.replaceChildren(...nodes);
      } else {
        while (el.firstChild) el.removeChild(el.firstChild);
        for (const n of nodes) el.appendChild(n);
      }
    }

    function updateTooltipContent(capsuleBtn) {
      const el = ensureTooltipEl();
      const data = capsuleBtn && capsuleBtn.__ctxUsageData;
      if (!el || !data) return;

      const lang = resolveLanguage();
      const tCap = (key, params) => getCapsuleText(lang, key, params);
      const light = isLightMode(capsuleBtn, doc, win);

      const bgColor = light ? 'rgba(255, 255, 255, 0.96)' : 'rgba(18, 18, 22, 0.95)';
      const fgColor = light ? '#09090B' : '#F4F5F8';
      const bodyColor = light ? '#27272A' : '#D4D5DC';
      const mutedColor = light ? '#636672' : '#8B8D98';
      const borderColor = light ? 'rgba(15, 23, 42, 0.11)' : 'rgba(255, 255, 255, 0.11)';
      const dividerColor = light ? 'rgba(15, 23, 42, 0.08)' : 'rgba(255, 255, 255, 0.08)';
      const trackColor = light ? 'rgba(15, 23, 42, 0.08)' : 'rgba(255, 255, 255, 0.08)';
      const tickColor = light ? 'rgba(15, 23, 42, 0.45)' : 'rgba(255, 255, 255, 0.60)';
      const compBg = light ? 'rgba(212, 148, 10, 0.13)' : 'rgba(212, 148, 10, 0.14)';
      const compText = light ? '#8A6830' : '#F5C97B';
      const warnBg = light ? 'rgba(224, 108, 117, 0.12)' : 'rgba(224, 108, 117, 0.15)';
      const warnText = light ? '#9E3843' : '#F2939B';

      el.style.backgroundColor = bgColor;
      el.style.color = fgColor;
      el.style.border = `1px solid ${borderColor}`;
      el.style.boxShadow = light
        ? '0 12px 30px rgba(15, 23, 42, 0.14), 0 0 0 1px rgba(15, 23, 42, 0.05)'
        : '0 14px 36px rgba(0, 0, 0, 0.56), 0 0 0 1px rgba(255, 255, 255, 0.04)';

      const usagePct = Math.max(0, Number(data.usagePercent) || 0);
      const remainPct = Math.max(0, Number(data.remainPercent) || 0);
      const contextUsed = Math.max(0, Number(data.contextUsed) || 0);
      const contextLimit = Math.max(0, Number(data.contextLimit) || 0);
      const cacheHitRate = Math.max(0, Number(data.cacheHitRate) || 0);
      const cacheReadTokens = Math.max(0, Number(data.cacheReadTokens) || 0);
      const inputTokens = Math.max(0, Number(data.inputTokens) || 0);
      const cacheCreationTokens = Math.max(0, Number(data.cacheCreationTokens) || 0);
      const outputTokens = Math.max(0, Number(data.outputTokens) || 0);
      const ringColor = getContextRingColor(usagePct);
      const modelTitle = hub.resolveModelDisplayName(data.modelId, data.modelDisplayName);
      const compactionLimit = Number(data.clientCompactionLimit ?? data.runtimeBudget);
      const hasCompactionLimit = Number.isFinite(compactionLimit) && compactionLimit > 0 && compactionLimit < contextLimit;

      const nodes = [];
      const createDivider = () => {
        const div = doc.createElement('div');
        div.style.cssText = `border-top:1px solid ${dividerColor};margin:8px 0;`;
        return div;
      };
      const createMetricRow = (labelText, valueText, opts = {}) => {
        const row = doc.createElement('div');
        const fontPart = opts.fontSize ? `font-size:${opts.fontSize};` : '';
        row.style.cssText = `display:flex;align-items:baseline;justify-content:space-between;gap:12px;padding:1.5px 0;${fontPart}`;
        const left = doc.createElement('span');
        left.style.cssText = `color:${mutedColor};font-weight:400;`;
        left.textContent = labelText;
        const right = doc.createElement('span');
        right.style.cssText = `color:${opts.valueColor || bodyColor};font-weight:${opts.valueWeight || 400};`;
        right.textContent = valueText;
        row.appendChild(left);
        row.appendChild(right);
        return row;
      };

      // 1. Cache Hit header row (when hasPreciseSnapshot)
      if (data.hasPreciseSnapshot) {
        const cacheSection = doc.createElement('div');
        cacheSection.className = 'agy-ctx-cache-row';
        cacheSection.style.cssText = 'margin-bottom:8px;';

        const cacheTop = doc.createElement('div');
        cacheTop.style.cssText = 'display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:4px;font-size:11px;';
        const cacheLeft = doc.createElement('span');
        cacheLeft.style.cssText = `display:inline-flex;align-items:center;gap:5px;color:${mutedColor};`;
        const cacheDot = doc.createElement('span');
        const cacheDotColor = cacheHitRate >= 50 ? SEGMENT_COLORS.cache : (cacheHitRate >= 20 ? SEGMENT_COLORS.output : mutedColor);
        cacheDot.style.cssText = `width:6px;height:6px;border-radius:999px;background:${cacheDotColor};display:inline-block;flex-shrink:0;`;
        const cacheLbl = doc.createElement('span');
        cacheLbl.textContent = tCap('cacheHit');
        cacheLeft.appendChild(cacheDot);
        cacheLeft.appendChild(cacheLbl);

        const cacheRight = doc.createElement('span');
        cacheRight.style.cssText = `color:${fgColor};font-weight:500;`;
        cacheRight.textContent = `${cacheHitRate.toFixed(1)}% · ${formatTokenValue(cacheReadTokens)}`;

        cacheTop.appendChild(cacheLeft);
        cacheTop.appendChild(cacheRight);

        const cacheTrack = doc.createElement('div');
        cacheTrack.style.cssText = `width:100%;height:4px;border-radius:999px;background:${trackColor};overflow:hidden;`;
        const cacheFill = doc.createElement('div');
        const cacheFillPct = cacheHitRate <= 0 ? '0' : Math.min(100, Math.max(2, cacheHitRate)).toFixed(1);
        cacheFill.style.cssText = `width:${cacheFillPct}%;height:100%;border-radius:999px;background:${SEGMENT_COLORS.cache};`;
        cacheTrack.appendChild(cacheFill);

        cacheSection.appendChild(cacheTop);
        cacheSection.appendChild(cacheTrack);
        nodes.push(cacheSection);
        nodes.push(createDivider());
      }

      // 2. Model title & usage summary row
      const modelRow = doc.createElement('div');
      modelRow.style.cssText = `font-size:12.5px;font-weight:600;color:${fgColor};overflow:hidden;text-overflow:ellipsis;white-space:nowrap;margin-bottom:3px;`;
      modelRow.textContent = String(modelTitle || '');
      nodes.push(modelRow);

      const summaryRow = doc.createElement('div');
      summaryRow.style.cssText = 'display:flex;align-items:baseline;justify-content:space-between;gap:10px;margin-bottom:6px;font-size:11.5px;';
      const summaryLeft = doc.createElement('span');
      summaryLeft.style.cssText = `display:inline-flex;align-items:center;gap:5px;color:${bodyColor};font-weight:500;`;
      const statusDot = doc.createElement('span');
      statusDot.style.cssText = `display:inline-block;width:6px;height:6px;border-radius:999px;background:${ringColor};flex-shrink:0;`;
      const pctLabel = doc.createElement('span');
      pctLabel.textContent = `${usagePct.toFixed(1)}% ${tCap('used')}`;
      summaryLeft.appendChild(statusDot);
      summaryLeft.appendChild(pctLabel);

      const summaryRight = doc.createElement('span');
      summaryRight.style.cssText = `color:${fgColor};font-weight:550;`;
      summaryRight.textContent = `${contextUsed.toLocaleString()} / ${contextLimit.toLocaleString()}`;

      summaryRow.appendChild(summaryLeft);
      summaryRow.appendChild(summaryRight);
      nodes.push(summaryRow);

      // 3. Multi-segment 4px context track
      const segTrack = doc.createElement('div');
      segTrack.className = 'agy-ctx-seg-track';
      segTrack.style.cssText = `position:relative;width:100%;height:4px;border-radius:999px;background:${trackColor};overflow:hidden;display:flex;gap:1.5px;margin-bottom:9px;`;

      if (contextLimit > 0 && contextUsed > 0) {
        const segSpecs = [];
        if (data.hasPreciseSnapshot) {
          const combinedInput = inputTokens + cacheCreationTokens;
          if (cacheReadTokens > 0) segSpecs.push({ cls: 'agy-ctx-seg-cache', color: SEGMENT_COLORS.cache, tokens: cacheReadTokens });
          if (combinedInput > 0) segSpecs.push({ cls: 'agy-ctx-seg-input', color: SEGMENT_COLORS.input, tokens: combinedInput });
          if (outputTokens > 0) segSpecs.push({ cls: 'agy-ctx-seg-output', color: SEGMENT_COLORS.output, tokens: outputTokens });
        } else {
          segSpecs.push({ cls: 'agy-ctx-seg-input', color: SEGMENT_COLORS.input, tokens: contextUsed });
        }

        const totalSegTokens = segSpecs.reduce((s, item) => s + item.tokens, 0);
        const totalFillPct = Math.min(100, (contextUsed / contextLimit) * 100);
        for (const seg of segSpecs) {
          const sharePct = totalSegTokens > 0 ? (seg.tokens / totalSegTokens) * totalFillPct : 0;
          if (sharePct <= 0) continue;
          const segEl = doc.createElement('div');
          segEl.className = seg.cls;
          segEl.style.cssText = `width:${Math.max(0.8, sharePct).toFixed(2)}%;height:100%;border-radius:999px;background:${seg.color};flex-shrink:0;`;
          segTrack.appendChild(segEl);
        }
      }

      if (hasCompactionLimit) {
        const tickEl = doc.createElement('div');
        tickEl.className = 'agy-ctx-compaction-tick';
        const tickLeft = ((compactionLimit / contextLimit) * 100).toFixed(1);
        tickEl.style.cssText = `position:absolute;top:0;bottom:0;left:${tickLeft}%;width:1.5px;background:${tickColor};z-index:2;`;
        segTrack.appendChild(tickEl);
      }
      nodes.push(segTrack);

      // 4. 4-column vertical-bar breakdown grid (.agy-ctx-bd-grid)
      const bdGrid = doc.createElement('div');
      bdGrid.className = 'agy-ctx-bd-grid';
      bdGrid.style.cssText = 'display:grid;grid-template-columns:repeat(4, minmax(0, 1fr));gap:6px;margin-bottom:6px;';
      const bdCols = [
        { label: tCap('cache'), value: formatTokenValue(cacheReadTokens), accent: SEGMENT_COLORS.cache },
        { label: tCap('input'), value: formatTokenValue(inputTokens), accent: SEGMENT_COLORS.input },
        { label: tCap('output'), value: formatTokenValue(outputTokens), accent: SEGMENT_COLORS.output },
        { label: tCap('remainShort'), value: `${remainPct.toFixed(1)}%`, accent: mutedColor }
      ];
      for (const col of bdCols) {
        const cell = doc.createElement('div');
        cell.className = 'agy-ctx-bd-col';
        cell.style.cssText = `border-left:2.5px solid ${col.accent};padding-left:6px;display:flex;flex-direction:column;gap:1px;min-width:0;`;
        const lbl = doc.createElement('span');
        lbl.style.cssText = `font-size:10px;color:${mutedColor};white-space:nowrap;overflow:hidden;text-overflow:ellipsis;`;
        lbl.textContent = col.label;
        const val = doc.createElement('span');
        val.style.cssText = `font-size:11px;font-weight:550;color:${fgColor};white-space:nowrap;`;
        val.textContent = col.value;
        cell.appendChild(lbl);
        cell.appendChild(val);
        bdGrid.appendChild(cell);
      }
      nodes.push(bdGrid);

      // 5. Conditional Compaction Limit & Estimated Delta rows
      if (hasCompactionLimit) {
        nodes.push(createMetricRow(
          tCap('compactionLimit'),
          `${Math.round(compactionLimit).toLocaleString()} (${formatTokenValue(compactionLimit)})`,
          { fontSize: '11px', valueColor: bodyColor, valueWeight: 450 }
        ));
      }
      if (data.estimatedDelta > 0) {
        nodes.push(createMetricRow(
          tCap('estDelta'),
          `+${data.estimatedDelta.toLocaleString()}`,
          { fontSize: '11px', valueColor: fgColor, valueWeight: 450 }
        ));
      }

      // 6. Compression / Warning Callout
      if (data.compressionDetected && data.compressionDrop > 0) {
        const dropPct = data.compressionBefore > 0 ? ((data.compressionDrop / data.compressionBefore) * 100).toFixed(1) : '0';
        const compRow = doc.createElement('div');
        compRow.style.cssText = `margin-top:7px;padding:5px 8px;border-radius:6px;background:${compBg};display:flex;justify-content:space-between;align-items:center;gap:10px;font-size:11px;`;
        const compLeft = doc.createElement('span');
        compLeft.style.cssText = `color:${compText};font-weight:500;`;
        compLeft.textContent = tCap('compressed');
        const compRight = doc.createElement('span');
        compRight.style.cssText = `color:${fgColor};font-weight:450;`;
        compRight.textContent = `${formatTokenValue(data.compressionBefore)} → ${formatTokenValue(data.compressionAfter)} (-${dropPct}%)`;
        compRow.appendChild(compLeft);
        compRow.appendChild(compRight);
        nodes.push(compRow);
      } else if (usagePct >= 85) {
        const warnRow = doc.createElement('div');
        warnRow.style.cssText = `margin-top:7px;padding:5px 8px;border-radius:6px;background:${warnBg};color:${warnText};font-size:11px;font-weight:450;`;
        warnRow.textContent = tCap('warnHigh');
        nodes.push(warnRow);
      }

      // 7. Hairline footer
      const footerRow = doc.createElement('div');
      footerRow.style.cssText = `border-top:1px solid ${dividerColor};margin-top:8px;padding-top:6px;font-size:10.5px;color:${mutedColor};font-weight:400;display:flex;justify-content:space-between;align-items:center;gap:10px;`;
      const leftFooter = doc.createElement('span');
      const stepsPart = `${tCap('steps')}: ${Number(data.stepCount || 0).toLocaleString()}`;
      if (data.tokPerSec > 0) {
        const avgSpd = data.avgTokPerSec || data.tokPerSec;
        leftFooter.textContent = `${data.tokPerSec} tok/s (${tCap('avg')} ${avgSpd}) · ${stepsPart}`;
      } else {
        leftFooter.textContent = stepsPart;
      }
      const hintSpan = doc.createElement('span');
      hintSpan.style.cssText = 'white-space:nowrap;';
      hintSpan.textContent = tCap('switchHint');
      footerRow.appendChild(leftFooter);
      footerRow.appendChild(hintSpan);
      nodes.push(footerRow);

      replaceChildrenCompat(el, nodes);
      positionPopover(el, capsuleBtn);
      el.style.opacity = '1';
      el.style.transform = 'translateY(0)';
    }

    function updateQuotaTooltipContent(quotaBtn) {
      const el = ensureQuotaTooltipEl();
      const data = quotaBtn && quotaBtn.__quotaUsageData;
      if (!el || !data) return;

      const lang = resolveLanguage();
      const tCap = (key, params) => getCapsuleText(lang, key, params);
      const light = isLightMode(quotaBtn, doc, win);

      const bgColor = light ? 'rgba(255, 255, 255, 0.98)' : 'rgba(18, 18, 22, 0.96)';
      const fgColor = light ? '#09090B' : '#F4F5F8';
      const mutedColor = light ? '#64748b' : '#94a3b8';
      const borderColor = light ? 'rgba(15, 23, 42, 0.12)' : 'rgba(255, 255, 255, 0.12)';
      const trackColor = light ? 'rgba(15, 23, 42, 0.08)' : 'rgba(255, 255, 255, 0.09)';

      el.style.backgroundColor = bgColor;
      el.style.color = fgColor;
      el.style.border = `1px solid ${borderColor}`;
      el.style.boxShadow = light
        ? '0 10px 26px rgba(15, 23, 42, 0.14), 0 0 0 1px rgba(15, 23, 42, 0.04)'
        : '0 12px 30px rgba(0, 0, 0, 0.52), 0 0 0 1px rgba(255, 255, 255, 0.04)';

      const usagePct = Math.max(0, Number(data.usagePercent) || 0);
      const contextUsed = Math.max(0, Number(data.contextUsed) || 0);
      const contextLimit = Math.max(0, Number(data.contextLimit) || 0);
      const modelTitle = hub.resolveModelDisplayName(data.modelId, data.modelDisplayName);

      const summary = data.quotaSummary || null;
      const fiveHour = (summary && summary.fiveHour) || data.quotaInfo || null;
      const weekly = (summary && summary.weekly && Number.isFinite(Number(summary.weekly.remainingFraction)))
        ? summary.weekly
        : null;

      const nodes = [];

      // Row 1: Active Model + xx.x% (used/limit) + 4px #10b981 progress bar
      const modelSection = doc.createElement('div');
      modelSection.className = 'agy-quota-hud-model';
      const modelTop = doc.createElement('div');
      modelTop.style.cssText = 'display:flex;align-items:baseline;justify-content:space-between;gap:10px;';
      const modelNameSpan = doc.createElement('span');
      modelNameSpan.style.cssText = `font-size:10.5px;font-weight:700;color:${fgColor};overflow:hidden;text-overflow:ellipsis;white-space:nowrap;min-width:0;`;
      modelNameSpan.textContent = String(modelTitle || '');

      const modelMetrics = doc.createElement('span');
      modelMetrics.style.cssText = 'flex-shrink:0;white-space:nowrap;';
      const modelPctSpan = doc.createElement('span');
      modelPctSpan.style.cssText = 'color:#10b981;font-weight:600;';
      modelPctSpan.textContent = `${usagePct.toFixed(1)}%`;
      const modelRatioSpan = doc.createElement('span');
      modelRatioSpan.style.cssText = 'color:#94a3b8;';
      modelRatioSpan.textContent = ` (${formatTokenValue(contextUsed)}/${formatTokenValue(contextLimit)})`;
      modelMetrics.appendChild(modelPctSpan);
      modelMetrics.appendChild(modelRatioSpan);

      modelTop.appendChild(modelNameSpan);
      modelTop.appendChild(modelMetrics);

      const ctxTrack = doc.createElement('div');
      ctxTrack.style.cssText = `width:100%;height:4px;border-radius:999px;background:${trackColor};overflow:hidden;margin-top:4px;`;
      const ctxFill = doc.createElement('div');
      const ctxFillPct = usagePct <= 0 ? '0' : Math.min(100, Math.max(2, usagePct)).toFixed(1);
      ctxFill.style.cssText = `width:${ctxFillPct}%;height:100%;border-radius:999px;background:#10b981;`;
      ctxTrack.appendChild(ctxFill);

      modelSection.appendChild(modelTop);
      modelSection.appendChild(ctxTrack);
      nodes.push(modelSection);

      const appendQuotaRow = (clsName, label, bucket) => {
        if (!bucket || typeof bucket.remainingFraction !== 'number') return;
        const frac = Math.max(0, Math.min(1, Number(bucket.remainingFraction)));
        const pct = Math.round(frac * 100);
        const resetText = formatResetText(bucket.resetTimeMs || bucket.resetTime, lang, parseResetTimeMs);
        const barColor = getQuotaHudBarColor(frac);

        const rowWrap = doc.createElement('div');
        rowWrap.className = clsName;
        rowWrap.style.cssText = 'margin-top:8px;';

        const top = doc.createElement('div');
        top.style.cssText = 'display:flex;align-items:baseline;justify-content:space-between;gap:10px;';
        const left = doc.createElement('span');
        left.style.cssText = `color:${mutedColor};`;
        left.textContent = label;

        const right = doc.createElement('span');
        right.style.cssText = 'white-space:nowrap;';
        const pctEl = doc.createElement('span');
        pctEl.style.cssText = `color:${fgColor};font-weight:600;`;
        pctEl.textContent = `${pct}%`;
        right.appendChild(pctEl);
        if (resetText) {
          const resetEl = doc.createElement('span');
          resetEl.style.cssText = `color:${mutedColor};`;
          resetEl.textContent = ` (${resetText})`;
          right.appendChild(resetEl);
        }

        top.appendChild(left);
        top.appendChild(right);

        const track = doc.createElement('div');
        track.style.cssText = `width:100%;height:3.5px;border-radius:999px;background:${trackColor};overflow:hidden;margin-top:3px;`;
        const fill = doc.createElement('div');
        fill.className = `${clsName}-bar`;
        const barWidth = pct <= 0 ? '0' : Math.min(100, Math.max(2, pct)).toFixed(0);
        fill.style.cssText = `width:${barWidth}%;height:100%;border-radius:999px;background:${barColor};`;
        fill.style.backgroundColor = barColor;
        track.appendChild(fill);

        rowWrap.appendChild(top);
        rowWrap.appendChild(track);
        nodes.push(rowWrap);
      };

      // Row 2: 5-Hour Limit Remaining
      if (fiveHour) {
        appendQuotaRow('agy-quota-hud-5h', tCap('quota5h'), fiveHour);
      }

      // Row 3: Weekly Limit Remaining (when weekly bucket exists)
      if (weekly) {
        appendQuotaRow('agy-quota-hud-weekly', tCap('quotaWeekly'), weekly);
      }

      replaceChildrenCompat(el, nodes);
      positionPopover(el, quotaBtn);
      el.style.opacity = '1';
      el.style.transform = 'translateY(0)';
    }

    function createRingSvg(svgCls, fillCls, sizePx, strokeColor) {
      const svgNs = 'http://www.w3.org/2000/svg';
      const svg = doc.createElementNS(svgNs, 'svg');
      svg.setAttribute('class', svgCls);
      svg.setAttribute('width', String(sizePx));
      svg.setAttribute('height', String(sizePx));
      svg.setAttribute('viewBox', '0 0 18 18');
      svg.style.cssText = 'transform: rotate(-90deg); display: block; flex-shrink: 0;';

      const trackCircle = doc.createElementNS(svgNs, 'circle');
      trackCircle.setAttribute('cx', '9');
      trackCircle.setAttribute('cy', '9');
      trackCircle.setAttribute('r', String(RING_RADIUS));
      trackCircle.setAttribute('fill', 'none');
      trackCircle.setAttribute('stroke', 'currentColor');
      trackCircle.setAttribute('stroke-opacity', '0.18');
      trackCircle.setAttribute('stroke-width', '2');

      const fillCircle = doc.createElementNS(svgNs, 'circle');
      fillCircle.setAttribute('class', fillCls);
      fillCircle.setAttribute('cx', '9');
      fillCircle.setAttribute('cy', '9');
      fillCircle.setAttribute('r', String(RING_RADIUS));
      fillCircle.setAttribute('fill', 'none');
      fillCircle.setAttribute('stroke', strokeColor);
      fillCircle.setAttribute('stroke-width', '2');
      fillCircle.setAttribute('stroke-linecap', 'round');
      fillCircle.setAttribute('stroke-dasharray', String(RING_CIRCUMFERENCE));
      fillCircle.setAttribute('stroke-dashoffset', String(RING_CIRCUMFERENCE));
      fillCircle.style.cssText = 'transition: stroke-dashoffset 0.25s ease, stroke 0.22s ease;';

      svg.appendChild(trackCircle);
      svg.appendChild(fillCircle);
      return svg;
    }

    function applyPillStyle(btn) {
      btn.type = 'button';
      btn.setAttribute('translate', 'no');
      btn.className = 'notranslate inline-flex cursor-pointer items-center text-secondary-foreground select-none outline-none transition-colors shrink-0 whitespace-nowrap';
      if (btn.style) {
        btn.style.cssText = 'display:inline-flex;align-items:center;padding:3px 6px;height:26px;border-radius:6px;gap:5px;background:transparent;border:none;cursor:pointer;outline:none;font-variant-numeric:tabular-nums;font-size:11.5px;line-height:1;white-space:nowrap;flex-shrink:0;';
        btn.style.backgroundColor = 'transparent';
        btn.style.fontVariantNumeric = 'tabular-nums';
        btn.style.fontSize = '11.5px';
        btn.style.lineHeight = '1';
      }
      btn.addEventListener('mouseenter', () => {
        if (!btn.style) return;
        const light = isLightMode(btn, doc, win);
        btn.style.backgroundColor = light ? 'rgba(15, 23, 42, 0.06)' : 'rgba(255, 255, 255, 0.08)';
      });
      btn.addEventListener('mouseleave', () => {
        if (!btn.style) return;
        btn.style.backgroundColor = 'transparent';
      });
    }

    function populateContextButtonDom(capsuleBtn) {
      const ringSvg = createRingSvg('agy-ctx-ring-svg', 'agy-ctx-ring-fill', 15, SCHEME1_CTX_COLORS.green);

      const labelSpan = doc.createElement('span');
      labelSpan.className = 'agy-ctx-label';

      const ratioSpan = doc.createElement('span');
      ratioSpan.className = 'agy-ctx-ratio';
      ratioSpan.style.cssText = 'font-weight:500;';
      ratioSpan.textContent = '0/--';

      const pctSpan = doc.createElement('span');
      pctSpan.className = 'agy-ctx-pct';
      pctSpan.style.cssText = 'opacity:0.72;';
      pctSpan.textContent = '';

      labelSpan.appendChild(ratioSpan);
      labelSpan.appendChild(pctSpan);

      const sepSpan = doc.createElement('span');
      sepSpan.className = 'agy-ctx-sep';
      sepSpan.setAttribute('aria-hidden', 'true');
      sepSpan.style.cssText = 'display:none;width:1px;height:11px;background:currentColor;opacity:0.18;margin:0 1px;flex-shrink:0;';
      sepSpan.style.display = 'none';

      const speedWrap = doc.createElement('span');
      speedWrap.className = 'agy-ctx-speed';
      speedWrap.style.cssText = 'display:none;align-items:center;gap:4px;opacity:0.86;';
      speedWrap.style.display = 'none';

      const dotSpan = doc.createElement('span');
      dotSpan.className = 'agy-ctx-speed-dot';
      dotSpan.style.cssText = 'width:5px;height:5px;border-radius:999px;background:#10b981;display:inline-block;flex-shrink:0;';

      const speedVal = doc.createElement('span');
      speedVal.className = 'agy-ctx-speed-val';
      speedVal.textContent = '-- tok/s';

      speedWrap.appendChild(dotSpan);
      speedWrap.appendChild(speedVal);

      capsuleBtn.appendChild(ringSvg);
      capsuleBtn.appendChild(labelSpan);
      capsuleBtn.appendChild(sepSpan);
      capsuleBtn.appendChild(speedWrap);
    }

    function populateQuotaButtonDom(quotaBtn) {
      const pair5h = doc.createElement('span');
      pair5h.className = 'agy-quota-pair-5h';
      pair5h.style.cssText = 'display:inline-flex;align-items:center;gap:4px;';
      pair5h.style.display = 'inline-flex';
      const ring5h = createRingSvg('agy-quota-ring-svg', 'agy-quota-ring-fill', 14, SCHEME1_QUOTA_COLORS.green);
      const val5h = doc.createElement('span');
      val5h.className = 'agy-quota-5h-val';
      val5h.style.cssText = 'font-weight:500;';
      val5h.textContent = '100%';
      pair5h.appendChild(ring5h);
      pair5h.appendChild(val5h);

      const pairWk = doc.createElement('span');
      pairWk.className = 'agy-quota-pair-wk';
      pairWk.style.cssText = 'display:none;align-items:center;gap:4px;';
      pairWk.style.display = 'none';
      const ringWk = createRingSvg('agy-quota-wk-ring-svg', 'agy-quota-wk-ring-fill', 14, SCHEME1_QUOTA_COLORS.green);
      const valWk = doc.createElement('span');
      valWk.className = 'agy-quota-wk-val';
      valWk.style.cssText = 'font-weight:500;';
      valWk.textContent = '100%';
      pairWk.appendChild(ringWk);
      pairWk.appendChild(valWk);

      quotaBtn.appendChild(pair5h);
      quotaBtn.appendChild(pairWk);
    }

    function updateRingCircle(circleEl, pct, strokeColor) {
      if (!circleEl) return;
      const clamped = Math.max(0, Math.min(100, Number(pct) || 0));
      const offset = clamped <= 0
        ? RING_CIRCUMFERENCE.toFixed(2)
        : (RING_CIRCUMFERENCE * (1 - clamped / 100)).toFixed(2);
      if (circleEl.getAttribute('stroke-dasharray') !== String(RING_CIRCUMFERENCE)) {
        circleEl.setAttribute('stroke-dasharray', String(RING_CIRCUMFERENCE));
      }
      if (circleEl.getAttribute('stroke-dashoffset') !== offset) {
        circleEl.setAttribute('stroke-dashoffset', offset);
      }
      if (circleEl.getAttribute('stroke') !== strokeColor) {
        circleEl.setAttribute('stroke', strokeColor);
      }
    }

    function placeStrip(footerEl, stripEl, permBtn) {
      const permParent = permBtn ? (permBtn.parentNode || permBtn.parentElement) : null;
      const stripParent = stripEl.parentNode || stripEl.parentElement;
      if (permParent) {
        const alreadyBefore = stripParent === permParent && (
          stripEl.nextSibling === permBtn ||
          (permParent.children && typeof permParent.children.indexOf === 'function' &&
            permParent.children.indexOf(stripEl) >= 0 &&
            permParent.children.indexOf(stripEl) + 1 === permParent.children.indexOf(permBtn))
        );
        if (!alreadyBefore) {
          if (stripParent === permParent && typeof stripEl.remove === 'function') stripEl.remove();
          permParent.insertBefore(stripEl, permBtn);
        }
      } else if (!stripParent) {
        const rightBox = footerEl.querySelector ? footerEl.querySelector('.shrink-0.flex.items-center') : null;
        if (rightBox) rightBox.insertBefore(stripEl, rightBox.firstChild);
        else footerEl.appendChild(stripEl);
      }
    }

    function renderFooterCapsule(footerEl, usageData) {
      if (!footerEl || !doc || disposed) return;
      ensureStyles();

      const permBtn = footerEl.querySelector ? footerEl.querySelector('button[data-testid="permissions-selector-trigger"]') : null;
      let stripEl = footerEl.querySelector ? footerEl.querySelector('[data-agy-capsule-strip="1"]') : null;

      if (!stripEl) {
        stripEl = doc.createElement('div');
        stripEl.setAttribute('data-agy-capsule-strip', '1');
        stripEl.setAttribute('translate', 'no');
        stripEl.className = 'notranslate';
        if (stripEl.style) {
          stripEl.style.cssText = 'display:inline-flex;align-items:center;gap:2px;flex-shrink:0;white-space:nowrap;';
          stripEl.style.display = 'inline-flex';
        }
      }
      placeStrip(footerEl, stripEl, permBtn);

      let capsuleBtn = stripEl.querySelector ? stripEl.querySelector('[data-agy-context-capsule="1"]') : null;
      if (!capsuleBtn) {
        const strayBtn = footerEl.querySelector ? footerEl.querySelector('[data-agy-context-capsule="1"]') : null;
        if (strayBtn) strayBtn.remove();

        capsuleBtn = doc.createElement('button');
        capsuleBtn.setAttribute('data-agy-context-capsule', '1');
        applyPillStyle(capsuleBtn);
        populateContextButtonDom(capsuleBtn);

        capsuleBtn.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          hub.toggleShortLanguage();
        });
        capsuleBtn.addEventListener('mouseenter', () => {
          hideQuotaTooltip();
          activeTooltipTarget = capsuleBtn;
          updateTooltipContent(capsuleBtn);
          const tasks = [hub.refreshUserStatus(false)];
          if (typeof hub.refreshAvailableModels === 'function') tasks.push(hub.refreshAvailableModels(false));
          if (typeof hub.refreshQuotaSummary === 'function') tasks.push(hub.refreshQuotaSummary(false));
          Promise.allSettled(tasks).then(() => {
            if (!disposed) {
              renderAllFooters();
              if (activeTooltipTarget === capsuleBtn) updateTooltipContent(capsuleBtn);
            }
          });
        });
        capsuleBtn.addEventListener('mouseleave', () => {
          if (activeTooltipTarget === capsuleBtn) hideTooltip();
        });
        stripEl.appendChild(capsuleBtn);
      }

      let quotaBtn = stripEl.querySelector ? stripEl.querySelector('[data-agy-quota-capsule="1"]') : null;
      if (!quotaBtn) {
        quotaBtn = doc.createElement('button');
        quotaBtn.setAttribute('data-agy-quota-capsule', '1');
        applyPillStyle(quotaBtn);
        populateQuotaButtonDom(quotaBtn);

        quotaBtn.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          const tasks = [hub.refreshUserStatus(true)];
          if (typeof hub.refreshQuotaSummary === 'function') tasks.push(hub.refreshQuotaSummary(true));
          Promise.allSettled(tasks).then(() => {
            if (!disposed) {
              renderAllFooters();
              if (activeQuotaTarget === quotaBtn) updateQuotaTooltipContent(quotaBtn);
            }
          });
        });
        quotaBtn.addEventListener('mouseenter', () => {
          hideTooltip();
          activeQuotaTarget = quotaBtn;
          updateQuotaTooltipContent(quotaBtn);
          const tasks = [hub.refreshUserStatus(false)];
          if (typeof hub.refreshQuotaSummary === 'function') tasks.push(hub.refreshQuotaSummary(false));
          Promise.allSettled(tasks).then(() => {
            if (!disposed) {
              renderAllFooters();
              if (activeQuotaTarget === quotaBtn) updateQuotaTooltipContent(quotaBtn);
            }
          });
        });
        quotaBtn.addEventListener('mouseleave', () => {
          if (activeQuotaTarget === quotaBtn) hideQuotaTooltip();
        });
        stripEl.appendChild(quotaBtn);
      }

      // Update Context Pill
      capsuleBtn.__ctxUsageData = usageData;
      const clampedPct = Math.max(0, Math.min(100, Number(usageData.usagePercent) || 0));
      const ringColor = getContextRingColor(clampedPct);
      updateRingCircle(capsuleBtn.querySelector('.agy-ctx-ring-fill'), clampedPct, ringColor);

      const usedStr = formatTokenValue(usageData.contextUsed);
      const limitStr = formatTokenValue(usageData.contextLimit);
      const pctStr = (Number(usageData.usagePercent) || 0).toFixed(1).replace(/\.0$/, '') + '%';
      const ratioText = `${usedStr}/${limitStr}`;
      const pctText = ` · ${pctStr}`;

      const ratioSpan = capsuleBtn.querySelector('.agy-ctx-ratio');
      const pctSpan = capsuleBtn.querySelector('.agy-ctx-pct');
      if (ratioSpan && pctSpan) {
        if (ratioSpan.textContent !== ratioText) ratioSpan.textContent = ratioText;
        if (pctSpan.textContent !== pctText) pctSpan.textContent = pctText;
        if (pctSpan.style) {
          if (clampedPct >= 80) {
            pctSpan.style.color = SCHEME1_CTX_COLORS.red;
            pctSpan.style.opacity = '1';
          } else if (clampedPct >= 50) {
            pctSpan.style.color = SCHEME1_CTX_COLORS.amber;
            pctSpan.style.opacity = '1';
          } else {
            pctSpan.style.color = '';
            pctSpan.style.opacity = '0.72';
          }
        }
      } else {
        const labelSpan = capsuleBtn.querySelector('.agy-ctx-label');
        const nextText = `${ratioText}${pctText}`;
        if (labelSpan && labelSpan.textContent !== nextText) labelSpan.textContent = nextText;
      }

      const hasSpeed = Number(usageData.tokPerSec) > 0;
      const speedWrap = capsuleBtn.querySelector('.agy-ctx-speed');
      const sepSpan = capsuleBtn.querySelector('.agy-ctx-sep');
      if (speedWrap && speedWrap.style) {
        const targetDisplay = hasSpeed ? 'inline-flex' : 'none';
        if (speedWrap.style.display !== targetDisplay) speedWrap.style.display = targetDisplay;
      }
      if (sepSpan && sepSpan.style) {
        const targetSepDisplay = hasSpeed ? 'inline-block' : 'none';
        if (sepSpan.style.display !== targetSepDisplay) sepSpan.style.display = targetSepDisplay;
      }
      const speedValSpan = capsuleBtn.querySelector('.agy-ctx-speed-val');
      if (speedValSpan) {
        const speedText = hasSpeed ? `${usageData.tokPerSec} tok/s` : '-- tok/s';
        if (speedValSpan.textContent !== speedText) speedValSpan.textContent = speedText;
      }

      // Update Quota Pill
      quotaBtn.__quotaUsageData = usageData;
      const hasQuota = Boolean(usageData.quotaInfo || usageData.quotaSummary);
      quotaBtn.hidden = !hasQuota;
      if (quotaBtn.style) {
        const targetQuotaDisplay = hasQuota ? 'inline-flex' : 'none';
        if (quotaBtn.style.display !== targetQuotaDisplay) quotaBtn.style.display = targetQuotaDisplay;
      }

      if (hasQuota) {
        const summary = usageData.quotaSummary || null;
        const fiveHour = (summary && summary.fiveHour) || usageData.quotaInfo || null;
        const weekly = (summary && summary.weekly && Number.isFinite(Number(summary.weekly.remainingFraction)))
          ? summary.weekly
          : null;

        const pair5h = quotaBtn.querySelector('.agy-quota-pair-5h');
        if (fiveHour && typeof fiveHour.remainingFraction === 'number') {
          const frac5h = Math.max(0, Math.min(1, Number(fiveHour.remainingFraction)));
          const pct5h = Math.round(frac5h * 100);
          if (pair5h && pair5h.style) pair5h.style.display = 'inline-flex';
          updateRingCircle(quotaBtn.querySelector('.agy-quota-ring-fill'), pct5h, getQuotaRingColor(frac5h));
          const val5h = quotaBtn.querySelector('.agy-quota-5h-val');
          if (val5h && val5h.textContent !== `${pct5h}%`) val5h.textContent = `${pct5h}%`;
        } else if (pair5h && pair5h.style) {
          pair5h.style.display = 'none';
        }

        const pairWk = quotaBtn.querySelector('.agy-quota-pair-wk');
        if (weekly) {
          const fracWk = Math.max(0, Math.min(1, Number(weekly.remainingFraction)));
          const pctWk = Math.round(fracWk * 100);
          if (pairWk && pairWk.style) pairWk.style.display = 'inline-flex';
          updateRingCircle(quotaBtn.querySelector('.agy-quota-wk-ring-fill'), pctWk, getQuotaRingColor(fracWk));
          const valWk = quotaBtn.querySelector('.agy-quota-wk-val');
          if (valWk && valWk.textContent !== `${pctWk}%`) valWk.textContent = `${pctWk}%`;
        } else if (pairWk && pairWk.style) {
          pairWk.style.display = 'none';
        }
      } else if (activeQuotaTarget === quotaBtn) {
        hideQuotaTooltip();
      }

      if (activeTooltipTarget === capsuleBtn) updateTooltipContent(capsuleBtn);
      if (activeQuotaTarget === quotaBtn) updateQuotaTooltipContent(quotaBtn);
    }

    function renderAllFooters() {
      if (!doc || disposed) return;
      const footers = doc.querySelectorAll ? doc.querySelectorAll('.agy-composer-footer') : [];
      if (!footers || footers.length === 0) return;
      for (const footer of footers) {
        const usage = hub.resolveUsageForFooter(footer);
        renderFooterCapsule(footer, usage);
      }
    }

    function start() {
      if (!doc || disposed) return controller;
      ensureStyles();
      if (win) {
        win.__AGY_CTX_CAPSULE_ACTIVE__ = true;
        win.__AGY_CTX_CAPSULE_VERSION__ = CAPSULE_VERSION;
      }
      unsubSession = hub.subscribeSession(() => renderAllFooters());
      unsubLang = hub.subscribeLanguage(() => {
        renderAllFooters();
        if (activeTooltipTarget) updateTooltipContent(activeTooltipTarget);
        if (activeQuotaTarget) updateQuotaTooltipContent(activeQuotaTarget);
      });

      const Observer = (win && win.MutationObserver) || (typeof MutationObserver !== 'undefined' ? MutationObserver : null);
      const rootNode = doc.body || doc.documentElement;
      if (Observer && rootNode) {
        domObserver = new Observer(() => {
          const footers = doc.querySelectorAll ? doc.querySelectorAll('.agy-composer-footer') : [];
          let needsImmediate = false;
          for (const f of footers) {
            if (!f.querySelector('[data-agy-capsule-strip="1"]') || !f.querySelector('[data-agy-context-capsule="1"]')) {
              needsImmediate = true;
              break;
            }
          }
          if (needsImmediate) renderAllFooters();
          if (mutationTimer) clearTimeout(mutationTimer);
          mutationTimer = setTimeout(() => {
            if (disposed) return;
            renderAllFooters();
            if (activeTooltipTarget) updateTooltipContent(activeTooltipTarget);
            if (activeQuotaTarget) updateQuotaTooltipContent(activeQuotaTarget);
          }, 250);
        });
        domObserver.observe(rootNode, { childList: true, subtree: true });
        if (doc.documentElement) {
          domObserver.observe(doc.documentElement, { attributes: true, attributeFilter: ['class', 'data-theme', 'style'] });
        }
      }

      renderAllFooters();
      return controller;
    }

    function dispose() {
      if (disposed) return;
      disposed = true;
      if (unsubSession) { unsubSession(); unsubSession = null; }
      if (unsubLang) { unsubLang(); unsubLang = null; }
      if (domObserver) { domObserver.disconnect(); domObserver = null; }
      if (mutationTimer) { clearTimeout(mutationTimer); mutationTimer = null; }
      if (doc && doc.querySelectorAll) {
        for (const el of doc.querySelectorAll('[data-agy-capsule-strip="1"], [data-agy-context-capsule="1"], [data-agy-quota-capsule="1"]')) {
          try { el.remove(); } catch {}
        }
      }
      if (tooltipEl) {
        try { tooltipEl.remove(); } catch {}
        tooltipEl = null;
      }
      if (quotaTooltipEl) {
        try { quotaTooltipEl.remove(); } catch {}
        quotaTooltipEl = null;
      }
      if (styleEl) {
        try { styleEl.remove(); } catch {}
        styleEl = null;
      }
      if (doc && doc.getElementById) {
        for (const id of ['__agy_ctx_capsule_tooltip__', '__agy_quota_hud_tooltip__', '__agy_capsule_styles__']) {
          const orphan = doc.getElementById(id);
          if (orphan) {
            try { orphan.remove(); } catch {}
          }
        }
      }
      activeTooltipTarget = null;
      activeQuotaTarget = null;
      if (win) {
        delete win.__AGY_CTX_CAPSULE_ACTIVE__;
        delete win.__AGY_CTX_CAPSULE_VERSION__;
      }
    }

    const controller = {
      start,
      dispose,
      renderAllFooters,
      renderFooterCapsule,
      updateTooltipContent,
      updateQuotaTooltipContent,
      hideTooltip,
      hideQuotaTooltip
    };
    return controller;
  }

  const exported = {
    CAPSULE_VERSION,
    RING_RADIUS,
    RING_CIRCUMFERENCE,
    MORANDI_3A,
    SCHEME1_CTX_COLORS,
    SCHEME1_QUOTA_COLORS,
    getMorandi3AColor,
    getContextRingColor,
    getQuotaRingColor,
    getQuotaHudBarColor,
    formatResetText,
    createCapsuleController
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = exported;
  } else {
    root.__AGPulseCapsuleModule = exported;
  }
})(globalThis);
