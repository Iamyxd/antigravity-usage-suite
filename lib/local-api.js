'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const http = require('http');
const https = require('https');

function request(url, body, token) {
  return new Promise((resolve, reject) => {
    const req = (url.startsWith('https:') ? https : http).request(
      url,
      {
        rejectUnauthorized: false,
        method: body ? 'POST' : 'GET',
        headers: body
          ? { 'Content-Type': 'application/json', 'Connect-Protocol-Version': '1', 'x-codeium-csrf-token': token }
          : {}
      },
      response => {
        let text = '';
        response.on('data', chunk => { text += chunk; });
        response.on('end', () => (response.statusCode === 200
          ? resolve(text)
          : reject(new Error(`HTTP ${response.statusCode}: ${text.slice(0, 200)}`))));
      }
    );
    req.setTimeout(20000, () => req.destroy(new Error('Local API timeout')));
    req.on('error', reject);
    req.end(body ? JSON.stringify(body) : undefined);
  });
}

function getDevToolsPortFile() {
  const base = process.env.APPDATA || (process.platform === 'darwin'
    ? path.join(os.homedir(), 'Library', 'Application Support')
    : (process.env.XDG_CONFIG_HOME || path.join(os.homedir(), '.config')));
  return path.join(base, 'Antigravity', 'DevToolsActivePort');
}

/**
 * Connect to the running Antigravity page origin and extract CSRF token for fallback RPC calls.
 */
async function connect() {
  const portFile = getDevToolsPortFile();
  const port = Number(fs.readFileSync(portFile, 'utf8').split(/\r?\n/)[0]);
  if (!Number.isFinite(port) || port <= 0) throw new Error('Invalid Antigravity DevToolsActivePort');
  const pages = JSON.parse(await request(`http://127.0.0.1:${port}/json/list`));
  const page = pages.find(item => item.type === 'page' && /^https:\/\/127\.0\.0\.1:\d+\//.test(item.url));
  if (!page) throw new Error('Antigravity window not found');
  const origin = new URL(page.url).origin;
  const html = await request(origin + '/');
  const match = html.match(/window.__APP_CONFIG__ = (.*?);/);
  if (!match) throw new Error('Unable to read __APP_CONFIG__ CSRF token');
  const token = JSON.parse(match[1]).csrfToken;
  return {
    origin,
    page,
    call: async (method, body) => JSON.parse(await request(`${origin}/exa.language_server_pb.LanguageServerService/${method}`, body, token))
  };
}

module.exports = { connect };
