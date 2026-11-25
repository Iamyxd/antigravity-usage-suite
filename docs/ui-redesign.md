# Antigravity Usage Suite — Native UI Redesign Specification

> **Status**: Ready for implementation  
> **Scope**: Two renderer surfaces inside `antigravity-usage-suite`  
> - **Part A (`@impl-capsule`)**: Bottom context capsule & hover tooltip (`src/renderer/capsule-ui.js`)  
> - **Part B (`@impl-panel`)**: Top-right titlebar badge & Shadow-DOM usage panel (`src/renderer/usage-template.html`, `usage-styles.css`, `usage-panel-ui.js`, `usage-heatmap.js`, `usage-colors.js`, `usage-i18n.js`, `usage-dropdown.js`)

---

## 1. Visual Audit & Design Goals

Auditing the live Antigravity 2.x workbench (`theme-standalone`) reveals the host's native design language:

| Host Token / Property | Live Antigravity Value (Dark) | Equivalent Native Light |
|---|---|---|
| Canvas `--background` | `#070708` | `#FFFFFF` |
| Card `--card` | `#131317` | `#F8F8FA` |
| Elevated surface | `#1D1D23` | `#FFFFFF` |
| Primary accent `--primary` | `#2F71E3` | `#2563EB` |
| Secondary fill `--secondary` | `rgba(255, 255, 255, 0.075)` | `rgba(15, 23, 42, 0.06)` |
| Muted fill `--muted` | `rgba(255, 255, 255, 0.042)` | `rgba(15, 23, 42, 0.042)` |
| Hairline `--border` | `rgba(255, 255, 255, 0.06–0.08)` | `rgba(15, 23, 42, 0.09)` |
| Secondary text `--secondary-foreground` | `#BCBDC6` | `#3F3F46` |
| Muted text `--muted-foreground` | `#87888F` | `#636672` |
| Font stack `--font-sans` | `"Google Sans Flex", "Google Sans", system-ui, -apple-system, ...` | Same |
| Titlebar & footer native buttons | `28px` height, `rounded-full`, transparent rest, `12px` text | Same |

### Key Problems Fixed by This Redesign
1. **Foreign color & typography in panel**: Old panel used `#1e2127` VS Code grey, loud `#7c3aed` purple borders/links, `-apple-system` instead of `var(--font-sans)`, and glossy bitmap emojis (`⚡`, `🎨`, `💰`, `💎`, `🖊`) in chrome.
2. **Oversized titlebar badge**: `⚡ Tokens 1164.81M · Today 4.06M` measured ~`214px` wide with heavy borders and `22px` height (mismatching adjacent `28px` native titlebar buttons).
3. **Top-of-panel pill clutter & inverted hierarchy**: Two stacked rows of pill buttons (`Source` + `View`) plus bulky Plan and Cost cards pushed the 4 KPI cards and Token Activity heatmap halfway down the panel.
4. **Heatmap horizontal scrollbar overflow**: 52 columns × (`10px` + `3px` gap) = `673px` overflowed the `586px` grid container inside the `640px` panel, producing a thick grey native horizontal scrollbar.
5. **Card 1 text wrapping**: `≈ $170.54 (¥1227.9) · Avg $7.75/d` wrapped onto two lines inside the narrow first KPI card.
6. **Capsule gauge direction & i18n gap**: The capsule mini-bar drained (`100 - usagePercent`) while the hover tooltip bar directly above it filled (`usagePercent`), and the capsule tooltip lacked Traditional Chinese (`zh-TW`) localization.

---

## 2. Shared Design System Tokens

### 2.1 Typography & Numeric Rules
- **Primary font**: `var(--font-sans, "Google Sans Flex", "Google Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif)`
- **Monospace font**: `var(--font-mono, ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace)`
- **All telemetry numbers**: `font-variant-numeric: tabular-nums`
- **Type scale**:
  - Panel title: `13px` / `600` / `-0.01em`
  - KPI hero value: `19px` / `650` / `1.15` / `-0.02em`
  - Section title / Cost hero: `12.5px`–`16px` / `600`
  - Body & controls: `11.5px`–`12px` / `450`–`500`
  - Micro labels & captions: `10px`–`10.5px` / `450`–`500`

### 2.2 Spacing & Radius Scale
- **Spacing**: `4px` (`--ag-space-1`), `8px` (`--ag-space-2`), `12px` (`--ag-space-3`), `16px` (`--ag-space-4`)
- **Radii**:
  - Panel / Tooltip shell: `12px` (panel), `10px` (capsule tooltip & popovers)
  - Cards / Sections: `10px` (`--ag-radius-card`)
  - Segmented tracks & inputs: `7px`–`8px` (`--ag-radius-control`)
  - Small controls / badges: `5px` (`--ag-radius-sm`)
  - Pills / Titlebar badge / Capsule: `9999px` (`--ag-radius-pill`)

### 2.3 Iconography Rules
- Replace ALL UI chrome emojis (`⚡`, `🎨`, `💰`, `💎`, `🖊`) and coarse Unicode arrows (`◀`, `▶`, `▼`, `✕`, `◐`, `☀`, `☾`) with crisp monochrome inline SVGs (`stroke="currentColor"`, `stroke-width="1.6"`, `stroke-linecap="round"`, `stroke-linejoin="round"`, `fill="none"`).
- **Important test-harness constraint**: Only use `<svg>`, `<path .../>`, `<rect .../>`, `<circle .../>`, `<line .../>` with self-closing leaf tags (`/>`) so `tests/unified-ui.test.js`'s `createStrictMockDom()` parses them cleanly.
- Country flag emojis inside dropdown options (`🇺🇸`, `🇹🇼`, `🇯🇵`, etc.) remain unchanged.
- **Zero GitHub icons, links, or URLs** anywhere.

### 2.4 Non-Negotiable Constraints (Both Parts)
- Preserve ALL existing functionality, data fields, bridge calls, settings persistence, and tri-language support (`zh-CN`, `zh-TW`, `en`).
- Preserve ALL required IDs, classes, and attributes:
  - Capsule: `data-agy-context-capsule="1"`, `__agy_ctx_capsule_tooltip__`, `.agy-ctx-speed`, `.agy-ctx-speed-val`, `.agy-ctx-fill`, `.agy-ctx-label`.
  - Panel: `ag-usage-suite-host`, `data-dock`, `data-theme`, `badge-tokens`, `badge-tokens-text`, `panel-tokens`, `tokens-main-view`, `cost-estimate-card`, `cost-details-body`, `plan-summary-bar`, `plan-detail-card`, `token-color-drawer`, `token-color-drawer-body`, `color-picker-popover`, `heat-pop`, `heatmap-grid`, `heat-tab-daily/weekly/monthly/yearly/cum`, `btn-heat-prev`, `btn-heat-next`, `heat-first-use`, `heat-range-label`, `data-level`, `is-future`, `is-today`, `is-first-use`, plus all existing form/dropdown/color/language/source/view IDs.
- Keep ALL removed legacy IDs absent (`badge`, `badge-speed`, `badge-cli`, `badge-overflow`, `context-tooltip`, `overflow-menu`, `panel`, `global-restart-modal`, `btn-check-update`, `check-auto-update`, `update-popover`, `btn-github-tokens`, `btn-github-repo`).
- Heatmap future cells (`is-future`) MUST look visually identical to empty cells (`data-level="0"`).

---

## Part A — Bottom Context Capsule (`@impl-capsule`)

**Target files**: `src/renderer/capsule-ui.js` (and only legitimately changed capsule/tooltip assertions in `tests/telemetry-hub.test.js`).

