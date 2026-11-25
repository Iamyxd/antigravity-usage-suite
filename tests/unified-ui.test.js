'use strict';

const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { describe, it } = require('node:test');
const assert = require('node:assert/strict');

const ROOT_DIR = path.resolve(__dirname, '..');
const COMPILED_PANEL_PATH = path.join(ROOT_DIR, 'dist', 'usage-panel-ui.compiled.js');
const UNIFIED_BUNDLE_PATH = path.join(ROOT_DIR, 'dist', 'unified-bundle.js');

const core = require('../lib/usage-core');
const telemetryModule = require('../src/renderer/telemetry-hub');

const REMOVED_LEGACY_IDS = [
  'badge',
  'badge-speed',
  'badge-cli',
  'badge-overflow',
  'context-tooltip',
  'overflow-menu',
  'panel',
  'global-restart-modal',
  'btn-check-update',
  'check-auto-update',
  'update-popover',
  'btn-github-tokens',
  'btn-github-repo'
];

const VOID_TAGS = new Set(['br', 'hr', 'img', 'input', 'meta', 'link', 'path', 'rect', 'circle', 'line']);

function createStrictMockDom(origin = 'http://127.0.0.1:43000') {
  const storageMap = new Map();

  function makeEvent(type, target, extra = {}) {
    return {
      type,
      target,
      currentTarget: target,
      key: extra.key || '',
      defaultPrevented: false,
      preventDefault() { this.defaultPrevented = true; },
      stopPropagation() {},
      composedPath() {
        const path = [];
        let cur = target;
        while (cur) {
          path.push(cur);
          cur = cur.parentElement || null;
        }
        return path;
      },
      ...extra
    };
  }

  function decodeEntities(str) {
    return String(str || '')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&amp;/g, '&');
  }

  function parseHtmlIntoChildren(parent, html) {
    parent.children.length = 0;
    parent._text = '';
    const stack = [parent];
    const tokenRe = /<!--[\s\S]*?-->|<\/([a-zA-Z0-9_-]+)\s*>|<([a-zA-Z0-9_-]+)((?:\s+[^\s=/>]+(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+))?)*)\s*(\/?)>|([^<]+)/g;
    let match;
    while ((match = tokenRe.exec(String(html || '')))) {
      if (match[1]) {
        const closeTag = match[1].toUpperCase();
        while (stack.length > 1) {
          const popped = stack.pop();
          if (popped.tagName === closeTag) break;
        }
      } else if (match[2]) {
        const tag = match[2];
        const attrText = match[3] || '';
        const selfClose = Boolean(match[4]) || VOID_TAGS.has(tag.toLowerCase());
        const node = createNode(tag);
        const attrRe = /([^\s=/>]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g;
        let aMatch;
        while ((aMatch = attrRe.exec(attrText))) {
          const k = aMatch[1];
          const rawVal = aMatch[2] ?? aMatch[3] ?? aMatch[4];
          const val = rawVal === undefined ? '' : decodeEntities(rawVal);
          node.setAttribute(k, val);
        }
        stack[stack.length - 1].appendChild(node);
        if (!selfClose) stack.push(node);
      } else if (match[5]) {
        const cur = stack[stack.length - 1];
        const txt = decodeEntities(match[5]);
        if (cur.children.length === 0) cur._text += txt;
      }
    }
  }

  function parseCssVars(cssText) {
    const out = {};
    for (const part of String(cssText || '').split(';')) {
      const idx = part.indexOf(':');
      if (idx > 0) {
        out[part.slice(0, idx).trim()] = part.slice(idx + 1).trim();
      }
    }
    return out;
  }

  function createNode(tagName = 'div') {
    const attrs = new Map();
    const listeners = new Map();
    const children = [];
    let classSet = new Set();
    let hiddenFlag = false;
    let cssVars = {};

    const styleObj = {
      display: '',
      opacity: '',
      top: '',
      left: '',
      right: '',
      width: '',
      height: '',
      webkitAppRegion: '',
      setProperty(k, v) {
        cssVars[String(k)] = String(v);
        this[String(k)] = String(v);
      },
      getPropertyValue(k) {
        return cssVars[String(k)] ?? this[String(k)] ?? '';
      },
      removeProperty(k) {
        delete cssVars[String(k)];
        delete this[String(k)];
      },
      set cssText(val) {
        Object.assign(cssVars, parseCssVars(val));
      },
      get cssText() {
        return Object.entries(cssVars).map(([k, v]) => `${k}:${v}`).join(';');
      }
    };

    const dataset = new Proxy({}, {
      get(_t, prop) {
        const kebab = String(prop).replace(/[A-Z]/g, m => '-' + m.toLowerCase());
        return attrs.get(`data-${kebab}`);
      },
      set(_t, prop, val) {
        const kebab = String(prop).replace(/[A-Z]/g, m => '-' + m.toLowerCase());
        attrs.set(`data-${kebab}`, String(val));
        return true;
      }
    });

    const node = {
      tagName: String(tagName).toUpperCase(),
      nodeName: String(tagName).toUpperCase(),
      nodeType: 1,
      parentElement: null,
      children,
      childNodes: children,
      dataset,
      style: styleObj,
      value: '',
      checked: false,
      disabled: false,
      _text: '',
      shadowRoot: null,
      get id() { return attrs.get('id') || ''; },
      set id(v) { attrs.set('id', String(v)); },
      get hidden() { return hiddenFlag; },
      set hidden(v) {
        hiddenFlag = Boolean(v);
        if (hiddenFlag) attrs.set('hidden', '');
        else attrs.delete('hidden');
      },
      get className() { return Array.from(classSet).join(' '); },
      set className(v) {
        classSet = new Set(String(v || '').split(/\s+/).filter(Boolean));
        attrs.set('class', Array.from(classSet).join(' '));
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
      get firstChild() { return children[0] || null; },
      get firstElementChild() { return children[0] || null; },
      get lastElementChild() { return children[children.length - 1] || null; },
      get textContent() {
        if (children.length === 0) return this._text;
        return this._text + children.map(c => c.textContent || '').join('');
      },
      set textContent(v) {
        children.length = 0;
        this._text = String(v ?? '');
      },
      set innerHTML(html) {
        parseHtmlIntoChildren(this, html);
      },
      get innerHTML() {
        return children.map(c => `<${c.tagName.toLowerCase()}>${c.textContent}</${c.tagName.toLowerCase()}>`).join('');
      },
      setAttribute(k, v) {
        const key = String(k);
        const val = String(v);
        attrs.set(key, val);
        if (key === 'class') this.className = val;
        if (key === 'hidden') hiddenFlag = true;
        if (key === 'style') styleObj.cssText = val;
      },
      getAttribute(k) {
        const key = String(k);
        if (key === 'class') return this.className;
        return attrs.has(key) ? attrs.get(key) : null;
      },
      removeAttribute(k) {
        const key = String(k);
        attrs.delete(key);
        if (key === 'hidden') hiddenFlag = false;
      },
      appendChild(ch) {
        if (!ch) return ch;
        if (ch.parentElement && ch.parentElement !== this) ch.remove();
        ch.parentElement = this;
        children.push(ch);
        return ch;
      },
      insertBefore(ch, ref) {
        if (!ch) return ch;
        ch.parentElement = this;
        const idx = ref ? children.indexOf(ref) : -1;
        if (idx >= 0) children.splice(idx, 0, ch);
        else children.push(ch);
        return ch;
      },
      replaceChildren(...nodes) {
        children.length = 0;
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
        for (const ch of children) {
          if (ch.contains && ch.contains(target)) return true;
        }
        return false;
      },
      closest(selector) {
        let cur = this;
        while (cur) {
          if (matchesSimpleSelector(cur, selector)) return cur;
          cur = cur.parentElement;
        }
        return null;
      },
      attachShadow() {
        const sr = createNode('shadow-root');
        sr.parentElement = this;
        sr.getElementById = (id) => sr.querySelector(`#${id}`);
        this.shadowRoot = sr;
        return sr;
      },
      getBoundingClientRect() {
        return { top: 40, left: 100, right: 320, bottom: 72, width: 220, height: 32 };
      },
      addEventListener(type, fn) {
        if (!listeners.has(type)) listeners.set(type, new Set());
        listeners.get(type).add(fn);
      },
      removeEventListener(type, fn) {
        listeners.get(type)?.delete(fn);
      },
      dispatchEvent(evt) {
        const e = typeof evt === 'string' ? makeEvent(evt, this) : { ...makeEvent(evt.type, this), ...evt };
        for (const fn of (listeners.get(e.type) || [])) fn.call(this, e);
        return !e.defaultPrevented;
      },
      click() {
        this.dispatchEvent(makeEvent('click', this));
      },
      querySelectorAll(selector) {
        const res = [];
        const parts = String(selector).split(',').map(s => s.trim()).filter(Boolean);
        const walk = (rootNode) => {
          for (const ch of rootNode.children) {
            if (parts.some(p => matchesSelectorChain(ch, p))) res.push(ch);
            walk(ch);
          }
        };
        walk(this);
        return res;
      },
      querySelector(selector) {
        return this.querySelectorAll(selector)[0] || null;
      }
    };
    return node;
  }

  function matchesSimpleSelector(node, sel) {
    let rest = sel.trim();
    if (!rest) return false;
    const tagMatch = rest.match(/^([a-zA-Z0-9_-]+)/);
    if (tagMatch) {
      if (node.tagName !== tagMatch[1].toUpperCase()) return false;
      rest = rest.slice(tagMatch[1].length);
    }
    const tokenRe = /#([a-zA-Z0-9_-]+)|\.([a-zA-Z0-9_-]+)|\[([^\]*=]+)(\*=|=)?(?:"([^"]*)")?\]/g;
    let m;
    let matchedAny = Boolean(tagMatch);
    while ((m = tokenRe.exec(rest))) {
      matchedAny = true;
      if (m[1] && node.id !== m[1]) return false;
      if (m[2] && !node.classList.contains(m[2])) return false;
      if (m[3]) {
        const got = node.getAttribute(m[3]);
        const op = m[4];
        const expected = m[5];
        if (op === '*=') {
          if (typeof got !== 'string' || !got.includes(expected || '')) return false;
        } else if (expected !== undefined) {
          if (got !== expected) return false;
        } else if (got === null || got === undefined) {
          return false;
        }
      }
    }
    return matchedAny;
  }

  function matchesSelectorChain(node, chain) {
    const segs = chain.trim().split(/\s+(?![^\[]*\])/).filter(Boolean);
    if (!segs.length || !matchesSimpleSelector(node, segs[segs.length - 1])) return false;
    let cur = node.parentElement;
    for (let i = segs.length - 2; i >= 0; i--) {
      while (cur && !matchesSimpleSelector(cur, segs[i])) cur = cur.parentElement;
      if (!cur) return false;
      cur = cur.parentElement;
    }
    return true;
  }

  const doc = createNode('document');
  const htmlEl = createNode('html');
  const bodyEl = createNode('body');
  doc.documentElement = htmlEl;
  doc.body = bodyEl;
  doc.appendChild(htmlEl);
  htmlEl.appendChild(bodyEl);

  const titlebar = createNode('div');
  titlebar.className = 'part titlebar';
  const titlebarRight = createNode('div');
  titlebarRight.className = 'titlebar-right';
  titlebar.appendChild(titlebarRight);
  bodyEl.appendChild(titlebar);

  const footer = createNode('div');
  footer.className = 'agy-composer-footer';
  const permBtn = createNode('button');
  permBtn.setAttribute('data-testid', 'permissions-selector-trigger');
  footer.appendChild(permBtn);
  footer.__reactFiber$ui = {
    memoizedProps: { conversationId: 'cid-ui-session-01', modelId: 'MODEL_PLACEHOLDER_M37' },
    return: null
  };
  bodyEl.appendChild(footer);

  doc.createElement = (t) => createNode(t);
  doc.createElementNS = (_ns, t) => createNode(t);
  doc.getElementById = (id) => doc.querySelector(`#${id}`);

  const win = {
    location: { origin, href: `${origin}/workbench` },
    innerWidth: 1400,
    innerHeight: 900,
    localStorage: {
      getItem: (k) => (storageMap.has(k) ? storageMap.get(k) : null),
      setItem: (k, v) => storageMap.set(String(k), String(v))
    },
    navigator: { language: 'zh-CN' },
    getComputedStyle: () => ({ backgroundColor: 'rgb(24, 24, 27)', color: 'rgb(228, 228, 231)' }),
    setTimeout,
    clearTimeout,
    setInterval,
    clearInterval
  };

  return { win, doc, storage: win.localStorage, footer };
}

