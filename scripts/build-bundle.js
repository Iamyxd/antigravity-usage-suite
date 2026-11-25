#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..');
const PKG = JSON.parse(fs.readFileSync(path.join(ROOT_DIR, 'package.json'), 'utf8'));
const DIST_DIR = path.join(ROOT_DIR, 'dist');

function escapeTemplateLiteral(raw) {
  return String(raw)
    .replace(/\\/g, '\\\\')
    .replace(/`/g, '\\`')
    .replace(/\$\{/g, '\\${');
}

function buildUsagePanelSource() {
  const tpl = fs.readFileSync(path.join(ROOT_DIR, 'src/renderer/usage-template.html'), 'utf8');
  const css = fs.readFileSync(path.join(ROOT_DIR, 'src/renderer/usage-styles.css'), 'utf8');
  const i18nJs = fs.readFileSync(path.join(ROOT_DIR, 'src/renderer/usage-i18n.js'), 'utf8');
  const colorsJs = fs.readFileSync(path.join(ROOT_DIR, 'src/renderer/usage-colors.js'), 'utf8');
  const heatmapJs = fs.readFileSync(path.join(ROOT_DIR, 'src/renderer/usage-heatmap.js'), 'utf8');
  const dropdownJs = fs.readFileSync(path.join(ROOT_DIR, 'src/renderer/usage-dropdown.js'), 'utf8');
  let panelSrc = fs.readFileSync(path.join(ROOT_DIR, 'src/renderer/usage-panel-ui.js'), 'utf8');

  panelSrc = panelSrc
    .replace('/* @INSERT_USAGE_TEMPLATE */', () => escapeTemplateLiteral(tpl))
    .replace('/* @INSERT_USAGE_STYLES */', () => escapeTemplateLiteral(css))
    .replace('/* @INSERT_USAGE_I18N */', () => i18nJs)
    .replace('/* @INSERT_USAGE_COLORS */', () => colorsJs)
    .replace('/* @INSERT_USAGE_HEATMAP */', () => heatmapJs)
    .replace('/* @INSERT_USAGE_DROPDOWN */', () => dropdownJs);

  return panelSrc;
}

function buildSuiteBundle() {
  fs.mkdirSync(DIST_DIR, { recursive: true });

  const usageCoreSrc = fs.readFileSync(path.join(ROOT_DIR, 'lib/usage-core.js'), 'utf8');
  const telemetryHubSrc = fs.readFileSync(path.join(ROOT_DIR, 'src/renderer/telemetry-hub.js'), 'utf8');
  const capsuleUiSrc = fs.readFileSync(path.join(ROOT_DIR, 'src/renderer/capsule-ui.js'), 'utf8');
  const compiledPanelSrc = buildUsagePanelSource();

  const compiledPanelPath = path.join(DIST_DIR, 'usage-panel-ui.compiled.js');
  fs.writeFileSync(compiledPanelPath, compiledPanelSrc, 'utf8');

  const bootstrap = `
;(function (root) {
  'use strict';
  if (root.__AG_USAGE_SUITE_SKIP_AUTO_MOUNT__) return;
  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  try { window.__AGUsageSuite?.dispose?.(); } catch {}
  try { window.__AGContextMeter?.dispose?.(); } catch {}
  try {
    document.querySelectorAll('[data-agy-context-capsule="1"]').forEach(function (n) { n.remove(); });
  } catch {}

  var telMod = root.__AGUnifiedTelemetryModule;
  var capMod = root.__AGPulseCapsuleModule;
  var panelMod = root.__AGUsagePanelModule;
  var coreMod = root.__AGUsageCore || root.__AGContextMeterCore || null;
  if (!telMod || !capMod || !panelMod) return;

  var telemetryHub = telMod.createTelemetryHub({ window: window, document: document, core: coreMod });
  window.__AGUnifiedTelemetry = telemetryHub;

  var capsuleController = capMod.createCapsuleController({
    hub: telemetryHub,
    window: window,
    document: document,
    telemetryModule: telMod
  });

  var usagePanelController = panelMod.mountUsagePanel({
    window: window,
    document: document,
    telemetryHub: telemetryHub,
    core: coreMod
  });

  telemetryHub.start();
  capsuleController.start();
  usagePanelController.start();

  window.__AGUsageSuite = {
    version: ${JSON.stringify(PKG.version)},
    telemetryHub: telemetryHub,
    capsuleController: capsuleController,
    usagePanelController: usagePanelController,
    dispose: function () {
      try { usagePanelController.dispose(); } catch {}
      try { capsuleController.dispose(); } catch {}
      try { telemetryHub.dispose(); } catch {}
      try {
        if (window.__AGUnifiedTelemetry === telemetryHub) delete window.__AGUnifiedTelemetry;
        delete window.__AGUsageSuite;
      } catch {}
    }
  };
})(globalThis);
`;

  const unifiedBundle = [
    `// Antigravity Usage Suite v${PKG.version} (Compiled Renderer Bundle)`,
    '// Pure-memory CDP / WebExtension suite combining Pulse Context Capsule & Local Usage Panel.',
    usageCoreSrc,
    telemetryHubSrc,
    capsuleUiSrc,
    compiledPanelSrc,
    bootstrap
  ].join('\n\n');

  const bundlePath = path.join(DIST_DIR, 'unified-bundle.js');
  fs.writeFileSync(bundlePath, unifiedBundle, 'utf8');
  return { compiledPanelPath, bundlePath, size: Buffer.byteLength(unifiedBundle, 'utf8') };
}

if (require.main === module) {
  const res = buildSuiteBundle();
  console.log(`Built ${path.relative(ROOT_DIR, res.bundlePath)} (${res.size} bytes)`);
}

module.exports = { buildUsagePanelSource, buildSuiteBundle };
