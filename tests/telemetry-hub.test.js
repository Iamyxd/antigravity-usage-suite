'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');

const core = require('../lib/usage-core');
const telemetryModule = require('../src/renderer/telemetry-hub');
const capsuleModule = require('../src/renderer/capsule-ui');

function createEventTargetMixin() {
  const listeners = new Map();
  return {
    addEventListener(type, fn) {
      if (!listeners.has(type)) listeners.set(type, new Set());
      listeners.get(type).add(fn);
    },
    removeEventListener(type, fn) {
      listeners.get(type)?.delete(fn);
    },
    dispatchEvent(evt = {}) {
      const event = {
        type: evt.type || '',
        target: evt.target || this,
        defaultPrevented: false,
        preventDefault() { this.defaultPrevented = true; },
        stopPropagation() {},
        ...evt
      };
      for (const fn of (listeners.get(event.type) || [])) {
        fn.call(this, event);
      }
      return !event.defaultPrevented;
    },
    click() {
      this.dispatchEvent({ type: 'click', target: this });
    }
  };
}

function createMockElement(tagName = 'div', attrs = {}) {
  const attrMap = new Map(Object.entries(attrs));
  const childList = [];
  let classSet = new Set();

  const el = {
    tagName: String(tagName).toUpperCase(),
    nodeName: String(tagName).toUpperCase(),
    nodeType: 1,
    parentElement: null,
    style: {
      fontVariantNumeric: '',
      opacity: '',
      backgroundColor: '',
      color: '',
      border: '',
      boxShadow: '',
      cssText: '',
      setProperty(k, v) { this[k] = String(v); },
      getPropertyValue(k) { return this[k] || ''; }
    },
    _text: '',
    children: childList,
    childNodes: childList,
    ...createEventTargetMixin(),
    get className() {
      return Array.from(classSet).join(' ');
    },
    set className(val) {
      classSet = new Set(String(val || '').split(/\s+/).filter(Boolean));
    },
    classList: {
      add(...items) { items.forEach(i => classSet.add(i)); },
      remove(...items) { items.forEach(i => classSet.delete(i)); },
      contains(item) { return classSet.has(item); },
      toggle(item, force) {
        if (force === true) { classSet.add(item); return true; }
        if (force === false) { classSet.delete(item); return false; }
        if (classSet.has(item)) { classSet.delete(item); return false; }
        classSet.add(item);
        return true;
      }
    },
    get textContent() {
      if (childList.length === 0) return this._text;
      return this._text + childList.map(c => c.textContent || '').join('');
    },
    set textContent(v) {
      this._text = String(v ?? '');
    },
    get firstChild() {
      return childList[0] || null;
    },
    setAttribute(k, v) {
      attrMap.set(String(k), String(v));
      if (k === 'id') this.id = String(v);
      if (k === 'class') this.className = String(v);
    },
    getAttribute(k) {
      if (k === 'id' && this.id !== undefined) return this.id;
      return attrMap.has(String(k)) ? attrMap.get(String(k)) : null;
    },
    appendChild(child) {
      if (!child) return child;
      child.parentElement = this;
      childList.push(child);
      return child;
    },
    insertBefore(child, refNode) {
      if (!child) return child;
      child.parentElement = this;
      const idx = refNode ? childList.indexOf(refNode) : -1;
      if (idx >= 0) childList.splice(idx, 0, child);
      else childList.push(child);
      return child;
    },
    replaceChildren(...nodes) {
      childList.length = 0;
      nodes.forEach(n => this.appendChild(n));
    },
    remove() {
      if (!this.parentElement) return;
      const idx = this.parentElement.children.indexOf(this);
      if (idx >= 0) this.parentElement.children.splice(idx, 1);
      this.parentElement = null;
    },
    contains(target) {
      if (target === this) return true;
      for (const ch of childList) {
        if (ch.contains && ch.contains(target)) return true;
      }
      return false;
    },
    getBoundingClientRect() {
      return { top: 400, left: 200, right: 320, bottom: 428, width: 120, height: 28 };
    },
    querySelectorAll(selector) {
      const results = [];
      const selectors = String(selector).split(',').map(s => s.trim()).filter(Boolean);
      const matchesOne = (node, sel) => {
        if (sel.startsWith('#')) return node.id === sel.slice(1);
        if (sel.startsWith('.')) return node.classList?.contains(sel.slice(1));
        const attrMatch = sel.match(/^([a-zA-Z0-9_-]+)?\[([^\]=]+)(?:="([^"]*)")?\]$/);
        if (attrMatch) {
          const [, tag, attr, val] = attrMatch;
          if (tag && node.tagName !== tag.toUpperCase()) return false;
          const got = node.getAttribute?.(attr);
          if (val !== undefined) return got === val;
          return got !== null && got !== undefined;
        }
        return node.tagName === sel.toUpperCase();
      };
      const walk = (node) => {
        for (const ch of (node.children || [])) {
          if (selectors.some(sel => matchesOne(ch, sel))) results.push(ch);
          walk(ch);
        }
      };
      walk(this);
      return results;
    },
    querySelector(selector) {
      return this.querySelectorAll(selector)[0] || null;
    }
  };
  return el;
}

function createMockDomEnv(initialOrigin = 'http://127.0.0.1:42000') {
  const storageMap = new Map();
  const doc = {
    body: createMockElement('body'),
    documentElement: createMockElement('html'),
    createElement: (tag) => createMockElement(tag),
    createElementNS: (_ns, tag) => createMockElement(tag),
    getElementById(id) {
      return this.body.querySelector(`#${id}`);
    },
    querySelector(sel) {
      return this.body.querySelector(sel);
    },
    querySelectorAll(sel) {
      return this.body.querySelectorAll(sel);
    }
  };
  doc.body.parentElement = doc.documentElement;
  doc.documentElement.appendChild(doc.body);

  const storage = {
    getItem: (k) => (storageMap.has(k) ? storageMap.get(k) : null),
    setItem: (k, v) => storageMap.set(String(k), String(v))
  };

  const win = {
    location: { origin: initialOrigin, href: `${initialOrigin}/index.html` },
    innerWidth: 1280,
    innerHeight: 800,
    getComputedStyle: () => ({ backgroundColor: 'rgb(24, 24, 27)', color: 'rgb(228, 228, 231)' }),
    setTimeout,
    clearTimeout,
    setInterval,
    clearInterval
  };

  return { doc, win, storage, storageMap };
}

function makeJsonResponse(payload, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: {
      get(name) {
        if (String(name).toLowerCase() === 'content-type') return 'application/json';
        return null;
      }
    },
    async json() {
      return JSON.parse(JSON.stringify(payload));
    },
    clone() {
      return makeJsonResponse(payload, status);
    }
  };
}