### A.1 Capsule Button in `.agy-composer-footer`
Goal: Match native footer controls (`Select model`, `Turbo`: `28px` height, `12px` text, `rounded-full`, `text-secondary-foreground`, transparent at rest, `hover:bg-secondary`).

1. **Button attributes & classes**:
   - Keep `type="button"`, `data-agy-context-capsule="1"`, `translate="no"`.
   - `className`: `'notranslate flex cursor-pointer items-center h-7 gap-1.5 rounded-full px-2 text-xs text-secondary-foreground select-none outline-none hover:bg-secondary transition-colors shrink-0 whitespace-nowrap'`
   - Inline styles: `fontVariantNumeric = 'tabular-nums'`, `fontSize = '12px'`, `lineHeight = '1'`.

2. **Internal DOM layout** (`populateCapsuleButtonDom`):
   ```
   [ ⚡ 39 tok/s ] | [ ━━━────── ] 464.8k/1M · 44.3%
     .agy-ctx-speed  .agy-ctx-sep    trackSvg   .agy-ctx-label
   ```
   - **`.agy-ctx-speed`**: `display: inline-flex; align-items: center; gap: 3px; opacity: 0.78;`
     - Bolt SVG: `width="10" height="11" viewBox="0 0 12 14" fill="currentColor" style="display:block;opacity:0.85;"` (keep clean path `M7.2 1L1.5 8h4.2L4.8 13l5.7-7H6.3L7.2 1z`).
     - `.agy-ctx-speed-val`: shows `${usageData.tokPerSec} tok/s`.
     - **Idle hiding**: When `usageData.tokPerSec > 0`, show `.agy-ctx-speed` (`display: inline-flex`) and `.agy-ctx-sep` (`display: inline-block`). When `usageData.tokPerSec <= 0`, hide both (`display: none`) so fresh/idle chats don't waste ~60px on `-- tok/s`.
   - **`.agy-ctx-sep`**: `span` hairline divider (`display: inline-block; width: 1px; height: 11px; background: currentColor; opacity: 0.18; margin: 0 1px; flex-shrink: 0;`).
   - **Context Gauge SVG (`trackSvg`)**:
     - Dimensions: `width="20" height="10" viewBox="0 0 20 10" class="shrink-0" style="display:block;"`.
     - Outer track `<rect>`: `x="0.75" y="1.25" width="18.5" height="7.5" rx="3.75" fill="currentColor" fill-opacity="0.10" stroke="currentColor" stroke-width="1" stroke-opacity="0.28"`.
     - Inner fill `<rect class="agy-ctx-fill">`: `x="2.25" y="2.75" height="4.5" rx="2.25" fill="${color}" style="transition:width 0.22s ease,fill 0.22s ease;"`.
     - **Fill direction fix**: Fill proportionally to **usage** (`usagePercent`), matching the tooltip bar directly above it!
       - `const clampedPct = Math.max(0, Math.min(100, Number(usageData.usagePercent) || 0));`
       - `const fillWidth = clampedPct <= 0 ? '0' : Math.max(2.4, (15.5 * clampedPct) / 100).toFixed(1);`
       - Keep `MORANDI_3A` thresholds & exported constants exact (`green: '#5E9E8E'`, `yellow: '#C6A265'`, `red: '#C26C77'`; `>= 80` red, `>= 50` yellow, else green).
   - **`.agy-ctx-label`**:
     - Structured with two inner spans so ratio and percentage have crisp visual hierarchy:
       - `<span class="agy-ctx-ratio"></span>` (`font-weight: 450;` — e.g. `344k/1M`)
       - `<span class="agy-ctx-pct"></span>` (`opacity: 0.68;` — e.g. ` · 32.8%`)
     - Resulting `.agy-ctx-label.textContent`: `${usedStr}/${limitStr} · ${pctStr}` (e.g. `344k/1M · 32.8%`).
     - Update the 3 exact string assertions in `tests/telemetry-hub.test.js` (lines 612, 902, 930) from `'/1M,'` / `'344k/1M, 32.8%'` to `'/1M ·'` / `'344k/1M · 32.8%'`.

### A.2 Hover Tooltip (`#__agy_ctx_capsule_tooltip__`)
Goal: Native Antigravity frosted obsidian/crisp-white popover with clear visual grouping, smooth motion, compaction marker on the progress bar, and full `zh-CN` / `zh-TW` / `en` localization.

1. **Theme Palette (exact values inside `updateTooltipContent`)**:

   | Token | Dark Mode | Light Mode |
   |---|---|---|
   | Background | `rgba(18, 18, 22, 0.97)` | `rgba(255, 255, 255, 0.98)` |
   | Primary text (`fgColor`) | `#F4F5F8` | `#09090B` |
   | Secondary text (`bodyColor`) | `#D4D5DC` | `#27272A` |
   | Muted text (`mutedColor`) | `#8B8D98` | `#636672` |
   | Outer border (`borderColor`) | `rgba(255, 255, 255, 0.11)` | `rgba(15, 23, 42, 0.11)` |
   | Inner hairline (`dividerColor`) | `rgba(255, 255, 255, 0.07)` | `rgba(15, 23, 42, 0.07)` |
   | Subtle inset (`insetBg`) | `rgba(255, 255, 255, 0.04)` | `rgba(15, 23, 42, 0.04)` |
   | Progress track (`trackColor`) | `rgba(255, 255, 255, 0.08)` | `rgba(15, 23, 42, 0.08)` |
   | Compaction tick (`tickColor`) | `rgba(255, 255, 255, 0.55)` | `rgba(15, 23, 42, 0.45)` |
   | Shadow | `0 12px 32px rgba(0, 0, 0, 0.52), 0 0 0 1px rgba(255, 255, 255, 0.04)` | `0 10px 28px rgba(15, 23, 42, 0.14), 0 0 0 1px rgba(15, 23, 42, 0.05)` |
   | Compression callout bg / text | `rgba(198, 162, 101, 0.12)` / `#DFC089` | `rgba(198, 162, 101, 0.14)` / `#8A6830` |
   | Warning callout bg / text | `rgba(194, 108, 119, 0.14)` / `#E0919B` | `rgba(194, 108, 119, 0.12)` / `#9E4450` |

2. **Container shell (`ensureTooltipEl`)**:
   - `border-radius: 10px`
   - `padding: 11px 13px`
   - `min-width: 268px; max-width: 320px`
   - `font-family: var(--font-sans, inherit); font-size: 12px; line-height: 1.45; font-variant-numeric: tabular-nums;`
   - `backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);`
   - Transition: `opacity 0.14s ease, transform 0.14s ease;`
   - Hidden state: `opacity: 0; transform: translateY(3px);` → Visible state: `opacity: 1; transform: translateY(0);`
   - Keep `id="__agy_ctx_capsule_tooltip__"`, `position: fixed`, `z-index: 999999`, `pointer-events: none`.

