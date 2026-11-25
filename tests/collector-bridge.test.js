'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const http = require('node:http');
const { describe, it, after } = require('node:test');
const assert = require('node:assert/strict');

const collector = require('../lib/usage-collector');
const bridge = require('../lib/local-bridge');
const { pingBridge } = require('../cdp-manager');

const tempDirs = [];

function makeTempDir(prefix) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), prefix));
  tempDirs.push(dir);
  return dir;
}

function sendHttpRequest({ port, method = 'POST', route = '/token-history', headers = {}, body = '' }) {
  return new Promise((resolve, reject) => {
    const hasBody = method !== 'GET' && method !== 'HEAD';
    const payload = hasBody ? (typeof body === 'string' ? body : JSON.stringify(body)) : '';
    const reqHeaders = { ...headers, Connection: 'close' };
    if (hasBody) {
      reqHeaders['Content-Type'] = 'application/json';
      reqHeaders['Content-Length'] = Buffer.byteLength(payload);
    }
    let settled = false;
    let capturedResponse = null;
    const req = http.request({
      hostname: '127.0.0.1',
      port,
      path: route,
      method,
      agent: false,
      headers: reqHeaders
    }, res => {
      capturedResponse = res;
      let raw = '';
      res.setEncoding('utf8');
      res.on('data', chunk => { raw += chunk; });
      res.on('end', () => {
        if (settled) return;
        settled = true;
        let json = null;
        try { json = JSON.parse(raw); } catch {}
        resolve({ status: res.statusCode, headers: res.headers, raw, json });
      });
    });
    req.on('error', err => {
      if (settled) return;
      if (capturedResponse) {
        settled = true;
        resolve({ status: capturedResponse.statusCode, headers: capturedResponse.headers, raw: '', json: null });
        return;
      }
      settled = true;
      reject(err);
    });
    if (hasBody && payload) req.write(payload);
    req.end();
  });
}

after(() => {
  collector.resetCollectorCaches();
  for (const dir of tempDirs) {
    try { fs.rmSync(dir, { recursive: true, force: true }); } catch {}
  }
});