describe('TelemetryHub & Capsule UI', () => {
  it('installs a single window.fetch sniffer, captures same-origin CSRF without touching cross-origin, and restores on dispose', async () => {
    const { doc, win, storage } = createMockDomEnv();
    const calls = [];
    const origFetch = async (url, init = {}) => {
      calls.push({ url: String(url), headers: init.headers || {} });
      return makeJsonResponse({ userStatus: { userTier: { name: 'Pro' }, cascadeModelConfigData: { clientModelConfigs: [] } } });
    };
    win.fetch = origFetch;

    const hub = telemetryModule.createTelemetryHub({
      window: win,
      document: doc,
      location: win.location,
      navigator: { language: 'zh-CN' },
      storage,
      core,
      autoPoll: false
    });

    assert.equal(hub.getSnifferCount(), 0);
    assert.equal(win.fetch, origFetch);

    hub.start();
    hub.installNetworkSniffer();
    assert.equal(hub.getSnifferCount(), 1);
    assert.notEqual(win.fetch, origFetch);

    // Same-origin call carries CSRF token and userStatus payload -> sniffed passively
    await win.fetch('/exa.language_server_pb.LanguageServerService/Ping', {
      method: 'POST',
      headers: { 'x-codeium-csrf-token': 'csrf-alpha-123' },
      body: '{}'
    });
    // Cross-origin call must pass straight through untouched
    await win.fetch('https://example.org/external', {
      method: 'POST',
      headers: { 'x-codeium-csrf-token': 'should-not-capture' },
      body: '{}'
    });

    await new Promise(r => setImmediate(r));
    assert.equal(calls.length, 2);
    assert.equal(hub.getUserStatus()?.userStatus?.userTier?.name, 'Pro');

    // Within 30s TTL after passive sniff, refreshUserStatus(false) makes zero extra RPC calls
    const statusRes = await hub.refreshUserStatus(false);
    assert.equal(statusRes?.userStatus?.userTier?.name, 'Pro');
    assert.equal(calls.length, 2);

    hub.dispose();
    assert.equal(hub.getSnifferCount(), 0);
    assert.equal(win.fetch, origFetch);
  });

  it('deduplicates GetUserStatus within 30s TTL across pollCycle and refreshUserStatus, allowing force refresh', async () => {
    const { doc, win, storage } = createMockDomEnv();
    const rpcCounts = { GetUserStatus: 0, GetAllCascadeTrajectories: 0 };

    const footer = doc.createElement('div');
    footer.className = 'agy-composer-footer';
    footer.__reactFiber$1 = {
      memoizedProps: { conversationId: 'cid-user-status-01', modelId: 'MODEL_PLACEHOLDER_M37' },
      return: null
    };
    doc.body.appendChild(footer);

    win.fetch = async (url, init = {}) => {
      const target = String(url);
      if (target.endsWith('/GetUserStatus')) {
        rpcCounts.GetUserStatus += 1;
        return makeJsonResponse({
          userStatus: {
            email: 'dev@example.com',
            planStatus: { planInfo: { planName: 'Google AI Pro' } },
            cascadeModelConfigData: { clientModelConfigs: [] }
          }
        });
      }
      if (target.endsWith('/GetAllCascadeTrajectories')) {
        rpcCounts.GetAllCascadeTrajectories += 1;
        return makeJsonResponse({ trajectorySummaries: { 'cid-user-status-01': { stepCount: 0, status: 'IDLE' } } });
      }
      return makeJsonResponse({ ok: true });
    };

    const hub = telemetryModule.createTelemetryHub({
      window: win,
      document: doc,
      location: win.location,
      storage,
      core,
      autoPoll: false,
      userStatusTtlMs: 30000
    });
    hub.start();

    // Seed CSRF via same-origin sniffed fetch
    await win.fetch('/local/ping', { headers: { 'x-codeium-csrf-token': 'csrf-token-99' } });

    await hub.refreshUserStatus(false);
    await hub.pollCycle();
    await hub.refreshUserStatus(false);

    assert.equal(rpcCounts.GetUserStatus, 1);

    await hub.refreshUserStatus(true);
    assert.equal(rpcCounts.GetUserStatus, 2);
    hub.dispose();
  });

  it('deduplicates finalized calls across repeated polls and triggers conditional tail GetCascadeTrajectoryGeneratorMetadata at most once per stepCount', async () => {
    const { doc, win, storage } = createMockDomEnv();
    const metaCalls = [];

    const footer = doc.createElement('div');
    footer.className = 'agy-composer-footer';
    const cid = 'cascade-telemetry-001';
    footer.__reactFiber$meta = {
      memoizedProps: { conversationId: cid, modelId: 'MODEL_PLACEHOLDER_M37' },
      return: null
    };
    doc.body.appendChild(footer);

    let mode = 'completeStep';
    win.fetch = async (url, init = {}) => {
      const target = String(url);
      if (target.endsWith('/GetUserStatus')) {
        return makeJsonResponse({ userStatus: { cascadeModelConfigData: { clientModelConfigs: [] } } });
      }
      if (target.endsWith('/GetAllCascadeTrajectories')) {
        return makeJsonResponse({
          trajectorySummaries: {
            [cid]: { stepCount: 2, status: 'IDLE' }
          }
        });
      }
      if (target.endsWith('/GetCascadeTrajectorySteps')) {
        if (mode === 'completeStep') {
          return makeJsonResponse({
            steps: [
              { type: 'USER_INPUT', userInput: { text: 'hello' } },
              {
                type: 'PLANNER_RESPONSE',
                stepIndex: 1,
                status: 'DONE',
                createdAt: '2026-11-15T01:00:00.000Z',
                finishedGeneratingAt: '2026-11-15T01:00:02.000Z',
                metadata: {
                  modelUsage: {
                    model: 'MODEL_PLACEHOLDER_M37',
                    responseId: 'resp-complete-100',
                    inputTokens: 1200,
                    cacheReadTokens: 800,
                    outputTokens: 140,
                    thinkingOutputTokens: 20
                  }
                }
              }
            ]
          });
        }
        return makeJsonResponse({
          steps: [
            { type: 'USER_INPUT', userInput: { text: 'hi' } },
            {
              type: 'PLANNER_RESPONSE',
              stepIndex: 1,
              status: 'DONE',
              createdAt: '2026-11-15T01:02:00.000Z',
              finishedGeneratingAt: '2026-11-15T01:02:03.000Z',
              metadata: {
                modelUsage: {
                  model: 'MODEL_PLACEHOLDER_M37',
                  inputTokens: 1500,
                  cacheReadTokens: 1000,
                  outputTokens: 180
                }
              }
            }
          ]
        });
      }
      if (target.endsWith('/GetCascadeTrajectoryGeneratorMetadata')) {
        const body = JSON.parse(init.body || '{}');
        metaCalls.push(body);
        return makeJsonResponse({
          generatorMetadata: [
            {
              chatModel: {
                model: 'MODEL_PLACEHOLDER_M37',
                createdAt: '2026-11-15T01:02:00.000Z',
                usage: {
                  responseId: 'resp-tail-enriched-200',
                  inputTokens: 1500,
                  cacheReadTokens: 1000,
                  outputTokens: 180,
                  thinkingOutputTokens: 35
                }
              }
            }
          ]
        });
      }
      return makeJsonResponse({ ok: true });
    };

    const emittedBatches = [];
    const hub = telemetryModule.createTelemetryHub({
      window: win,
      document: doc,
      location: win.location,
      navigator: { language: 'zh-CN' },
      storage,
      core,
      autoPoll: false
    });
    hub.subscribeFinalizedCalls(calls => emittedBatches.push(calls));
    hub.start();

    await win.fetch('/local/seed', { headers: { 'x-codeium-csrf-token': 'csrf-meta-1' } });

    // Mode A: responseId + thinkingOutputTokens present -> zero metadata RPCs, dedup on repeat poll
    await hub.pollCycle();
    await hub.pollCycle();
    assert.equal(metaCalls.length, 0);
    assert.equal(emittedBatches.length, 1);
    assert.equal(emittedBatches[0][0].callId, 'resp-complete-100');

    // Reset hub with Mode B: step missing responseId / thinkingOutputTokens triggers tail lookup max once per stepCount
    hub.dispose();
    mode = 'missingMetaStep';
    emittedBatches.length = 0;

    const hub2 = telemetryModule.createTelemetryHub({
      window: win,
      document: doc,
      location: win.location,
      storage,
      core,
      autoPoll: false
    });
    hub2.subscribeFinalizedCalls(calls => emittedBatches.push(calls));
    hub2.start();
    await win.fetch('/local/seed', { headers: { 'x-codeium-csrf-token': 'csrf-meta-2' } });

    await hub2.pollCycle();
    await hub2.pollCycle();
    assert.equal(metaCalls.length, 1);
    assert.equal(metaCalls[0].includeMessages, false);
    assert.equal(metaCalls[0].generatorMetadataOffset, 0);
    assert.equal(emittedBatches.length, 1);
    assert.equal(emittedBatches[0][0].callId, 'resp-tail-enriched-200');
    assert.equal(emittedBatches[0][0].thinkingTokens, 35);

    hub2.dispose();
  });

  it('renders Morandi 3A thresholds, compression alert, and syncs bidirectional zh-CN/zh-TW <-> en language toggle', async () => {
    const { doc, win, storage } = createMockDomEnv();
    const cid = 'cascade-capsule-ui-01';
    const footer = doc.createElement('div');
    footer.className = 'agy-composer-footer';
    const permBtn = doc.createElement('button');
    permBtn.setAttribute('data-testid', 'permissions-selector-trigger');
    footer.appendChild(permBtn);
    footer.__reactFiber$cap = {
      memoizedProps: { conversationId: cid, modelId: 'MODEL_PLACEHOLDER_M37', label: 'Gemini 3.1 Pro' },
      return: null
    };
    doc.body.appendChild(footer);

    let stepSet = 'low';
    const futureIso = new Date(Date.now() + 90 * 60 * 1000).toISOString();
    win.fetch = async (url) => {
      const target = String(url);
      if (target.endsWith('/GetUserStatus')) {
        return makeJsonResponse({
          userStatus: {
            cascadeModelConfigData: {
              clientModelConfigs: [
                {
                  modelOrAlias: { model: 'MODEL_PLACEHOLDER_M37' },
                  label: 'Gemini 3.1 Pro',
                  quotaInfo: { remainingFraction: 0.72, resetTime: futureIso }
                }
              ]
            }
          }
        });
      }
      if (target.endsWith('/GetAllCascadeTrajectories')) {
        const countByMode = { low: 1, amber: 2, red: 3, compressed: 4 };
        return makeJsonResponse({ trajectorySummaries: { [cid]: { stepCount: countByMode[stepSet] || 1, status: 'IDLE' } } });
      }
      if (target.endsWith('/GetCascadeTrajectorySteps')) {
        const limit = telemetryModule.getContextLimitForModel('MODEL_PLACEHOLDER_M37', 'Gemini 3.1 Pro');
        const mapByMode = {
          low: { inputTokens: Math.round(limit * 0.2), cacheReadTokens: 0, outputTokens: 200 },
          amber: { inputTokens: Math.round(limit * 0.7), cacheReadTokens: 0, outputTokens: 200 },
          red: { inputTokens: Math.round(limit * 0.9), cacheReadTokens: 0, outputTokens: 200 },
          compressed: [
            { inputTokens: 80000, cacheReadTokens: 20000, outputTokens: 500 },
            { inputTokens: 15000, cacheReadTokens: 5000, outputTokens: 300 }
          ]
        };
        if (stepSet === 'compressed') {
          const steps = mapByMode.compressed.map((mu, idx) => ({
            type: 'PLANNER_RESPONSE',
            stepIndex: idx,
            status: 'DONE',
            metadata: {
              modelUsage: {
                model: 'MODEL_PLACEHOLDER_M37',
                responseId: `resp-comp-${idx}`,
                thinkingOutputTokens: 0,
                ...mu
              }
            }
          }));
          return makeJsonResponse({ steps });
        }
        return makeJsonResponse({
          steps: [{
            type: 'PLANNER_RESPONSE',
            stepIndex: 0,
            status: 'DONE',
            metadata: {
              modelUsage: {
                model: 'MODEL_PLACEHOLDER_M37',
                responseId: `resp-${stepSet}`,
                thinkingOutputTokens: 0,
                ...mapByMode[stepSet]
              }
            }
          }]
        });
      }
      return makeJsonResponse({ ok: true });
    };

    const hub = telemetryModule.createTelemetryHub({
      window: win,
      document: doc,
      location: win.location,
      navigator: { language: 'zh-CN' },
      storage,
      core,
      autoPoll: false
    });
    const capsule = capsuleModule.createCapsuleController({
      hub,
      window: win,
      document: doc,
      telemetryModule
    });
    hub.start();
    capsule.start();
    await win.fetch('/local/seed', { headers: { 'x-codeium-csrf-token': 'csrf-cap-1' } });

    const strip = footer.querySelector('[data-agy-capsule-strip="1"]');
    assert.ok(strip, 'Inline capsule strip should be injected into .agy-composer-footer');
    assert.equal(footer.children[footer.children.indexOf(strip) + 1], permBtn);

    const btn = footer.querySelector('[data-agy-context-capsule="1"]');
    assert.ok(btn, 'Capsule button should be injected into .agy-composer-footer');
    assert.equal(btn.parentElement, strip);
    assert.equal(btn.style.backgroundColor, 'transparent');

    const quotaBtn = footer.querySelector('[data-agy-quota-capsule="1"]');
    assert.ok(quotaBtn, 'Quota pill should be mounted inside the strip');

    await hub.pollCycle();
    capsule.renderAllFooters();
    assert.equal(btn.querySelector('.agy-ctx-ring-fill').getAttribute('stroke'), '#4ea84e');
    const lowOffset = Number(btn.querySelector('.agy-ctx-ring-fill').getAttribute('stroke-dashoffset'));
    assert.equal(btn.querySelector('.agy-ctx-speed').style.display, 'none');
    assert.equal(btn.querySelector('.agy-ctx-sep').style.display, 'none');
    assert.equal(quotaBtn.hidden, false);
    assert.equal(quotaBtn.querySelector('.agy-quota-5h-val').textContent, '72%');
    assert.equal(quotaBtn.querySelector('.agy-quota-ring-fill').getAttribute('stroke'), '#4ea84e');
    assert.equal(quotaBtn.querySelector('.agy-quota-pair-wk').style.display, 'none');

    stepSet = 'amber';
    await hub.pollCycle();
    capsule.renderAllFooters();
    assert.equal(btn.querySelector('.agy-ctx-ring-fill').getAttribute('stroke'), '#d4940a');
    const amberOffset = Number(btn.querySelector('.agy-ctx-ring-fill').getAttribute('stroke-dashoffset'));
    assert.ok(amberOffset < lowOffset, 'Capsule ring stroke-dashoffset should decrease as usagePercent rises');

    stepSet = 'red';
    await hub.pollCycle();
    capsule.renderAllFooters();
    assert.equal(btn.querySelector('.agy-ctx-ring-fill').getAttribute('stroke'), '#e06c75');
    const redOffset = Number(btn.querySelector('.agy-ctx-ring-fill').getAttribute('stroke-dashoffset'));
    assert.ok(redOffset < amberOffset, 'Capsule ring stroke-dashoffset should decrease further at >=80% usage');

    stepSet = 'compressed';
    await hub.pollCycle();
    capsule.renderAllFooters();
    const resolved = hub.resolveUsageForFooter(footer);
    assert.equal(resolved.contextLimit, 1000000);
    assert.equal(resolved.modelMaxTokens, 1000000);
    assert.equal(resolved.clientCompactionLimit, null);
    assert.equal(resolved.compressionDetected, true);
    assert.ok(resolved.compressionDrop > telemetryModule.COMPRESSION_MIN_DROP);
    assert.ok(btn.querySelector('.agy-ctx-label').textContent.includes('/1M ·'));
    capsule.updateTooltipContent(btn);
    const tip = doc.getElementById('__agy_ctx_capsule_tooltip__');
    assert.ok(tip.textContent.includes('已触发自动压缩'));
    assert.ok(tip.textContent.includes('1,000,000'));
    assert.ok(!tip.textContent.includes('256,000'));
    assert.ok(!tip.textContent.includes('自动压缩阈值'));
    assert.equal(tip.querySelector('.agy-ctx-compaction-tick'), null);
    assert.ok(tip.querySelector('.agy-ctx-seg-track'));
    assert.ok(tip.querySelector('.agy-ctx-seg-cache'));
    assert.ok(tip.querySelector('.agy-ctx-seg-input'));
    assert.ok(tip.querySelector('.agy-ctx-seg-output'));
    assert.equal(tip.querySelectorAll('.agy-ctx-bd-col').length, 4);
    assert.ok(!tip.textContent.includes('github.com'));

    // Language toggle remembers last zh variant (zh-TW <-> en)
    const langChanges = [];
    hub.subscribeLanguage(l => langChanges.push(l));
    hub.setLanguage('zh-TW');
    assert.equal(hub.getShortLanguage(), 'zh');

    btn.click();
    assert.equal(hub.getLanguage(), 'en');
    assert.equal(hub.getShortLanguage(), 'en');
    capsule.updateTooltipContent(btn);
    assert.ok(tip.textContent.includes('Auto-compressed'));
    assert.ok(tip.textContent.includes('Cache'));
    assert.ok(tip.textContent.includes('Remain'));
    assert.ok(!tip.textContent.includes('Compaction Limit'));

    btn.click();
    assert.equal(hub.getLanguage(), 'zh-TW');
    assert.equal(hub.getShortLanguage(), 'zh');
    assert.deepEqual(langChanges, ['zh-TW', 'en', 'zh-TW']);
    capsule.updateTooltipContent(btn);
    assert.ok(tip.textContent.includes('已用'));
    assert.ok(tip.textContent.includes('剩餘'));
    assert.ok(tip.textContent.includes('已觸發自動壓縮'));
    assert.ok(tip.textContent.includes('Prompt 快取命中率'));
    assert.ok(tip.textContent.includes('點擊切換: English'));

    // Quota HUD tooltip shows Scheme 5 5h fallback in zh-TW
    capsule.updateQuotaTooltipContent(quotaBtn);
    const quotaTip = doc.getElementById('__agy_quota_hud_tooltip__');
    assert.ok(quotaTip.textContent.includes('5小時額度'));
    assert.ok(quotaTip.textContent.includes('72%'));
    assert.ok(quotaTip.textContent.includes('後重置'));
    assert.equal(quotaTip.querySelector('.agy-quota-hud-weekly'), null);

    // Non-zero generation speed reveals speed cluster + dot + hairline separator; 0% usage equals full circumference
    capsule.renderFooterCapsule(footer, { ...resolved, tokPerSec: 42, avgTokPerSec: 38, usagePercent: 0, contextUsed: 0 });
    assert.equal(btn.querySelector('.agy-ctx-speed').style.display, 'inline-flex');
    assert.equal(btn.querySelector('.agy-ctx-sep').style.display, 'inline-block');
    assert.ok(btn.querySelector('.agy-ctx-speed-dot'));
    assert.equal(btn.querySelector('.agy-ctx-speed-val').textContent, '42 tok/s');
    assert.equal(
      btn.querySelector('.agy-ctx-ring-fill').getAttribute('stroke-dashoffset'),
      capsuleModule.RING_CIRCUMFERENCE.toFixed(2)
    );

    capsule.dispose();
    hub.dispose();
    assert.equal(footer.querySelector('[data-agy-capsule-strip="1"]'), null);
    assert.equal(footer.querySelector('[data-agy-context-capsule="1"]'), null);
    assert.equal(footer.querySelector('[data-agy-quota-capsule="1"]'), null);
    assert.equal(doc.getElementById('__agy_ctx_capsule_tooltip__'), null);
    assert.equal(doc.getElementById('__agy_quota_hud_tooltip__'), null);
  });

  it('resolves real model context windows without 256k clamping (Gemini 1M, Claude 200k, GPT-OSS 128k) and separates runtime compaction limits', async () => {
    const claudeSpec = telemetryModule.resolveModelContextSpec('MODEL_PLACEHOLDER_M401', 'Claude Opus 5.5');
    assert.equal(claudeSpec.contextLimit, 200000);
    assert.equal(claudeSpec.modelMaxTokens, 200000);
    assert.equal(claudeSpec.clientCompactionLimit, null);
    assert.equal(claudeSpec.limitSource, 'spec');

    const geminiArgonSpec = telemetryModule.resolveModelContextSpec('MODEL_PLACEHOLDER_M418', 'Gemini 4 Argon (Medium)');
    assert.equal(geminiArgonSpec.contextLimit, 1000000);
    assert.equal(geminiArgonSpec.modelMaxTokens, 1000000);
    assert.equal(geminiArgonSpec.clientCompactionLimit, null);
    assert.equal(geminiArgonSpec.limitSource, 'spec');

    const geminiNeonSpec = telemetryModule.resolveModelContextSpec('MODEL_PLACEHOLDER_M535', 'Gemini 4 Neon (XHigh)');
    assert.equal(geminiNeonSpec.contextLimit, 1000000);
    assert.equal(geminiNeonSpec.modelMaxTokens, 1000000);

    const orchestratorSpec = telemetryModule.resolveModelContextSpec('MODEL_PLACEHOLDER_M537', 'Orchestrator (Neon)');
    assert.equal(orchestratorSpec.contextLimit, 1000000);
    assert.equal(orchestratorSpec.modelMaxTokens, 1000000);

    const gptSpec = telemetryModule.resolveModelContextSpec('MODEL_OPENAI_GPT_OSS_120B_MEDIUM', 'GPT-OSS 120B');
    assert.equal(gptSpec.contextLimit, 128000);
    assert.equal(gptSpec.modelMaxTokens, 128000);
    assert.equal(gptSpec.clientCompactionLimit, null);
    assert.equal(gptSpec.limitSource, 'spec');

    // Observed runtime budget smaller than real model window stays separate as clientCompactionLimit
    const compactedSpec = telemetryModule.resolveModelContextSpec('MODEL_PLACEHOLDER_M535', 'Gemini 4 Neon (XHigh)', {
      observedClientBudget: 512000
    });
    assert.equal(compactedSpec.contextLimit, 1000000);
    assert.equal(compactedSpec.modelMaxTokens, 1000000);
    assert.equal(compactedSpec.clientCompactionLimit, 512000);
    assert.equal(compactedSpec.runtimeBudget, 512000);
    assert.equal(compactedSpec.limitSource, 'spec');

    // Catalog capabilities (GetAvailableModels) are NEVER clamped to 256,000
    const capMap = new Map([
      ['placeholder_m535', { maxTokens: 1048576, maxOutputTokens: 262144, source: 'get_available_models' }],
      ['gemini-4-neon-xhigh', { maxTokens: 1048576, maxOutputTokens: 262144, source: 'get_available_models' }],
      ['placeholder_m401', { maxTokens: 1000000, maxOutputTokens: 128000, source: 'get_available_models' }],
      ['openai_gpt_oss_120b_medium', { maxTokens: 131072, maxOutputTokens: 32768, source: 'get_available_models' }]
    ]);

    const neonCatalogSpec = telemetryModule.resolveModelContextSpec('MODEL_PLACEHOLDER_M535', 'Gemini 4 Neon (XHigh)', {
      modelCapabilities: capMap,
      observedClientBudget: 512000
    });
    assert.equal(neonCatalogSpec.contextLimit, 1048576);
    assert.equal(neonCatalogSpec.modelMaxTokens, 1048576);
    assert.equal(neonCatalogSpec.clientCompactionLimit, 512000);
    assert.equal(neonCatalogSpec.maxOutputTokens, 262144);
    assert.equal(neonCatalogSpec.limitSource, 'catalog');

    // Canonical alias matching ("Extra High" -> "xhigh") hits catalog entry cleanly
    const canonicalHit = telemetryModule.resolveModelContextSpec('', 'Gemini 4 Neon Extra High', {
      modelCapabilities: capMap
    });
    assert.equal(canonicalHit.contextLimit, 1048576);
    assert.equal(canonicalHit.limitSource, 'catalog');

    // Claude 5.5 1M catalog window overrides 200k fallback without clamping
    const claudeCatalogSpec = telemetryModule.resolveModelContextSpec('MODEL_PLACEHOLDER_M401', 'Claude Opus 5.5 (Medium)', {
      modelCapabilities: capMap
    });
    assert.equal(claudeCatalogSpec.contextLimit, 1000000);
    assert.equal(claudeCatalogSpec.maxOutputTokens, 128000);
    assert.equal(claudeCatalogSpec.limitSource, 'catalog');

    // GPT-OSS 128 KiB (131072) catalog window is preserved exactly and never inflated by stale observedBudget
    const gptCatalogSpec = telemetryModule.resolveModelContextSpec('MODEL_OPENAI_GPT_OSS_120B_MEDIUM', 'GPT-OSS 120B (Medium)', {
      modelCapabilities: capMap,
      observedClientBudget: 512000
    });
    assert.equal(gptCatalogSpec.contextLimit, 131072);
    assert.equal(gptCatalogSpec.clientCompactionLimit, null);
    assert.equal(gptCatalogSpec.limitSource, 'catalog');

    // Unknown model with runtime maxContextTokens adopts it cleanly without fabricating 256k
    const unknownRuntimeSpec = telemetryModule.resolveModelContextSpec('MODEL_CUSTOM_X', 'Custom Model X', {
      observedClientBudget: 400000
    });
    assert.equal(unknownRuntimeSpec.contextLimit, 400000);
    assert.equal(unknownRuntimeSpec.modelMaxTokens, 400000);
    assert.equal(unknownRuntimeSpec.clientCompactionLimit, null);
    assert.equal(unknownRuntimeSpec.limitSource, 'runtime');
  });

  it('ingests live GetAvailableModels, clientModelConfigs, and step.metadata.modelInfo and renders Compaction Limit in tooltip only when observed', async () => {
    const { doc, win, storage } = createMockDomEnv();
    const cid = 'cascade-live-window-01';
    const footer = doc.createElement('div');
    footer.className = 'agy-composer-footer';
    footer.__reactFiber$live = {
      memoizedProps: {
        conversationId: cid,
        modelId: 'gemini-pro-orchestrator-neon',
        label: 'Orchestrator (Neon)'
      },
      return: null
    };
    doc.body.appendChild(footer);

    let availableModelsCalls = 0;
    let stepMode = 'neon';

    win.fetch = async (url) => {
      const target = String(url);
      if (target.endsWith('/GetAvailableModels')) {
        availableModelsCalls += 1;
        return makeJsonResponse({
          response: {
            models: {
              'gemini-pro-orchestrator-neon': {
                model: 'MODEL_PLACEHOLDER_M537',
                displayName: 'Orchestrator (Neon)',
                maxTokens: 1048576,
                maxOutputTokens: 262144
              },
              'claude-opus-5-5-medium': {
                model: 'MODEL_PLACEHOLDER_M401',
                displayName: 'Claude Opus 5.5 (Medium)',
                maxTokens: 1000000,
                maxOutputTokens: 128000
              }
            }
          }
        });
      }
      if (target.endsWith('/GetUserStatus')) {
        return makeJsonResponse({
          userStatus: {
            cascadeModelConfigData: {
              clientModelConfigs: [
                {
                  modelOrAlias: { model: 'MODEL_PLACEHOLDER_M537' },
                  modelId: 'gemini-pro-orchestrator-neon',
                  label: 'Orchestrator (Neon)'
                },
                {
                  modelOrAlias: { model: 'MODEL_PLACEHOLDER_M888' },
                  modelId: 'custom-config-model',
                  label: 'Custom Config Model',
                  modelInfo: { maxTokens: 524288, maxOutputTokens: 65536 }
                }
              ]
            }
          }
        });
      }
      if (target.endsWith('/GetAllCascadeTrajectories')) {
        return makeJsonResponse({
          trajectorySummaries: {
            [cid]: { stepCount: stepMode === 'neon' ? 2 : 3, status: 'IDLE' }
          }
        });
      }
      if (target.endsWith('/GetCascadeTrajectorySteps')) {
        if (stepMode === 'neon') {
          return makeJsonResponse({
            steps: [
              {
                type: 'PLANNER_RESPONSE',
                stepIndex: 1,
                status: 'DONE',
                metadata: {
                  modelUsage: {
                    model: 'MODEL_PLACEHOLDER_M535',
                    responseId: 'resp-neon-1',
                    inputTokens: 4023,
                    cacheReadTokens: 338000,
                    outputTokens: 2000,
                    thinkingOutputTokens: 500
                  }
                }
              }
            ]
          });
        }
        return makeJsonResponse({
          steps: [
            {
              type: 'PLANNER_RESPONSE',
              stepIndex: 2,
              status: 'DONE',
              metadata: {
                modelInfo: {
                  model: 'MODEL_PLACEHOLDER_M999',
                  displayName: 'Experimental 768k Model',
                  maxTokens: 786432,
                  maxOutputTokens: 32768
                },
                modelUsage: {
                  model: 'MODEL_PLACEHOLDER_M999',
                  responseId: 'resp-exp-2',
                  inputTokens: 50000,
                  cacheReadTokens: 100000,
                  outputTokens: 1200,
                  thinkingOutputTokens: 100
                }
              }
            }
          ]
        });
      }
      if (target.endsWith('/SniffedGeneratorMeta')) {
        return makeJsonResponse({
          cascadeId: cid,
          generatorMetadata: [
            {
              chatModel: {
                model: 'MODEL_PLACEHOLDER_M535',
                chatStartMetadata: {
                  contextWindowMetadata: {
                    estimatedTokensUsed: 338402,
                    maxContextTokens: 512000
                  }
                }
              }
            }
          ]
        });
      }
      return makeJsonResponse({ ok: true });
    };

    const hub = telemetryModule.createTelemetryHub({
      window: win,
      document: doc,
      location: win.location,
      navigator: { language: 'zh-CN' },
      storage,
      core,
      autoPoll: false
    });
    const capsule = capsuleModule.createCapsuleController({
      hub,
      window: win,
      document: doc,
      telemetryModule
    });
    hub.start();
    capsule.start();
    await win.fetch('/local/seed', { headers: { 'x-codeium-csrf-token': 'csrf-live-1' } });

    await hub.pollCycle();
    capsule.renderAllFooters();
    assert.equal(availableModelsCalls, 1);

    const btn = footer.querySelector('[data-agy-context-capsule="1"]');
    const resolvedNeon = hub.resolveUsageForFooter(footer);
    assert.equal(resolvedNeon.contextUsed, 344023);
    assert.equal(resolvedNeon.contextLimit, 1048576);
    assert.equal(resolvedNeon.modelMaxTokens, 1048576);
    assert.equal(resolvedNeon.clientCompactionLimit, null);
    assert.equal(resolvedNeon.limitSource, 'catalog');
    assert.ok(resolvedNeon.usagePercent > 32 && resolvedNeon.usagePercent < 33.5);
    assert.equal(btn.querySelector('.agy-ctx-label').textContent, '344k/1M · 32.8%');
    assert.equal(btn.querySelector('.agy-ctx-ring-fill').getAttribute('stroke'), '#4ea84e');
    const quotaBtn = footer.querySelector('[data-agy-quota-capsule="1"]');
    assert.equal(quotaBtn.hidden, true);
    assert.equal(quotaBtn.style.display, 'none');

    // Tooltip shows real 1,048,576 window and NO Compaction Limit row or bar tick before runtime metadata arrives
    capsule.updateTooltipContent(btn);
    const tip = doc.getElementById('__agy_ctx_capsule_tooltip__');
    assert.ok(tip.textContent.includes('344,023 / 1,048,576'));
    assert.ok(!tip.textContent.includes('自动压缩阈值'));
    assert.equal(tip.querySelector('.agy-ctx-compaction-tick'), null);
    assert.equal(tip.style.backgroundColor, 'rgba(18, 18, 22, 0.95)');

    // ClientModelConfigs-embedded modelInfo.maxTokens (524,288) is also ingested without clamping
    const cfgSpec = telemetryModule.resolveModelContextSpec('custom-config-model', '', {
      modelCapabilities: hub.getModelCapabilities(),
      modelConfigs: hub.getUserStatusMeta().modelConfigs
    });
    assert.equal(cfgSpec.contextLimit, 524288);
    assert.equal(cfgSpec.limitSource, 'catalog');

    // Passive fetch sniff of GetCascadeTrajectoryGeneratorMetadata records 512k compaction threshold
    await win.fetch('/exa.language_server_pb.LanguageServerService/SniffedGeneratorMeta', {
      method: 'POST',
      body: JSON.stringify({ cascadeId: cid })
    });
    await new Promise(r => setImmediate(r));
    capsule.renderAllFooters();

    const resolvedWithCompaction = hub.resolveUsageForFooter(footer);
    assert.equal(resolvedWithCompaction.contextLimit, 1048576);
    assert.equal(resolvedWithCompaction.clientCompactionLimit, 512000);
    assert.equal(btn.querySelector('.agy-ctx-label').textContent, '344k/1M · 32.8%');

    capsule.updateTooltipContent(btn);
    assert.ok(tip.textContent.includes('344,023 / 1,048,576'));
    assert.ok(tip.textContent.includes('自动压缩阈值'));
    assert.ok(tip.textContent.includes('512,000 (512k)'));
    const compactionTick = tip.querySelector('.agy-ctx-compaction-tick');
    assert.ok(compactionTick, 'Compaction bar tick should render when 0 < clientCompactionLimit < contextLimit');
    assert.ok(compactionTick.style.cssText.includes('left:48.8%'));

    // Light theme palette switches cleanly
    doc.documentElement.classList.add('light');
    capsule.updateTooltipContent(btn);
    assert.equal(tip.style.backgroundColor, 'rgba(255, 255, 255, 0.96)');
    doc.documentElement.classList.remove('light');

    hub.setLanguage('zh-TW');
    capsule.updateTooltipContent(btn);
    assert.ok(tip.textContent.includes('自動壓縮閾值'));

    hub.setLanguage('en');
    capsule.updateTooltipContent(btn);
    assert.ok(tip.textContent.includes('Compaction Limit'));
    assert.ok(tip.textContent.includes('512,000 (512k)'));

    // Step-level metadata.modelInfo.maxTokens (786,432) is ingested dynamically for unknown model IDs
    stepMode = 'stepModelInfo';
    footer.__reactFiber$live.memoizedProps = { conversationId: cid, modelId: 'MODEL_PLACEHOLDER_M999', label: '' };
    await hub.pollCycle();
    const resolvedStepModel = hub.resolveUsageForFooter(footer);
    assert.equal(resolvedStepModel.contextLimit, 786432);
    assert.equal(resolvedStepModel.modelDisplayName, 'Experimental 768k Model');
    assert.equal(resolvedStepModel.limitSource, 'catalog');

    capsule.dispose();
    hub.dispose();
  });

  it('prevents earlier-model or shadow/image step modelInfo and budgets from poisoning active model capabilities or compaction limits', async () => {
    const { doc, win, storage } = createMockDomEnv();
    const cid = 'cascade-isolation-01';
    const footer = doc.createElement('div');
    footer.className = 'agy-composer-footer';
    footer.__reactFiber$iso = {
      memoizedProps: {
        conversationId: cid,
        currentModelConfig: {
          modelOrAlias: { model: 'MODEL_PLACEHOLDER_M537' },
          modelId: 'gemini-pro-orchestrator-neon',
          label: 'Orchestrator (Neon)'
        }
      },
      return: null
    };
    doc.body.appendChild(footer);

    win.fetch = async (url) => {
      const target = String(url);
      if (target.endsWith('/GetAvailableModels')) {
        return makeJsonResponse({
          response: {
            models: {
              'gemini-pro-orchestrator-neon': {
                model: 'MODEL_PLACEHOLDER_M537',
                displayName: 'Orchestrator (Neon)',
                maxTokens: 1048576,
                maxOutputTokens: 262144
              }
            }
          }
        });
      }
      if (target.endsWith('/GetUserStatus')) {
        return makeJsonResponse({ userStatus: { cascadeModelConfigData: { clientModelConfigs: [] } } });
      }
      if (target.endsWith('/GetAllCascadeTrajectories')) {
        return makeJsonResponse({ trajectorySummaries: { [cid]: { stepCount: 4, status: 'IDLE' } } });
      }
      if (target.endsWith('/GetCascadeTrajectorySteps')) {
        return makeJsonResponse({
          steps: [
            // Earlier step from a different model (mid-conversation switch): must NOT overwrite M537
            {
              type: 'PLANNER_RESPONSE',
              stepIndex: 0,
              status: 'DONE',
              metadata: {
                modelInfo: {
                  model: 'MODEL_PLACEHOLDER_M26',
                  displayName: 'Claude Opus 4.6 (Thinking)',
                  maxTokens: 200000
                },
                modelUsage: {
                  model: 'MODEL_PLACEHOLDER_M26',
                  responseId: 'resp-old-claude',
                  inputTokens: 10000,
                  cacheReadTokens: 0,
                  outputTokens: 500,
                  thinkingOutputTokens: 50
                }
              }
            },
            // Active main-model step with legitimate 512k compaction threshold
            {
              type: 'PLANNER_RESPONSE',
              stepIndex: 1,
              status: 'DONE',
              metadata: {
                generatorMetadata: {
                  chatModel: {
                    chatStartMetadata: {
                      contextWindowMetadata: { maxContextTokens: 512000 }
                    }
                  }
                },
                modelUsage: {
                  model: 'MODEL_PLACEHOLDER_M537',
                  responseId: 'resp-main-neon',
                  inputTokens: 50000,
                  cacheReadTokens: 200000,
                  outputTokens: 1500,
                  thinkingOutputTokens: 200
                }
              }
            },
            // Shadow/image model step (M21 / M50): must NOT poison M537 capabilities or overwrite 512k compaction budget
            {
              type: 'PLANNER_RESPONSE',
              stepIndex: 2,
              status: 'DONE',
              metadata: {
                modelInfo: {
                  model: 'MODEL_PLACEHOLDER_M21',
                  displayName: 'Gemini 3.1 Flash Image',
                  maxTokens: 65536
                },
                checkpointConfig: { maxTokenLimit: 65536 },
                modelUsage: {
                  model: 'MODEL_PLACEHOLDER_M21',
                  responseId: 'resp-shadow-img',
                  maxContextTokens: 65536,
                  inputTokens: 1200,
                  cacheReadTokens: 0,
                  outputTokens: 100,
                  thinkingOutputTokens: 0
                }
              }
            }
          ]
        });
      }
      return makeJsonResponse({ ok: true });
    };

    const hub = telemetryModule.createTelemetryHub({
      window: win,
      document: doc,
      location: win.location,
      storage,
      core,
      autoPoll: false
    });
    hub.start();
    await win.fetch('/local/seed', { headers: { 'x-codeium-csrf-token': 'csrf-iso-1' } });
    await hub.pollCycle();

    const resolved = hub.resolveUsageForFooter(footer);
    assert.equal(resolved.contextLimit, 1048576);
    assert.equal(resolved.modelMaxTokens, 1048576);
    assert.equal(resolved.clientCompactionLimit, 512000);
    assert.equal(hub.resolveModelDisplayName('MODEL_PLACEHOLDER_M537'), 'Orchestrator (Neon)');

    // Earlier M26 step capability was still cleanly registered under M26 alone, while M21 shadow step was ignored
    const caps = hub.getModelCapabilities();
    assert.equal(caps.get('placeholder_m537')?.maxTokens, 1048576);
    assert.equal(caps.get('placeholder_m26')?.maxTokens, 200000);
    assert.equal(caps.get('placeholder_m21'), undefined);

    hub.dispose();
  });

  it('extracts 5h & weekly quota buckets via Fiber retrieveUserQuotaSummary with 15s TTL, merges with GetUserStatus, and renders Scheme 1 + Scheme 5 HUD', async () => {
    const { doc, win, storage } = createMockDomEnv();
    const cid = 'cascade-quota-hud-01';
    const footer = doc.createElement('div');
    footer.className = 'agy-composer-footer';
    const permBtn = doc.createElement('button');
    permBtn.setAttribute('data-testid', 'permissions-selector-trigger');
    footer.appendChild(permBtn);
    doc.body.appendChild(footer);

    const future5hMs = Date.now() + 2 * 60 * 60 * 1000;
    const futureWkMs = Date.now() + 3 * 24 * 60 * 60 * 1000;
    let summaryCalls = 0;
    let summaryMode = 'normal';

    const providerFiber = {
      memoizedProps: {
        value: {
          retrieveUserQuotaSummary: async () => {
            summaryCalls += 1;
            if (summaryMode === 'throw') throw new Error('Simulated Fiber RPC error');
            if (summaryMode === 'low') {
              return {
                response: {
                  groups: [
                    {
                      groupId: 'gemini',
                      models: ['MODEL_PLACEHOLDER_M537'],
                      buckets: [
                        { windowType: '5h', remainingFraction: 0.08, resetTimeMs: future5hMs },
                        { windowType: 'weekly', remainingFraction: 0.22, resetTimeMs: futureWkMs }
                      ]
                    }
                  ]
                }
              };
            }
            return {
              response: {
                groups: [
                  {
                    groupId: 'gemini',
                    label: 'Gemini',
                    models: ['MODEL_PLACEHOLDER_M537', 'MODEL_PLACEHOLDER_M535'],
                    buckets: [
                      { windowType: '5h', remainingFraction: 0.84, resetTimeMs: future5hMs, resetTime: new Date(future5hMs).toISOString() },
                      { windowType: 'weekly', remainingFraction: 0.61, resetTimeMs: futureWkMs, resetTime: new Date(futureWkMs).toISOString() }
                    ]
                  },
                  {
                    groupId: 'premium',
                    label: 'Claude & GPT',
                    models: ['MODEL_PLACEHOLDER_M401'],
                    buckets: [
                      { windowType: '5h', remainingFraction: 0.18, resetTimeMs: future5hMs },
                      { windowType: 'weekly', remainingFraction: 0.44, resetTimeMs: futureWkMs }
                    ]
                  }
                ]
              }
            };
          }
        }
      },
      return: null
    };

    footer.__reactFiber$cap = {
      memoizedProps: { conversationId: cid, modelId: 'MODEL_PLACEHOLDER_M537', label: 'Orchestrator (Neon)' },
      return: providerFiber
    };

    win.fetch = async (url) => {
      const target = String(url);
      if (target.endsWith('/GetAvailableModels')) {
        return makeJsonResponse({
          response: {
            models: {
              'gemini-pro-orchestrator-neon': {
                model: 'MODEL_PLACEHOLDER_M537',
                displayName: 'Orchestrator (Neon)',
                maxTokens: 1048576,
                maxOutputTokens: 262144
              }
            }
          }
        });
      }
      if (target.endsWith('/GetUserStatus')) {
        return makeJsonResponse({
          userStatus: {
            cascadeModelConfigData: {
              clientModelConfigs: [
                {
                  modelOrAlias: { model: 'MODEL_PLACEHOLDER_M537' },
                  label: 'Orchestrator (Neon)',
                  quotaInfo: { remainingFraction: 0.84, resetTime: new Date(future5hMs).toISOString() }
                }
              ]
            }
          }
        });
      }
      if (target.endsWith('/GetAllCascadeTrajectories')) {
        return makeJsonResponse({ trajectorySummaries: { [cid]: { stepCount: 2, status: 'IDLE' } } });
      }
      if (target.endsWith('/GetCascadeTrajectorySteps')) {
        return makeJsonResponse({
          steps: [
            {
              type: 'PLANNER_RESPONSE',
              stepIndex: 1,
              status: 'DONE',
              createdAt: '2026-11-25T08:00:00.000Z',
              finishedGeneratingAt: '2026-11-25T08:00:02.000Z',
              metadata: {
                modelUsage: {
                  model: 'MODEL_PLACEHOLDER_M537',
                  responseId: 'resp-hud-1',
                  inputTokens: 12000,
                  cacheReadTokens: 180000,
                  outputTokens: 600,
                  thinkingOutputTokens: 100
                }
              }
            }
          ]
        });
      }
      return makeJsonResponse({ ok: true });
    };

    const hub = telemetryModule.createTelemetryHub({
      window: win,
      document: doc,
      location: win.location,
      navigator: { language: 'zh-CN' },
      storage,
      core,
      autoPoll: false
    });
    const capsule = capsuleModule.createCapsuleController({
      hub,
      window: win,
      document: doc,
      telemetryModule
    });
    hub.start();
    capsule.start();
    await win.fetch('/local/seed', { headers: { 'x-codeium-csrf-token': 'csrf-hud-1' } });

    await hub.pollCycle();
    capsule.renderAllFooters();
    assert.equal(summaryCalls, 1);

    // Within 15s TTL, refreshQuotaSummary(false) returns cached data with zero extra Fiber calls
    await hub.refreshQuotaSummary(false);
    assert.equal(summaryCalls, 1);

    const resolved = hub.resolveUsageForFooter(footer);
    assert.equal(resolved.contextLimit, 1048576);
    assert.equal(resolved.quotaInfo.remainingFraction, 0.84);
    assert.equal(resolved.quotaSummary.fiveHour.remainingFraction, 0.84);
    assert.equal(resolved.quotaSummary.weekly.remainingFraction, 0.61);
    assert.equal(resolved.quotaSummary.groups.length, 2);

    const quotaBtn = footer.querySelector('[data-agy-quota-capsule="1"]');
    assert.equal(quotaBtn.hidden, false);
    assert.equal(quotaBtn.querySelector('.agy-quota-5h-val').textContent, '84%');
    assert.equal(quotaBtn.querySelector('.agy-quota-ring-fill').getAttribute('stroke'), '#4ea84e');
    assert.equal(quotaBtn.querySelector('.agy-quota-pair-wk').style.display, 'inline-flex');
    assert.equal(quotaBtn.querySelector('.agy-quota-wk-val').textContent, '61%');
    assert.equal(quotaBtn.querySelector('.agy-quota-wk-ring-fill').getAttribute('stroke'), '#4ea84e');

    // Scheme 5 Quota HUD tooltip renders Model + 5h + Weekly across zh-CN / zh-TW / en and light/dark
    quotaBtn.dispatchEvent({ type: 'mouseenter', target: quotaBtn });
    const quotaTip = doc.getElementById('__agy_quota_hud_tooltip__');
    assert.ok(quotaTip);
    assert.equal(quotaTip.style.opacity, '1');
    assert.ok(quotaTip.style.cssText.includes('ui-monospace'));
    assert.ok(quotaTip.textContent.includes('Orchestrator (Neon)'));
    assert.ok(quotaTip.textContent.includes('5小时额度'));
    assert.ok(quotaTip.textContent.includes('84%'));
    assert.ok(quotaTip.textContent.includes('每周额度'));
    assert.ok(quotaTip.textContent.includes('61%'));
    assert.ok(!quotaTip.textContent.includes('github.com'));

    hub.setLanguage('zh-TW');
    assert.ok(quotaTip.textContent.includes('5小時額度'));
    assert.ok(quotaTip.textContent.includes('每週額度'));

    hub.setLanguage('en');
    assert.ok(quotaTip.textContent.includes('5-Hour'));
    assert.ok(quotaTip.textContent.includes('Weekly'));

    // Switching active model selects the matching premium/Claude group cleanly
    footer.__reactFiber$cap.memoizedProps = { conversationId: cid, modelId: 'MODEL_PLACEHOLDER_M401', label: 'Claude Opus 5.5 (Medium)' };
    capsule.renderAllFooters();
    assert.equal(quotaBtn.querySelector('.agy-quota-5h-val').textContent, '18%');
    assert.equal(quotaBtn.querySelector('.agy-quota-ring-fill').getAttribute('stroke'), '#f59e0b');
    assert.equal(quotaBtn.querySelector('.agy-quota-wk-val').textContent, '44%');
    assert.equal(quotaBtn.querySelector('.agy-quota-wk-ring-fill').getAttribute('stroke'), '#4ea84e');
    assert.equal(quotaTip.querySelector('.agy-quota-hud-5h-bar').style.backgroundColor, '#f59e0b');
    assert.equal(quotaTip.querySelector('.agy-quota-hud-weekly-bar').style.backgroundColor, '#64748b');

    // Force refresh with <=10% critical 5h threshold turns ring & HUD bar red (#ef4444)
    footer.__reactFiber$cap.memoizedProps = { conversationId: cid, modelId: 'MODEL_PLACEHOLDER_M537', label: 'Orchestrator (Neon)' };
    summaryMode = 'low';
    await hub.refreshQuotaSummary(true);
    assert.equal(summaryCalls, 2);
    capsule.renderAllFooters();
    assert.equal(quotaBtn.querySelector('.agy-quota-5h-val').textContent, '8%');
    assert.equal(quotaBtn.querySelector('.agy-quota-ring-fill').getAttribute('stroke'), '#ef4444');
    assert.equal(quotaTip.querySelector('.agy-quota-hud-5h-bar').style.backgroundColor, '#ef4444');
    assert.equal(quotaTip.querySelector('.agy-quota-hud-weekly-bar').style.backgroundColor, '#f59e0b');

    // Light mode adapts Quota HUD tooltip colors cleanly
    doc.documentElement.classList.add('light');
    capsule.updateQuotaTooltipContent(quotaBtn);
    assert.equal(quotaTip.style.backgroundColor, 'rgba(255, 255, 255, 0.98)');
    doc.documentElement.classList.remove('light');

    // Mouseleave hides Quota HUD tooltip
    quotaBtn.dispatchEvent({ type: 'mouseleave', target: quotaBtn });
    assert.equal(quotaTip.style.opacity, '0');

    // Fault-tolerant Fiber failure returns null cleanly with zero throw and preserves GetUserStatus 5h fallback
    summaryMode = 'throw';
    const failedSummary = await hub.refreshQuotaSummary(true);
    assert.equal(failedSummary, null);
    const fallbackResolved = hub.resolveUsageForFooter(footer);
    assert.equal(fallbackResolved.quotaInfo.remainingFraction, 0.84);
    assert.equal(fallbackResolved.quotaSummary.fiveHour.remainingFraction, 0.84);
    assert.equal(fallbackResolved.quotaSummary.weekly, null);

    capsule.dispose();
    hub.dispose();
    assert.equal(hub.getQuotaSummary(), null);
    assert.equal(footer.querySelector('[data-agy-capsule-strip="1"]'), null);
    assert.equal(doc.getElementById('__agy_ctx_capsule_tooltip__'), null);
    assert.equal(doc.getElementById('__agy_quota_hud_tooltip__'), null);
  });

  it('times out hanging retrieveUserQuotaSummary gracefully after 2s and clears timers on dispose', async () => {
    const { doc, win, storage } = createMockDomEnv();
    const footer = doc.createElement('div');
    footer.className = 'agy-composer-footer';
    footer.__reactFiber$hang = {
      memoizedProps: {
        value: {
          retrieveUserQuotaSummary: () => new Promise(() => {})
        }
      },
      return: null
    };
    doc.body.appendChild(footer);

    const hub = telemetryModule.createTelemetryHub({
      window: win,
      document: doc,
      location: win.location,
      storage,
      core,
      autoPoll: false
    });
    hub.start();

    const startedAt = Date.now();
    const res = await hub.refreshQuotaSummary(true);
    const elapsed = Date.now() - startedAt;
    assert.equal(res, null);
    assert.ok(elapsed >= 1900 && elapsed < 3500, `Expected ~2s timeout, got ${elapsed}ms`);

    // Missing Fiber case also returns null immediately without throwing
    delete footer.__reactFiber$hang;
    const missingRes = await hub.refreshQuotaSummary(true);
    assert.equal(missingRes, null);

    hub.dispose();
  });
});
