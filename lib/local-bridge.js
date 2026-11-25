'use strict';
const fs = require('fs');
const path = require('path');
const http = require('http');
const crypto = require('crypto');
const { connect } = require('./local-api');
const {
  collectTokenHistoryAsync,
  recordModelCalls,
  getPluginSettings,
  savePluginSettings
} = require('./usage-collector');

const MAX_BODY_BYTES = 1024 * 1024;
const MAX_RECORD_CALLS = 500;
const ALLOWED_ROUTES = new Set([
  '/token-history',
  '/record-calls',
  '/get-settings',
  '/save-settings'
]);

/**
 * Resolve runtime state directory strictly within antigravity-usage-suite/.state (unless overridden).
 */
function getSuiteStateDir(overrideDir) {
  const dir = overrideDir || process.env.AG_SUITE_STATE_DIR || path.resolve(__dirname, '..', '.state');
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

function getSessionStampPath(stateDir) {
  return path.join(getSuiteStateDir(stateDir), '.unified-session.json');
}

function timingSafeTokenMatch(received, expected) {
  if (typeof received !== 'string' || typeof expected !== 'string') return false;
  const bufA = Buffer.from(received, 'utf8');
  const bufB = Buffer.from(expected, 'utf8');
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

/**
 * Create the hardened loopback HTTP bridge exposing ONLY /token-history, /record-calls, /get-settings, /save-settings.
 */
function createBridgeServer(options = {}) {
  const targetOrigin = options.origin;
  if (!targetOrigin) throw new Error('Target origin is required');
  const secret = options.token || crypto.randomBytes(32).toString('hex');
  const agDir = options.agDir;
  const collector = options.collector || {
    collectTokenHistoryAsync,
    recordModelCalls,
    getPluginSettings,
    savePluginSettings
  };

  const server = http.createServer((req, res) => {
    const origin = req.headers.origin;
    if (origin !== targetOrigin) {
      res.writeHead(403);
      res.end();
      return;
    }

    res.setHeader('Access-Control-Allow-Origin', targetOrigin);
    res.setHeader('Access-Control-Allow-Private-Network', 'true');
    res.setHeader('Vary', 'Origin');

    if (req.method === 'OPTIONS') {
      res.setHeader('Access-Control-Allow-Methods', 'POST');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type,X-AG-Context-Token');
      res.writeHead(204);
      res.end();
      return;
    }

    const reqToken = req.headers['x-ag-context-token'];
    if (req.method !== 'POST' || !ALLOWED_ROUTES.has(req.url) || !timingSafeTokenMatch(reqToken, secret)) {
      res.writeHead(403);
      res.end();
      return;
    }

    let body = '';
    let bodyLength = 0;
    let exceeded = false;
    req.on('data', chunk => {
      bodyLength += chunk.length;
      if (bodyLength > MAX_BODY_BYTES) {
        exceeded = true;
        res.writeHead(413, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: false, error: '请求体积超出限制（最大 1MB）' }));
        req.destroy();
        return;
      }
      body += chunk;
    });

    req.on('end', async () => {
      if (exceeded) return;
      try {
        const request = JSON.parse(body || '{}');

        if (req.url === '/record-calls') {
          const calls = Array.isArray(request.calls) ? request.calls : [];
          if (calls.length > MAX_RECORD_CALLS) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ ok: false, error: `单次入账记录数超出上限（最多 ${MAX_RECORD_CALLS} 条）` }));
            return;
          }
          const resCall = collector.recordModelCalls(calls, agDir ? { agDir } : {});
          if (resCall && typeof resCall === 'object' && resCall.ok === false) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ ok: false, changed: false, error: resCall.error || '入账落盘失败' }));
            return;
          }
          const changed = (resCall && typeof resCall === 'object') ? !!resCall.changed : !!resCall;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ ok: true, changed }));
          return;
        }

        if (req.url === '/get-settings') {
          const result = collector.getPluginSettings(agDir ? { ...request, agDir } : request);
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(result));
          return;
        }

        if (req.url === '/save-settings') {
          const result = collector.savePluginSettings(request, agDir ? { agDir } : {});
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(result));
          return;
        }

        if (req.url === '/token-history') {
          const suppliedStatus = request.cachedUserStatus !== undefined ? request.cachedUserStatus : request.userStatus;
          const collectOpts = { force: request.force === true };
          if (agDir) collectOpts.agDir = agDir;
          if (suppliedStatus !== undefined) collectOpts.userStatus = suppliedStatus;
          const data = await collector.collectTokenHistoryAsync(collectOpts);
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ ok: true, data }));
          return;
        }
      } catch (e) {
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ ok: false, error: e.message }));
      }
    });
  });

  return { server, token: secret, origin: targetOrigin };
}

async function startStandaloneBridge() {
  const api = await connect();
  const stampPath = getSessionStampPath();
  const { server, token } = createBridgeServer({ origin: api.origin });

  const cleanupStamp = () => {
    try {
      if (fs.existsSync(stampPath)) {
        const cur = JSON.parse(fs.readFileSync(stampPath, 'utf8'));
        if (cur && cur.pid === process.pid) fs.unlinkSync(stampPath);
      }
    } catch {}
  };

  server.listen(0, '127.0.0.1', () => {
    const info = { port: server.address().port, token, pid: process.pid, origin: api.origin, startedAt: Date.now() };
    fs.writeFileSync(stampPath, JSON.stringify(info, null, 2));
    console.log('Antigravity Usage Suite local bridge ready on loopback port ' + info.port);
  });

  let misses = 0;
  const check = setInterval(async () => {
    try {
      const cur = await connect();
      if (cur.origin !== api.origin) throw new Error('Antigravity window origin changed');
      misses = 0;
    } catch {
      if (++misses >= 3) {
        clearInterval(check);
        cleanupStamp();
        server.close(() => process.exit(0));
      }
    }
  }, 10000);

  const shutdown = () => {
    clearInterval(check);
    cleanupStamp();
    server.close(() => process.exit(0));
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

if (require.main === module) {
  startStandaloneBridge().catch(e => {
    console.error(e.message);
    process.exitCode = 1;
  });
}

module.exports = {
  ALLOWED_ROUTES,
  MAX_BODY_BYTES,
  MAX_RECORD_CALLS,
  getSuiteStateDir,
  getSessionStampPath,
  createBridgeServer
};