3. **Tooltip Content Structure (top to bottom)**:
   - **Block 1 — Header & Context Bar**:
     - Header flex row (`justify-content: space-between; align-items: center; gap: 10px; margin-bottom: 7px;`):
       - Left: Model name (`font-size: 12.5px; font-weight: 600; color: fgColor; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;`).
       - Right: Status indicator pill (`display: inline-flex; align-items: center; gap: 5px; font-size: 11.5px; font-weight: 500; color: bodyColor; flex-shrink: 0;`): `6px` circle dot (`background: barColor`) + `${data.usagePercent.toFixed(1)}% ${tCap('used')}`.
     - Progress bar (`position: relative; width: 100%; height: 5px; border-radius: 999px; background: trackColor; overflow: hidden; margin-bottom: 9px;`):
       - Fill bar: `width: ${fillPct}%; height: 100%; border-radius: 999px; background: barColor;` (`fillPct = data.usagePercent <= 0 ? 0 : Math.min(100, Math.max(2, data.usagePercent)).toFixed(1)`).
       - **Compaction marker tick** (ONLY when `Number.isFinite(compactionLimit) && compactionLimit > 0 && compactionLimit < data.contextLimit`):
         - `<div style="position:absolute;top:0;bottom:0;left:${(compactionLimit / data.contextLimit * 100).toFixed(1)}%;width:1.5px;background:${tickColor};"></div>`
   - **Block 2 — Context Capacity Metrics**:
     - `Context Used` (`bodyColor` label? No: `mutedColor` label, `fgColor` `font-weight: 550` value): `${data.contextUsed.toLocaleString()} / ${data.contextLimit.toLocaleString()}`
     - `Remaining Capacity` (`mutedColor` label, `bodyColor` value): `${remainingTokens.toLocaleString()} (${data.remainPercent.toFixed(1)}%)`
     - Conditional `Compaction Limit` (ONLY when `0 < compactionLimit < data.contextLimit`): `${Math.round(compactionLimit).toLocaleString()} (${formatTokenValue(compactionLimit)})`
     - Conditional `Estimated Delta` (when `data.estimatedDelta > 0`): `11px`, `mutedColor` label, `+${data.estimatedDelta.toLocaleString()}`.
   - **Block 3 — Precise Telemetry** (only when `data.hasPreciseSnapshot`):
     - Hairline divider (`border-top: 1px solid ${dividerColor}; margin: 8px 0;`).
     - Conditional `Generation Speed` (when `data.tokPerSec > 0`): `${data.tokPerSec} tok/s (${avgLabel} ${data.avgTokPerSec || data.tokPerSec} tok/s)`.
     - `Prompt Cache Hit`: `${data.cacheHitRate.toFixed(1)}%` (`font-weight: 500`).
     - Compact inset breakdown chip (`margin-top: 5px; padding: 4px 8px; border-radius: 6px; background: insetBg; display: flex; justify-content: space-between; gap: 10px; font-size: 10.5px; color: mutedColor;`):
       - Left: `${cache}: ${formatTokenValue(data.cacheReadTokens)} · ${input}: ${formatTokenValue(data.inputTokens)}`
       - Right: `${output}: ${formatTokenValue(data.outputTokens)}`
   - **Block 4 — Compression / Warning Callout** (conditional — no extra hairline dividers needed because the tinted pill provides clean separation):
     - If `data.compressionDetected && data.compressionDrop > 0`:
       - Soft amber callout box (`margin-top: 8px; padding: 5px 8px; border-radius: 6px; background: compBg; display: flex; justify-content: space-between; align-items: center; gap: 10px; font-size: 11px;`):
       - Left (`color: compText; font-weight: 500`): `Auto-compressed` / `已触发自动压缩` / `已觸發自動壓縮`
       - Right (`color: fgColor`): `${formatTokenValue(data.compressionBefore)} → ${formatTokenValue(data.compressionAfter)} (-${dropPct}%)`
     - Else if `data.usagePercent >= 85`:
       - Soft rose-red callout box (`margin-top: 8px; padding: 5px 8px; border-radius: 6px; background: warnBg; color: warnText; font-size: 11px;`): warning message.
   - **Block 5 — 5h Quota** (conditional when `data.quotaInfo && typeof data.quotaInfo.remainingFraction === 'number'`):
     - Hairline divider (`margin: 8px 0;`).
     - Standard row: `5h Remaining Quota` on left, `<span style="color:fgColor;font-weight:550">${qPct}%</span>` + optional muted ` · ${resetText}` on right.
   - **Block 6 — Footer**:
     - Hairline divider (`border-top: 1px solid ${dividerColor}; margin-top: 8px; padding-top: 6px; font-size: 10.5px; color: mutedColor; display: flex; justify-content: space-between; gap: 12px;`).
     - Left: `${steps}: ${(data.stepCount || 0).toLocaleString()}`
     - Right: `${switchHint}` (`Click to switch: 中文` / `点击切换: English` / `點擊切換: English`).

4. **Tri-Language Tooltip Dictionary (`zh-CN` / `zh-TW` / `en`)**:
   Resolve language via `const fullLang = (typeof hub.getLanguage === 'function' ? hub.getLanguage() : null) || (hub.getShortLanguage() === 'en' ? 'en' : 'zh-CN');` and normalize to `'en'`, `'zh-TW'`, or `'zh-CN'`.

   | Key | `zh-CN` | `zh-TW` | `en` |
   |---|---|---|---|
   | `used` | `已用` | `已用` | `used` |
   | `contextUsed` | `当前上下文占用` | `目前上下文佔用` | `Context Used` |
   | `remaining` | `剩余可用容量` | `剩餘可用容量` | `Remaining Capacity` |
   | `compactionLimit` | `自动压缩阈值` | `自動壓縮閾值` | `Compaction Limit` |
   | `genSpeed` | `输出生成速度` | `輸出生成速度` | `Generation Speed` |
   | `avg` | `均值` | `均值` | `avg` |
   | `cacheHit` | `Prompt 缓存命中率` | `Prompt 快取命中率` | `Prompt Cache Hit` |
   | `cache` | `缓存` | `快取` | `Cache` |
   | `input` | `新入` | `新入` | `Input` |
   | `output` | `输出` | `輸出` | `Output` |
   | `estDelta` | `实时估算增量` | `即時估算增量` | `Estimated Delta` |
   | `compressed` | `已触发自动压缩` | `已觸發自動壓縮` | `Auto-compressed` |
   | `warnHigh` | `接近自动压缩阈值，建议适时归档上下文` | `接近自動壓縮閾值，建議適時歸檔上下文` | `Approaching auto-compaction threshold` |
   | `quota5h` | `5小时剩余额度` | `5小時剩餘額度` | `5h Remaining Quota` |
   | `steps` | `步数` | `步數` | `Steps` |
   | `switchHint` | `点击切换: English` | `點擊切換: English` | `Click to switch: 中文` |
   | `resetsSoon` | `即将重置` | `即將重置` | `Resets soon` |
   | `resetsLt1m` | `<1m 后重置` | `<1m 後重置` | `Resets in <1m` |
   | `resetsIn` | `{dur} 后重置` | `{dur} 後重置` | `Resets in {dur}` |

### A.3 Part A Implementation Checklist
- [ ] Update `populateCapsuleButtonDom` with refined `20×10` gauge SVG, `.agy-ctx-sep` divider, and `.agy-ctx-ratio` + `.agy-ctx-pct` spans inside `.agy-ctx-label`.
- [ ] Update `renderFooterCapsule` so `.agy-ctx-fill` fills proportionally to `usagePercent` (`0` when 0%, min `2.4` when > 0, max `15.5`), preserves `MORANDI_3A` fill color, hides `.agy-ctx-speed` + `.agy-ctx-sep` when `tokPerSec <= 0`, and formats `.agy-ctx-label` as `${usedStr}/${limitStr} · ${pctStr}`.
- [ ] Upgrade `ensureTooltipEl` & `updateTooltipContent` to the new Antigravity obsidian/light palette, `10px` radius, `backdrop-filter: blur(12px)`, `translateY` transition, status dot, compaction progress-bar tick, inset cache breakdown chip, and tinted compression/warning callouts.
- [ ] Add `zh-CN` / `zh-TW` / `en` dictionary in `capsule-ui.js` (including `formatResetText`) using `hub.getLanguage()`.
- [ ] Update the 3 capsule label delimiter assertions in `tests/telemetry-hub.test.js` (`'/1M ·'` / `'344k/1M · 32.8%'`) and add/keep verification for `zh-TW` tooltip strings if desired.
- [ ] Run `tests/telemetry-hub.test.js` — 0 failures.

