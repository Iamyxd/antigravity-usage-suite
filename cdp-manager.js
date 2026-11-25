#!/usr/bin/env node
'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const http = require('http');
const { spawn } = require('child_process');

const { getSessionStampPath, getSuiteStateDir } = require('./lib/local-bridge');
const { buildSuiteBundle } = require('./scripts/build-bundle');

const ROOT_DIR = __dirname;
const PKG = JSON.parse(fs.readFileSync(path.join(ROOT_DIR, 'package.json'), 'utf8'));
const DIST_BUNDLE_PATH = path.join(ROOT_DIR, 'dist', 'unified-bundle.js');
const DEFAULT_WEB_OUT_DIR = path.join(ROOT_DIR, 'dist', 'web-extension');

function resolveRealUserHome() {
  return process.env.HOME || os.homedir();
}

function getAppDataRoot(realHome = resolveRealUserHome()) {
  if (process.env.APPDATA) return process.env.APPDATA;
  if (process.platform === 'darwin') return path.join(realHome, 'Library', 'Application Support');
  return path.join(realHome, '.config');
}

function getDevToolsPort(realHome = resolveRealUserHome()) {
  try {
    const portFile = path.join(getAppDataRoot(realHome), 'Antigravity', 'DevToolsActivePort');
    if (!fs.existsSync(portFile)) return null;
    const raw = fs.readFileSync(portFile, 'utf8').split(/\r?\n/)[0].trim();
    const port = Number(raw);
    return Number.isFinite(port) && port > 0 && port < 65536 ? port : null;
  } catch {
    return null;
  }
}

function queryCdpPages(port) {
  return new Promise((resolve, reject) => {
    const req = http.get(`http://127.0.0.1:${port}/json/list`, res => {
      let body = '';
      res.setEncoding('utf8');
      res.on('data', chunk => { body += chunk; });
      res.on('end', () => {
        try {
          const list = JSON.parse(body);
          const pages = Array.isArray(list)
            ? list.filter(p => p && p.type === 'page' && /^https:\/\/127\.0\.0\.1:\d+\//.test(p.url || ''))
            : [];
          resolve(pages);
        } catch (e) {
          reject(e);
        }
      });
    });
    req.setTimeout(3000, () => req.destroy(new Error('CDP /json/list timeout')));
    req.on('error', reject);
  });
}

async function cdpEval(wsUrl, expression) {
  if (typeof globalThis.WebSocket !== 'function') {
    throw new Error('WebSocket is unavailable; run via Node >= 22 or Antigravity ELECTRON_RUN_AS_NODE=1');
  }
  const ws = new globalThis.WebSocket(wsUrl);
  await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('CDP WebSocket connect timeout')), 3000);
    ws.addEventListener('open', () => { clearTimeout(timer); resolve(); }, { once: true });
    ws.addEventListener('error', () => { clearTimeout(timer); reject(new Error('CDP WebSocket connect failed')); }, { once: true });
  });
  try {
    return await new Promise((resolve, reject) => {
      const id = 1;
      const timer = setTimeout(() => reject(new Error('CDP Runtime.evaluate timeout')), 8000);
      const onMessage = ev => {
        try {
          const msg = JSON.parse(ev.data);
          if (msg.id === id) {
            clearTimeout(timer);
            ws.removeEventListener('message', onMessage);
            if (msg.error || msg.result?.exceptionDetails) {
              reject(new Error(JSON.stringify(msg.error || msg.result.exceptionDetails)));
            } else {
              resolve(msg.result?.result?.value);
            }
          }
        } catch (err) {
          clearTimeout(timer);
          ws.removeEventListener('message', onMessage);
          reject(err);
        }
      };
      ws.addEventListener('message', onMessage);
      ws.send(JSON.stringify({
        id,
        method: 'Runtime.evaluate',
        params: { expression, returnByValue: true, awaitPromise: true }
      }));
    });
  } finally {
    try { ws.close(); } catch {}
  }
}

/**
 * Minimal read-only ASAR single-file extractor used strictly for read-only verification.
 */
