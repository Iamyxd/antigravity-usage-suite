'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const { safeWriteJsonSync, safeReadJsonSync } = require('./usage-storage');
const {
  summarizeApiCost,
  calculateReferenceModelCost,
  resolveEffectivePlanStatus,
  SUBSCRIPTION_ACQUISITION_PRESETS,
  CURRENCY_SYMBOLS,
  parseUserPlanStatus,
  parseGeneratorCall,
  normalizeModelId,
  resolveStableModelId,
  isValidSpeedSample,
  MAX_SPEED_SAMPLES_PER_MODEL,
  calculateRequestApiCost
} = require('./usage-core');

const VALID_PANEL_LANGUAGES = new Set(['zh-CN', 'zh-TW', 'en']);
const TRANSCRIPT_SKIP_DIRS = new Set(['steps', 'scratch', 'media', 'artifacts', 'node_modules', '.git', '__pycache__']);
const transcriptFileCache = new Map();

let cachedLedger = null;
let cachedTokenHistory = null;
let cachedTokenHistoryAt = 0;
let cachedHostUserStatus = null;
let cachedHostUserStatusAt = 0;
let activeScanPromise = null;
let currentScanSequence = 0;

/**
 * Reset in-memory caches (mainly for deterministic automated tests).
 */
function resetCollectorCaches() {
  cachedLedger = null;
  cachedTokenHistory = null;
  cachedTokenHistoryAt = 0;
  cachedHostUserStatus = null;
  cachedHostUserStatusAt = 0;
  activeScanPromise = null;
  transcriptFileCache.clear();
  collectTokenHistoryAsync._lastArchiveSig = null;
}