### A.4 Part A Acceptance Criteria
1. Capsule button height (`28px`), font size (`12px`), and pill hover match adjacent native `.agy-composer-footer` buttons (`Turbo`, model selector).
2. Capsule gauge fills left-to-right with `usagePercent`, matching the hover tooltip bar; `MORANDI_3A` colors apply at `<50%` green, `50-79.9%` yellow, `>=80%` red.
3. Speed text and hairline separator cleanly hide when `tokPerSec <= 0` and appear when `tokPerSec > 0`.
4. Tooltip displays all telemetry fields, renders the compaction limit row and bar tick ONLY when `0 < clientCompactionLimit < contextLimit`, renders cleanly in both dark and light themes, and localizes accurately in `zh-CN`, `zh-TW`, and `en`.
5. `dispose()` removes all capsules and `#__agy_ctx_capsule_tooltip__` with zero leaks; `tests/telemetry-hub.test.js` passes 100%.

---

## Part B — Top-Right Titlebar Badge & Usage Panel (`@impl-panel`)

**Target files**: `src/renderer/usage-template.html`, `src/renderer/usage-styles.css`, `src/renderer/usage-panel-ui.js`, `src/renderer/usage-heatmap.js`, `src/renderer/usage-colors.js`, `src/renderer/usage-i18n.js`, `src/renderer/usage-dropdown.js` (and `tests/unified-ui.test.js` only if any assertion is legitimately affected — see notes below).

### B.1 Exact Shadow-DOM CSS Variables (`usage-styles.css`)

Replace `:host` and `:host([data-theme="light"])` token blocks with these exact values:

```css
:host {
  --ag-surface: #121216;
  --ag-surface-card: #18181d;
  --ag-surface-subtle: rgba(255, 255, 255, 0.042);
  --ag-surface-hover: rgba(255, 255, 255, 0.08);
  --ag-surface-active: #24242c;
  --ag-surface-elevated: #1d1d23;
  --ag-border: rgba(255, 255, 255, 0.08);
  --ag-border-strong: rgba(255, 255, 255, 0.15);
  --ag-text: #d4d5dc;
  --ag-text-muted: #8b8d98;
  --ag-text-bright: #f4f5f8;
  --ag-accent: #2f71e3;
  --ag-accent-text: #609bf8;
  --ag-accent-soft: rgba(47, 113, 227, 0.16);
  --ag-token-total: #60a5fa;
  --ag-token-accent: #34d399;
  --ag-danger: #f87171;
  --ag-warning: #fbbf24;
  --ag-success: #34d399;
  --ag-heat-0: rgba(255, 255, 255, 0.055);
  --ag-heat-1: #1e3a5f;
  --ag-heat-2: #1d4ed8;
  --ag-heat-3: #3b82f6;
  --ag-heat-4: #93c5fd;
  --ag-shadow: 0 16px 40px rgba(0, 0, 0, 0.56), 0 0 0 1px rgba(255, 255, 255, 0.04);
  --ag-shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.36);
  --ag-radius-panel: 12px;
  --ag-radius-card: 10px;
  --ag-radius-control: 7px;
  --ag-radius-sm: 5px;
  --ag-radius-pill: 9999px;
  --ag-font: var(--font-sans, "Google Sans Flex", "Google Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif);
  --ag-font-mono: var(--font-mono, ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace);
  font-family: var(--ag-font);
  font-size: 12px;
  color: var(--ag-text);
  box-sizing: border-box;
  -webkit-app-region: no-drag;
}

:host([data-theme="light"]) {
  --ag-surface: #ffffff;
  --ag-surface-card: #f7f7f9;
  --ag-surface-subtle: rgba(15, 23, 42, 0.045);
  --ag-surface-hover: rgba(15, 23, 42, 0.08);
  --ag-surface-active: #ffffff;
  --ag-surface-elevated: #ffffff;
  --ag-border: rgba(15, 23, 42, 0.09);
  --ag-border-strong: rgba(15, 23, 42, 0.16);
  --ag-text: #27272a;
  --ag-text-muted: #636672;
  --ag-text-bright: #09090b;
  --ag-accent: #2563eb;
  --ag-accent-text: #1d4ed8;
  --ag-accent-soft: rgba(37, 99, 235, 0.10);
  --ag-token-total: #1d4ed8;
  --ag-token-accent: #059669;
  --ag-danger: #dc2626;
  --ag-warning: #d97706;
  --ag-success: #059669;
  --ag-heat-0: #eaecef;
  --ag-heat-1: #dbeafe;
  --ag-heat-2: #93c5fd;
  --ag-heat-3: #3b82f6;
  --ag-heat-4: #1d4ed8;
  --ag-shadow: 0 14px 36px rgba(15, 23, 42, 0.14), 0 0 0 1px rgba(15, 23, 42, 0.05);
  --ag-shadow-sm: 0 1px 2px rgba(15, 23, 42, 0.08);
}
```

### B.2 Compact Titlebar Badge (`#badge-tokens`)
- **Docking**: Keep `ensureHostDocked()`, `findDockTarget()`, `computeFloatingRightOffset()`, `data-dock="flow"`, `marginRight: '6px'`, and floating `top: '6px'` untouched so titlebar placement and tests pass identically.
- **Visual styling**:
  - `.ag-unit`: `height: 26px`, `padding: 0 10px`, `gap: 5px`, `border-radius: var(--ag-radius-pill)`, `border: 1px solid var(--ag-border)`, `background: var(--ag-surface-subtle)`, `color: var(--ag-text)`, `font-size: 11.5px`, `font-weight: 450`.
  - Hover: `background: var(--ag-surface-hover)`, `border-color: var(--ag-border-strong)`, `color: var(--ag-text-bright)`.
  - Expanded (`aria-expanded="true"`): `background: var(--ag-accent-soft)`, `border-color: var(--ag-accent)`, `color: var(--ag-text-bright)`.
- **Icon**: Replace `⚡` inside `.ag-tok-bolt` with inline monochrome SVG:
  ```html
  <span class="ag-tok-bolt" aria-hidden="true"><svg width="11" height="12" viewBox="0 0 12 14" fill="currentColor"><path d="M7.2 1L1.5 8h4.2L4.8 13l5.7-7H6.3L7.2 1z"/></svg></span>
  ```
  - Color `.ag-tok-bolt`: `color: var(--ag-accent-text); display: inline-flex; align-items: center;`.
- **Compact copy (`updateBadgeTokensText` in `usage-panel-ui.js`)**:
  - Initial HTML & empty state: `'Tokens --'` (preserves `unified-ui.test.js` line 563).
  - Loaded state: build 3 child spans inside `#badge-tokens-text` using `doc.createElement('span')` + `replaceChildren` (safe in both real DOM and mock DOM):
    1. `<span class="ag-badge-today">` → `t('tokens.badge.todayShort', { val: formatTokensK(todayTok) })` (`今日 4.06M` / `Today 4.06M`), styled `color: var(--ag-text-bright); font-weight: 500;`
    2. `<span class="ag-badge-sep" aria-hidden="true">` → `' · '`, styled `color: var(--ag-text-muted); opacity: 0.55;`
    3. `<span class="ag-badge-total">` → `formatTokensK(totalTok)`, styled `color: var(--ag-text-muted); font-weight: 400;`
  - Set `#badge-tokens` `title` attribute to `t('tokens.badge.fullTitle', { today: formatTokensK(todayTok), total: formatTokensK(totalTok) })`.
  - Width drops from ~`214px` to ~`152px` while highlighting today's spend first and passing `badgeText.textContent.includes('120')`.