function readAsarFileEntryReadOnly(archivePath, relPath) {
  const fd = fs.openSync(archivePath, 'r');
  try {
    const headerBuf = Buffer.alloc(16);
    if (fs.readSync(fd, headerBuf, 0, 16, 0) !== 16) throw new Error('Invalid ASAR header');
    const jsonSize = headerBuf.readUInt32LE(12);
    const jsonBuf = Buffer.alloc(jsonSize);
    fs.readSync(fd, jsonBuf, 0, jsonSize, 16);
    const header = JSON.parse(jsonBuf.toString('utf8'));
    const dataOffset = 8 + headerBuf.readUInt32LE(4);

    const parts = String(relPath).replace(/^\/+/, '').split('/').filter(Boolean);
    let node = header;
    for (const part of parts) {
      if (!node?.files?.[part]) return null;
      node = node.files[part];
    }
    if (!node || typeof node.size !== 'number' || node.offset === undefined) return null;
    const offset = dataOffset + Number(node.offset);
    const out = Buffer.alloc(node.size);
    fs.readSync(fd, out, 0, node.size, offset);
    return out;
  } finally {
    fs.closeSync(fd);
  }
}

function findAsarPathReadOnly() {
  const candidates = [];
  if (process.env.AG_APP_BUNDLE) {
    candidates.push(path.join(process.env.AG_APP_BUNDLE, 'Contents', 'Resources', 'app.asar'));
  }
  if (process.execPath && process.execPath.includes('Antigravity.app')) {
    candidates.push(path.resolve(process.execPath, '..', '..', 'Resources', 'app.asar'));
  }
  candidates.push(
    '/Applications/Antigravity.app/Contents/Resources/app.asar',
    path.join(resolveRealUserHome(), 'Applications', 'Antigravity.app', 'Contents', 'Resources', 'app.asar')
  );
  try {
    const stubRef = '/Applications/Antigravity.app/Contents/Resources/real_app_path.txt';
    if (fs.existsSync(stubRef)) {
      const realApp = fs.readFileSync(stubRef, 'utf8').trim();
      candidates.unshift(path.join(realApp, 'Contents', 'Resources', 'app.asar'));
    }
  } catch {}
  for (const p of candidates) {
    if (p && fs.existsSync(p)) return p;
  }
  return '';
}

function checkAsarPatchedReadOnly() {
  const asarPath = findAsarPathReadOnly();
  if (!asarPath) return { asarPath: '', asarPatched: false, checked: false };
  try {
    const utilsBuf = readAsarFileEntryReadOnly(asarPath, 'dist/utils.js');
    const raw = utilsBuf ? utilsBuf.toString('utf8') : '';
    const patched = Boolean(
      raw.includes('installContextMeter') ||
      raw.includes('__AGUsageSuite') ||
      raw.includes('__AGY_CTX_CAPSULE__')
    );
    return { asarPath, asarPatched: patched, checked: true };
  } catch {
    return { asarPath, asarPatched: false, checked: false };
  }
}

function isPidAlive(pid) {
  if (!Number.isInteger(pid) || pid <= 0) return false;
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

function readStamp() {
  try {
    const p = getSessionStampPath();
    if (!fs.existsSync(p)) return null;
    const data = JSON.parse(fs.readFileSync(p, 'utf8'));
    return data && data.port && data.token ? data : null;
  } catch {
    return null;
  }
}

async function pingBridge(stamp, expectedOrigin = '') {
  if (!stamp || !stamp.port || !stamp.token) return false;
  if (expectedOrigin && stamp.origin && stamp.origin !== expectedOrigin) return false;
  try {
    return await new Promise(resolve => {
      const body = '{}';
      const req = http.request({
        hostname: '127.0.0.1',
        port: stamp.port,
        path: '/get-settings',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(body),
          'Origin': expectedOrigin || stamp.origin || 'https://127.0.0.1',
          'X-AG-Context-Token': stamp.token
        }
      }, res => {
        res.resume();
        resolve(res.statusCode === 200);
      });
      req.setTimeout(1500, () => { req.destroy(); resolve(false); });
      req.on('error', () => resolve(false));
      req.write(body);
      req.end();
    });
  } catch {
    return false;
  }
}