function makeSampleHistoryPayload(todayStr) {
  const mkDay = (tot, inp, outp, cache) => ({
    total: tot,
    input: inp,
    output: outp,
    cache,
    steps: 4,
    models: {
      'gemini-3.1-pro-high': {
        total: tot,
        input: inp,
        output: outp,
        cache,
        steps: 4
      }
    }
  });
  const d1 = mkDay(120000, 30000, 10000, 80000);
  const d2 = mkDay(50000, 15000, 5000, 30000);
  return {
    ok: true,
    dailyMap: { [todayStr]: d1, '2026-11-01': d2 },
    dailyMapBySource: {
      all: { [todayStr]: d1, '2026-11-01': d2 },
      desktop: { [todayStr]: d1 },
      cli: { '2026-11-01': d2 }
    },
    totalTokens: 170000,
    totalSteps: 8,
    totalConversations: 2,
    planStatus: {
      email: 'alice@example.com',
      tierKey: 'PRO',
      tierLabel: 'Google AI Pro',
      priceMonthly: 19.99,
      currency: 'USD',
      source: 'live'
    },
    pricingSummary: {
      pricedCalls: 3,
      totalCalls: 4,
      pricedCostUSD: 0.42
    }
  };
}

describe('Unified Usage Suite UI & Bundle', () => {
  it('mounts compiled usage panel without removed legacy IDs, renders real token-history views, syncs language with TelemetryHub, and posts bridge updates', async () => {
    const bundleCode = fs.readFileSync(UNIFIED_BUNDLE_PATH, 'utf8');
    const compiledPanelCode = fs.readFileSync(COMPILED_PANEL_PATH, 'utf8');
    const { win, doc, storage } = createStrictMockDom();

    const bridgeRequests = [];
    const bridgeFetch = async (url, init = {}) => {
      const target = String(url);
      const body = init.body ? JSON.parse(init.body) : {};
      bridgeRequests.push({
        url: target,
        headers: init.headers || {},
        body
      });
      if (target.endsWith('/get-settings')) {
        return {
          ok: true,
          status: 200,
          json: async () => ({ ok: true, panelLanguage: 'zh-CN', savedHeatView: 'daily', customPlan: null })
        };
      }
      if (target.endsWith('/token-history')) {
        const d = new Date();
        const todayStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        return { ok: true, status: 200, json: async () => ({ ok: true, data: makeSampleHistoryPayload(todayStr) }) };
      }
      return { ok: true, status: 200, json: async () => ({ ok: true }) };
    };

    win.fetch = async () => ({
      ok: true,
      status: 200,
      headers: { get: k => (String(k).toLowerCase() === 'content-type' ? 'application/json' : null) },
      json: async () => ({ userStatus: { email: 'alice@example.com', userTier: { name: 'Pro' }, cascadeModelConfigData: { clientModelConfigs: [] } } }),
      clone() { return this; }
    });

    const sandbox = {
      globalThis: null,
      window: win,
      document: doc,
      localStorage: storage,
      navigator: win.navigator,
      location: win.location,
      setTimeout,
      clearTimeout,
      setInterval,
      clearInterval,
      URL,
      MutationObserver: class { observe() {} disconnect() {} },
      ResizeObserver: class { observe() {} disconnect() {} },
      __AG_USAGE_SUITE_SKIP_AUTO_MOUNT__: true,
      console
    };
    sandbox.globalThis = sandbox;
    const context = vm.createContext(sandbox);

    vm.runInContext(bundleCode, context);
    vm.runInContext(compiledPanelCode, context);

    assert.ok(sandbox.__AGUsageCore, 'compiled core should register in vm');
    assert.ok(sandbox.__AGUsagePanelModule?.mountUsagePanel, 'compiled usage panel should export mountUsagePanel');

    const hub = telemetryModule.createTelemetryHub({
      window: win,
      document: doc,
      location: win.location,
      storage,
      core,
      autoPoll: false
    });
    hub.start();
    // Seed cachedUserStatus passively in TelemetryHub
    await win.fetch('/local/seed-status', {
      headers: { 'x-codeium-csrf-token': 'csrf-ui-01' }
    });
    await new Promise(r => setImmediate(r));

    const panel = sandbox.__AGUsagePanelModule.mountUsagePanel({
      window: win,
      document: doc,
      telemetryHub: hub,
      core,
      bridgeUrl: 'http://127.0.0.1:43111',
      bridgeToken: 'bridge-secret-123',
      fetch: bridgeFetch,
      autoSync: false
    });

    // Strict assertion: every removed context-viewer ID must be null in Shadow DOM
    for (const removedId of REMOVED_LEGACY_IDS) {
      assert.equal(panel.shadow.getElementById(removedId), null, `Legacy ID #${removedId} must not exist`);
      assert.equal(panel.el(removedId), null, `panel.el("${removedId}") must return null`);
    }

    assert.ok(panel.el('badge-tokens'), '#badge-tokens must mount');
    assert.ok(panel.el('panel-tokens'), '#panel-tokens must mount');

    panel.start();
    const d = new Date();
    const todayStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    panel.applyTokenHistoryPayload(makeSampleHistoryPayload(todayStr));

    assert.notEqual(panel.el('badge-tokens-text').textContent, 'Tokens --');
    assert.ok(panel.el('badge-tokens-text').textContent.includes('120'));

    // Open panel & toggle sources, cost views, heatmaps, color drawer without errors
    panel.el('badge-tokens').click();
    assert.equal(panel.el('panel-tokens').hidden, false);

    panel.el('src-tab-desktop').click();
    panel.el('src-tab-cli').click();
    panel.el('src-tab-all').click();

    panel.el('tok-view-cost').click();
    assert.equal(panel.el('panel-tokens').classList.contains('cost-compact-view'), true);
    assert.equal(panel.el('tokens-main-view').style.display, 'none');
    assert.equal(panel.el('cost-details-body').style.display, 'flex');
    panel.el('cost-mode-hybrid').click();
    panel.el('cost-mode-identified').click();
    panel.el('cost-scope-all').click();
    panel.el('cost-scope-period').click();
    panel.el('tok-view-tokens').click();
    assert.equal(panel.el('tokens-main-view').style.display, '');

    for (const heatView of ['weekly', 'monthly', 'yearly', 'cum', 'daily']) {
      panel.el(`heat-tab-${heatView}`).click();
    }

    panel.el('btn-token-colors-top').click();
    assert.equal(panel.el('token-color-drawer-body').hidden, false);
    panel.el('swatch-heatLvl0').click();
    assert.equal(panel.el('color-picker-popover').hidden, false);

    // Language sync: panel zh-TW -> hub zh-TW -> hub toggle to en -> panel en
    panel.el('btn-top-lang-zh-TW').click();
    assert.equal(panel.getLanguage(), 'zh-TW');
    assert.equal(hub.getLanguage(), 'zh-TW');
    assert.equal(panel.el('panel-tokens').querySelector('[data-i18n="tokens.title"]').textContent, '本機已記錄用量');

    hub.toggleShortLanguage();
    assert.equal(hub.getLanguage(), 'en');
    assert.equal(panel.getLanguage(), 'en');
    assert.equal(panel.el('panel-tokens').querySelector('[data-i18n="tokens.title"]').textContent, 'Local Recorded Usage');

    // Sync from host sends cachedUserStatus from TelemetryHub
    await panel.syncTokenHistoryFromHost(true);
    const historyReq = bridgeRequests.find(r => r.url.endsWith('/token-history'));
    assert.ok(historyReq, 'should POST /token-history');
    assert.equal(historyReq.headers['X-AG-Context-Token'], 'bridge-secret-123');
    assert.equal(historyReq.body.cachedUserStatus?.userStatus?.email, 'alice@example.com');

    // Recorded calls subscription triggers POST /record-calls? No: subscribeFinalizedCalls is triggered on new finalized calls;
    // Also verify recordModelCallsRemote works cleanly and dispose removes host & listeners
    await panel.recordModelCallsRemote([{ callId: 'call-ui-001', totalTokens: 500, status: 'final' }]);
    const recReq = bridgeRequests.find(r => r.url.endsWith('/record-calls'));
    assert.ok(recReq);
    assert.equal(recReq.body.calls[0].callId, 'call-ui-001');

    panel.dispose();
    hub.dispose();
    assert.equal(panel.isDisposed(), true);
    assert.equal(doc.getElementById('ag-usage-suite-host'), null);
  });

  it('auto-bootstraps unified-bundle.js into __AGUsageSuite (capsule + panel) and cleans up on dispose', () => {
    const bundleCode = fs.readFileSync(UNIFIED_BUNDLE_PATH, 'utf8');
    const { win, doc, storage, footer } = createStrictMockDom();

    const origFetch = async () => ({
      ok: true,
      status: 200,
      headers: { get: () => 'application/json' },
      json: async () => ({ ok: true }),
      clone() { return this; }
    });
    win.fetch = origFetch;
    win.__AG_METER_LIVE_BRIDGE__ = { url: 'http://127.0.0.1:43112', token: 'tok-auto-boot' };

    const sandbox = {
      globalThis: null,
      window: win,
      document: doc,
      localStorage: storage,
      navigator: win.navigator,
      location: win.location,
      setTimeout: () => 0,
      clearTimeout: () => {},
      setInterval: () => 0,
      clearInterval: () => {},
      URL,
      MutationObserver: class { observe() {} disconnect() {} },
      ResizeObserver: class { observe() {} disconnect() {} },
      console
    };
    sandbox.globalThis = sandbox;
    const context = vm.createContext(sandbox);
    vm.runInContext(bundleCode, context);

    assert.ok(win.__AGUsageSuite, '__AGUsageSuite must auto-mount');
    assert.ok(win.__AGUnifiedTelemetry, '__AGUnifiedTelemetry must auto-mount');
    assert.equal(win.__AGUnifiedTelemetry.getSnifferCount(), 1);
    assert.ok(doc.getElementById('ag-usage-suite-host'), 'Usage panel host must be mounted');
    assert.ok(footer.querySelector('[data-agy-context-capsule="1"]'), 'Composer capsule must be mounted');

    win.__AGUsageSuite.dispose();
    assert.equal(win.fetch, origFetch);
    assert.equal(doc.getElementById('ag-usage-suite-host'), null);
    assert.equal(footer.querySelector('[data-agy-context-capsule="1"]'), null);
  });

  it('docks cleanly inside Antigravity 2.x @container/titlebar before right buttons and shifts floating offset when titlebar is absent', () => {
    const compiledPanelCode = fs.readFileSync(COMPILED_PANEL_PATH, 'utf8');
    const { win, doc, storage } = createStrictMockDom();

    // Remove classic .part.titlebar and replace with Antigravity 2.x standalone @container/titlebar
    const classicTb = doc.querySelector('.part.titlebar');
    classicTb.remove();

    const agTitlebar = doc.createElement('div');
    agTitlebar.className = 'flex w-full items-center justify-between @container/titlebar';
    const leftGroup = doc.createElement('div');
    leftGroup.className = 'flex items-center min-w-0';
    const rightGroup = doc.createElement('div');
    rightGroup.className = 'agy-layout-vars flex items-center justify-end shrink-0';
    const btnCluster = doc.createElement('div');
    btnCluster.className = 'flex items-center gap-1';
    const moreBtn = doc.createElement('button');
    moreBtn.setAttribute('aria-label', 'More actions');
    moreBtn.getBoundingClientRect = () => ({ left: 1290, top: 6, right: 1318, bottom: 34, width: 28, height: 28 });
    const overviewBtn = doc.createElement('button');
    overviewBtn.setAttribute('aria-label', 'Toggle Overview Panel');
    overviewBtn.getBoundingClientRect = () => ({ left: 1322, top: 6, right: 1350, bottom: 34, width: 28, height: 28 });
    btnCluster.appendChild(moreBtn);
    btnCluster.appendChild(overviewBtn);
    rightGroup.appendChild(btnCluster);
    agTitlebar.appendChild(leftGroup);
    agTitlebar.appendChild(rightGroup);
    doc.body.appendChild(agTitlebar);

    const sidePanelBtn = doc.createElement('button');
    sidePanelBtn.setAttribute('aria-label', 'Toggle Side Panel');
    sidePanelBtn.getBoundingClientRect = () => ({ left: 1354, top: 6, right: 1382, bottom: 34, width: 28, height: 28 });
    doc.body.appendChild(sidePanelBtn);

    const sandbox = {
      globalThis: null,
      window: win,
      document: doc,
      localStorage: storage,
      navigator: win.navigator,
      location: win.location,
      setTimeout,
      clearTimeout,
      setInterval,
      clearInterval,
      URL,
      MutationObserver: class { observe() {} disconnect() {} },
      ResizeObserver: class { observe() {} disconnect() {} },
      __AG_USAGE_SUITE_SKIP_AUTO_MOUNT__: true,
      console
    };
    sandbox.globalThis = sandbox;
    const context = vm.createContext(sandbox);
    vm.runInContext(compiledPanelCode, context);

    const panel = sandbox.__AGUsagePanelModule.mountUsagePanel({
      window: win,
      document: doc,
      core,
      autoSync: false
    });
    panel.start();

    assert.equal(panel.host.getAttribute('data-dock'), 'flow');
    assert.equal(panel.host.parentElement, rightGroup);
    assert.equal(rightGroup.children[0], panel.host);
    assert.equal(rightGroup.children[1], btnCluster);
    assert.equal(panel.host.style.marginRight, '6px');

    // When @container/titlebar disappears, floating fallback shifts left of More actions (1400 - 1290 + 8 = 118px)
    agTitlebar.remove();
    doc.body.appendChild(moreBtn);
    doc.body.appendChild(overviewBtn);
    panel.dispose();

    const panel2 = sandbox.__AGUsagePanelModule.mountUsagePanel({
      window: win,
      document: doc,
      core,
      autoSync: false
    });
    panel2.start();
    assert.equal(panel2.host.getAttribute('data-dock'), 'floating');
    assert.equal(panel2.host.style.top, '6px');
    assert.equal(panel2.host.style.right, '118px');
    panel2.dispose();
  });

  it('removes all GitHub links/buttons and starts Token Activity heatmaps at the first active token date without leading blanks', () => {
    const compiledPanelCode = fs.readFileSync(COMPILED_PANEL_PATH, 'utf8');
    const { win, doc, storage } = createStrictMockDom();

    assert.equal(/github\.com/i.test(compiledPanelCode), false, 'compiled panel must not contain any github.com URL');
    assert.equal(/btn-github/i.test(compiledPanelCode), false, 'compiled panel must not contain any GitHub button ID');

    const sandbox = {
      globalThis: null,
      window: win,
      document: doc,
      localStorage: storage,
      navigator: win.navigator,
      location: win.location,
      setTimeout,
      clearTimeout,
      setInterval,
      clearInterval,
      URL,
      MutationObserver: class { observe() {} disconnect() {} },
      ResizeObserver: class { observe() {} disconnect() {} },
      __AG_USAGE_SUITE_SKIP_AUTO_MOUNT__: true,
      console
    };
    sandbox.globalThis = sandbox;
    const context = vm.createContext(sandbox);
    vm.runInContext(compiledPanelCode, context);

    const panel = sandbox.__AGUsagePanelModule.mountUsagePanel({
      window: win,
      document: doc,
      core,
      autoSync: false
    });
    panel.start();

    // 1. Zero GitHub button / github.com links or text anywhere in rendered Shadow DOM
    assert.equal(panel.shadow.getElementById('btn-github-repo'), null);
    assert.equal(panel.shadow.getElementById('btn-github-tokens'), null);
    assert.equal(panel.el('btn-github-repo'), null);
    assert.equal(panel.el('btn-github-tokens'), null);
    const collectNodes = (node, out = []) => {
      out.push(node);
      for (const ch of (node.children || [])) collectNodes(ch, out);
      return out;
    };
    for (const node of collectNodes(panel.shadow)) {
      if (node.tagName === 'STYLE') continue;
      for (const val of [
        node.id,
        node.textContent,
        node.getAttribute?.('href'),
        node.getAttribute?.('aria-label'),
        node.getAttribute?.('title'),
        node.getAttribute?.('data-i18n'),
        node.getAttribute?.('data-i18n-aria')
      ]) {
        assert.equal(/github\.com|btn-github/i.test(String(val || '')), false, `unexpected GitHub reference in Shadow DOM: ${val}`);
      }
    }

    // 2. Sparse recent history: first active date is 5 days ago; older zero-token record & payload.firstUseDate must be ignored
    const localYmdOffset = (deltaDays) => {
      const d = new Date();
      d.setDate(d.getDate() + deltaDays);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    };
    const mkDay = (total, input, output, cache) => ({ total, input, output, cache, steps: total > 0 ? 2 : 0 });

    const todayStr = localYmdOffset(0);
    const firstActiveStr = localYmdOffset(-5);
    const oldZeroStr = localYmdOffset(-400);
    const sparseDailyMap = {
      [oldZeroStr]: mkDay(0, 0, 0, 0),
      [firstActiveStr]: mkDay(40000, 10000, 5000, 25000),
      [todayStr]: mkDay(80000, 20000, 10000, 50000)
    };
    panel.applyTokenHistoryPayload({
      ok: true,
      firstUseDate: oldZeroStr,
      dailyMap: sparseDailyMap,
      dailyMapBySource: { all: sparseDailyMap, desktop: sparseDailyMap, cli: {} }
    });

    assert.ok(panel.el('heat-first-use').textContent.includes(firstActiveStr), 'first-use footer must show first active token date');
    assert.equal(panel.el('heat-first-use').textContent.includes(oldZeroStr), false, 'zero-token older date must not become first-use');

    // Daily view: full 364 cells / 52 columns, anchored at firstActiveStr with trailing future empty slots
    panel.el('heat-tab-daily').click();
    const dailyCells = panel.el('heatmap-grid').querySelectorAll('.heat-cell');
    const dailyCols = panel.el('heatmap-grid').querySelectorAll('.heat-day-col');
    assert.equal(dailyCells.length, 364, 'daily view must fill full 364-day grid');
    assert.equal(dailyCols.length, 52, 'daily view must fill full 52 week columns');
    assert.equal(dailyCells[0].getAttribute('data-date'), firstActiveStr);
    assert.equal(dailyCells[0].classList.contains('is-first-use'), true);
    assert.ok(Number(dailyCells[0].getAttribute('data-level')) > 0);
    assert.equal(dailyCells[5].getAttribute('data-date'), todayStr);
    assert.equal(dailyCells[5].classList.contains('is-today'), true);
    assert.equal(dailyCells[6].classList.contains('is-future'), true);
    assert.equal(dailyCells[6].getAttribute('data-level'), '0');
    assert.equal(dailyCells[363].classList.contains('is-future'), true);
    assert.equal(dailyCells[363].getAttribute('data-level'), '0');
    assert.equal(panel.el('btn-heat-prev').disabled, true, 'prev must be disabled at first active date');
    assert.equal(panel.el('btn-heat-next').disabled, true, 'next must be disabled at today');

    // Cumulative view: same full 364-day grid anchored at firstActiveStr with trailing future cells
    panel.el('heat-tab-cum').click();
    const cumCells = panel.el('heatmap-grid').querySelectorAll('.heat-cell');
    assert.equal(cumCells.length, 364);
    assert.equal(cumCells[0].getAttribute('data-date'), firstActiveStr);
    assert.equal(cumCells[5].getAttribute('data-date'), todayStr);
    assert.equal(cumCells[6].classList.contains('is-future'), true);
    assert.equal(cumCells[6].getAttribute('data-level'), '0');
    assert.equal(cumCells[363].classList.contains('is-future'), true);
    assert.equal(panel.el('btn-heat-prev').disabled, true);
    assert.equal(panel.el('btn-heat-next').disabled, true);

    // Weekly view: full 12 week cards starting at firstActiveStr with trailing future week cards
    panel.el('heat-tab-weekly').click();
    const weekCards = panel.el('heatmap-grid').querySelectorAll('.heat-month-card');
    assert.equal(weekCards.length, 12, 'weekly view must fill full 12 week cards');
    assert.equal(weekCards[0].getAttribute('data-week-start'), firstActiveStr);
    assert.equal(weekCards[11].classList.contains('is-future'), true);
    assert.equal(weekCards[11].getAttribute('data-level'), '0');
    assert.equal(panel.el('btn-heat-prev').disabled, true);
    assert.equal(panel.el('btn-heat-next').disabled, true);

    // Monthly view: full 12 month cards starting at first active month, rolling forward across year boundary
    panel.el('heat-tab-monthly').click();
    const firstYear = firstActiveStr.slice(0, 4);
    const todayYear = todayStr.slice(0, 4);
    const firstYm = firstActiveStr.slice(0, 7);
    const monthCards = panel.el('heatmap-grid').querySelectorAll('.heat-month-card');
    assert.equal(monthCards.length, 12, 'monthly view must fill full 12 month cards');
    assert.equal(monthCards[0].getAttribute('data-month'), firstYm);
    assert.equal(monthCards[11].classList.contains('is-future'), true);
    assert.equal(monthCards[11].getAttribute('data-level'), '0');
    assert.equal(panel.el('btn-heat-prev').disabled, true);
    assert.equal(panel.el('btn-heat-next').disabled, true);

    // Yearly view: full 6 year cards starting at first active year (ignoring old zero-token entry)
    panel.el('heat-tab-yearly').click();
    const yearCards = panel.el('heatmap-grid').querySelectorAll('.heat-year-card');
    assert.equal(yearCards.length, 6, 'yearly view must fill full 6 year cards');
    assert.equal(yearCards[0].getAttribute('data-year'), firstYear);
    assert.equal(yearCards[5].getAttribute('data-year'), String(Number(firstYear) + 5));
    assert.equal(yearCards[5].classList.contains('is-future'), true);
    assert.equal(yearCards[5].getAttribute('data-level'), '0');
    assert.equal(panel.el('btn-heat-prev').disabled, true);
    assert.equal(panel.el('btn-heat-next').disabled, true);

    // 3. Multi-page history (>364 days) paginates cleanly with 364 cells and disables at boundaries
    const longFirstStr = localYmdOffset(-400);
    const longDailyMap = {
      [longFirstStr]: mkDay(30000, 10000, 5000, 15000),
      [todayStr]: mkDay(60000, 15000, 10000, 35000)
    };
    panel.applyTokenHistoryPayload({
      ok: true,
      dailyMap: longDailyMap,
      dailyMapBySource: { all: longDailyMap, desktop: longDailyMap, cli: {} }
    });
    panel.el('heat-tab-daily').click();
    const page0Cells = panel.el('heatmap-grid').querySelectorAll('.heat-cell');
    assert.equal(page0Cells.length, 364);
    assert.equal(page0Cells[363].getAttribute('data-date'), todayStr);
    assert.equal(panel.el('btn-heat-prev').disabled, false);
    assert.equal(panel.el('btn-heat-next').disabled, true);

    panel.el('btn-heat-prev').click();
    const olderDailyCells = panel.el('heatmap-grid').querySelectorAll('.heat-cell');
    assert.equal(olderDailyCells.length, 364);
    assert.equal(olderDailyCells[0].getAttribute('data-date'), longFirstStr);
    assert.equal(olderDailyCells[0].classList.contains('is-first-use'), true);
    assert.equal(panel.el('btn-heat-prev').disabled, true);
    assert.equal(panel.el('btn-heat-next').disabled, false);

    panel.el('btn-heat-next').click();
    assert.equal(panel.el('btn-heat-prev').disabled, false);
    assert.equal(panel.el('btn-heat-next').disabled, true);

    // 4. Fallback to payload.firstUseDate only when dailyMap has no positive entries
    const fallbackFirstStr = localYmdOffset(-3);
    panel.applyTokenHistoryPayload({
      ok: true,
      firstUseDate: fallbackFirstStr,
      dailyMap: {},
      dailyMapBySource: { all: {}, desktop: {}, cli: {} }
    });
    assert.ok(panel.el('heat-first-use').textContent.includes(fallbackFirstStr));
    const fallbackCells = panel.el('heatmap-grid').querySelectorAll('.heat-cell');
    assert.equal(fallbackCells.length, 364);
    assert.equal(fallbackCells[0].getAttribute('data-date'), fallbackFirstStr);
    assert.equal(fallbackCells[3].getAttribute('data-date'), todayStr);
    assert.equal(fallbackCells[4].classList.contains('is-future'), true);

    panel.dispose();
  });

  it('defaults to the green (emerald) theme and heatmap preset on fresh mount while preserving preset switching', () => {
    const compiledPanelCode = fs.readFileSync(COMPILED_PANEL_PATH, 'utf8');
    assert.match(compiledPanelCode, /--ag-accent:\s*#10b981;/, 'compiled panel must define dark --ag-accent: #10b981');
    assert.match(compiledPanelCode, /--ag-token-total:\s*#34d399;/, 'compiled panel must define dark --ag-token-total: #34d399');

    const { win, doc, storage } = createStrictMockDom();
    // Simulate legacy v1 'blue' storage; v2 key migration should default to 'green'
    storage.setItem('__ag_usage_heat_preset_v1__', 'blue');

    const sandbox = {
      globalThis: null,
      window: win,
      document: doc,
      localStorage: storage,
      navigator: win.navigator,
      location: win.location,
      setTimeout,
      clearTimeout,
      setInterval,
      clearInterval,
      URL,
      MutationObserver: class { observe() {} disconnect() {} },
      ResizeObserver: class { observe() {} disconnect() {} },
      __AG_USAGE_SUITE_SKIP_AUTO_MOUNT__: true,
      console
    };
    sandbox.globalThis = sandbox;
    const context = vm.createContext(sandbox);
    vm.runInContext(compiledPanelCode, context);

    const panel = sandbox.__AGUsagePanelModule.mountUsagePanel({
      window: win,
      document: doc,
      core,
      autoSync: false
    });
    panel.start();

    const presetGroup = panel.el('heat-preset-group');
    assert.ok(presetGroup, '#heat-preset-group must exist');
    for (const presetName of ['blue', 'purple', 'green', 'yellow', 'red']) {
      assert.ok(presetGroup.querySelector(`[data-heat-preset="${presetName}"]`), `preset ${presetName} button must exist`);
    }

    const greenBtn = presetGroup.querySelector('[data-heat-preset="green"]');
    const blueBtn = presetGroup.querySelector('[data-heat-preset="blue"]');
    assert.equal(greenBtn.classList.contains('active'), true, 'green preset must be active on fresh mount');
    assert.equal(blueBtn.classList.contains('active'), false, 'blue preset must not be active on fresh mount');

    assert.equal(panel.host.getAttribute('data-theme'), 'dark');
    assert.equal(panel.host.style.getPropertyValue('--ag-heat-1'), '#064e3b');
    assert.equal(panel.host.style.getPropertyValue('--ag-heat-2'), '#047857');
    assert.equal(panel.host.style.getPropertyValue('--ag-heat-3'), '#10b981');
    assert.equal(panel.host.style.getPropertyValue('--ag-heat-4'), '#4ade80');

    // Toggle theme auto -> light and verify light green heatmap tokens
    panel.el('btn-theme-tokens').click();
    assert.equal(panel.host.getAttribute('data-theme'), 'light');
    assert.equal(panel.host.style.getPropertyValue('--ag-heat-1'), '#d1fae5');
    assert.equal(panel.host.style.getPropertyValue('--ag-heat-2'), '#6ee7b7');
    assert.equal(panel.host.style.getPropertyValue('--ag-heat-3'), '#10b981');
    assert.equal(panel.host.style.getPropertyValue('--ag-heat-4'), '#047857');

    // Selecting blue preset still switches active state and palette cleanly
    blueBtn.click();
    assert.equal(blueBtn.classList.contains('active'), true);
    assert.equal(greenBtn.classList.contains('active'), false);
    assert.equal(panel.host.style.getPropertyValue('--ag-heat-1'), '#dbeafe');
    assert.equal(panel.host.style.getPropertyValue('--ag-heat-2'), '#93c5fd');
    assert.equal(panel.host.style.getPropertyValue('--ag-heat-3'), '#3b82f6');
    assert.equal(panel.host.style.getPropertyValue('--ag-heat-4'), '#1d4ed8');

    // Toggle theme light -> dark and verify blue preset dark palette
    panel.el('btn-theme-tokens').click();
    assert.equal(panel.host.getAttribute('data-theme'), 'dark');
    assert.equal(panel.host.style.getPropertyValue('--ag-heat-1'), '#1e3a5f');
    assert.equal(panel.host.style.getPropertyValue('--ag-heat-2'), '#1d4ed8');
    assert.equal(panel.host.style.getPropertyValue('--ag-heat-3'), '#3b82f6');
    assert.equal(panel.host.style.getPropertyValue('--ag-heat-4'), '#93c5fd');

    panel.dispose();
  });
});