### B.3 Panel Shell & Reordered Information Architecture (`usage-template.html`)

**Panel shell dimensions**:
- `#panel-tokens`: `width: min(660px, calc(100vw - 24px))`, `max-height: calc(100vh - 56px)`, `border-radius: var(--ag-radius-panel)`, `border: 1px solid var(--ag-border-strong)`, `background: var(--ag-surface)`, `box-shadow: var(--ag-shadow)`.
- `#panel-tokens.cost-compact-view`: `width: min(560px, calc(100vw - 24px))`.
- Update `positionFloatingPanels()` in `usage-panel-ui.js` to use `660` (non-compact) and `560` (compact).
- Add thin custom scrollbars (`5px` width/height, `transparent` track, `var(--ag-border-strong)` rounded thumb) to `.panel-body`, `.heatmap-grid`, `.ag-dropdown-list-container`.

**New Section Order inside `#panel-tokens`**:
1. **`.panel-header`** (44px compact header):
   - Left (`.panel-title-group`):
     - `.panel-title`: monochrome 13×13 spark SVG + `<span data-i18n="tokens.title">本机已记录用量</span>`
     - `#tokens-meta`: inline muted pill/caption beside title (`10.5px`, `color: var(--ag-text-muted)` — format steps with `totalSteps.toLocaleString()`, e.g., `All Sources · 7,575 steps`).
   - Right (`.panel-header-actions`, `gap: 6px`):
     - `.ctx-lang-top-segmented` (`简` | `繁` | `EN`): neutral segmented track (`background: var(--ag-surface-subtle)`, `border: 1px solid var(--ag-border)`, `padding: 2px`, `border-radius: var(--ag-radius-control)`); active `.seg-btn.is-active` uses `background: var(--ag-surface-active); color: var(--ag-text-bright); box-shadow: var(--ag-shadow-sm);` (no purple fill).
     - `#btn-token-colors-top` (`26×26` icon button, 14×14 palette/sliders SVG): clicking toggles `toggleTokenColorsDrawer()` (opens if closed, closes if open; scrolls `#token-color-drawer` into view when opening); `toggleTokenColorsDrawer` keeps `aria-pressed` synced on `#btn-token-colors-top`.
     - `#btn-theme-tokens` (`26×26` icon button, 14×14 SVG updated by `applyTheme()` for auto/light/dark).
     - `#btn-close-tokens` (`26×26` icon button, 14×14 crisp `X` SVG).
2. **`.panel-body`** (`padding: 12px 14px 14px`, `gap: 10px`):
   - **Section 1 — `.panel-toolbar`** (merges old `.source-switch-row` and `.token-view-bar` into ONE horizontal bar):
     - Left: `.token-view-bar` (`#tok-view-tokens`, `#tok-view-cost`) styled as a segmented track (`background: var(--ag-surface-subtle)`, `border: 1px solid var(--ag-border)`, `padding: 2px`, `border-radius: 8px`).
     - Right: `.source-switch-bar` (`#src-tab-all`, `#src-tab-desktop`, `#src-tab-cli`) styled as a matching compact segmented track; keep `<span class="source-switch-label sr-only" data-i18n="tokens.sourceLabel">来源:</span>` visually hidden for clean chrome while preserving semantics/i18n.
     - Active tab button (`.source-pill.active`): `background: var(--ag-surface-active); color: var(--ag-text-bright); border-color: var(--ag-border); box-shadow: var(--ag-shadow-sm);` (replaces purple ring).
   - **Section 2 — `#tokens-main-view`** (shown in `Token Stats` view; hidden in `API Est. Cost` view):
     - **2a. `.tokens-grid-4` (4 Stat Cards)** — promoted directly to the top!
       - `grid-template-columns: repeat(4, minmax(0, 1fr))`, `gap: 8px`.
       - `.t-card`: `padding: 11px 12px`, `border-radius: var(--ag-radius-card)`, `border: 1px solid var(--ag-border)`, `background: var(--ag-surface-card)`, `gap: 3px`, `transition: border-color 0.15s ease`.
       - `.t-card:hover`: `border-color: var(--ag-border-strong)`.
       - `.t-card-accent`: subtle top accent edge `border-top: 2px solid var(--ag-token-total); padding-top: 10px;` + `.t-val { color: var(--ag-token-total); }`.
       - `.t-label`: `11px`, `font-weight: 500`, `color: var(--ag-text-muted)`.
       - `.t-val`: `19px`, `font-weight: 650`, `letter-spacing: -0.02em`, `line-height: 1.15`, `color: var(--ag-text-bright)`, `font-variant-numeric: tabular-nums`, `margin: 2px 0 1px`.
       - `.t-sub`: `10.5px`, `color: var(--ag-text-muted)`, single-line ellipsis.
       - `.t-cost`: `10.5px`, `font-weight: 500`, `color: var(--ag-token-accent)`, single-line ellipsis (`white-space: nowrap; overflow: hidden; text-overflow: ellipsis;`).
       - **Card 1 overflow fix (`renderTokenCards`)**: Set `#t-total-cost` text to `≈ $${usd.toFixed(2)}${t('tokens.dailyAvg', { val: Number(totalStats.dailyAverageUSD || 0).toFixed(2) })}` (fits cleanly on 1 line like `≈ $170.54 · $7.75/d`), and put the full USD+CNY string `≈ $${usd.toFixed(2)} (¥${cny.toFixed(1)})${t('tokens.dailyAvg', ...)}` in `tTotalCost.title`!
     - **2b. `.heatmap-section` (Token Activity Heatmap)** — hero visualization!
       - Detailed below in **§B.4**.
   - **Section 3 — `.plan-cost-stack` (`display: flex; flex-direction: column; gap: 8px;`)** — sits tidily below `#tokens-main-view` in `Token Stats` view, and rises cleanly to the top when `#tokens-main-view` hides in `API Est. Cost` view:
     - **3a. `#cost-estimate-card`**:
       - `padding: 11px 13px`, `border-radius: var(--ag-radius-card)`, `border: 1px solid var(--ag-border)`, `background: var(--ag-surface-card)`, `gap: 7px`.
       - Remove `💰` emoji from `#cost-title`; add subtle 13×13 monochrome currency/coin SVG inside `.cost-header-left`.
       - `.cost-period-tag` & `.cost-nonpaid-badge`: borderless soft pills (`background: var(--ag-surface-subtle)`, `border: none`, `color: var(--ag-text-muted)`, `font-size: 10px`, `padding: 2px 7px`, `border-radius: var(--ag-radius-pill)`).
       - `#cost-ref-total`: `15.5px`, `font-weight: 650`, `color: var(--ag-token-accent)`.
       - `#cost-details-body`: scope & mode controls wrapped in segmented tracks (`.cost-ctrl-track`), 3 `.cost-mini-card` tiles (`background: var(--ag-surface)`, `border: 1px solid var(--ag-border)`, `border-radius: 8px`, `padding: 8px 10px`), `.cost-diff-box` with left accent (`border: none; border-left: 2px solid var(--ag-accent); background: var(--ag-surface-subtle); padding: 7px 10px; border-radius: 0 6px 6px 0;`).
     - **3b. `#plan-summary-bar` + `#plan-detail-card`**:
       - `#plan-summary-bar`: slim account bar (`padding: 8px 12px`, `border-radius: var(--ag-radius-card)`, `border: 1px solid var(--ag-border)`, `background: var(--ag-surface-card)`).
       - `#plan-summary-tier`: soft-blue pill (`background: var(--ag-accent-soft)`, `color: var(--ag-accent-text)`, `font-size: 11px`, `font-weight: 600`, `padding: 2px 7px`, `border-radius: var(--ag-radius-sm)`).
       - `#plan-summary-account`: `11px`, `color: var(--ag-text-muted)`, `max-width: 190px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;`.
       - `#plan-summary-price-badge`: borderless inset chip (`background: var(--ag-surface-subtle)`, `border: none`, `border-radius: var(--ag-radius-sm)`, `padding: 2px 7px`, `color: var(--ag-text)`, `font-size: 11px`, `font-variant-numeric: tabular-nums`). Wire click event on `#plan-summary-price-badge` to toggle `setPlanDetailExpanded(!planDetailExpanded)` (matches its tooltip promise!).
       - `#plan-summary-source-pill`: quiet text badge (`border: none; background: transparent; color: var(--ag-text-muted); font-size: 10.5px; padding: 0 2px;`).
       - `#plan-detail-card`: `padding: 12px 13px`, `border-radius: var(--ag-radius-card)`, `border: 1px solid var(--ag-border)`, `background: var(--ag-surface-card)`. Remove `💎` emoji from `.plan-detail-header`.
       - Form inputs (`.pf-input`, `.ag-dropdown-trigger`) & buttons (`.ag-btn`): uniform `border-radius: var(--ag-radius-control)` (`7px`), `padding: 5px 8px`, focus state `border-color: var(--ag-accent); box-shadow: 0 0 0 2px var(--ag-accent-soft);`.
   - **Section 4 — `#token-color-drawer`** (placed directly in `.panel-body` at the very bottom, OUTSIDE `#tokens-main-view`, so the header palette button works from both `Token Stats` and `API Est. Cost` views!):
     - Quiet low-profile collapsible row (`border-radius: var(--ag-radius-card)`, `border: 1px solid var(--ag-border)`, `background: transparent` at rest; `background: var(--ag-surface-card)` when expanded).
     - Remove `🎨` emoji from title; prefix `.drawer-toggle-btn` label with a 13×13 monochrome palette SVG.
     - Reorder `#heat-preset-group` pills to put `blue` first (`blue`, `purple`, `green`, `yellow`, `red`) matching the new default Antigravity Blue preset.

