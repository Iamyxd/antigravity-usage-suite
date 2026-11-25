(function (root) {
  'use strict';

  const COMPRESSION_MIN_DROP = 5000;
  const DEFAULT_LIMIT = 256000;
  const CLAUDE_LIMIT = 200000;
  const GEMINI_MAX_WINDOW = 1000000;
  const GPT_OSS_LIMIT = 128000;
  const GPT_OSS_MAX_WINDOW = 128000;
  const USER_STATUS_TTL_MS = 30000;
  const AVAILABLE_MODELS_TTL_MS = 300000;
  const QUOTA_SUMMARY_TTL_MS = 15000;
  const QUOTA_SUMMARY_TIMEOUT_MS = 2000;
  const POLL_INTERVAL_MS = 3000;

  const KNOWN_QUOTA_POOLS = {
    MODEL_PLACEHOLDER_M532: 'gemini',
    MODEL_PLACEHOLDER_M533: 'gemini',
    MODEL_PLACEHOLDER_M534: 'gemini',
    MODEL_PLACEHOLDER_M535: 'gemini',
    MODEL_PLACEHOLDER_M537: 'gemini',
    MODEL_PLACEHOLDER_M525: 'gemini',
    MODEL_PLACEHOLDER_M526: 'gemini',
    MODEL_PLACEHOLDER_M527: 'gemini',
    MODEL_PLACEHOLDER_M528: 'gemini',
    MODEL_PLACEHOLDER_M530: 'gemini',
    MODEL_PLACEHOLDER_M531: 'gemini',
    MODEL_PLACEHOLDER_M578: 'gemini',
    MODEL_PLACEHOLDER_M668: 'gemini',
    MODEL_PLACEHOLDER_M669: 'gemini',
    MODEL_PLACEHOLDER_M670: 'gemini',
    MODEL_PLACEHOLDER_M417: 'gemini',
    MODEL_PLACEHOLDER_M418: 'gemini',
    MODEL_PLACEHOLDER_M419: 'gemini',
    MODEL_PLACEHOLDER_M318: 'gemini',
    MODEL_PLACEHOLDER_M319: 'gemini',
    MODEL_PLACEHOLDER_M320: 'gemini',
    MODEL_PLACEHOLDER_M322: 'gemini',
    MODEL_PLACEHOLDER_M298: 'gemini',
    MODEL_PLACEHOLDER_M299: 'gemini',
    MODEL_PLACEHOLDER_M300: 'gemini',
    MODEL_PLACEHOLDER_M71: 'gemini',
    MODEL_PLACEHOLDER_M72: 'gemini',
    MODEL_PLACEHOLDER_M73: 'gemini',
    MODEL_PLACEHOLDER_M84: 'gemini',
    MODEL_PLACEHOLDER_M20: 'gemini',
    MODEL_PLACEHOLDER_M187: 'gemini',
    MODEL_PLACEHOLDER_M16: 'gemini',
    MODEL_PLACEHOLDER_M36: 'gemini',
    MODEL_PLACEHOLDER_M37: 'gemini',
    MODEL_PLACEHOLDER_M18: 'gemini',
    MODEL_PLACEHOLDER_M47: 'gemini',
    MODEL_PLACEHOLDER_M400: 'premium',
    MODEL_PLACEHOLDER_M401: 'premium',
    MODEL_PLACEHOLDER_M402: 'premium',
    MODEL_PLACEHOLDER_M403: 'premium',
    MODEL_PLACEHOLDER_M404: 'premium',
    MODEL_PLACEHOLDER_M405: 'premium',
    MODEL_PLACEHOLDER_M35: 'premium',
    MODEL_PLACEHOLDER_M26: 'premium',
    MODEL_OPENAI_GPT_OSS_120B_MEDIUM: 'premium'
  };

  const KNOWN_MODEL_DISPLAY_NAMES = {
    M532: 'Gemini 4 Neon (High)',
    M533: 'Gemini 4 Neon (Medium)',
    M534: 'Gemini 4 Neon (Low)',
    M535: 'Gemini 4 Neon (XHigh)',
    M537: 'Orchestrator (Neon)',
    M525: 'Gemini 4 Hydrogen (High)',
    M526: 'Gemini 4 Hydrogen (Medium)',
    M527: 'Gemini 4 Hydrogen (Low)',
    M528: 'Gemini 4 Hydrogen (XHigh)',
    M530: 'Gemini 4 Hydrogen (High)',
    M531: 'Gemini 4 Hydrogen (XHigh)',
    M668: 'Orchestrator (Argon)',
    M669: 'Gemini 4 Hydrogen (Orchestrator)',
    M670: 'Gemini 4 Carbon',
    M419: 'Gemini 4 Argon (Low)',
    M418: 'Gemini 4 Argon (Medium)',
    M417: 'Gemini 4 Argon (High)',
    M320: 'Gemini 3.8 Flash (Low)',
    M319: 'Gemini 3.8 Flash (Medium)',
    M318: 'Gemini 3.8 Flash (High)',
    M400: 'Claude Opus 5.5 (Low)',
    M401: 'Claude Opus 5.5 (Medium)',
    M402: 'Claude Opus 5.5 (High)',
    M403: 'Claude Sonnet 5.5 (Low)',
    M404: 'Claude Sonnet 5.5 (Medium)',
    M405: 'Claude Sonnet 5.5 (High)',
    M35: 'Claude Sonnet 4.6 (Thinking)',
    M26: 'Claude Opus 4.6 (Thinking)'
  };

  function setBoundedMap(map, key, value, maxSize = 30) {
    if (!map) return;
    if (map.has(key)) map.delete(key);
    map.set(key, value);
    while (map.size > maxSize) {
      const oldestKey = map.keys().next().value;
      if (oldestKey === undefined && !map.has(undefined)) break;
      map.delete(oldestKey);
    }
  }

  function normalizePanelLanguage(raw) {
    if (!raw || typeof raw !== 'string') return null;
    const s = raw.trim();
    if (s === 'zh-CN' || s === 'zh-TW' || s === 'en') return s;
    const low = s.toLowerCase();
    if (low === 'en' || low.startsWith('en-')) return 'en';
    if (low === 'zh-tw' || low === 'zh-hant' || low === 'tw' || low === 'zh-hk') return 'zh-TW';
    if (low === 'zh' || low === 'zh-cn' || low === 'zh-hans') return 'zh-CN';
    return null;
  }

  function toShortLanguage(panelLang) {
    return panelLang === 'en' ? 'en' : 'zh';
  }

  function formatTokenValue(value) {
    const safe = Math.max(0, Math.round(Number(value) || 0));
    if (safe >= 1000000) return (safe / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
    if (safe >= 1000) return (safe / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
    return String(safe);
  }

  function estimateTokensFromText(text) {
    if (!text || typeof text !== 'string') return 0;
    let ascii = 0;
    let nonAscii = 0;
    const len = Math.min(text.length, 250000);
    for (let i = 0; i < len; i++) {
      if (text.charCodeAt(i) < 128) ascii++;
      else nonAscii++;
    }
    return Math.ceil(ascii / 4 + nonAscii / 1.5);
  }

  function isShadowOrImageModel(modelId) {
    if (!modelId) return false;
    const s = String(modelId).toUpperCase();
    if (s.includes('_M50') || s === 'M50' || s.includes('FLASH_LITE')) return true;
    if (s.includes('_M21') || s === 'M21' || s.includes('IMAGE') || s.includes('BANANA')) return true;
    return false;
  }

  function normalizeModelCapKey(raw) {
    if (!raw || typeof raw !== 'string') return '';
    return raw.trim().toLowerCase().replace(/^model_/, '');
  }

  function canonicalizeModelCapKey(raw) {
    const base = normalizeModelCapKey(raw);
    if (!base) return '';
    return base
      .replace(/\bextra[\s_-]*high\b/g, 'xhigh')
      .replace(/[^a-z0-9]+/g, '');
  }

  function extractPositiveInt(...candidates) {
    for (const raw of candidates) {
      if (raw === undefined || raw === null || raw === '') continue;
      const n = Number(raw);
      if (Number.isFinite(n) && n > 0) return Math.round(n);
    }
    return null;
  }

  function extractCatalogMaxTokens(obj) {
    if (!obj || typeof obj !== 'object') return null;
    const mi = obj.modelInfo && typeof obj.modelInfo === 'object' ? obj.modelInfo : null;
    return extractPositiveInt(
      obj.maxTokens,
      obj.maxInputTokens,
      obj.contextWindow,
      obj.contextLength,
      obj.maxContextTokens,
      mi && mi.maxTokens,
      mi && mi.maxInputTokens,
      mi && mi.contextWindow,
      mi && mi.contextLength,
      mi && mi.maxContextTokens
    );
  }

  function extractCatalogMaxOutputTokens(obj) {
    if (!obj || typeof obj !== 'object') return null;
    const mi = obj.modelInfo && typeof obj.modelInfo === 'object' ? obj.modelInfo : null;
    for (const raw of [obj.maxOutputTokens, mi && mi.maxOutputTokens]) {
      if (raw === undefined || raw === null || raw === '') continue;
      const n = Number(raw);
      if (Number.isFinite(n) && n >= 0) return Math.round(n);
    }
    return null;
  }

  function resolveModelContextSpec(modelId, label, options = {}) {
    const observedRaw = Number(options.observedClientBudget ?? options.observedCompactionLimit);
    const hasObservedBudget = Number.isFinite(observedRaw) && observedRaw >= 16000;
    const observedBudget = hasObservedBudget ? Math.round(observedRaw) : null;
    const capMap = options.modelCapabilities;
    const modelConfigs = Array.isArray(options.modelConfigs) ? options.modelConfigs : [];

    let catalogMaxTokens = null;
    let catalogMaxOutputTokens = null;

    const lookupKeys = [];
    const lookupCanonKeys = [];
    const addLookupCandidate = (val) => {
      if (!val || typeof val !== 'string') return;
      const k = normalizeModelCapKey(val);
      if (k && !lookupKeys.includes(k)) lookupKeys.push(k);
      const ck = canonicalizeModelCapKey(val);
      if (ck && !lookupCanonKeys.includes(ck)) lookupCanonKeys.push(ck);
    };
    addLookupCandidate(modelId);
    addLookupCandidate(label);

    if (modelConfigs.length > 0) {
      for (const cfg of modelConfigs) {
        if (!cfg || typeof cfg !== 'object') continue;
        const cfgValues = [
          cfg.modelOrAlias && cfg.modelOrAlias.model,
          cfg.modelOrAlias && cfg.modelOrAlias.alias,
          cfg.modelId,
          cfg.model,
          cfg.label,
          cfg.displayName
        ].filter(v => typeof v === 'string' && v.trim());

        const matched = cfgValues.some(v => {
          const nk = normalizeModelCapKey(v);
          const ck = canonicalizeModelCapKey(v);
          return (nk && lookupKeys.includes(nk)) || (ck && lookupCanonKeys.includes(ck));
        });
        if (matched) {
          for (const v of cfgValues) addLookupCandidate(v);
          if (!catalogMaxTokens) {
            const mt = extractCatalogMaxTokens(cfg);
            if (mt) {
              catalogMaxTokens = mt;
              catalogMaxOutputTokens = extractCatalogMaxOutputTokens(cfg);
            }
          }
        }
      }
    }

    if (capMap && typeof capMap.get === 'function') {
      let capHit = null;
      for (const key of lookupKeys) {
        const entry = capMap.get(key);
        const mt = entry && extractPositiveInt(entry.maxTokens);
        if (mt) {
          capHit = { maxTokens: mt, maxOutputTokens: extractCatalogMaxOutputTokens(entry) };
          break;
        }
      }
      if (!capHit && lookupCanonKeys.length > 0 && typeof capMap.entries === 'function') {
        for (const [entryKey, entry] of capMap.entries()) {
          const entryCanon = canonicalizeModelCapKey(entryKey);
          if (!entryCanon || !lookupCanonKeys.includes(entryCanon)) continue;
          const mt = entry && extractPositiveInt(entry.maxTokens);
          if (mt) {
            capHit = { maxTokens: mt, maxOutputTokens: extractCatalogMaxOutputTokens(entry) };
            break;
          }
        }
      }
      if (capHit) {
        catalogMaxTokens = capHit.maxTokens;
        if (capHit.maxOutputTokens !== null) catalogMaxOutputTokens = capHit.maxOutputTokens;
      }
    }

    const buildSpec = (realWindow, baseSource, maxOut = null) => {
      const baseWindow = Math.round(realWindow);
      let contextLimit = baseWindow;
      let modelMaxTokens = baseWindow;
      let clientCompactionLimit = null;
      let limitSource = baseSource;

      if (observedBudget !== null) {
        if (observedBudget < baseWindow) {
          clientCompactionLimit = observedBudget;
        } else if (baseSource !== 'catalog' && observedBudget > baseWindow) {
          contextLimit = observedBudget;
          modelMaxTokens = observedBudget;
          limitSource = 'runtime';
        } else if (baseSource !== 'catalog') {
          limitSource = 'runtime';
        }
      }

      return {
        contextLimit,
        modelMaxTokens,
        clientCompactionLimit,
        runtimeBudget: clientCompactionLimit,
        maxOutputTokens: maxOut,
        limitSource
      };
    };

    if (catalogMaxTokens && catalogMaxTokens > 0) {
      return buildSpec(catalogMaxTokens, 'catalog', catalogMaxOutputTokens);
    }

    const combined = [modelId || '', label || '', ...lookupKeys].join(' ').toUpperCase();
    const knownPool = (modelId && KNOWN_QUOTA_POOLS[modelId]) || '';

    if (combined.includes('GPT_OSS') || combined.includes('GPT-OSS') || combined.includes('120B')) {
      return buildSpec(GPT_OSS_MAX_WINDOW, 'spec', null);
    }

    if (
      combined.includes('CLAUDE') ||
      combined.includes('OPUS') ||
      combined.includes('SONNET') ||
      combined.includes('HAIKU') ||
      knownPool === 'premium'
    ) {
      return buildSpec(CLAUDE_LIMIT, 'spec', null);
    }

    if (
      combined.includes('GEMINI') ||
      combined.includes('NEON') ||
      combined.includes('ARGON') ||
      combined.includes('HYDROGEN') ||
      combined.includes('CARBON') ||
      combined.includes('FLASH') ||
      combined.includes('ORCHESTRATOR') ||
      knownPool === 'gemini'
    ) {
      return buildSpec(GEMINI_MAX_WINDOW, 'spec', null);
    }

    if (observedBudget !== null) {
      return {
        contextLimit: observedBudget,
        modelMaxTokens: observedBudget,
        clientCompactionLimit: null,
        runtimeBudget: null,
        maxOutputTokens: null,
        limitSource: 'runtime'
      };
    }

    return {
      contextLimit: DEFAULT_LIMIT,
      modelMaxTokens: DEFAULT_LIMIT,
      clientCompactionLimit: null,
      runtimeBudget: null,
      maxOutputTokens: null,
      limitSource: 'default'
    };
  }

  function getContextLimitForModel(modelId, label, options = {}) {
    return resolveModelContextSpec(modelId, label, options).contextLimit;
  }

  function getQuotaPoolForModel(modelId, label) {
    if (modelId && KNOWN_QUOTA_POOLS[modelId]) return KNOWN_QUOTA_POOLS[modelId];
    const combined = ((modelId || '') + ' ' + (label || '')).toUpperCase();
    if (
      combined.includes('GEMINI') ||
      combined.includes('NEON') ||
      combined.includes('ARGON') ||
      combined.includes('HYDROGEN') ||
      combined.includes('CARBON') ||
      combined.includes('FLASH') ||
      combined.includes('ORCHESTRATOR')
    ) return 'gemini';
    if (combined.includes('CLAUDE') || combined.includes('OPUS') || combined.includes('SONNET') || combined.includes('HAIKU') || combined.includes('GPT') || combined.includes('OSS')) return 'premium';
    return '';
  }

  function normalizeCidKey(cid) {
    if (!cid || typeof cid !== 'string') return '';
    const trimmed = cid.trim();
    const parts = trimmed.split('/');
    return parts[parts.length - 1] || trimmed;
  }

  function parseResetTimeMs(val) {
    if (!val) return 0;
    if (typeof val === 'number') {
      const ms = val < 1e11 ? val * 1000 : val;
      return (Number.isFinite(ms) && ms > 946684800000) ? ms : 0;
    }
    if (typeof val === 'bigint') {
      const num = Number(val);
      const ms = num < 1e11 ? num * 1000 : num;
      return (Number.isFinite(ms) && ms > 946684800000) ? ms : 0;
    }
    if (typeof val === 'string') {
      const trimmed = val.trim();
      if (!trimmed || trimmed.startsWith('1970-01-01') || trimmed.startsWith('0001-01-01')) return 0;
      if (/^\d+$/.test(trimmed)) {
        const num = Number(trimmed);
        const ms = num < 1e11 ? num * 1000 : num;
        return (Number.isFinite(ms) && ms > 946684800000) ? ms : 0;
      }
      const normalized = trimmed.replace(/(\.\d{3})\d+(Z|[+-]\d{2}:?\d{2})$/, '$1$2');
      const ms = Date.parse(normalized);
      return (Number.isFinite(ms) && ms > 946684800000) ? ms : 0;
    }
    if (typeof val === 'object') {
      if (val instanceof Date) {
        const ms = val.getTime();
        return (Number.isFinite(ms) && ms > 946684800000) ? ms : 0;
      }
      if (typeof val.toDate === 'function') {
        try {
          const d = val.toDate();
          if (d instanceof Date && Number.isFinite(d.getTime()) && d.getTime() > 946684800000) return d.getTime();
        } catch {}
      }
      if (typeof val.toJsonString === 'function') {
        try { return parseResetTimeMs(val.toJsonString()); } catch {}
      }
      if (typeof val.toJSON === 'function') {
        try {
          const j = val.toJSON();
          if (typeof j === 'string') return parseResetTimeMs(j);
        } catch {}
      }
      const secRaw = val.seconds !== undefined ? val.seconds
        : (val.unixSeconds !== undefined ? val.unixSeconds : (val.secs !== undefined ? val.secs : undefined));
      if (secRaw !== undefined && secRaw !== null) {
        const sec = Number(secRaw);
        const nanos = Number(val.nanos || 0);
        if (Number.isFinite(sec) && sec > 946684800) {
          return Math.round(sec * 1000 + (Number.isFinite(nanos) ? nanos / 1e6 : 0));
        }
      }
    }
    return 0;
  }

  function normalizeQuotaInfo(qi) {
    if (!qi || typeof qi !== 'object') return null;
    const rawReset = qi.resetTimeMs !== undefined ? qi.resetTimeMs
      : (qi.reset_time_ms !== undefined ? qi.reset_time_ms
      : (qi.resetTime !== undefined ? qi.resetTime
      : (qi.reset_time !== undefined ? qi.reset_time
      : (qi.resetsAt !== undefined ? qi.resetsAt
      : (qi.resets_at !== undefined ? qi.resets_at
      : (qi.refreshTime !== undefined ? qi.refreshTime : qi.refresh_time))))));
    const resetTimeMs = parseResetTimeMs(rawReset);
    let rawFrac = qi.remainingFraction !== undefined ? qi.remainingFraction : qi.remaining_fraction;
    let rawPct = qi.remainingPercentage !== undefined ? qi.remainingPercentage : qi.remainingPercent;
    if (rawFrac === undefined && rawPct === undefined && qi.remaining && typeof qi.remaining === 'object') {
      const rem = qi.remaining;
      const remCase = typeof rem.case === 'string' ? rem.case.toLowerCase() : '';
      if (remCase.includes('percent') || remCase.includes('pct')) {
        rawPct = rem.value;
      } else if (rem.value !== undefined) {
        rawFrac = rem.value;
      } else if (rem.remainingFraction !== undefined || rem.remaining_fraction !== undefined) {
        rawFrac = rem.remainingFraction !== undefined ? rem.remainingFraction : rem.remaining_fraction;
      } else if (rem.remainingPercentage !== undefined || rem.remainingPercent !== undefined) {
        rawPct = rem.remainingPercentage !== undefined ? rem.remainingPercentage : rem.remainingPercent;
      }
    }
    let remainingFraction;
    if (typeof rawFrac === 'number' && Number.isFinite(rawFrac)) {
      remainingFraction = Math.max(0, Math.min(1, rawFrac));
    } else if (typeof rawFrac === 'string' && rawFrac.trim() !== '' && Number.isFinite(Number(rawFrac))) {
      remainingFraction = Math.max(0, Math.min(1, Number(rawFrac)));
    } else if (rawPct !== undefined && rawPct !== null && rawPct !== '' && Number.isFinite(Number(rawPct))) {
      remainingFraction = Math.max(0, Math.min(1, Number(rawPct) / 100));
    } else {
      remainingFraction = (resetTimeMs > Date.now()) ? 0 : 1;
    }
    return {
      remainingFraction,
      resetTimeMs,
      resetTime: resetTimeMs > 0 ? new Date(resetTimeMs).toISOString() : ''
    };
  }

  function hasExplicitQuotaFields(obj) {
    if (!obj || typeof obj !== 'object') return false;
    return (
      obj.remainingFraction !== undefined ||
      obj.remaining_fraction !== undefined ||
      obj.remainingPercentage !== undefined ||
      obj.remainingPercent !== undefined ||
      (obj.remaining && typeof obj.remaining === 'object' && obj.remaining.value !== undefined) ||
      obj.resetTime !== undefined ||
      obj.reset_time !== undefined ||
      obj.resetTimeMs !== undefined ||
      obj.reset_time_ms !== undefined ||
      obj.resetsAt !== undefined ||
      obj.resets_at !== undefined ||
      obj.refreshTime !== undefined ||
      obj.refresh_time !== undefined
    );
  }

  function normalizeBucketQuota(raw) {
    if (!raw || typeof raw !== 'object') return null;
    const inner = (raw.quotaInfo && typeof raw.quotaInfo === 'object') ? raw.quotaInfo : raw;
    if (!hasExplicitQuotaFields(inner)) return null;
    return normalizeQuotaInfo(inner);
  }

  function classifyQuotaBucketType(bucket, keyHint = '') {
    const hintParts = [
      keyHint,
      bucket && bucket.window,
      bucket && bucket.bucketId,
      bucket && bucket.displayName,
      bucket && bucket.bucketType,
      bucket && bucket.windowType,
      bucket && bucket.type,
      bucket && bucket.period,
      bucket && bucket.interval,
      bucket && bucket.name,
      bucket && bucket.id,
      bucket && bucket.label,
      bucket && bucket.duration,
      bucket && bucket.windowDuration
    ].filter(v => v !== undefined && v !== null).map(v => String(v).toLowerCase());
    const combined = hintParts.join(' ');
    if (/(weekly|7\s*d|1\s*w|168\s*h|604800|week)/i.test(combined)) return 'weekly';
    if (/(5\s*h|five.?hour|5_hour|fivehour|300\s*m|18000|hourly|session)/i.test(combined)) return 'fiveHour';

    const sec = Number(
      (bucket && (bucket.windowSeconds ?? bucket.durationSeconds ?? bucket.windowDurationSeconds ?? bucket.periodSeconds)) || 0
    );
    if (Number.isFinite(sec) && sec > 0) {
      if (sec >= 2 * 86400) return 'weekly';
      if (sec <= 86400) return 'fiveHour';
    }
    return '';
  }

  function parseQuotaSummaryResponse(res) {
    if (!res || typeof res !== 'object') return null;
    const resp = (res.response && typeof res.response === 'object') ? res.response : res;
    const rawGroups = resp.groups;
    if (!rawGroups || typeof rawGroups !== 'object') return null;

    const activeGroupId = String(resp.activeGroupId || resp.activeGroup || resp.currentGroupId || '').trim().toLowerCase();
    const groupEntries = Array.isArray(rawGroups)
      ? rawGroups.map((g, idx) => [String((g && (g.groupId || g.id || g.name || g.displayName)) || idx), g])
      : Object.entries(rawGroups);

    const groups = [];
    for (const [entryKey, g] of groupEntries) {
      if (!g || typeof g !== 'object') continue;
      const id = String(g.groupId || g.id || g.name || g.displayName || entryKey || '').trim();
      const name = String(g.name || g.groupName || g.displayName || id).trim();
      const label = String(g.label || g.displayName || name || id).trim();
      const pool = String(g.pool || g.quotaPool || g.displayName || id || name).trim().toLowerCase();
      const rawModels = Array.isArray(g.models) ? g.models
        : (Array.isArray(g.modelIds) ? g.modelIds
        : (Array.isArray(g.supportedModels) ? g.supportedModels : []));
      const models = rawModels
        .map(m => (typeof m === 'string' ? m : (m && (m.model || m.modelId || m.id || (m.modelOrAlias && m.modelOrAlias.model))) || ''))
        .filter(Boolean);
      if (models.length === 0 && typeof g.description === 'string') {
        const descMatch = g.description.match(/models within this group:\s*([^\n.]+)/i);
        if (descMatch && descMatch[1]) {
          for (const part of descMatch[1].split(',')) {
            const trimmed = part.trim();
            if (trimmed) models.push(trimmed);
          }
        }
      }

      let fiveHour = null;
      let weekly = null;

      const direct5h = g.fiveHour || g.five_hour || g['5h'] || g.fiveHourBucket || g.fiveHourQuota || g.shortWindow || g.primary;
      const directWk = g.weekly || g.weeklyBucket || g.weeklyQuota || g['7d'] || g['1w'] || g.secondary;
      if (direct5h) fiveHour = normalizeBucketQuota(direct5h);
      if (directWk) weekly = normalizeBucketQuota(directWk);

      const bucketContainer = g.buckets || g.quotaBuckets || g.quotas || g.windows || g.limits;
      if (bucketContainer && typeof bucketContainer === 'object') {
        const bucketEntries = Array.isArray(bucketContainer)
          ? bucketContainer.map(b => ['', b])
          : Object.entries(bucketContainer);
        for (const [bKey, bVal] of bucketEntries) {
          if (!bVal || typeof bVal !== 'object') continue;
          const kind = classifyQuotaBucketType(bVal, bKey);
          const norm = normalizeBucketQuota(bVal);
          if (!norm) continue;
          if (kind === 'fiveHour' && !fiveHour) fiveHour = norm;
          else if (kind === 'weekly' && !weekly) weekly = norm;
        }
      }

      if (!fiveHour && g.quotaInfo) {
        fiveHour = normalizeBucketQuota(g.quotaInfo);
      }

      if (!fiveHour && !weekly) continue;

      const isActive = Boolean(
        g.isActive ||
        g.active ||
        g.isSelected ||
        (activeGroupId && (id.toLowerCase() === activeGroupId || name.toLowerCase() === activeGroupId))
      );

      groups.push({
        id,
        name,
        label,
        pool,
        models,
        isActive,
        fiveHour,
        weekly
      });
    }

    if (groups.length === 0) return null;
    return { groups };
  }

  function extractStepEstimateText(step) {
    if (!step || typeof step !== 'object') return '';
    const parts = [];
    try {
      if (step.userInput) {
        const ui = step.userInput;
        if (typeof ui.userResponse === 'string') parts.push(ui.userResponse);
        if (typeof ui.text === 'string') parts.push(ui.text);
        if (Array.isArray(ui.items)) {
          for (const it of ui.items) {
            if (it && typeof it.text === 'string') parts.push(it.text);
          }
        }
      }
      if (step.plannerResponse) {
        const pr = step.plannerResponse;
        if (typeof pr.response === 'string') parts.push(pr.response);
        if (typeof pr.thinking === 'string') parts.push(pr.thinking);
        if (typeof pr.text === 'string') parts.push(pr.text);
      }
      if (step.metadata && step.metadata.toolCall && typeof step.metadata.toolCall.argumentsJson === 'string') {
        parts.push(step.metadata.toolCall.argumentsJson);
      }
      if (typeof step.content === 'string') parts.push(step.content);
      else if (Array.isArray(step.content)) {
        for (const c of step.content) {
          if (typeof c === 'string') parts.push(c);
          else if (c && typeof c.text === 'string') parts.push(c.text);
        }
      }
      if (typeof step.text === 'string' && !parts.includes(step.text)) parts.push(step.text);
      if (typeof step.thinking === 'string' && !parts.includes(step.thinking)) parts.push(step.thinking);
      if (typeof step.response === 'string' && !parts.includes(step.response)) parts.push(step.response);
      if (typeof step.message === 'string') parts.push(step.message);
      const toolCalls = step.toolCalls || step.tool_calls;
      if (Array.isArray(toolCalls)) {
        for (const tc of toolCalls) {
          if (!tc) continue;
          const args = tc.arguments || tc.args || tc.argumentsJson || (tc.function && tc.function.arguments);
          if (typeof args === 'string') parts.push(args);
          else if (args && typeof args === 'object') parts.push(JSON.stringify(args));
        }
      }
    } catch {}
    return parts.join('\n');
  }

  function isLikelyStepsArray(arr) {
    if (!Array.isArray(arr) || arr.length === 0) return false;
    const sample = arr[arr.length - 1] || arr[0];
    if (!sample || typeof sample !== 'object') return false;
    return Boolean(
      sample.userInput ||
      sample.plannerResponse ||
      sample.metadata ||
      sample.modelUsage ||
      sample.stepIndex !== undefined ||
      sample.step_index !== undefined ||
      (typeof sample.type === 'string' && (sample.content !== undefined || sample.thinking !== undefined || sample.tool_calls !== undefined)) ||
      (typeof sample.role === 'string' && (sample.content !== undefined || sample.text !== undefined || sample.parts !== undefined))
    );
  }

  function inspectObjectForContext(obj, result, depth = 0) {
    if (!obj || typeof obj !== 'object' || depth > 2) return;
    try {
      if (!result.conversationId) {
        const cid = obj.conversationId || obj.cascadeId || obj.trajectoryId ||
          (obj.value && (obj.value.conversationId || obj.value.cascadeId)) ||
          (obj.conversation && (obj.conversation.id || obj.conversation.conversationId || obj.conversation.cascadeId)) ||
          (obj.trajectory && (obj.trajectory.cascadeId || obj.trajectory.conversationId || obj.trajectory.trajectoryId)) || '';
        if (typeof cid === 'string' && cid.length > 3) result.conversationId = cid;
      }
      const mc = obj.currentModelConfig || obj.selectedModelConfig || obj.modelConfig ||
        (obj.value && (obj.value.currentModelConfig || obj.value.selectedModelConfig || obj.value.modelConfig)) || null;
      if (mc && typeof mc === 'object') {
        const mid = (mc.modelOrAlias && mc.modelOrAlias.model) || mc.modelId || mc.model || '';
        if (!result.modelId && mid) {
          result.modelId = mid;
          result.modelLabel = mc.label || mc.displayName || '';
        }
        if (mc.quotaInfo && (!result.quotaInfo || parseResetTimeMs(mc.quotaInfo.resetTime || mc.quotaInfo.reset_time) > 0)) {
          result.quotaInfo = mc.quotaInfo;
        }
      } else if (!result.modelId && typeof obj.modelId === 'string' && obj.modelId.trim() && (obj.conversationId || obj.cascadeId || obj.label || obj.displayName)) {
        result.modelId = obj.modelId.trim();
        if (!result.modelLabel && (obj.label || obj.displayName)) {
          result.modelLabel = String(obj.label || obj.displayName);
        }
      }
      if (obj.quotaInfo && typeof obj.quotaInfo === 'object' && (!result.quotaInfo || parseResetTimeMs(obj.quotaInfo.resetTime || obj.quotaInfo.reset_time) > 0)) {
        result.quotaInfo = obj.quotaInfo;
      }
      if (!result.fiberModelConfigs) {
        const cfgList = obj.clientModelConfigs || obj.modelConfigs ||
          (obj.cascadeModelConfigData && obj.cascadeModelConfigData.clientModelConfigs) ||
          (obj.userStatus && obj.userStatus.cascadeModelConfigData && obj.userStatus.cascadeModelConfigData.clientModelConfigs) ||
          (obj.value && (obj.value.clientModelConfigs || obj.value.modelConfigs));
        if (Array.isArray(cfgList) && cfgList.length > 0) result.fiberModelConfigs = cfgList;
      }
      const candidateSteps = obj.steps || obj.trajectorySteps || obj.messages || obj.turns ||
        (obj.trajectory && obj.trajectory.steps) ||
        (obj.conversation && (obj.conversation.steps || obj.conversation.messages || obj.conversation.turns)) ||
        (obj.value && (obj.value.steps || (obj.value.trajectory && obj.value.trajectory.steps) || obj.value.messages));
      if (isLikelyStepsArray(candidateSteps)) {
        if (!result.fiberSteps || candidateSteps.length >= result.fiberSteps.length) result.fiberSteps = candidateSteps;
      } else if (isLikelyStepsArray(obj)) {
        if (!result.fiberSteps || obj.length >= result.fiberSteps.length) result.fiberSteps = obj;
      }
      if (typeof obj.isRunning === 'boolean' && obj.isRunning) result.isRunning = true;
      if (typeof obj.stepCount === 'number' && obj.stepCount > result.fiberStepCount) result.fiberStepCount = obj.stepCount;
    } catch {}
  }

  /**
   * Determine if a single trajectory step represents a finalized model call with token usage.
   */
  function isStepFinalizedModelCall(step, isTrajectoryRunning = false, indexInSteps = 0, totalStepsLen = 1) {
    if (!step || typeof step !== 'object') return false;
    const meta = step.metadata || step;
    const mu = meta.modelUsage || step.modelUsage || (step.checkpoint && step.checkpoint.modelUsage) || step.usage || null;
    if (!mu || typeof mu !== 'object') return false;

    const stepModel = (mu && (mu.model || mu.modelId)) || meta.generatorModel || step.model || '';
    if (isShadowOrImageModel(stepModel)) return false;

    const inTok = Number(mu.inputTokens ?? mu.promptTokens ?? 0);
    const cacheTok = Number(mu.cacheReadTokens ?? mu.cachedTokens ?? 0);
    const outTok = Number(mu.outputTokens ?? mu.completionTokens ?? 0);
    if ((inTok + cacheTok + outTok) <= 0 || outTok <= 0) return false;

    const statusStr = String(step.status || '').toUpperCase();
    if (statusStr.includes('RUNNING') || statusStr.includes('STREAMING') || statusStr.includes('PENDING')) return false;

    const hasFinishMarker = Boolean(
      statusStr.includes('DONE') ||
      statusStr.includes('COMPLETE') ||
      statusStr.includes('FINAL') ||
      meta.finishedGeneratingAt ||
      meta.completedAt ||
      step.finishedGeneratingAt ||
      step.completedAt ||
      step.done === true ||
      meta.generatorMetadata?.chatModel?.finishReason ||
      mu.responseId ||
      mu.messageId ||
      !isTrajectoryRunning ||
      indexInSteps < totalStepsLen - 1
    );
    return hasFinishMarker;
  }

  /**
   * Create the single-source TelemetryHub coordinating passive fetch sniffing, GetUserStatus caching,
   * active conversation step polling, session context snapshots, and finalized call extraction.
   */
  function createTelemetryHub(options = {}) {
    const win = options.window || (typeof window !== 'undefined' ? window : null);
    const doc = options.document || (typeof document !== 'undefined' ? document : null);
    const loc = options.location || (win && win.location) || (typeof location !== 'undefined' ? location : null);
    const storage = options.storage || (win && win.localStorage) || (typeof localStorage !== 'undefined' ? localStorage : null);
    const nav = options.navigator || (win && win.navigator) || (typeof navigator !== 'undefined' ? navigator : null);
    const core = options.core || (root && (root.__AGUsageCore || root.__AGContextMeterCore)) || null;
    const userStatusTtlMs = Number(options.userStatusTtlMs) > 0 ? Number(options.userStatusTtlMs) : USER_STATUS_TTL_MS;
    const pollIntervalMs = Number(options.pollIntervalMs) > 0 ? Number(options.pollIntervalMs) : POLL_INTERVAL_MS;

    const sessionCache = new Map();
    const sessionUsageMap = new Map();
    const sniffedStepsMap = new Map();
    const domStreamTracker = new Map();
    const trajectoriesMap = new Map();
    const tailMetadataCheckedStepCount = new Map();
    const reportedCallOutputs = new Map();
    const modelCapabilitiesMap = new Map();
    const modelDisplayNameMap = new Map();
    const observedBudgetMap = new Map();

    const sessionSubscribers = new Set();
    const callsSubscribers = new Set();
    const userStatusSubscribers = new Set();
    const languageSubscribers = new Set();

    let sniffedCsrfToken = '';
    let panelAutoIdCounter = 0;
    let pollTimer = null;
    let isPolling = false;
    let inFlightUserStatus = null;
    let inFlightAvailableModels = null;
    let inFlightQuotaSummary = null;
    let lastAvailableModelsFetchAt = 0;
    let snifferInstalled = false;
    let origFetch = null;
    let wrappedFetch = null;
    let started = false;
    let disposed = false;

    const quotaSummaryTimers = new Set();
    let quotaSummaryCache = {
      fetchedAt: 0,
      parsed: null
    };

    const userStatusCache = {
      fetchedAt: 0,
      raw: null,
      planName: '',
      tierName: '',
      defaultModelId: '',
      modelConfigs: []
    };

    let lastZhVariant = 'zh-CN';
    let currentLanguage = (() => {
      try {
        const savedFull = normalizePanelLanguage(storage && storage.getItem('__ag_usage_lang__'));
        if (savedFull) {
          if (savedFull === 'zh-TW' || savedFull === 'zh-CN') lastZhVariant = savedFull;
          return savedFull;
        }
        const savedShort = normalizePanelLanguage(storage && storage.getItem('__agy_ctx_lang__'));
        if (savedShort) return savedShort;
      } catch {}
      try {
        const sysLang = (nav && nav.language) || (doc && doc.documentElement && doc.documentElement.lang) || 'zh-CN';
        return normalizePanelLanguage(sysLang) || 'zh-CN';
      } catch {
        return 'zh-CN';
      }
    })();

    function getLanguage() {
      return currentLanguage;
    }

    function getShortLanguage() {
      return toShortLanguage(currentLanguage);
    }

    function setLanguage(lang, opts = {}) {
      const normalized = normalizePanelLanguage(lang);
      if (!normalized || normalized === currentLanguage) return currentLanguage;
      if (normalized === 'zh-CN' || normalized === 'zh-TW') lastZhVariant = normalized;
      currentLanguage = normalized;
      try {
        if (storage) {
          storage.setItem('__ag_usage_lang__', normalized);
          storage.setItem('__agy_ctx_lang__', toShortLanguage(normalized));
        }
      } catch {}
      if (!opts.silent) {
        for (const cb of languageSubscribers) {
          try { cb(currentLanguage, toShortLanguage(currentLanguage), opts); } catch {}
        }
      }
      return currentLanguage;
    }

    function toggleShortLanguage() {
      const next = toShortLanguage(currentLanguage) === 'zh' ? 'en' : lastZhVariant;
      return setLanguage(next, { source: 'capsule' });
    }

    function resolveModelDisplayName(modelId, fallbackLabel) {
      if (fallbackLabel) return fallbackLabel;
      if (!modelId) return getShortLanguage() === 'en' ? 'Default Model' : '默认模型';
      const normTarget = normalizeModelCapKey(modelId);
      const canonTarget = canonicalizeModelCapKey(modelId);
      for (const c of userStatusCache.modelConfigs) {
        if (!c || typeof c !== 'object') continue;
        const ids = [
          c.modelOrAlias && c.modelOrAlias.model,
          c.modelOrAlias && c.modelOrAlias.alias,
          c.modelId,
          c.model
        ].filter(Boolean);
        if (ids.some(id => id === modelId || (normTarget && normalizeModelCapKey(id) === normTarget) || (canonTarget && canonicalizeModelCapKey(id) === canonTarget))) {
          return c.label || c.displayName || modelId;
        }
      }
      if (normTarget && modelDisplayNameMap.has(normTarget)) {
        return modelDisplayNameMap.get(normTarget);
      }
      const m = String(modelId);
      const mCode = m.match(/(?:^|_)M(\d+)(?:$|[^0-9])/i);
      if (mCode) {
        const mapped = KNOWN_MODEL_DISPLAY_NAMES['M' + mCode[1]];
        if (mapped) return mapped;
      }
      if (m.toUpperCase().includes('GPT_OSS') || m.toUpperCase().includes('GPT-OSS')) return 'GPT-OSS 120B (Medium)';
      return m.replace(/^MODEL_PLACEHOLDER_/, '').replace(/^MODEL_/, '');
    }

    function isSameOriginUrl(input) {
      try {
        let rawUrl = '';
        if (typeof input === 'string') rawUrl = input.trim();
        else if (typeof URL !== 'undefined' && input instanceof URL) rawUrl = input.href;
        else if (input && typeof input === 'object') rawUrl = String(input.url || input.href || '').trim();
        if (!rawUrl) return false;
        if (!/^[a-zA-Z][a-zA-Z\d+\-.]*:/.test(rawUrl) && !rawUrl.startsWith('//')) return true;
        if (!loc || !loc.origin || loc.origin === 'null') return false;
        const resolved = new URL(rawUrl, loc.href || loc.origin);
        return resolved.origin === loc.origin;
      } catch {
        return false;
      }
    }

    function registerModelCapability(rawIds, label, maxTokens, maxOutputTokens, source = 'catalog') {
      const mt = extractPositiveInt(maxTokens);
      if (!mt) return;
      const mo = (maxOutputTokens !== undefined && maxOutputTokens !== null && maxOutputTokens !== '' && Number.isFinite(Number(maxOutputTokens)) && Number(maxOutputTokens) >= 0)
        ? Math.round(Number(maxOutputTokens))
        : null;
      const entry = { maxTokens: mt, maxOutputTokens: mo, source };
      const idList = Array.isArray(rawIds) ? rawIds : [rawIds];
      const cleanLabel = typeof label === 'string' ? label.trim() : '';
      for (const rawId of idList) {
        const k = normalizeModelCapKey(rawId);
        if (k) {
          modelCapabilitiesMap.set(k, entry);
          if (cleanLabel) modelDisplayNameMap.set(k, cleanLabel);
        }
      }
      const kLabel = normalizeModelCapKey(cleanLabel);
      if (kLabel) modelCapabilitiesMap.set(kLabel, entry);
    }

    function applyAvailableModelsPayload(data) {
      if (!data || typeof data !== 'object') return false;
      const modelsObj =
        (data.response && (data.response.models || data.response.availableModels)) ||
        data.models ||
        data.availableModels;
      if (!modelsObj || typeof modelsObj !== 'object') return false;
      const entries = Array.isArray(modelsObj)
        ? modelsObj.map(item => ['', item])
        : Object.entries(modelsObj);
      let added = 0;
      for (const [entryKey, d] of entries) {
        if (!d || typeof d !== 'object') continue;
        const mt = extractCatalogMaxTokens(d);
        if (!mt) continue;
        const mo = extractCatalogMaxOutputTokens(d);
        const keyId = typeof entryKey === 'string' && !/^\d+$/.test(entryKey) ? entryKey.trim() : '';
        const ids = [
          d.model,
          d.modelId,
          d.modelOrAlias && d.modelOrAlias.model,
          d.modelOrAlias && d.modelOrAlias.alias,
          d.vertexModelId,
          keyId
        ].filter(v => typeof v === 'string' && v.trim());
        const displayName = d.displayName || d.label || '';
        registerModelCapability(ids, displayName, mt, mo, 'get_available_models');
        added++;
      }
      if (added > 0) lastAvailableModelsFetchAt = Date.now();
      return added > 0;
    }

    function applyUserStatusPayload(rawPayload) {
      if (!rawPayload || typeof rawPayload !== 'object') return false;
      const us = rawPayload.userStatus || (rawPayload.cascadeModelConfigData ? rawPayload : null);
      if (!us) return false;
      const nextRaw = rawPayload.userStatus ? rawPayload : { userStatus: us };
      userStatusCache.fetchedAt = Date.now();
      userStatusCache.raw = nextRaw;
      userStatusCache.planName = (us.planStatus && us.planStatus.planInfo && us.planStatus.planInfo.planName) || '';
      userStatusCache.tierName = (us.userTier && us.userTier.name) || '';
      const defaultModel = us.cascadeModelConfigData && us.cascadeModelConfigData.defaultOverrideModelConfig &&
        us.cascadeModelConfigData.defaultOverrideModelConfig.modelOrAlias &&
        us.cascadeModelConfigData.defaultOverrideModelConfig.modelOrAlias.model;
      if (defaultModel) userStatusCache.defaultModelId = defaultModel;
      userStatusCache.modelConfigs = (us.cascadeModelConfigData && Array.isArray(us.cascadeModelConfigData.clientModelConfigs))
        ? us.cascadeModelConfigData.clientModelConfigs
        : userStatusCache.modelConfigs;
      for (const c of userStatusCache.modelConfigs) {
        if (!c || typeof c !== 'object') continue;
        const mt = extractCatalogMaxTokens(c);
        if (mt) {
          const ids = [
            c.modelOrAlias && c.modelOrAlias.model,
            c.modelOrAlias && c.modelOrAlias.alias,
            c.modelId,
            c.model
          ].filter(v => typeof v === 'string' && v.trim());
          registerModelCapability(ids, c.label || c.displayName || '', mt, extractCatalogMaxOutputTokens(c), 'user_status');
        }
      }
      for (const cb of userStatusSubscribers) {
        try { cb(userStatusCache.raw); } catch {}
      }
      return true;
    }

    function installNetworkSniffer() {
      if (snifferInstalled || !win || typeof win.fetch !== 'function') return;
      origFetch = win.fetch;
      snifferInstalled = true;

      wrappedFetch = async function (...args) {
        if (disposed || !isSameOriginUrl(args[0])) {
          return origFetch.apply(this, args);
        }

        let reqBodyCid = '';
        try {
          const init = args[1];
          if (init && init.headers) {
            if (typeof init.headers.get === 'function') {
              const t = init.headers.get('x-codeium-csrf-token');
              if (t) sniffedCsrfToken = t;
            } else if (typeof init.headers === 'object') {
              const t = init.headers['x-codeium-csrf-token'] || init.headers['X-Codeium-Csrf-Token'];
              if (t) sniffedCsrfToken = t;
            }
          }
          if (init && typeof init.body === 'string' && init.body.length <= 65536 && init.body.startsWith('{')) {
            const parsedReq = JSON.parse(init.body);
            reqBodyCid = parsedReq.cascadeId || parsedReq.conversationId || parsedReq.id || '';
          }
        } catch {}

        const resp = await origFetch.apply(this, args);
        try {
          const hasHeadersGet = Boolean(resp && resp.headers && typeof resp.headers.get === 'function');
          const ct = hasHeadersGet ? (resp.headers.get('content-type') || '') : '';
          const cl = hasHeadersGet ? resp.headers.get('content-length') : null;
          const clAllowed = cl === null || cl === undefined || cl === '' || Number(cl) <= 5 * 1024 * 1024;
          if (ct.toLowerCase().includes('application/json') && clAllowed && typeof resp.clone === 'function') {
            const clone = resp.clone();
            clone.json().then((data) => {
              if (!data || typeof data !== 'object' || disposed) return;
              if (data.userStatus || (data.cascadeModelConfigData && Array.isArray(data.cascadeModelConfigData.clientModelConfigs))) {
                applyUserStatusPayload(data);
              }
              if (data.models || data.availableModels || (data.response && (data.response.models || data.response.availableModels))) {
                if (applyAvailableModelsPayload(data)) notifySessionSubscribers();
              }
              if (data.groups || (data.response && data.response.groups)) {
                const sniffedQuotaSummary = parseQuotaSummaryResponse(data);
                if (sniffedQuotaSummary) {
                  quotaSummaryCache = { fetchedAt: Date.now(), parsed: sniffedQuotaSummary };
                  notifySessionSubscribers();
                }
              }
              if (Array.isArray(data.generatorMetadata) && data.generatorMetadata.length > 0) {
                const gmCid = normalizeCidKey(data.cascadeId || reqBodyCid);
                let budgetUpdated = false;
                for (const row of data.generatorMetadata) {
                  const rowModel = (row && row.chatModel && (row.chatModel.model || row.chatModel.modelId)) || '';
                  if (isShadowOrImageModel(rowModel)) continue;
                  const ctxMeta = row && row.chatModel && row.chatModel.chatStartMetadata && row.chatModel.chatStartMetadata.contextWindowMetadata;
                  const cpMax = row && row.plannerConfig && row.plannerConfig.checkpointConfig && row.plannerConfig.checkpointConfig.maxTokenLimit;
                  const maxCtx = Number((ctxMeta && ctxMeta.maxContextTokens) || cpMax || 0);
                  if (gmCid && Number.isFinite(maxCtx) && maxCtx >= 16000) {
                    setBoundedMap(observedBudgetMap, gmCid, Math.round(maxCtx));
                    budgetUpdated = true;
                  }
                }
                if (budgetUpdated) notifySessionSubscribers();
              }
              if (data.trajectorySummaries && typeof data.trajectorySummaries === 'object') {
                for (const [k, v] of Object.entries(data.trajectorySummaries)) {
                  trajectoriesMap.set(k, v);
                  const sk = normalizeCidKey(k);
                  if (sk) trajectoriesMap.set(sk, v);
                }
              }
              const stepsArr = Array.isArray(data.steps) ? data.steps
                : (data.trajectory && Array.isArray(data.trajectory.steps) ? data.trajectory.steps
                : (Array.isArray(data.turns) ? data.turns
                : (Array.isArray(data.messages) ? data.messages : null)));
              if (stepsArr && stepsArr.length > 0) {
                const cid = data.cascadeId || data.conversationId || (data.trajectory && (data.trajectory.cascadeId || data.trajectory.conversationId)) || reqBodyCid || '__latest_sniffed__';
                setBoundedMap(sniffedStepsMap, cid, stepsArr);
                const shortKey = normalizeCidKey(cid);
                if (shortKey && shortKey !== cid) setBoundedMap(sniffedStepsMap, shortKey, stepsArr);
              }
            }).catch(() => {});
          }
        } catch {}
        return resp;
      };
      win.fetch = wrappedFetch;
    }

    function getCsrfToken() {
      try {
        if (win && win.__APP_CONFIG__ && win.__APP_CONFIG__.csrfToken) {
          return win.__APP_CONFIG__.csrfToken;
        }
      } catch {}
      return sniffedCsrfToken || '';
    }

    async function callLsRpc(method, body, timeoutMs = 6000) {
      if (disposed) return null;
      const fetchFn = origFetch || (win && win.fetch);
      if (typeof fetchFn !== 'function') return null;
      const csrf = getCsrfToken();
      const hasAbort = typeof AbortController !== 'undefined';
      const ctrl = hasAbort ? new AbortController() : null;
      const timer = ctrl ? setTimeout(() => ctrl.abort(), timeoutMs) : null;
      try {
        const headers = {
          'Content-Type': 'application/json',
          'Connect-Protocol-Version': '1'
        };
        if (csrf) headers['x-codeium-csrf-token'] = csrf;
        const resp = await fetchFn.call(win, '/exa.language_server_pb.LanguageServerService/' + method, {
          method: 'POST',
          headers,
          credentials: 'same-origin',
          body: JSON.stringify(body || {}),
          signal: ctrl ? ctrl.signal : undefined
        });
        if (!resp || !resp.ok) return null;
        return await resp.json();
      } catch {
        return null;
      } finally {
        if (timer) clearTimeout(timer);
      }
    }

    async function refreshUserStatus(force = false) {
      const now = Date.now();
      if (!force && userStatusCache.fetchedAt > 0 && (now - userStatusCache.fetchedAt < userStatusTtlMs) && userStatusCache.raw) {
        return userStatusCache.raw;
      }
      if (inFlightUserStatus) return inFlightUserStatus;

      inFlightUserStatus = (async () => {
        try {
          const usResp = await callLsRpc('GetUserStatus', {
            metadata: { ideName: 'antigravity', extensionName: 'antigravity' }
          });
          if (usResp && usResp.userStatus) {
            applyUserStatusPayload(usResp);
          }
          return userStatusCache.raw;
        } finally {
          inFlightUserStatus = null;
        }
      })();
      return inFlightUserStatus;
    }

    async function refreshAvailableModels(force = false) {
      const now = Date.now();
      if (!force && lastAvailableModelsFetchAt > 0 && (now - lastAvailableModelsFetchAt < AVAILABLE_MODELS_TTL_MS) && modelCapabilitiesMap.size > 0) {
        return modelCapabilitiesMap;
      }
      if (inFlightAvailableModels) return inFlightAvailableModels;

      inFlightAvailableModels = (async () => {
        try {
          let resp = await callLsRpc('GetAvailableModels', { forceRefresh: Boolean(force) });
          if (!resp) {
            resp = await callLsRpc('GetAvailableModels', {
              metadata: { ideName: 'antigravity', extensionName: 'antigravity' }
            });
          }
          if (resp) applyAvailableModelsPayload(resp);
          return modelCapabilitiesMap;
        } finally {
          inFlightAvailableModels = null;
        }
      })();
      return inFlightAvailableModels;
    }

    function findRetrieveUserQuotaSummary() {
      if (!doc || disposed) return null;
      try {
        const findFiber = (dom) => {
          if (!dom) return null;
          const keys = Object.keys(dom);
          for (let i = 0; i < keys.length; i++) {
            const k = keys[i];
            if (k.startsWith('__reactFiber$') || k.startsWith('__reactInternalInstance$')) return dom[k];
          }
          return null;
        };

        const footers = doc.querySelectorAll ? Array.from(doc.querySelectorAll('.agy-composer-footer')) : [];
        const startNodes = [];
        for (const f of footers) {
          if (f.querySelectorAll) {
            for (const b of Array.from(f.querySelectorAll('button')).slice(0, 12)) {
              if (!startNodes.includes(b)) startNodes.push(b);
            }
          }
          if (!startNodes.includes(f)) startNodes.push(f);
          if (f.parentElement && !startNodes.includes(f.parentElement)) startNodes.push(f.parentElement);
        }
        if (doc.querySelectorAll) {
          for (const b of Array.from(doc.querySelectorAll('button')).slice(0, 30)) {
            if (!startNodes.includes(b)) startNodes.push(b);
          }
        }
        if (doc.body && !startNodes.includes(doc.body)) startNodes.push(doc.body);

        const visited = new Set();
        for (const node of startNodes) {
          let cur = findFiber(node);
          let depth = 0;
          while (cur && depth < 100) {
            depth++;
            if (visited.has(cur)) {
              cur = cur.return;
              continue;
            }
            visited.add(cur);
            const candidates = [];
            if (cur.memoizedProps && typeof cur.memoizedProps === 'object') {
              candidates.push(cur.memoizedProps.value);
            }
            let dep = cur.dependencies && cur.dependencies.firstContext;
            let depDepth = 0;
            while (dep && typeof dep === 'object' && depDepth < 24) {
              depDepth++;
              if (dep.memoizedValue && typeof dep.memoizedValue === 'object') {
                candidates.push(dep.memoizedValue);
              }
              dep = dep.next;
            }
            for (const val of candidates) {
              if (val && typeof val === 'object' && typeof val.retrieveUserQuotaSummary === 'function') {
                return { fn: val.retrieveUserQuotaSummary, ctxObj: val };
              }
            }
            cur = cur.return;
          }
        }
      } catch {}
      return null;
    }

    function selectActiveQuotaGroup(groups, modelId, modelLabel) {
      if (!Array.isArray(groups) || groups.length === 0) return null;
      const normId = normalizeModelCapKey(modelId);
      const canonId = canonicalizeModelCapKey(modelId);
      const normLabel = normalizeModelCapKey(modelLabel);

      if (normId || normLabel) {
        const modelMatch = groups.find(g => Array.isArray(g.models) && g.models.some(m => {
          const nm = normalizeModelCapKey(m);
          const cm = canonicalizeModelCapKey(m);
          return (normId && (nm === normId || cm === canonId)) ||
            (normLabel && (nm === normLabel || cm === canonicalizeModelCapKey(modelLabel) || (nm && normLabel.includes(nm))));
        }));
        if (modelMatch) return modelMatch;
      }

      const pool = getQuotaPoolForModel(modelId, modelLabel);
      if (pool) {
        const poolMatch = groups.find(g => {
          const gHint = `${g.pool || ''} ${g.id || ''} ${g.name || ''} ${g.label || ''}`.toLowerCase();
          if (pool === 'gemini') return gHint.includes('gemini');
          if (pool === 'premium') {
            return gHint.includes('premium') || gHint.includes('claude') || gHint.includes('gpt') || gHint.includes('anthropic') || gHint.includes('openai');
          }
          return gHint.includes(pool);
        });
        if (poolMatch) return poolMatch;
      }

      const activeGroup = groups.find(g => g.isActive);
      return activeGroup || groups[0];
    }

    async function refreshQuotaSummary(force = false) {
      if (disposed) return null;
      const now = Date.now();
      if (!force && quotaSummaryCache.fetchedAt > 0 && (now - quotaSummaryCache.fetchedAt < QUOTA_SUMMARY_TTL_MS)) {
        return quotaSummaryCache.parsed;
      }
      if (inFlightQuotaSummary) return inFlightQuotaSummary;

      inFlightQuotaSummary = (async () => {
        let timerId = null;
        try {
          const found = findRetrieveUserQuotaSummary();
          let res = null;
          if (found && typeof found.fn === 'function') {
            const rpcPromise = Promise.resolve()
              .then(() => found.fn.call(found.ctxObj, {}))
              .catch(() => null);
            const timeoutPromise = new Promise((resolve) => {
              timerId = setTimeout(() => resolve(null), QUOTA_SUMMARY_TIMEOUT_MS);
              quotaSummaryTimers.add(timerId);
            });
            res = await Promise.race([rpcPromise, timeoutPromise]);
          } else if (getCsrfToken()) {
            res = await callLsRpc('RetrieveUserQuotaSummary', {}, QUOTA_SUMMARY_TIMEOUT_MS);
          } else {
            return null;
          }
          if (disposed) return null;
          const parsed = parseQuotaSummaryResponse(res);
          quotaSummaryCache = {
            fetchedAt: Date.now(),
            parsed
          };
          return parsed;
        } catch {
          return null;
        } finally {
          if (timerId !== null) {
            clearTimeout(timerId);
            quotaSummaryTimers.delete(timerId);
          }
          inFlightQuotaSummary = null;
        }
      })();
      return inFlightQuotaSummary;
    }

    function analyzeSteps(steps, preferredModelId, preferredModelLabel, totalStepCount, cascadeId = '') {
      let baseTokens = 0;
      let inputTokens = 0;
      let cacheReadTokens = 0;
      let cacheCreationTokens = 0;
      let outputTokens = 0;
      let estimatedDelta = 0;
      let estInputSum = 0;
      let estOutputSum = 0;
      let prevCacheInclusiveInput = 0;
      let compressionDetected = false;
      let compressionBefore = 0;
      let compressionAfter = 0;
      let compressionDrop = 0;
      let activeModelId = preferredModelId || '';
      let shadowModelId = '';
      let hasPreciseSnapshot = false;
      let lastTokPerSec = 0;
      let lastDurationSec = 0;
      let timedOutTokensSum = 0;
      let timedDurationSum = 0;
      const shortCid = normalizeCidKey(cascadeId);
      let stepObservedBudget = (shortCid && observedBudgetMap.get(shortCid)) || (cascadeId && observedBudgetMap.get(cascadeId)) || 0;

      if (Array.isArray(steps)) {
        for (const st of steps) {
          if (!st || typeof st !== 'object') continue;
          const meta = st.metadata || st;
          const mu = meta.modelUsage || st.modelUsage || (st.checkpoint && st.checkpoint.modelUsage) || st.usage || null;
          const stepModel = (mu && (mu.model || mu.modelId)) || meta.generatorModel || st.model || '';

          const isShadowStep = isShadowOrImageModel(stepModel);
          const mi = meta.modelInfo || st.modelInfo || (meta.generatorMetadata && meta.generatorMetadata.modelInfo) || null;
          if (mi && typeof mi === 'object') {
            const miMax = extractCatalogMaxTokens(mi);
            const miExplicitIds = [mi.model, mi.modelId, stepModel].filter(Boolean);
            const isShadowMi = isShadowStep || miExplicitIds.some(id => isShadowOrImageModel(id));
            if (miMax && !isShadowMi) {
              const miTargetIds = miExplicitIds.length > 0 ? miExplicitIds : (activeModelId ? [activeModelId] : []);
              if (miTargetIds.length > 0) {
                registerModelCapability(
                  miTargetIds,
                  mi.displayName || mi.label || '',
                  miMax,
                  extractCatalogMaxOutputTokens(mi),
                  'step_model_info'
                );
              }
            }
          }

          if (!isShadowStep) {
            const gmCtx = meta.generatorMetadata && meta.generatorMetadata.chatModel && meta.generatorMetadata.chatStartMetadata && meta.generatorMetadata.chatStartMetadata.contextWindowMetadata;
            const gmCtxAlt = meta.generatorMetadata && meta.generatorMetadata.chatModel && meta.generatorMetadata.chatModel.chatStartMetadata && meta.generatorMetadata.chatModel.chatStartMetadata.contextWindowMetadata;
            const cpMax = (meta.checkpointConfig && meta.checkpointConfig.maxTokenLimit) || (st.checkpointConfig && st.checkpointConfig.maxTokenLimit) || (st.userInput && st.userInput.userConfig && st.userInput.userConfig.checkpointConfig && st.userInput.userConfig.checkpointConfig.maxTokenLimit);
            const candidateBudget = Number((gmCtxAlt && gmCtxAlt.maxContextTokens) || (gmCtx && gmCtx.maxContextTokens) || (mu && mu.maxContextTokens) || cpMax || 0);
            if (Number.isFinite(candidateBudget) && candidateBudget >= 16000) {
              stepObservedBudget = Math.round(candidateBudget);
              if (shortCid) setBoundedMap(observedBudgetMap, shortCid, stepObservedBudget);
            }
          }

          if (!activeModelId && st.userInput && st.userInput.userConfig && st.userInput.userConfig.plannerConfig) {
            const pc = st.userInput.userConfig.plannerConfig;
            const userPicked = pc.planModel || pc.modelName || (pc.requestedModel && pc.requestedModel.model) || '';
            if (userPicked && !isShadowOrImageModel(userPicked)) activeModelId = userPicked;
          }

          if (mu && (mu.inputTokens !== undefined || mu.outputTokens !== undefined || mu.cacheReadTokens !== undefined || mu.promptTokens !== undefined)) {
            if (isShadowOrImageModel(stepModel)) {
              shadowModelId = stepModel;
              continue;
            }
            const inTok = Math.max(0, parseInt(mu.inputTokens || mu.promptTokens || '0', 10) || 0);
            const cacheRead = Math.max(0, parseInt(mu.cacheReadTokens || mu.cachedTokens || '0', 10) || 0);
            const cacheCreate = Math.max(0, parseInt(mu.cacheCreationTokens || '0', 10) || 0);
            const outTok = Math.max(0, parseInt(mu.outputTokens || mu.completionTokens || '0', 10) || 0);
            const cacheInclusiveInput = inTok + cacheRead + cacheCreate;
            const snapshotTotal = cacheInclusiveInput + outTok;

            const tStart = parseResetTimeMs(meta.createdAt || meta.created_at || meta.startedAt || st.createdAt || st.created_at);
            const tEndRaw = meta.finishedGeneratingAt || meta.completedAt || meta.updatedAt || st.finishedGeneratingAt || st.completedAt || st.updatedAt || meta.viewableAt || '';
            const tEnd = parseResetTimeMs(tEndRaw);
            const durSec = (tStart > 0 && tEnd > tStart) ? (tEnd - tStart) / 1000 : 0;
            if (outTok > 0 && durSec >= 0.15 && durSec < 600) {
              lastTokPerSec = Math.round(outTok / durSec);
              lastDurationSec = Number(durSec.toFixed(1));
              timedOutTokensSum += outTok;
              timedDurationSum += durSec;
            }

            if (snapshotTotal > 0) {
              if (prevCacheInclusiveInput > 0 && (prevCacheInclusiveInput - cacheInclusiveInput) > COMPRESSION_MIN_DROP) {
                compressionDetected = true;
                compressionBefore = prevCacheInclusiveInput;
                compressionAfter = cacheInclusiveInput;
                compressionDrop = prevCacheInclusiveInput - cacheInclusiveInput;
              }
              prevCacheInclusiveInput = cacheInclusiveInput;
              baseTokens = snapshotTotal;
              inputTokens = inTok;
              cacheReadTokens = cacheRead;
              cacheCreationTokens = cacheCreate;
              outputTokens = outTok;
              estimatedDelta = 0;
              hasPreciseSnapshot = true;
              if (stepModel && !preferredModelId) activeModelId = stepModel;
              continue;
            }
          }

          const estText = extractStepEstimateText(st);
          if (estText) {
            const stepTok = estimateTokensFromText(estText);
            estimatedDelta += stepTok;
            const stepType = String(st.type || st.role || (st.plannerResponse ? 'PLANNER_RESPONSE' : (st.userInput ? 'USER_INPUT' : ''))).toUpperCase();
            const isPlanner = stepType.includes('PLANNER') || stepType.includes('MODEL') || stepType.includes('ASSISTANT') || Boolean(st.plannerResponse);
            if (isPlanner) {
              estOutputSum += stepTok;
              const tStart = parseResetTimeMs(meta.createdAt || meta.created_at || meta.startedAt || st.createdAt || st.created_at);
              const tEnd = parseResetTimeMs(meta.finishedGeneratingAt || meta.completedAt || meta.updatedAt || st.finishedGeneratingAt || st.completedAt || st.updatedAt);
              const durSec = (tStart > 0 && tEnd > tStart) ? (tEnd - tStart) / 1000 : 0;
              if (stepTok > 5 && durSec >= 0.2 && durSec < 600) {
                lastTokPerSec = Math.round(stepTok / durSec);
                lastDurationSec = Number(durSec.toFixed(1));
                timedOutTokensSum += stepTok;
                timedDurationSum += durSec;
              }
            } else {
              estInputSum += stepTok;
            }
          }
        }
      }

      const actualStepCount = totalStepCount || (Array.isArray(steps) ? steps.length : 0);
      if (!hasPreciseSnapshot && (estimatedDelta > 0 || actualStepCount > 0)) {
        const sysPromptOverhead = actualStepCount > 0 ? 12500 : 0;
        const totalEst = sysPromptOverhead + estimatedDelta;
        baseTokens = totalEst;
        estimatedDelta = 0;
        cacheReadTokens = Math.round(sysPromptOverhead + estInputSum * 0.75);
        inputTokens = Math.max(0, totalEst - cacheReadTokens - estOutputSum);
        outputTokens = estOutputSum;
        hasPreciseSnapshot = totalEst > 0;
      }

      const resolvedModelId = activeModelId || preferredModelId || '';
      const resolvedLabel = resolveModelDisplayName(resolvedModelId, preferredModelLabel);
      const ctxSpec = resolveModelContextSpec(resolvedModelId, resolvedLabel, {
        observedClientBudget: stepObservedBudget,
        modelCapabilities: modelCapabilitiesMap,
        modelConfigs: userStatusCache.modelConfigs
      });
      const finalLimit = ctxSpec.contextLimit;
      const contextUsed = baseTokens + estimatedDelta;
      const usagePercent = finalLimit > 0 ? (contextUsed / finalLimit) * 100 : 0;
      const remainPercent = Math.max(0, 100 - usagePercent);
      const totalInputWithCache = inputTokens + cacheReadTokens + cacheCreationTokens;
      const cacheHitRate = totalInputWithCache > 0 ? (cacheReadTokens / totalInputWithCache) * 100 : 0;
      const avgTokPerSec = timedDurationSum > 0 ? Math.round(timedOutTokensSum / timedDurationSum) : lastTokPerSec;

      return {
        contextUsed,
        contextLimit: finalLimit,
        modelMaxTokens: ctxSpec.modelMaxTokens,
        clientCompactionLimit: ctxSpec.clientCompactionLimit,
        runtimeBudget: ctxSpec.runtimeBudget,
        maxOutputTokens: ctxSpec.maxOutputTokens,
        limitSource: ctxSpec.limitSource,
        usagePercent,
        remainPercent,
        inputTokens,
        cacheReadTokens,
        cacheCreationTokens,
        outputTokens,
        estimatedDelta,
        hasPreciseSnapshot,
        cacheHitRate,
        tokPerSec: lastTokPerSec,
        avgTokPerSec,
        lastDurationSec,
        compressionDetected,
        compressionBefore,
        compressionAfter,
        compressionDrop,
        modelId: resolvedModelId,
        modelDisplayName: resolvedLabel,
        shadowModelId,
        stepCount: actualStepCount
      };
    }

    function findChatPanelContainer(footerEl) {
      let cur = footerEl ? footerEl.parentElement : null;
      let depth = 0;
      let best = footerEl ? footerEl.parentElement : null;
      while (cur && doc && cur !== doc.body && depth < 18) {
        depth++;
        const footersInside = cur.querySelectorAll ? cur.querySelectorAll('.agy-composer-footer').length : 0;
        if (footersInside > 1) break;
        best = cur;
        cur = cur.parentElement;
      }
      return best || (doc ? doc.body : null);
    }

    function extractComposerContext(footerEl) {
      const result = {
        conversationId: '',
        modelId: '',
        modelLabel: '',
        quotaInfo: null,
        fiberModelConfigs: null,
        fiberSteps: null,
        fiberStepCount: 0,
        isRunning: false
      };
      if (!footerEl) return result;

      const findFiber = (dom) => {
        if (!dom) return null;
        const keys = Object.keys(dom);
        for (let i = 0; i < keys.length; i++) {
          const k = keys[i];
          if (k.startsWith('__reactFiber$') || k.startsWith('__reactInternalInstance$')) return dom[k];
        }
        return null;
      };

      const panelEl = findChatPanelContainer(footerEl);
      const permBtn = footerEl.querySelector ? footerEl.querySelector('button[data-testid="permissions-selector-trigger"]') : null;
      const allBtns = footerEl.querySelectorAll ? Array.from(footerEl.querySelectorAll('button')) : [];
      const panelChildren = panelEl && panelEl.querySelectorAll
        ? Array.from(panelEl.querySelectorAll('[data-scroll-container], [role="log"], [role="list"], .overflow-y-auto')).slice(0, 6)
        : [];
      const startNodes = [permBtn, ...allBtns, footerEl, footerEl.parentElement, panelEl, ...panelChildren].filter(Boolean);
      const visitedFibers = new Set();

      for (const node of startNodes) {
        let cur = findFiber(node);
        let depth = 0;
        while (cur && depth < 75) {
          depth++;
          if (visitedFibers.has(cur)) {
            cur = cur.return;
            continue;
          }
          visitedFibers.add(cur);
          if (cur.memoizedProps && typeof cur.memoizedProps === 'object') {
            inspectObjectForContext(cur.memoizedProps, result, 0);
          }
          let hookState = cur.memoizedState;
          let hookDepth = 0;
          while (hookState && typeof hookState === 'object' && hookDepth < 25) {
            hookDepth++;
            if (hookState.memoizedState && typeof hookState.memoizedState === 'object') {
              inspectObjectForContext(hookState.memoizedState, result, 0);
            }
            hookState = hookState.next;
          }
          cur = cur.return;
        }
      }

      if (!result.modelLabel) {
        for (const b of allBtns) {
          if (b.getAttribute && b.getAttribute('data-agy-context-capsule') === '1') continue;
          if (b.getAttribute && b.getAttribute('data-testid') === 'permissions-selector-trigger') continue;
          const txt = (b.textContent || '').trim();
          if (
            txt && (
              txt.includes('Gemini') ||
              txt.includes('Claude') ||
              txt.includes('GPT') ||
              txt.includes('Neon') ||
              txt.includes('Argon') ||
              txt.includes('Hydrogen') ||
              txt.includes('Carbon') ||
              txt.includes('Orchestrator') ||
              txt.includes('Flash') ||
              txt.includes('Opus') ||
              txt.includes('Sonnet') ||
              txt.includes('Haiku')
            )
          ) {
            result.modelLabel = txt;
            break;
          }
        }
      }

      if (!result.conversationId) {
        try {
          const href = String((loc && loc.href) || '');
          const m = href.match(/(?:jetski_remote_agents_3p\/|conversations?\/|cascadeId=)([a-zA-Z0-9_-]{8,})/i);
          if (m && m[1]) result.conversationId = m[1];
        } catch {}
      }

      if (!result.conversationId) {
        if (!footerEl.__agyFallbackCid) {
          panelAutoIdCounter++;
          footerEl.__agyFallbackCid = '__agy_panel_' + panelAutoIdCounter + '__';
        }
        result.conversationId = footerEl.__agyFallbackCid;
      }

      return result;
    }

    function extractPanelTextExcludingFooter(panelEl) {
      if (!panelEl) return '';
      const MAX_CHARS = 260000;
      const chunks = [];
      let totalLen = 0;
      const stack = [panelEl];

      const isExcludedElement = (el) => {
        const tag = String(el.tagName || el.nodeName || '').toUpperCase();
        if (tag === 'SCRIPT' || tag === 'STYLE' || tag === 'NOSCRIPT') return true;
        if (el.id === '__agy_ctx_capsule_tooltip__') return true;
        if (el.classList && typeof el.classList.contains === 'function' && el.classList.contains('agy-composer-footer')) return true;
        if (typeof el.className === 'string' && el.className && (' ' + el.className + ' ').includes(' agy-composer-footer ')) return true;
        return false;
      };

      while (stack.length > 0 && totalLen < MAX_CHARS) {
        const node = stack.pop();
        if (!node) continue;
        const nType = node.nodeType;
        if (nType === 3) {
          const txt = node.nodeValue !== undefined && node.nodeValue !== null ? String(node.nodeValue) : (node.textContent || '');
          if (txt) {
            const remain = MAX_CHARS - totalLen;
            if (txt.length >= remain) { chunks.push(txt.slice(0, remain)); totalLen += remain; break; }
            chunks.push(txt);
            totalLen += txt.length;
          }
          continue;
        }
        if (nType === 1 || (!nType && (node.tagName || node.childNodes))) {
          if (isExcludedElement(node)) continue;
          const children = node.childNodes;
          if (children && children.length > 0) {
            for (let i = children.length - 1; i >= 0; i--) stack.push(children[i]);
          } else if (typeof node.textContent === 'string' && node.textContent.length > 0) {
            const txt = node.textContent;
            const remain = MAX_CHARS - totalLen;
            if (txt.length >= remain) { chunks.push(txt.slice(0, remain)); totalLen += remain; break; }
            chunks.push(txt);
            totalLen += txt.length;
          }
        }
      }
      return chunks.join('').trim();
    }

    function computeDomFallbackUsage(footerEl, cid, preferredModelId, preferredModelLabel) {
      const panelEl = findChatPanelContainer(footerEl);
      if (!panelEl) return null;
      const rawText = extractPanelTextExcludingFooter(panelEl);
      const textTokens = estimateTokensFromText(rawText);
      if (textTokens <= 15) return null;

      const msgBlocks = panelEl.querySelectorAll
        ? panelEl.querySelectorAll('[data-message-id], [data-step-index], [data-testid*="message"], [data-testid*="turn"], .prose, .markdown-body, pre')
        : [];
      const estSteps = Math.max(1, msgBlocks.length > 0 ? msgBlocks.length : Math.ceil(textTokens / 350));
      const now = Date.now();
      let tracker = domStreamTracker.get(cid);
      if (!tracker) {
        tracker = { lastTokens: textTokens, lastTime: now, lastSpeed: 0, avgTokensSum: 0, avgDurSum: 0, compressionDetected: false, compressionBefore: 0, compressionAfter: 0, compressionDrop: 0 };
        setBoundedMap(domStreamTracker, cid, tracker);
      } else {
        const dtSec = (now - tracker.lastTime) / 1000;
        const dTok = textTokens - tracker.lastTokens;
        if (dTok > 4 && dtSec >= 0.25 && dtSec <= 12) {
          const spd = Math.round(dTok / dtSec);
          if (spd > 0 && spd < 500) {
            tracker.lastSpeed = spd;
            tracker.avgTokensSum += dTok;
            tracker.avgDurSum += dtSec;
          }
        }
        if (tracker.lastTokens > 0 && (tracker.lastTokens - textTokens) > COMPRESSION_MIN_DROP) {
          tracker.compressionDetected = true;
          tracker.compressionBefore = tracker.lastTokens;
          tracker.compressionAfter = textTokens;
          tracker.compressionDrop = tracker.lastTokens - textTokens;
        }
        if (dtSec >= 0.8) {
          tracker.lastTokens = textTokens;
          tracker.lastTime = now;
        }
      }

      const sysOverhead = 12500;
      const contextUsed = sysOverhead + textTokens;
      const shortCid = normalizeCidKey(cid);
      const observedBudget = (shortCid && observedBudgetMap.get(shortCid)) || (cid && observedBudgetMap.get(cid)) || 0;
      const resolvedLabel = resolveModelDisplayName(preferredModelId, preferredModelLabel);
      const ctxSpec = resolveModelContextSpec(preferredModelId, resolvedLabel, {
        observedClientBudget: observedBudget,
        modelCapabilities: modelCapabilitiesMap,
        modelConfigs: userStatusCache.modelConfigs
      });
      const finalLimit = ctxSpec.contextLimit;
      const usagePercent = finalLimit > 0 ? (contextUsed / finalLimit) * 100 : 0;
      const remainPercent = Math.max(0, 100 - usagePercent);
      const cacheReadTokens = Math.round(sysOverhead + textTokens * 0.68);
      const outputTokens = Math.round(textTokens * 0.22);
      const inputTokens = Math.max(0, contextUsed - cacheReadTokens - outputTokens);
      const totalInputWithCache = inputTokens + cacheReadTokens;
      const cacheHitRate = totalInputWithCache > 0 ? (cacheReadTokens / totalInputWithCache) * 100 : 0;
      const avgTokPerSec = tracker.avgDurSum > 0 ? Math.round(tracker.avgTokensSum / tracker.avgDurSum) : tracker.lastSpeed;

      return {
        contextUsed,
        contextLimit: finalLimit,
        modelMaxTokens: ctxSpec.modelMaxTokens,
        clientCompactionLimit: ctxSpec.clientCompactionLimit,
        runtimeBudget: ctxSpec.runtimeBudget,
        maxOutputTokens: ctxSpec.maxOutputTokens,
        limitSource: ctxSpec.limitSource,
        usagePercent,
        remainPercent,
        inputTokens,
        cacheReadTokens,
        cacheCreationTokens: 0,
        outputTokens,
        estimatedDelta: 0,
        hasPreciseSnapshot: true,
        cacheHitRate,
        tokPerSec: tracker.lastSpeed,
        avgTokPerSec,
        lastDurationSec: 0,
        compressionDetected: tracker.compressionDetected,
        compressionBefore: tracker.compressionBefore,
        compressionAfter: tracker.compressionAfter,
        compressionDrop: tracker.compressionDrop,
        modelId: preferredModelId || '',
        modelDisplayName: resolvedLabel,
        shadowModelId: '',
        stepCount: estSteps
      };
    }

    function findQuotaForModel(modelId, modelLabel, fiberQuotaInfo, fiberModelConfigs) {
      const now = Date.now();
      const normFiber = normalizeQuotaInfo(fiberQuotaInfo);
      const allConfigs = (userStatusCache.modelConfigs && userStatusCache.modelConfigs.length > 0)
        ? userStatusCache.modelConfigs
        : (Array.isArray(fiberModelConfigs) ? fiberModelConfigs : []);

      let matchedNorm = null;
      const normModelId = normalizeModelCapKey(modelId);
      for (const c of allConfigs) {
        if (!c || !c.quotaInfo) continue;
        const cids = [
          c.modelOrAlias && c.modelOrAlias.model,
          c.modelOrAlias && c.modelOrAlias.alias,
          c.model,
          c.modelId
        ].filter(Boolean);
        const idHit = modelId && cids.some(id => id === modelId || (normModelId && normalizeModelCapKey(id) === normModelId));
        const labelHit = modelLabel && (c.label === modelLabel || c.displayName === modelLabel);
        if (idHit || labelHit) {
          matchedNorm = normalizeQuotaInfo(c.quotaInfo);
          if (matchedNorm) break;
        }
      }

      let primary = matchedNorm || normFiber;
      if (matchedNorm && normFiber) {
        const bestResetMs = (matchedNorm.resetTimeMs > now) ? matchedNorm.resetTimeMs
          : ((normFiber.resetTimeMs > now) ? normFiber.resetTimeMs : (matchedNorm.resetTimeMs || normFiber.resetTimeMs));
        primary = {
          remainingFraction: matchedNorm.remainingFraction,
          resetTimeMs: bestResetMs,
          resetTime: bestResetMs > 0 ? new Date(bestResetMs).toISOString() : ''
        };
      }

      if (primary && primary.resetTimeMs > now) return primary;

      const targetPool = getQuotaPoolForModel(modelId, modelLabel);
      let poolBestResetMs = 0;
      let poolMinFraction = primary ? primary.remainingFraction : 1;
      let foundInPool = false;

      for (const c of allConfigs) {
        if (!c || !c.quotaInfo) continue;
        const cid = (c.modelOrAlias && c.modelOrAlias.model) || c.model || c.modelId || '';
        const cPool = getQuotaPoolForModel(cid, c.label);
        if (targetPool && cPool !== targetPool) continue;
        const nq = normalizeQuotaInfo(c.quotaInfo);
        if (!nq) continue;
        foundInPool = true;
        if (nq.remainingFraction < poolMinFraction) poolMinFraction = nq.remainingFraction;
        if (nq.resetTimeMs > now && (poolBestResetMs === 0 || nq.resetTimeMs < poolBestResetMs)) poolBestResetMs = nq.resetTimeMs;
      }

      if (primary) {
        const finalResetMs = poolBestResetMs > 0 ? poolBestResetMs : primary.resetTimeMs;
        return {
          remainingFraction: primary.remainingFraction < 1 ? primary.remainingFraction : poolMinFraction,
          resetTimeMs: finalResetMs,
          resetTime: finalResetMs > 0 ? new Date(finalResetMs).toISOString() : ''
        };
      }
      if (foundInPool) {
        return {
          remainingFraction: poolMinFraction,
          resetTimeMs: poolBestResetMs,
          resetTime: poolBestResetMs > 0 ? new Date(poolBestResetMs).toISOString() : ''
        };
      }
      return null;
    }

    /**
     * Extract newly finalized model calls from steps, enriching with tail GetCascadeTrajectoryGeneratorMetadata
     * only when a newly completed desktop step lacks responseId or thinkingOutputTokens.
     */
    async function extractAndEmitFinalizedCalls(cascadeId, steps, baseOffset, isRunning, summary, preferredModelId, preferredModelLabel) {
      if (!Array.isArray(steps) || !steps.length || !cascadeId || cascadeId.startsWith('__agy_panel_')) return [];
      const shortCid = normalizeCidKey(cascadeId) || cascadeId;
      const totalStepCount = Math.max(Number(summary?.stepCount || 0), (baseOffset || 0) + steps.length);
      const candidates = [];
      let needsGeneratorMeta = false;

      for (let i = 0; i < steps.length; i++) {
        const st = steps[i];
        if (!isStepFinalizedModelCall(st, isRunning, i, steps.length)) continue;
        const meta = st.metadata || st;
        const mu = meta.modelUsage || st.modelUsage || (st.checkpoint && st.checkpoint.modelUsage) || st.usage || {};
        const stepIdx = Number(st.stepIndex ?? st.step_index ?? ((baseOffset || 0) + i));
        const responseId = mu.responseId || mu.messageId || meta.responseId || st.responseId || '';
        const thinkingTokens = mu.thinkingOutputTokens ?? st.thinkingOutputTokens ?? meta.thinkingOutputTokens;
        const fallbackKey = responseId ? String(responseId) : `${shortCid}#${stepIdx}`;
        const outTok = Number(mu.outputTokens ?? mu.completionTokens ?? 0);

        const prevReported = reportedCallOutputs.get(fallbackKey);
        if (prevReported !== undefined && outTok <= prevReported) continue;

        if (!responseId || thinkingTokens === undefined || thinkingTokens === null) {
          needsGeneratorMeta = true;
        }
        candidates.push({ st, meta, mu, stepIdx, responseId, outTok });
      }

      if (!candidates.length) return [];

      let genCalls = [];
      const prevMetaStepCount = tailMetadataCheckedStepCount.get(shortCid) || 0;
      const shouldFetchTailMeta = needsGeneratorMeta && getCsrfToken() && totalStepCount > prevMetaStepCount;
      if (shouldFetchTailMeta) {
        tailMetadataCheckedStepCount.set(shortCid, totalStepCount);
        const offset = Math.max(0, totalStepCount - 3);
        const metaResp = await callLsRpc('GetCascadeTrajectoryGeneratorMetadata', {
          cascadeId: shortCid,
          generatorMetadataOffset: offset,
          includeMessages: false
        });
        const rows = metaResp && Array.isArray(metaResp.generatorMetadata) ? metaResp.generatorMetadata : [];
        for (const row of rows) {
          const rowModel = (row && row.chatModel && (row.chatModel.model || row.chatModel.modelId)) || '';
          const ctxMeta = row && row.chatModel && row.chatModel.chatStartMetadata && row.chatModel.chatStartMetadata.contextWindowMetadata;
          const cpMax = row && row.plannerConfig && row.plannerConfig.checkpointConfig && row.plannerConfig.checkpointConfig.maxTokenLimit;
          const maxCtx = Number((ctxMeta && ctxMeta.maxContextTokens) || cpMax || 0);
          if (!isShadowOrImageModel(rowModel) && Number.isFinite(maxCtx) && maxCtx >= 16000) {
            setBoundedMap(observedBudgetMap, shortCid, Math.round(maxCtx));
          }
          const parsed = core && core.parseGeneratorCall
            ? core.parseGeneratorCall(row, shortCid, 'desktop', { cascadeModelConfigs: userStatusCache.modelConfigs })
            : null;
          if (parsed && parsed.callId && parsed.status === 'final') {
            genCalls.push(parsed);
          }
        }
      }

      let callsToEmit = [];
      if (genCalls.length > 0) {
        callsToEmit = genCalls.filter(call => {
          const prev = reportedCallOutputs.get(call.callId);
          return prev === undefined || (call.outputTokens || 0) > prev;
        });
      } else {
        for (const cand of candidates) {
          const modelId = (cand.mu && (cand.mu.model || cand.mu.modelId)) || cand.meta.generatorModel || cand.st.model || preferredModelId || '';
          const syntheticRow = {
            callId: cand.responseId || `${shortCid}#${cand.stepIdx}`,
            responseId: cand.responseId || undefined,
            stepIndex: cand.stepIdx,
            status: 'final',
            created_at: cand.meta.finishedGeneratingAt || cand.meta.completedAt || cand.meta.createdAt || cand.st.createdAt || new Date().toISOString(),
            chatModel: {
              model: modelId,
              modelId,
              modelDisplayName: preferredModelLabel || resolveModelDisplayName(modelId, ''),
              usage: {
                inputTokens: Number(cand.mu.inputTokens ?? cand.mu.promptTokens ?? 0),
                cacheReadTokens: Number(cand.mu.cacheReadTokens ?? cand.mu.cachedTokens ?? 0),
                outputTokens: cand.outTok,
                thinkingOutputTokens: Number(cand.mu.thinkingOutputTokens ?? 0),
                responseId: cand.responseId || undefined
              }
            }
          };
          const parsed = core && core.parseGeneratorCall
            ? core.parseGeneratorCall(syntheticRow, shortCid, 'desktop', { cascadeModelConfigs: userStatusCache.modelConfigs })
            : syntheticRow;
          if (parsed && parsed.callId) {
            const prev = reportedCallOutputs.get(parsed.callId);
            if (prev === undefined || (parsed.outputTokens || 0) > prev) {
              callsToEmit.push(parsed);
            }
          }
        }
      }

      if (callsToEmit.length > 0) {
        const freshBatch = [];
        for (const c of callsToEmit) {
          const prev = reportedCallOutputs.get(c.callId);
          if (prev === undefined || (c.outputTokens || 0) > prev) {
            reportedCallOutputs.set(c.callId, c.outputTokens || 0);
            freshBatch.push(c);
          }
        }
        if (freshBatch.length > 0) {
          for (const cb of callsSubscribers) {
            try { cb(freshBatch, userStatusCache.raw); } catch {}
          }
          return freshBatch;
        }
      }
      return [];
    }

    async function refreshConversationUsage(cascadeId, summary, preferredModelId, preferredModelLabel, ctx, footerEl) {
      if (!cascadeId) return null;
      const shortCid = normalizeCidKey(cascadeId);
      const effectiveSummary = summary || trajectoriesMap.get(cascadeId) || (shortCid ? trajectoriesMap.get(shortCid) : null) || null;
      const stepCount = Number((effectiveSummary && effectiveSummary.stepCount) || (ctx && ctx.fiberStepCount) || 0);
      const status = (effectiveSummary && effectiveSummary.status) || (ctx && ctx.isRunning ? 'RUNNING' : '');
      const lastMod = (effectiveSummary && effectiveSummary.lastModifiedTime) || '';
      const isRunning = status.includes('RUNNING');

      const cached = sessionCache.get(cascadeId);
      if (cached && effectiveSummary && !isRunning && cached.stepCount === stepCount && cached.lastModifiedTime === lastMod && cached.steps && cached.steps.length > 0) {
        cached.usage = analyzeSteps(cached.steps, preferredModelId, preferredModelLabel, stepCount, cascadeId);
        cached.usage.title = (effectiveSummary.annotations && effectiveSummary.annotations.title) || effectiveSummary.summary || '';
        sessionUsageMap.set(cascadeId, cached.usage);
        return cached.usage;
      }

      const isUndo = cached && stepCount > 0 && stepCount < cached.stepCount;
      let steps = (cached && !isUndo && Array.isArray(cached.steps)) ? cached.steps.slice() : [];
      const fetchOffset = steps.length === 0
        ? (stepCount > 80 ? (stepCount - 80) : 0)
        : Math.max(0, (cached.baseOffset || 0) + steps.length - 5);
      const baseOffset = steps.length === 0 ? fetchOffset : (cached.baseOffset || 0);

      let resp = await callLsRpc('GetCascadeTrajectorySteps', { cascadeId, stepOffset: fetchOffset });
      if ((!resp || !Array.isArray(resp.steps) || resp.steps.length === 0) && shortCid && shortCid !== cascadeId) {
        resp = await callLsRpc('GetCascadeTrajectorySteps', { cascadeId: shortCid, stepOffset: fetchOffset });
      }

      if (resp && Array.isArray(resp.steps) && resp.steps.length > 0) {
        if (steps.length === 0) steps = resp.steps;
        else {
          const keepCount = Math.max(0, fetchOffset - baseOffset);
          steps = steps.slice(0, keepCount).concat(resp.steps);
        }
      } else {
        const fiberSteps = (ctx && Array.isArray(ctx.fiberSteps) && ctx.fiberSteps.length > 0) ? ctx.fiberSteps : null;
        const sniffed = sniffedStepsMap.get(cascadeId) || (shortCid ? sniffedStepsMap.get(shortCid) : null) || sniffedStepsMap.get('__latest_sniffed__') || null;
        if (fiberSteps && (!sniffed || fiberSteps.length >= sniffed.length)) steps = fiberSteps;
        else if (sniffed && sniffed.length > 0) steps = sniffed;
      }

      let usage = null;
      if (Array.isArray(steps) && steps.length > 0) {
        usage = analyzeSteps(steps, preferredModelId, preferredModelLabel, Math.max(stepCount, steps.length), cascadeId);
      }
      if ((!usage || usage.contextUsed === 0) && footerEl) {
        const domUsage = computeDomFallbackUsage(footerEl, cascadeId, preferredModelId, preferredModelLabel);
        if (domUsage && domUsage.contextUsed > 0) usage = domUsage;
      }
      if (!usage) usage = analyzeSteps([], preferredModelId, preferredModelLabel, stepCount, cascadeId);

      if (effectiveSummary) {
        usage.title = (effectiveSummary.annotations && effectiveSummary.annotations.title) || effectiveSummary.summary || '';
      }

      if (!isUndo && cached && cached.usage && !usage.compressionDetected) {
        const prevUsed = cached.usage.contextUsed || 0;
        if (prevUsed > 0 && (prevUsed - usage.contextUsed) > COMPRESSION_MIN_DROP && cached.usage.modelId === usage.modelId) {
          usage.compressionDetected = true;
          usage.compressionBefore = prevUsed;
          usage.compressionAfter = usage.contextUsed;
          usage.compressionDrop = prevUsed - usage.contextUsed;
        } else if (cached.usage.compressionDetected) {
          usage.compressionDetected = true;
          usage.compressionBefore = cached.usage.compressionBefore;
          usage.compressionAfter = cached.usage.compressionAfter;
          usage.compressionDrop = cached.usage.compressionDrop;
        }
      }

      if (Array.isArray(steps) && steps.length > 0) {
        await extractAndEmitFinalizedCalls(cascadeId, steps, baseOffset, isRunning, effectiveSummary, preferredModelId, preferredModelLabel);
        const postBudget = (shortCid && observedBudgetMap.get(shortCid)) || observedBudgetMap.get(cascadeId) || 0;
        if (postBudget > 0 && (postBudget !== usage.clientCompactionLimit || postBudget > usage.contextLimit)) {
          const updatedSpec = resolveModelContextSpec(usage.modelId, usage.modelDisplayName, {
            observedClientBudget: postBudget,
            modelCapabilities: modelCapabilitiesMap,
            modelConfigs: userStatusCache.modelConfigs
          });
          usage.contextLimit = updatedSpec.contextLimit;
          usage.modelMaxTokens = updatedSpec.modelMaxTokens;
          usage.clientCompactionLimit = updatedSpec.clientCompactionLimit;
          usage.runtimeBudget = updatedSpec.runtimeBudget;
          usage.maxOutputTokens = updatedSpec.maxOutputTokens;
          usage.limitSource = updatedSpec.limitSource;
          usage.usagePercent = usage.contextLimit > 0 ? (usage.contextUsed / usage.contextLimit) * 100 : 0;
          usage.remainPercent = Math.max(0, 100 - usage.usagePercent);
        }
      }

      setBoundedMap(sessionCache, cascadeId, {
        stepCount: Math.max(stepCount, usage.stepCount || 0),
        lastModifiedTime: lastMod,
        status,
        baseOffset,
        steps,
        usage
      });
      sessionUsageMap.set(cascadeId, usage);

      return usage;
    }

    function findFallbackConversationId() {
      let bestId = '';
      let bestTime = 0;
      for (const [cid, sum] of trajectoriesMap.entries()) {
        if (sum.status && sum.status.includes('RUNNING')) return cid;
        const t = new Date(sum.lastModifiedTime || 0).getTime();
        if (t > bestTime) { bestTime = t; bestId = cid; }
      }
      return bestId;
    }

    function buildResolvedQuotaBundle(effectiveModelId, effectiveLabel, primaryQuotaInfo) {
      const parsed = quotaSummaryCache.parsed;
      const groups = (parsed && Array.isArray(parsed.groups)) ? parsed.groups : [];
      const activeGroup = selectActiveQuotaGroup(groups, effectiveModelId, effectiveLabel);
      const summaryFiveHour = activeGroup ? activeGroup.fiveHour : null;
      const summaryWeekly = activeGroup ? activeGroup.weekly : null;

      let mergedFiveHour = null;
      if (summaryFiveHour && primaryQuotaInfo) {
        mergedFiveHour = {
          remainingFraction: summaryFiveHour.remainingFraction,
          resetTimeMs: summaryFiveHour.resetTimeMs || primaryQuotaInfo.resetTimeMs || 0,
          resetTime: summaryFiveHour.resetTime || primaryQuotaInfo.resetTime || ''
        };
      } else {
        mergedFiveHour = summaryFiveHour || primaryQuotaInfo || null;
      }

      const finalQuotaInfo = primaryQuotaInfo || summaryFiveHour || null;
      const hasAnyQuota = Boolean(finalQuotaInfo || mergedFiveHour || summaryWeekly || groups.length > 0);
      const quotaSummary = hasAnyQuota
        ? {
            fiveHour: mergedFiveHour,
            weekly: summaryWeekly || null,
            groups
          }
        : null;

      return { quotaInfo: finalQuotaInfo, quotaSummary };
    }

    function resolveUsageForFooter(footer) {
      const ctx = extractComposerContext(footer);
      let cid = ctx.conversationId;
      if ((!cid || cid.startsWith('__agy_panel_')) && doc) {
        const allFooters = doc.querySelectorAll ? doc.querySelectorAll('.agy-composer-footer') : [];
        if (allFooters.length === 1 && trajectoriesMap.size === 1) {
          cid = findFallbackConversationId() || cid;
        }
      }
      const quotaInfo = findQuotaForModel(ctx.modelId, ctx.modelLabel, ctx.quotaInfo, ctx.fiberModelConfigs);
      let baseUsage = (cid && sessionCache.has(cid)) ? sessionCache.get(cid).usage : null;

      if (!baseUsage || baseUsage.contextUsed === 0) {
        if (Array.isArray(ctx.fiberSteps) && ctx.fiberSteps.length > 0) {
          baseUsage = analyzeSteps(ctx.fiberSteps, ctx.modelId, ctx.modelLabel, Math.max(ctx.fiberStepCount, ctx.fiberSteps.length), cid);
        } else {
          const domUsage = computeDomFallbackUsage(footer, cid, ctx.modelId, ctx.modelLabel);
          if (domUsage && domUsage.contextUsed > 0) baseUsage = domUsage;
        }
      }

      if (baseUsage) {
        const modelChanged = Boolean(
          ctx.modelId &&
          baseUsage.modelId &&
          normalizeModelCapKey(ctx.modelId) !== normalizeModelCapKey(baseUsage.modelId)
        );
        const fallbackBaseLabel = (
          !modelChanged &&
          baseUsage.modelDisplayName &&
          baseUsage.modelDisplayName !== '默认模型' &&
          baseUsage.modelDisplayName !== 'Default Model'
        ) ? baseUsage.modelDisplayName : '';
        const effectiveModelId = ctx.modelId || baseUsage.modelId || (!ctx.modelLabel && !fallbackBaseLabel ? userStatusCache.defaultModelId : '') || '';
        const effectiveLabel = resolveModelDisplayName(effectiveModelId, ctx.modelLabel || fallbackBaseLabel);
        const primaryQuota = quotaInfo || findQuotaForModel(effectiveModelId, effectiveLabel, null, ctx.fiberModelConfigs) || baseUsage.quotaInfo;
        const quotaBundle = buildResolvedQuotaBundle(effectiveModelId, effectiveLabel, primaryQuota);
        const shortCid = normalizeCidKey(cid);
        const observedBudget = modelChanged ? 0 : ((shortCid && observedBudgetMap.get(shortCid)) || (cid && observedBudgetMap.get(cid)) || 0);
        const ctxSpec = resolveModelContextSpec(effectiveModelId, effectiveLabel, {
          observedClientBudget: observedBudget,
          modelCapabilities: modelCapabilitiesMap,
          modelConfigs: (userStatusCache.modelConfigs && userStatusCache.modelConfigs.length > 0)
            ? userStatusCache.modelConfigs
            : (Array.isArray(ctx.fiberModelConfigs) ? ctx.fiberModelConfigs : [])
        });
        const finalLimit = ctxSpec.contextLimit;
        const usagePercent = finalLimit > 0 ? (baseUsage.contextUsed / finalLimit) * 100 : 0;
        const remainPercent = Math.max(0, 100 - usagePercent);
        return Object.assign({}, baseUsage, {
          cascadeId: cid,
          contextLimit: finalLimit,
          modelMaxTokens: ctxSpec.modelMaxTokens,
          clientCompactionLimit: ctxSpec.clientCompactionLimit,
          runtimeBudget: ctxSpec.runtimeBudget,
          maxOutputTokens: ctxSpec.maxOutputTokens,
          limitSource: ctxSpec.limitSource,
          usagePercent,
          remainPercent,
          modelId: effectiveModelId,
          modelDisplayName: effectiveLabel,
          quotaInfo: quotaBundle.quotaInfo,
          quotaSummary: quotaBundle.quotaSummary
        });
      }

      const emptyModelId = ctx.modelId || (!ctx.modelLabel ? userStatusCache.defaultModelId : '') || '';
      const resolvedLabel = resolveModelDisplayName(emptyModelId, ctx.modelLabel);
      const quotaBundle = buildResolvedQuotaBundle(emptyModelId, resolvedLabel, quotaInfo);
      const shortCid = normalizeCidKey(cid);
      const observedBudget = (shortCid && observedBudgetMap.get(shortCid)) || (cid && observedBudgetMap.get(cid)) || 0;
      const ctxSpec = resolveModelContextSpec(emptyModelId, resolvedLabel, {
        observedClientBudget: observedBudget,
        modelCapabilities: modelCapabilitiesMap,
        modelConfigs: (userStatusCache.modelConfigs && userStatusCache.modelConfigs.length > 0)
          ? userStatusCache.modelConfigs
          : (Array.isArray(ctx.fiberModelConfigs) ? ctx.fiberModelConfigs : [])
      });
      return {
        cascadeId: cid,
        contextUsed: 0,
        contextLimit: ctxSpec.contextLimit,
        modelMaxTokens: ctxSpec.modelMaxTokens,
        clientCompactionLimit: ctxSpec.clientCompactionLimit,
        runtimeBudget: ctxSpec.runtimeBudget,
        maxOutputTokens: ctxSpec.maxOutputTokens,
        limitSource: ctxSpec.limitSource,
        usagePercent: 0,
        remainPercent: 100,
        inputTokens: 0,
        cacheReadTokens: 0,
        cacheCreationTokens: 0,
        outputTokens: 0,
        estimatedDelta: 0,
        hasPreciseSnapshot: false,
        cacheHitRate: 0,
        tokPerSec: 0,
        avgTokPerSec: 0,
        lastDurationSec: 0,
        compressionDetected: false,
        compressionBefore: 0,
        compressionAfter: 0,
        compressionDrop: 0,
        modelId: emptyModelId,
        modelDisplayName: resolvedLabel,
        stepCount: 0,
        quotaInfo: quotaBundle.quotaInfo,
        quotaSummary: quotaBundle.quotaSummary
      };
    }

    function notifySessionSubscribers() {
      const snapshot = new Map(sessionUsageMap);
      for (const cb of sessionSubscribers) {
        try { cb(snapshot, userStatusCache.raw); } catch {}
      }
    }

    async function pollCycle() {
      if (isPolling || disposed) return;
      isPolling = true;
      try {
        await Promise.allSettled([
          refreshUserStatus(false),
          refreshAvailableModels(false),
          refreshQuotaSummary(false)
        ]);

        const footers = doc && doc.querySelectorAll ? Array.from(doc.querySelectorAll('.agy-composer-footer')) : [];
        if (footers.length === 0) return;

        const trajResp = await callLsRpc('GetAllCascadeTrajectories', {
          metadata: { ideName: 'antigravity', extensionName: 'antigravity' }
        });
        if (trajResp && trajResp.trajectorySummaries) {
          trajectoriesMap.clear();
          for (const [cid, sum] of Object.entries(trajResp.trajectorySummaries)) {
            trajectoriesMap.set(cid, sum);
            const shortKey = normalizeCidKey(cid);
            if (shortKey) trajectoriesMap.set(skKey(shortKey), sum);
          }
        }

        const activeTasks = [];
        const seenCids = new Set();
        for (const footer of footers) {
          const ctx = extractComposerContext(footer);
          let cid = ctx.conversationId;
          if ((!cid || cid.startsWith('__agy_panel_')) && footers.length === 1 && trajectoriesMap.size === 1) {
            cid = findFallbackConversationId() || cid;
          }
          if (cid && !seenCids.has(cid)) {
            seenCids.add(cid);
            const shortCid = normalizeCidKey(cid);
            const summary = trajectoriesMap.get(cid) || (shortCid ? trajectoriesMap.get(shortCid) : null) || null;
            activeTasks.push(refreshConversationUsage(cid, summary, ctx.modelId, ctx.modelLabel, ctx, footer));
          }
        }
        if (activeTasks.length > 0) await Promise.allSettled(activeTasks);
        notifySessionSubscribers();
      } catch {
      } finally {
        isPolling = false;
      }
    }

    function skKey(v) { return v; }

    function start() {
      if (started || disposed) return hub;
      started = true;
      installNetworkSniffer();
      if (options.autoPoll !== false) {
        pollCycle();
        pollTimer = setInterval(pollCycle, pollIntervalMs);
      }
      return hub;
    }

    function dispose() {
      if (disposed) return;
      disposed = true;
      hub.disposed = true;
      if (pollTimer) { clearInterval(pollTimer); pollTimer = null; }
      for (const tid of quotaSummaryTimers) {
        try { clearTimeout(tid); } catch {}
      }
      quotaSummaryTimers.clear();
      quotaSummaryCache = { fetchedAt: 0, parsed: null };
      inFlightQuotaSummary = null;
      if (snifferInstalled && win && origFetch && win.fetch === wrappedFetch) {
        win.fetch = origFetch;
      }
      snifferInstalled = false;
      sessionSubscribers.clear();
      callsSubscribers.clear();
      userStatusSubscribers.clear();
      languageSubscribers.clear();
      sessionCache.clear();
      sessionUsageMap.clear();
      sniffedStepsMap.clear();
      domStreamTracker.clear();
      trajectoriesMap.clear();
      modelCapabilitiesMap.clear();
      modelDisplayNameMap.clear();
      observedBudgetMap.clear();
    }

    const hub = {
      disposed: false,
      start,
      dispose,
      installNetworkSniffer,
      pollCycle,
      refreshUserStatus,
      refreshAvailableModels,
      refreshQuotaSummary,
      refreshConversationUsage,
      getUserStatus: () => userStatusCache.raw,
      getQuotaSummary: () => quotaSummaryCache.parsed,
      getUserStatusMeta: () => ({
        fetchedAt: userStatusCache.fetchedAt,
        planName: userStatusCache.planName,
        tierName: userStatusCache.tierName,
        modelConfigs: userStatusCache.modelConfigs
      }),
      getModelCapabilities: () => new Map(modelCapabilitiesMap),
      getSessionUsageMap: () => new Map(sessionUsageMap),
      resolveUsageForFooter,
      resolveModelDisplayName,
      getLanguage,
      getShortLanguage,
      setLanguage,
      toggleShortLanguage,
      subscribeSession: (cb) => {
        if (typeof cb === 'function') sessionSubscribers.add(cb);
        return () => sessionSubscribers.delete(cb);
      },
      subscribeFinalizedCalls: (cb) => {
        if (typeof cb === 'function') callsSubscribers.add(cb);
        return () => callsSubscribers.delete(cb);
      },
      subscribeUserStatus: (cb) => {
        if (typeof cb === 'function') userStatusSubscribers.add(cb);
        return () => userStatusSubscribers.delete(cb);
      },
      subscribeLanguage: (cb) => {
        if (typeof cb === 'function') languageSubscribers.add(cb);
        return () => languageSubscribers.delete(cb);
      },
      getSnifferCount: () => (snifferInstalled ? 1 : 0)
    };

    return hub;
  }

  const exported = {
    COMPRESSION_MIN_DROP,
    DEFAULT_LIMIT,
    CLAUDE_LIMIT,
    GEMINI_MAX_WINDOW,
    GPT_OSS_LIMIT,
    GPT_OSS_MAX_WINDOW,
    QUOTA_SUMMARY_TTL_MS,
    QUOTA_SUMMARY_TIMEOUT_MS,
    KNOWN_QUOTA_POOLS,
    createTelemetryHub,
    normalizePanelLanguage,
    toShortLanguage,
    formatTokenValue,
    estimateTokensFromText,
    isShadowOrImageModel,
    resolveModelContextSpec,
    getContextLimitForModel,
    getQuotaPoolForModel,
    normalizeCidKey,
    parseResetTimeMs,
    normalizeQuotaInfo,
    parseQuotaSummaryResponse,
    extractStepEstimateText,
    isStepFinalizedModelCall
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = exported;
  } else {
    root.__AGUnifiedTelemetryModule = exported;
  }
})(globalThis);