function stopBridgeProcess() {
  const stampPath = getSessionStampPath();
  let stopped = false;
  try {
    if (fs.existsSync(stampPath)) {
      const info = JSON.parse(fs.readFileSync(stampPath, 'utf8'));
      if (info && Number.isInteger(info.pid) && isPidAlive(info.pid)) {
        try {
          process.kill(info.pid, 'SIGTERM');
          stopped = true;
        } catch {}
      }
      fs.unlinkSync(stampPath);
    }
  } catch {}
  return stopped;
}

async function ensureLiveBridge(expectedOrigin = '') {
  const existing = readStamp();
  if (
    existing &&
    (!expectedOrigin || existing.origin === expectedOrigin) &&
    isPidAlive(existing.pid) &&
    await pingBridge(existing, expectedOrigin)
  ) {
    return existing;
  }

  stopBridgeProcess();
  fs.mkdirSync(getSuiteStateDir(), { recursive: true });

  const child = spawn(process.execPath, [path.join(ROOT_DIR, 'lib', 'local-bridge.js')], {
    cwd: ROOT_DIR,
    detached: true,
    stdio: 'ignore',
    env: { ...process.env, ELECTRON_RUN_AS_NODE: '1' }
  });
  child.unref();

  const deadline = Date.now() + 5000;
  while (Date.now() < deadline) {
    await new Promise(r => setTimeout(r, 120));
    const st = readStamp();
    if (
      st &&
      (!expectedOrigin || st.origin === expectedOrigin) &&
      isPidAlive(st.pid) &&
      await pingBridge(st, expectedOrigin)
    ) {
      return st;
    }
  }
  throw new Error('Local bridge did not start in time (is Antigravity running with DevToolsActivePort?)');
}

function buildWebExtension(outDir = DEFAULT_WEB_OUT_DIR) {
  if (!fs.existsSync(DIST_BUNDLE_PATH)) {
    buildSuiteBundle();
  }
  const resolvedOut = path.resolve(outDir);
  if (!resolvedOut.startsWith(ROOT_DIR)) {
    throw new Error(`Refusing to write web extension outside suite directory: ${resolvedOut}`);
  }
  fs.mkdirSync(resolvedOut, { recursive: true });

  const bundleRaw = fs.readFileSync(DIST_BUNDLE_PATH, 'utf8');
  const bundleOut = path.join(resolvedOut, 'unified-bundle.js');
  fs.writeFileSync(bundleOut, bundleRaw, 'utf8');

  const manifest = {
    manifest_version: 3,
    name: 'Antigravity Usage Suite',
    version: PKG.version,
    description: PKG.description,
    content_scripts: [
      {
        matches: ['https://127.0.0.1/*', 'http://127.0.0.1/*', 'https://localhost/*', 'https://antigravity.google/*'],
        js: ['unified-bundle.js'],
        run_at: 'document_idle'
      }
    ]
  };
  const manifestOut = path.join(resolvedOut, 'manifest.json');
  fs.writeFileSync(manifestOut, JSON.stringify(manifest, null, 2) + '\n', 'utf8');

  const userScriptHeader = [
    '// ==UserScript==',
    `// @name         Antigravity Usage Suite`,
    `// @namespace    https://github.com/Iamyxd/antigravity-usage-suite`,
    `// @version      ${PKG.version}`,
    `// @description  Unified context ring capsule, 5h/weekly quota HUD, and local recorded token usage panel`,
    `// @match        https://127.0.0.1/*`,
    `// @match        http://127.0.0.1/*`,
    `// @match        https://localhost/*`,
    `// @match        https://antigravity.google/*`,
    `// @grant        none`,
    '// ==/UserScript==',
    ''
  ].join('\n');
  const userScriptOut = path.join(resolvedOut, 'antigravity-usage-suite.user.js');
  fs.writeFileSync(userScriptOut, userScriptHeader + bundleRaw, 'utf8');

  return { outDir: resolvedOut, manifestOut, bundleOut, userScriptOut };
}