### B.4 Heatmap Visual Polish (`usage-styles.css` + `usage-heatmap.js`)

1. **Zero-Scrollbar Full-Width 52-Week Grid (Daily & Cumulative)**:
   - Container width math at `660px` panel width: `660 - 28 (body pad) - 28 (heatmap pad) - 2 (borders) = 602px`.
   - CSS:
     ```css
     .heatmap-grid {
       width: 100%;
       overflow-x: auto;
       padding: 2px 0;
     }
     .heat-grid-weeks {
       display: grid;
       grid-template-columns: repeat(52, minmax(8px, 1fr));
       gap: 2px;
       width: 100%;
       min-width: 520px;
     }
     .heat-day-col {
       display: flex;
       flex-direction: column;
       gap: 2px;
       min-width: 0;
     }
     .heat-cell {
       width: 100%;
       aspect-ratio: 1;
       border-radius: 2px;
       border: none;
       background: var(--ag-heat-0);
       cursor: pointer;
       flex-shrink: 0;
       padding: 0;
       transition: transform 0.1s ease, box-shadow 0.12s ease;
     }
     .heat-cell:hover {
       position: relative;
       z-index: 2;
       transform: scale(1.18);
       box-shadow: 0 0 0 1.5px var(--ag-text-bright);
     }
     .heat-cell.is-first-use {
       box-shadow: inset 0 0 0 1.25px var(--ag-token-accent);
     }
     .heat-cell.is-today {
       box-shadow: inset 0 0 0 1.25px var(--ag-text-bright);
     }
     .heat-leg-btn {
       width: 10px;
       height: 10px;
       aspect-ratio: auto;
       border-radius: 2px;
     }
     ```
   - At `602px` inner width: `51 × 2px = 102px` gaps → `500 / 52 = 9.6px × 9.6px` crisp squares stretching cleanly edge-to-edge with **zero horizontal scrollbar**!
   - **Future cell rule**: Do NOT add any opacity/dashed/color override for `.heat-cell.is-future` (or `.heat-month-card.is-future` / `.heat-year-card.is-future`). They carry `data-level="0"` and render visually identical to empty cells.

2. **Heatmap Header & Segmented Tabs**:
   - `.heatmap-header`: single balanced row (`justify-content: space-between; align-items: center; gap: 8px; flex-wrap: wrap;`).
   - `.heatmap-nav`: `#btn-heat-prev` and `#btn-heat-next` use crisp 11×11 monochrome chevron SVGs inside `22×22` borderless-at-rest buttons (`border-radius: 6px`, `hover: var(--ag-surface-hover)`).
   - `.heatmap-tabs`: compact segmented track (`background: var(--ag-surface-subtle)`, `border: 1px solid var(--ag-border)`, `padding: 2px`, `border-radius: var(--ag-radius-control)`); active tab uses `background: var(--ag-surface-active); color: var(--ag-text-bright); box-shadow: var(--ag-shadow-sm); border-color: transparent;`.

3. **5-Column Metric Summary Bar (`.heatmap-summary`)**:
   - Replace the bordered nested box with a clean 5-column inset strip:
     ```css
     .heatmap-summary {
       display: grid;
       grid-template-columns: repeat(5, minmax(0, 1fr));
       gap: 8px;
       padding: 7px 10px;
       border-radius: 8px;
       background: var(--ag-surface-subtle);
       border: none;
     }
     .hs-item {
       display: flex;
       flex-direction: column;
       align-items: flex-start;
       gap: 2px;
       min-width: 0;
     }
     .hs-k {
       font-size: 10px;
       color: var(--ag-text-muted);
       white-space: nowrap;
       overflow: hidden;
       text-overflow: ellipsis;
       max-width: 100%;
     }
     .hs-v {
       font-size: 11.5px;
       font-weight: 600;
       color: var(--ag-text-bright);
       font-variant-numeric: tabular-nums;
       white-space: nowrap;
       overflow: hidden;
       text-overflow: ellipsis;
       max-width: 100%;
     }
     ```
   - At `@media (max-width: 520px)`: switch `.heatmap-summary` to `grid-template-columns: repeat(3, minmax(0, 1fr))`.

4. **Weekly / Monthly / Yearly Card Grids (`usage-heatmap.js` + `usage-styles.css`)**:
   - Cards (`.heat-month-card`, `.heat-year-card`): `padding: 9px 10px`, `border-radius: 8px`, `border: 1px solid var(--ag-border)`, `background: var(--ag-surface)`, `gap: 3px`, `transition: border-color 0.14s ease, transform 0.12s ease`.
   - Active intensity encoding (`data-level="1..4"`): top 2px intensity accent (`box-shadow: inset 0 2px 0 var(--ag-heat-N)`) + subtle border tint (`border-color: var(--ag-border-strong)`), hover lifts border to `var(--ag-heat-N)`.
   - Empty & Future cards (`data-level="0"`, including `.is-future`): identical calm neutral styling (`background: var(--ag-surface-subtle)`, `border-color: var(--ag-border)`, `box-shadow: none`).
   - **Future card text cleanup (`usage-heatmap.js`)**: In `renderHeatmapWeekly`, `renderHeatmapMonthly`, `renderHeatmapYearly`, render card subtext for future cards as `'—'` (matching empty zero-usage feel instead of printing `"未来月份（尚未产生用量）"` inside a weekly or yearly card!). Keep the localized future detail in the hover popover (`heat.future` for weekly/daily/yearly or `heatmap.pop.future` for monthly).

