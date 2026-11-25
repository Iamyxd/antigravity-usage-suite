  // Module: Theme & Heatmap Palette Customization (Scoped to Usage Panel + Heatmaps)
  const COLOR_STORAGE_KEY = '__ag_usage_custom_colors_v1__';
  const HEAT_PRESET_KEY = '__ag_usage_heat_preset_v2__';
  const THEME_STORAGE_KEY = '__ag_usage_theme_mode_v1__';

  const HEAT_PRESETS = {
    blue: {
      low: '#1e3a5f',
      high: '#93c5fd',
      dark: ['rgba(255, 255, 255, 0.055)', '#1e3a5f', '#1d4ed8', '#3b82f6', '#93c5fd'],
      light: ['#eaecef', '#dbeafe', '#93c5fd', '#3b82f6', '#1d4ed8']
    },
    purple: {
      low: '#3b1d6a',
      high: '#c4b5fd',
      dark: ['rgba(255, 255, 255, 0.055)', '#3b1d6a', '#6d28d9', '#8b5cf6', '#c4b5fd'],
      light: ['#eaecef', '#ede9fe', '#c4b5fd', '#8b5cf6', '#5b21b6']
    },
    green: {
      low: '#064e3b',
      high: '#4ade80',
      dark: ['rgba(255, 255, 255, 0.055)', '#064e3b', '#047857', '#10b981', '#4ade80'],
      light: ['#eaecef', '#d1fae5', '#6ee7b7', '#10b981', '#047857']
    },
    yellow: {
      low: '#713f12',
      high: '#fde047',
      dark: ['rgba(255, 255, 255, 0.055)', '#713f12', '#a16207', '#eab308', '#fde047'],
      light: ['#eaecef', '#fef9c3', '#fde047', '#ca8a04', '#854d0e']
    },
    red: {
      low: '#7f1d1d',
      high: '#fca5a5',
      dark: ['rgba(255, 255, 255, 0.055)', '#7f1d1d', '#b91c1c', '#ef4444', '#fca5a5'],
      light: ['#eaecef', '#fee2e2', '#fca5a5', '#ef4444', '#b91c1c']
    }
  };

  const COLOR_SLOTS = {
    panelBg: { cssVar: '--ag-surface', defaultDark: '#121216', defaultLight: '#ffffff' },
    tokenTotal: { cssVar: '--ag-token-total', defaultDark: '#34d399', defaultLight: '#059669' },
    tokenAccent: { cssVar: '--ag-token-accent', defaultDark: '#10b981', defaultLight: '#047857' },
    heatLow: { cssVar: null },
    heatHigh: { cssVar: null },
    heatLvl0: { cssVar: '--ag-heat-0' },
    heatLvl1: { cssVar: '--ag-heat-1' },
    heatLvl2: { cssVar: '--ag-heat-2' },
    heatLvl3: { cssVar: '--ag-heat-3' },
    heatLvl4: { cssVar: '--ag-heat-4' }
  };

  const THEME_ICON_AUTO = '<svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><circle cx="8" cy="8" r="5.5"/><path d="M8 2.5a5.5 5.5 0 0 1 0 11z" fill="currentColor" stroke="none"/></svg>';
  const THEME_ICON_LIGHT = '<svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" aria-hidden="true"><circle cx="8" cy="8" r="3"/><line x1="8" y1="1.8" x2="8" y2="3.2"/><line x1="8" y1="12.8" x2="8" y2="14.2"/><line x1="1.8" y1="8" x2="3.2" y2="8"/><line x1="12.8" y1="8" x2="14.2" y2="8"/><line x1="3.6" y1="3.6" x2="4.6" y2="4.6"/><line x1="11.4" y1="11.4" x2="12.4" y2="12.4"/><line x1="12.4" y1="3.6" x2="11.4" y2="4.6"/><line x1="4.6" y1="11.4" x2="3.6" y2="12.4"/></svg>';
  const THEME_ICON_DARK = '<svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M13 9.5A5.2 5.2 0 0 1 6.5 3a5.5 5.5 0 1 0 6.5 6.5z"/></svg>';

  let themeMode = 'auto';
  let activeHeatPreset = 'green';
  let customColors = {};

  function clampNum(v, min, max) {
    return Math.max(min, Math.min(max, v));
  }

  function normalizeHex(str) {
    if (typeof str !== 'string') return '';
    let s = str.trim();
    if (!s) return '';
    if (!s.startsWith('#')) s = '#' + s;
    if (/^#[0-9a-fA-F]{3}$/.test(s)) {
      s = '#' + s[1] + s[1] + s[2] + s[2] + s[3] + s[3];
    }
    return /^#[0-9a-fA-F]{6}$/.test(s) ? s.toLowerCase() : '';
  }

  function hexToRgb(hex) {
    const n = normalizeHex(hex);
    if (!n) return null;
    const v = parseInt(n.slice(1), 16);
    return { r: (v >> 16) & 255, g: (v >> 8) & 255, b: v & 255 };
  }

  function rgbToHex(r, g, b) {
    const to2 = n => clampNum(Math.round(n), 0, 255).toString(16).padStart(2, '0');
    return `#${to2(r)}${to2(g)}${to2(b)}`;
  }

  function rgbToHsv(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
    let h = 0;
    const s = max === 0 ? 0 : d / max;
    const v = max;
    if (d !== 0) {
      if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
      else if (max === g) h = ((b - r) / d + 2) / 6;
      else h = ((r - g) / d + 4) / 6;
    }
    return { h: Math.round(h * 360), s: Math.round(s * 100), v: Math.round(v * 100) };
  }

  function hsvToRgb(h, s, v) {
    h = ((h % 360) + 360) % 360 / 60;
    s = clampNum(s, 0, 100) / 100;
    v = clampNum(v, 0, 100) / 100;
    const i = Math.floor(h), f = h - i;
    const p = v * (1 - s), q = v * (1 - f * s), tVal = v * (1 - (1 - f) * s);
    let r = 0, g = 0, b = 0;
    if (i === 0) { r = v; g = tVal; b = p; }
    else if (i === 1) { r = q; g = v; b = p; }
    else if (i === 2) { r = p; g = v; b = tVal; }
    else if (i === 3) { r = p; g = q; b = v; }
    else if (i === 4) { r = tVal; g = p; b = v; }
    else { r = v; g = p; b = q; }
    return { r: Math.round(r * 255), g: Math.round(g * 255), b: Math.round(b * 255) };
  }

  function rgbToHsl(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, s = 0;
    const l = (max + min) / 2;
    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
      else if (max === g) h = (b - r) / d + 2;
      else h = (r - g) / d + 4;
      h /= 6;
    }
    return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
  }

  function mixHex(hexA, hexB, ratio) {
    const a = hexToRgb(hexA), b = hexToRgb(hexB);
    if (!a || !b) return hexA || hexB || '#8b5cf6';
    return rgbToHex(
      a.r + (b.r - a.r) * ratio,
      a.g + (b.g - a.g) * ratio,
      a.b + (b.b - a.b) * ratio
    );
  }

  function readStorageJson(key, fallback) {
    try {
      const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(key) : null;
      return raw ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  }

  function writeStorageJson(key, val) {
    try {
      if (typeof localStorage !== 'undefined') localStorage.setItem(key, JSON.stringify(val));
    } catch {}
  }

  function loadColorStateFromStorage() {
    const saved = readStorageJson(COLOR_STORAGE_KEY, {});
    customColors = (saved && typeof saved === 'object' && !Array.isArray(saved)) ? { ...saved } : {};
    try {
      const p = typeof localStorage !== 'undefined' ? localStorage.getItem(HEAT_PRESET_KEY) : null;
      if (p && HEAT_PRESETS[p]) activeHeatPreset = p;
      const th = typeof localStorage !== 'undefined' ? localStorage.getItem(THEME_STORAGE_KEY) : null;
      if (th === 'light' || th === 'dark' || th === 'auto') themeMode = th;
    } catch {}
  }

  function detectHostTheme() {
    try {
      const html = document.documentElement;
      const body = document.body;
      const classes = `${html?.className || ''} ${body?.className || ''}`.toLowerCase();
      const htmlHasLight = Boolean(html?.classList?.contains?.('light'));
      const bodyHasLight = Boolean(body?.classList?.contains?.('light'));
      const htmlHasDark = Boolean(html?.classList?.contains?.('dark'));
      const bodyHasDark = Boolean(body?.classList?.contains?.('dark'));
      if (
        classes.includes('vscode-light') ||
        classes.includes('vs-light') ||
        classes.includes('theme-light') ||
        classes.includes('light-theme') ||
        htmlHasLight ||
        bodyHasLight
      ) return 'light';
      if (
        classes.includes('vscode-dark') ||
        classes.includes('vscode-high-contrast') ||
        classes.includes('theme-dark') ||
        classes.includes('dark-theme') ||
        htmlHasDark ||
        bodyHasDark
      ) return 'dark';
      const attr = ((html?.getAttribute('data-theme')) || (body?.getAttribute('data-theme')) || '').toLowerCase();
      if (attr.includes('light')) return 'light';
      if (attr.includes('dark')) return 'dark';
      if (typeof window !== 'undefined' && typeof window.getComputedStyle === 'function' && body) {
        const bg = window.getComputedStyle(body).backgroundColor || '';
        const nums = bg.match(/\d+(\.\d+)?/g);
        if (nums && nums.length >= 3) {
          const alpha = nums.length >= 4 ? Number(nums[3]) : 1;
          if (alpha > 0.15) {
            const lum = (0.299 * Number(nums[0]) + 0.587 * Number(nums[1]) + 0.114 * Number(nums[2])) / 255;
            return lum > 0.55 ? 'light' : 'dark';
          }
        }
      }
    } catch {}
    return 'dark';
  }

  function resolveTheme() {
    if (themeMode === 'light' || themeMode === 'dark') return themeMode;
    return detectHostTheme();
  }

  function getEffectiveSlotColor(slotKey) {
    const resolved = resolveTheme();
    const isLight = resolved === 'light';
    const preset = HEAT_PRESETS[activeHeatPreset] || HEAT_PRESETS.green;
    if (customColors[slotKey]) return customColors[slotKey];
    if (slotKey === 'heatLow') return customColors.heatLow || preset.low;
    if (slotKey === 'heatHigh') return customColors.heatHigh || preset.high;
    if (slotKey.startsWith('heatLvl')) {
      const idx = Number(slotKey.slice(7));
      if (customColors.heatLow || customColors.heatHigh) {
        const low = customColors.heatLow || preset.low;
        const high = customColors.heatHigh || preset.high;
        if (idx === 0) return isLight ? '#eaecef' : '#25252b';
        return mixHex(low, high, (idx - 1) / 3);
      }
      const arr = isLight ? preset.light : preset.dark;
      const raw = arr[idx] || preset.dark[idx];
      return raw.startsWith('#') ? raw : (isLight ? '#eaecef' : '#25252b');
    }
    const meta = COLOR_SLOTS[slotKey];
    if (!meta) return '#10b981';
    return isLight ? (meta.defaultLight || '#09090b') : (meta.defaultDark || '#d4d5dc');
  }

  function applyHeatmapPalette() {
    const resolved = resolveTheme();
    const isLight = resolved === 'light';
    const preset = HEAT_PRESETS[activeHeatPreset] || HEAT_PRESETS.green;
    const baseArr = isLight ? preset.light : preset.dark;
    const hasEndpointOverride = Boolean(customColors.heatLow || customColors.heatHigh);
    const low = customColors.heatLow || preset.low;
    const high = customColors.heatHigh || preset.high;

    for (let i = 0; i < 5; i++) {
      const slot = `heatLvl${i}`;
      let val = customColors[slot];
      if (!val) {
        if (hasEndpointOverride && i > 0) {
          val = mixHex(low, high, (i - 1) / 3);
        } else {
          val = baseArr[i];
        }
      }
      host?.style?.setProperty?.(`--ag-heat-${i}`, val);
      const leg = el(`heat-leg-${i}`);
      if (leg) leg.style.background = val;
    }

    const pg = el('heat-preset-group');
    if (pg?.querySelectorAll) {
      pg.querySelectorAll('[data-heat-preset]').forEach(btn => {
        btn.classList?.toggle?.('active', btn.getAttribute('data-heat-preset') === activeHeatPreset);
      });
    }
  }

  function syncSwatchAndResetButtons() {
    for (const key of Object.keys(COLOR_SLOTS)) {
      const hex = getEffectiveSlotColor(key);
      const sw = el(`swatch-${key}`);
      if (sw) sw.style.background = hex;
      if (key === 'panelBg') {
        const swTok = el('swatch-panelBg-tokens');
        if (swTok) swTok.style.background = hex;
      } else if (key === 'tokenTotal') {
        const swTok = el('swatch-tokenTotal-tokens');
        if (swTok) swTok.style.background = hex;
      } else if (key === 'tokenAccent') {
        const swTok = el('swatch-tokenAccent-tokens');
        if (swTok) swTok.style.background = hex;
      }
      const rb = el(`reset-${key}`);
      if (rb) rb.style.opacity = customColors[key] ? '1' : '0.55';
    }
    const rbPanelBgTok = el('reset-panelBg-tokens');
    if (rbPanelBgTok) rbPanelBgTok.style.opacity = customColors.panelBg ? '1' : '0.55';
  }

  function applyCustomColors() {
    if (!host?.style?.setProperty) return;
    for (const [key, meta] of Object.entries(COLOR_SLOTS)) {
      if (!meta.cssVar || key.startsWith('heatLvl')) continue;
      if (customColors[key]) {
        host.style.setProperty(meta.cssVar, customColors[key]);
      } else {
        host.style.removeProperty(meta.cssVar);
      }
    }
    applyHeatmapPalette();
    syncSwatchAndResetButtons();
  }

  function setCustomColor(slotKey, hexVal) {
    if (!Object.prototype.hasOwnProperty.call(COLOR_SLOTS, slotKey)) return;
    const norm = normalizeHex(hexVal);
    if (norm) {
      customColors[slotKey] = norm;
    } else {
      delete customColors[slotKey];
    }
    writeStorageJson(COLOR_STORAGE_KEY, customColors);
    applyCustomColors();
  }

  function setHeatPreset(presetName) {
    if (!HEAT_PRESETS[presetName]) return;
    activeHeatPreset = presetName;
    delete customColors.heatLow;
    delete customColors.heatHigh;
    for (let i = 0; i < 5; i++) delete customColors[`heatLvl${i}`];
    try {
      if (typeof localStorage !== 'undefined') localStorage.setItem(HEAT_PRESET_KEY, presetName);
    } catch {}
    writeStorageJson(COLOR_STORAGE_KEY, customColors);
    applyCustomColors();
  }

  function resetHeatmapLevels() {
    delete customColors.heatLow;
    delete customColors.heatHigh;
    for (let i = 0; i < 5; i++) delete customColors[`heatLvl${i}`];
    writeStorageJson(COLOR_STORAGE_KEY, customColors);
    applyCustomColors();
  }

  function resetCustomColors() {
    customColors = {};
    writeStorageJson(COLOR_STORAGE_KEY, customColors);
    applyCustomColors();
  }

  function applyTheme() {
    const resolved = resolveTheme();
    host?.setAttribute?.('data-theme', resolved);
    applyCustomColors();

    const btn = el('btn-theme-tokens');
    if (btn) {
      btn.innerHTML = themeMode === 'light'
        ? THEME_ICON_LIGHT
        : (themeMode === 'dark' ? THEME_ICON_DARK : THEME_ICON_AUTO);
      const modeLabel = resolved === 'light' ? t('theme.light') : t('theme.dark');
      const titleKey = themeMode === 'light'
        ? 'theme.lightTitle'
        : (themeMode === 'dark' ? 'theme.darkTitle' : 'theme.autoTitle');
      btn.setAttribute('title', t(titleKey, { mode: modeLabel }));
    }
  }

  function cycleTheme() {
    themeMode = themeMode === 'auto' ? 'light' : (themeMode === 'light' ? 'dark' : 'auto');
    try {
      if (typeof localStorage !== 'undefined') localStorage.setItem(THEME_STORAGE_KEY, themeMode);
    } catch {}
    applyTheme();
  }

  // Color Picker State & DOM Wiring
  let activePickerSlot = null;
  let activePickerAnchor = null;
  let cpHsv = { h: 160, s: 70, v: 90 };
  let pickerOpVersion = 0;

  function syncPickerUiFromHsv(skipInputId = '', presetRgb = null) {
    const rgb = presetRgb || hsvToRgb(cpHsv.h, cpHsv.s, cpHsv.v);
    const hex = rgbToHex(rgb.r, rgb.g, rgb.b);
    const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);

    const svArea = el('cp-sv-area');
    const svThumb = el('cp-sv-thumb');
    const hueThumb = el('cp-hue-thumb');
    const sidePreview = el('cp-side-preview');
    if (svArea) svArea.style.backgroundColor = `hsl(${cpHsv.h}, 100%, 50%)`;
    if (svThumb) {
      svThumb.style.left = `${cpHsv.s}%`;
      svThumb.style.top = `${100 - cpHsv.v}%`;
    }
    if (hueThumb) {
      hueThumb.style.left = `${(cpHsv.h / 360) * 100}%`;
    }
    if (sidePreview) {
      sidePreview.style.background = hex;
    }

    const inHex = el('cp-input-hex');
    const inRgb = el('cp-input-rgb');
    const inHsl = el('cp-input-hsl');
    if (inHex && skipInputId !== 'cp-input-hex') inHex.value = hex;
    if (inRgb && skipInputId !== 'cp-input-rgb') inRgb.value = `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
    if (inHsl && skipInputId !== 'cp-input-hsl') inHsl.value = `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`;
    return hex;
  }

  function applyPickerHex(hexStr, skipInputId = '') {
    const norm = normalizeHex(hexStr);
    if (!norm) return false;
    const rgb = hexToRgb(norm);
    if (!rgb) return false;
    cpHsv = rgbToHsv(rgb.r, rgb.g, rgb.b);
    const appliedHex = syncPickerUiFromHsv(skipInputId, rgb);
    if (activePickerSlot) {
      setCustomColor(activePickerSlot, appliedHex);
    }
    return true;
  }

  function positionColorPickerPopover() {
    const pop = el('color-picker-popover');
    if (!pop || pop.hidden) return;
    try {
      const vw = (typeof window !== 'undefined' && window.innerWidth) || 1280;
      const vh = (typeof window !== 'undefined' && window.innerHeight) || 800;
      const popW = 304;
      const popH = pop.offsetHeight > 0 ? pop.offsetHeight : 340;
      let left = Math.round((vw - popW) / 2);
      let top = 90;
      if (activePickerAnchor?.getBoundingClientRect) {
        const ar = activePickerAnchor.getBoundingClientRect();
        if (ar.width > 0 || ar.height > 0) {
          left = Math.round(ar.right - popW);
          top = Math.round(ar.bottom + 6);
          if (top + popH > vh - 12 && ar.top > popH + 12) {
            top = Math.round(ar.top - popH - 6);
          }
        }
      }
      left = Math.max(12, Math.min(vw - popW - 12, left));
      top = Math.max(42, Math.min(vh - popH - 12, top));
      pop.style.left = `${left}px`;
      pop.style.top = `${top}px`;
    } catch {}
  }

  function openColorPicker(slotKey, anchorEl = null, labelText = '') {
    if (!Object.prototype.hasOwnProperty.call(COLOR_SLOTS, slotKey)) return;
    const pop = el('color-picker-popover');
    if (!pop) return;

    const op = ++pickerOpVersion;
    activePickerSlot = slotKey;
    activePickerAnchor = anchorEl;

    const lbl = el('cp-target-name');
    if (lbl) lbl.textContent = labelText ? `· ${labelText}` : `· ${slotKey}`;
    const cpResetBtn = el('cp-reset-slot');
    if (cpResetBtn) {
      cpResetBtn.textContent = slotKey.startsWith('heat') ? t('colors.resetLevel') : t('colors.followTheme');
    }
    const startHex = getEffectiveSlotColor(slotKey);
    const rgb = hexToRgb(startHex) || { r: 101, g: 42, b: 183 };
    cpHsv = rgbToHsv(rgb.r, rgb.g, rgb.b);
    syncPickerUiFromHsv();

    pop.setAttribute?.('data-closing', 'false');
    pop.classList?.remove?.('is-closing');
    pop.classList?.add?.('is-opening');
    pop.hidden = false;
    positionColorPickerPopover();

    if (typeof requestAnimationFrame === 'function') {
      requestAnimationFrame(() => {
        if (pickerOpVersion === op) pop.classList?.remove?.('is-opening');
      });
    } else {
      pop.classList?.remove?.('is-opening');
    }
  }

  function closeColorPicker(immediate = false) {
    const pop = el('color-picker-popover');
    if (!pop || pop.hidden) {
      activePickerSlot = null;
      activePickerAnchor = null;
      return;
    }
    const op = ++pickerOpVersion;
    activePickerSlot = null;
    activePickerAnchor = null;

    if (immediate) {
      pop.setAttribute?.('data-closing', 'false');
      pop.classList?.remove?.('is-opening', 'is-closing');
      pop.hidden = true;
      return;
    }
    pop.setAttribute?.('data-closing', 'true');
    pop.classList?.add?.('is-closing');
    setTimeout(() => {
      if (pickerOpVersion === op) {
        pop.setAttribute?.('data-closing', 'false');
        pop.classList?.remove?.('is-opening', 'is-closing');
        pop.hidden = true;
      }
    }, 130);
  }

  function initColorBindings() {
    loadColorStateFromStorage();
    applyTheme();

    // Watch IDE root theme attribute/class changes
    try {
      if (typeof MutationObserver === 'function' && document.documentElement) {
        const themeObserver = new MutationObserver(() => {
          if (themeMode === 'auto') applyTheme();
        });
        themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['class', 'data-theme', 'style'] });
        if (document.body) {
          themeObserver.observe(document.body, { attributes: true, attributeFilter: ['class', 'data-theme', 'style'] });
        }
        registerCleanup(() => themeObserver.disconnect());
      }
    } catch {}

    const getHeatLvlLabel = idx => t(`colors.lvl${idx}`);

    for (const key of Object.keys(COLOR_SLOTS)) {
      el(`reset-${key}`)?.addEventListener('click', () => {
        setCustomColor(key, '');
        if (activePickerSlot === key) {
          const eff = getEffectiveSlotColor(key);
          const rgb = hexToRgb(eff) || { r: 101, g: 42, b: 183 };
          cpHsv = rgbToHsv(rgb.r, rgb.g, rgb.b);
          syncPickerUiFromHsv();
        }
      });
      const swatchBtn = el(`swatch-${key}`);
      swatchBtn?.addEventListener('click', e => {
        e?.stopPropagation?.();
        openColorPicker(key, swatchBtn, swatchBtn.getAttribute('data-color-label') || key);
      });
    }

    for (let i = 0; i < 5; i++) {
      const legBtn = el(`heat-leg-${i}`);
      const slotKey = `heatLvl${i}`;
      legBtn?.addEventListener('click', e => {
        e?.stopPropagation?.();
        toggleTokenColorsDrawer?.(true);
        const swatchBtn = el(`swatch-${slotKey}`) || legBtn;
        openColorPicker(slotKey, swatchBtn, getHeatLvlLabel(i));
      });
    }

    el('reset-heat-lvls')?.addEventListener('click', () => {
      resetHeatmapLevels();
      if (activePickerSlot?.startsWith('heat')) {
        const eff = getEffectiveSlotColor(activePickerSlot);
        const rgb = hexToRgb(eff) || { r: 101, g: 42, b: 183 };
        cpHsv = rgbToHsv(rgb.r, rgb.g, rgb.b);
        syncPickerUiFromHsv();
      }
    });

    ['swatch-panelBg-tokens', 'swatch-tokenTotal-tokens', 'swatch-tokenAccent-tokens'].forEach(id => {
      const btn = el(id);
      btn?.addEventListener('click', e => {
        e?.stopPropagation?.();
        const slot = btn.getAttribute('data-color-slot');
        if (slot) openColorPicker(slot, btn, btn.getAttribute('data-color-label') || slot);
      });
    });

    el('reset-panelBg-tokens')?.addEventListener('click', () => setCustomColor('panelBg', ''));
    el('reset-all-colors')?.addEventListener('click', () => { resetCustomColors(); closeColorPicker(); });
    el('reset-all-colors-tokens')?.addEventListener('click', () => { resetCustomColors(); closeColorPicker(); });

    const presetGroup = el('heat-preset-group');
    if (presetGroup?.querySelectorAll) {
      for (const btn of presetGroup.querySelectorAll('[data-heat-preset]')) {
        btn.addEventListener('click', () => {
          const p = btn.getAttribute('data-heat-preset');
          if (p) setHeatPreset(p);
        });
      }
    }

    el('btn-cp-close')?.addEventListener('click', () => closeColorPicker());
    el('cp-reset-slot')?.addEventListener('click', () => {
      if (!activePickerSlot) return;
      const slot = activePickerSlot;
      setCustomColor(slot, '');
      const eff = getEffectiveSlotColor(slot);
      const rgb = hexToRgb(eff) || { r: 101, g: 42, b: 183 };
      cpHsv = rgbToHsv(rgb.r, rgb.g, rgb.b);
      syncPickerUiFromHsv();
    });

    const fbEl = el('cp-feedback');
    const inHexEl = el('cp-input-hex');
    inHexEl?.addEventListener('input', () => {
      const val = inHexEl.value || '';
      if (applyPickerHex(val, 'cp-input-hex') && fbEl) {
        fbEl.textContent = t('colors.appliedHex', { hex: normalizeHex(val) });
      }
    });

    const copyText = (val, labelName) => {
      try {
        if (navigator?.clipboard?.writeText) navigator.clipboard.writeText(val);
        if (fbEl) fbEl.textContent = t('colors.copied', { label: labelName, val });
      } catch {}
    };
    el('btn-cp-copy-hex')?.addEventListener('click', () => copyText(el('cp-input-hex')?.value || '', 'HEX'));
    el('btn-cp-copy-rgb')?.addEventListener('click', () => copyText(el('cp-input-rgb')?.value || '', 'RGB'));
    el('btn-cp-copy-hsl')?.addEventListener('click', () => copyText(el('cp-input-hsl')?.value || '', 'HSL'));

    el('btn-cp-eyedropper')?.addEventListener('click', async () => {
      try {
        if (typeof window !== 'undefined' && typeof window.EyeDropper === 'function') {
          const ed = new window.EyeDropper();
          const res = await ed.open();
          if (res?.sRGBHex) {
            applyPickerHex(res.sRGBHex);
            if (fbEl) fbEl.textContent = t('colors.eyedropperPicked', { hex: res.sRGBHex });
          }
          return;
        }
      } catch {}
      if (fbEl) fbEl.textContent = t('colors.eyedropperUnsupported');
    });

    // SV & Hue pointer drag
    const svAreaEl = el('cp-sv-area');
    const hueWrapEl = el('cp-hue-wrap');
    let draggingSv = false;
    let draggingHue = false;

    const updateSvFromPointer = e => {
      if (!svAreaEl?.getBoundingClientRect) return;
      const r = svAreaEl.getBoundingClientRect();
      if (!r.width || !r.height) return;
      const s = clampNum(((e.clientX - r.left) / r.width) * 100, 0, 100);
      const v = clampNum(100 - ((e.clientY - r.top) / r.height) * 100, 0, 100);
      cpHsv.s = Math.round(s);
      cpHsv.v = Math.round(v);
      const hex = syncPickerUiFromHsv();
      if (activePickerSlot) setCustomColor(activePickerSlot, hex);
    };

    const updateHueFromPointer = e => {
      if (!hueWrapEl?.getBoundingClientRect) return;
      const r = hueWrapEl.getBoundingClientRect();
      if (!r.width) return;
      const h = clampNum(((e.clientX - r.left) / r.width) * 360, 0, 360);
      cpHsv.h = Math.round(h);
      const hex = syncPickerUiFromHsv();
      if (activePickerSlot) setCustomColor(activePickerSlot, hex);
    };

    svAreaEl?.addEventListener('mousedown', e => {
      draggingSv = true;
      updateSvFromPointer(e);
    });
    hueWrapEl?.addEventListener('mousedown', e => {
      draggingHue = true;
      updateHueFromPointer(e);
    });

    const onPointerMove = e => {
      if (draggingSv) updateSvFromPointer(e);
      else if (draggingHue) updateHueFromPointer(e);
    };
    const onPointerUp = () => {
      draggingSv = false;
      draggingHue = false;
    };
    try {
      window.addEventListener?.('mousemove', onPointerMove);
      window.addEventListener?.('mouseup', onPointerUp);
      registerCleanup(() => {
        window.removeEventListener?.('mousemove', onPointerMove);
        window.removeEventListener?.('mouseup', onPointerUp);
      });
    } catch {}
  }