function getDisposeExpression() {
  return `(() => {
    try { window.__AGUsageSuite?.dispose?.(); } catch {}
    try { window.__AGContextMeter?.dispose?.(); } catch {}
    try {
      document.querySelectorAll('[data-agy-capsule-strip="1"], [data-agy-context-capsule="1"], [data-agy-quota-capsule="1"], #__agy_ctx_capsule_tooltip__, #__agy_quota_hud_tooltip__').forEach(el => el.remove());
      delete window.__AGY_CTX_CAPSULE_ACTIVE__;
      delete window.__AGY_CTX_CAPSULE_VERSION__;
    } catch {}
    return true;
  })()`;
}

async function cmdLive() {
  const built = buildSuiteBundle();
  const web = buildWebExtension();
  const bundleSrc = fs.readFileSync(built.bundlePath, 'utf8');

  const port = getDevToolsPort();
  if (!port) {
    console.log(`⚠️ DevToolsActivePort not found; built bundle (${built.size}B) and web extension only.`);
    console.log(`   Web extension: ${web.outDir}`);
    return { ok: true, injectedCount: 0, web };
  }

  const pages = await queryCdpPages(port);
  if (!pages.length) {
    console.log(`⚠️ No Antigravity page targets found on CDP port ${port}; built web extension only.`);
    return { ok: true, injectedCount: 0, web };
  }

  const expectedOrigin = new URL(pages[0].url).origin;
  const bridge = await ensureLiveBridge(expectedOrigin);
  const bridgeSeed = `window.__AG_METER_LIVE_BRIDGE__ = ${JSON.stringify({
    url: `http://127.0.0.1:${bridge.port}`,
    token: bridge.token
  })};`;

  let injectedCount = 0;
  const errors = [];
  for (const page of pages) {
    try {
      await cdpEval(page.webSocketDebuggerUrl, getDisposeExpression());
      await cdpEval(page.webSocketDebuggerUrl, `${bridgeSeed}\n${bundleSrc}`);
      const verify = await cdpEval(page.webSocketDebuggerUrl, `(() => {
        const host = document.getElementById('ag-usage-suite-host');
        const sr = host?.shadowRoot;
        return {
          active: Boolean(window.__AGUsageSuite),
          snifferCount: window.__AGUnifiedTelemetry?.getSnifferCount?.() || 0,
          hasBadgeTokens: Boolean(sr?.getElementById('badge-tokens')),
          hasPanelTokens: Boolean(sr?.getElementById('panel-tokens')),
          removedAbsent: !sr?.getElementById('panel') && !sr?.getElementById('badge') && !sr?.getElementById('update-popover')
        };
      })()`);
      if (verify?.active && verify?.hasBadgeTokens) injectedCount++;
      else errors.push(`Injection unverified on ${page.url}`);
    } catch (e) {
      errors.push(e?.message || String(e));
    }
  }

  const asar = checkAsarPatchedReadOnly();
  console.log(`✅ Antigravity Usage Suite v${PKG.version} live on ${injectedCount}/${pages.length} window(s)`);
  console.log(`   Bridge: 127.0.0.1:${bridge.port} (PID ${bridge.pid})`);
  console.log(`   Web extension: ${web.outDir}`);
  console.log(`   ASAR read-only check: asarPatched=${asar.asarPatched}`);
  if (errors.length) console.log(`   Warnings: ${errors.join('; ')}`);
  return { ok: injectedCount > 0, injectedCount, totalTargets: pages.length, bridge, web, asar, errors };
}

async function cmdStatus() {
  const stamp = readStamp();
  const port = getDevToolsPort();
  const asar = checkAsarPatchedReadOnly();
  const targets = [];
  let pages = [];

  if (port) {
    try {
      pages = await queryCdpPages(port);
    } catch {}
  }

  const expectedOrigin = pages.length > 0 ? new URL(pages[0].url).origin : '';
  const bridgeAlive = Boolean(
    stamp &&
    (!expectedOrigin || stamp.origin === expectedOrigin) &&
    isPidAlive(stamp.pid) &&
    await pingBridge(stamp, expectedOrigin)
  );

  for (const page of pages) {
    try {
      const info = await cdpEval(page.webSocketDebuggerUrl, `(() => {
        const sr = document.getElementById('ag-usage-suite-host')?.shadowRoot;
        return {
          active: Boolean(window.__AGUsageSuite),
          version: window.__AGUsageSuite?.version || null,
          snifferCount: window.__AGUnifiedTelemetry?.getSnifferCount?.() || 0,
          capsuleCount: document.querySelectorAll('[data-agy-context-capsule="1"]').length,
          hasBadgeTokens: Boolean(sr?.getElementById('badge-tokens')),
          hasPanelTokens: Boolean(sr?.getElementById('panel-tokens')),
          hasRemovedIds: Boolean(sr?.getElementById('panel') || sr?.getElementById('badge') || sr?.getElementById('update-popover')),
          lang: window.__AGUnifiedTelemetry?.getLanguage?.() || null
        };
      })()`);
      targets.push({ url: page.url, ...info });
    } catch (e) {
      targets.push({ url: page.url, error: e?.message || String(e) });
    }
  }

  const summary = {
    version: PKG.version,
    bridgeRunning: bridgeAlive,
    bridgeOrigin: stamp?.origin || null,
    bridgePort: stamp?.port || null,
    bridgePid: stamp?.pid || null,
    cdpPort: port,
    targets,
    webExtensionReady: fs.existsSync(path.join(DEFAULT_WEB_OUT_DIR, 'manifest.json')),
    asar
  };
  console.log(JSON.stringify(summary, null, 2));
  return summary;
}

async function cmdUninstall(args = []) {
  const port = getDevToolsPort();
  let disposedTargets = 0;
  if (port) {
    try {
      const pages = await queryCdpPages(port);
      for (const page of pages) {
        try {
          await cdpEval(page.webSocketDebuggerUrl, getDisposeExpression());
          await cdpEval(page.webSocketDebuggerUrl, `try { delete window.__AG_METER_LIVE_BRIDGE__; } catch {} true;`);
          disposedTargets++;
        } catch {}
      }
    } catch {}
  }
  const stoppedBridge = stopBridgeProcess();
  if (args.includes('--clean') && fs.existsSync(DEFAULT_WEB_OUT_DIR)) {
    fs.rmSync(DEFAULT_WEB_OUT_DIR, { recursive: true, force: true });
  }
  console.log(`✅ Unloaded Antigravity Usage Suite (disposed=${disposedTargets} target(s), bridgeStopped=${stoppedBridge})`);
  return { ok: true, disposedTargets, stoppedBridge };
}

function parseCommand(argv) {
  const args = argv.slice(2);
  if (args.includes('--help') || args.includes('-h')) return { cmd: 'help', args };
  if (args.includes('--live') || args[0] === 'live') return { cmd: 'live', args };
  if (args.includes('--status') || args.includes('--check') || args[0] === 'status' || args[0] === 'check') return { cmd: 'status', args };
  if (args.includes('--uninstall') || args[0] === 'uninstall') return { cmd: 'uninstall', args };
  if (args.includes('--build-web') || args.includes('--web-only') || args[0] === 'build-web') return { cmd: 'build-web', args };
  return { cmd: 'status', args };
}

async function main() {
  const { cmd, args } = parseCommand(process.argv);
  if (cmd === 'help') {
    console.log('Antigravity Usage Suite CDP Manager');
    console.log('Usage: node cdp-manager.js <live | status | uninstall [--clean] | build-web>');
    return;
  }
  if (cmd === 'live') return cmdLive();
  if (cmd === 'status') return cmdStatus();
  if (cmd === 'uninstall') return cmdUninstall(args);
  if (cmd === 'build-web') {
    buildSuiteBundle();
    const res = buildWebExtension();
    console.log(`✅ Built web extension at ${res.outDir}`);
    return res;
  }
}

if (require.main === module) {
  main().catch(e => {
    console.error(e?.message || String(e));
    process.exitCode = 1;
  });
}

module.exports = {
  getDevToolsPort,
  queryCdpPages,
  cdpEval,
  pingBridge,
  ensureLiveBridge,
  checkAsarPatchedReadOnly,
  buildWebExtension,
  cmdLive,
  cmdStatus,
  cmdUninstall
};