5. **Heatmap Footer & De-cluttered Notes**:
   - `.heatmap-footer`: single crisp row (`#heat-first-use` left, `.heatmap-legend` right).
   - Hide `.heatmap-tip-note` via CSS (`display: none;`) to remove redundant tutorial text (keeps the DOM node & `data-i18n` intact).
   - Style `.heatmap-disclaimer` quietly (`font-size: 10px; color: var(--ag-text-muted); opacity: 0.72; line-height: 1.35;`).

6. **Heatmap Popover (`#heat-pop`) & Color Picker (`#color-picker-popover`)**:
   - `#heat-pop`: `border-radius: 9px`, `padding: 9px 11px`, `background: var(--ag-surface-elevated)`, `border: 1px solid var(--ag-border-strong)`, `box-shadow: var(--ag-shadow)`, `backdrop-filter: blur(10px)`, `font-variant-numeric: tabular-nums`.
   - `#color-picker-popover`: `border-radius: 11px`, `padding: 12px`, `background: var(--ag-surface-elevated)`, `border: 1px solid var(--ag-border-strong)`, `box-shadow: var(--ag-shadow)`, `transition: opacity 0.12s ease, transform 0.12s ease;` (`.is-opening` / `.is-closing` fade + `translateY(-4px)`). Remove `🎨` from `cp.title` and `🖊` from `cp.eyedropper`.

### B.5 Color Presets & Auto Theme Detection (`usage-colors.js`)
1. Update default `activeHeatPreset = 'blue'` (Antigravity native blue; saved user choice in `HEAT_PRESET_KEY` still takes precedence).
2. Update `COLOR_SLOTS` defaults to match `:host`:
   - `panelBg`: `defaultDark: '#121216'`, `defaultLight: '#ffffff'`
   - `tokenTotal`: `defaultDark: '#60a5fa'`, `defaultLight: '#1d4ed8'`
   - `tokenAccent`: `defaultDark: '#34d399'`, `defaultLight: '#059669'`
3. Refine `HEAT_PRESETS` empty cell (`dark[0]: 'rgba(255, 255, 255, 0.055)'`, `light[0]: '#eaecef'`) and calibrated 4 active stops:
   - `blue`: dark `['rgba(255, 255, 255, 0.055)', '#1e3a5f', '#1d4ed8', '#3b82f6', '#93c5fd']`, light `['#eaecef', '#dbeafe', '#93c5fd', '#3b82f6', '#1d4ed8']`
   - `purple`: dark `['rgba(255, 255, 255, 0.055)', '#3b1d6a', '#6d28d9', '#8b5cf6', '#c4b5fd']`, light `['#eaecef', '#ede9fe', '#c4b5fd', '#8b5cf6', '#5b21b6']`
   - `green`: dark `['rgba(255, 255, 255, 0.055)', '#064e3b', '#047857', '#10b981', '#4ade80']`, light `['#eaecef', '#d1fae5', '#6ee7b7', '#10b981', '#047857']`
   - `yellow`: dark `['rgba(255, 255, 255, 0.055)', '#713f12', '#a16207', '#eab308', '#fde047']`, light `['#eaecef', '#fef9c3', '#fde047', '#ca8a04', '#854d0e']`
   - `red`: dark `['rgba(255, 255, 255, 0.055)', '#7f1d1d', '#b91c1c', '#ef4444', '#fca5a5']`, light `['#eaecef', '#fee2e2', '#fca5a5', '#ef4444', '#b91c1c']`
4. Fix `detectHostTheme()` to recognize Antigravity standalone light classes (`theme-light`, `light-theme`, `html.classList.contains('light')`, `body.classList.contains('light')`) in addition to `vscode-light` / `vs-light`.
5. Update `applyTheme()` to set crisp monochrome 14×14 SVG icons inside `#btn-theme-tokens` (auto = half-circle, light = sun, dark = moon) while keeping its localized `title` tooltip.

### B.6 i18n Copy Refinements (`usage-i18n.js`)
Keep ALL existing keys and all 3 locales (`zh-CN`, `zh-TW`, `en`). Refine these keys for clean, emoji-free native copy:
- Add `tokens.badge.todayShort`: `{ 'zh-CN': '今日 {val}', 'zh-TW': '今日 {val}', en: 'Today {val}' }`
- Add `tokens.badge.fullTitle`: `{ 'zh-CN': '今日 {today} · 累计 {total}（点击展开用量面板）', 'zh-TW': '今日 {today} · 累計 {total}（點擊展開用量面板）', en: 'Today {today} · Total {total} (click to open usage panel)' }`
- Clean chrome emojis from existing keys:
  - `plan.detail.title`: `'AI 订阅与额度详情'` / `'AI 訂閱與額度詳情'` / `'AI Subscription & Credits'`
  - `cost.title`: `'本期 API 参考金额'` / `'本期 API 參考金額'` / `'Period API Reference Cost'`
  - `cost.titleAll`: `'全量 API 参考金额'` / `'全量 API 參考金額'` / `'All-Time API Reference Cost'`
  - `tokens.colors.title`: `'热力图色阶与外观设置'` / `'熱力圖色階與外觀設定'` / `'Heatmap Palette & Appearance'`
  - `cp.title`: `'颜色选取器'` / `'顏色選取器'` / `'Color Picker'`
  - `cp.eyedropper`: `'取色'` / `'取色'` / `'Pick'`
- Clean stacked summary labels (remove trailing colons for 5-column KPI layout):
  - `tokens.heat.sumTokens`: `'区间合计'` / `'區間合計'` / `'Range Total'`
  - `tokens.heat.sumCost`: `'预估费用'` / `'預估費用'` / `'Est. Cost'`
  - `tokens.heat.sumDailyAvg`: `'折合每天'` / `'折合每天'` / `'Daily Avg'`
  - `tokens.heat.sumActiveAvg`: `'活跃日均'` / `'活躍日均'` / `'Active Avg'`
  - `tokens.heat.sumSubRatio`: `'订阅性价比'` / `'訂閱性價比'` / `'Plan Value'`
- Clean drawer toggle chevron text (icons or cleaner arrows):
  - `drawer.expandSettings` / `drawer.colors.expand`: `'展开 ▾'` / `'展開 ▾'` / `'Expand ▾'`
  - `drawer.collapseSettings` / `drawer.colors.collapse`: `'收起 ▴'` / `'收起 ▴'` / `'Collapse ▴'`
  - `plan.detail.toggleOpen`: `'详情 ▾'` / `'詳情 ▾'` / `'Details ▾'`
  - `plan.detail.toggleClose`: `'收起 ▴'` / `'收起 ▴'` / `'Hide ▴'`
  - `cost.btnExpand`: `'详情 ▾'` / `'詳情 ▾'` / `'Details ▾'`
  - `cost.btnCollapse`: `'收起 ▴'` / `'收起 ▴'` / `'Hide ▴'`