describe('Usage Collector & Local Bridge', () => {
  it('records model calls idempotently and rejects synthetic call IDs cleanly', () => {
    const agDir = makeTempDir('ag-usage-ledger-');
    const today = collector.formatLocalDateKey(new Date());

    const calls = [
      {
        callId: 'resp-ledger-001',
        source: 'desktop',
        cascadeId: 'cascade-real-001',
        model: 'MODEL_PLACEHOLDER_M37',
        inputTokens: 1000,
        cacheReadTokens: 2000,
        cacheTokens: 2000,
        outputTokens: 250,
        thinkingTokens: 40,
        totalTokens: 3250,
        status: 'final',
        date: today,
        created_at: new Date().toISOString()
      },
      {
        callId: 'test_synthetic_should_skip',
        source: 'desktop',
        cascadeId: 'cascade-real-001',
        totalTokens: 9999,
        status: 'final',
        date: today
      }
    ];

    const first = collector.recordModelCalls(calls, { agDir });
    assert.equal(first.ok, true);
    assert.equal(first.changed, true);

    const repeat = collector.recordModelCalls([calls[0]], { agDir });
    assert.equal(repeat.ok, true);
    assert.equal(repeat.changed, false);

    // Progressed output tokens should update existing call
    const progressed = collector.recordModelCalls([{
      ...calls[0],
      outputTokens: 400,
      totalTokens: 3400
    }], { agDir });
    assert.equal(progressed.ok, true);
    assert.equal(progressed.changed, true);

    const ledger = collector.loadPricingLedger(agDir);
    assert.equal(ledger.calls['resp-ledger-001'].outputTokens, 400);
    assert.equal(ledger.calls['test_synthetic_should_skip'], undefined);
  });

  it('collectTokenHistoryAsync consumes passed userStatus without host RPC and scans desktop + cli logs', async () => {
    const agDir = makeTempDir('ag-usage-collect-');
    const agCliDir = makeTempDir('ag-usage-cli-');
    const today = collector.formatLocalDateKey(new Date());
    const createdIso = new Date().toISOString();

    const desktopTranscriptDir = path.join(agDir, 'brain', 'conv-desktop-01', '.system_generated', 'logs');
    fs.mkdirSync(desktopTranscriptDir, { recursive: true });
    fs.writeFileSync(path.join(desktopTranscriptDir, 'transcript.jsonl'), JSON.stringify({
      callId: 'resp-desktop-transcript-1',
      cascadeId: 'conv-desktop-01',
      created_at: createdIso,
      model: 'MODEL_PLACEHOLDER_M37',
      input_tokens: 1500,
      cache_read_tokens: 3000,
      output_tokens: 300
    }) + '\n', 'utf8');

    const cliTranscriptDir = path.join(agCliDir, 'brain', 'conv-cli-01');
    fs.mkdirSync(cliTranscriptDir, { recursive: true });
    fs.writeFileSync(path.join(cliTranscriptDir, 'transcript.jsonl'), JSON.stringify({
      callId: 'resp-cli-transcript-1',
      cascadeId: 'conv-cli-01',
      created_at: createdIso,
      model: 'MODEL_PLACEHOLDER_M37',
      input_tokens: 500,
      cache_read_tokens: 1000,
      output_tokens: 100
    }) + '\n', 'utf8');

    const passedUserStatus = {
      userStatus: {
        email: 'suite-user@example.com',
        userTier: { name: 'Pro' },
        planStatus: { planInfo: { planName: 'Google AI Pro' } },
        cascadeModelConfigData: { clientModelConfigs: [] }
      }
    };

    const payload = await collector.collectTokenHistoryAsync({
      force: true,
      agDir,
      agCliDir,
      userStatus: passedUserStatus
    });

    assert.ok(payload && typeof payload === 'object');
    assert.equal(payload.planStatus?.email, 'suite-user@example.com');
    assert.equal(payload.dailyMapBySource.desktop[today].total, 4800);
    assert.equal(payload.dailyMapBySource.cli[today].total, 1600);
    assert.equal(payload.dailyMapBySource.all[today].total, 6400);
  });

  it('persists panelLanguage, savedHeatView, and customPlan across cache resets', () => {
    const agDir = makeTempDir('ag-usage-settings-');

    const saveRes = collector.savePluginSettings({
      panelLanguage: 'zh-TW',
      savedHeatView: 'monthly',
      email: 'suite@example.com',
      customPlan: {
        planName: 'Pro',
        currency: 'CNY',
        price: 140,
        region: 'US',
        acq: 'official'
      }
    }, { agDir });

    assert.equal(saveRes.ok, true);
    assert.equal(saveRes.panelLanguage, 'zh-TW');

    collector.resetCollectorCaches();
    const loaded = collector.getPluginSettings({ agDir, email: 'suite@example.com' });
    assert.equal(loaded.ok, true);
    assert.equal(loaded.panelLanguage, 'zh-TW');
    assert.equal(loaded.savedHeatView, 'monthly');
    assert.equal(loaded.customPlan.currency, 'CNY');
    assert.equal(loaded.customPlan.price, 140);
  });

  it('enforces local-bridge Origin, X-AG-Context-Token, body limit, batch limit, and serves valid routes', async () => {
    const agDir = makeTempDir('ag-usage-bridge-');
    const origin = 'vscode-file://vscode-app';
    const token = 'bridge-auth-token-xyz';
    const { server } = bridge.createBridgeServer({ origin, token, agDir });

    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    const port = server.address().port;

    try {
      // 1. Wrong origin -> 403
      const badOrigin = await sendHttpRequest({
        port,
        route: '/get-settings',
        headers: { Origin: 'https://evil.example', 'X-AG-Context-Token': token },
        body: {}
      });
      assert.equal(badOrigin.status, 403);

      // 2. Missing / wrong token -> 403
      const badTok = await sendHttpRequest({
        port,
        route: '/get-settings',
        headers: { Origin: origin, 'X-AG-Context-Token': 'wrong' },
        body: {}
      });
      assert.equal(badTok.status, 403);

      // 3. Unknown route or GET -> 403
      const badRoute = await sendHttpRequest({
        port,
        route: '/exec-shell',
        headers: { Origin: origin, 'X-AG-Context-Token': token },
        body: {}
      });
      assert.equal(badRoute.status, 403);

      const badMethod = await sendHttpRequest({
        port,
        method: 'GET',
        route: '/token-history',
        headers: { Origin: origin, 'X-AG-Context-Token': token }
      });
      assert.equal(badMethod.status, 403);

      // 4. Payload > 1MB -> 413
      const hugePayload = JSON.stringify({ pad: 'a'.repeat(bridge.MAX_BODY_BYTES + 1024) });
      const tooLarge = await sendHttpRequest({
        port,
        route: '/save-settings',
        headers: { Origin: origin, 'X-AG-Context-Token': token },
        body: hugePayload
      });
      assert.equal(tooLarge.status, 413);

      // 5. > 500 calls -> 400
      const tooManyCalls = Array.from({ length: bridge.MAX_RECORD_CALLS + 1 }, (_, i) => ({
        callId: `c-${i}`,
        totalTokens: 10
      }));
      const batchErr = await sendHttpRequest({
        port,
        route: '/record-calls',
        headers: { Origin: origin, 'X-AG-Context-Token': token },
        body: { calls: tooManyCalls }
      });
      assert.equal(batchErr.status, 400);

      // 6. Valid save-settings -> get-settings -> record-calls -> token-history
      const validHeaders = { Origin: origin, 'X-AG-Context-Token': token };

      const saved = await sendHttpRequest({
        port,
        route: '/save-settings',
        headers: validHeaders,
        body: { panelLanguage: 'en', savedHeatView: 'yearly' }
      });
      assert.equal(saved.status, 200);
      assert.equal(saved.headers['access-control-allow-origin'], origin);
      assert.equal(saved.json.panelLanguage, 'en');

      const got = await sendHttpRequest({
        port,
        route: '/get-settings',
        headers: validHeaders,
        body: {}
      });
      assert.equal(got.status, 200);
      assert.equal(got.json.panelLanguage, 'en');
      assert.equal(got.json.savedHeatView, 'yearly');

      const today = collector.formatLocalDateKey(new Date());
      const transcriptDir = path.join(agDir, 'brain', 'bridge-conv-01', '.system_generated', 'logs');
      fs.mkdirSync(transcriptDir, { recursive: true });
      fs.writeFileSync(path.join(transcriptDir, 'transcript.jsonl'), JSON.stringify({
        callId: 'resp-bridge-call-01',
        cascadeId: 'bridge-conv-01',
        created_at: new Date().toISOString(),
        model: 'gemini-3.8-flash',
        input_tokens: 400,
        cache_read_tokens: 600,
        output_tokens: 150
      }) + '\n', 'utf8');

      const recorded = await sendHttpRequest({
        port,
        route: '/record-calls',
        headers: validHeaders,
        body: {
          calls: [{
            callId: 'resp-bridge-call-01',
            source: 'desktop',
            cascadeId: 'bridge-conv-01',
            model: 'gemini-3.8-flash',
            inputTokens: 400,
            cacheReadTokens: 600,
            cacheTokens: 600,
            outputTokens: 150,
            totalTokens: 1150,
            status: 'final',
            date: today,
            created_at: new Date().toISOString()
          }]
        }
      });
      assert.equal(recorded.status, 200);
      assert.equal(recorded.json.ok, true);

      const history = await sendHttpRequest({
        port,
        route: '/token-history',
        headers: validHeaders,
        body: {
          force: true,
          cachedUserStatus: {
            userStatus: {
              email: 'bridge@example.com',
              userTier: { name: 'Pro' },
              cascadeModelConfigData: { clientModelConfigs: [] }
            }
          }
        }
      });
      assert.equal(history.status, 200);
      assert.equal(history.json.ok, true);
      const hData = history.json.data || history.json;
      assert.equal(hData.planStatus?.email, 'bridge@example.com');
      assert.equal(hData.dailyMapBySource.desktop[today].total, 1150);
      assert.equal(hData.summary.costEstimate.pricedRequestsCount, 1);
      assert.ok(hData.summary.costEstimate.pricedCostUSD > 0);
    } finally {
      await new Promise(resolve => server.close(resolve));
    }
  });

  it('pingBridge verifies origin matching against a running bridge server and rejects stale origins', async () => {
    const agDir = makeTempDir('ag-usage-ping-');
    const currentOrigin = 'https://127.0.0.1:59062';
    const staleOrigin = 'https://127.0.0.1:41000';
    const token = 'bridge-ping-token-01';
    const { server } = bridge.createBridgeServer({ origin: currentOrigin, token, agDir });

    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    const port = server.address().port;

    try {
      const okSame = await pingBridge({ port, token, origin: currentOrigin }, currentOrigin);
      assert.equal(okSame, true);

      const failMismatchStamp = await pingBridge({ port, token, origin: staleOrigin }, currentOrigin);
      assert.equal(failMismatchStamp, false);

      const failMismatchServer = await pingBridge({ port, token }, staleOrigin);
      assert.equal(failMismatchServer, false);
    } finally {
      await new Promise(resolve => server.close(resolve));
    }
  });
});
