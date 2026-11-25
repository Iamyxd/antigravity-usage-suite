(function (root) {
  'use strict';

  function parseDurationSec(value) {
    if (value === undefined || value === null) return null;
    if (typeof value === 'number') return Number.isFinite(value) && value >= 0 ? value : null;
    const match = String(value).trim().match(/^([\d.]+)\s*s?$/i);
    if (!match) return null;
    const num = parseFloat(match[1]);
    return Number.isFinite(num) && num >= 0 ? num : null;
  }

  // Verified pricing date: 2026-11-08 (https://ai.google.dev/gemini-api/docs/pricing)
  const GEMINI_PRICING_TABLE = {
    'gemini-3.8-flash': [
      {
        effectiveTo: '2026-12-31',
        inputPerMillion: 0.75,
        outputPerMillion: 3.75,
        cacheReadPerMillion: 0.075
      },
      {
        effectiveFrom: '2027-01-01',
        inputPerMillion: 1.50,
        outputPerMillion: 7.50,
        cacheReadPerMillion: 0.15
      }
    ],
    'gemini-4-argon': [
      {
        effectiveTo: '2026-11-30',
        inputPerMillion: 2.00,
        outputPerMillion: 10.00,
        cacheReadPerMillion: 0.10
      },
      {
        effectiveFrom: '2026-12-01',
        inputPerMillion: 4.00,
        outputPerMillion: 20.00,
        cacheReadPerMillion: 0.20
      }
    ],
    'gemini-3.1-pro-preview': [
      {
        maxPromptTokens: 200000,
        inputPerMillion: 2.00,
        outputPerMillion: 12.00,
        cacheReadPerMillion: 0.20
      },
      {
        minPromptTokens: 200001,
        inputPerMillion: 4.00,
        outputPerMillion: 18.00,
        cacheReadPerMillion: 0.40
      }
    ],
    'gemini-3.5-flash-lite': [
      {
        inputPerMillion: 0.30,
        outputPerMillion: 2.50,
        cacheReadPerMillion: 0.03
      }
    ],
    'gemini-2.5-pro': [
      {
        maxPromptTokens: 200000,
        inputPerMillion: 1.25,
        outputPerMillion: 10.00,
        cacheReadPerMillion: 0.125
      },
      {
        minPromptTokens: 200001,
        inputPerMillion: 2.50,
        outputPerMillion: 15.00,
        cacheReadPerMillion: 0.25
      }
    ]
  };

  function extractModelString(req) {
    if (!req) return '';
    if (typeof req === 'string') return req;
    const cm = req.chatModel;
    return cm?.modelDisplayName || cm?.responseModel || cm?.model || req.modelDisplayName || req.responseModel || req.model || req.chatModel || req.modelId || '';
  }

  function normalizeModelId(raw) {
    if (!raw || typeof raw !== 'string') return null;
    const str = raw.trim().toLowerCase();
    if (str.includes('3.8-flash') || str.includes('3.8 flash') || str.includes('flash-n')) return 'gemini-3.8-flash';
    if (str.includes('4-argon') || str.includes('4 argon') || str.includes('argon')) return 'gemini-4-argon';
    if (str.includes('3.1-pro') || str.includes('3.1 pro')) return 'gemini-3.1-pro-preview';
    if (str.includes('3.5-flash-lite') || str.includes('3.5 flash-lite') || str.includes('flash-lite')) return 'gemini-3.5-flash-lite';
    if (str.includes('2.5-pro') || str.includes('2.5 pro')) return 'gemini-2.5-pro';
    return null;
  }

  function resolveStableModelId(input, cascadeModelConfigs = []) {
    let idCandidates = [];
    let labelCandidates = [];

    if (typeof input === 'string') {
      const s = input.trim();
      if (!s) return null;
      idCandidates = [s];
      labelCandidates = [s];
    } else if (input && typeof input === 'object') {
      const cm = input.chatModel || input;
      const displaySet = new Set(
        [cm.modelDisplayName, cm.label]
          .filter(v => typeof v === 'string' && v.trim())
          .map(v => v.trim())
      );
      const rawIds = [
        cm.modelId,
        cm.modelOrAlias?.model,
        cm.modelRaw,
        cm.chatStartMetadata?.model,
        cm.responseModel,
        cm.model
      ];
      const seenId = new Set();
      for (const val of rawIds) {
        if (typeof val !== 'string') continue;
        const t = val.trim();
        if (!t || seenId.has(t)) continue;
        if (val === cm.model && displaySet.has(t) && (cm.modelId || cm.modelRaw || cm.modelOrAlias?.model)) {
          continue;
        }
        seenId.add(t);
        idCandidates.push(t);
      }
      labelCandidates = Array.from(displaySet);
    }

    if (!idCandidates.length && !labelCandidates.length) return null;

    const pickConfigCanonicalId = (cfg) => {
      const alias = String(cfg?.modelOrAlias?.model || '').trim();
      const mId = String(cfg?.modelId || '').trim();
      if (alias && mId) {
        const sameAliasCount = cascadeModelConfigs.filter(
          x => String(x?.modelOrAlias?.model || '').trim().toLowerCase() === alias.toLowerCase()
        ).length;
        return (sameAliasCount > 1 ? mId : alias).toLowerCase();
      }
      const chosen = alias || mId || String(cfg?.label || '').trim();
      return chosen ? chosen.toLowerCase() : null;
    };

    const stripModelPrefix = (v) => String(v || '').trim().toLowerCase().replace(/^model_/, '');

    if (Array.isArray(cascadeModelConfigs) && cascadeModelConfigs.length) {
      for (const cand of idCandidates) {
        const candLower = cand.toLowerCase();
        const candStripped = stripModelPrefix(cand);
        const matched = cascadeModelConfigs.find((c) => {
          const mId = String(c?.modelId || '').trim().toLowerCase();
          const aliasId = String(c?.modelOrAlias?.model || '').trim().toLowerCase();
          return (
            (mId && (mId === candLower || stripModelPrefix(mId) === candStripped)) ||
            (aliasId && (aliasId === candLower || stripModelPrefix(aliasId) === candStripped))
          );
        });
        if (matched) return pickConfigCanonicalId(matched);
      }

      const hasDistinctId = idCandidates.some(id => !labelCandidates.includes(id));
      if (!hasDistinctId) {
        for (const lblCand of labelCandidates) {
          const lblLower = lblCand.toLowerCase();
          const labelMatches = cascadeModelConfigs.filter(
            c => String(c?.label || '').trim().toLowerCase() === lblLower
          );
          if (labelMatches.length === 1) return pickConfigCanonicalId(labelMatches[0]);
        }
      }
    }

    const chosen = (idCandidates[0] || labelCandidates[0] || '').trim().toLowerCase();
    return chosen || null;
  }

  const EFFORT_WHITELIST = ['Extra High', 'XHigh', 'Low', 'Medium', 'High', 'Extra', 'Minimal', 'Max'];
  const EFFORT_LABEL_ZH = {
    Low: '低（Low）',
    Medium: '中（Medium）',
    High: '高（High）',
    XHigh: '超高（XHigh）',
    Extra: '超高（Extra）',
    'Extra High': '超高（Extra High）'
  };
  const EFFORT_LABEL_TW = { ...EFFORT_LABEL_ZH };

  function normalizeEffortValue(raw) {
    if (typeof raw !== 'string') return null;
    const s = raw.trim().replace(/[_-]+/g, ' ').replace(/\s+/g, ' ').toLowerCase();
    if (!s) return null;
    if (s === 'x high' || s === 'xhigh') return 'XHigh';
    for (const item of EFFORT_WHITELIST) {
      if (item.toLowerCase() === s) return item;
    }
    return null;
  }

  function formatEffortLabel(effort, lang = 'en') {
    if (!effort) return '';
    const norm = normalizeEffortValue(effort);
    if (!norm) return String(effort);
    const l = typeof lang === 'string' ? lang.trim().toLowerCase() : 'en';
    if (l === 'zh-cn' || l === 'zh-hans' || l === 'zh') return EFFORT_LABEL_ZH[norm] || norm;
    if (l === 'zh-tw' || l === 'zh-hant' || l === 'tw') return EFFORT_LABEL_TW[norm] || norm;
    return norm;
  }

  function detectModelVendor(productLabel, modelId) {
    const candidates = [productLabel, modelId]
      .filter(v => typeof v === 'string' && v.trim())
      .map(v => v.trim().toLowerCase());
    for (const c of candidates) {
      if (c.startsWith('product:google:')) return 'Google';
      if (c.startsWith('product:anthropic:')) return 'Anthropic';
      if (c.startsWith('product:openai:')) return 'OpenAI';
      if (/^(?:models\/)?(?:gemini|google|gemma|imagen|veo)\b/.test(c)) return 'Google';
      if (/^(?:models\/)?(?:claude|anthropic)\b/.test(c)) return 'Anthropic';
      if (/^(?:models\/)?(?:gpt|openai|o1|o3|o4|chatgpt|codex)\b/.test(c)) return 'OpenAI';
    }
    return '其他';
  }

  function groupModelProduct(config) {
    const obj = (config && typeof config === 'object') ? config : { label: typeof config === 'string' ? config : '' };
    const cm = obj.chatModel || obj;
    const rawId = String(cm.modelId || cm.modelOrAlias?.model || cm.modelRaw || (typeof config === 'string' ? config : '') || '').trim();
    const rawLabel = String(cm.label || cm.modelDisplayName || cm.model || '').trim();
    const explicitEffort = normalizeEffortValue(cm.effort || cm.thinkingEffort || cm.reasoningEffort || obj.effort || '');

    let effort = explicitEffort;
    let productLabel = rawLabel;

    const effRegexParts = EFFORT_WHITELIST.map(e => e.replace(/\s+/g, '\\s+')).join('|');
    const parenRe = new RegExp(`^(.+?)\\s*[\\(（](${effRegexParts})[\\)）]\\s*$`, 'i');
    const suffixRe = new RegExp(`^(.+?)\\s+(${effRegexParts})\\s*$`, 'i');

    if (productLabel) {
      const mParen = productLabel.match(parenRe);
      if (mParen) {
        productLabel = mParen[1].trim();
        if (!effort) effort = normalizeEffortValue(mParen[2]);
      } else {
        const mSuffix = productLabel.match(suffixRe);
        if (mSuffix) {
          productLabel = mSuffix[1].trim();
          if (!effort) effort = normalizeEffortValue(mSuffix[2]);
        }
      }
    }

    if (!productLabel && rawId) {
      const idEffortRe = /^(.+?)[-_](extra[-_]?high|x[-_]?high|low|medium|high|extra|minimal|max)$/i;
      const mId = rawId.match(idEffortRe);
      if (mId) {
        productLabel = mId[1].trim();
        if (!effort) effort = normalizeEffortValue(mId[2]);
      } else {
        productLabel = rawId;
      }
    }

    if (!productLabel) productLabel = 'Unknown';
    const vendor = detectModelVendor(productLabel, rawId);
    const vendorSlugMap = { Google: 'google', Anthropic: 'anthropic', OpenAI: 'openai', 其他: 'other' };
    let slug = productLabel
      .toLowerCase()
      .replace(/[^a-z0-9.\u4e00-\u9fa5]+/g, '-')
      .replace(/^-+|-+$/g, '');
    const pkMatch = rawId.toLowerCase().match(/^product:(google|anthropic|openai|other):(.+)$/);
    if (pkMatch && productLabel.toLowerCase() === rawId.toLowerCase()) {
      slug = pkMatch[2];
    }
    const productKey = `product:${vendorSlugMap[vendor] || 'other'}:${slug || rawId.toLowerCase() || 'unknown'}`;

    return {
      productKey,
      productLabel,
      vendor,
      effort: effort || null
    };
  }

  function formatTokensK(v) {
    if (v == null || !Number.isFinite(Number(v))) return '—';
    const num = Number(v);
    if (num >= 1e6) return `${parseFloat((num / 1e6).toFixed(2))}M`;
    if (num >= 1000) return `${parseFloat((num / 1000).toFixed(1))}K`;
    return Math.round(num).toLocaleString('en-US');
  }

  function isValidSpeedSample(call) {
    if (!call || typeof call !== 'object') return false;
    if (call.status !== 'final') return false;
    if (call.isEstimated === true || call.isSynthetic === true) return false;
    const out = Number(call.outputTokens);
    const dur = Number(call.durationSec);
    if (!Number.isFinite(out) || out <= 0) return false;
    if (!Number.isFinite(dur) || dur <= 0) return false;
    return true;
  }

  const MAX_SPEED_SAMPLES_PER_MODEL = 200;

  function calculateRequestApiCost(req) {
    if (!req) return { costUSD: null, isPriced: false, reason: '缺失请求数据' };
    const rawModel = extractModelString(req);
    const modelKey = normalizeModelId(rawModel);
    if (!modelKey || !GEMINI_PRICING_TABLE[modelKey]) {
      return { costUSD: null, isPriced: false, modelKey: null, rawModel, reason: !rawModel ? '缺模型名称' : '未知模型或无官方公开费率' };
    }
    const input = Number(req.inputTokens ?? req.input_tokens ?? req.input ?? 0);
    const cache = Number(req.cacheTokens ?? req.cacheReadTokens ?? req.cache_read_tokens ?? req.cached ?? 0);
    const output = Number(req.outputTokens ?? req.output_tokens ?? req.output ?? 0);
    const thinking = Number(req.thinkingTokens ?? req.thinking_output_tokens ?? req.thinking ?? 0);
    const totalPrompt = input + cache;

    const reqDate = req.date ? String(req.date).slice(0, 10) : req.created_at ? String(req.created_at).slice(0, 10) : '2026-11-08';
    const tierRules = GEMINI_PRICING_TABLE[modelKey];
    let matchedTier = null;

    for (const rule of tierRules) {
      if (rule.effectiveTo && reqDate > rule.effectiveTo) continue;
      if (rule.effectiveFrom && reqDate < rule.effectiveFrom) continue;
      if (rule.maxPromptTokens && totalPrompt > rule.maxPromptTokens) continue;
      if (rule.minPromptTokens && totalPrompt < rule.minPromptTokens) continue;
      matchedTier = rule;
      break;
    }

    if (!matchedTier) matchedTier = tierRules[0];

    const costInput = (input * matchedTier.inputPerMillion) / 1000000;
    const costCache = (cache * matchedTier.cacheReadPerMillion) / 1000000;
    const costOutput = (output * matchedTier.outputPerMillion) / 1000000;
    const totalCost = costInput + costCache + costOutput;

    return {
      costUSD: Number(totalCost.toFixed(6)),
      isPriced: true,
      modelKey,
      matchedTier,
      inputTokens: input,
      cacheTokens: cache,
      cacheReadTokens: cache,
      outputTokens: output,
      thinkingTokens: thinking,
      totalTokens: input + cache + output
    };
  }

  function summarizeApiCost(requests = [], extraUnpricedCount = 0, extraUnpricedReasons = {}, extraUnpricedTokens = 0) {
    let pricedCostUSD = 0;
    let pricedTokens = 0;
    let pricedInputTokens = 0;
    let pricedCacheTokens = 0;
    let pricedOutputTokens = 0;
    let pricedThinkingTokens = 0;
    let unpricedTokens = Number(extraUnpricedTokens) || 0;
    let pricedRequestsCount = 0;
    let unpricedRequestsCount = Number(extraUnpricedCount) || 0;
    const unpricedReasons = {
      missingModel: Number(extraUnpricedReasons.missingModel || 0),
      unsupportedModel: Number(extraUnpricedReasons.unsupportedModel || 0),
      missingUsage: Number(extraUnpricedReasons.missingUsage || 0)
    };
    const byModel = {};

    for (const req of requests) {
      const calc = calculateRequestApiCost(req);
      if (calc.isPriced) {
        pricedCostUSD += calc.costUSD;
        pricedTokens += calc.totalTokens;
        pricedInputTokens += (calc.inputTokens || 0);
        pricedCacheTokens += (calc.cacheTokens || 0);
        pricedOutputTokens += (calc.outputTokens || 0);
        pricedThinkingTokens += (calc.thinkingTokens || 0);
        pricedRequestsCount += 1;
        if (!byModel[calc.modelKey]) {
          byModel[calc.modelKey] = { requests: 0, costUSD: 0, tokens: 0 };
        }
        byModel[calc.modelKey].requests += 1;
        byModel[calc.modelKey].costUSD = Number((byModel[calc.modelKey].costUSD + calc.costUSD).toFixed(6));
        byModel[calc.modelKey].tokens += calc.totalTokens;
      } else {
        unpricedRequestsCount += 1;
        const inp = Number(req.inputTokens ?? req.input_tokens ?? req.input ?? 0);
        const cap = Number(req.cacheTokens ?? req.cacheReadTokens ?? req.cache_read_tokens ?? req.cached ?? 0);
        const outp = Number(req.outputTokens ?? req.output_tokens ?? req.output ?? 0);
        const tot = inp + cap + outp;
        unpricedTokens += tot;
        const rawM = extractModelString(req);
        if (!rawM) unpricedReasons.missingModel += 1;
        else if (tot === 0) unpricedReasons.missingUsage += 1;
        else unpricedReasons.unsupportedModel += 1;
      }
    }

    const totalRequests = pricedRequestsCount + unpricedRequestsCount;
    let coveragePercent = null;
    let tokenCoveragePercent = null;
    let requestCoveragePercent = null;
    let isPartialCoverage = false;

    if (totalRequests > 0) {
      requestCoveragePercent = Number(((pricedRequestsCount / totalRequests) * 100).toFixed(1));
      const totalTok = pricedTokens + unpricedTokens;
      if (totalTok > 0) {
        tokenCoveragePercent = Number(((pricedTokens / totalTok) * 100).toFixed(1));
      }
      if (pricedRequestsCount === 0) {
        coveragePercent = 0;
      } else if (unpricedRequestsCount > 0) {
        isPartialCoverage = true;
        coveragePercent = unpricedTokens === 0
          ? requestCoveragePercent
          : Math.min(tokenCoveragePercent ?? requestCoveragePercent, requestCoveragePercent);
        if (coveragePercent >= 100) coveragePercent = 99.9;
      } else {
        coveragePercent = 100;
      }
    }

    return {
      pricedCostUSD: Number((Math.round((pricedCostUSD + Number.EPSILON) * 10000) / 10000).toFixed(4)),
      pricedRequestsCount,
      unpricedRequestsCount,
      pricedTokens,
      unpricedTokens,
      byCategory: {
        inputTokens: pricedInputTokens,
        cacheTokens: pricedCacheTokens,
        outputTokens: pricedOutputTokens,
        thinkingTokens: pricedThinkingTokens
      },
      coveragePercent,
      tokenCoveragePercent,
      requestCoveragePercent,
      isPartialCoverage,
      unpricedReasons,
      byModel
    };
  }

  /**
   * Normalize a generator metadata row or finalized step usage object into a ledger call record.
   */
  function parseGeneratorCall(row, cascadeId = null, source = 'desktop', options = {}) {
    if (!row || typeof row !== 'object') return null;
    const cm = row.chatModel || {};
    const u = cm.usage || {};
    const model = cm.modelDisplayName || cm.responseModel || cm.model || row.model || row.modelId || '';
    const modelKey = normalizeModelId(model);
    const cascadeConfigs = Array.isArray(options.cascadeModelConfigs) ? options.cascadeModelConfigs : [];
    const modelExactId = resolveStableModelId(row, cascadeConfigs) || resolveStableModelId(model, cascadeConfigs) || null;
    const modelLabelRaw = String(cm.modelDisplayName || row.modelLabel || model || modelExactId || '').trim();
    const productMeta = groupModelProduct({
      modelId: modelExactId || cm.modelId || cm.model || row.modelId,
      label: modelLabelRaw,
      effort: cm.effort || row.effort
    });

    const input = Number(u.inputTokens ?? row.inputTokens ?? row.input_tokens ?? 0);
    const cached = Number(u.cacheReadTokens ?? row.cacheTokens ?? row.cacheReadTokens ?? row.cache_read_tokens ?? 0);
    const output = Number(u.outputTokens ?? row.outputTokens ?? row.output_tokens ?? 0);
    const thinking = Number(u.thinkingOutputTokens ?? row.thinkingTokens ?? row.thinking_output_tokens ?? 0);
    const responseTokens = Number(u.responseOutputTokens ?? row.responseTokens ?? (output - thinking > 0 ? output - thinking : output));

    const callId = String(u.responseId || u.messageId || row.callId || row.responseId || (cascadeId ? `${cascadeId}#${(row.stepIndices?.[0] ?? row.stepIndex ?? 0)}` : ''));
    if (!callId) return null;

    const hasExplicitFinish = Boolean(
      row.status === 'final' ||
      row.status === 'completed' ||
      cm.finishReason ||
      row.finishReason ||
      row.done === true ||
      (cm.streamingDuration != null && cm.timeToFirstToken != null)
    );
    const hasUsage = (input + cached + output) > 0;
    const status = hasExplicitFinish || (hasUsage && !row.isStreaming && row.status !== 'streaming') ? 'final' : 'streaming';
    const isEstimated = !hasUsage || output === 0;

    let callDate = null;
    let callTimestamp = null;
    const rawCreatedAt = row.created_at || row.createdAt || row.timestamp;
    if (rawCreatedAt) {
      const dt = new Date(rawCreatedAt);
      if (!Number.isNaN(dt.getTime())) {
        callDate = dt.toISOString().slice(0, 10);
        callTimestamp = dt.getTime();
      }
    } else if (row.date && /^\d{4}-\d{2}-\d{2}/.test(String(row.date))) {
      callDate = String(row.date).slice(0, 10);
      callTimestamp = new Date(callDate).getTime();
    } else if (source === 'desktop' && typeof window !== 'undefined') {
      callTimestamp = Date.now();
      callDate = new Date(callTimestamp).toISOString().slice(0, 10);
    }

    const reqObj = {
      model,
      inputTokens: input,
      cacheTokens: cached,
      cacheReadTokens: cached,
      outputTokens: output,
      thinkingTokens: thinking,
      date: callDate
    };
    const costCalc = calculateRequestApiCost(reqObj);

    const ttftSecRaw = parseDurationSec(cm.timeToFirstToken) ?? (row.ttftSec !== undefined && row.ttftSec !== null && Number.isFinite(Number(row.ttftSec)) && Number(row.ttftSec) >= 0 ? Number(row.ttftSec) : null);
    const streamingSecRaw = parseDurationSec(cm.streamingDuration) ?? (row.streamingSec !== undefined && row.streamingSec !== null && Number.isFinite(Number(row.streamingSec)) && Number(row.streamingSec) >= 0 ? Number(row.streamingSec) : null);
    let durationSecRaw = null;
    if (ttftSecRaw !== null && streamingSecRaw !== null) {
      durationSecRaw = ttftSecRaw + streamingSecRaw;
    } else if (ttftSecRaw !== null || streamingSecRaw !== null) {
      durationSecRaw = ttftSecRaw ?? streamingSecRaw;
    } else if (row.durationSec !== undefined && row.durationSec !== null && Number.isFinite(Number(row.durationSec)) && Number(row.durationSec) > 0) {
      durationSecRaw = Number(row.durationSec);
    }

    const speedFields = {};
    if (status === 'final' && !isEstimated && output > 0 && durationSecRaw !== null && durationSecRaw > 0) {
      if (ttftSecRaw !== null) speedFields.ttftSec = Number(ttftSecRaw.toFixed(2));
      if (streamingSecRaw !== null) speedFields.streamingSec = Number(streamingSecRaw.toFixed(2));
      speedFields.durationSec = Number(durationSecRaw.toFixed(2));
      speedFields.tps = (row.tps !== undefined && row.tps !== null && Number.isFinite(Number(row.tps)) && Number(row.tps) > 0)
        ? Number(Number(row.tps).toFixed(1))
        : Number((output / durationSecRaw).toFixed(1));
      speedFields.origin = row.origin === 'speed-test' ? 'speed-test' : 'chat';
    }

    return {
      callId,
      source,
      cascadeId,
      model,
      modelKey,
      modelExactId: modelExactId || undefined,
      modelLabel: modelLabelRaw || undefined,
      effort: productMeta.effort || undefined,
      inputTokens: input,
      cacheTokens: cached,
      cacheReadTokens: cached,
      outputTokens: output,
      thinkingTokens: thinking,
      responseTokens,
      status,
      isEstimated,
      isPriced: costCalc.isPriced,
      costUSD: costCalc.costUSD ?? 0,
      date: callDate,
      created_at: rawCreatedAt ? String(rawCreatedAt) : (callTimestamp ? new Date(callTimestamp).toISOString() : null),
      timestamp: callTimestamp,
      ...speedFields
    };
  }

  function parseUserPlanStatus(raw) {
    if (!raw || typeof raw !== 'object') {
      return {
        status: 'unidentified',
        tierKey: 'unknown',
        tierName: '未知',
        tierId: null,
        planName: '未知',
        email: null,
        region: '未知',
        currency: 'USD',
        billingCycle: '未知',
        officialPriceMonthly: null,
        priceRangeNote: '未知',
        actualPricePaid: null,
        isPriceEstimated: true,
        promptCredits: null,
        flowCredits: null,
        pricingTableVerifiedDate: '2026-11-08',
        updatedAt: null
      };
    }
    const us = raw.userStatus || raw;
    const userTier = us.userTier || {};
    const planStatus = us.planStatus || {};
    const planInfo = planStatus.planInfo || {};
    const email = us.email || null;
    const rawTierName = String(userTier.name || planInfo.planName || '').trim();

    const hasTierEvidence = Boolean(
      rawTierName ||
      userTier.id ||
      planStatus.availablePromptCredits !== undefined ||
      planInfo.monthlyPromptCredits !== undefined
    );

    if (!hasTierEvidence) {
      return {
        status: 'unidentified',
        tierKey: 'unknown',
        tierName: '未知',
        tierId: null,
        planName: '未知',
        email,
        region: '未知',
        currency: 'USD',
        billingCycle: '未知',
        officialPriceMonthly: null,
        priceRangeNote: '未知',
        actualPricePaid: null,
        isPriceEstimated: true,
        promptCredits: null,
        flowCredits: null,
        pricingTableVerifiedDate: '2026-11-08',
        updatedAt: null
      };
    }

    let tierKey = 'unknown';
    let tierDisplayName = '未知';
    let officialPrice = null;
    let priceRange = null;

    if (/ultra/i.test(rawTierName) || /ultra/i.test(userTier.id || '')) {
      tierKey = 'ultra';
      const subTierMatch = rawTierName.match(/ultra\s*([0-9a-zA-Z\-_]+)/i);
      if (subTierMatch && !['plan', 'tier'].includes(subTierMatch[1].toLowerCase())) {
        tierDisplayName = `Google AI Ultra (${subTierMatch[1]})`;
        officialPrice = null;
        priceRange = '子档定制费率未知';
      } else {
        tierDisplayName = 'Google AI Ultra（子档未知）';
        officialPrice = null;
        priceRange = '参考区间 $99.99 ~ $249.99/月（子档未知）';
      }
    } else if (/pro/i.test(rawTierName) || /pro/i.test(userTier.id || '')) {
      tierKey = 'pro';
      tierDisplayName = 'Google AI Pro';
      officialPrice = 19.99;
      priceRange = '$19.99/月（公开参考）';
    } else if (/plus/i.test(rawTierName) || /plus/i.test(userTier.id || '')) {
      tierKey = 'plus';
      tierDisplayName = 'Google AI Plus';
      officialPrice = 4.99;
      priceRange = '$4.99/月（公开参考）';
    } else if (/free/i.test(rawTierName) || /free/i.test(userTier.id || '')) {
      tierKey = 'free';
      tierDisplayName = 'Free';
      officialPrice = 0;
      priceRange = '$0/月（公开参考）';
    } else {
      tierKey = 'custom';
      tierDisplayName = rawTierName || '未知套餐';
      officialPrice = null;
      priceRange = '费率未知';
    }

    return {
      status: 'identified',
      tierKey,
      tierName: tierDisplayName,
      tierId: userTier.id || null,
      planName: planInfo.planName || tierDisplayName,
      email,
      region: '未知',
      currency: 'USD',
      billingCycle: officialPrice !== null ? '月付 · 公开参考' : '未知',
      officialPriceMonthly: officialPrice,
      priceRangeNote: priceRange,
      actualPricePaid: null,
      isPriceEstimated: true,
      promptCredits: {
        available: planStatus.availablePromptCredits ?? null,
        monthly: planInfo.monthlyPromptCredits ?? null
      },
      flowCredits: {
        available: planStatus.availableFlowCredits ?? null,
        monthly: planInfo.monthlyFlowCredits ?? null
      },
      pricingTableVerifiedDate: '2026-11-08',
      updatedAt: new Date().toISOString()
    };
  }

  function calculateReferenceModelCost(tokenTotals = {}, modelKey = 'gemini-3.8-flash', options = {}) {
    if (!tokenTotals || typeof tokenTotals !== 'object') {
      tokenTotals = {};
    }
    const input = Number(tokenTotals.inputTokens ?? tokenTotals.input ?? tokenTotals.totalInputTokens ?? 0);
    const cache = Number(tokenTotals.cacheTokens ?? tokenTotals.cacheReadTokens ?? tokenTotals.cache ?? tokenTotals.totalCacheTokens ?? 0);
    const output = Number(tokenTotals.outputTokens ?? tokenTotals.output ?? tokenTotals.totalOutputTokens ?? 0);
    const total = Number(tokenTotals.totalTokens ?? tokenTotals.total ?? tokenTotals.grandTotalTokens ?? (input + cache + output));
    const hasBreakdown = (input + cache + output) > 0;

    const normKey = normalizeModelId(modelKey) || 'gemini-3.8-flash';
    const tierRules = GEMINI_PRICING_TABLE[normKey] || GEMINI_PRICING_TABLE['gemini-3.8-flash'];
    const reqDate = options.pricingDate ? String(options.pricingDate).slice(0, 10) : '2026-11-08';
    let matchedTier = tierRules[0];
    for (const rule of tierRules) {
      if (rule.effectiveTo && reqDate > rule.effectiveTo) continue;
      if (rule.effectiveFrom && reqDate < rule.effectiveFrom) continue;
      matchedTier = rule;
      break;
    }

    let inputCost = 0;
    let cacheCost = 0;
    let outputCost = 0;
    let totalCost = 0;
    let unpricedTokens = 0;

    if (hasBreakdown) {
      inputCost = (input * matchedTier.inputPerMillion) / 1000000;
      cacheCost = (cache * matchedTier.cacheReadPerMillion) / 1000000;
      outputCost = (output * matchedTier.outputPerMillion) / 1000000;
      totalCost = inputCost + cacheCost + outputCost;
    } else if (total > 0) {
      if (options.simulationSplit && typeof options.simulationSplit === 'object') {
        const inRatio = Number(options.simulationSplit.inputRatio || 0.8);
        const outRatio = Number(options.simulationSplit.outputRatio || 0.2);
        inputCost = (total * inRatio * matchedTier.inputPerMillion) / 1000000;
        outputCost = (total * outRatio * matchedTier.outputPerMillion) / 1000000;
        totalCost = inputCost + outputCost;
      } else {
        unpricedTokens = total;
      }
    }

    let hybrid = null;
    if (options.mode === 'unpriced_only' || options.knownUsage) {
      const ku = options.knownUsage || {};
      const knownIn = Number(ku.inputTokens ?? ku.byCategory?.inputTokens ?? ku.input ?? 0);
      const knownCache = Number(ku.cacheTokens ?? ku.cacheReadTokens ?? ku.byCategory?.cacheTokens ?? ku.cache ?? 0);
      const knownOut = Number(ku.outputTokens ?? ku.byCategory?.outputTokens ?? ku.output ?? 0);
      const knownCost = Number(ku.costUSD ?? ku.pricedCostUSD ?? 0);

      const residualIn = Math.max(0, input - knownIn);
      const residualCache = Math.max(0, cache - knownCache);
      const residualOut = Math.max(0, output - knownOut);

      const resInCost = (residualIn * matchedTier.inputPerMillion) / 1000000;
      const resCacheCost = (residualCache * matchedTier.cacheReadPerMillion) / 1000000;
      const resOutCost = (residualOut * matchedTier.outputPerMillion) / 1000000;
      const resTotalCost = resInCost + resCacheCost + resOutCost;

      const combined = resTotalCost === 0 ? knownCost : Number((knownCost + resTotalCost).toFixed(4));
      hybrid = {
        knownCostUSD: knownCost,
        unpricedResidualTokens: residualIn + residualCache + residualOut,
        unpricedResidualCostUSD: Number(resTotalCost.toFixed(4)),
        combinedTotalUSD: combined,
        residualTokensBreakdown: {
          input: residualIn,
          cache: residualCache,
          output: residualOut,
          inputCostUSD: Number(resInCost.toFixed(4)),
          cacheCostUSD: Number(resCacheCost.toFixed(4)),
          outputCostUSD: Number(resOutCost.toFixed(4))
        }
      };
    }

    const modelNameMap = {
      'gemini-3.8-flash': 'Gemini 3.8 Flash Standard',
      'gemini-4-argon': 'Gemini 4 Argon',
      'gemini-3.1-pro-preview': 'Gemini 3.1 Pro Preview',
      'gemini-3.5-flash-lite': 'Gemini 3.5 Flash-Lite',
      'gemini-2.5-pro': 'Gemini 2.5 Pro'
    };

    return {
      modelKey: normKey,
      modelDisplayName: modelNameMap[normKey] || normKey,
      pricingDate: reqDate,
      matchedTier,
      hasBreakdown,
      inputTokens: input,
      cacheTokens: cache,
      cacheReadTokens: cache,
      outputTokens: output,
      totalTokens: total,
      inputCostUSD: Number(inputCost.toFixed(4)),
      cacheCostUSD: Number(cacheCost.toFixed(4)),
      outputCostUSD: Number(outputCost.toFixed(4)),
      totalCostUSD: Number(totalCost.toFixed(4)),
      formattedTotalUSD: Number(totalCost.toFixed(2)),
      categoryBreakdown: {
        input: { tokens: input, ratePerMillion: matchedTier.inputPerMillion, costUSD: Number(inputCost.toFixed(4)) },
        cache: { tokens: cache, ratePerMillion: matchedTier.cacheReadPerMillion, costUSD: Number(cacheCost.toFixed(4)) },
        output: { tokens: output, ratePerMillion: matchedTier.outputPerMillion, costUSD: Number(outputCost.toFixed(4)) }
      },
      isSimulation: !hasBreakdown && total > 0 && !!options.simulationSplit,
      unpricedTokens,
      hybrid,
      exclusionsNote: '估值未包含项目：缓存存储费用、超大上下文单请求分档溢价、向量检索与搜索接地费用。',
      pricingNote: '缓存读取按官方 10% 优惠费率折算，不作普通输入计价；输出已含 thinking token，不重复计算。'
    };
  }

  const SUBSCRIPTION_ACQUISITION_PRESETS = [
    { id: 'normal_paid', name: '正常付费订阅', category: 'paid', status: 'active', verifiedDate: '2026-11-09', sourceUrl: 'https://one.google.com/about/plans', defaultPaid: 19.99, note: '按月或按年常规全额付费订阅' },
    { id: 'student_offer', name: '学生认证优惠 (Google One AI Student)', category: 'discount', status: 'active', verifiedDate: '2026-11-09', sourceUrl: 'https://support.google.com/googleone/thread/460703251/updates-to-google-one-ai-student-offers-for-2026', defaultPaid: 0, note: '学生资格验证试用或专享折扣 (按地区提供 Plus/Pro)' },
    { id: 'pixel_bundle', name: 'Google Pixel 设备赠送', category: 'bundle_free', status: 'active', verifiedDate: '2026-11-09', sourceUrl: 'https://support.google.com/pixelphone/answer/13529884', defaultPaid: 0, note: '购买指定 Pixel 机型附赠权益 (如 Pixel 11 Pro 系列赠送 6 个月)' },
    { id: 'chromebook_bundle', name: 'Chromebook Plus 设备赠送', category: 'bundle_free', status: 'active', verifiedDate: '2026-11-09', sourceUrl: 'https://www.google.com/chromebook/chromebookplus/', defaultPaid: 0, note: '符合资格的 Chromebook Plus 设备赠送 Google AI Pro 权益' },
    { id: 'samsung_galaxy', name: 'Samsung Galaxy 设备指定活动', category: 'bundle_free', status: 'active', verifiedDate: '2026-11-09', sourceUrl: 'https://www.samsung.com/hk_en/offer/content-services-offer/tnc/', defaultPaid: 0, note: '指定 Galaxy 机型区域专享 Google AI Pro 活动 (需在有效领取期内)' },
    { id: 'jio_offer', name: 'Jio 运营商套餐权益', category: 'partner', status: 'expired_claim_active_use', verifiedDate: '2026-11-09', sourceUrl: 'https://www.jio.com/help/faq/mobile/offers/google-gemini-offer/', defaultPaid: 0, note: '历史活动 (新领取已截止，已成功兑换者享有最长 18 个月权益)' },
    { id: 'partner_carrier', name: '其他运营商 / 合作伙伴权益', category: 'partner', status: 'active', verifiedDate: '2026-11-09', sourceUrl: '', defaultPaid: 0, note: '宽带、通信套餐或第三方平台绑定的 AI 订阅权益' },
    { id: 'family_sharing', name: '家庭组共享 / 他人赠送', category: 'sharing', status: 'active', verifiedDate: '2026-11-09', sourceUrl: '', defaultPaid: 0, note: '加入家庭组成员车位或受赠权益 (非公开促销)' },
    { id: 'official_promo', name: 'Google 官方限时试用 / 促销活动', category: 'promo', status: 'active', verifiedDate: '2026-11-09', sourceUrl: '', defaultPaid: 0, note: '新用户首月免费或其他官方优惠码兑换' },
    { id: 'custom_source', name: '其他 / 自由自定义来源', category: 'custom', status: 'active', verifiedDate: '2026-11-09', sourceUrl: '', defaultPaid: null, note: '用户自定义填写的特定渠道或活动' }
  ];

  const CURRENCY_SYMBOLS = {
    USD: '$', CNY: '¥', JPY: '¥', HKD: 'HK$', EUR: '€', GBP: '£', SGD: 'S$', TRY: '₺',
    NGN: '₦', TWD: 'NT$', PHP: '₱', INR: '₹', BRL: 'R$', CAD: 'CA$', AUD: 'AU$', MYR: 'RM ',
    KRW: '₩', NZD: 'NZ$', THB: '฿', VND: '₫', IDR: 'Rp ', PKR: '₨ ', MXN: '$', ARS: '$',
    CLP: '$', COP: '$', PEN: 'S/ ', CHF: 'CHF ', UAH: '₴', PLN: 'zł ', SEK: 'kr ', NOK: 'kr ',
    DKK: 'kr ', CZK: 'Kč ', HUF: 'Ft ', RON: 'lei ', ZAR: 'R ', EGP: 'E£ ', KES: 'KSh ',
    AED: 'AED ', SAR: 'SAR ', ILS: '₪ '
  };

  const SUBSCRIPTION_REGIONS_PRESET = [
    { id: 'TW', name: '中国台湾', flag: '🇹🇼', currency: 'TWD', symbol: 'NT$', monthlyPrice: 650, rateToCNY: 0.21, aliases: ['tw', 'ntd', 'twd', 'taiwan', '台湾', '中国台湾', '台区'] },
    { id: 'HK', name: '中国香港', flag: '🇭🇰', currency: 'HKD', symbol: 'HK$', monthlyPrice: 158.00, rateToCNY: 0.857, aliases: ['hk', 'hong kong', '香港', '中国香港', '港区'] },
    { id: 'JP', name: '日本', flag: '🇯🇵', currency: 'JPY', symbol: '¥', monthlyPrice: 2900, rateToCNY: 0.0425, aliases: ['jp', 'japan', '日本', '日区'] },
    { id: 'KR', name: '韩国', flag: '🇰🇷', currency: 'KRW', symbol: '₩', monthlyPrice: 29000, rateToCNY: 0.0051, aliases: ['kr', 'korea', 'south korea', '韩国', '韩区'] },
    { id: 'AU', name: '澳大利亚 (澳区)', flag: '🇦🇺', currency: 'AUD', symbol: 'AU$', monthlyPrice: 32.99, rateToCNY: 4.45, aliases: ['au', 'aud', 'australia', '澳大利亚', '澳洲', '澳区'] },
    { id: 'NZ', name: '新西兰', flag: '🇳🇿', currency: 'NZD', symbol: 'NZ$', monthlyPrice: 34.99, rateToCNY: 4.05, aliases: ['nz', 'nzd', 'new zealand', '新西兰'] },
    { id: 'SG', name: '新加坡', flag: '🇸🇬', currency: 'SGD', symbol: 'S$', monthlyPrice: 27.99, rateToCNY: 5.12, aliases: ['sg', 'singapore', '新加坡', '星洲'] },
    { id: 'MY', name: '马来西亚', flag: '🇲🇾', currency: 'MYR', symbol: 'RM ', monthlyPrice: 97.99, rateToCNY: 1.55, aliases: ['my', 'myr', 'malaysia', '马来西亚', '大马'] },
    { id: 'TH', name: '泰国', flag: '🇹🇭', currency: 'THB', symbol: '฿', monthlyPrice: 750, rateToCNY: 0.20, aliases: ['th', 'thb', 'thailand', '泰国'] },
    { id: 'VN', name: '越南', flag: '🇻🇳', currency: 'VND', symbol: '₫', monthlyPrice: 489000, rateToCNY: 0.00028, aliases: ['vn', 'vnd', 'vietnam', '越南'] },
    { id: 'ID', name: '印度尼西亚', flag: '🇮🇩', currency: 'IDR', symbol: 'Rp ', monthlyPrice: 309000, rateToCNY: 0.00044, aliases: ['id', 'idr', 'indonesia', '印度尼西亚', '印尼'] },
    { id: 'PH', name: '菲律宾', flag: '🇵🇭', currency: 'PHP', symbol: '₱', monthlyPrice: 1100, rateToCNY: 0.117, aliases: ['ph', 'php', 'philippines', '菲律宾'] },
    { id: 'IN', name: '印度', flag: '🇮🇳', currency: 'INR', symbol: '₹', monthlyPrice: 1950, rateToCNY: 0.076, aliases: ['in', 'inr', 'india', '印度', '印区'] },
    { id: 'PK', name: '巴基斯坦', flag: '🇵🇰', currency: 'PKR', symbol: '₨ ', monthlyPrice: 5600, rateToCNY: 0.024, aliases: ['pk', 'pkr', 'pakistan', '巴基斯坦'] },
    { id: 'US', name: '美国', flag: '🇺🇸', currency: 'USD', symbol: '$', monthlyPrice: 19.99, rateToCNY: 6.72, aliases: ['us', 'usa', 'united states', '美国', '美区'] },
    { id: 'CA', name: '加拿大', flag: '🇨🇦', currency: 'CAD', symbol: 'CA$', monthlyPrice: 26.99, rateToCNY: 4.88, aliases: ['ca', 'cad', 'canada', '加拿大'] },
    { id: 'MX', name: '墨西哥', flag: '🇲🇽', currency: 'MXN', symbol: '$', monthlyPrice: 395, rateToCNY: 0.36, aliases: ['mx', 'mxn', 'mexico', '墨西哥'] },
    { id: 'BR', name: '巴西', flag: '🇧🇷', currency: 'BRL', symbol: 'R$', monthlyPrice: 96.99, rateToCNY: 1.18, aliases: ['br', 'brl', 'brazil', '巴西'] },
    { id: 'TR', name: '土耳其', flag: '🇹🇷', currency: 'TRY', symbol: '₺', monthlyPrice: 869.99, rateToCNY: 0.133, aliases: ['tr', 'try', 'turkey', '土耳其', '土区'] },
    { id: 'AR', name: '阿根廷', flag: '🇦🇷', currency: 'ARS', symbol: '$', monthlyPrice: 19999, rateToCNY: 0.0065, aliases: ['ar', 'ars', 'argentina', '阿根廷'] },
    { id: 'CL', name: '智利', flag: '🇨🇱', currency: 'CLP', symbol: '$', monthlyPrice: 18990, rateToCNY: 0.0072, aliases: ['cl', 'clp', 'chile', '智利'] },
    { id: 'CO', name: '哥伦比亚', flag: '🇨🇴', currency: 'COP', symbol: '$', monthlyPrice: 84900, rateToCNY: 0.0016, aliases: ['co', 'cop', 'colombia', '哥伦比亚'] },
    { id: 'PE', name: '秘鲁', flag: '🇵🇪', currency: 'PEN', symbol: 'S/ ', monthlyPrice: 76.90, rateToCNY: 1.82, aliases: ['pe', 'pen', 'peru', '秘鲁'] },
    { id: 'GB', name: '英国', flag: '🇬🇧', currency: 'GBP', symbol: '£', monthlyPrice: 18.99, rateToCNY: 8.75, aliases: ['gb', 'uk', 'gbp', 'united kingdom', '英国', '英区'] },
    { id: 'EU', name: '欧洲/欧盟 (德法意西荷等)', flag: '🇪🇺', currency: 'EUR', symbol: '€', monthlyPrice: 21.99, rateToCNY: 7.52, aliases: ['eu', 'eur', 'euro', 'europe', '欧洲', '欧盟', '德国', '法国', '意大利', '西班牙', '荷兰'] },
    { id: 'CH', name: '瑞士', flag: '🇨🇭', currency: 'CHF', symbol: 'CHF ', monthlyPrice: 17.00, rateToCNY: 7.85, aliases: ['ch', 'chf', 'switzerland', '瑞士'] },
    { id: 'UA', name: '乌克兰', flag: '🇺🇦', currency: 'UAH', symbol: '₴', monthlyPrice: 900, rateToCNY: 0.162, aliases: ['ua', 'uah', 'ukraine', '乌克兰'] },
    { id: 'PL', name: '波兰', flag: '🇵🇱', currency: 'PLN', symbol: 'zł ', monthlyPrice: 97.99, rateToCNY: 1.72, aliases: ['pl', 'pln', 'poland', '波兰'] },
    { id: 'SE', name: '瑞典', flag: '🇸🇪', currency: 'SEK', symbol: 'kr ', monthlyPrice: 239, rateToCNY: 0.65, aliases: ['se', 'sek', 'sweden', '瑞典'] },
    { id: 'NO', name: '挪威', flag: '🇳🇴', currency: 'NOK', symbol: 'kr ', monthlyPrice: 239, rateToCNY: 0.63, aliases: ['no', 'nok', 'norway', '挪威'] },
    { id: 'DK', name: '丹麦', flag: '🇩🇰', currency: 'DKK', symbol: 'kr ', monthlyPrice: 169, rateToCNY: 1.01, aliases: ['dk', 'dkk', 'denmark', '丹麦'] },
    { id: 'CZ', name: '捷克', flag: '🇨🇿', currency: 'CZK', symbol: 'Kč ', monthlyPrice: 529, rateToCNY: 0.30, aliases: ['cz', 'czk', 'czech', '捷克'] },
    { id: 'HU', name: '匈牙利', flag: '🇭🇺', currency: 'HUF', symbol: 'Ft ', monthlyPrice: 8990, rateToCNY: 0.0185, aliases: ['hu', 'huf', 'hungary', '匈牙利'] },
    { id: 'RO', name: '罗马尼亚', flag: '🇷🇴', currency: 'RON', symbol: 'lei ', monthlyPrice: 109.99, rateToCNY: 1.51, aliases: ['ro', 'ron', 'romania', '罗马尼亚'] },
    { id: 'NG', name: '尼日利亚', flag: '🇳🇬', currency: 'NGN', symbol: '₦', monthlyPrice: 28500, rateToCNY: 0.0042, aliases: ['ng', 'ngn', 'nigeria', '尼日利亚', '尼区'] },
    { id: 'ZA', name: '南非', flag: '🇿🇦', currency: 'ZAR', symbol: 'R ', monthlyPrice: 429.99, rateToCNY: 0.38, aliases: ['za', 'zar', 'south africa', '南非'] },
    { id: 'EG', name: '埃及', flag: '🇪🇬', currency: 'EGP', symbol: 'E£ ', monthlyPrice: 999, rateToCNY: 0.136, aliases: ['eg', 'egp', 'egypt', '埃及'] },
    { id: 'KE', name: '肯尼亚', flag: '🇰🇪', currency: 'KES', symbol: 'KSh ', monthlyPrice: 2800, rateToCNY: 0.052, aliases: ['ke', 'kes', 'kenya', '肯尼亚'] },
    { id: 'AE', name: '阿联酋', flag: '🇦🇪', currency: 'AED', symbol: 'AED ', monthlyPrice: 76.99, rateToCNY: 1.83, aliases: ['ae', 'aed', 'uae', 'emirates', '阿联酋', '迪拜'] },
    { id: 'SA', name: '沙特阿拉伯', flag: '🇸🇦', currency: 'SAR', symbol: 'SAR ', monthlyPrice: 85.99, rateToCNY: 1.79, aliases: ['sa', 'sar', 'saudi', '沙特', '沙特阿拉伯'] },
    { id: 'IL', name: '以色列', flag: '🇮🇱', currency: 'ILS', symbol: '₪ ', monthlyPrice: 79.90, rateToCNY: 1.85, aliases: ['il', 'ils', 'israel', '以色列'] },
    { id: 'CN', name: '中国大陆 (CNY)', flag: '🇨🇳', currency: 'CNY', symbol: '¥', monthlyPrice: 140.00, rateToCNY: 1.0, aliases: ['cn', 'cny', 'china', '中国', '人民币', '国内'] }
  ];

  function findRegionPreset(regionQuery) {
    if (!regionQuery || typeof regionQuery !== 'string') return null;
    const q = regionQuery.trim().toLowerCase();
    return SUBSCRIPTION_REGIONS_PRESET.find(r =>
      r.id.toLowerCase() === q ||
      r.name.toLowerCase() === q ||
      r.aliases.some(a => a.toLowerCase() === q || q.includes(a.toLowerCase()))
    ) || null;
  }

  function convertToCNY(amount, currency, regionQuery = null) {
    if (amount === null || amount === undefined || Number.isNaN(Number(amount))) return null;
    const num = Number(amount);
    if (num === 0) return 0;
    const cur = String(currency || '').toUpperCase();
    if (cur === 'CNY') return Number(num.toFixed(2));

    let preset = findRegionPreset(regionQuery);
    if (!preset || (cur && preset.currency !== cur)) {
      preset = SUBSCRIPTION_REGIONS_PRESET.find(r => r.currency === cur);
    }
    const rate = preset ? preset.rateToCNY : (cur === 'USD' ? 6.72 : (cur === 'HKD' ? 0.857 : (cur === 'JPY' ? 0.0425 : (cur === 'EUR' ? 7.52 : (cur === 'GBP' ? 8.75 : null)))));
    if (!rate) return null;
    return Number((num * rate).toFixed(2));
  }

  function resolveEffectivePlanStatus(livePlanStatus, customSettings, options = {}) {
    const rawLive = livePlanStatus && typeof livePlanStatus === 'object' ? livePlanStatus : null;
    const rawCustom = customSettings && typeof customSettings === 'object' ? customSettings : null;
    const cachedLive = options.cachedLivePlan && typeof options.cachedLivePlan === 'object' ? options.cachedLivePlan : null;

    const currentEmail = rawLive?.email || options.currentEmail || cachedLive?.email || null;
    const customAccount = rawCustom?.email || rawCustom?.account || null;

    const normCustomAcc = customAccount ? String(customAccount).trim().toLowerCase() : '';
    const normCurrentEmail = currentEmail ? String(currentEmail).trim().toLowerCase() : '';
    const isCustomAccountMatched = !normCustomAcc || normCustomAcc === 'default' || !normCurrentEmail || normCurrentEmail === 'default' || normCustomAcc === normCurrentEmail;
    const effectiveCustom = isCustomAccountMatched ? rawCustom : null;

    let status = 'unidentified';
    let tierKey = 'unknown';
    let tierName = '未知';
    let tierId = null;
    let planName = '未知';
    let tierSource = 'unknown';

    if (rawLive && rawLive.status === 'identified' && rawLive.tierKey !== 'unknown') {
      status = 'identified';
      tierKey = rawLive.tierKey;
      tierName = rawLive.tierName;
      tierId = rawLive.tierId;
      planName = rawLive.planName || rawLive.tierName;
      tierSource = 'live';
    } else if (effectiveCustom && effectiveCustom.tierName) {
      status = 'custom';
      tierKey = effectiveCustom.tierKey || 'custom';
      tierName = effectiveCustom.tierName;
      planName = effectiveCustom.tierName;
      tierSource = 'custom';
    } else if (cachedLive && cachedLive.status === 'identified' && cachedLive.tierKey !== 'unknown') {
      status = 'identified';
      tierKey = cachedLive.tierKey;
      tierName = cachedLive.tierName;
      tierId = cachedLive.tierId;
      planName = cachedLive.planName || cachedLive.tierName;
      tierSource = 'cached_live';
    }

    let country = '未知';
    let countrySource = 'unknown';
    const customAccVal = effectiveCustom?.accountRegion || effectiveCustom?.country;
    const isLiveCountryValid = rawLive?.country && rawLive.countrySource !== 'custom' && !String(rawLive.country).includes('未知');
    const isCachedCountryValid = cachedLive?.country && !String(cachedLive.country).includes('未知');
    if (isLiveCountryValid) {
      country = String(rawLive.country).trim();
      countrySource = 'live';
    } else if (customAccVal && typeof customAccVal === 'string' && customAccVal.trim() && !customAccVal.includes('未知')) {
      country = customAccVal.trim();
      countrySource = 'custom';
    } else if (isCachedCountryValid) {
      country = String(cachedLive.country).trim();
      countrySource = 'cached_live';
    }

    let region = '未知';
    let regionSource = 'unknown';
    const liveRegVal = rawLive?.subscriptionCountry || rawLive?.subscriptionRegion || rawLive?.region;
    const customRegVal = effectiveCustom?.subscriptionCountry || effectiveCustom?.subscriptionRegion || effectiveCustom?.region;
    const cachedRegVal = cachedLive?.subscriptionCountry || cachedLive?.subscriptionRegion || cachedLive?.region;
    const isLiveRegionValid = liveRegVal && rawLive?.regionSource !== 'custom' && rawLive?.regionSource !== 'preset_region' && !String(liveRegVal).includes('未知');
    const isCachedRegionValid = cachedRegVal && !String(cachedRegVal).includes('未知');

    if (isLiveRegionValid) {
      region = String(liveRegVal).trim();
      regionSource = 'live';
    } else if (customRegVal && typeof customRegVal === 'string' && customRegVal.trim() && !customRegVal.includes('未知')) {
      region = customRegVal.trim();
      regionSource = 'custom';
    } else if (isCachedRegionValid) {
      region = String(cachedRegVal).trim();
      regionSource = 'cached_live';
    }
    const subscriptionRegion = region;
    const subscriptionCountry = region;

    const customAcqId = effectiveCustom?.acquisitionSource || 'normal_paid';
    const presetAcq = SUBSCRIPTION_ACQUISITION_PRESETS.find(p => p.id === customAcqId) || null;
    const acquisitionSource = customAcqId;
    const acquisitionSourceName = effectiveCustom?.acquisitionSourceName || presetAcq?.name || '正常付费订阅';
    const acquisitionCategory = effectiveCustom?.acquisitionCategory || presetAcq?.category || 'paid';
    const validStartDate = effectiveCustom?.validStartDate || null;
    const validEndDate = effectiveCustom?.validEndDate || null;

    let isExpired = false;
    if (validEndDate && /^\d{4}-\d{2}-\d{2}$/.test(String(validEndDate))) {
      const today = new Date().toISOString().slice(0, 10);
      if (String(validEndDate) < today) isExpired = true;
    }

    let priceMode = effectiveCustom?.priceMode;
    if (priceMode !== 'preset' && priceMode !== 'custom') {
      const hasCustomPaid = Boolean(effectiveCustom && (effectiveCustom.isZeroExtraCost || (effectiveCustom.actualPricePaid !== null && effectiveCustom.actualPricePaid !== undefined && effectiveCustom.actualPricePaid !== '')));
      if (effectiveCustom?.priceSource === 'preset_region') {
        priceMode = 'preset';
      } else if (hasCustomPaid && (effectiveCustom?.priceSource === 'custom' || !findRegionPreset(region) || effectiveCustom?.actualPricePaid !== findRegionPreset(region)?.monthlyPrice)) {
        priceMode = 'custom';
      } else {
        priceMode = 'preset';
      }
    }

    let actualPricePaid = null;
    const officialPriceMonthly = rawLive?.officialPriceMonthly ?? cachedLive?.officialPriceMonthly ?? null;
    const matchedRegionPreset = findRegionPreset(region);
    let rawCur = (effectiveCustom?.subscriptionCurrency || effectiveCustom?.currency) ? String(effectiveCustom.subscriptionCurrency || effectiveCustom.currency).trim().toUpperCase() : '';
    if (rawCur === 'NTD') rawCur = 'TWD';
    const isValidCustomCurrency = Boolean(rawCur && (CURRENCY_SYMBOLS[rawCur] || SUBSCRIPTION_REGIONS_PRESET.some(p => p.currency === rawCur)));
    const isManualCurrency = isValidCustomCurrency && (
      effectiveCustom?.currencySource === 'custom' ||
      priceMode === 'custom' ||
      (matchedRegionPreset && rawCur !== matchedRegionPreset.currency && effectiveCustom?.currencySource !== 'preset_region')
    );

    let currency = 'USD';
    let currencySource = 'default';
    if (isManualCurrency) {
      currency = rawCur;
      currencySource = 'custom';
    } else if (matchedRegionPreset) {
      currency = matchedRegionPreset.currency;
      currencySource = 'preset_region';
    } else if (rawLive?.currency) {
      currency = rawLive.currency;
      currencySource = 'live';
    } else if (isValidCustomCurrency) {
      currency = rawCur;
      currencySource = 'custom';
    }
    if (currency === 'NTD') currency = 'TWD';
    if (!CURRENCY_SYMBOLS[currency]) currency = matchedRegionPreset?.currency || 'USD';

    const matchedCurrencyPreset = SUBSCRIPTION_REGIONS_PRESET.find(p => p.currency === currency);
    const curSymbol = CURRENCY_SYMBOLS[currency]
      || (matchedRegionPreset && matchedRegionPreset.currency === currency ? matchedRegionPreset.symbol : null)
      || (matchedCurrencyPreset ? matchedCurrencyPreset.symbol : null)
      || (currency + ' ');
    let billingCycle = '未知';
    let priceRangeNote = '未知';
    let isPriceEstimated = true;
    let priceSource = 'unknown';

    const isLivePaidValid = rawLive && rawLive.priceSource !== 'custom' && rawLive.priceSource !== 'preset_region' && rawLive.actualPricePaid !== null && rawLive.actualPricePaid !== undefined && Number.isFinite(Number(rawLive.actualPricePaid)) && Number(rawLive.actualPricePaid) >= 0;

    if (isLivePaidValid) {
      priceMode = 'live';
      actualPricePaid = Number(rawLive.actualPricePaid);
      isPriceEstimated = false;
      priceSource = 'live';
      billingCycle = rawLive.billingCycle || '月付';
      priceRangeNote = `${acquisitionSourceName} · 实际结算 ${curSymbol}${actualPricePaid} · ${billingCycle}`;
    } else if (priceMode === 'custom') {
      const isCustomZeroConfirmed = Boolean(effectiveCustom && (effectiveCustom.isZeroExtraCost || effectiveCustom.actualPricePaid === 0 || effectiveCustom.actualPricePaid === '0'));
      const isCustomPaidValid = Boolean(effectiveCustom && effectiveCustom.actualPricePaid !== null && effectiveCustom.actualPricePaid !== undefined && effectiveCustom.actualPricePaid !== '' && Number.isFinite(Number(effectiveCustom.actualPricePaid)) && Number(effectiveCustom.actualPricePaid) >= 0);

      if (isCustomZeroConfirmed) {
        actualPricePaid = 0;
        isPriceEstimated = false;
        priceSource = 'custom';
        billingCycle = effectiveCustom?.billingCycle || '随套餐赠送/免费';
        priceRangeNote = isExpired
          ? `${acquisitionSourceName} · 权益已到期`
          : `${acquisitionSourceName} · 订阅额外实付 ${curSymbol}0 · 用户确认`;
      } else if (isCustomPaidValid) {
        actualPricePaid = Number(effectiveCustom.actualPricePaid);
        isPriceEstimated = false;
        priceSource = 'custom';
        billingCycle = effectiveCustom.billingCycle || '月付';
        priceRangeNote = isExpired
          ? `${acquisitionSourceName} · 权益已到期`
          : `${acquisitionSourceName} · 用户实付 ${curSymbol}${actualPricePaid} · ${billingCycle}`;
      } else {
        actualPricePaid = null;
        isPriceEstimated = false;
        priceSource = 'custom';
        billingCycle = effectiveCustom?.billingCycle || '月付';
        priceRangeNote = `${acquisitionSourceName} · 待设置实付金额`;
      }
    } else {
      priceMode = 'preset';
      if (matchedRegionPreset) {
        actualPricePaid = Number(matchedRegionPreset.monthlyPrice);
        isPriceEstimated = true;
        priceSource = 'preset_region';
        billingCycle = effectiveCustom?.billingCycle || '月付';
        priceRangeNote = `${acquisitionSourceName} · 地区参考价 ${curSymbol}${actualPricePaid} · ${billingCycle}`;
      } else if (officialPriceMonthly !== null) {
        actualPricePaid = null;
        priceSource = 'official_reference';
        billingCycle = '月付 · 公开参考';
        priceRangeNote = `${acquisitionSourceName} · 公开参考价 $${officialPriceMonthly}/月`;
      } else {
        actualPricePaid = null;
        priceSource = 'unknown';
        billingCycle = '未知';
        priceRangeNote = `${acquisitionSourceName} · 待设置订阅国家与价格`;
      }
    }

    const customNote = effectiveCustom?.customNote ? String(effectiveCustom.customNote).trim() : null;
    const promptCredits = rawLive?.promptCredits || cachedLive?.promptCredits || null;
    const flowCredits = rawLive?.flowCredits || cachedLive?.flowCredits || null;

    const rateRegion = (matchedRegionPreset && matchedRegionPreset.currency === currency) ? region : null;
    const effectiveRate = (matchedRegionPreset && matchedRegionPreset.currency === currency)
      ? matchedRegionPreset.rateToCNY
      : (matchedCurrencyPreset ? matchedCurrencyPreset.rateToCNY : (currency === 'USD' ? 6.72 : (currency === 'HKD' ? 0.857 : (currency === 'JPY' ? 0.0425 : (currency === 'CNY' ? 1.0 : null)))));
    const actualPricePaidCNY = actualPricePaid !== null ? convertToCNY(actualPricePaid, currency, rateRegion) : null;
    const cnyFormatted = actualPricePaidCNY !== null ? (currency === 'CNY' ? ('¥' + actualPricePaidCNY) : ('折合 ≈ ¥' + actualPricePaidCNY.toFixed(1) + ' CNY')) : null;

    if (actualPricePaidCNY !== null && actualPricePaid > 0 && currency !== 'CNY') {
      priceRangeNote += ' (' + cnyFormatted + ')';
    }

    return {
      status,
      tierKey,
      tierName,
      tierId,
      planName,
      email: currentEmail,
      accountRegion: country,
      country,
      countrySource,
      subscriptionCountry: region,
      subscriptionRegion,
      region,
      regionSource,
      regionPreset: matchedRegionPreset,
      subscriptionCurrency: currency,
      currency,
      currencySource,
      currencySymbol: curSymbol,
      actualPricePaidCNY,
      cnyFormatted,
      exchangeRateToCNY: effectiveRate,
      billingCycle,
      acquisitionSource,
      acquisitionSourceName,
      acquisitionCategory,
      isZeroExtraCost: actualPricePaid === 0,
      validStartDate,
      validEndDate,
      isExpired,
      officialPriceMonthly,
      priceRangeNote,
      priceMode,
      actualPricePaid,
      isPriceEstimated,
      priceSource,
      customNote,
      promptCredits,
      flowCredits,
      sources: {
        tier: tierSource,
        country: countrySource,
        region: regionSource,
        currency: currencySource,
        price: priceSource,
        acquisition: effectiveCustom?.acquisitionSource ? 'custom' : 'default'
      },
      hasCustomSettings: Boolean(effectiveCustom && (effectiveCustom.country || effectiveCustom.region || effectiveCustom.subscriptionRegion || effectiveCustom.currency || effectiveCustom.actualPricePaid !== undefined || effectiveCustom.customNote || effectiveCustom.acquisitionSource)),
      pricingTableVerifiedDate: '2026-11-09',
      updatedAt: rawLive?.updatedAt || new Date().toISOString()
    };
  }

  function normalizeTokenHistoryPayload(payload, options = {}) {
    if (!payload || typeof payload !== 'object') return null;
    const source = options.source || 'all';
    const pricingDate = options.pricingDate || '2026-11-09';
    const modelId = options.modelId || 'gemini-3.8-flash';

    const dailyMapBySource = payload.dailyMapBySource && typeof payload.dailyMapBySource === 'object'
      ? payload.dailyMapBySource
      : { all: payload.dailyMap || {}, desktop: {}, cli: {} };

    const targetMap = dailyMapBySource[source] || dailyMapBySource.all || payload.dailyMap || {};
    const normalizedMap = {};
    for (const [k, rec] of Object.entries(targetMap)) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(k) || !rec) continue;
      normalizedMap[k] = {
        total: Number(rec.total) || 0,
        input: Number(rec.input) || 0,
        output: Number(rec.output) || 0,
        cache: Number(rec.cache) || 0,
        steps: Number(rec.steps) || 0
      };
    }

    const todayStr = options.todayStr || (new Date()).toISOString().slice(0, 10);
    const currentMonthPrefix = todayStr.slice(0, 7);
    const currentYearPrefix = todayStr.slice(0, 4);

    let grandTotalTokens = 0;
    let totalInputTokens = 0;
    let totalOutputTokens = 0;
    let totalCacheTokens = 0;
    let todayTokens = 0;
    let monthTokens = 0;
    let yearTokens = 0;
    let currentMonthInput = 0;
    let currentMonthOutput = 0;
    let currentMonthCache = 0;
    let activeDaysCount = 0;

    for (const [k, rec] of Object.entries(normalizedMap)) {
      if (rec.total > 0) activeDaysCount++;
      grandTotalTokens += rec.total;
      totalInputTokens += rec.input;
      totalOutputTokens += rec.output;
      totalCacheTokens += rec.cache;

      if (k === todayStr) todayTokens += rec.total;
      if (k.startsWith(currentMonthPrefix)) {
        monthTokens += rec.total;
        currentMonthInput += rec.input;
        currentMonthOutput += rec.output;
        currentMonthCache += rec.cache;
      }
      if (k.startsWith(currentYearPrefix)) yearTokens += rec.total;
    }

    const rawSum = payload.summary || {};
    if (source === 'all') {
      if (Number(rawSum.totalInputTokens) > totalInputTokens) totalInputTokens = Number(rawSum.totalInputTokens);
      if (Number(rawSum.totalOutputTokens) > totalOutputTokens) totalOutputTokens = Number(rawSum.totalOutputTokens);
      if (Number(rawSum.totalCacheTokens) > totalCacheTokens) totalCacheTokens = Number(rawSum.totalCacheTokens);
      if (Number(rawSum.grandTotalTokens) > grandTotalTokens) grandTotalTokens = Number(rawSum.grandTotalTokens);
      if (Number(rawSum.currentMonthInput) > currentMonthInput) currentMonthInput = Number(rawSum.currentMonthInput);
      if (Number(rawSum.currentMonthOutput) > currentMonthOutput) currentMonthOutput = Number(rawSum.currentMonthOutput);
      if (Number(rawSum.currentMonthCache) > currentMonthCache) currentMonthCache = Number(rawSum.currentMonthCache);
      if (Number(rawSum.monthTokens) > monthTokens) monthTokens = Number(rawSum.monthTokens);
    }

    const refMonth = payload.referenceCost?.currentMonth;
    const refAll = payload.referenceCost?.all;
    if (refMonth) {
      if (refMonth.inputTokens && !currentMonthInput) currentMonthInput = Number(refMonth.inputTokens);
      if (refMonth.cacheTokens && !currentMonthCache) currentMonthCache = Number(refMonth.cacheTokens);
      if (refMonth.outputTokens && !currentMonthOutput) currentMonthOutput = Number(refMonth.outputTokens);
      if (refMonth.totalTokens && !monthTokens) monthTokens = Number(refMonth.totalTokens);
      else if (!monthTokens && (currentMonthInput || currentMonthOutput || currentMonthCache)) {
        monthTokens = currentMonthInput + currentMonthOutput + currentMonthCache;
      }
    }
    if (refAll) {
      if (refAll.inputTokens && !totalInputTokens) totalInputTokens = Number(refAll.inputTokens);
      if (refAll.cacheTokens && !totalCacheTokens) totalCacheTokens = Number(refAll.cacheTokens);
      if (refAll.outputTokens && !totalOutputTokens) totalOutputTokens = Number(refAll.outputTokens);
      if (refAll.totalTokens && !grandTotalTokens) grandTotalTokens = Number(refAll.totalTokens);
      else if (!grandTotalTokens && (totalInputTokens || totalOutputTokens || totalCacheTokens)) {
        grandTotalTokens = totalInputTokens + totalOutputTokens + totalCacheTokens;
      }
    }

    const summary = {
      grandTotalTokens,
      totalInputTokens,
      totalOutputTokens,
      totalCacheTokens,
      todayTokens,
      monthTokens,
      yearTokens,
      currentMonthInput,
      currentMonthOutput,
      currentMonthCache,
      activeDaysCount,
      totalConversations: Number(rawSum.totalConversations) || activeDaysCount,
      firstUseDate: payload.firstUseDate || rawSum.firstUseDate || null
    };

    let referenceCost = payload.referenceCost;
    if (!referenceCost || !referenceCost.all || !referenceCost.currentMonth) {
      const calcRefAll = calculateReferenceModelCost({
        inputTokens: totalInputTokens,
        outputTokens: totalOutputTokens,
        cacheTokens: totalCacheTokens,
        totalTokens: grandTotalTokens
      }, modelId, { pricingDate, mode: 'all' });

      const calcRefMonth = calculateReferenceModelCost({
        inputTokens: currentMonthInput,
        outputTokens: currentMonthOutput,
        cacheTokens: currentMonthCache,
        totalTokens: monthTokens
      }, modelId, { pricingDate, mode: 'all' });

      referenceCost = {
        all: calcRefAll,
        currentMonth: calcRefMonth,
        hybrid: referenceCost?.hybrid || calcRefAll,
        currentMonthHybrid: referenceCost?.currentMonthHybrid || calcRefMonth
      };
    }

    return {
      schemaVersion: payload.schemaVersion || '1.0.0',
      version: payload.version || '1.0.0',
      updatedAt: payload.updatedAt || '',
      firstUseDate: summary.firstUseDate,
      currentPeriod: payload.currentPeriod || {
        key: currentMonthPrefix,
        label: `${currentMonthPrefix} (自然月)`,
        isCurrentMonth: true
      },
      planStatus: payload.planStatus || null,
      rawPlanStatus: payload.rawPlanStatus || payload.planStatus || null,
      customPlanSettings: payload.customPlanSettings || null,
      costEstimate: payload.costEstimate || null,
      costEstimateCurrentMonth: payload.costEstimateCurrentMonth || null,
      costEstimateBySource: payload.costEstimateBySource || null,
      referenceCost,
      summary,
      dailyMap: normalizedMap,
      dailyMapBySource
    };
  }

  function getLvlForRange(value, kind = 'day', maxInWindow = 0) {
    const v = Number(value) || 0;
    if (v <= 0) return 0;
    if (kind === 'day') {
      if (v < 3e6) return 1;
      if (v < 15e6) return 2;
      if (v < 60e6) return 3;
      return 4;
    }
    const max = Number(maxInWindow) || 0;
    if (max <= 0) return 1;
    const ratio = v / max;
    if (ratio <= 0.25) return 1;
    if (ratio <= 0.50) return 2;
    if (ratio <= 0.75) return 3;
    return 4;
  }

  const _dailyCostCache = new Map();

  function clearDailyCostCache() {
    _dailyCostCache.clear();
  }

  function getDailyModelCost(dayRecord, dateKey, modelKey = 'gemini-3.8-flash', options = {}) {
    if (!dayRecord || (!dayRecord.total && !dayRecord.input && !dayRecord.output && !dayRecord.cache)) {
      return { costUSD: 0, inputCost: 0, cacheCost: 0, outputCost: 0 };
    }
    const mode = options.mode || 'ref';
    const pricingDate = options.pricingDate ? String(options.pricingDate).slice(0, 10) : '2026-11-08';
    const cacheKey = `${dateKey}:${modelKey}:${mode}:${pricingDate}:${dayRecord.input || 0}:${dayRecord.cache || 0}:${dayRecord.output || 0}:${dayRecord.total || 0}`;
    if (_dailyCostCache.has(cacheKey)) {
      return _dailyCostCache.get(cacheKey);
    }

    const calc = calculateReferenceModelCost({
      inputTokens: dayRecord.input || 0,
      cacheTokens: dayRecord.cache || 0,
      outputTokens: dayRecord.output || 0,
      totalTokens: dayRecord.total || 0
    }, modelKey, {
      pricingDate,
      mode: mode === 'hybrid' ? 'unpriced_only' : undefined
    });

    const res = {
      costUSD: calc.totalCostUSD || 0,
      inputCost: calc.inputCostUSD ?? calc.breakdownCostUSD?.input ?? 0,
      cacheCost: calc.cacheCostUSD ?? calc.breakdownCostUSD?.cache ?? 0,
      outputCost: calc.outputCostUSD ?? calc.breakdownCostUSD?.output ?? 0
    };
    _dailyCostCache.set(cacheKey, res);
    return res;
  }

  function calculateIntervalCost(dailyMap = {}, dateKeys = [], modelKey = 'gemini-3.8-flash', options = {}) {
    const todayStr = options.todayStr || (new Date().toISOString().slice(0, 10));
    let totalTokens = 0;
    let inputTokens = 0;
    let cacheTokens = 0;
    let outputTokens = 0;
    let totalCostUSD = 0;
    let pastDays = 0;
    let activeDays = 0;

    for (const key of dateKeys) {
      const isFuture = key > todayStr;
      if (!isFuture) pastDays++;
      const rec = dailyMap[key];
      if (rec && rec.total > 0) {
        activeDays++;
        totalTokens += rec.total;
        inputTokens += (rec.input || 0);
        cacheTokens += (rec.cache || 0);
        outputTokens += (rec.output || 0);
        const cost = getDailyModelCost(rec, key, modelKey, options);
        totalCostUSD += cost.costUSD;
      }
    }

    const safePastDays = Math.max(1, pastDays);
    return {
      totalTokens,
      inputTokens,
      cacheTokens,
      outputTokens,
      totalCostUSD: Number(totalCostUSD.toFixed(4)),
      pastDays,
      activeDays,
      dailyAverageUSD: Number((totalCostUSD / safePastDays).toFixed(4)),
      activeDailyAverageUSD: activeDays > 0 ? Number((totalCostUSD / activeDays).toFixed(4)) : 0
    };
  }

  const api = {
    parseDurationSec,
    GEMINI_PRICING_TABLE,
    SUBSCRIPTION_ACQUISITION_PRESETS,
    SUBSCRIPTION_REGIONS_PRESET,
    findRegionPreset,
    convertToCNY,
    CURRENCY_SYMBOLS,
    extractModelString,
    normalizeModelId,
    resolveStableModelId,
    EFFORT_WHITELIST,
    formatEffortLabel,
    detectModelVendor,
    groupModelProduct,
    formatTokensK,
    isValidSpeedSample,
    MAX_SPEED_SAMPLES_PER_MODEL,
    calculateRequestApiCost,
    summarizeApiCost,
    calculateReferenceModelCost,
    resolveEffectivePlanStatus,
    parseUserPlanStatus,
    parseGeneratorCall,
    normalizeTokenHistoryPayload,
    getLvlForRange,
    getDailyModelCost,
    calculateIntervalCost,
    clearDailyCostCache
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  } else {
    root.__AGUsageCore = api;
    root.__AGContextMeterCore = api;
  }
})(globalThis);