### B.7 Exact Inline SVG Icon Set (`usage-template.html` & `usage-colors.js`)
Use only self-closing `<path/>`, `<circle/>`, `<rect/>`, `<line/>`:
- **Spark / Bolt** (badge `11×12`, panel title `13×14`): `<svg width="12" height="13" viewBox="0 0 12 14" fill="currentColor" aria-hidden="true"><path d="M7.2 1L1.5 8h4.2L4.8 13l5.7-7H6.3L7.2 1z"/></svg>`
- **Palette / Sliders** (`#btn-token-colors-top`, drawer title `14×14`): `<svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="8" cy="8" r="6"/><circle cx="6" cy="6.5" r="0.8" fill="currentColor"/><circle cx="10" cy="6.5" r="0.8" fill="currentColor"/><circle cx="8" cy="10" r="0.8" fill="currentColor"/></svg>`
- **Theme Auto** (`14×14`): `<svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><circle cx="8" cy="8" r="5.5"/><path d="M8 2.5a5.5 5.5 0 0 1 0 11z" fill="currentColor" stroke="none"/></svg>`
- **Theme Light** (`14×14`): `<svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" aria-hidden="true"><circle cx="8" cy="8" r="3"/><line x1="8" y1="1.8" x2="8" y2="3.2"/><line x1="8" y1="12.8" x2="8" y2="14.2"/><line x1="1.8" y1="8" x2="3.2" y2="8"/><line x1="12.8" y1="8" x2="14.2" y2="8"/><line x1="3.6" y1="3.6" x2="4.6" y2="4.6"/><line x1="11.4" y1="11.4" x2="12.4" y2="12.4"/><line x1="12.4" y1="3.6" x2="11.4" y2="4.6"/><line x1="4.6" y1="11.4" x2="3.6" y2="12.4"/></svg>`
- **Theme Dark** (`14×14`): `<svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M13 9.5A5.2 5.2 0 0 1 6.5 3a5.5 5.5 0 1 0 6.5 6.5z"/></svg>`
- **Close** (`#btn-close-tokens`, `#btn-cp-close`, `14×14`): `<svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" aria-hidden="true"><line x1="4" y1="4" x2="12" y2="12"/><line x1="12" y1="4" x2="4" y2="12"/></svg>`
- **Chevron Left / Right** (`#btn-heat-prev`, `#btn-heat-next`, `12×12`):
  - Prev: `<svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10 3.5L5.5 8 10 12.5"/></svg>`
  - Next: `<svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 3.5L10.5 8 6 12.5"/></svg>`

### B.8 Part B Implementation Checklist
- [ ] **`usage-template.html`**:
  - Replace chrome emojis with inline SVGs (`#badge-tokens`, `.panel-title`, header icon buttons, `#btn-heat-prev/next`, `.cost-header-left`, `#token-color-drawer`, `#btn-cp-close`).
  - Move `#tokens-meta` into `.panel-header` beside `.panel-title`.
  - Merge `.token-view-bar` and `.source-switch-bar` into single `.panel-toolbar` row.
  - Reorder `.panel-body` to: `.panel-toolbar` → `#tokens-main-view` (`.tokens-grid-4`, `.heatmap-section`) → `.plan-cost-stack` (`#cost-estimate-card`, `#plan-summary-bar`, `#plan-detail-card`) → `#token-color-drawer`.
  - Put `data-heat-preset="blue"` first in `#heat-preset-group`.
  - Verify zero legacy IDs and zero GitHub links/URLs.
- [ ] **`usage-styles.css`**:
  - Apply exact dark & light `:host` tokens (§B.1), native font stack, radii, shadows, and thin custom scrollbars.
  - Style `#badge-tokens` (`26px` height, compact today/total spans), segmented controls (header lang, toolbar view & source, heatmap tabs, cost controls), 4 stat cards (single-line cost), full-width zero-scrollbar 52-column heatmap grid (`repeat(52, minmax(8px, 1fr))`, `2px` gap, `.heat-leg-btn` fixed `10×10`), 5-column `.heatmap-summary`, weekly/monthly/yearly cards with level top accent and neutral empty/future styling, refined cost/plan cards, drawer, dropdowns, `#heat-pop`, and `#color-picker-popover`.
  - Verify `.is-future` cells/cards have NO divergent styling from `data-level="0"`.
- [ ] **`usage-panel-ui.js`**:
  - Update `updateBadgeTokensText` to render compact today-first spans (`Today 4.06M · 1164.81M`) + localized `title` tooltip while keeping `'Tokens --'` fallback.
  - Update `renderTokenCards` so `#t-total-cost` fits cleanly on one line (with full CNY breakdown in `title`) and `#tokens-meta` formats `totalSteps.toLocaleString()`.
  - Update `positionFloatingPanels()` panel width constant from `640` to `660`.
  - Update `toggleTokenColorsDrawer` to sync `aria-pressed` on `#btn-token-colors-top`; wire `#btn-token-colors-top` click to toggle drawer (and `scrollIntoView({ behavior: 'smooth', block: 'nearest' })` when opening); wire `#plan-summary-price-badge` click to toggle plan details.
- [ ] **`usage-heatmap.js`**:
  - Keep exact first-use anchoring and fixed 364-day / 12-week / 12-month / 6-year grid logic intact.
  - Render future weekly/monthly/yearly card subtext as `'—'` so future cards visually match empty zero-usage cards (keeping localized future detail in hover popover).
- [ ] **`usage-colors.js`**:
  - Switch default `activeHeatPreset = 'blue'`, update `COLOR_SLOTS` defaults & refined `HEAT_PRESETS` ramps (§B.5), improve `detectHostTheme()` for standalone `light` classes, and render crisp SVGs inside `#btn-theme-tokens`.
- [ ] **`usage-i18n.js`**:
  - Add `tokens.badge.todayShort` & `tokens.badge.fullTitle`; remove chrome emojis and trailing summary colons across `zh-CN`, `zh-TW`, `en` (§B.6). Keep exact `tokens.title` values (`本机已记录用量` / `本機已記錄用量` / `Local Recorded Usage`).
- [ ] Syntax check plain JS files with `node --check <file>` or `ELECTRON_RUN_AS_NODE=1 /path/to/Antigravity --check <file>` (note: `usage-i18n.js`, `usage-colors.js`, `usage-heatmap.js`, `usage-dropdown.js` are fragments injected into `usage-panel-ui.js`, and `--check` validates standalone syntax cleanly). Do NOT touch `dist/`.

### B.9 Part B Acceptance Criteria
1. Titlebar badge `#badge-tokens` docks with `data-dock="flow"`, height `26px`, width ~`150px` (significantly tighter than `214px`), monochrome spark SVG, zero overlap with `More actions` / `Toggle Overview Panel` / `Toggle Side Panel`.
2. Panel uses Antigravity native font stack, neutral obsidian dark theme (`#121216` / `#18181D` / `#2F71E3`) and crisp light theme (`#FFFFFF` / `#F7F7F9` / `#2563EB`) with WCAG AA text contrast across all labels and controls.
3. Single unified toolbar row merges View (`Token Stats` / `API Est. Cost`) and Source (`All` / `Desktop` / `CLI`) segmented controls; 4 KPI stat cards and Token Activity heatmap appear immediately at the top of `Token Stats` view; switching to `API Est. Cost` promotes the expanded cost card cleanly.
4. All 4 stat cards maintain uniform single-line height with zero awkward cost wrapping.
5. 52-week heatmap grid fills the card width cleanly with **zero horizontal scrollbar** at standard desktop width, starts on the first active token date, and styles `.is-future` cells/cards identically to `data-level="0"` empty cells.
6. Zero chrome emojis, zero GitHub links/URLs, zero legacy removed IDs, all 3 languages (`zh-CN`, `zh-TW`, `en`) work cleanly, and all `tests/unified-ui.test.js` assertions pass after `@verifier-2` rebuilds `dist/`.