function formatLocalDateKey(dateObj) {
  const y = dateObj.getFullYear();
  const m = String(dateObj.getMonth() + 1).padStart(2, '0');
  const d = String(dateObj.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function isCompanionOrTempFile(fileName) {
  const lower = String(fileName || '').toLowerCase();
  return lower.endsWith('-wal') ||
    lower.endsWith('-shm') ||
    lower.endsWith('-journal') ||
    lower.endsWith('.tmp') ||
    lower.endsWith('.lock') ||
    lower.endsWith('.bak');
}

function isSyntheticCall(callId, call = {}) {
  if (!callId) return false;
  const sId = String(callId).toLowerCase();
  const cId = String(call?.cascadeId || '').toLowerCase();
  return sId.startsWith('test_') ||
    sId.startsWith('fixture_') ||
    sId.startsWith('synthetic_') ||
    sId.includes('desktop_response_001') ||
    cId.includes('verify') ||
    cId.includes('test') ||
    cId.includes('mock');
}

function resolveAgDir(overridePathOrDir) {
  if (overridePathOrDir) {
    return overridePathOrDir.endsWith('.json') ? path.dirname(overridePathOrDir) : overridePathOrDir;
  }
  if (process.env.AG_DIR) return process.env.AG_DIR;
  const home = process.env.USERPROFILE || os.homedir();
  return path.join(home, '.gemini', 'antigravity');
}

function getPricingLedgerPath(overridePathOrDir) {
  if (overridePathOrDir && overridePathOrDir.endsWith('.json')) return overridePathOrDir;
  return path.join(resolveAgDir(overridePathOrDir), 'pricing_ledger_v1.json');
}

function quarantineSyntheticCalls(overridePathOrDir) {
  const p = getPricingLedgerPath(overridePathOrDir);
  const qPath = p.replace('pricing_ledger_v1.json', 'pricing_ledger_quarantine.json');
  if (!fs.existsSync(p)) return { quarantinedCount: 0 };

  try {
    const readRes = safeReadJsonSync(p, null);
    if (!readRes.ok || !readRes.data || typeof readRes.data !== 'object') {
      return { quarantinedCount: 0 };
    }
    const raw = readRes.data;
    const calls = raw.calls || {};
    const quarantined = {};
    const kept = {};

    for (const [id, call] of Object.entries(calls)) {
      if (isSyntheticCall(id, call)) quarantined[id] = call;
      else kept[id] = call;
    }

    const qCount = Object.keys(quarantined).length;
    if (qCount > 0) {
      let qData = { version: '1.0.0', quarantinedAt: new Date().toISOString(), calls: {} };
      if (fs.existsSync(qPath)) {
        const qRead = safeReadJsonSync(qPath, null);
        if (qRead.ok && qRead.data && typeof qRead.data === 'object') qData = qRead.data;
      }
      qData.calls = { ...qData.calls, ...quarantined };
      safeWriteJsonSync(qPath, qData);

      raw.calls = kept;
      raw.updatedAt = new Date().toISOString();
      const saveRes = safeWriteJsonSync(p, raw);
      if (saveRes.ok && cachedLedger && cachedLedger.calls) {
        cachedLedger.calls = kept;
      }
    }
    return { quarantinedCount: qCount };
  } catch {
    return { quarantinedCount: 0 };
  }
}

function loadPricingLedger(overridePathOrDir) {
  if (!overridePathOrDir && cachedLedger && !cachedLedger.__corrupted) return cachedLedger;
  const p = getPricingLedgerPath(overridePathOrDir);
  const def = { version: '1.0.0', updatedAt: '', calls: {} };
  const bakPath = p.replace(/\.json$/i, '') + '.bak.json';
  const readRes = safeReadJsonSync(p, null, {
    backupPath: bakPath,
    validate: (data) => data && typeof data === 'object' && typeof data.calls === 'object'
  });

  if (!readRes.exists) {
    if (!overridePathOrDir) cachedLedger = def;
    return def;
  }

  if (readRes.corrupted && !readRes.recoveredFromBackup) {
    return {
      version: '1.0.0',
      updatedAt: '',
      calls: {},
      __corrupted: true,
      __corruptedPath: p,
      __error: readRes.error
    };
  }

  const raw = readRes.data || def;
  const ledger = { version: raw.version || '1.0.0', updatedAt: raw.updatedAt || '', calls: raw.calls || {} };
  let hasSynthetic = false;
  for (const [id, call] of Object.entries(ledger.calls)) {
    if (isSyntheticCall(id, call)) {
      hasSynthetic = true;
      break;
    }
  }
  if (hasSynthetic) {
    quarantineSyntheticCalls(overridePathOrDir);
    const cleanedRes = safeReadJsonSync(p, null);
    if (cleanedRes.ok && cleanedRes.data && typeof cleanedRes.data === 'object') {
      ledger.calls = cleanedRes.data.calls || {};
      ledger.updatedAt = cleanedRes.data.updatedAt || '';
    }
  }

  if (!readRes.corrupted && fs.existsSync(p)) {
    try {
      if (!fs.existsSync(bakPath) || Math.random() < 0.1) fs.copyFileSync(p, bakPath);
    } catch {}
  }

  if (!overridePathOrDir) cachedLedger = ledger;
  return ledger;
}

function savePricingLedger(ledger, overridePathOrDir) {
  if (ledger && ledger.__corrupted) {
    return { ok: false, error: '原账本数据已损坏且未从备份恢复，已阻止以空数据覆盖原有历史' };
  }
  const p = getPricingLedgerPath(overridePathOrDir);
  const res = safeWriteJsonSync(p, ledger, {
    validate: (data) => data && typeof data === 'object' && typeof data.calls === 'object'
  });
  if (res.ok && !overridePathOrDir) cachedLedger = ledger;
  return res;
}

function createRecordResult(ok, changed, error, phase) {
  return {
    ok: !!ok,
    changed: !!changed,
    error: error || undefined,
    phase: phase || undefined,
    valueOf() { return this.changed; }
  };
}

function hasSpeedMetrics(rec) {
  if (!rec || typeof rec !== 'object') return false;
  return rec.durationSec != null || rec.tps != null || rec.ttftSec != null || rec.streamingSec != null;
}

function getCallSortTimestamp(rec) {
  if (!rec) return 0;
  if (Number.isFinite(Number(rec.timestamp)) && Number(rec.timestamp) > 0) return Number(rec.timestamp);
  if (rec.created_at) {
    const t = Date.parse(rec.created_at);
    if (Number.isFinite(t) && t > 0) return t;
  }
  if (rec.date) {
    const t = Date.parse(rec.date);
    if (Number.isFinite(t) && t > 0) return t;
  }
  return Number(rec.updatedAt) || 0;
}

function pruneExcessSpeedSamples(draftCalls, limit = MAX_SPEED_SAMPLES_PER_MODEL || 200) {
  if (!draftCalls || typeof draftCalls !== 'object') return false;
  const byModel = new Map();
  for (const [callId, rec] of Object.entries(draftCalls)) {
    if (!rec || !hasSpeedMetrics(rec)) continue;
    const exactId = String(rec.modelExactId || resolveStableModelId(rec) || rec.model || '').trim().toLowerCase();
    if (!exactId) continue;
    if (!byModel.has(exactId)) byModel.set(exactId, []);
    byModel.get(exactId).push({ callId, ts: getCallSortTimestamp(rec) });
  }
  let pruned = false;
  for (const entries of byModel.values()) {
    if (entries.length <= limit) continue;
    entries.sort((a, b) => b.ts - a.ts);
    for (let i = limit; i < entries.length; i++) {
      const rec = draftCalls[entries[i].callId];
      if (!rec) continue;
      const copy = { ...rec };
      delete copy.ttftSec;
      delete copy.streamingSec;
      delete copy.durationSec;
      delete copy.tps;
      delete copy.origin;
      draftCalls[entries[i].callId] = copy;
      pruned = true;
    }
  }
  return pruned;
}

/**
 * Idempotently record finalized or progressed model calls into pricing_ledger_v1.json.
 */
function recordModelCalls(newCalls = [], options = {}) {
  if (!Array.isArray(newCalls) || !newCalls.length) return createRecordResult(true, false);
  const targetDir = typeof options === 'string' ? options : (options.ledgerPath || options.agDir);
  const ledger = loadPricingLedger(targetDir);

  if (ledger.__corrupted) {
    return createRecordResult(false, false, `账本已损坏，阻止空覆盖 (${ledger.__corruptedPath})`, 'corrupted_guard');
  }

  const draftCalls = { ...(ledger.calls || {}) };
  let changed = false;

  for (const call of newCalls) {
    if (!call || !call.callId) continue;
    if (!options.allowSynthetic && isSyntheticCall(call.callId, call)) continue;

    const existing = draftCalls[call.callId];
    if (!existing) {
      draftCalls[call.callId] = { ...call, updatedAt: Date.now() };
      changed = true;
      continue;
    }

    const stateProgressed = existing.status === 'streaming' && call.status === 'final';
    const usageProgressed = (call.outputTokens || 0) > (existing.outputTokens || 0) || (call.totalTokens || 0) > (existing.totalTokens || 0);
    const pricingProgressed = (!existing.isPriced || !existing.costUSD) && (call.isPriced && call.costUSD > 0);
    const speedProgressed = !hasSpeedMetrics(existing) && hasSpeedMetrics(call) && isValidSpeedSample(call);
    const modelExactProgressed = !existing.modelExactId && Boolean(call.modelExactId);
    const isStaleRollback = (existing.status === 'final' && call.status !== 'final') ||
      (existing.status === 'final' && (call.outputTokens || 0) < (existing.outputTokens || 0));

    if (!isStaleRollback && (stateProgressed || usageProgressed || pricingProgressed || speedProgressed || modelExactProgressed)) {
      draftCalls[call.callId] = {
        ...existing,
        ...call,
        created_at: existing.created_at || call.created_at,
        date: existing.date || call.date,
        updatedAt: Date.now()
      };
      changed = true;
    }
  }

  if (pruneExcessSpeedSamples(draftCalls)) changed = true;

  if (changed) {
    const draftLedger = {
      ...ledger,
      calls: draftCalls,
      updatedAt: new Date().toISOString()
    };
    const saveRes = savePricingLedger(draftLedger, targetDir);
    if (!saveRes.ok) {
      return createRecordResult(false, false, saveRes.error || '保存账本落盘失败', saveRes.phase);
    }
    if (!targetDir) cachedTokenHistoryAt = 0;
  }

  return createRecordResult(true, changed);
}

function getCustomPlanPath(overridePathOrDir) {
  if (overridePathOrDir && overridePathOrDir.endsWith('.json')) return overridePathOrDir;
  return path.join(resolveAgDir(overridePathOrDir), 'custom_plan_v1.json');
}

function sanitizeAccountPlanEntry(entry, accountKey = 'default') {
  if (!entry || typeof entry !== 'object' || Array.isArray(entry)) return null;
  const out = { ...entry };
  out.account = String(entry.account || accountKey || 'default').trim().toLowerCase();

  const rawAccReg = (typeof out.accountRegion === 'string' && out.accountRegion.trim())
    ? out.accountRegion.trim()
    : ((typeof out.country === 'string' && out.country.trim()) ? out.country.trim() : '');
  if (rawAccReg && !rawAccReg.includes('未知')) {
    out.accountRegion = rawAccReg;
    out.country = rawAccReg;
  } else {
    delete out.accountRegion;
    delete out.country;
  }

  const rawSubCountry = (typeof out.subscriptionCountry === 'string' && out.subscriptionCountry.trim())
    ? out.subscriptionCountry.trim()
    : ((typeof out.subscriptionRegion === 'string' && out.subscriptionRegion.trim())
      ? out.subscriptionRegion.trim()
      : ((typeof out.region === 'string' && out.region.trim()) ? out.region.trim() : ''));
  if (rawSubCountry && !rawSubCountry.includes('未知')) {
    out.subscriptionCountry = rawSubCountry;
    out.subscriptionRegion = rawSubCountry;
    out.region = rawSubCountry;
  } else {
    delete out.subscriptionCountry;
    delete out.subscriptionRegion;
    delete out.region;
  }

  const rawCur = (typeof out.subscriptionCurrency === 'string' && out.subscriptionCurrency.trim())
    ? out.subscriptionCurrency.trim()
    : ((typeof out.currency === 'string' && out.currency.trim()) ? out.currency.trim() : '');
  if (rawCur) {
    let cur = rawCur.toUpperCase();
    if (cur === 'NTD') cur = 'TWD';
    if (CURRENCY_SYMBOLS[cur]) {
      out.subscriptionCurrency = cur;
      out.currency = cur;
      if (!out.currencySymbol) out.currencySymbol = CURRENCY_SYMBOLS[cur];
    } else {
      delete out.subscriptionCurrency;
      delete out.currency;
      delete out.currencySymbol;
    }
  } else {
    delete out.subscriptionCurrency;
    delete out.currency;
    delete out.currencySymbol;
  }

  if (out.currencySource) out.currencySource = String(out.currencySource).trim();

  if (out.actualPricePaid !== undefined && out.actualPricePaid !== null && out.actualPricePaid !== '') {
    const num = Number(out.actualPricePaid);
    out.actualPricePaid = (Number.isFinite(num) && num >= 0) ? num : null;
  } else {
    out.actualPricePaid = null;
  }

  if (out.priceMode !== 'custom' && out.priceMode !== 'preset') {
    if (out.priceSource === 'preset_region') out.priceMode = 'preset';
    else if (out.actualPricePaid !== null) out.priceMode = 'custom';
    else out.priceMode = 'preset';
  }

  if (out.priceMode === 'custom' && out.actualPricePaid !== null) {
    out.customActualPrice = out.actualPricePaid;
  }
  if (out.customActualPrice !== undefined && out.customActualPrice !== null && out.customActualPrice !== '') {
    const cNum = Number(out.customActualPrice);
    if (Number.isFinite(cNum) && cNum >= 0) out.customActualPrice = cNum;
    else delete out.customActualPrice;
  }

  return out;
}

function loadCustomPlanSettings(overridePathOrDir) {
  const p = getCustomPlanPath(overridePathOrDir);
  const def = {
    version: '1.1.0',
    updatedAt: '',
    lastAccount: 'default',
    accounts: {},
    uiPreferences: {}
  };
  try {
    if (!fs.existsSync(p)) return def;
    const content = fs.readFileSync(p, 'utf8');
    if (!content.trim()) return def;
    let raw;
    try {
      raw = JSON.parse(content);
    } catch {
      try {
        const bakCorrupt = p.replace(/\.json$/i, '') + '.corrupt.bak.json';
        fs.copyFileSync(p, bakCorrupt);
      } catch {}
      return { ...def, recoveredFromCorruption: true };
    }
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
      return { ...def, recoveredFromCorruption: true };
    }

    const accounts = {};
    if (!raw.accounts && (raw.region || raw.subscriptionRegion || raw.country || raw.currency || raw.actualPricePaid !== undefined)) {
      const legacyEntry = sanitizeAccountPlanEntry(raw, raw.email || raw.account || 'default');
      if (legacyEntry) {
        accounts[legacyEntry.account] = legacyEntry;
        accounts['default'] = { ...legacyEntry, account: 'default' };
      }
    } else if (raw.accounts && typeof raw.accounts === 'object' && !Array.isArray(raw.accounts)) {
      for (const [k, v] of Object.entries(raw.accounts)) {
        const cleanKey = String(k).trim().toLowerCase();
        const sanitized = sanitizeAccountPlanEntry(v, cleanKey);
        if (sanitized) accounts[cleanKey] = sanitized;
      }
    }

    const uiPreferences = (raw.uiPreferences && typeof raw.uiPreferences === 'object' && !Array.isArray(raw.uiPreferences))
      ? { ...raw.uiPreferences }
      : {};

    const preserved = {
      version: raw.version || '1.1.0',
      updatedAt: typeof raw.updatedAt === 'string' ? raw.updatedAt : '',
      lastAccount: typeof raw.lastAccount === 'string' ? raw.lastAccount : 'default',
      accounts,
      uiPreferences
    };
    // Preserve optional existing keys on disk so legacy fields are never clobbered accidentally.
    if (raw.contextPreferences && typeof raw.contextPreferences === 'object') preserved.contextPreferences = raw.contextPreferences;
    if (typeof raw.contextScopeMode === 'string') preserved.contextScopeMode = raw.contextScopeMode;
    if (raw.contextUnifiedPreference && typeof raw.contextUnifiedPreference === 'object') preserved.contextUnifiedPreference = raw.contextUnifiedPreference;
    return preserved;
  } catch {
    return def;
  }
}

function saveCustomPlanSettingsDetailed(settings, overridePathOrDir) {
  const p = getCustomPlanPath(overridePathOrDir);
  const res = safeWriteJsonSync(p, settings, {
    validate: (data) => data && typeof data === 'object' && !Array.isArray(data)
  });
  if (!res.ok) {
    return { ok: false, error: res.error || '写入配置文件失败', phase: res.phase, path: p };
  }
  return { ok: true, path: p };
}

function resolveAccountCustomPlan(customSettingsAll, currentAccountKey) {
  if (!customSettingsAll || !customSettingsAll.accounts) return null;
  const accMap = customSettingsAll.accounts;
  if (currentAccountKey) {
    const k = String(currentAccountKey).trim().toLowerCase();
    if (accMap[k]) return accMap[k];
    if (k !== 'default') return null;
  }
  if (!currentAccountKey || currentAccountKey === 'default') {
    if (customSettingsAll.lastAccount && accMap[customSettingsAll.lastAccount]) {
      return accMap[customSettingsAll.lastAccount];
    }
    if (accMap['default']) return accMap['default'];
  }
  return null;
}

/**
 * Load per-account custom plan configuration and UI preferences (theme, heatmap view, language).
 */
function getPluginSettings(options = {}) {
  const targetDir = typeof options === 'string' ? options : options?.agDir;
  const settings = loadCustomPlanSettings(targetDir);
  const email = options?.email || cachedTokenHistory?.planStatus?.email || null;
  const customPlan = resolveAccountCustomPlan(settings, email);
  const uiPrefs = settings.uiPreferences || {};
  return {
    ok: true,
    customPlan,
    uiPreferences: uiPrefs,
    savedHeatView: uiPrefs.savedHeatView,
    panelLanguage: uiPrefs.panelLanguage || 'zh-CN',
    accounts: settings.accounts || {},
    updatedAt: settings.updatedAt || '',
    recoveredFromCorruption: Boolean(settings.recoveredFromCorruption)
  };
}

/**
 * Save subscription overrides and UI preferences (heatmap view, color theme, synced panel/capsule language).
 */
function savePluginSettings(payload = {}, options = {}) {
  if (!payload || typeof payload !== 'object') {
    return { ok: false, error: '无效的设置参数' };
  }
  const targetDir = typeof options === 'string'
    ? options
    : (options?.targetDir || options?.agDir || payload?.targetDir || payload?.agDir);
  const settings = loadCustomPlanSettings(targetDir);
  const rawKey = payload.account || payload.email || cachedTokenHistory?.planStatus?.email || settings.lastAccount || 'default';
  const key = String(rawKey).trim().toLowerCase() || 'default';

  if (payload.clearPlan === true) {
    delete settings.accounts[key];
    if (key === 'default' || settings.lastAccount === key) {
      delete settings.accounts['default'];
      settings.lastAccount = 'default';
    }
  } else if (payload.customPlan && typeof payload.customPlan === 'object') {
    const prev = settings.accounts[key] || {};
    const inputPlan = payload.customPlan;
    const mergedRaw = {
      ...prev,
      ...inputPlan,
      account: key,
      updatedAt: new Date().toISOString()
    };

    if (inputPlan.currency && !inputPlan.subscriptionCurrency) mergedRaw.subscriptionCurrency = inputPlan.currency;
    if (inputPlan.subscriptionCurrency && !inputPlan.currency) mergedRaw.currency = inputPlan.subscriptionCurrency;
    if (inputPlan.country && !inputPlan.accountRegion) mergedRaw.accountRegion = inputPlan.country;
    if (inputPlan.accountRegion && !inputPlan.country) mergedRaw.country = inputPlan.accountRegion;
    if (inputPlan.subscriptionRegion && !inputPlan.subscriptionCountry) mergedRaw.subscriptionCountry = inputPlan.subscriptionRegion;
    if (inputPlan.subscriptionCountry && !inputPlan.subscriptionRegion) {
      mergedRaw.subscriptionRegion = inputPlan.subscriptionCountry;
      mergedRaw.region = inputPlan.subscriptionCountry;
    }

    if (inputPlan.country === null || inputPlan.country === '' || inputPlan.accountRegion === null || inputPlan.accountRegion === '') {
      delete mergedRaw.country;
      delete mergedRaw.accountRegion;
    }
    if (inputPlan.subscriptionRegion === null || inputPlan.subscriptionRegion === '' || inputPlan.subscriptionCountry === null || inputPlan.subscriptionCountry === '' || inputPlan.region === null || inputPlan.region === '') {
      delete mergedRaw.subscriptionRegion;
      delete mergedRaw.subscriptionCountry;
      delete mergedRaw.region;
    }
    if (inputPlan.currency === null || inputPlan.currency === '' || inputPlan.subscriptionCurrency === null || inputPlan.subscriptionCurrency === '') {
      delete mergedRaw.currency;
      delete mergedRaw.subscriptionCurrency;
      delete mergedRaw.currencySymbol;
    }

    const sanitized = sanitizeAccountPlanEntry(mergedRaw, key);
    if (!sanitized) return { ok: false, error: '订阅设置格式无效' };
    settings.accounts[key] = sanitized;
    if (key === 'default') {
      settings.accounts['default'] = { ...sanitized, account: 'default' };
    } else {
      settings.lastAccount = key;
      settings.accounts['default'] = { ...sanitized, account: 'default' };
    }
  }

  const topLevelUiPrefs = {};
  if (typeof payload.savedHeatView === 'string' && payload.savedHeatView) {
    topLevelUiPrefs.savedHeatView = payload.savedHeatView;
  }
  if (typeof payload.panelLanguage === 'string' && VALID_PANEL_LANGUAGES.has(payload.panelLanguage)) {
    topLevelUiPrefs.panelLanguage = payload.panelLanguage;
  }
  const incomingUiPrefs = (payload.uiPreferences && typeof payload.uiPreferences === 'object' && !Array.isArray(payload.uiPreferences))
    ? { ...payload.uiPreferences, ...topLevelUiPrefs }
    : (Object.keys(topLevelUiPrefs).length > 0 ? topLevelUiPrefs : null);

  if (incomingUiPrefs) {
    if (incomingUiPrefs.panelLanguage !== undefined && !VALID_PANEL_LANGUAGES.has(incomingUiPrefs.panelLanguage)) {
      delete incomingUiPrefs.panelLanguage;
    }
    settings.uiPreferences = {
      ...(settings.uiPreferences || {}),
      ...incomingUiPrefs,
      updatedAt: new Date().toISOString()
    };
  }

  delete settings.recoveredFromCorruption;
  settings.updatedAt = new Date().toISOString();
  const writeRes = saveCustomPlanSettingsDetailed(settings, targetDir);
  if (!writeRes.ok) {
    return { ok: false, error: writeRes.error || '配置落盘失败' };
  }

  const activeCustom = resolveAccountCustomPlan(settings, key === 'default' ? null : key);
  const baseLive = cachedTokenHistory?.rawPlanStatus || cachedTokenHistory?.planStatus || null;
  const effectivePlanStatus = resolveEffectivePlanStatus(baseLive, activeCustom, {
    cachedLivePlan: baseLive,
    currentEmail: key === 'default' ? (baseLive?.email || null) : key
  });

  if (!targetDir && cachedTokenHistory) {
    cachedTokenHistory.planStatus = effectivePlanStatus;
    cachedTokenHistory.customPlanSettings = activeCustom;
    cachedTokenHistory.uiPreferences = settings.uiPreferences;
  }

  let archiveSyncWarning = null;
  let archiveSynced = false;
  try {
    const agDir = resolveAgDir(targetDir);
    const archivePathV2 = path.join(agDir, 'token_usage_archive_v2.json');
    if (fs.existsSync(archivePathV2)) {
      const readRes = safeReadJsonSync(archivePathV2, null);
      if (readRes.ok && readRes.data && typeof readRes.data === 'object') {
        const v2Raw = { ...readRes.data, planStatus: effectivePlanStatus, customPlanSettings: activeCustom };
        const writeArch = safeWriteJsonSync(archivePathV2, v2Raw);
        if (!writeArch.ok) archiveSyncWarning = writeArch.error || '写入 v2 归档文件失败';
        else archiveSynced = true;
      } else if (readRes.corrupted) {
        archiveSyncWarning = 'v2 归档文件内容已损坏，已阻止回写覆盖以保护原始数据';
      }
    }
  } catch (err) {
    archiveSyncWarning = err?.message || '同步派生归档时发生未知异常';
  }

  return {
    ok: true,
    partial: archiveSyncWarning !== null,
    warning: archiveSyncWarning ? `主配置已保存，但派生归档同步失败: ${archiveSyncWarning}` : undefined,
    archiveSynced,
    path: writeRes.path,
    savedAt: settings.updatedAt,
    customPlan: activeCustom,
    planStatus: effectivePlanStatus,
    uiPreferences: settings.uiPreferences,
    panelLanguage: settings.uiPreferences?.panelLanguage || 'zh-CN'
  };
}

/**
 * Resolve user plan status, preferring frontend TelemetryHub's cached snapshot over redundant RPC calls.
 */
async function fetchUserStatusFromHost(options = {}) {
  const supplied = options.userStatus !== undefined ? options.userStatus : options.cachedUserStatus;
  if (supplied !== undefined) {
    if (!supplied) return null;
    if (supplied.tierKey && supplied.status) {
      if (!options.agDir) {
        cachedHostUserStatus = supplied;
        cachedHostUserStatusAt = Date.now();
      }
      return supplied;
    }
    const parsed = parseUserPlanStatus(supplied);
    if (parsed && !options.agDir) {
      cachedHostUserStatus = parsed;
      cachedHostUserStatusAt = Date.now();
    }
    return parsed;
  }

  if (!options.agDir && !options.force && cachedHostUserStatus && Date.now() - cachedHostUserStatusAt < 60000) {
    return cachedHostUserStatus;
  }

  try {
    const apiClient = options.localApi || require('./local-api');
    const api = await apiClient.connect();
    const res = await api.call('GetUserStatus', {});
    const parsed = parseUserPlanStatus(res);
    if (parsed && !options.agDir) {
      cachedHostUserStatus = parsed;
      cachedHostUserStatusAt = Date.now();
    }
    return parsed;
  } catch {
    return cachedHostUserStatus || null;
  }
}

/**
 * Scan local Desktop & CLI conversation logs, archives, and pricing ledger into a unified history payload.
 */
async function collectTokenHistoryAsync(options = {}) {
  const suppliedUserStatus = options.userStatus !== undefined ? options.userStatus : options.cachedUserStatus;
  if (!options.force && !options.agDir && suppliedUserStatus === undefined && cachedTokenHistory && Date.now() - cachedTokenHistoryAt < 15000) {
    return cachedTokenHistory;
  }
  if (!options.agDir && activeScanPromise) {
    return activeScanPromise;
  }

  const thisScanSeq = ++currentScanSequence;
  const runner = (async () => {
    const home = process.env.USERPROFILE || os.homedir();
    const agDir = resolveAgDir(options.agDir);
    const agCliDir = options.agCliDir || process.env.AG_CLI_DIR || path.join(home, '.gemini', 'antigravity-cli');

    const brainDir = path.join(agDir, 'brain');
    const convDir = path.join(agDir, 'conversations');
    const archivePathV1 = path.join(agDir, 'token_usage_archive_v1.json');
    const archivePathV2 = path.join(agDir, 'token_usage_archive_v2.json');

    const bakPathV1 = path.join(agDir, 'token_usage_archive_v1.bak.json');
    const readV1 = safeReadJsonSync(archivePathV1, null, { backupPath: bakPathV1 });
    let legacyV1Archive = { firstUseDate: null, dailyMap: {}, maxConversations: 0 };
    if (readV1.exists && readV1.ok && readV1.data && typeof readV1.data === 'object') {
      legacyV1Archive = readV1.data;
      if (!fs.existsSync(bakPathV1)) {
        try { fs.copyFileSync(archivePathV1, bakPathV1); } catch {}
      }
    }

    const bakPathV2 = path.join(agDir, 'token_usage_archive_v2.bak.json');
    const readV2 = safeReadJsonSync(archivePathV2, null, { backupPath: bakPathV2 });
    let archiveV2 = {
      version: '2.0.0',
      firstUseDate: legacyV1Archive.firstUseDate || null,
      planStatus: null,
      dailyMapBySource: {
        desktop: {},
        cli: {},
        legacyUnallocated: legacyV1Archive.dailyMap || {}
      }
    };
    if (readV2.exists && readV2.ok && readV2.data && typeof readV2.data === 'object') {
      archiveV2 = { ...archiveV2, ...readV2.data };
      if (!fs.existsSync(bakPathV2)) {
        try { fs.copyFileSync(archivePathV2, bakPathV2); } catch {}
      }
    }

    let earliestDate = archiveV2.firstUseDate || legacyV1Archive.firstUseDate || null;
    const registerDate = (dateStr) => {
      if (dateStr && /^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
        if (!earliestDate || dateStr < earliestDate) earliestDate = dateStr;
      }
    };

    const scanSessionDir = (dir) => {
      let count = 0;
      try {
        if (!fs.existsSync(dir)) return 0;
        for (const name of fs.readdirSync(dir)) {
          if (isCompanionOrTempFile(name)) continue;
          if (!name.endsWith('.pb') && !name.endsWith('.db')) continue;
          const p = path.join(dir, name);
          try {
            const st = fs.statSync(p);
            if (st.isFile()) {
              count++;
              const ts = st.birthtimeMs && st.birthtimeMs > 946684800000 ? Math.min(st.birthtimeMs, st.mtimeMs) : st.mtimeMs;
              if (ts > 946684800000) registerDate(formatLocalDateKey(new Date(ts)));
            }
          } catch {}
        }
      } catch {}
      return count;
    };

    const desktopPbCount = scanSessionDir(convDir);
    const cliPbCount = fs.existsSync(path.join(agCliDir, 'conversations'))
      ? scanSessionDir(path.join(agCliDir, 'conversations'))
      : 0;

    const visitedRealDirs = new Set();
    const transcriptJobs = [];

    const walkTranscripts = (dir, sourceName, depth = 0) => {
      if (depth > 4) return;
      try {
        if (!fs.existsSync(dir)) return;
        const normDir = path.resolve(dir);
        if (visitedRealDirs.has(normDir)) return;
        visitedRealDirs.add(normDir);

        for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
          if (TRANSCRIPT_SKIP_DIRS.has(entry.name)) continue;
          const fullPath = path.join(dir, entry.name);
          if (entry.isSymbolicLink()) {
            try {
              const realTarget = fs.realpathSync(fullPath);
              const st = fs.statSync(realTarget);
              if (st.isDirectory()) {
                if (!visitedRealDirs.has(realTarget)) walkTranscripts(realTarget, sourceName, depth + 1);
              } else if (entry.name === 'transcript.jsonl') {
                transcriptJobs.push({ path: realTarget, source: sourceName });
              }
            } catch {}
          } else if (entry.isDirectory()) {
            if (depth === 0) {
              const stdLogPath = path.join(fullPath, '.system_generated', 'logs', 'transcript.jsonl');
              const directLogPath = path.join(fullPath, 'transcript.jsonl');
              let matchedFast = false;
              if (fs.existsSync(stdLogPath)) { transcriptJobs.push({ path: stdLogPath, source: sourceName }); matchedFast = true; }
              if (fs.existsSync(directLogPath)) { transcriptJobs.push({ path: directLogPath, source: sourceName }); matchedFast = true; }
              if (matchedFast) continue;
            }
            walkTranscripts(fullPath, sourceName, depth + 1);
          } else if (entry.name === 'transcript.jsonl') {
            transcriptJobs.push({ path: fullPath, source: sourceName });
          }
        }
      } catch {}
    };

    walkTranscripts(brainDir, 'desktop');
    if (fs.existsSync(path.join(agCliDir, 'brain'))) {
      walkTranscripts(path.join(agCliDir, 'brain'), 'cli');
    }

    const scannedBySource = { desktop: {}, cli: {} };
    const seenEvents = new Set();
    const recentRequests = [];
    const newlyParsedPricedRequests = [];

    for (let jIdx = 0; jIdx < transcriptJobs.length; jIdx++) {
      const job = transcriptJobs[jIdx];
      if (jIdx > 0 && jIdx % 15 === 0) await new Promise(resolve => setImmediate(resolve));
      try {
        const st = fs.statSync(job.path);
        const cachedFile = transcriptFileCache.get(job.path);
        let fileRecords = null;
        let isFreshlyParsed = false;

        if (cachedFile && cachedFile.size === st.size && cachedFile.mtimeMs === st.mtimeMs) {
          fileRecords = cachedFile.records;
        } else {
          isFreshlyParsed = true;
          fileRecords = [];
          const content = fs.readFileSync(job.path, 'utf8');
          const lines = content.split(/\r?\n/);
          for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            if (!line || !line.trim()) continue;
            let event = null;
            try { event = JSON.parse(line); } catch { continue; }

            let dateKey = null;
            if (event.created_at) {
              const d = new Date(event.created_at);
              if (!Number.isNaN(d.getTime())) dateKey = formatLocalDateKey(d);
            }

            let inp = 0, outp = 0, cap = 0, thinking = 0;
            const model = event.chatModel?.model || event.chatModel?.responseModel || event.model || event.modelId || '';
            if (event.input_tokens != null || event.output_tokens != null || event.cache_read_tokens != null) {
              inp = Number(event.input_tokens || 0);
              outp = Number(event.output_tokens || 0);
              cap = Number(event.cache_read_tokens || 0);
              thinking = Number(event.thinking_output_tokens || 0);
            } else if (event.chatModel?.usage) {
              const u = event.chatModel.usage;
              inp = Number(u.inputTokens || 0);
              outp = Number(u.outputTokens || 0);
              cap = Number(u.cacheReadTokens || 0);
              thinking = Number(u.thinkingOutputTokens || 0);
            }

            const tot = inp + outp + cap;
            if (tot > 0 && dateKey) {
              const eventId = event.callId || event.responseId || event.chatModel?.usage?.responseId || `${job.path}#${event.step_index ?? i}`;
              const reqObj = {
                callId: eventId,
                source: job.source,
                cascadeId: event.cascadeId || path.basename(job.path, '.jsonl'),
                model,
                modelKey: normalizeModelId(model),
                inputTokens: inp,
                cacheTokens: cap,
                cacheReadTokens: cap,
                outputTokens: outp,
                thinkingTokens: thinking,
                totalTokens: tot,
                status: 'final',
                isEstimated: false,
                date: dateKey,
                created_at: event.created_at || null,
                timestamp: event.created_at ? new Date(event.created_at).getTime() : Date.now()
              };
              const costCalc = calculateRequestApiCost(reqObj);
              reqObj.isPriced = costCalc.isPriced;
              reqObj.costUSD = costCalc.costUSD ?? 0;
              fileRecords.push({ eventId, dateKey, inp, outp, cap, tot, reqObj });
            } else if (dateKey) {
              fileRecords.push({ dateKey, tot: 0 });
            }
          }
          if (transcriptFileCache.size > 1000) {
            const oldestKey = transcriptFileCache.keys().next().value;
            if (oldestKey) transcriptFileCache.delete(oldestKey);
          }
          transcriptFileCache.set(job.path, { size: st.size, mtimeMs: st.mtimeMs, records: fileRecords });
        }

        for (let rIdx = 0; rIdx < fileRecords.length; rIdx++) {
          const rec = fileRecords[rIdx];
          if (rec.dateKey) registerDate(rec.dateKey);
          if (!rec.tot || !rec.eventId || seenEvents.has(rec.eventId)) continue;
          seenEvents.add(rec.eventId);

          const srcMap = scannedBySource[job.source] || scannedBySource.desktop;
          if (!srcMap[rec.dateKey]) {
            srcMap[rec.dateKey] = { total: 0, input: 0, output: 0, cache: 0, steps: 0 };
          }
          srcMap[rec.dateKey].total += rec.tot;
          srcMap[rec.dateKey].input += rec.inp;
          srcMap[rec.dateKey].output += rec.outp;
          srcMap[rec.dateKey].cache += rec.cap;
          srcMap[rec.dateKey].steps += 1;

          recentRequests.push(rec.reqObj);
          if (isFreshlyParsed && rec.reqObj.isPriced && rec.reqObj.callId) {
            newlyParsedPricedRequests.push(rec.reqObj);
          }
        }
      } catch {}
    }

    const legacyDaily = legacyV1Archive.dailyMap || {};
    const mergedDesktop = { ...(archiveV2.dailyMapBySource?.desktop || {}), ...scannedBySource.desktop };
    const mergedCli = { ...(archiveV2.dailyMapBySource?.cli || {}), ...scannedBySource.cli };
    const mergedLegacyUnallocated = {};
    const allDateKeys = new Set([...Object.keys(legacyDaily), ...Object.keys(mergedDesktop), ...Object.keys(mergedCli)]);

    const dailyMapAll = {};
    for (const k of Array.from(allDateKeys).sort()) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(k)) continue;
      registerDate(k);
      const dRec = mergedDesktop[k] || { total: 0, input: 0, output: 0, cache: 0, steps: 0 };
      const cRec = mergedCli[k] || { total: 0, input: 0, output: 0, cache: 0, steps: 0 };
      const lRec = legacyDaily[k] || { total: 0, input: 0, output: 0, cache: 0, steps: 0 };
      const scannedSum = (dRec.total || 0) + (cRec.total || 0);
      const unallocatedDiff = Math.max(0, (lRec.total || 0) - scannedSum);

      if (unallocatedDiff > 0) {
        mergedLegacyUnallocated[k] = {
          total: unallocatedDiff,
          input: Math.max(0, (lRec.input || 0) - (dRec.input || 0) - (cRec.input || 0)),
          output: Math.max(0, (lRec.output || 0) - (dRec.output || 0) - (cRec.output || 0)),
          cache: Math.max(0, (lRec.cache || 0) - (dRec.cache || 0) - (cRec.cache || 0)),
          steps: Math.max(0, (lRec.steps || 0) - (dRec.steps || 0) - (cRec.steps || 0))
        };
      }

      const unRec = mergedLegacyUnallocated[k] || { total: 0, input: 0, output: 0, cache: 0, steps: 0 };
      dailyMapAll[k] = {
        total: (dRec.total || 0) + (cRec.total || 0) + (unRec.total || 0),
        input: (dRec.input || 0) + (cRec.input || 0) + (unRec.input || 0),
        output: (dRec.output || 0) + (cRec.output || 0) + (unRec.output || 0),
        cache: (dRec.cache || 0) + (cRec.cache || 0) + (unRec.cache || 0),
        steps: (dRec.steps || 0) + (cRec.steps || 0) + (unRec.steps || 0)
      };
    }

    const now = new Date();
    const todayKey = formatLocalDateKey(now);
    const monthPrefix = todayKey.slice(0, 7);
    const yearPrefix = todayKey.slice(0, 4);
    if (!earliestDate) earliestDate = todayKey;

    let grandTotalTokens = 0, totalInputTokens = 0, totalOutputTokens = 0, totalCacheTokens = 0, totalSteps = 0;
    let todayTokens = 0, monthTokens = 0, yearTokens = 0;
    let currentMonthInput = 0, currentMonthOutput = 0, currentMonthCache = 0, currentMonthSteps = 0;

    for (const [k, v] of Object.entries(dailyMapAll)) {
      if (!v) continue;
      grandTotalTokens += v.total || 0;
      totalInputTokens += v.input || 0;
      totalOutputTokens += v.output || 0;
      totalCacheTokens += v.cache || 0;
      totalSteps += v.steps || 0;
      if (k === todayKey) todayTokens += v.total || 0;
      if (k.startsWith(monthPrefix)) {
        monthTokens += v.total || 0;
        currentMonthInput += v.input || 0;
        currentMonthOutput += v.output || 0;
        currentMonthCache += v.cache || 0;
        currentMonthSteps += v.steps || 0;
      }
      if (k.startsWith(yearPrefix)) yearTokens += v.total || 0;
    }

    const totalConversations = Math.max(
      legacyV1Archive.maxConversations || 0,
      transcriptJobs.length,
      desktopPbCount + cliPbCount
    );

    let livePlanStatus = await fetchUserStatusFromHost(options);
    if (!livePlanStatus) {
      livePlanStatus = archiveV2.planStatus || parseUserPlanStatus(null);
    }

    const customSettingsAll = loadCustomPlanSettings(agDir);
    const currentAccountKey = livePlanStatus?.email || archiveV2.planStatus?.email || null;
    const currentCustom = resolveAccountCustomPlan(customSettingsAll, currentAccountKey);

    const effectivePlanStatus = resolveEffectivePlanStatus(livePlanStatus, currentCustom, {
      cachedLivePlan: archiveV2.planStatus,
      currentEmail: currentAccountKey
    });

    if (newlyParsedPricedRequests.length) {
      recordModelCalls(newlyParsedPricedRequests, { agDir });
    }
    const mergedCalls = Object.values(loadPricingLedger(agDir).calls || {});

    const desktopRecentUnpriced = recentRequests.filter(r => r.source === 'desktop' && !r.isPriced);
    const cliRecentUnpriced = recentRequests.filter(r => r.source === 'cli' && !r.isPriced);
    const unallocatedLegacyCount = Object.values(mergedLegacyUnallocated).reduce((sum, item) => sum + (item.steps || 0), 0);
    const unallocatedLegacyTokens = Object.values(mergedLegacyUnallocated).reduce((sum, item) => sum + (item.total || 0), 0);

    function aggregateUnpriced(items, extraCount = 0, extraTokens = 0) {
      const reasons = { missingModel: extraCount, unsupportedModel: 0, missingUsage: 0 };
      let tokens = extraTokens;
      for (const it of items) {
        tokens += (it.inputTokens + it.cacheTokens + it.outputTokens);
        if (!it.model) reasons.missingModel++;
        else if ((it.inputTokens + it.cacheTokens + it.outputTokens) === 0) reasons.missingUsage++;
        else reasons.unsupportedModel++;
      }
      return { count: items.length + extraCount, tokens, reasons };
    }

    const deskUnpriced = aggregateUnpriced(desktopRecentUnpriced, unallocatedLegacyCount, unallocatedLegacyTokens);
    const cliUnpriced = aggregateUnpriced(cliRecentUnpriced, 0, 0);
    const totalUnpricedCount = deskUnpriced.count + cliUnpriced.count;
    const totalUnpricedTokens = deskUnpriced.tokens + cliUnpriced.tokens;
    const totalUnpricedReasons = {
      missingModel: deskUnpriced.reasons.missingModel + cliUnpriced.reasons.missingModel,
      unsupportedModel: deskUnpriced.reasons.unsupportedModel + cliUnpriced.reasons.unsupportedModel,
      missingUsage: deskUnpriced.reasons.missingUsage + cliUnpriced.reasons.missingUsage
    };

    const costEstimateAll = summarizeApiCost(mergedCalls, totalUnpricedCount, totalUnpricedReasons, totalUnpricedTokens);
    const costEstimateDesktop = summarizeApiCost(mergedCalls.filter(c => c.source === 'desktop'), deskUnpriced.count, deskUnpriced.reasons, deskUnpriced.tokens);
    const costEstimateCli = summarizeApiCost(mergedCalls.filter(c => c.source === 'cli'), cliUnpriced.count, cliUnpriced.reasons, cliUnpriced.tokens);

    const currentMonthCalls = mergedCalls.filter(c => c.date && String(c.date).startsWith(monthPrefix));
    const currentMonthPricedCalls = currentMonthCalls.filter(c => c.isPriced);
    const currentMonthPricedTokens = currentMonthPricedCalls.reduce((sum, c) => sum + (c.totalTokens || 0), 0);
    const currentMonthUnpricedCount = Math.max(0, currentMonthSteps - currentMonthPricedCalls.length);
    const currentMonthUnpricedTokens = Math.max(0, monthTokens - currentMonthPricedTokens);
    const costEstimateCurrentMonth = summarizeApiCost(
      currentMonthCalls,
      currentMonthUnpricedCount,
      { missingModel: currentMonthUnpricedCount },
      currentMonthUnpricedTokens
    );

    const referenceCostAll = calculateReferenceModelCost({
      inputTokens: totalInputTokens, outputTokens: totalOutputTokens, cacheTokens: totalCacheTokens, totalTokens: grandTotalTokens
    }, 'gemini-3.8-flash', { pricingDate: '2026-11-08', mode: 'all' });

    const referenceCostCurrentMonth = calculateReferenceModelCost({
      inputTokens: currentMonthInput, outputTokens: currentMonthOutput, cacheTokens: currentMonthCache, totalTokens: monthTokens
    }, 'gemini-3.8-flash', { pricingDate: '2026-11-08', mode: 'all' });

    const referenceCostHybrid = calculateReferenceModelCost({
      inputTokens: totalInputTokens, outputTokens: totalOutputTokens, cacheTokens: totalCacheTokens, totalTokens: grandTotalTokens
    }, 'gemini-3.8-flash', {
      pricingDate: '2026-11-09', mode: 'unpriced_only', knownUsage: { byCategory: costEstimateAll.byCategory, costUSD: costEstimateAll.pricedCostUSD }
    });

    const referenceCostCurrentMonthHybrid = calculateReferenceModelCost({
      inputTokens: currentMonthInput, outputTokens: currentMonthOutput, cacheTokens: currentMonthCache, totalTokens: monthTokens
    }, 'gemini-3.8-flash', {
      pricingDate: '2026-11-09', mode: 'unpriced_only', knownUsage: { byCategory: costEstimateCurrentMonth.byCategory, costUSD: costEstimateCurrentMonth.pricedCostUSD }
    });

    const out = {
      schemaVersion: '1.0.0',
      version: '1.0.0',
      updatedAt: `${todayKey} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`,
      firstUseDate: earliestDate,
      currentPeriod: { key: monthPrefix, label: `${monthPrefix} (自然月)`, isCurrentMonth: true },
      sources: {
        desktop: { conversationsCount: desktopPbCount, transcriptsCount: transcriptJobs.filter(j => j.source === 'desktop').length },
        cli: { dirExists: fs.existsSync(agCliDir), conversationsCount: cliPbCount, transcriptsCount: transcriptJobs.filter(j => j.source === 'cli').length }
      },
      planStatus: effectivePlanStatus,
      rawPlanStatus: livePlanStatus,
      customPlanSettings: currentCustom,
      uiPreferences: customSettingsAll.uiPreferences || {},
      costEstimate: costEstimateAll,
      costEstimateCurrentMonth,
      costEstimateBySource: { all: costEstimateAll, desktop: costEstimateDesktop, cli: costEstimateCli },
      referenceCost: { all: referenceCostAll, currentMonth: referenceCostCurrentMonth, hybrid: referenceCostHybrid, currentMonthHybrid: referenceCostCurrentMonthHybrid },
      summary: {
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
        totalSteps,
        totalConversations,
        firstUseDate: earliestDate,
        activeDaysCount: Object.keys(dailyMapAll).length,
        costEstimate: costEstimateAll,
        costEstimateCurrentMonth,
        referenceCost: { all: referenceCostAll, currentMonth: referenceCostCurrentMonth, hybrid: referenceCostHybrid, currentMonthHybrid: referenceCostCurrentMonthHybrid }
      },
      dailyMap: dailyMapAll,
      dailyMapBySource: { all: dailyMapAll, desktop: mergedDesktop, cli: mergedCli, legacyUnallocated: mergedLegacyUnallocated }
    };

    if (!options.agDir && thisScanSeq !== currentScanSequence) return out;

    try {
      const archiveSig = `${agDir}|${earliestDate}|${totalConversations}|${grandTotalTokens}|${totalSteps}|${effectivePlanStatus?.tierKey || ''}|${effectivePlanStatus?.actualPricePaid ?? ''}|${effectivePlanStatus?.currency || ''}|${costEstimateAll?.pricedCostUSD ?? ''}`;
      const shouldWriteArchive = options.agDir || archiveSig !== collectTokenHistoryAsync._lastArchiveSig || !fs.existsSync(archivePathV2) || !fs.existsSync(archivePathV1);
      if (shouldWriteArchive) {
        collectTokenHistoryAsync._lastArchiveSig = archiveSig;
        safeWriteJsonSync(archivePathV2, {
          version: '2.0.0',
          firstUseDate: earliestDate,
          updatedAt: out.updatedAt,
          maxConversations: totalConversations,
          planStatus: effectivePlanStatus,
          costEstimate: costEstimateAll,
          costEstimateCurrentMonth,
          referenceCost: out.referenceCost,
          dailyMapBySource: out.dailyMapBySource
        });
        safeWriteJsonSync(archivePathV1, {
          firstUseDate: earliestDate,
          maxConversations: totalConversations,
          updatedAt: out.updatedAt,
          dailyMap: dailyMapAll
        });
      }
    } catch {}

    if (!options.agDir) {
      cachedTokenHistory = out;
      cachedTokenHistoryAt = Date.now();
    }
    return out;
  })();

  if (!options.agDir) {
    const tracked = runner.finally(() => {
      if (activeScanPromise === tracked) activeScanPromise = null;
    });
    activeScanPromise = tracked;
    return tracked;
  }
  return runner;
}

module.exports = {
  collectTokenHistoryAsync,
  fetchUserStatusFromHost,
  recordModelCalls,
  loadPricingLedger,
  savePricingLedger,
  quarantineSyntheticCalls,
  getPricingLedgerPath,
  isSyntheticCall,
  formatLocalDateKey,
  getCustomPlanPath,
  loadCustomPlanSettings,
  saveCustomPlanSettingsDetailed,
  resolveAccountCustomPlan,
  sanitizeAccountPlanEntry,
  getPluginSettings,
  savePluginSettings,
  parseUserPlanStatus,
  parseGeneratorCall,
  SUBSCRIPTION_ACQUISITION_PRESETS,
  CURRENCY_SYMBOLS,
  resetCollectorCaches
};
