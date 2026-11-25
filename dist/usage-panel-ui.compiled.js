(function (root) {
  'use strict';

  const SUITE_VERSION = '1.0.0';
  const USAGE_TEMPLATE_RAW = `<div id="ag-dock-row" class="ag-dock-row">
  <button id="badge-tokens" type="button" class="ag-unit ag-unit-tokens" aria-expanded="false" aria-label="Token 用量一览" data-i18n-aria="badge.tokens.aria">
    <span class="ag-tok-bolt" aria-hidden="true"><svg width="11" height="12" viewBox="0 0 12 14" fill="currentColor" aria-hidden="true"><path d="M7.2 1L1.5 8h4.2L4.8 13l5.7-7H6.3L7.2 1z"/></svg></span>
    <span class="ag-text" id="badge-tokens-text">Tokens --</span>
  </button>
</div>

<div id="panel-tokens" class="ag-panel" hidden role="dialog" aria-label="本机已记录用量" data-i18n-aria="tokens.title">
  <div class="panel-header">
    <div class="panel-title-group">
      <span class="panel-title">
        <svg width="13" height="14" viewBox="0 0 12 14" fill="currentColor" aria-hidden="true"><path d="M7.2 1L1.5 8h4.2L4.8 13l5.7-7H6.3L7.2 1z"/></svg>
        <span data-i18n="tokens.title">本机已记录用量</span>
      </span>
      <span id="tokens-meta" class="tokens-meta"></span>
    </div>
    <div class="panel-header-actions">
      <div class="ctx-lang-top-segmented" role="group" aria-label="插件面板语言" data-i18n-aria="settings.panelLang.aria">
        <button type="button" class="seg-btn is-active" id="btn-top-lang-zh-CN" data-lang="zh-CN">简</button>
        <button type="button" class="seg-btn" id="btn-top-lang-zh-TW" data-lang="zh-TW">繁</button>
        <button type="button" class="seg-btn" id="btn-top-lang-en" data-lang="en">EN</button>
      </div>
      <button id="btn-token-colors-top" type="button" class="panel-icon-btn" aria-pressed="false" aria-label="外观与调色设置" data-i18n-aria="header.palette.aria"><svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="8" cy="8" r="6"/><circle cx="6" cy="6.5" r="0.8" fill="currentColor"/><circle cx="10" cy="6.5" r="0.8" fill="currentColor"/><circle cx="8" cy="10" r="0.8" fill="currentColor"/></svg></button>
      <button id="btn-theme-tokens" type="button" class="panel-icon-btn" aria-label="切换浅色/深色主题" data-i18n-aria="header.theme.aria"><svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><circle cx="8" cy="8" r="5.5"/><path d="M8 2.5a5.5 5.5 0 0 1 0 11z" fill="currentColor" stroke="none"/></svg></button>
      <button id="btn-close-tokens" type="button" class="panel-icon-btn" aria-label="收起详情" data-i18n-aria="header.close.aria"><svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" aria-hidden="true"><line x1="4" y1="4" x2="12" y2="12"/><line x1="12" y1="4" x2="4" y2="12"/></svg></button>
    </div>
  </div>

  <div class="panel-body">
    <div class="panel-toolbar">
      <div class="token-view-bar" role="tablist">
        <button id="tok-view-tokens" type="button" class="source-pill active" data-tok-view="tokens" data-i18n="tokens.view.tokens">Token 统计</button>
        <button id="tok-view-cost" type="button" class="source-pill" data-tok-view="cost" data-i18n="tokens.view.cost">API 参考金额</button>
      </div>
      <div class="source-switch-bar" role="tablist">
        <span class="source-switch-label sr-only" data-i18n="tokens.sourceLabel">来源:</span>
        <button id="src-tab-all" type="button" class="source-pill active" data-source="all" data-i18n="tokens.src.all">全部</button>
        <button id="src-tab-desktop" type="button" class="source-pill" data-source="desktop" data-i18n="tokens.src.desktop">桌面端</button>
        <button id="src-tab-cli" type="button" class="source-pill" data-source="cli" data-i18n="tokens.src.cli">CLI</button>
      </div>
    </div>

    <div id="tokens-main-view">
      <div class="tokens-grid-4">
        <div class="t-card t-card-accent">
          <div class="t-label" data-i18n="tokens.card.total">累计处理 Token</div>
          <div id="t-total" class="t-val">—</div>
          <div id="t-total-sub" class="t-sub" data-i18n="tokens.card.includeCache">含缓存读取</div>
          <div id="t-total-cost" class="t-cost">≈ $0.00 · 日均 $0.00</div>
        </div>
        <div class="t-card">
          <div class="t-label" data-i18n="tokens.card.today">今日使用</div>
          <div id="t-today" class="t-val">—</div>
          <div id="t-today-sub" class="t-sub">—</div>
          <div id="t-today-cost" class="t-cost">≈ $0.00</div>
        </div>
        <div class="t-card">
          <div class="t-label" data-i18n="tokens.card.month">本月使用</div>
          <div id="t-month" class="t-val">—</div>
          <div id="t-month-sub" class="t-sub">—</div>
          <div id="t-month-cost" class="t-cost">≈ $0.00</div>
        </div>
        <div class="t-card">
          <div class="t-label" data-i18n="tokens.card.year">年度使用</div>
          <div id="t-year" class="t-val">—</div>
          <div id="t-year-sub" class="t-sub">—</div>
          <div id="t-year-cost" class="t-cost">≈ $0.00</div>
        </div>
      </div>

      <div class="heatmap-section">
        <div class="heatmap-header">
          <div class="heatmap-title-row">
            <span class="heatmap-title" data-i18n="tokens.heat.title">Token 活动</span>
            <div class="heatmap-nav">
              <button id="btn-heat-prev" type="button" class="mini-icon-btn" data-i18n-title="tokens.heat.prevTitle" title="上一个周期"><svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10 3.5L5.5 8 10 12.5"/></svg></button>
              <span id="heat-range-label" class="heat-range-label">—</span>
              <button id="btn-heat-next" type="button" class="mini-icon-btn" data-i18n-title="tokens.heat.nextTitle" title="下一个周期"><svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 3.5L10.5 8 6 12.5"/></svg></button>
            </div>
          </div>
          <div class="heatmap-tabs" role="tablist" data-i18n-aria="tokens.heat.tabsAria" aria-label="热力图时间维度">
            <button id="heat-tab-daily" type="button" class="mini-pill active" data-heat="daily" data-i18n="tokens.heat.daily">每天</button>
            <button id="heat-tab-weekly" type="button" class="mini-pill" data-heat="weekly" data-i18n="tokens.heat.weekly">每周</button>
            <button id="heat-tab-monthly" type="button" class="mini-pill" data-heat="monthly" data-i18n="tokens.heat.monthly">每月</button>
            <button id="heat-tab-yearly" type="button" class="mini-pill" data-heat="yearly" data-i18n="tokens.heat.yearly">今年</button>
            <button id="heat-tab-cum" type="button" class="mini-pill" data-heat="cum" data-i18n="tokens.heat.cum">累计总量</button>
          </div>
        </div>

        <div id="heatmap-summary" class="heatmap-summary">
          <div class="hs-item"><span class="hs-k" data-i18n="tokens.heat.sumTokens">区间合计</span><span id="hs-tokens" class="hs-v">—</span></div>
          <div class="hs-item"><span class="hs-k" data-i18n="tokens.heat.sumCost">预估费用</span><span id="hs-cost" class="hs-v">—</span></div>
          <div class="hs-item"><span class="hs-k" data-i18n="tokens.heat.sumDailyAvg">折合每天</span><span id="hs-daily-avg" class="hs-v">—</span></div>
          <div class="hs-item"><span class="hs-k" data-i18n="tokens.heat.sumActiveAvg">活跃日均</span><span id="hs-active-avg" class="hs-v">—</span></div>
          <div class="hs-item"><span class="hs-k" data-i18n="tokens.heat.sumSubRatio">订阅性价比</span><span id="hs-sub-ratio" class="hs-v">—</span></div>
        </div>

        <div id="heatmap-grid" class="heatmap-grid"></div>

        <div class="heatmap-footer">
          <span id="heat-first-use" class="heat-first-use" data-i18n="tokens.firstUseNone">首次使用：--</span>
          <div class="heatmap-legend" data-i18n-title="tokens.heat.legendTitle">
            <span data-i18n="tokens.heat.less">少</span>
            <button id="heat-leg-0" type="button" class="heat-leg-btn heat-cell" data-level="0" data-i18n-aria="tokens.heat.lvl0Aria" data-i18n-title="colors.lvl0Title"></button>
            <button id="heat-leg-1" type="button" class="heat-leg-btn heat-cell" data-level="1" data-i18n-aria="tokens.heat.lvl1Aria" data-i18n-title="colors.lvl1Title"></button>
            <button id="heat-leg-2" type="button" class="heat-leg-btn heat-cell" data-level="2" data-i18n-aria="tokens.heat.lvl2Aria" data-i18n-title="colors.lvl2Title"></button>
            <button id="heat-leg-3" type="button" class="heat-leg-btn heat-cell" data-level="3" data-i18n-aria="tokens.heat.lvl3Aria" data-i18n-title="colors.lvl3Title"></button>
            <button id="heat-leg-4" type="button" class="heat-leg-btn heat-cell" data-level="4" data-i18n-aria="tokens.heat.lvl4Aria" data-i18n-title="colors.lvl4Title"></button>
            <span data-i18n="tokens.heat.more">多</span>
          </div>
        </div>
        <div class="heatmap-tip-note" data-i18n="tokens.heat.tip">点击或悬浮格子查看当日详细 Token 构成</div>
        <div class="heatmap-disclaimer" data-i18n="tokens.heat.disclaimer">注：按日聚合按基础档估算，未拆分长上下文分档，结果偏下限。有逐请求记录时优先精确入账。</div>
      </div>
    </div>

    <div class="plan-cost-stack">
      <div id="cost-estimate-card" class="cost-estimate-card">
        <div class="cost-header">
          <div class="cost-header-left">
            <svg class="cost-title-icon" width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="8" cy="8" r="6"/><path d="M8 4.4v7.2"/><path d="M10.1 6.1c0-.9-.9-1.5-2.1-1.5s-2.1.6-2.1 1.5c0 1.9 4.2 1 4.2 3.1 0 .9-.9 1.6-2.1 1.6s-2.1-.6-2.1-1.6"/></svg>
            <span id="cost-title" class="cost-title" data-i18n="cost.title">本期 API 参考金额</span>
            <span id="cost-period-tag" class="cost-period-tag" data-i18n="cost.periodTag">本月自然月</span>
          </div>
          <div class="cost-header-right">
            <span id="cost-ref-total" class="cost-hero-val">≈ $0.00</span>
            <span class="cost-nonpaid-badge" data-i18n="cost.nonPaidBadge">API折算 · 非实付</span>
          </div>
        </div>
        <div class="cost-sub-row">
          <span id="cost-sub-spend-pill" class="cost-sub-spend-pill" data-i18n="cost.subUnknown">订阅实付：未填写</span>
          <div class="cost-sub-btns">
            <button id="btn-quick-edit-plan" type="button" class="link-btn" style="display:none" data-i18n="cost.btnFill">补充</button>
            <button id="btn-toggle-cost-details" type="button" class="link-btn" data-i18n="cost.btnExpand">详情 ▾</button>
          </div>
        </div>

        <div id="cost-details-body" class="cost-details-body" style="display:none">
          <div class="cost-controls-row">
            <div class="cost-ctrl-group">
              <span class="cost-ctrl-label" data-i18n="cost.scopeLabel">统计范围:</span>
              <div class="cost-ctrl-track">
                <button id="cost-scope-period" type="button" class="mini-pill active" data-i18n="cost.scopePeriod">本期</button>
                <button id="cost-scope-all" type="button" class="mini-pill" data-i18n="cost.scopeAll">全量历史</button>
              </div>
            </div>
            <div class="cost-ctrl-group">
              <span class="cost-ctrl-label" data-i18n="cost.modeLabel">估值模式:</span>
              <div class="cost-ctrl-track">
                <button id="cost-mode-ref" type="button" class="mini-pill active" data-i18n="cost.modeRef">参考模型估算</button>
                <button id="cost-mode-hybrid" type="button" class="mini-pill" data-i18n="cost.modeHybrid">混合模式</button>
                <button id="cost-mode-identified" type="button" class="mini-pill" data-i18n="cost.modeIdentified">仅已识别模型</button>
              </div>
            </div>
          </div>
          <div class="cost-cards-grid">
            <div class="cost-mini-card">
              <span class="cm-label" data-i18n="cost.card.input">输入 Token</span>
              <span id="cost-card-input" class="cm-val">$0.00</span>
              <span id="cost-card-input-tok" class="cm-sub">0 tok</span>
            </div>
            <div class="cost-mini-card">
              <span class="cm-label" data-i18n="cost.card.cache">缓存读取 (优惠)</span>
              <span id="cost-card-cache" class="cm-val">$0.00</span>
              <span id="cost-card-cache-tok" class="cm-sub">0 tok</span>
            </div>
            <div class="cost-mini-card">
              <span class="cm-label" data-i18n="cost.card.output">输出 Token</span>
              <span id="cost-card-output" class="cm-val">$0.00</span>
              <span id="cost-card-output-tok" class="cm-sub">0 tok</span>
            </div>
          </div>
          <div id="cost-coverage-note" class="cost-note-line" data-i18n="cost.analyzing">正在分析请求模型与计价覆盖率…</div>
          <div id="cost-usage-summary-line" class="cost-note-line"></div>
          <div id="cost-diff-box" class="cost-diff-box"></div>
          <div id="cost-sub-spend-line" class="cost-note-line"></div>
          <div id="cost-model-breakdown" class="cost-model-breakdown"></div>
          <div class="cost-disclaimer" data-i18n="cost.disclaimer">注：此折算反映按公开零售价调用同等资源之费用，包月订阅/活动赠送与 API 零售非同类计费模式，该差额不等于真实节省现金；缓存读取按 10% 优惠计价；不含缓存存储费与搜索落地费用。</div>
        </div>
      </div>

      <div id="plan-summary-bar" class="plan-summary-bar">
        <div class="plan-summary-main">
          <span id="plan-summary-tier" class="plan-tier-badge">—</span>
          <span id="plan-summary-account" class="plan-account-text"></span>
        </div>
        <div class="plan-summary-right">
          <span id="plan-summary-price-badge" class="plan-price-badge" data-i18n-title="plan.summary.priceBadgeTitle"></span>
          <span id="plan-summary-source-pill" class="plan-source-pill"></span>
          <button id="btn-toggle-plan-detail" type="button" class="link-btn" data-i18n="plan.detail.toggleOpen">详情 ▾</button>
        </div>
      </div>

      <div id="plan-detail-card" class="plan-detail-card" hidden>
        <div class="plan-detail-header">
          <span data-i18n="plan.detail.title">AI 订阅与额度详情</span>
          <span id="plan-save-feedback" class="plan-save-feedback" style="display:none"></span>
        </div>
        <div class="plan-detail-grid">
          <div class="plan-detail-row"><span class="p-dt-k" data-i18n="plan.dt.plan">当前套餐：</span><span id="dt-plan-name" class="p-dt-v">—</span></div>
          <div class="plan-detail-row"><span class="p-dt-k" data-i18n="plan.dt.account">当前账号：</span><span id="dt-account-email" class="p-dt-v">—</span></div>
          <div class="plan-detail-row">
            <span class="p-dt-k" data-i18n="plan.dt.country">账号所在地区：</span>
            <div class="p-dt-ctrl">
              <div id="direct-country-wrap" class="ag-dropdown-wrapper">
                <button id="direct-country-trigger" type="button" class="ag-dropdown-trigger" data-i18n-title="plan.country.title">
                  <span id="direct-country-label" class="ag-dropdown-label">🌐 未设置 / 自动</span>
                  <span class="ag-dropdown-caret">▾</span>
                </button>
                <div id="direct-country-menu" class="ag-dropdown-menu"></div>
              </div>
              <select id="direct-country-select" class="ag-native-select-hidden" aria-hidden="true"></select>
            </div>
          </div>
          <div class="plan-detail-row">
            <span class="p-dt-k" data-i18n="plan.dt.region">订阅国家：</span>
            <div class="p-dt-ctrl">
              <div id="direct-region-wrap" class="ag-dropdown-wrapper">
                <button id="direct-region-trigger" type="button" class="ag-dropdown-trigger" data-i18n-title="plan.region.title">
                  <span id="direct-region-label" class="ag-dropdown-label">🌏 未知</span>
                  <span class="ag-dropdown-caret">▾</span>
                </button>
                <div id="direct-region-menu" class="ag-dropdown-menu"></div>
              </div>
            </div>
          </div>
          <div class="plan-detail-row">
            <span class="p-dt-k" data-i18n="plan.dt.currency">订阅币种：</span>
            <div class="p-dt-ctrl">
              <div id="direct-currency-wrap" class="ag-dropdown-wrapper">
                <button id="direct-currency-trigger" type="button" class="ag-dropdown-trigger" data-i18n-aria="plan.currency.aria" data-i18n-title="plan.currency.title">
                  <span id="direct-currency-label" class="ag-dropdown-label">USD ($)</span>
                  <span class="ag-dropdown-caret">▾</span>
                </button>
                <div id="direct-currency-menu" class="ag-dropdown-menu"></div>
              </div>
              <select id="direct-currency-select" class="ag-native-select-hidden" aria-hidden="true"></select>
            </div>
          </div>
          <div class="plan-detail-row"><span class="p-dt-k" data-i18n="plan.dt.acq">获取方式：</span><span id="dt-acq-source" class="p-dt-v">—</span></div>
          <div class="plan-detail-row">
            <span class="p-dt-k" data-i18n="plan.dt.price">计费周期与价格：</span>
            <div class="p-dt-v p-dt-price-wrap">
              <span id="dt-price-text">—</span>
              <span id="plan-price-mode-bar" class="plan-price-mode-bar">
                <button id="btn-price-mode-preset" type="button" class="mini-mode-btn active" data-i18n="plan.price.modePreset">跟随参考价</button>
                <button id="btn-price-mode-custom" type="button" class="mini-mode-btn" data-i18n="plan.price.modeCustom">自定义实付</button>
              </span>
            </div>
          </div>
          <div id="row-validity" class="plan-detail-row" style="display:none"><span class="p-dt-k" data-i18n="plan.dt.validity">权益有效期：</span><span id="dt-validity-text" class="p-dt-v"></span></div>
          <div id="row-note" class="plan-detail-row" style="display:none"><span class="p-dt-k" data-i18n="plan.dt.note">补充备注：</span><span id="dt-note-text" class="p-dt-v"></span></div>
          <div id="row-prompt-credits" class="plan-detail-row" style="display:none"><span class="p-dt-k" data-i18n="plan.dt.promptCredits">Prompt 额度池：</span><span id="dt-prompt-credits" class="p-dt-v"></span></div>
          <div id="row-flow-credits" class="plan-detail-row" style="display:none"><span class="p-dt-k" data-i18n="plan.dt.flowCredits">Flow 额度池：</span><span id="dt-flow-credits" class="p-dt-v"></span></div>
          <div class="plan-detail-row"><span class="p-dt-k" data-i18n="plan.dt.updated">状态更新时间：</span><span id="dt-updated-at" class="p-dt-v">—</span></div>
        </div>

        <div class="plan-detail-footer">
          <button id="btn-edit-plan-custom" type="button" class="ag-btn ag-btn-sm" data-i18n="plan.btn.editCustom">自定义订阅设置</button>
        </div>

        <form id="plan-custom-form" class="plan-custom-form" hidden>
          <div class="plan-form-title" data-i18n="plan.form.title">设置当前账号订阅信息</div>
          <div class="plan-form-grid">
            <label class="pf-field">
              <span data-i18n="plan.form.acqLabel">获取方式 / 活动来源</span>
              <select id="select-acq-source" class="pf-input"></select>
            </label>
            <label id="wrap-acq-custom" class="pf-field" style="display:none">
              <span data-i18n="plan.form.acqCustomLabel">自定义活动 / 合作方名称</span>
              <input id="input-acq-custom" type="text" class="pf-input" data-i18n-placeholder="plan.form.acqCustomPh" placeholder="选填，如 Pixel 11 Pro 赠送" />
            </label>
            <label class="pf-check">
              <input id="check-zero-extra" type="checkbox" />
              <span data-i18n="plan.form.zeroExtra">本权益期间无需另付订阅费</span>
            </label>
            <label class="pf-field">
              <span data-i18n="plan.form.presetLabel">预设订阅国家与汇率 (可选快捷套用)</span>
              <select id="select-region-preset" class="pf-input"></select>
            </label>
            <label class="pf-field">
              <span data-i18n="plan.form.countryLabel">账号所在地区 (仅本地记录)</span>
              <input id="input-custom-country" type="text" class="pf-input" data-i18n-placeholder="plan.form.countryPh" placeholder="例如：美国 (US)" />
            </label>
            <label class="pf-field">
              <span data-i18n="plan.form.regionLabel">订阅国家 (购买/结算地区)</span>
              <input id="input-custom-region" type="text" class="pf-input" data-i18n-placeholder="plan.form.regionPh" placeholder="例如：韩国 / 澳大利亚" />
              <span id="region-cny-preview" class="pf-hint"></span>
            </label>
            <div class="pf-field">
              <span data-i18n="plan.form.currencyLabel">订阅币种与实付金额</span>
              <div class="pf-inline-pair">
                <select id="select-custom-currency" class="pf-input"></select>
                <input id="input-custom-paid" type="number" step="0.01" min="0" class="pf-input" data-i18n-placeholder="plan.form.paidPh" placeholder="实付金额" />
              </div>
            </div>
            <label class="pf-field">
              <span data-i18n="plan.form.cycleLabel">计费周期</span>
              <select id="select-custom-cycle" class="pf-input"></select>
            </label>
            <label class="pf-field">
              <span data-i18n="plan.form.validEndLabel">权益到期日</span>
              <input id="input-custom-valid-end" type="date" class="pf-input" />
            </label>
            <label class="pf-field pf-field-wide">
              <span data-i18n="plan.form.noteLabel">补充说明备注</span>
              <input id="input-custom-note" type="text" class="pf-input" data-i18n-placeholder="plan.form.notePh" placeholder="例如：Pixel 11 Pro 赠送 6 个月 / 家庭拼车" />
            </label>
          </div>
          <div class="plan-form-actions">
            <button id="btn-clear-plan-custom" type="button" class="ag-btn ag-btn-danger" data-i18n="plan.form.clear">清除自定义</button>
            <div class="plan-form-actions-right">
              <button id="btn-cancel-plan-custom" type="button" class="ag-btn" data-i18n="plan.form.cancel">取消</button>
              <button id="btn-save-plan-custom" type="button" class="ag-btn ag-btn-primary" data-i18n="plan.form.save">保存</button>
            </div>
          </div>
        </form>
      </div>
    </div>

    <div id="token-color-drawer" class="tech-drawer">
      <button id="btn-toggle-token-colors" type="button" class="drawer-toggle-btn" aria-expanded="false">
        <span class="drawer-title-wrap">
          <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="8" cy="8" r="6"/><circle cx="6" cy="6.5" r="0.8" fill="currentColor"/><circle cx="10" cy="6.5" r="0.8" fill="currentColor"/><circle cx="8" cy="10" r="0.8" fill="currentColor"/></svg>
          <span data-i18n="tokens.colors.title">热力图色阶与外观设置</span>
        </span>
        <span class="drawer-chevron" data-i18n="drawer.expandSettings">展开 ▾</span>
      </button>
      <div id="token-color-drawer-body" class="drawer-body" hidden>
        <div id="heat-preset-group" class="color-preset-group">
          <span class="cp-grp-label" data-i18n="tokens.heat.presetLabel">5 档色阶预设：</span>
          <button type="button" class="mini-pill" data-heat-preset="blue" data-i18n="tokens.heat.presetBlue">蓝色系</button>
          <button type="button" class="mini-pill" data-heat-preset="purple" data-i18n="tokens.heat.presetPurple">紫色系</button>
          <button type="button" class="mini-pill" data-heat-preset="green" data-i18n="tokens.heat.presetGreen">绿色系</button>
          <button type="button" class="mini-pill" data-heat-preset="yellow" data-i18n="tokens.heat.presetYellow">黄色系</button>
          <button type="button" class="mini-pill" data-heat-preset="red" data-i18n="tokens.heat.presetRed">红色系</button>
        </div>
        <div class="color-sub-title" data-i18n="tokens.heat.customTitle">5 档逐格独立自定义（点击任意一格或图例「少 ▢▢▢▢▢ 多」单独调色，可设 5 种不同颜色）：</div>
        <div class="color-grid">
          <div class="color-row">
            <span data-i18n="tokens.heat.lvl0">1档 · 少/无</span>
            <div class="color-ctrl">
              <button id="swatch-heatLvl0" type="button" class="color-swatch-btn" data-color-slot="heatLvl0" data-color-label="色阶第 1 档" data-i18n-aria="tokens.heat.lvl0Aria" data-i18n-data-color-label="tokens.heat.lvl0Swatch" data-i18n-title="colors.swatchTitle"></button>
              <button id="reset-heatLvl0" type="button" class="mini-reset-btn" data-i18n="colors.btn.preset">预设</button>
            </div>
          </div>
          <div class="color-row">
            <span data-i18n="tokens.heat.lvl1">2档 · 低</span>
            <div class="color-ctrl">
              <button id="swatch-heatLvl1" type="button" class="color-swatch-btn" data-color-slot="heatLvl1" data-color-label="色阶第 2 档" data-i18n-aria="tokens.heat.lvl1Aria" data-i18n-data-color-label="tokens.heat.lvl1Swatch" data-i18n-title="colors.swatchTitle"></button>
              <button id="reset-heatLvl1" type="button" class="mini-reset-btn" data-i18n="colors.btn.preset">预设</button>
            </div>
          </div>
          <div class="color-row">
            <span data-i18n="tokens.heat.lvl2">3档 · 中</span>
            <div class="color-ctrl">
              <button id="swatch-heatLvl2" type="button" class="color-swatch-btn" data-color-slot="heatLvl2" data-color-label="色阶第 3 档" data-i18n-aria="tokens.heat.lvl2Aria" data-i18n-data-color-label="tokens.heat.lvl2Swatch" data-i18n-title="colors.swatchTitle"></button>
              <button id="reset-heatLvl2" type="button" class="mini-reset-btn" data-i18n="colors.btn.preset">预设</button>
            </div>
          </div>
          <div class="color-row">
            <span data-i18n="tokens.heat.lvl3">4档 · 高</span>
            <div class="color-ctrl">
              <button id="swatch-heatLvl3" type="button" class="color-swatch-btn" data-color-slot="heatLvl3" data-color-label="色阶第 4 档" data-i18n-aria="tokens.heat.lvl3Aria" data-i18n-data-color-label="tokens.heat.lvl3Swatch" data-i18n-title="colors.swatchTitle"></button>
              <button id="reset-heatLvl3" type="button" class="mini-reset-btn" data-i18n="colors.btn.preset">预设</button>
            </div>
          </div>
          <div class="color-row">
            <span data-i18n="tokens.heat.lvl4">5档 · 多/峰</span>
            <div class="color-ctrl">
              <button id="swatch-heatLvl4" type="button" class="color-swatch-btn" data-color-slot="heatLvl4" data-color-label="色阶第 5 档" data-i18n-aria="tokens.heat.lvl4Aria" data-i18n-data-color-label="tokens.heat.lvl4Swatch" data-i18n-title="colors.swatchTitle"></button>
              <button id="reset-heatLvl4" type="button" class="mini-reset-btn" data-i18n="colors.btn.preset">预设</button>
            </div>
          </div>
          <div class="color-row">
            <span data-i18n="tokens.heat.lowEnd">色阶「少」端颜色（自动插值）</span>
            <div class="color-ctrl">
              <button id="swatch-heatLow" type="button" class="color-swatch-btn" data-color-slot="heatLow" data-color-label="色阶少端" data-i18n-data-color-label="tokens.heat.lowEndSwatch" data-i18n-title="colors.swatchTitle"></button>
              <button id="reset-heatLow" type="button" class="mini-reset-btn" data-i18n="colors.btn.restorePreset">恢复预设</button>
            </div>
          </div>
          <div class="color-row">
            <span data-i18n="tokens.heat.highEnd">色阶「多」端颜色（自动插值）</span>
            <div class="color-ctrl">
              <button id="swatch-heatHigh" type="button" class="color-swatch-btn" data-color-slot="heatHigh" data-color-label="色阶多端" data-i18n-data-color-label="tokens.heat.highEndSwatch" data-i18n-title="colors.swatchTitle"></button>
              <button id="reset-heatHigh" type="button" class="mini-reset-btn" data-i18n="colors.btn.restorePreset">恢复预设</button>
            </div>
          </div>
          <div class="color-row">
            <span data-i18n="tokens.heat.panelBg">面板与菜单统一背景色</span>
            <div class="color-ctrl">
              <button id="swatch-panelBg-tokens" type="button" class="color-swatch-btn" data-color-slot="panelBg" data-color-label="面板背景色" data-i18n-data-color-label="colors.panelBgSwatch" data-i18n-title="colors.swatchTitle"></button>
              <button id="reset-panelBg-tokens" type="button" class="mini-reset-btn" data-i18n="tokens.colors.followTheme">跟随主题</button>
            </div>
          </div>
          <div class="color-row">
            <span data-i18n="tokens.heat.accentColors">累计与强调指标色</span>
            <div class="color-ctrl">
              <button id="swatch-tokenTotal-tokens" type="button" class="color-swatch-btn" data-color-slot="tokenTotal" data-color-label="累计 Token" data-i18n-data-color-label="tokens.heat.totalSwatch" data-i18n-title="colors.swatchTitle"></button>
              <button id="swatch-tokenAccent-tokens" type="button" class="color-swatch-btn" data-color-slot="tokenAccent" data-color-label="Token 强调色" data-i18n-data-color-label="tokens.heat.accentSwatch" data-i18n-title="colors.swatchTitle"></button>
            </div>
          </div>
        </div>
        <div class="color-footer-actions">
          <button id="reset-heat-lvls" type="button" class="ag-btn ag-btn-sm" data-i18n="tokens.heat.resetLvls">恢复 5 档预设</button>
          <button id="reset-all-colors-tokens" type="button" class="ag-btn ag-btn-sm" data-i18n="settings.colors.resetAll">全部恢复跟随主题</button>
        </div>
      </div>
    </div>
  </div>
</div>

<div id="color-picker-popover" class="color-picker-popover" hidden role="dialog" aria-label="颜色选取器">
  <div class="cp-header">
    <span class="cp-title"><span data-i18n="cp.title">颜色选取器</span> <span id="cp-target-name" class="cp-target-name"></span></span>
    <button id="btn-cp-close" type="button" class="panel-icon-btn" aria-label="关闭调色器" data-i18n-aria="cp.closeAria"><svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" aria-hidden="true"><line x1="4" y1="4" x2="12" y2="12"/><line x1="12" y1="4" x2="4" y2="12"/></svg></button>
  </div>
  <div class="cp-sv-row">
    <div id="cp-sv-area" class="cp-sv-area">
      <div class="cp-sv-white"></div>
      <div class="cp-sv-black"></div>
      <div id="cp-sv-thumb" class="cp-sv-thumb"></div>
    </div>
    <div class="cp-side-col">
      <div id="cp-side-preview" class="cp-side-preview"></div>
      <button id="btn-cp-eyedropper" type="button" class="ag-btn ag-btn-sm" data-i18n-title="cp.eyedropperTitle"><svg width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12.8 3.2a1.6 1.6 0 0 0-2.3 0L8.8 4.9 7.6 3.7 6.5 4.8l1.2 1.2-4.4 4.4-.8 2.8 2.8-.8 4.4-4.4 1.2 1.2 1.1-1.1-1.2-1.2 1.7-1.7a1.6 1.6 0 0 0 0-2.3z"/></svg><span data-i18n="cp.eyedropper">取色</span></button>
    </div>
  </div>
  <div id="cp-hue-wrap" class="cp-hue-wrap">
    <div id="cp-hue-thumb" class="cp-hue-thumb"></div>
  </div>
  <div class="cp-inputs">
    <div class="cp-input-row">
      <label for="cp-input-hex">HEX</label>
      <input id="cp-input-hex" type="text" class="cp-input" spellcheck="false" data-i18n-aria="cp.hexAria" />
      <button id="btn-cp-copy-hex" type="button" class="mini-reset-btn" data-i18n-title="cp.copyHex"><svg width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="5.5" y="5.5" width="7.5" height="7.5" rx="1.5"/><path d="M3 10.5V4a1 1 0 0 1 1-1h6.5"/></svg></button>
    </div>
    <details class="cp-advanced">
      <summary data-i18n="cp.moreFormats">更多格式 (RGB / HSL)</summary>
      <div id="cp-advanced-body" class="cp-advanced-body">
        <div class="cp-input-row">
          <label for="cp-input-rgb">RGB</label>
          <input id="cp-input-rgb" type="text" class="cp-input" spellcheck="false" data-i18n-aria="cp.rgbAria" />
          <button id="btn-cp-copy-rgb" type="button" class="mini-reset-btn" data-i18n-title="cp.copyRgb"><svg width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="5.5" y="5.5" width="7.5" height="7.5" rx="1.5"/><path d="M3 10.5V4a1 1 0 0 1 1-1h6.5"/></svg></button>
        </div>
        <div class="cp-input-row">
          <label for="cp-input-hsl">HSL</label>
          <input id="cp-input-hsl" type="text" class="cp-input" spellcheck="false" data-i18n-aria="cp.hslAria" />
          <button id="btn-cp-copy-hsl" type="button" class="mini-reset-btn" data-i18n-title="cp.copyHsl"><svg width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="5.5" y="5.5" width="7.5" height="7.5" rx="1.5"/><path d="M3 10.5V4a1 1 0 0 1 1-1h6.5"/></svg></button>
        </div>
      </div>
    </details>
    <div id="cp-feedback" class="cp-feedback" data-i18n="cp.hint">支持直接输入或粘贴 HEX 色值</div>
  </div>
  <div class="cp-actions">
    <button id="cp-reset-slot" type="button" class="ag-btn ag-btn-sm" data-i18n="cp.followTheme">跟随主题</button>
    <button id="reset-all-colors" type="button" class="ag-btn ag-btn-sm" data-i18n="settings.colors.resetAll">全部恢复跟随主题</button>
  </div>
</div>

<div id="heat-pop" class="heat-pop" hidden></div>
`;
  const USAGE_STYLES_RAW = `:host {
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
  --ag-accent: #10b981;
  --ag-accent-text: #34d399;
  --ag-accent-soft: rgba(16, 185, 129, 0.16);
  --ag-token-total: #34d399;
  --ag-token-accent: #10b981;
  --ag-danger: #f87171;
  --ag-warning: #fbbf24;
  --ag-success: #34d399;
  --ag-heat-0: rgba(255, 255, 255, 0.055);
  --ag-heat-1: #064e3b;
  --ag-heat-2: #047857;
  --ag-heat-3: #10b981;
  --ag-heat-4: #4ade80;
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
  --ag-accent: #059669;
  --ag-accent-text: #047857;
  --ag-accent-soft: rgba(5, 150, 105, 0.10);
  --ag-token-total: #059669;
  --ag-token-accent: #047857;
  --ag-danger: #dc2626;
  --ag-warning: #d97706;
  --ag-success: #059669;
  --ag-heat-0: #eaecef;
  --ag-heat-1: #d1fae5;
  --ag-heat-2: #6ee7b7;
  --ag-heat-3: #10b981;
  --ag-heat-4: #047857;
  --ag-shadow: 0 14px 36px rgba(15, 23, 42, 0.14), 0 0 0 1px rgba(15, 23, 42, 0.05);
  --ag-shadow-sm: 0 1px 2px rgba(15, 23, 42, 0.08);
}

:host([data-dock="flow"]) {
  display: inline-flex;
  align-items: center;
  vertical-align: middle;
  position: relative;
  z-index: 200;
  margin-right: 6px;
  flex: 0 0 auto;
  -webkit-app-region: no-drag;
}

:host([data-dock="floating"]) {
  position: fixed;
  top: 6px;
  right: 12px;
  z-index: 2147483000;
  display: inline-flex;
  align-items: center;
}

*, *::before, *::after {
  box-sizing: border-box;
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

/* Thin custom scrollbars */
.panel-body::-webkit-scrollbar,
.heatmap-grid::-webkit-scrollbar,
.ag-dropdown-list-container::-webkit-scrollbar {
  width: 5px;
  height: 5px;
}

.panel-body::-webkit-scrollbar-track,
.heatmap-grid::-webkit-scrollbar-track,
.ag-dropdown-list-container::-webkit-scrollbar-track {
  background: transparent;
}

.panel-body::-webkit-scrollbar-thumb,
.heatmap-grid::-webkit-scrollbar-thumb,
.ag-dropdown-list-container::-webkit-scrollbar-thumb {
  background: var(--ag-border-strong);
  border-radius: 9999px;
}

.panel-body::-webkit-scrollbar-thumb:hover,
.heatmap-grid::-webkit-scrollbar-thumb:hover,
.ag-dropdown-list-container::-webkit-scrollbar-thumb:hover {
  background: var(--ag-text-muted);
}

/* Titlebar Dock & Compact Badge */
.ag-dock-row {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.ag-unit {
  appearance: none;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  height: 26px;
  padding: 0 10px;
  border-radius: var(--ag-radius-pill);
  border: 1px solid var(--ag-border);
  background: var(--ag-surface-subtle);
  color: var(--ag-text);
  font-family: var(--ag-font);
  font-size: 11.5px;
  font-weight: 450;
  line-height: 1;
  cursor: pointer;
  white-space: nowrap;
  user-select: none;
  -webkit-app-region: no-drag;
  transition: background-color 0.14s ease, border-color 0.14s ease, color 0.14s ease;
}

.ag-unit:hover {
  background: var(--ag-surface-hover);
  border-color: var(--ag-border-strong);
  color: var(--ag-text-bright);
}

.ag-unit[aria-expanded="true"] {
  background: var(--ag-accent-soft);
  border-color: var(--ag-accent);
  color: var(--ag-text-bright);
}

.ag-tok-bolt {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: var(--ag-accent-text);
  flex-shrink: 0;
}

.ag-text {
  display: inline-flex;
  align-items: center;
  font-variant-numeric: tabular-nums;
}

.ag-badge-today {
  color: var(--ag-text-bright);
  font-weight: 500;
}

.ag-badge-sep {
  color: var(--ag-text-muted);
  opacity: 0.55;
  white-space: pre;
}

.ag-badge-total {
  color: var(--ag-text-muted);
  font-weight: 400;
}

/* Panel Shell */
.ag-panel {
  position: fixed;
  z-index: 2147483640;
  background: var(--ag-surface);
  color: var(--ag-text);
  border: 1px solid var(--ag-border-strong);
  border-radius: var(--ag-radius-panel);
  box-shadow: var(--ag-shadow);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  -webkit-app-region: no-drag;
  transition: opacity 0.15s ease, transform 0.15s ease;
}

.ag-panel[hidden] {
  display: none !important;
}

.ag-panel.is-opening,
.ag-panel.is-closing {
  opacity: 0;
  transform: translateY(-4px) scale(0.99);
}

#panel-tokens {
  width: min(660px, calc(100vw - 24px));
  max-height: calc(100vh - 56px);
}

#panel-tokens.cost-compact-view {
  width: min(560px, calc(100vw - 24px));
}

/* Panel Header (44px compact) */
.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  min-height: 44px;
  padding: 9px 14px;
  border-bottom: 1px solid var(--ag-border);
  background: var(--ag-surface);
  flex-shrink: 0;
}

.panel-title-group {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.panel-title {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 600;
  letter-spacing: -0.01em;
  color: var(--ag-text-bright);
  white-space: nowrap;
}

.panel-title svg {
  color: var(--ag-accent-text);
  flex-shrink: 0;
}

.tokens-meta {
  font-size: 10.5px;
  font-weight: 450;
  color: var(--ag-text-muted);
  background: var(--ag-surface-subtle);
  padding: 2px 7px;
  border-radius: var(--ag-radius-pill);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-variant-numeric: tabular-nums;
}

.tokens-meta:empty {
  display: none;
}

.panel-header-actions {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
}

.ctx-lang-top-segmented {
  display: inline-flex;
  align-items: center;
  gap: 1px;
  padding: 2px;
  border-radius: var(--ag-radius-control);
  border: 1px solid var(--ag-border);
  background: var(--ag-surface-subtle);
}

.ctx-lang-top-segmented .seg-btn {
  appearance: none;
  border: none;
  background: transparent;
  color: var(--ag-text-muted);
  font-family: inherit;
  font-size: 10.5px;
  font-weight: 500;
  padding: 3px 7px;
  border-radius: var(--ag-radius-sm);
  cursor: pointer;
  line-height: 1.2;
  transition: background-color 0.14s ease, color 0.14s ease, box-shadow 0.14s ease;
}

.ctx-lang-top-segmented .seg-btn:hover {
  color: var(--ag-text-bright);
}

.ctx-lang-top-segmented .seg-btn.is-active {
  background: var(--ag-surface-active);
  color: var(--ag-text-bright);
  box-shadow: var(--ag-shadow-sm);
}

.panel-icon-btn {
  appearance: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  padding: 0;
  border-radius: var(--ag-radius-control);
  border: 1px solid transparent;
  background: transparent;
  color: var(--ag-text-muted);
  font-family: inherit;
  font-size: 12px;
  cursor: pointer;
  transition: background-color 0.14s ease, color 0.14s ease, border-color 0.14s ease;
}

.panel-icon-btn:hover {
  background: var(--ag-surface-hover);
  color: var(--ag-text-bright);
}

.panel-icon-btn[aria-pressed="true"] {
  background: var(--ag-accent-soft);
  border-color: var(--ag-accent);
  color: var(--ag-accent-text);
}

/* Panel Body & Unified Toolbar */
.panel-body {
  padding: 12px 14px 14px;
  overflow-y: auto;
  overflow-x: hidden;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.panel-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  flex-wrap: wrap;
}

.token-view-bar,
.source-switch-bar {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  padding: 2px;
  border-radius: 8px;
  border: 1px solid var(--ag-border);
  background: var(--ag-surface-subtle);
}

.source-pill {
  appearance: none;
  border: 1px solid transparent;
  background: transparent;
  color: var(--ag-text-muted);
  font-family: inherit;
  font-size: 11.5px;
  font-weight: 500;
  padding: 4px 10px;
  border-radius: 6px;
  cursor: pointer;
  line-height: 1.2;
  transition: background-color 0.14s ease, color 0.14s ease, border-color 0.14s ease, box-shadow 0.14s ease;
}

.source-pill:hover {
  color: var(--ag-text-bright);
}

.source-pill.active {
  background: var(--ag-surface-active);
  color: var(--ag-text-bright);
  border-color: var(--ag-border);
  box-shadow: var(--ag-shadow-sm);
}

.mini-pill {
  appearance: none;
  border: 1px solid var(--ag-border);
  background: var(--ag-surface-subtle);
  color: var(--ag-text-muted);
  font-family: inherit;
  font-size: 10.5px;
  font-weight: 500;
  padding: 3px 9px;
  border-radius: var(--ag-radius-pill);
  cursor: pointer;
  line-height: 1.25;
  transition: background-color 0.14s ease, color 0.14s ease, border-color 0.14s ease, box-shadow 0.14s ease;
}

.mini-pill:hover {
  background: var(--ag-surface-hover);
  color: var(--ag-text-bright);
}

.mini-pill.active {
  background: var(--ag-accent-soft);
  border-color: var(--ag-accent);
  color: var(--ag-accent-text);
}

/* Main View Container & Plan/Cost Stack */
#tokens-main-view {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.plan-cost-stack {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

/* Links & Buttons */
.link-btn {
  appearance: none;
  border: none;
  background: transparent;
  color: var(--ag-accent-text);
  font-family: inherit;
  font-size: 11px;
  font-weight: 500;
  padding: 2px 5px;
  border-radius: var(--ag-radius-sm);
  cursor: pointer;
  transition: background-color 0.14s ease, color 0.14s ease;
}

.link-btn:hover {
  background: var(--ag-accent-soft);
  text-decoration: none;
}

.ag-btn {
  appearance: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  border: 1px solid var(--ag-border);
  background: var(--ag-surface-subtle);
  color: var(--ag-text);
  font-family: inherit;
  font-size: 11.5px;
  font-weight: 500;
  padding: 5px 10px;
  border-radius: var(--ag-radius-control);
  cursor: pointer;
  transition: background-color 0.14s ease, border-color 0.14s ease, color 0.14s ease;
}

.ag-btn:hover {
  background: var(--ag-surface-hover);
  border-color: var(--ag-border-strong);
  color: var(--ag-text-bright);
}

.ag-btn-sm {
  padding: 4px 9px;
  font-size: 11px;
}

.ag-btn-primary {
  background: var(--ag-accent);
  border-color: var(--ag-accent);
  color: #ffffff;
}

.ag-btn-primary:hover {
  opacity: 0.92;
  background: var(--ag-accent);
  border-color: var(--ag-accent);
  color: #ffffff;
}

.ag-btn-danger {
  border-color: rgba(248, 113, 113, 0.35);
  color: var(--ag-danger);
}

.ag-btn-danger:hover {
  background: rgba(248, 113, 113, 0.12);
  border-color: rgba(248, 113, 113, 0.5);
  color: var(--ag-danger);
}

/* 4 Stat Cards (KPI Row) */
.tokens-grid-4 {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 8px;
}

.t-card {
  padding: 11px 12px;
  border-radius: var(--ag-radius-card);
  border: 1px solid var(--ag-border);
  background: var(--ag-surface-card);
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 0;
  transition: border-color 0.15s ease;
}

.t-card:hover {
  border-color: var(--ag-border-strong);
}

.t-card-accent {
  border-top: 2px solid var(--ag-token-total);
  padding-top: 10px;
}

.t-card-accent .t-val {
  color: var(--ag-token-total);
}

.t-label {
  font-size: 11px;
  font-weight: 500;
  color: var(--ag-text-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.t-val {
  font-size: 19px;
  font-weight: 650;
  letter-spacing: -0.02em;
  line-height: 1.15;
  color: var(--ag-text-bright);
  font-variant-numeric: tabular-nums;
  margin: 2px 0 1px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.t-sub {
  font-size: 10.5px;
  color: var(--ag-text-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.t-cost {
  font-size: 10.5px;
  font-weight: 500;
  color: var(--ag-token-accent);
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Heatmap Section */
.heatmap-section {
  padding: 12px 14px;
  border-radius: var(--ag-radius-card);
  border: 1px solid var(--ag-border);
  background: var(--ag-surface-card);
  display: flex;
  flex-direction: column;
  gap: 9px;
}

.heatmap-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  flex-wrap: wrap;
}

.heatmap-title-row,
.heatmap-nav {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.heatmap-title {
  font-size: 12.5px;
  font-weight: 600;
  color: var(--ag-text-bright);
  letter-spacing: -0.01em;
}

.heat-range-label {
  font-size: 11px;
  color: var(--ag-text-muted);
  font-variant-numeric: tabular-nums;
  min-width: 68px;
  text-align: center;
  white-space: nowrap;
}

.mini-icon-btn {
  appearance: none;
  width: 22px;
  height: 22px;
  padding: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  border: 1px solid transparent;
  background: transparent;
  color: var(--ag-text-muted);
  cursor: pointer;
  transition: background-color 0.14s ease, color 0.14s ease;
}

.mini-icon-btn:hover:not(:disabled) {
  background: var(--ag-surface-hover);
  color: var(--ag-text-bright);
}

.mini-icon-btn:disabled {
  opacity: 0.32;
  cursor: not-allowed;
}

.heatmap-tabs {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  padding: 2px;
  border-radius: var(--ag-radius-control);
  border: 1px solid var(--ag-border);
  background: var(--ag-surface-subtle);
  flex-wrap: wrap;
}

.heatmap-tabs .mini-pill {
  border: 1px solid transparent;
  background: transparent;
  color: var(--ag-text-muted);
  padding: 3px 8px;
  border-radius: var(--ag-radius-sm);
  font-size: 10.5px;
  font-weight: 500;
}

.heatmap-tabs .mini-pill:hover {
  background: transparent;
  color: var(--ag-text-bright);
}

.heatmap-tabs .mini-pill.active {
  background: var(--ag-surface-active);
  color: var(--ag-text-bright);
  border-color: transparent;
  box-shadow: var(--ag-shadow-sm);
}

/* 5-Column Metric Summary Bar */
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

/* Full-Width Zero-Scrollbar 52-Week Grid */
.heatmap-grid {
  width: 100%;
  overflow-x: auto;
  padding: 2px 0;
}

.heat-grid-months {
  display: flex;
  gap: 2px;
  margin-bottom: 4px;
  font-size: 9.5px;
  color: var(--ag-text-muted);
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

.heat-cell[data-level="0"] { background: var(--ag-heat-0); }
.heat-cell[data-level="1"] { background: var(--ag-heat-1); }
.heat-cell[data-level="2"] { background: var(--ag-heat-2); }
.heat-cell[data-level="3"] { background: var(--ag-heat-3); }
.heat-cell[data-level="4"] { background: var(--ag-heat-4); }

.heat-cell.is-first-use {
  box-shadow: inset 0 0 0 1.25px var(--ag-token-accent);
}

.heat-cell.is-today {
  box-shadow: inset 0 0 0 1.25px var(--ag-text-bright);
}

/* Weekly / Monthly / Yearly Grids */
.heatmap-monthly-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 6px;
}

.heatmap-yearly-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
}

.heat-month-card,
.heat-year-card {
  padding: 9px 10px;
  border-radius: 8px;
  border: 1px solid var(--ag-border);
  background: var(--ag-surface);
  display: flex;
  flex-direction: column;
  gap: 3px;
  cursor: pointer;
  transition: border-color 0.14s ease, transform 0.12s ease;
}

.heat-month-card[data-level="0"],
.heat-year-card[data-level="0"] {
  background: var(--ag-surface-subtle);
  border-color: var(--ag-border);
  box-shadow: none;
}

.heat-month-card[data-level="0"]:hover,
.heat-year-card[data-level="0"]:hover {
  border-color: var(--ag-border-strong);
}

.heat-month-card[data-level="1"],
.heat-year-card[data-level="1"] {
  box-shadow: inset 0 2px 0 var(--ag-heat-1);
  border-color: var(--ag-border-strong);
}

.heat-month-card[data-level="2"],
.heat-year-card[data-level="2"] {
  box-shadow: inset 0 2px 0 var(--ag-heat-2);
  border-color: var(--ag-border-strong);
}

.heat-month-card[data-level="3"],
.heat-year-card[data-level="3"] {
  box-shadow: inset 0 2px 0 var(--ag-heat-3);
  border-color: var(--ag-border-strong);
}

.heat-month-card[data-level="4"],
.heat-year-card[data-level="4"] {
  box-shadow: inset 0 2px 0 var(--ag-heat-4);
  border-color: var(--ag-border-strong);
}

.heat-month-card[data-level="1"]:hover,
.heat-year-card[data-level="1"]:hover { border-color: var(--ag-heat-1); }
.heat-month-card[data-level="2"]:hover,
.heat-year-card[data-level="2"]:hover { border-color: var(--ag-heat-2); }
.heat-month-card[data-level="3"]:hover,
.heat-year-card[data-level="3"]:hover { border-color: var(--ag-heat-3); }
.heat-month-card[data-level="4"]:hover,
.heat-year-card[data-level="4"]:hover { border-color: var(--ag-heat-4); }

.heat-month-name,
.heat-year-title {
  font-size: 10.5px;
  color: var(--ag-text-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.heat-month-val,
.heat-year-val {
  font-size: 13.5px;
  font-weight: 650;
  color: var(--ag-text-bright);
  font-variant-numeric: tabular-nums;
}

.heat-month-sub,
.heat-year-sub {
  font-size: 10px;
  color: var(--ag-text-muted);
  font-variant-numeric: tabular-nums;
}

.heatmap-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  font-size: 10.5px;
  color: var(--ag-text-muted);
  flex-wrap: wrap;
}

.heat-first-use {
  font-variant-numeric: tabular-nums;
}

.heatmap-legend {
  display: inline-flex;
  align-items: center;
  gap: 3px;
}

.heat-leg-btn {
  width: 10px;
  height: 10px;
  aspect-ratio: auto;
  border-radius: 2px;
}

.heatmap-tip-note {
  display: none;
}

.heatmap-disclaimer {
  font-size: 10px;
  color: var(--ag-text-muted);
  opacity: 0.72;
  line-height: 1.35;
}

/* Heatmap Hover Popover */
.heat-pop {
  position: fixed;
  z-index: 2147483645;
  max-width: 268px;
  padding: 9px 11px;
  border-radius: 9px;
  border: 1px solid var(--ag-border-strong);
  background: var(--ag-surface-elevated);
  color: var(--ag-text);
  box-shadow: var(--ag-shadow);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  font-size: 11px;
  line-height: 1.45;
  font-variant-numeric: tabular-nums;
  pointer-events: none;
}

.heat-pop[hidden] {
  display: none !important;
}

.heat-pop-date {
  font-weight: 600;
  color: var(--ag-text-bright);
  margin-bottom: 2px;
}

.heat-pop-tok {
  color: var(--ag-token-total);
  font-weight: 600;
}

.heat-pop-detail,
.heat-pop-models {
  color: var(--ag-text-muted);
  font-size: 10.5px;
  margin-top: 2px;
}

/* API Cost Estimate Card */
.cost-estimate-card {
  padding: 11px 13px;
  border-radius: var(--ag-radius-card);
  border: 1px solid var(--ag-border);
  background: var(--ag-surface-card);
  display: flex;
  flex-direction: column;
  gap: 7px;
}

.cost-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  flex-wrap: wrap;
}

.cost-header-left,
.cost-header-right {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.cost-title-icon {
  color: var(--ag-text-muted);
  flex-shrink: 0;
}

.cost-title {
  font-size: 12.5px;
  font-weight: 600;
  color: var(--ag-text-bright);
  letter-spacing: -0.01em;
}

.cost-period-tag,
.cost-nonpaid-badge {
  font-size: 10px;
  padding: 2px 7px;
  border-radius: var(--ag-radius-pill);
  border: none;
  background: var(--ag-surface-subtle);
  color: var(--ag-text-muted);
}

.cost-hero-val {
  font-size: 15.5px;
  font-weight: 650;
  color: var(--ag-token-accent);
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.01em;
}

.cost-sub-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  font-size: 11px;
  flex-wrap: wrap;
}

.cost-sub-spend-pill {
  color: var(--ag-text-muted);
  font-variant-numeric: tabular-nums;
}

.cost-sub-btns {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.cost-details-body {
  padding-top: 9px;
  border-top: 1px solid var(--ag-border);
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.cost-controls-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  flex-wrap: wrap;
}

.cost-ctrl-group {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.cost-ctrl-label {
  font-size: 10.5px;
  color: var(--ag-text-muted);
}

.cost-ctrl-track {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  padding: 2px;
  border-radius: var(--ag-radius-control);
  border: 1px solid var(--ag-border);
  background: var(--ag-surface-subtle);
}

.cost-ctrl-track .mini-pill {
  border: 1px solid transparent;
  background: transparent;
  color: var(--ag-text-muted);
  padding: 3px 8px;
  border-radius: var(--ag-radius-sm);
  font-size: 10.5px;
}

.cost-ctrl-track .mini-pill:hover {
  background: transparent;
  color: var(--ag-text-bright);
}

.cost-ctrl-track .mini-pill.active {
  background: var(--ag-surface-active);
  color: var(--ag-text-bright);
  border-color: transparent;
  box-shadow: var(--ag-shadow-sm);
}

.cost-cards-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 7px;
}

.cost-mini-card {
  padding: 8px 10px;
  border-radius: 8px;
  border: 1px solid var(--ag-border);
  background: var(--ag-surface);
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.cm-label {
  font-size: 10px;
  color: var(--ag-text-muted);
}

.cm-val {
  font-size: 13.5px;
  font-weight: 600;
  color: var(--ag-text-bright);
  font-variant-numeric: tabular-nums;
}

.cm-sub {
  font-size: 10px;
  color: var(--ag-text-muted);
  font-variant-numeric: tabular-nums;
}

.cost-note-line,
.cost-model-breakdown {
  font-size: 10.5px;
  color: var(--ag-text-muted);
  line-height: 1.45;
  font-variant-numeric: tabular-nums;
}

.cost-diff-box {
  padding: 7px 10px;
  border: none;
  border-left: 2px solid var(--ag-accent);
  border-radius: 0 6px 6px 0;
  background: var(--ag-surface-subtle);
  font-size: 11px;
  color: var(--ag-text);
  font-variant-numeric: tabular-nums;
}

.cost-disclaimer {
  font-size: 10px;
  color: var(--ag-text-muted);
  line-height: 1.4;
  opacity: 0.78;
}

/* Plan Summary Bar & Detail Card */
.plan-summary-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 8px 12px;
  border-radius: var(--ag-radius-card);
  border: 1px solid var(--ag-border);
  background: var(--ag-surface-card);
  flex-wrap: wrap;
}

.plan-summary-main,
.plan-summary-right {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
  min-width: 0;
}

.plan-tier-badge {
  display: inline-flex;
  align-items: center;
  padding: 2px 7px;
  border-radius: var(--ag-radius-sm);
  background: var(--ag-accent-soft);
  color: var(--ag-accent-text);
  font-size: 11px;
  font-weight: 600;
  white-space: nowrap;
}

.plan-account-text {
  font-size: 11px;
  color: var(--ag-text-muted);
  max-width: 190px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.plan-price-badge {
  font-size: 11px;
  padding: 2px 7px;
  border-radius: var(--ag-radius-sm);
  border: none;
  background: var(--ag-surface-subtle);
  color: var(--ag-text);
  font-variant-numeric: tabular-nums;
  cursor: pointer;
  transition: background-color 0.14s ease, color 0.14s ease;
}

.plan-price-badge:hover {
  background: var(--ag-surface-hover);
  color: var(--ag-text-bright);
}

.plan-price-badge:empty {
  display: none;
}

.plan-source-pill {
  font-size: 10.5px;
  padding: 0 2px;
  border: none;
  background: transparent;
  color: var(--ag-text-muted);
}

.plan-detail-card {
  padding: 12px 13px;
  border-radius: var(--ag-radius-card);
  border: 1px solid var(--ag-border);
  background: var(--ag-surface-card);
  display: flex;
  flex-direction: column;
  gap: 9px;
}

.plan-detail-card[hidden] {
  display: none !important;
}

.plan-detail-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 12px;
  font-weight: 600;
  color: var(--ag-text-bright);
}

.plan-save-feedback {
  font-size: 11px;
  font-weight: 500;
}

.plan-detail-grid {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.plan-detail-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  font-size: 11.5px;
  min-height: 24px;
}

.p-dt-k {
  color: var(--ag-text-muted);
  flex-shrink: 0;
}

.p-dt-v {
  color: var(--ag-text);
  text-align: right;
  word-break: break-word;
  font-variant-numeric: tabular-nums;
}

.p-dt-ctrl {
  flex: 1 1 auto;
  display: flex;
  justify-content: flex-end;
  min-width: 0;
}

.p-dt-price-wrap {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.plan-price-mode-bar {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  padding: 2px;
  border-radius: var(--ag-radius-control);
  border: 1px solid var(--ag-border);
  background: var(--ag-surface-subtle);
}

.mini-mode-btn {
  appearance: none;
  border: 1px solid transparent;
  background: transparent;
  color: var(--ag-text-muted);
  font-family: inherit;
  font-size: 10px;
  font-weight: 500;
  padding: 2px 7px;
  border-radius: var(--ag-radius-sm);
  cursor: pointer;
  transition: background-color 0.14s ease, color 0.14s ease;
}

.mini-mode-btn:hover {
  color: var(--ag-text-bright);
}

.mini-mode-btn.active {
  background: var(--ag-accent);
  border-color: var(--ag-accent);
  color: #ffffff;
}

.plan-detail-footer {
  display: flex;
  justify-content: flex-end;
}

.plan-custom-form {
  margin-top: 4px;
  padding-top: 10px;
  border-top: 1px solid var(--ag-border);
  display: flex;
  flex-direction: column;
  gap: 9px;
}

.plan-custom-form[hidden] {
  display: none !important;
}

.plan-form-title {
  font-size: 12px;
  font-weight: 600;
  color: var(--ag-text-bright);
}

.plan-form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}

.pf-field {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 10.5px;
  color: var(--ag-text-muted);
}

.pf-field-wide {
  grid-column: 1 / -1;
}

.pf-check {
  grid-column: 1 / -1;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 11.5px;
  color: var(--ag-text);
  cursor: pointer;
}

.pf-inline-pair {
  display: flex;
  gap: 6px;
}

.pf-input,
select.pf-input {
  width: 100%;
  min-width: 0;
  padding: 5px 8px;
  border-radius: var(--ag-radius-control);
  border: 1px solid var(--ag-border);
  background: var(--ag-surface);
  color: var(--ag-text);
  font-family: inherit;
  font-size: 11.5px;
  outline: none;
  transition: border-color 0.14s ease, box-shadow 0.14s ease;
}

.pf-input:focus {
  border-color: var(--ag-accent);
  box-shadow: 0 0 0 2px var(--ag-accent-soft);
}

.pf-input option {
  background: var(--ag-surface-elevated);
  color: var(--ag-text);
}

.pf-hint {
  font-size: 10px;
  color: var(--ag-text-muted);
}

.plan-form-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.plan-form-actions-right {
  display: inline-flex;
  gap: 6px;
}

/* Custom Dropdowns */
.ag-native-select-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  opacity: 0;
  pointer-events: none;
}

.ag-dropdown-wrapper {
  position: relative;
  min-width: 165px;
  max-width: 100%;
}

.ag-dropdown-trigger {
  appearance: none;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
  padding: 5px 8px;
  border-radius: var(--ag-radius-control);
  border: 1px solid var(--ag-border);
  background: var(--ag-surface);
  color: var(--ag-text);
  font-family: inherit;
  font-size: 11px;
  cursor: pointer;
  text-align: left;
  outline: none;
  transition: border-color 0.14s ease, box-shadow 0.14s ease;
}

.ag-dropdown-trigger:hover {
  border-color: var(--ag-border-strong);
}

.ag-dropdown-trigger:focus,
.ag-dropdown-wrapper.is-open .ag-dropdown-trigger {
  border-color: var(--ag-accent);
  box-shadow: 0 0 0 2px var(--ag-accent-soft);
}

.ag-dropdown-label {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ag-dropdown-caret {
  font-size: 10px;
  color: var(--ag-text-muted);
  flex-shrink: 0;
}

.ag-dropdown-menu {
  display: none;
  position: absolute;
  right: 0;
  top: calc(100% + 4px);
  min-width: 244px;
  max-width: 316px;
  max-height: 244px;
  overflow: hidden;
  border-radius: 9px;
  border: 1px solid var(--ag-border-strong);
  background: var(--ag-surface-elevated);
  box-shadow: var(--ag-shadow);
  z-index: 30;
  flex-direction: column;
}

.ag-dropdown-wrapper.is-open .ag-dropdown-menu {
  display: flex;
}

.ag-dropdown-wrapper.open-up .ag-dropdown-menu {
  top: auto;
  bottom: calc(100% + 4px);
}

.ag-dropdown-search-wrap {
  padding: 6px;
  border-bottom: 1px solid var(--ag-border);
}

.ag-dropdown-search-input {
  width: 100%;
  padding: 5px 8px;
  border-radius: var(--ag-radius-control);
  border: 1px solid var(--ag-border);
  background: var(--ag-surface);
  color: var(--ag-text);
  font-family: inherit;
  font-size: 11px;
  outline: none;
  transition: border-color 0.14s ease, box-shadow 0.14s ease;
}

.ag-dropdown-search-input:focus {
  border-color: var(--ag-accent);
  box-shadow: 0 0 0 2px var(--ag-accent-soft);
}

.ag-dropdown-list-container {
  overflow-y: auto;
  max-height: 192px;
  padding: 4px;
}

.ag-dropdown-group-title {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 5px 7px 3px;
  font-size: 10px;
  font-weight: 600;
  color: var(--ag-text-muted);
}

.ag-vendor-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
}

.ag-dropdown-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
  padding: 5px 8px;
  border-radius: var(--ag-radius-sm);
  font-size: 11px;
  color: var(--ag-text);
  cursor: pointer;
}

.ag-dropdown-item:hover,
.ag-dropdown-item.is-keyboard-focus {
  background: var(--ag-surface-hover);
}

.ag-dropdown-item.is-selected {
  background: var(--ag-accent-soft);
  color: var(--ag-text-bright);
  font-weight: 600;
}

.ag-dropdown-item-sub {
  font-size: 10px;
  color: var(--ag-text-muted);
  margin-left: auto;
  font-variant-numeric: tabular-nums;
}

.ag-dropdown-badge {
  font-size: 9.5px;
  padding: 1px 5px;
  border-radius: var(--ag-radius-sm);
  background: var(--ag-surface-subtle);
  color: var(--ag-text-muted);
}

.ag-dropdown-item-check {
  font-size: 10.5px;
  color: var(--ag-accent-text);
  opacity: 0;
}

.ag-dropdown-item.is-selected .ag-dropdown-item-check {
  opacity: 1;
}

/* Appearance & Color Customization Drawer */
.tech-drawer {
  border-radius: var(--ag-radius-card);
  border: 1px solid var(--ag-border);
  background: transparent;
  overflow: hidden;
  transition: background-color 0.15s ease, border-color 0.15s ease;
}

.tech-drawer.is-expanded {
  background: var(--ag-surface-card);
}

.drawer-toggle-btn {
  appearance: none;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 9px 12px;
  border: none;
  background: transparent;
  color: var(--ag-text);
  font-family: inherit;
  font-size: 11.5px;
  font-weight: 500;
  cursor: pointer;
  text-align: left;
  transition: background-color 0.14s ease, color 0.14s ease;
}

.drawer-toggle-btn:hover {
  background: var(--ag-surface-hover);
  color: var(--ag-text-bright);
}

.drawer-title-wrap {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  min-width: 0;
}

.drawer-title-wrap svg {
  color: var(--ag-text-muted);
  flex-shrink: 0;
}

.drawer-chevron {
  color: var(--ag-text-muted);
  font-size: 10.5px;
  white-space: nowrap;
}

.drawer-body {
  padding: 10px 12px 12px;
  border-top: 1px solid var(--ag-border);
  display: flex;
  flex-direction: column;
  gap: 9px;
}

.drawer-body[hidden] {
  display: none !important;
}

.color-preset-group {
  display: flex;
  align-items: center;
  gap: 5px;
  flex-wrap: wrap;
}

.cp-grp-label,
.color-sub-title {
  font-size: 10.5px;
  color: var(--ag-text-muted);
}

.color-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 7px 12px;
}

.color-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
  font-size: 11px;
  color: var(--ag-text);
}

.color-ctrl {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  flex-shrink: 0;
}

.color-swatch-btn {
  appearance: none;
  width: 20px;
  height: 20px;
  border-radius: var(--ag-radius-sm);
  border: 1px solid var(--ag-border-strong);
  background: var(--ag-accent);
  cursor: pointer;
  padding: 0;
  transition: transform 0.1s ease, border-color 0.14s ease;
}

.color-swatch-btn:hover {
  transform: scale(1.06);
  border-color: var(--ag-text-bright);
}

.mini-reset-btn {
  appearance: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--ag-border);
  background: var(--ag-surface);
  color: var(--ag-text-muted);
  font-family: inherit;
  font-size: 10px;
  padding: 3px 7px;
  border-radius: var(--ag-radius-sm);
  cursor: pointer;
  transition: background-color 0.14s ease, color 0.14s ease, border-color 0.14s ease;
}

.mini-reset-btn:hover {
  color: var(--ag-text-bright);
  background: var(--ag-surface-hover);
  border-color: var(--ag-border-strong);
}

.color-footer-actions {
  display: flex;
  justify-content: flex-end;
  gap: 6px;
  flex-wrap: wrap;
  padding-top: 2px;
}

/* Color Picker Popover */
.color-picker-popover {
  position: fixed;
  z-index: 2147483646;
  width: 304px;
  padding: 12px;
  border-radius: 11px;
  border: 1px solid var(--ag-border-strong);
  background: var(--ag-surface-elevated);
  color: var(--ag-text);
  box-shadow: var(--ag-shadow);
  display: flex;
  flex-direction: column;
  gap: 9px;
  -webkit-app-region: no-drag;
  transition: opacity 0.12s ease, transform 0.12s ease;
}

.color-picker-popover[hidden] {
  display: none !important;
}

.color-picker-popover.is-opening,
.color-picker-popover.is-closing {
  opacity: 0;
  transform: translateY(-4px);
}

.cp-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
}

.cp-title {
  font-size: 12px;
  font-weight: 600;
  color: var(--ag-text-bright);
}

.cp-target-name {
  font-weight: 400;
  color: var(--ag-text-muted);
}

.cp-sv-row {
  display: flex;
  gap: 8px;
  height: 132px;
}

.cp-sv-area {
  position: relative;
  flex: 1 1 auto;
  border-radius: var(--ag-radius-control);
  overflow: hidden;
  cursor: crosshair;
  border: 1px solid var(--ag-border);
}

.cp-sv-white {
  position: absolute;
  inset: 0;
  background: linear-gradient(to right, #fff, rgba(255, 255, 255, 0));
}

.cp-sv-black {
  position: absolute;
  inset: 0;
  background: linear-gradient(to bottom, rgba(0, 0, 0, 0), #000);
}

.cp-sv-thumb {
  position: absolute;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  border: 2px solid #fff;
  box-shadow: 0 0 2px rgba(0, 0, 0, 0.8);
  transform: translate(-50%, -50%);
  pointer-events: none;
}

.cp-side-col {
  width: 64px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.cp-side-preview {
  flex: 1 1 auto;
  border-radius: var(--ag-radius-control);
  border: 1px solid var(--ag-border);
}

.cp-hue-wrap {
  position: relative;
  height: 14px;
  border-radius: var(--ag-radius-pill);
  background: linear-gradient(to right, #f00 0%, #ff0 17%, #0f0 33%, #0ff 50%, #00f 67%, #f0f 83%, #f00 100%);
  cursor: ew-resize;
  border: 1px solid var(--ag-border);
}

.cp-hue-thumb {
  position: absolute;
  top: 50%;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #fff;
  border: 2px solid #18181b;
  transform: translate(-50%, -50%);
  pointer-events: none;
}

.cp-inputs {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.cp-input-row {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 10.5px;
}

.cp-input-row label {
  width: 28px;
  color: var(--ag-text-muted);
}

.cp-input {
  flex: 1 1 auto;
  min-width: 0;
  padding: 4px 7px;
  border-radius: var(--ag-radius-sm);
  border: 1px solid var(--ag-border);
  background: var(--ag-surface);
  color: var(--ag-text);
  font-family: var(--ag-font-mono);
  font-size: 11px;
  outline: none;
  transition: border-color 0.14s ease, box-shadow 0.14s ease;
}

.cp-input:focus {
  border-color: var(--ag-accent);
  box-shadow: 0 0 0 2px var(--ag-accent-soft);
}

.cp-advanced summary {
  font-size: 10.5px;
  color: var(--ag-text-muted);
  cursor: pointer;
}

.cp-advanced-body {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-top: 5px;
}

.cp-feedback {
  font-size: 10px;
  color: var(--ag-text-muted);
}

.cp-actions {
  display: flex;
  justify-content: space-between;
  gap: 6px;
}

@media (max-width: 760px) {
  #panel-tokens:not(.cost-compact-view) {
    width: calc(100vw - 24px);
    max-width: 660px;
    max-height: calc(100vh - 56px);
  }
  .tokens-grid-4 {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .heatmap-monthly-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 520px) {
  .heatmap-summary {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 440px) {
  .color-grid,
  .plan-form-grid,
  .cost-cards-grid {
    grid-template-columns: 1fr;
  }
}
`;

  function hasUnbuiltTemplate(str) {
    return typeof str !== 'string' || str.includes('/* @INSERT_USAGE_TEMPLATE */');
  }

  /**
   * Mount the unified "Local Recorded Usage" (#badge-tokens + #panel-tokens) Shadow DOM UI
   * wired to the shared TelemetryHub.
   */
  function mountUsagePanel(options = {}) {
    const win = options.window || (typeof window !== 'undefined' ? window : null);
    const doc = options.document || (typeof document !== 'undefined' ? document : null);
    if (!doc) throw new Error('Document is required to mount Usage Panel UI');

    const core = options.core || root.__AGUsageCore || root.__AGContextMeterCore || null;
    const hub = options.telemetryHub || win?.__AGUnifiedTelemetry || null;
    const templateHtml = typeof options.templateHtml === 'string'
      ? options.templateHtml
      : (hasUnbuiltTemplate(USAGE_TEMPLATE_RAW) ? '' : USAGE_TEMPLATE_RAW);
    const stylesCss = typeof options.stylesCss === 'string'
      ? options.stylesCss
      : (USAGE_STYLES_RAW.includes('/* @INSERT_USAGE_STYLES */') ? '' : USAGE_STYLES_RAW);

    try {
      doc.getElementById?.('ag-usage-suite-host')?.remove?.();
      doc.getElementById?.('ag-context-meter-host')?.remove?.();
    } catch {}

    const host = doc.createElement('div');
    host.id = 'ag-usage-suite-host';
    host.setAttribute('data-dock', 'floating');
    host.setAttribute('data-theme', 'dark');
    if (host.style) host.style.webkitAppRegion = 'no-drag';

    const shadow = typeof host.attachShadow === 'function' ? host.attachShadow({ mode: 'open' }) : host;
    if (shadow === host) {
      host.innerHTML = `<style>${stylesCss}</style>${templateHtml}`;
    } else {
      const styleEl = doc.createElement('style');
      styleEl.textContent = stylesCss;
      const wrapper = doc.createElement('div');
      wrapper.innerHTML = templateHtml;
      shadow.appendChild?.(styleEl);
      while (wrapper.firstChild) shadow.appendChild?.(wrapper.firstChild);
    }

    const cleanupCallbacks = [];
    function registerCleanup(fn) {
      if (typeof fn === 'function') cleanupCallbacks.push(fn);
    }

    function el(id) {
      if (!shadow) return null;
      if (typeof shadow.getElementById === 'function') return shadow.getElementById(id);
      if (typeof shadow.querySelector === 'function') return shadow.querySelector(`#${id}`);
      return null;
    }

    function escapeHtml(s) {
      return String(s ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    }

    function addClass(node, cls) {
      if (!node) return;
      if (node.classList?.add) node.classList.add(cls);
      else if (typeof node.className === 'string' && !node.className.split(/\s+/).includes(cls)) {
        node.className = `${node.className} ${cls}`.trim();
      }
    }

    function removeClass(node, cls) {
      if (!node) return;
      if (node.classList?.remove) node.classList.remove(cls);
      else if (typeof node.className === 'string') {
        node.className = node.className.split(/\s+/).filter(c => c && c !== cls).join(' ');
      }
    }

    function hasClass(node, cls) {
      if (!node) return false;
      if (node.classList?.contains) return Boolean(node.classList.contains(cls));
      return typeof node.className === 'string' && node.className.split(/\s+/).includes(cls);
    }

    function formatTokensK(n) {
      if (core?.formatTokensK) return core.formatTokensK(n);
      const val = Number(n) || 0;
      if (val >= 1e9) return `${(val / 1e9).toFixed(2)}B`;
      if (val >= 1e6) return `${(val / 1e6).toFixed(2)}M`;
      if (val >= 1e3) return `${(val / 1e3).toFixed(1)}K`;
      return String(Math.round(val));
    }

    let isHydratingUiControls = false;
    function runWithUiHydration(fn) {
      const prev = isHydratingUiControls;
      isHydratingUiControls = true;
      try {
        return fn();
      } finally {
        isHydratingUiControls = prev;
      }
    }

    const ANTIGRAVITY_TOKEN_DATA = {
      activeSource: 'all',
      tokenView: 'tokens',
      costScope: 'period',
      costMode: 'ref',
      costDetailsExpanded: false,
      raw: null,
      callsByDate: {},
      planStatus: null
    };

    const state = {
      disposed: false,
      started: false,
      tokensOpen: false,
      colorsDrawerExpanded: false,
      historyTimer: null,
      unsubs: [],
      titlebarObserver: null,
      resizeObserver: null,
      lastBridgeSyncAt: 0
    };

    function getBridgeInfo() {
      const url = options.bridgeUrl || win?.__AG_METER_LIVE_BRIDGE__?.url || '';
      const token = options.bridgeToken || win?.__AG_METER_LIVE_BRIDGE__?.token || '';
      if (!url || !token) return null;
      return { url: String(url).replace(/\/+$/, ''), token: String(token) };
    }

    async function callBridge(route, payload = {}) {
      const info = getBridgeInfo();
      const fetchFn = options.fetch || (win?.fetch ? win.fetch.bind(win) : null);
      if (!info || !fetchFn) return { ok: false, error: t('dropdown.noPersistBridge') };
      try {
        const resp = await fetchFn(`${info.url}${route}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-AG-Context-Token': info.token
          },
          body: JSON.stringify(payload)
        });
        if (!resp || !resp.ok) {
          return { ok: false, error: `HTTP ${resp ? resp.status : 'err'}` };
        }
        return await resp.json();
      } catch (e) {
        return { ok: false, error: e?.message || t('dropdown.persistErr') };
      }
    }

    async function saveSettingsPayloadBridge(payload) {
      return callBridge('/save-settings', payload);
    }

    function toggleTokenColorsDrawer(forceExpand) {
      const drawer = el('token-color-drawer');
      const body = el('token-color-drawer-body');
      const btn = el('btn-toggle-token-colors');
      const topBtn = el('btn-token-colors-top');
      if (!body) return;
      const next = typeof forceExpand === 'boolean' ? forceExpand : body.hidden;
      state.colorsDrawerExpanded = next;
      body.hidden = !next;
      drawer?.classList?.toggle?.('is-expanded', next);
      if (btn) {
        btn.setAttribute?.('aria-expanded', next ? 'true' : 'false');
        const chev = btn.querySelector?.('.drawer-chevron');
        if (chev) chev.textContent = next ? t('drawer.collapseSettings') : t('drawer.expandSettings');
      }
      if (topBtn) {
        topBtn.setAttribute?.('aria-pressed', next ? 'true' : 'false');
      }
    }

      // Module: Panel i18n (zh-CN / zh-TW / en)
  const VALID_PANEL_LANGUAGES = new Set(['zh-CN', 'zh-TW', 'en']);
  let currentPanelLanguage = 'zh-CN';

  function normalizePanelLanguage(lang) {
    if (typeof lang !== 'string') return 'zh-CN';
    const trimmed = lang.trim();
    if (VALID_PANEL_LANGUAGES.has(trimmed)) return trimmed;
    const lower = trimmed.toLowerCase();
    if (lower === 'zh-tw' || lower === 'zh-hant' || lower === 'tw') return 'zh-TW';
    if (lower === 'en' || lower.startsWith('en-')) return 'en';
    return 'zh-CN';
  }

  function getPanelLanguage() {
    return currentPanelLanguage;
  }

  const PANEL_I18N = {
    'badge.tokens.aria': { 'zh-CN': 'Token 用量一览', 'zh-TW': 'Token 用量一覽', en: 'Token usage overview' },
    'settings.panelLang.aria': { 'zh-CN': '插件面板语言', 'zh-TW': '外掛面板語言', en: 'Panel language' },
    'header.palette.aria': { 'zh-CN': '外观与调色设置', 'zh-TW': '外觀與調色設定', en: 'Appearance & color settings' },
    'header.theme.aria': { 'zh-CN': '切换浅色/深色主题', 'zh-TW': '切換淺色/深色主題', en: 'Toggle light/dark theme' },
    'header.theme.title': { 'zh-CN': '当前：跟随IDE（点击切换：浅色 / 深色 / 自动）', 'zh-TW': '目前：跟隨IDE（點擊切換：淺色 / 深色 / 自動）', en: 'Current: Follow IDE (click to cycle Light / Dark / Auto)' },
    'header.close.aria': { 'zh-CN': '收起详情', 'zh-TW': '收起詳情', en: 'Close panel' },
    'drawer.expandSettings': { 'zh-CN': '展开 ▾', 'zh-TW': '展開 ▾', en: 'Expand ▾' },
    'drawer.collapseSettings': { 'zh-CN': '收起 ▴', 'zh-TW': '收起 ▴', en: 'Collapse ▴' },
    'drawer.colors.expand': { 'zh-CN': '展开 ▾', 'zh-TW': '展開 ▾', en: 'Expand ▾' },
    'drawer.colors.collapse': { 'zh-CN': '收起 ▴', 'zh-TW': '收起 ▴', en: 'Collapse ▴' },
    'settings.colors.panelBg': { 'zh-CN': '面板与菜单统一背景色', 'zh-TW': '面板與選單統一背景色', en: 'Panel & menu background' },
    'settings.colors.resetAll': { 'zh-CN': '全部恢复跟随主题', 'zh-TW': '全部恢復跟隨主題', en: 'Reset all to theme' },

    'tokens.title': { 'zh-CN': '本机已记录用量', 'zh-TW': '本機已記錄用量', en: 'Local Recorded Usage' },
    'tokens.titleCost': { 'zh-CN': 'API 价格折算', 'zh-TW': 'API 價格換算', en: 'API Equivalent Cost' },
    'tokens.sourceLabel': { 'zh-CN': '来源:', 'zh-TW': '來源:', en: 'Source:' },
    'tokens.src.all': { 'zh-CN': '全部', 'zh-TW': '全部', en: 'All' },
    'tokens.src.desktop': { 'zh-CN': '桌面端', 'zh-TW': '桌面端', en: 'Desktop' },
    'tokens.src.cli': { 'zh-CN': 'CLI', 'zh-TW': 'CLI', en: 'CLI' },
    'tokens.srcAllLabel': { 'zh-CN': '全部来源', 'zh-TW': '全部來源', en: 'All Sources' },
    'tokens.srcDesktopLabel': { 'zh-CN': '桌面端', 'zh-TW': '桌面端', en: 'Desktop' },
    'tokens.view.tokens': { 'zh-CN': 'Token 统计', 'zh-TW': 'Token 統計', en: 'Token Stats' },
    'tokens.view.cost': { 'zh-CN': 'API 参考金额', 'zh-TW': 'API 參考金額', en: 'API Est. Cost' },
    'tokens.badge.today': { 'zh-CN': ' · 今日 {val}', 'zh-TW': ' · 今日 {val}', en: ' · Today {val}' },
    'tokens.badge.todayShort': { 'zh-CN': '今日 {val}', 'zh-TW': '今日 {val}', en: 'Today {val}' },
    'tokens.badge.fullTitle': { 'zh-CN': '今日 {today} · 累计 {total}（点击展开用量面板）', 'zh-TW': '今日 {today} · 累計 {total}（點擊展開用量面板）', en: 'Today {today} · Total {total} (click to open usage panel)' },
    'tokens.card.total': { 'zh-CN': '累计处理 Token', 'zh-TW': '累計處理 Token', en: 'Total Tokens' },
    'tokens.card.includeCache': { 'zh-CN': '含缓存读取', 'zh-TW': '含快取讀取', en: 'Incl. cache reads' },
    'tokens.card.today': { 'zh-CN': '今日使用', 'zh-TW': '今日使用', en: 'Today' },
    'tokens.card.month': { 'zh-CN': '本月使用', 'zh-TW': '本月使用', en: 'This Month' },
    'tokens.card.year': { 'zh-CN': '年度使用', 'zh-TW': '年度使用', en: 'This Year' },
    'tokens.card.todaySub': { 'zh-CN': '{n} 会话实时累加', 'zh-TW': '{n} 會話即時累加', en: '{n} chat(s) live' },
    'tokens.card.monthSub': { 'zh-CN': '日均约 {val}', 'zh-TW': '日均約 {val}', en: '~{val}/day avg' },
    'tokens.card.yearSub': { 'zh-CN': '{n} 天活动记录', 'zh-TW': '{n} 天活動記錄', en: '{n} active day(s)' },
    'tokens.card.costPlaceholder': { 'zh-CN': '≈ $0.00 (¥0.00) · 日均 $0.00', 'zh-TW': '≈ $0.00 (¥0.00) · 日均 $0.00', en: '≈ $0.00 (¥0.00) · $0.00/d' },
    'tokens.dailyAvg': { 'zh-CN': ' · 日均 ${val}', 'zh-TW': ' · 日均 ${val}', en: ' · ${val}/d' },
    'tokens.firstUse': { 'zh-CN': '首次使用：{date}', 'zh-TW': '首次使用：{date}', en: 'First use: {date}' },
    'tokens.firstUseNone': { 'zh-CN': '首次使用：--', 'zh-TW': '首次使用：--', en: 'First use: --' },
    'tokens.range.month': { 'zh-CN': '{y}年{m}月', 'zh-TW': '{y}年{m}月', en: '{y}-{m}' },
    'tokens.range.year': { 'zh-CN': '{y}年', 'zh-TW': '{y}年', en: '{y}' },
    'tokens.range.yearToToday': { 'zh-CN': '{y}年（1月1日–今天）', 'zh-TW': '{y}年（1月1日–今天）', en: '{y} (Jan 1 – Today)' },

    'tokens.heat.title': { 'zh-CN': 'Token 活动', 'zh-TW': 'Token 活動', en: 'Token Activity' },
    'tokens.heat.prevTitle': { 'zh-CN': '上一个周期', 'zh-TW': '上一個週期', en: 'Previous period' },
    'tokens.heat.nextTitle': { 'zh-CN': '下一个周期', 'zh-TW': '下一個週期', en: 'Next period' },
    'tokens.heat.tabsAria': { 'zh-CN': '热力图时间维度', 'zh-TW': '熱力圖時間維度', en: 'Heatmap time dimension' },
    'tokens.heat.daily': { 'zh-CN': '每天', 'zh-TW': '每天', en: 'Daily' },
    'tokens.heat.weekly': { 'zh-CN': '每周', 'zh-TW': '每週', en: 'Weekly' },
    'tokens.heat.monthly': { 'zh-CN': '每月', 'zh-TW': '每月', en: 'Monthly' },
    'tokens.heat.yearly': { 'zh-CN': '今年', 'zh-TW': '今年', en: 'Year' },
    'tokens.heat.cum': { 'zh-CN': '累计总量', 'zh-TW': '累計總量', en: 'Cumulative' },
    'tokens.heat.sumTokens': { 'zh-CN': '区间合计', 'zh-TW': '區間合計', en: 'Range Total' },
    'tokens.heat.sumCost': { 'zh-CN': '预估费用', 'zh-TW': '預估費用', en: 'Est. Cost' },
    'tokens.heat.sumDailyAvg': { 'zh-CN': '折合每天', 'zh-TW': '折合每天', en: 'Daily Avg' },
    'tokens.heat.sumActiveAvg': { 'zh-CN': '活跃日均', 'zh-TW': '活躍日均', en: 'Active Avg' },
    'tokens.heat.sumSubRatio': { 'zh-CN': '订阅性价比', 'zh-TW': '訂閱性價比', en: 'Plan Value' },
    'tokens.heat.activeAvgPlaceholder': { 'zh-CN': '$0.00 (0天)', 'zh-TW': '$0.00 (0天)', en: '$0.00 (0d)' },
    'tokens.heat.firstUsePlaceholder': { 'zh-CN': '首次使用：--', 'zh-TW': '首次使用：--', en: 'First use: --' },
    'tokens.heat.legendTitle': { 'zh-CN': '点击任意档位色块即可单独自定义该档颜色', 'zh-TW': '點擊任意檔位色塊即可單獨自訂該檔顏色', en: 'Click any legend swatch to customize its color' },
    'tokens.heat.less': { 'zh-CN': '少', 'zh-TW': '少', en: 'Less' },
    'tokens.heat.more': { 'zh-CN': '多', 'zh-TW': '多', en: 'More' },
    'tokens.heat.tip': { 'zh-CN': '点击或悬浮格子查看当日详细 Token 构成', 'zh-TW': '點擊或懸停格子檢視當日詳細 Token 構成', en: 'Click or hover a cell to view daily token breakdown' },
    'tokens.heat.disclaimer': { 'zh-CN': '注：按日聚合按基础档估算，未拆分长上下文分档，结果偏下限。有逐请求记录时优先精确入账。', 'zh-TW': '註：按日彙總依基礎檔估算，未拆分長上下文分檔，結果偏下限。有逐請求記錄時優先精確入帳。', en: 'Note: Daily aggregates use base tier pricing (lower bound) unless per-request records are available.' },
    'tokens.colors.title': { 'zh-CN': '热力图色阶与外观设置', 'zh-TW': '熱力圖色階與外觀設定', en: 'Heatmap Palette & Appearance' },
    'tokens.heat.presetLabel': { 'zh-CN': '5 档色阶预设：', 'zh-TW': '5 檔色階預設：', en: '5-step presets:' },
    'tokens.heat.presetPurple': { 'zh-CN': '紫色系', 'zh-TW': '紫色系', en: 'Purple' },
    'tokens.heat.presetYellow': { 'zh-CN': '黄色系', 'zh-TW': '黃色系', en: 'Yellow' },
    'tokens.heat.presetGreen': { 'zh-CN': '绿色系', 'zh-TW': '綠色系', en: 'Green' },
    'tokens.heat.presetBlue': { 'zh-CN': '蓝色系', 'zh-TW': '藍色系', en: 'Blue' },
    'tokens.heat.presetRed': { 'zh-CN': '红色系', 'zh-TW': '紅色系', en: 'Red' },
    'tokens.heat.customTitle': { 'zh-CN': '5 档逐格独立自定义（点击任意一格或图例「少 ▢▢▢▢▢ 多」单独调色，可设 5 种不同颜色）：', 'zh-TW': '5 檔逐格獨立自訂（點擊任意一格或圖例「少 ▢▢▢▢▢ 多」單獨調色，可設 5 種不同顏色）：', en: 'Customize each of the 5 steps independently:' },
    'tokens.heat.resetLvls': { 'zh-CN': '恢复 5 档预设', 'zh-TW': '恢復 5 檔預設', en: 'Reset 5 steps' },
    'tokens.heat.lvl0': { 'zh-CN': '1档 · 少/无', 'zh-TW': '1檔 · 少/無', en: 'L1 · None/Min' },
    'tokens.heat.lvl1': { 'zh-CN': '2档 · 低', 'zh-TW': '2檔 · 低', en: 'L2 · Low' },
    'tokens.heat.lvl2': { 'zh-CN': '3档 · 中', 'zh-TW': '3檔 · 中', en: 'L3 · Med' },
    'tokens.heat.lvl3': { 'zh-CN': '4档 · 高', 'zh-TW': '4檔 · 高', en: 'L4 · High' },
    'tokens.heat.lvl4': { 'zh-CN': '5档 · 多/峰', 'zh-TW': '5檔 · 多/峰', en: 'L5 · Peak' },
    'tokens.heat.lowEnd': { 'zh-CN': '色阶「少」端颜色（自动插值）', 'zh-TW': '色階「少」端顏色（自動插值）', en: 'Low end color (auto-interpolated)' },
    'tokens.heat.highEnd': { 'zh-CN': '色阶「多」端颜色（自动插值）', 'zh-TW': '色階「多」端顏色（自動插值）', en: 'High end color (auto-interpolated)' },
    'tokens.heat.panelBg': { 'zh-CN': '面板与菜单统一背景色', 'zh-TW': '面板與選單統一背景色', en: 'Unified panel background' },
    'tokens.heat.accentColors': { 'zh-CN': '累计与强调指标色', 'zh-TW': '累計與強調指標色', en: 'Total & accent colors' },
    'tokens.colors.followTheme': { 'zh-CN': '跟随主题', 'zh-TW': '跟隨主題', en: 'Follow theme' },
    'tokens.heat.lvl0Aria': { 'zh-CN': '热力图第1档颜色', 'zh-TW': '熱力圖第1檔顏色', en: 'Heatmap level 1 color' },
    'tokens.heat.lvl1Aria': { 'zh-CN': '热力图第2档颜色', 'zh-TW': '熱力圖第2檔顏色', en: 'Heatmap level 2 color' },
    'tokens.heat.lvl2Aria': { 'zh-CN': '热力图第3档颜色', 'zh-TW': '熱力圖第3檔顏色', en: 'Heatmap level 3 color' },
    'tokens.heat.lvl3Aria': { 'zh-CN': '热力图第4档颜色', 'zh-TW': '熱力圖第4檔顏色', en: 'Heatmap level 4 color' },
    'tokens.heat.lvl4Aria': { 'zh-CN': '热力图第5档颜色', 'zh-TW': '熱力圖第5檔顏色', en: 'Heatmap level 5 color' },
    'tokens.heat.lvl0Swatch': { 'zh-CN': '色阶第 1 档（少/无用量）', 'zh-TW': '色階第 1 檔（少/無用量）', en: 'Heatmap Level 1 (None/Low)' },
    'tokens.heat.lvl1Swatch': { 'zh-CN': '色阶第 2 档（低用量）', 'zh-TW': '色階第 2 檔（低用量）', en: 'Heatmap Level 2 (Light)' },
    'tokens.heat.lvl2Swatch': { 'zh-CN': '色阶第 3 档（中等用量）', 'zh-TW': '色階第 3 檔（中等用量）', en: 'Heatmap Level 3 (Medium)' },
    'tokens.heat.lvl3Swatch': { 'zh-CN': '色阶第 4 档（高用量）', 'zh-TW': '色階第 4 檔（高用量）', en: 'Heatmap Level 4 (High)' },
    'tokens.heat.lvl4Swatch': { 'zh-CN': '色阶第 5 档（多/峰值用量）', 'zh-TW': '色階第 5 檔（多/峰值用量）', en: 'Heatmap Level 5 (Peak)' },
    'tokens.heat.lowEndSwatch': { 'zh-CN': '热力图「少」端颜色', 'zh-TW': '熱力圖「少」端顏色', en: 'Heatmap Low Color' },
    'tokens.heat.highEndSwatch': { 'zh-CN': '热力图「多」端颜色', 'zh-TW': '熱力圖「多」端顏色', en: 'Heatmap High Color' },
    'tokens.heat.totalSwatch': { 'zh-CN': '累计 token 用量', 'zh-TW': '累計 token 用量', en: 'Total Tokens Color' },
    'tokens.heat.accentSwatch': { 'zh-CN': 'Token 强调色', 'zh-TW': 'Token 強調色', en: 'Token Accent Color' },

    'heat.today': { 'zh-CN': '（今日）', 'zh-TW': '（今日）', en: ' (Today)' },
    'heat.firstUse': { 'zh-CN': '（首次使用）', 'zh-TW': '（首次使用）', en: ' (First use)' },
    'heat.future': { 'zh-CN': '未来日期（待产生记录）', 'zh-TW': '未來日期（待產生記錄）', en: 'Future date (no records yet)' },
    'heat.prompt': { 'zh-CN': '提示词', 'zh-TW': '提示詞', en: 'Prompt' },
    'heat.output': { 'zh-CN': '输出', 'zh-TW': '輸出', en: 'Output' },
    'heat.cache': { 'zh-CN': '缓存', 'zh-TW': '快取', en: 'Cache' },
    'heat.weeklyTotal': { 'zh-CN': 'Weekly Total · 周累计 (折合日均 ${avg})', 'zh-TW': 'Weekly Total · 週累計 (折合日均 ${avg})', en: 'Weekly Total (daily avg ${avg})' },
    'heat.cumSuffix': { 'zh-CN': ' (累计)', 'zh-TW': ' (累計)', en: ' (Cumulative)' },
    'heat.cumTotal': { 'zh-CN': 'Cumulative Total · 截至当日累计 (折合日均 ${avg})', 'zh-TW': 'Cumulative Total · 截至當日累計 (折合日均 ${avg})', en: 'Cumulative Total to Date (daily avg ${avg})' },
    'heat.activeDays': { 'zh-CN': '${avg} ({days}天)', 'zh-TW': '${avg} ({days}天)', en: '${avg} ({days}d)' },
    'heat.roi': { 'zh-CN': '{ratio}x 回本', 'zh-TW': '{ratio}x 回本', en: '{ratio}x ROI' },
    'heat.peak': { 'zh-CN': '峰值', 'zh-TW': '峰值', en: 'Peak' },
    'heatmap.pop.inProgress': { 'zh-CN': '（进行中）', 'zh-TW': '（進行中）', en: ' (Current)' },
    'heatmap.pop.peak': { 'zh-CN': '（年度峰值）', 'zh-TW': '（年度峰值）', en: ' (Peak)' },
    'heatmap.pop.future': { 'zh-CN': '未来月份（尚未产生用量）', 'zh-TW': '未來月份（尚未產生用量）', en: 'Future month (no usage)' },
    'heatmap.pop.monthlyDet': { 'zh-CN': '月度合计 · 折合日均 ${avg} (活跃 {days} 天)', 'zh-TW': '月度合計 · 折合日均 ${avg} (活躍 {days} 天)', en: 'Monthly Total · Avg ${avg}/d ({days} active days)' },

    'cp.title': { 'zh-CN': '颜色选取器', 'zh-TW': '顏色選取器', en: 'Color Picker' },
    'cp.eyedropper': { 'zh-CN': '取色', 'zh-TW': '取色', en: 'Pick' },
    'cp.eyedropperTitle': { 'zh-CN': '屏幕取色器 (吸管)', 'zh-TW': '螢幕取色器 (吸管)', en: 'Eyedropper' },
    'cp.moreFormats': { 'zh-CN': '更多格式 (RGB / HSL)', 'zh-TW': '更多格式 (RGB / HSL)', en: 'More formats (RGB / HSL)' },
    'cp.hint': { 'zh-CN': '支持直接输入或粘贴 HEX 色值', 'zh-TW': '支援直接輸入或貼上 HEX 色值', en: 'Type or paste a HEX color value' },
    'cp.followTheme': { 'zh-CN': '跟随主题', 'zh-TW': '跟隨主題', en: 'Follow Theme' },
    'cp.closeAria': { 'zh-CN': '关闭调色器', 'zh-TW': '關閉調色盤', en: 'Close color picker' },
    'cp.hexAria': { 'zh-CN': 'HEX 色值', 'zh-TW': 'HEX 色值', en: 'HEX value' },
    'cp.copyHex': { 'zh-CN': '复制 HEX', 'zh-TW': '複製 HEX', en: 'Copy HEX' },
    'cp.rgbAria': { 'zh-CN': 'RGB 色值', 'zh-TW': 'RGB 色值', en: 'RGB value' },
    'cp.copyRgb': { 'zh-CN': '複製 RGB', 'zh-TW': '複製 RGB', en: 'Copy RGB' },
    'cp.hslAria': { 'zh-CN': 'HSL 色值', 'zh-TW': 'HSL 色值', en: 'HSL value' },
    'cp.copyHsl': { 'zh-CN': '复制 HSL', 'zh-TW': '複製 HSL', en: 'Copy HSL' },
    'colors.btn.restore': { 'zh-CN': '恢复', 'zh-TW': '恢復', en: 'Reset' },
    'colors.btn.preset': { 'zh-CN': '预设', 'zh-TW': '預設', en: 'Preset' },
    'colors.btn.restorePreset': { 'zh-CN': '恢复预设', 'zh-TW': '恢復預設', en: 'Reset Preset' },
    'colors.btn.restoreDefault': { 'zh-CN': '恢复默认', 'zh-TW': '恢復預設', en: 'Default' },
    'colors.resetLevel': { 'zh-CN': '恢复该档预设', 'zh-TW': '恢復該檔預設', en: 'Reset step' },
    'colors.followTheme': { 'zh-CN': '跟随主题', 'zh-TW': '跟隨主題', en: 'Follow theme' },
    'colors.lvl0': { 'zh-CN': '色阶第 1 档（少/无用量）', 'zh-TW': '色階第 1 檔（少/無用量）', en: 'Step 1 (None/Min)' },
    'colors.lvl1': { 'zh-CN': '色阶第 2 档（低用量）', 'zh-TW': '色階第 2 檔（低用量）', en: 'Step 2 (Low)' },
    'colors.lvl2': { 'zh-CN': '色阶第 3 档（中等用量）', 'zh-TW': '色階第 3 檔（中等用量）', en: 'Step 3 (Medium)' },
    'colors.lvl3': { 'zh-CN': '色阶第 4 档（高用量）', 'zh-TW': '色階第 4 檔（高用量）', en: 'Step 4 (High)' },
    'colors.lvl4': { 'zh-CN': '色阶第 5 档（多/峰值用量）', 'zh-TW': '色階第 5 檔（多/峰值用量）', en: 'Step 5 (Peak)' },
    'colors.swatchTitle': { 'zh-CN': '点击打开调色板', 'zh-TW': '點擊開啟調色盤', en: 'Click to pick color' },
    'colors.lvl0Title': { 'zh-CN': '热力图第1档：少/无用量（点击独立调色）', 'zh-TW': '熱力圖第1檔：少/無用量（點擊獨立調色）', en: 'Heatmap Level 1: None/Low (click to edit)' },
    'colors.lvl1Title': { 'zh-CN': '热力图第2档：低用量（点击独立调色）', 'zh-TW': '熱力圖第2檔：低用量（點擊獨立調色）', en: 'Heatmap Level 2: Light (click to edit)' },
    'colors.lvl2Title': { 'zh-CN': '热力图第3档：中等用量（点击独立调色）', 'zh-TW': '熱力圖第3檔：中等用量（點擊獨立調色）', en: 'Heatmap Level 3: Medium (click to edit)' },
    'colors.lvl3Title': { 'zh-CN': '热力图第4档：高用量（点击独立调色）', 'zh-TW': '熱力圖第4檔：高用量（點擊獨立調色）', en: 'Heatmap Level 4: High (click to edit)' },
    'colors.lvl4Title': { 'zh-CN': '热力图第5档：多/峰值用量（点击独立调色）', 'zh-TW': '熱力圖第5檔：多/峰值用量（點擊獨立調色）', en: 'Heatmap Level 5: Peak (click to edit)' },
    'colors.panelBgSwatch': { 'zh-CN': '面板与菜单背景色', 'zh-TW': '面板與選單背景色', en: 'Panel & Menu Background' },
    'colors.eyedropperPicked': { 'zh-CN': '已吸取 {hex}', 'zh-TW': '已吸取 {hex}', en: 'Picked {hex}' },
    'colors.eyedropperUnsupported': { 'zh-CN': '当前环境不支持原生吸管，可直接粘贴 HEX', 'zh-TW': '目前環境不支援原生滴管，可直接貼上 HEX', en: 'Eyedropper unsupported; paste HEX directly' },
    'colors.appliedHex': { 'zh-CN': '已应用 {hex}', 'zh-TW': '已套用 {hex}', en: 'Applied {hex}' },
    'colors.copied': { 'zh-CN': '✔ 已复制 {label}: {val}', 'zh-TW': '✔ 已複製 {label}: {val}', en: '✔ Copied {label}: {val}' },

    'theme.light': { 'zh-CN': '浅色', 'zh-TW': '淺色', en: 'Light' },
    'theme.dark': { 'zh-CN': '深色', 'zh-TW': '深色', en: 'Dark' },
    'theme.autoTitle': { 'zh-CN': '当前主题：跟随宿主 ({mode})\n点击切换为：浅色模式', 'zh-TW': '目前主題：跟隨宿主 ({mode})\n點擊切換為：淺色模式', en: 'Theme: Follow IDE ({mode})\nClick to switch to Light' },
    'theme.lightTitle': { 'zh-CN': '当前主题：浅色模式 (固定)\n点击切换为：深色模式', 'zh-TW': '目前主題：淺色模式 (固定)\n點擊切換為：深色模式', en: 'Theme: Light (Fixed)\nClick to switch to Dark' },
    'theme.darkTitle': { 'zh-CN': '当前主题：深色模式 (固定)\n点击切换为：跟随宿主', 'zh-TW': '目前主題：深色模式 (固定)\n點擊切換為：跟隨宿主', en: 'Theme: Dark (Fixed)\nClick to switch to Follow IDE' },

    'common.unknown': { 'zh-CN': '未知', 'zh-TW': '未知', en: 'Unknown' },
    'common.notProvided': { 'zh-CN': '未提供', 'zh-TW': '未提供', en: 'Not provided' },
    'common.loading': { 'zh-CN': '读取中...', 'zh-TW': '讀取中...', en: 'Loading...' },

    'dropdown.searchPlaceholder': { 'zh-CN': '🔍 搜索...', 'zh-TW': '🔍 搜尋...', en: '🔍 Search...' },
    'dropdown.empty': { 'zh-CN': '未找到匹配项', 'zh-TW': '找不到符合項目', en: 'No matching items' },
    'dropdown.countrySearch': { 'zh-CN': '🔍 搜索账号所在地区或代码 (如: 美国、TW、JP)...', 'zh-TW': '🔍 搜尋帳號所在地區或代碼 (如: 美國、TW、JP)...', en: '🔍 Search country or code (e.g. US, TW, JP)...' },
    'dropdown.countryEmpty': { 'zh-CN': '未找到匹配的账号所在地区', 'zh-TW': '未找到匹配的帳號所在地區', en: 'No matching country found' },
    'dropdown.regionSearch': { 'zh-CN': '🔍 搜索订阅国家/地区、货币或缩写 (如: 台湾、澳、USD)...', 'zh-TW': '🔍 搜尋訂閱國家/地區、貨幣或縮寫 (如: 台灣、澳、USD)...', en: '🔍 Search billing region or currency (e.g. TW, USD)...' },
    'dropdown.regionEmpty': { 'zh-CN': '未找到匹配的订阅国家/地区', 'zh-TW': '未找到匹配的訂閱國家/地區', en: 'No matching billing region found' },
    'dropdown.currencySearch': { 'zh-CN': '🔍 搜索币种名称或代码 (如: USD、NTD、人民币)...', 'zh-TW': '🔍 搜尋幣別名稱或代碼 (如: USD、NTD、台幣)...', en: '🔍 Search currency code or name (e.g. USD, CNY)...' },
    'dropdown.currencyEmpty': { 'zh-CN': '未找到匹配的币种', 'zh-TW': '未找到匹配的幣別', en: 'No matching currency found' },
    'dropdown.autoSaved': { 'zh-CN': '✔ 已自动保存', 'zh-TW': '✔ 已自動儲存', en: '✔ Auto-saved' },
    'dropdown.saveFailed': { 'zh-CN': '保存失败', 'zh-TW': '儲存失敗', en: 'Save failed' },
    'dropdown.saveFailedDetail': { 'zh-CN': '✖ 保存失败：{msg}', 'zh-TW': '✖ 儲存失敗：{msg}', en: '✖ Save failed: {msg}' },
    'dropdown.writeCfgFailed': { 'zh-CN': '无法写入配置文件', 'zh-TW': '無法寫入設定檔', en: 'Cannot write settings file' },
    'dropdown.noPersistBridge': { 'zh-CN': '未连接持久化服务，无法保存', 'zh-TW': '未連線持久化服務，無法儲存', en: 'Persistence bridge unavailable' },
    'dropdown.persistErr': { 'zh-CN': '持久化异常', 'zh-TW': '持久化異常', en: 'Persistence error' },
    'dropdown.perMonth': { 'zh-CN': '/月', 'zh-TW': '/月', en: '/mo' },
    'dropdown.regionUnknownShort': { 'zh-CN': '🌏 未知 (点击选择订阅地区与货币)', 'zh-TW': '🌏 未知 (點擊選擇訂閱地區與貨幣)', en: '🌏 Unknown (select region & currency)' },

    'plan.detail.toggleOpen': { 'zh-CN': '详情 ▾', 'zh-TW': '詳情 ▾', en: 'Details ▾' },
    'plan.detail.toggleClose': { 'zh-CN': '收起 ▴', 'zh-TW': '收起 ▴', en: 'Hide ▴' },
    'plan.detail.title': { 'zh-CN': 'AI 订阅与额度详情', 'zh-TW': 'AI 訂閱與額度詳情', en: 'AI Subscription & Credits' },
    'plan.summary.identified': { 'zh-CN': '已自动识别', 'zh-TW': '已自動識別', en: 'Auto-detected' },
    'plan.summary.custom': { 'zh-CN': '自定义生效', 'zh-TW': '自訂生效', en: 'Custom' },
    'plan.summary.unknown': { 'zh-CN': '未识别/默认', 'zh-TW': '未識別/預設', en: 'Default / Unknown' },
    'plan.summary.justNow': { 'zh-CN': '刚刚更新', 'zh-TW': '剛剛更新', en: 'Just now' },
    'plan.summary.perMonth': { 'zh-CN': '/月', 'zh-TW': '/月', en: '/mo' },
    'plan.summary.freeWithPlan': { 'zh-CN': '(随套餐免费)', 'zh-TW': '(隨方案免費)', en: '(Included)' },
    'plan.summary.priceBadgeTitle': { 'zh-CN': '当前订阅月费及人民币折合汇率参考 (点击展开/收起详情)', 'zh-TW': '目前訂閱月費及人民幣折合匯率參考 (點擊展開/收起詳情)', en: 'Current monthly fee & CNY estimate (click to toggle details)' },
    'plan.dt.plan': { 'zh-CN': '当前套餐：', 'zh-TW': '目前方案：', en: 'Plan:' },
    'plan.dt.account': { 'zh-CN': '当前账号：', 'zh-TW': '目前帳號：', en: 'Account:' },
    'plan.dt.country': { 'zh-CN': '账号所在地区：', 'zh-TW': '帳號所在地區：', en: 'Account country:' },
    'plan.dt.region': { 'zh-CN': '订阅国家：', 'zh-TW': '訂閱國家：', en: 'Billing country:' },
    'plan.dt.currency': { 'zh-CN': '订阅币种：', 'zh-TW': '訂閱幣別：', en: 'Currency:' },
    'plan.dt.acq': { 'zh-CN': '获取方式：', 'zh-TW': '取得方式：', en: 'Source:' },
    'plan.dt.price': { 'zh-CN': '计费周期与价格：', 'zh-TW': '計費週期與價格：', en: 'Billing & price:' },
    'plan.dt.validity': { 'zh-CN': '权益有效期：', 'zh-TW': '權益有效期：', en: 'Valid until:' },
    'plan.dt.note': { 'zh-CN': '补充备注：', 'zh-TW': '補充備註：', en: 'Note:' },
    'plan.dt.promptCredits': { 'zh-CN': 'Prompt 额度池：', 'zh-TW': 'Prompt 額度池：', en: 'Prompt credits:' },
    'plan.dt.flowCredits': { 'zh-CN': 'Flow 额度池：', 'zh-TW': 'Flow 額度池：', en: 'Flow credits:' },
    'plan.dt.updated': { 'zh-CN': '状态更新时间：', 'zh-TW': '狀態更新時間：', en: 'Updated:' },
    'plan.account.unknown': { 'zh-CN': '未识别当前登录邮箱', 'zh-TW': '未識別目前登入信箱', en: 'Signed-in email not detected' },
    'plan.country.auto': { 'zh-CN': '🌐 未设置 / 自动', 'zh-TW': '🌐 未設定 / 自動', en: '🌐 Unset / Auto' },
    'plan.country.title': { 'zh-CN': '仅作为本地显示记录，不修改实际 Google 账号', 'zh-TW': '僅作為本機顯示記錄，不修改實際 Google 帳號', en: 'Local display record only; does not change your Google account' },
    'plan.country.unknown': { 'zh-CN': '未知', 'zh-TW': '未知', en: 'Unknown' },
    'plan.region.title': { 'zh-CN': '实际购买或支付订阅所在的国家或地区', 'zh-TW': '實際購買或支付訂閱所在的國家或地區', en: 'Country/region where the subscription is billed' },
    'plan.region.unknown': { 'zh-CN': '未知', 'zh-TW': '未知', en: 'Unknown' },
    'plan.currency.aria': { 'zh-CN': '选择订阅币种', 'zh-TW': '選擇訂閱幣別', en: 'Select subscription currency' },
    'plan.currency.title': { 'zh-CN': '订阅计价/结算币种', 'zh-TW': '訂閱計價/結算幣別', en: 'Subscription billing currency' },
    'plan.tag.saved': { 'zh-CN': '已保存', 'zh-TW': '已儲存', en: 'Saved' },
    'plan.tag.custom': { 'zh-CN': '自定义', 'zh-TW': '自訂', en: 'Custom' },
    'plan.tag.promo': { 'zh-CN': '活动权益', 'zh-TW': '活動權益', en: 'Promo' },
    'plan.tag.manualFree': { 'zh-CN': '手动确认 · 免费', 'zh-TW': '手動確認 · 免費', en: 'Manual · Free' },
    'plan.tag.userPaid': { 'zh-CN': '用户实付', 'zh-TW': '用戶實付', en: 'Actual paid' },
    'plan.tag.official': { 'zh-CN': '官方定价', 'zh-TW': '官方定價', en: 'Official price' },
    'plan.tag.publicRef': { 'zh-CN': '公开参考价', 'zh-TW': '公開參考價', en: 'Public ref' },
    'plan.tag.regionRef': { 'zh-CN': '地区参考价', 'zh-TW': '地區參考價', en: 'Regional ref' },
    'plan.acq.normal': { 'zh-CN': '正常付费订阅', 'zh-TW': '正常付費訂閱', en: 'Standard Paid Plan' },
    'plan.cycle.monthly': { 'zh-CN': '月付', 'zh-TW': '月繳', en: 'Monthly' },
    'plan.cycle.yearly': { 'zh-CN': '年付', 'zh-TW': '年繳', en: 'Yearly' },
    'plan.cycle.oneTime': { 'zh-CN': '单次', 'zh-TW': '單次', en: 'One-time' },
    'plan.cny.approx': { 'zh-CN': '折合 ≈ {val}', 'zh-TW': '約 ≈ {val}', en: 'approx. {val}' },
    'plan.cnyApprox': { 'zh-CN': '折合 ≈ ¥{val} CNY/月', 'zh-TW': '折合 ≈ ¥{val} CNY/月', en: '≈ ¥{val} CNY/mo' },
    'plan.cnyShort': { 'zh-CN': '≈ ¥{val} CNY', 'zh-TW': '≈ ¥{val} CNY', en: '≈ ¥{val} CNY' },
    'plan.price.modePreset': { 'zh-CN': '跟随参考价', 'zh-TW': '跟隨參考價', en: 'Use reference' },
    'plan.price.modeCustom': { 'zh-CN': '自定义实付', 'zh-TW': '自訂實付', en: 'Custom paid' },
    'plan.btn.editCustom': { 'zh-CN': '自定义订阅设置', 'zh-TW': '自訂訂閱設定', en: 'Customize plan' },
    'plan.credits.avail': { 'zh-CN': '{avail} 可用 / {monthly} 月额度', 'zh-TW': '{avail} 可用 / {monthly} 月額度', en: '{avail} left / {monthly} monthly' },
    'plan.validity.expired': { 'zh-CN': '至 {date} · ⚠️ 权益已到期', 'zh-TW': '至 {date} · ⚠️ 權益已到期', en: 'Until {date} · ⚠️ Expired' },
    'plan.validity.active': { 'zh-CN': '至 {date} · 有效期内', 'zh-TW': '至 {date} · 有效期內', en: 'Until {date} · Active' },
    'plan.form.title': { 'zh-CN': '设置当前账号订阅信息', 'zh-TW': '設定目前帳號訂閱資訊', en: 'Configure Account Subscription' },
    'plan.form.acqLabel': { 'zh-CN': '获取方式 / 活动来源', 'zh-TW': '取得方式 / 活動來源', en: 'Acquisition / Promo Source' },
    'plan.form.acqCustomLabel': { 'zh-CN': '自定义活动 / 合作方名称', 'zh-TW': '自訂活動 / 合作方名稱', en: 'Custom Promo / Partner Name' },
    'plan.form.acqCustomPh': { 'zh-CN': '选填，如 Pixel 11 Pro 赠送', 'zh-TW': '選填，如 Pixel 11 Pro 贈送', en: 'Optional, e.g. Pixel bundle' },
    'plan.form.zeroExtra': { 'zh-CN': '本权益期间无需另付订阅费', 'zh-TW': '本權益期間無需另付訂閱費', en: 'No extra subscription fee during this period' },
    'plan.form.presetLabel': { 'zh-CN': '预设订阅国家与汇率 (可选快捷套用)', 'zh-TW': '預設訂閱國家與匯率 (可選快速套用)', en: 'Region & Exchange Rate Preset (optional)' },
    'plan.form.countryLabel': { 'zh-CN': '账号所在地区 (仅本地记录)', 'zh-TW': '帳號所在地區 (僅本機記錄)', en: 'Account Country (local only)' },
    'plan.form.regionLabel': { 'zh-CN': '订阅国家 (购买/结算地区)', 'zh-TW': '訂閱國家 (購買/結算地區)', en: 'Billing Country' },
    'plan.form.currencyLabel': { 'zh-CN': '订阅币种与实付金额', 'zh-TW': '訂閱幣別與實付金額', en: 'Currency & Paid Amount' },
    'plan.form.paidPh': { 'zh-CN': '实付金额', 'zh-TW': '實付金額', en: 'Amount' },
    'plan.form.cycleLabel': { 'zh-CN': '计费周期', 'zh-TW': '計費週期', en: 'Billing Cycle' },
    'plan.form.validEndLabel': { 'zh-CN': '权益到期日', 'zh-TW': '權益到期日', en: 'Expiration Date' },
    'plan.form.noteLabel': { 'zh-CN': '补充说明备注', 'zh-TW': '補充說明備註', en: 'Notes' },
    'plan.form.notePh': { 'zh-CN': '例如：Pixel 11 Pro 赠送 6 个月 / 家庭拼车', 'zh-TW': '例如：Pixel 11 Pro 贈送 6 個月 / 家庭共享', en: 'e.g. Device promo / family sharing' },
    'plan.form.clear': { 'zh-CN': '清除自定义', 'zh-TW': '清除自訂', en: 'Clear custom' },
    'plan.form.cancel': { 'zh-CN': '取消', 'zh-TW': '取消', en: 'Cancel' },
    'plan.form.save': { 'zh-CN': '保存', 'zh-TW': '儲存', en: 'Save' },
    'plan.form.presetPlaceholder': { 'zh-CN': '-- 选择预设地区 (自动填入价格与汇率) --', 'zh-TW': '-- 選擇預設地區 (自動填入價格與匯率) --', en: '-- Choose preset region (auto-fills price & rate) --' },
    'plan.form.presetCustom': { 'zh-CN': '✎ 自定义输入地区', 'zh-TW': '✎ 自訂輸入地區', en: '✎ Custom region' },
    'plan.form.countryPh': { 'zh-CN': '例如：美国 (US)', 'zh-TW': '例如：美國 (US)', en: 'e.g. United States (US)' },
    'plan.form.regionPh': { 'zh-CN': '例如：韩国 / 澳大利亚', 'zh-TW': '例如：韓國 / 澳洲', en: 'e.g. South Korea / Australia' },
    'plan.form.presetLine': { 'zh-CN': '{flag} {name} ({id}) · {sym}{price}/月 (≈ ¥{cny})', 'zh-TW': '{flag} {name} ({id}) · {sym}{price}/月 (≈ ¥{cny})', en: '{flag} {name} ({id}) · {sym}{price}/mo (≈ ¥{cny})' },
    'plan.form.presetLineCny': { 'zh-CN': '{flag} {name} (CNY) · ¥{price}/月', 'zh-TW': '{flag} {name} (CNY) · ¥{price}/月', en: '{flag} {name} (CNY) · ¥{price}/mo' },
    'plan.acqOpt.normal_paid': { 'zh-CN': '正常官方付费订阅', 'zh-TW': '正常官方付費訂閱', en: 'Standard paid subscription' },
    'plan.acqOpt.student_offer': { 'zh-CN': '学生教育优惠 (Google AI Pro 学生方案)', 'zh-TW': '學生教育優惠 (Google AI Pro 學生方案)', en: 'Student discount (Google AI Pro)' },
    'plan.acqOpt.pixel_bundle': { 'zh-CN': 'Pixel 手机购机赠送权益', 'zh-TW': 'Pixel 手機購機贈送權益', en: 'Pixel phone bundle perk' },
    'plan.acqOpt.chromebook_bundle': { 'zh-CN': 'Chromebook 购机赠送权益', 'zh-TW': 'Chromebook 購機贈送權益', en: 'Chromebook bundle perk' },
    'plan.acqOpt.samsung_galaxy': { 'zh-CN': 'Samsung Galaxy 手机赠送权益', 'zh-TW': 'Samsung Galaxy 手機贈送權益', en: 'Samsung Galaxy perk' },
    'plan.acqOpt.jio_offer': { 'zh-CN': 'Jio 运营商优惠活动', 'zh-TW': 'Jio 電信優惠活動', en: 'Jio carrier promotion' },
    'plan.acqOpt.partner_carrier': { 'zh-CN': '合作运营商 / 活动赠送', 'zh-TW': '合作電信商 / 活動贈送', en: 'Carrier / partner promotion' },
    'plan.acqOpt.family_sharing': { 'zh-CN': 'Google 家庭共享成员', 'zh-TW': 'Google 家庭共享成員', en: 'Google Family Sharing' },
    'plan.acqOpt.official_promo': { 'zh-CN': '官方试用 / 促销优惠', 'zh-TW': '官方試用 / 促銷優惠', en: 'Official trial / promo' },
    'plan.acqOpt.custom_source': { 'zh-CN': '其他自定义渠道', 'zh-TW': '其他自訂管道', en: 'Other custom source' },
    'plan.cycleOpt.monthly': { 'zh-CN': '月付', 'zh-TW': '月付', en: 'Monthly' },
    'plan.cycleOpt.yearly': { 'zh-CN': '年付', 'zh-TW': '年付', en: 'Yearly' },
    'plan.cycleOpt.free': { 'zh-CN': '免费 / 促销赠送', 'zh-TW': '免費 / 促銷贈送', en: 'Free / Promo' },
    'plan.cycleOpt.included': { 'zh-CN': '随套餐包含', 'zh-TW': '隨方案包含', en: 'Included in bundle' },
    'plan.cycleOpt.other': { 'zh-CN': '其他周期', 'zh-TW': '其他週期', en: 'Other cycle' },

    'cost.title': { 'zh-CN': '本期 API 参考金额', 'zh-TW': '本期 API 參考金額', en: 'Period API Reference Cost' },
    'cost.titleAll': { 'zh-CN': '全量 API 参考金额', 'zh-TW': '全量 API 參考金額', en: 'All-Time API Reference Cost' },
    'cost.periodTag': { 'zh-CN': '本月自然月', 'zh-TW': '本月自然月', en: 'This Calendar Month' },
    'cost.nonPaidBadge': { 'zh-CN': 'API折算 · 非实付', 'zh-TW': 'API換算 · 非實付', en: 'API Est. · Not Billed' },
    'cost.subUnknown': { 'zh-CN': '订阅实付：未填写', 'zh-TW': '訂閱實付：未填寫', en: 'Plan paid: Not set' },
    'cost.btnFill': { 'zh-CN': '补充', 'zh-TW': '補充', en: 'Edit' },
    'cost.btnExpand': { 'zh-CN': '详情 ▾', 'zh-TW': '詳情 ▾', en: 'Details ▾' },
    'cost.btnCollapse': { 'zh-CN': '收起 ▴', 'zh-TW': '收起 ▴', en: 'Hide ▴' },
    'cost.scopeLabel': { 'zh-CN': '统计范围:', 'zh-TW': '統計範圍:', en: 'Scope:' },
    'cost.scopePeriod': { 'zh-CN': '本期', 'zh-TW': '本期', en: 'This period' },
    'cost.scopeAll': { 'zh-CN': '全量历史', 'zh-TW': '全量歷史', en: 'All history' },
    'cost.modeLabel': { 'zh-CN': '估值模式:', 'zh-TW': '估值模式:', en: 'Pricing mode:' },
    'cost.modeRef': { 'zh-CN': '参考模型估算', 'zh-TW': '參考模型估算', en: 'Reference model' },
    'cost.modeHybrid': { 'zh-CN': '混合模式', 'zh-TW': '混合模式', en: 'Hybrid' },
    'cost.modeIdentified': { 'zh-CN': '仅已识别模型', 'zh-TW': '僅已識別模型', en: 'Identified only' },
    'cost.card.input': { 'zh-CN': '输入 Token', 'zh-TW': '輸入 Token', en: 'Input Tokens' },
    'cost.card.cache': { 'zh-CN': '缓存读取 (优惠)', 'zh-TW': '快取讀取 (優惠)', en: 'Cache Read (discounted)' },
    'cost.card.output': { 'zh-CN': '输出 Token', 'zh-TW': '輸出 Token', en: 'Output Tokens' },
    'cost.analyzing': { 'zh-CN': '正在分析请求模型与计价覆盖率…', 'zh-TW': '正在分析請求模型與計價覆蓋率…', en: 'Analyzing model calls and pricing coverage…' },
    'cost.disclaimer': {
      'zh-CN': '注：此折算反映按公开零售价调用同等资源之费用，包月订阅/活动赠送与 API 零售非同类计费模式，该差额不等于真实节省现金；缓存读取按 10% 优惠计价；不含缓存存储费与搜索落地费用。',
      'zh-TW': '註：此換算反映依公開零售價呼叫同等資源之費用，包月訂閱/活動贈送與 API 零售非同類計費模式，該差額不等於真實節省現金；快取讀取依 10% 優惠計價；不含快取儲存費與搜尋落地費用。',
      en: 'Note: Estimates reflect public API retail rates for equivalent usage. Subscriptions/promos differ from pay-as-you-go API billing; differences do not equal cash saved. Cache reads are priced at 10%.'
    },
    'cost.allHistory': { 'zh-CN': '全历史累计', 'zh-TW': '全歷史累計', en: 'All history' },
    'cost.approx': { 'zh-CN': '约 ${val}', 'zh-TW': '約 ${val}', en: '~${val}' },
    'cost.notReady': { 'zh-CN': '数据未就绪', 'zh-TW': '資料尚未就緒', en: 'Not ready' },
    'cost.noRecords': { 'zh-CN': '暂无记录', 'zh-TW': '暫無記錄', en: 'No records' },
    'cost.unpriced': { 'zh-CN': '暂无法估值', 'zh-TW': '暫無法估值', en: 'Unpriced' },
    'cost.refSub': { 'zh-CN': '统一按 {model} 估算 (输入 ${in} / 缓存 ${ca} / 输出 ${out} 每百万 Token)', 'zh-TW': '統一依 {model} 估算 (輸入 ${in} / 快取 ${ca} / 輸出 ${out} 每百萬 Token)', en: 'Estimated via {model} (In ${in} / Cache ${ca} / Out ${out} per 1M)' },
    'cost.hybridSub': { 'zh-CN': '混合模式：已识别 ${known} + 未知折算 ${res}', 'zh-TW': '混合模式：已識別 ${known} + 未知換算 ${res}', en: 'Hybrid: Identified ${known} + Residual ${res}' },
    'cost.hybridBadge': { 'zh-CN': '混合模式折算', 'zh-TW': '混合模式換算', en: 'Hybrid mode' },
    'cost.identSub': { 'zh-CN': '仅计入 {n} 条已知真实模型调用', 'zh-TW': '僅計入 {n} 筆已知真實模型呼叫', en: 'Only {n} identified model call(s) included' },
    'cost.identSubNone': { 'zh-CN': '当前范围内请求缺少模型型号（未按 $0 计入）', 'zh-TW': '目前範圍內請求缺少模型型號（未依 $0 計入）', en: 'Requests lack model IDs (not counted as $0)' },
    'cost.covPct': { 'zh-CN': '{pct}% 计价覆盖', 'zh-TW': '{pct}% 計價覆蓋', en: '{pct}% priced' },
    'cost.tokCacheDiscount': { 'zh-CN': '{tok} tok (优惠)', 'zh-TW': '{tok} tok (優惠)', en: '{tok} tok (disc.)' },
    'cost.tokResidual': { 'zh-CN': '剩余 {tok} tok', 'zh-TW': '剩餘 {tok} tok', en: 'Rem. {tok} tok' },
    'cost.usageSummary': { 'zh-CN': '累计处理 Token: {total} (含 {cache} 缓存读取)', 'zh-TW': '累計處理 Token: {total} (含 {cache} 快取讀取)', en: 'Total tokens: {total} (incl. {cache} cache)' },
    'cost.diffAll': { 'zh-CN': '全量累计不直接与单月费用做差额比较 · 避免跨月虚高', 'zh-TW': '全量累計不直接與單月費用做差額比較 · 避免跨月虛高', en: 'All-time totals are not compared against monthly fees' },
    'cost.diffFree': { 'zh-CN': '与此 API 方案参考差额 约 +${val} (免费权益使用中 · 不计算无限倍数)', 'zh-TW': '與此 API 方案參考差額 約 +${val} (免費權益使用中 · 不計算無限倍數)', en: 'Diff vs API: ~+${val} (free promo active)' },
    'cost.diffPaid': { 'zh-CN': '与此 API 方案参考差额 {sign}${val} (API折算 - 实际支出 · 仅供参考比较)', 'zh-TW': '與此 API 方案參考差額 {sign}${val} (API換算 - 實際支出 · 僅供參考比較)', en: 'Diff vs API: {sign}${val} (API est. - paid · reference only)' },
    'cost.diffUnknown': { 'zh-CN': '跨币种或实付未知 · 并列展示不计算差额', 'zh-TW': '跨幣別或實付未知 · 並列顯示不計算差額', en: 'Cross-currency or paid amount unknown' },
    'cost.subLineFree': { 'zh-CN': '订阅额外实付：{sym}0 ({src})', 'zh-TW': '訂閱額外實付：{sym}0 ({src})', en: 'Extra plan paid: {sym}0 ({src})' },
    'cost.subLinePaid': { 'zh-CN': '订阅实付：{sym}{val}{cny} ({cycle}{exp})', 'zh-TW': '訂閱實付：{sym}{val}{cny} ({cycle}{exp})', en: 'Plan paid: {sym}{val}{cny} ({cycle}{exp})' },
    'cost.breakdownPrefix': { 'zh-CN': '已识别真实模型明细：{details}{note}。', 'zh-TW': '已識別真實模型明細：{details}{note}。', en: 'Identified models: {details}{note}.' },
    'cost.breakdownNone': { 'zh-CN': '暂无已匹配真实模型', 'zh-TW': '暫無已匹配真實模型', en: 'No matched model calls yet' },
    'cost.subSpendLabel': { 'zh-CN': '本人同期实际支出', 'zh-TW': '本人同期實際支出', en: 'Your Actual Spend' },
    'cost.freePromo': { 'zh-CN': '免费活动', 'zh-TW': '免費活動', en: 'Free promo' },
    'cost.subSpend': { 'zh-CN': '订阅支出', 'zh-TW': '訂閱支出', en: 'Plan spend' },
    'cost.paidLabel': { 'zh-CN': '实付', 'zh-TW': '實付', en: 'Paid' },
    'cost.paidUnknown': { 'zh-CN': '实付未知', 'zh-TW': '實付未知', en: 'Paid unknown' },
    'cost.publicRefMonthly': { 'zh-CN': '公开参考价 ${p}/月（实付未确认）', 'zh-TW': '公開參考價 ${p}/月（實付未確認）', en: 'Public ref ${p}/mo (paid unconfirmed)' },
    'cost.unknown': { 'zh-CN': '未知', 'zh-TW': '未知', en: 'Unknown' },
    'cost.noPlanData': { 'zh-CN': '未获取到套餐与实付数据', 'zh-TW': '未取得方案與實付資料', en: 'No plan or spend data available' },
    'cost.allNoCompare': { 'zh-CN': ' · 全量累计不直接对比单月支出', 'zh-TW': ' · 全量累計不直接對比單月支出', en: ' · All-time not compared to monthly spend' },
    'cost.expiredTag': { 'zh-CN': ' · ⚠️ 权益已到期', 'zh-TW': ' · ⚠️ 權益已到期', en: ' · ⚠️ Expired' },
    'cost.freeActive': { 'zh-CN': '{src} · 用户确认 · 免费权益使用中{extra}', 'zh-TW': '{src} · 使用者確認 · 免費權益使用中{extra}', en: '{src} · Confirmed · Free active{extra}' },
    'cost.covFull': { 'zh-CN': '100% 折算覆盖', 'zh-TW': '100% 換算覆蓋', en: '100% priced' },
    'cost.refApprox': { 'zh-CN': '约 ${val}', 'zh-TW': '約 ${val}', en: '~${val}' }
  };

  function t(key, vars = null) {
    const entry = PANEL_I18N[key];
    let text = entry ? (entry[currentPanelLanguage] || entry['zh-CN'] || key) : key;
    if (vars && typeof vars === 'object') {
      for (const [k, v] of Object.entries(vars)) {
        text = text.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v ?? ''));
      }
    }
    return text;
  }

  function applyStaticPanelTranslations() {
    if (!shadow || typeof shadow.querySelectorAll !== 'function') return;
    shadow.querySelectorAll('[data-i18n]').forEach(node => {
      const key = node.getAttribute('data-i18n');
      if (key) node.textContent = t(key);
    });
    shadow.querySelectorAll('[data-i18n-aria]').forEach(node => {
      const key = node.getAttribute('data-i18n-aria');
      if (key) node.setAttribute('aria-label', t(key));
    });
    shadow.querySelectorAll('[data-i18n-title]').forEach(node => {
      const key = node.getAttribute('data-i18n-title');
      if (key) node.setAttribute('title', t(key));
    });
    shadow.querySelectorAll('[data-i18n-placeholder]').forEach(node => {
      const key = node.getAttribute('data-i18n-placeholder');
      if (key && 'placeholder' in node) node.placeholder = t(key);
    });
    shadow.querySelectorAll('[data-i18n-data-color-label]').forEach(node => {
      const key = node.getAttribute('data-i18n-data-color-label');
      if (key) node.setAttribute('data-color-label', t(key));
    });
  }

  const BACKEND_EXACT_TRANSLATIONS = {
    '月付': { 'zh-CN': '月付', 'zh-TW': '月繳', en: 'Monthly' },
    '年付': { 'zh-CN': '年付', 'zh-TW': '年繳', en: 'Yearly' },
    '单次': { 'zh-CN': '单次', 'zh-TW': '單次', en: 'One-time' },
    '随套餐赠送/免费': { 'zh-CN': '随套餐赠送/免费', 'zh-TW': '隨方案贈送/免費', en: 'Included / Free' },
    '正常付费订阅': { 'zh-CN': '正常付费订阅', 'zh-TW': '正常付費訂閱', en: 'Standard Paid Plan' },
    '学生教育优惠': { 'zh-CN': '学生教育优惠', 'zh-TW': '學生教育優惠', en: 'Student Discount' },
    'Google 家庭共享': { 'zh-CN': 'Google 家庭共享', 'zh-TW': 'Google 家庭共享', en: 'Google Family Sharing' },
    '官方试用/促销': { 'zh-CN': '官方试用/促销', 'zh-TW': '官方試用/促銷', en: 'Official Trial / Promo' },
    '未知': { 'zh-CN': '未知', 'zh-TW': '未知', en: 'Unknown' },
    '未识别': { 'zh-CN': '未识别', 'zh-TW': '未識別', en: 'Unidentified' }
  };

  function translateBackendText(text) {
    if (!text) return '';
    const str = String(text);
    const exact = BACKEND_EXACT_TRANSLATIONS[str];
    if (exact) return exact[currentPanelLanguage] || str;
    return str;
  }

  function localizeBillingCycleLabel(cycle) {
    if (!cycle) return t('plan.cycle.monthly');
    return translateBackendText(cycle);
  }

  function localizeAcquisitionSource(src) {
    if (!src) return t('plan.acq.normal');
    return translateBackendText(src);
  }

  function localizeCnyFormatted(str) {
    if (!str) return '';
    if (currentPanelLanguage === 'en') {
      return String(str).replace(/折合\s*/g, '').replace(/约/g, 'approx.');
    }
    if (currentPanelLanguage === 'zh-TW') {
      return String(str).replace(/折合/g, '約').replace(/约/g, '約');
    }
    return String(str);
  }

  function localizeUnknownLabel(val, fallback) {
    const raw = val ? String(val).trim() : '';
    if (!raw || raw === '未知' || raw === 'Unknown') return fallback || t('common.unknown');
    return translateBackendText(raw);
  }

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

      // Module: Heatmaps & Summary Bar (Daily / Weekly / Monthly / Yearly / Cumulative)
  const DAILY_WINDOW_WEEKS = 52;
  const DAILY_WINDOW_DAYS = DAILY_WINDOW_WEEKS * 7;
  const WEEKLY_WINDOW_WEEKS = 12;
  const MONTHLY_WINDOW_MONTHS = 12;
  const YEARLY_WINDOW_YEARS = 6;
  let currentHeatView = 'daily';
  let heatmapRangeOffset = 0;
  let lastHeatNavState = { canPrev: false, canNext: false };

  function pad2(n) {
    return String(n).padStart(2, '0');
  }

  function toYmd(d) {
    return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
  }

  function ymdToDayIndex(ymd) {
    const [y, m, d] = String(ymd).split('-').map(Number);
    return Math.floor(Date.UTC(y, (m || 1) - 1, d || 1) / 86400000);
  }

  function dayIndexToYmd(idx) {
    const d = new Date(idx * 86400000);
    return `${d.getUTCFullYear()}-${pad2(d.getUTCMonth() + 1)}-${pad2(d.getUTCDate())}`;
  }

  function getWeekStartIdx(dayIdx) {
    const d = new Date(dayIdx * 86400000);
    const dow = d.getUTCDay();
    return dayIdx - (dow === 0 ? 6 : dow - 1);
  }

  function getTodayLocalStr() {
    return toYmd(new Date());
  }

  function normalizeDayRecord(raw) {
    if (!raw || typeof raw !== 'object') return { total: 0, input: 0, output: 0, cache: 0, steps: 0 };
    const input = Number(raw.input ?? raw.prompt ?? 0);
    const output = Number(raw.output ?? 0);
    const cache = Number(raw.cache ?? raw.cacheRead ?? 0);
    const total = Number(raw.total ?? (input + output + cache));
    return { total, input, output, cache, steps: Number(raw.steps || 0) };
  }

  function getActiveDailyMap(data) {
    const src = ANTIGRAVITY_TOKEN_DATA.activeSource || 'all';
    const d = data || ANTIGRAVITY_TOKEN_DATA.raw || {};
    const rawMap = (d.dailyMapBySource && d.dailyMapBySource[src]) || d.dailyMap || {};
    const normalized = {};
    for (const [k, v] of Object.entries(rawMap)) {
      if (/^\d{4}-\d{2}-\d{2}$/.test(k)) normalized[k] = normalizeDayRecord(v);
    }
    return normalized;
  }

  function getFirstUseDate(data, dailyMap) {
    const keys = Object.keys(dailyMap || {})
      .filter(k => /^\d{4}-\d{2}-\d{2}$/.test(k) && (dailyMap[k]?.total || 0) > 0)
      .sort();
    if (keys.length) return keys[0];
    const d = data || ANTIGRAVITY_TOKEN_DATA.raw || {};
    const fallback = d.firstUseDate || d.summary?.firstUseDate || null;
    return (typeof fallback === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(fallback)) ? fallback : null;
  }

  function formatDateSpanLabel(startStr, endStr) {
    if (!startStr && !endStr) return '—';
    if (!endStr || startStr === endStr) return startStr || endStr;
    if (startStr.slice(0, 4) === endStr.slice(0, 4)) {
      return `${startStr} ~ ${endStr.slice(5)}`;
    }
    return `${startStr} ~ ${endStr}`;
  }

  function computeTimelineWindow(view, dailyMap, firstUse, rawOffset = 0, todayStr = getTodayLocalStr()) {
    const today = todayStr || getTodayLocalStr();
    const todayIdx = ymdToDayIndex(today);
    const hasValidFirst = Boolean(firstUse && /^\d{4}-\d{2}-\d{2}$/.test(firstUse));
    const minDateStr = hasValidFirst && firstUse <= today ? firstUse : today;
    const minIdx = ymdToDayIndex(minDateStr);
    const offset = Number.isFinite(rawOffset) ? Math.trunc(rawOffset) : 0;

    if (view === 'weekly') {
      const todayWeekStart = getWeekStartIdx(todayIdx);
      const firstWeekStart = getWeekStartIdx(minIdx);
      const totalWeeks = Math.max(1, Math.floor((todayWeekStart - firstWeekStart) / 7) + 1);
      let safeOffset = 0;
      let winStartWeekStart;
      if (totalWeeks <= WEEKLY_WINDOW_WEEKS) {
        winStartWeekStart = firstWeekStart;
      } else {
        const latestStartWeek = todayWeekStart - (WEEKLY_WINDOW_WEEKS - 1) * 7;
        const maxPagesBack = Math.ceil((latestStartWeek - firstWeekStart) / (WEEKLY_WINDOW_WEEKS * 7));
        safeOffset = Math.max(-maxPagesBack, Math.min(0, offset));
        winStartWeekStart = Math.max(firstWeekStart, latestStartWeek + safeOffset * WEEKLY_WINDOW_WEEKS * 7);
      }
      const winEndWeekStart = winStartWeekStart + (WEEKLY_WINDOW_WEEKS - 1) * 7;
      return {
        view,
        todayStr: today,
        minDateStr,
        minIdx,
        todayIdx,
        safeOffset,
        winStartWeekStart,
        winEndWeekStart,
        canPrev: winStartWeekStart > firstWeekStart,
        canNext: safeOffset < 0
      };
    }

    if (view === 'monthly') {
      const todayYmIdx = Number(today.slice(0, 4)) * 12 + (Number(today.slice(5, 7)) - 1);
      const firstYmIdx = Number(minDateStr.slice(0, 4)) * 12 + (Number(minDateStr.slice(5, 7)) - 1);
      const totalMonths = Math.max(1, todayYmIdx - firstYmIdx + 1);
      let safeOffset = 0;
      let startYmIdx;
      if (totalMonths <= MONTHLY_WINDOW_MONTHS) {
        startYmIdx = firstYmIdx;
      } else {
        const latestStartYm = todayYmIdx - MONTHLY_WINDOW_MONTHS + 1;
        const maxPagesBack = Math.ceil((latestStartYm - firstYmIdx) / MONTHLY_WINDOW_MONTHS);
        safeOffset = Math.max(-maxPagesBack, Math.min(0, offset));
        startYmIdx = Math.max(firstYmIdx, latestStartYm + safeOffset * MONTHLY_WINDOW_MONTHS);
      }
      const endYmIdx = startYmIdx + MONTHLY_WINDOW_MONTHS - 1;
      const monthItems = [];
      for (let idx = startYmIdx; idx <= endYmIdx; idx++) {
        monthItems.push({
          year: Math.floor(idx / 12),
          month: (idx % 12) + 1
        });
      }
      return {
        view,
        todayStr: today,
        minDateStr,
        minIdx,
        todayIdx,
        safeOffset,
        startYmIdx,
        endYmIdx,
        monthItems,
        canPrev: startYmIdx > firstYmIdx,
        canNext: safeOffset < 0
      };
    }

    if (view === 'yearly') {
      const curYear = Number(today.slice(0, 4));
      const firstYear = Number(minDateStr.slice(0, 4));
      const totalYears = Math.max(1, curYear - firstYear + 1);
      let safeOffset = 0;
      let startYear;
      if (totalYears <= YEARLY_WINDOW_YEARS) {
        startYear = firstYear;
      } else {
        const latestStartYear = curYear - YEARLY_WINDOW_YEARS + 1;
        const maxPagesBack = Math.ceil((latestStartYear - firstYear) / YEARLY_WINDOW_YEARS);
        safeOffset = Math.max(-maxPagesBack, Math.min(0, offset));
        startYear = Math.max(firstYear, latestStartYear + safeOffset * YEARLY_WINDOW_YEARS);
      }
      const endYear = startYear + YEARLY_WINDOW_YEARS - 1;
      const years = [];
      for (let y = startYear; y <= endYear; y++) years.push(y);
      return {
        view,
        todayStr: today,
        minDateStr,
        minIdx,
        todayIdx,
        curYear,
        safeOffset,
        startYear,
        endYear,
        years,
        canPrev: startYear > firstYear,
        canNext: safeOffset < 0
      };
    }

    const totalDays = Math.max(1, todayIdx - minIdx + 1);
    let safeOffset = 0;
    let winStartIdx;
    if (totalDays <= DAILY_WINDOW_DAYS) {
      winStartIdx = minIdx;
    } else {
      const latestStart = todayIdx - DAILY_WINDOW_DAYS + 1;
      const stepDays = 26 * 7;
      const maxPagesBack = Math.ceil((latestStart - minIdx) / stepDays);
      safeOffset = Math.max(-maxPagesBack, Math.min(0, offset));
      winStartIdx = Math.max(minIdx, latestStart + safeOffset * stepDays);
    }
    const winEndIdx = winStartIdx + DAILY_WINDOW_DAYS - 1;
    return {
      view,
      todayStr: today,
      minDateStr,
      minIdx,
      todayIdx,
      safeOffset,
      winStartIdx,
      winEndIdx,
      winStartStr: dayIndexToYmd(winStartIdx),
      winEndStr: dayIndexToYmd(winEndIdx),
      canPrev: winStartIdx > minIdx,
      canNext: safeOffset < 0
    };
  }

  function hideHeatPop() {
    const pop = el('heat-pop');
    if (pop) pop.hidden = true;
  }

  function showHeatPop(anchorEl, html) {
    const pop = el('heat-pop');
    if (!pop) return;
    pop.innerHTML = html;
    pop.hidden = false;
    try {
      const vw = (typeof window !== 'undefined' && window.innerWidth) || 1280;
      const vh = (typeof window !== 'undefined' && window.innerHeight) || 800;
      const r = anchorEl?.getBoundingClientRect?.();
      const pw = pop.offsetWidth || 220;
      const ph = pop.offsetHeight || 90;
      let left = r ? Math.round(r.left + r.width / 2 - pw / 2) : Math.round((vw - pw) / 2);
      let top = r ? Math.round(r.top - ph - 8) : 120;
      if (top < 12 && r) top = Math.round(r.bottom + 8);
      left = Math.max(8, Math.min(vw - pw - 8, left));
      top = Math.max(8, Math.min(vh - ph - 8, top));
      pop.style.left = `${left}px`;
      pop.style.top = `${top}px`;
    } catch {}
  }

  function formatDayBreakdownHtml(titleLine, row, costUsd, extraLine = '') {
    const r = normalizeDayRecord(row);
    const prompt = formatTokensK(r.input);
    const out = formatTokensK(r.output);
    const cache = formatTokensK(r.cache);
    const total = formatTokensK(r.total);
    const parts = [
      `<div class="heat-pop-date">${escapeHtml(titleLine)}</div>`,
      `<div class="heat-pop-tok">${escapeHtml(total)} tokens · ≈ $${Number(costUsd || 0).toFixed(2)}</div>`,
      `<div class="heat-pop-detail">${escapeHtml(t('heat.prompt'))}: ${escapeHtml(prompt)} · ${escapeHtml(t('heat.output'))}: ${escapeHtml(out)} · ${escapeHtml(t('heat.cache'))}: ${escapeHtml(cache)}</div>`
    ];
    if (extraLine) {
      parts.push(`<div class="heat-pop-models">${escapeHtml(extraLine)}</div>`);
    }
    return parts.join('');
  }

  function updateSummaryBar(intervalStats) {
    const tokEl = el('hs-tokens');
    const costEl = el('hs-cost');
    const avgEl = el('hs-daily-avg');
    const activeAvgEl = el('hs-active-avg');
    const roiEl = el('hs-sub-ratio');
    const stats = intervalStats || { totalTokens: 0, totalCostUSD: 0, dailyAverageUSD: 0, activeDailyAverageUSD: 0, activeDays: 0 };

    if (tokEl) tokEl.textContent = formatTokensK(stats.totalTokens || 0);
    if (costEl) costEl.textContent = `≈ $${Number(stats.totalCostUSD || 0).toFixed(2)}`;
    if (avgEl) avgEl.textContent = `$${Number(stats.dailyAverageUSD || 0).toFixed(2)}`;
    if (activeAvgEl) {
      activeAvgEl.textContent = t('heat.activeDays', {
        avg: Number(stats.activeDailyAverageUSD || 0).toFixed(2),
        days: stats.activeDays || 0
      });
    }

    if (roiEl) {
      const ps = ANTIGRAVITY_TOKEN_DATA.planStatus || {};
      const paid = ps.actualPricePaid !== null && ps.actualPricePaid !== undefined ? Number(ps.actualPricePaid) : null;
      const cur = ps.currency || 'USD';
      let monthlyUsd = null;
      if (ps.isZeroExtraCost || paid === 0) {
        roiEl.textContent = t('cost.freePromo');
        return;
      }
      if (paid && Number.isFinite(paid) && paid > 0) {
        if (cur === 'USD') monthlyUsd = paid;
        else if (core?.convertToCNY) monthlyUsd = core.convertToCNY(paid, cur, ps.region) / 7.2;
      } else if (ps.publicRefPriceUsd && Number.isFinite(Number(ps.publicRefPriceUsd))) {
        monthlyUsd = Number(ps.publicRefPriceUsd);
      }
      if (monthlyUsd && monthlyUsd > 0 && stats.totalCostUSD > 0) {
        roiEl.textContent = t('heat.roi', { ratio: (stats.totalCostUSD / monthlyUsd).toFixed(1) });
      } else {
        roiEl.textContent = '—';
      }
    }
  }

  function updateNavButtonsState() {
    const prevBtn = el('btn-heat-prev');
    const nextBtn = el('btn-heat-next');
    if (prevBtn) prevBtn.disabled = !lastHeatNavState.canPrev;
    if (nextBtn) nextBtn.disabled = !lastHeatNavState.canNext;
  }

  function bindCellHover(cellEl, htmlBuilder) {
    cellEl.addEventListener('mouseenter', () => showHeatPop(cellEl, htmlBuilder()));
    cellEl.addEventListener('click', e => {
      e?.stopPropagation?.();
      showHeatPop(cellEl, htmlBuilder());
    });
    cellEl.addEventListener('mouseleave', () => hideHeatPop());
  }

  function renderDailyOrCumHeatmap(dailyMap, firstUse, isCum = false) {
    const grid = el('heatmap-grid');
    if (!grid) return;
    grid.innerHTML = '';

    const todayStr = getTodayLocalStr();
    const win = computeTimelineWindow(isCum ? 'cum' : 'daily', dailyMap, firstUse, heatmapRangeOffset, todayStr);
    heatmapRangeOffset = win.safeOffset;
    lastHeatNavState = { canPrev: win.canPrev, canNext: win.canNext };
    updateNavButtonsState();

    const dayList = [];
    for (let idx = win.winStartIdx; idx <= win.winEndIdx; idx++) {
      dayList.push(dayIndexToYmd(idx));
    }

    const rangeLabel = el('heat-range-label');
    if (rangeLabel) {
      rangeLabel.textContent = formatDateSpanLabel(win.winStartStr, win.winEndStr);
    }

    const values = [];
    let runningTotal = 0;
    if (isCum) {
      for (const [ds, row] of Object.entries(dailyMap)) {
        if (ds >= win.minDateStr && ds < win.winStartStr && ds <= todayStr) {
          runningTotal += Number(row?.total || 0);
        }
      }
    }
    const dayPoints = dayList.map(ds => {
      const row = normalizeDayRecord(dailyMap[ds]);
      const isFuture = ds > todayStr;
      if (!isFuture) runningTotal += row.total;
      const val = isCum ? (isFuture ? 0 : runningTotal) : (isFuture ? 0 : row.total);
      if (!isFuture && val > 0) values.push(val);
      return { ds, row, val, isFuture };
    });

    const maxVal = values.length ? Math.max(...values) : 0;
    const weeksWrap = document.createElement('div');
    weeksWrap.className = 'heat-grid-weeks';

    const intervalDates = [];
    let colEl = null;
    dayPoints.forEach((pt, idx) => {
      if (idx % 7 === 0) {
        colEl = document.createElement('div');
        colEl.className = 'heat-day-col';
        weeksWrap.appendChild(colEl);
      }
      const cell = document.createElement('button');
      cell.type = 'button';
      cell.className = 'heat-cell';
      cell.setAttribute('data-date', pt.ds);
      if (pt.isFuture) cell.classList.add('is-future');
      if (pt.ds === todayStr) cell.classList.add('is-today');
      if (firstUse && pt.ds === firstUse) cell.classList.add('is-first-use');
      const lvl = pt.isFuture
        ? 0
        : (core?.getLvlForRange ? core.getLvlForRange(pt.val, isCum ? 'cum' : 'day', maxVal) : (pt.val > 0 ? 2 : 0));
      cell.setAttribute('data-level', String(lvl));
      cell.setAttribute('aria-label', `${pt.ds}: ${formatTokensK(pt.val)}`);

      if (!pt.isFuture) intervalDates.push(pt.ds);

      bindCellHover(cell, () => {
        if (pt.isFuture) {
          return `<div class="heat-pop-date">${escapeHtml(pt.ds)}</div><div class="heat-pop-detail">${escapeHtml(t('heat.future'))}</div>`;
        }
        const cost = core?.getDailyModelCost ? core.getDailyModelCost(pt.row, pt.ds).costUSD : 0;
        let tags = '';
        if (pt.ds === todayStr) tags += t('heat.today');
        if (firstUse && pt.ds === firstUse) tags += t('heat.firstUse');
        const extra = isCum ? t('heat.cumTotal', { avg: Number(cost).toFixed(2) }) : '';
        return formatDayBreakdownHtml(`${pt.ds}${tags}${isCum ? t('heat.cumSuffix') : ''}`, pt.row, cost, extra);
      });

      colEl?.appendChild(cell);
    });

    grid.appendChild(weeksWrap);
    const stats = core?.calculateIntervalCost
      ? core.calculateIntervalCost(dailyMap, intervalDates, undefined, { todayStr })
      : { totalTokens: 0, totalCostUSD: 0, dailyAverageUSD: 0, activeDailyAverageUSD: 0, activeDays: 0 };
    updateSummaryBar(stats);
  }

  function renderHeatmapWeekly(dailyMap, firstUse) {
    const grid = el('heatmap-grid');
    if (!grid) return;
    grid.innerHTML = '';

    const todayStr = getTodayLocalStr();
    const win = computeTimelineWindow('weekly', dailyMap, firstUse, heatmapRangeOffset, todayStr);
    heatmapRangeOffset = win.safeOffset;
    lastHeatNavState = { canPrev: win.canPrev, canNext: win.canNext };
    updateNavButtonsState();

    const weekBuckets = [];
    for (let wStartIdx = win.winStartWeekStart; wStartIdx <= win.winEndWeekStart; wStartIdx += 7) {
      const isFuture = wStartIdx > win.todayIdx;
      if (isFuture) {
        weekBuckets.push({
          startStr: dayIndexToYmd(wStartIdx),
          endStr: dayIndexToYmd(wStartIdx + 6),
          dates: [],
          sum: { total: 0, input: 0, output: 0, cache: 0 },
          isFuture: true
        });
        continue;
      }
      const effStartIdx = Math.max(wStartIdx, win.minIdx);
      const effEndIdx = Math.min(wStartIdx + 6, win.todayIdx);
      const dates = [];
      const sum = { total: 0, input: 0, output: 0, cache: 0 };
      for (let dIdx = effStartIdx; dIdx <= effEndIdx; dIdx++) {
        const ymd = dayIndexToYmd(dIdx);
        dates.push(ymd);
        const r = normalizeDayRecord(dailyMap[ymd]);
        sum.total += r.total;
        sum.input += r.input;
        sum.output += r.output;
        sum.cache += r.cache;
      }
      weekBuckets.push({
        startStr: dayIndexToYmd(Math.max(wStartIdx, win.minIdx)),
        endStr: dayIndexToYmd(wStartIdx + 6),
        dates,
        sum,
        isFuture: false
      });
    }

    const rangeLabel = el('heat-range-label');
    if (rangeLabel) {
      rangeLabel.textContent = weekBuckets.length
        ? formatDateSpanLabel(weekBuckets[0].startStr, weekBuckets[weekBuckets.length - 1].endStr)
        : '—';
    }

    const maxTotal = Math.max(0, ...weekBuckets.map(b => b.sum.total));
    const wrap = document.createElement('div');
    wrap.className = 'heatmap-monthly-grid';
    const allDates = [];

    for (const b of weekBuckets) {
      if (!b.isFuture) allDates.push(...b.dates);
      const stats = (!b.isFuture && core?.calculateIntervalCost)
        ? core.calculateIntervalCost(dailyMap, b.dates, undefined, { todayStr })
        : { totalCostUSD: 0, dailyAverageUSD: 0 };
      const lvl = b.isFuture
        ? 0
        : (core?.getLvlForRange ? core.getLvlForRange(b.sum.total, 'week', maxTotal) : (b.sum.total > 0 ? 2 : 0));
      const card = document.createElement('div');
      card.className = 'heat-month-card';
      if (b.isFuture) card.classList.add('is-future');
      card.setAttribute('data-level', String(lvl));
      card.setAttribute('data-week-start', b.startStr);
      card.setAttribute('data-week-end', b.endStr);
      const weekName = b.startStr === b.endStr
        ? b.startStr.slice(5)
        : `${b.startStr.slice(5)}–${b.endStr.slice(5)}`;
      card.innerHTML = `<div class="heat-month-name">${escapeHtml(weekName)}</div><div class="heat-month-val">${escapeHtml(b.isFuture ? '—' : formatTokensK(b.sum.total))}</div><div class="heat-month-sub">${b.isFuture ? '—' : `≈ $${Number(stats.totalCostUSD || 0).toFixed(2)}`}</div>`;
      bindCellHover(card, () => b.isFuture
        ? `<div class="heat-pop-date">${escapeHtml(formatDateSpanLabel(b.startStr, b.endStr))}</div><div class="heat-pop-detail">${escapeHtml(t('heat.future'))}</div>`
        : formatDayBreakdownHtml(
          formatDateSpanLabel(b.startStr, b.endStr),
          b.sum,
          stats.totalCostUSD,
          t('heat.weeklyTotal', { avg: Number(stats.dailyAverageUSD || 0).toFixed(2) })
        ));
      wrap.appendChild(card);
    }

    grid.appendChild(wrap);
    const totalStats = core?.calculateIntervalCost
      ? core.calculateIntervalCost(dailyMap, allDates, undefined, { todayStr })
      : { totalTokens: 0, totalCostUSD: 0, dailyAverageUSD: 0, activeDailyAverageUSD: 0, activeDays: 0 };
    updateSummaryBar(totalStats);
  }

  function renderHeatmapMonthly(dailyMap, firstUse) {
    const grid = el('heatmap-grid');
    if (!grid) return;
    grid.innerHTML = '';

    const todayStr = getTodayLocalStr();
    const win = computeTimelineWindow('monthly', dailyMap, firstUse, heatmapRangeOffset, todayStr);
    heatmapRangeOffset = win.safeOffset;
    lastHeatNavState = { canPrev: win.canPrev, canNext: win.canNext };
    updateNavButtonsState();

    const monthItems = Array.isArray(win.monthItems) ? win.monthItems : [];
    const rangeLabel = el('heat-range-label');
    if (rangeLabel && monthItems.length) {
      const firstM = monthItems[0];
      const lastM = monthItems[monthItems.length - 1];
      if (firstM.year === lastM.year && firstM.month === 1 && lastM.month === 12) {
        rangeLabel.textContent = t('tokens.range.year', { y: firstM.year });
      } else {
        rangeLabel.textContent = `${firstM.year}-${pad2(firstM.month)} ~ ${lastM.year}-${pad2(lastM.month)}`;
      }
    }

    const months = [];
    const allDates = [];
    const curMonthPrefix = todayStr.slice(0, 7);
    for (const mi of monthItems) {
      const targetYear = mi.year;
      const m = mi.month;
      const mPrefix = `${targetYear}-${pad2(m)}`;
      const isFuture = mPrefix > curMonthPrefix;
      const daysInMonth = new Date(targetYear, m, 0).getDate();
      const fullDates = [];
      if (!isFuture) {
        for (let day = 1; day <= daysInMonth; day++) {
          const ymd = `${mPrefix}-${pad2(day)}`;
          if (ymd >= win.minDateStr && ymd <= todayStr) {
            fullDates.push(ymd);
            allDates.push(ymd);
          }
        }
      }
      const sum = { total: 0, input: 0, output: 0, cache: 0 };
      for (const ds of fullDates) {
        if (!dailyMap[ds]) continue;
        const r = normalizeDayRecord(dailyMap[ds]);
        sum.total += r.total;
        sum.input += r.input;
        sum.output += r.output;
        sum.cache += r.cache;
      }
      const stats = (!isFuture && core?.calculateIntervalCost)
        ? core.calculateIntervalCost(dailyMap, fullDates, undefined, { todayStr })
        : { totalCostUSD: 0, dailyAverageUSD: 0, activeDays: 0 };
      months.push({ year: targetYear, m, mPrefix, sum, stats, isFuture });
    }

    const maxTotal = Math.max(0, ...months.map(x => x.sum.total));
    const wrap = document.createElement('div');
    wrap.className = 'heatmap-monthly-grid';

    for (const item of months) {
      const isPeak = !item.isFuture && maxTotal > 0 && item.sum.total === maxTotal;
      const lvl = item.isFuture ? 0 : (core?.getLvlForRange ? core.getLvlForRange(item.sum.total, 'month', maxTotal) : (item.sum.total > 0 ? 2 : 0));
      const card = document.createElement('div');
      card.className = 'heat-month-card';
      if (item.isFuture) card.classList.add('is-future');
      card.setAttribute('data-level', String(lvl));
      card.setAttribute('data-month', item.mPrefix);
      const titleText = t('tokens.range.month', { y: item.year, m: item.m });
      const peakBadge = isPeak ? ` · ${t('heat.peak')}` : '';
      card.innerHTML = `<div class="heat-month-name">${escapeHtml(titleText)}${escapeHtml(peakBadge)}</div><div class="heat-month-val">${escapeHtml(item.isFuture ? '—' : formatTokensK(item.sum.total))}</div><div class="heat-month-sub">${item.isFuture ? '—' : `≈ $${Number(item.stats.totalCostUSD || 0).toFixed(2)}`}</div>`;

      bindCellHover(card, () => {
        if (item.isFuture) {
          return `<div class="heat-pop-date">${escapeHtml(titleText)}</div><div class="heat-pop-detail">${escapeHtml(t('heatmap.pop.future'))}</div>`;
        }
        const suffix = (item.mPrefix === curMonthPrefix ? t('heatmap.pop.inProgress') : '') + (isPeak ? t('heatmap.pop.peak') : '');
        const extra = t('heatmap.pop.monthlyDet', {
          avg: Number(item.stats.dailyAverageUSD || 0).toFixed(2),
          days: item.stats.activeDays || 0
        });
        return formatDayBreakdownHtml(`${titleText}${suffix}`, item.sum, item.stats.totalCostUSD, extra);
      });
      wrap.appendChild(card);
    }

    grid.appendChild(wrap);
    const totalStats = core?.calculateIntervalCost
      ? core.calculateIntervalCost(dailyMap, allDates, undefined, { todayStr })
      : { totalTokens: 0, totalCostUSD: 0, dailyAverageUSD: 0, activeDailyAverageUSD: 0, activeDays: 0 };
    updateSummaryBar(totalStats);
  }

  function renderHeatmapYearly(dailyMap, firstUse) {
    const grid = el('heatmap-grid');
    if (!grid) return;
    grid.innerHTML = '';

    const todayStr = getTodayLocalStr();
    const win = computeTimelineWindow('yearly', dailyMap, firstUse, heatmapRangeOffset, todayStr);
    heatmapRangeOffset = win.safeOffset;
    lastHeatNavState = { canPrev: win.canPrev, canNext: win.canNext };
    updateNavButtonsState();

    const years = win.years;
    const rangeLabel = el('heat-range-label');
    if (rangeLabel) {
      rangeLabel.textContent = win.startYear === win.endYear
        ? t('tokens.range.year', { y: win.startYear })
        : `${win.startYear}–${win.endYear}`;
    }

    const allDates = [];
    const wrap = document.createElement('div');
    wrap.className = 'heatmap-yearly-grid';

    const yearRows = years.map(y => {
      const isFuture = y > win.curYear;
      const fullDates = [];
      const sum = { total: 0, input: 0, output: 0, cache: 0 };
      if (!isFuture) {
        const yStartIdx = Math.max(win.minIdx, ymdToDayIndex(`${y}-01-01`));
        const yEndIdx = Math.min(win.todayIdx, ymdToDayIndex(`${y}-12-31`));
        for (let idx = yStartIdx; idx <= yEndIdx; idx++) {
          const ds = dayIndexToYmd(idx);
          fullDates.push(ds);
          allDates.push(ds);
          if (!dailyMap[ds]) continue;
          const r = normalizeDayRecord(dailyMap[ds]);
          sum.total += r.total;
          sum.input += r.input;
          sum.output += r.output;
          sum.cache += r.cache;
        }
      }
      const stats = (!isFuture && core?.calculateIntervalCost)
        ? core.calculateIntervalCost(dailyMap, fullDates, undefined, { todayStr })
        : { totalCostUSD: 0, activeDays: 0 };
      return { y, sum, stats, isFuture };
    });

    const maxTotal = Math.max(0, ...yearRows.map(r => r.sum.total));
    for (const yr of yearRows) {
      const lvl = yr.isFuture
        ? 0
        : (core?.getLvlForRange ? core.getLvlForRange(yr.sum.total, 'year', maxTotal) : (yr.sum.total > 0 ? 2 : 0));
      const card = document.createElement('div');
      card.className = 'heat-year-card';
      if (yr.isFuture) card.classList.add('is-future');
      card.setAttribute('data-level', String(lvl));
      card.setAttribute('data-year', String(yr.y));
      const label = t('tokens.range.year', { y: yr.y });
      card.innerHTML = `<div class="heat-year-title">${escapeHtml(label)}</div><div class="heat-year-val">${escapeHtml(yr.isFuture ? '—' : formatTokensK(yr.sum.total))}</div><div class="heat-year-sub">${yr.isFuture ? '—' : `≈ $${Number(yr.stats.totalCostUSD || 0).toFixed(2)} · ${yr.stats.activeDays || 0}d`}</div>`;
      bindCellHover(card, () => yr.isFuture
        ? `<div class="heat-pop-date">${escapeHtml(label)}</div><div class="heat-pop-detail">${escapeHtml(t('heat.future'))}</div>`
        : formatDayBreakdownHtml(label, yr.sum, yr.stats.totalCostUSD));
      wrap.appendChild(card);
    }

    grid.appendChild(wrap);
    const totalStats = core?.calculateIntervalCost
      ? core.calculateIntervalCost(dailyMap, allDates, undefined, { todayStr })
      : { totalTokens: 0, totalCostUSD: 0, dailyAverageUSD: 0, activeDailyAverageUSD: 0, activeDays: 0 };
    updateSummaryBar(totalStats);
  }

  function renderHeatmapGrid(data = null) {
    const dailyMap = getActiveDailyMap(data);
    const firstUse = getFirstUseDate(data, dailyMap);
    const firstUseEl = el('heat-first-use');
    if (firstUseEl) {
      firstUseEl.textContent = firstUse
        ? t('tokens.firstUse', { date: firstUse })
        : t('tokens.heat.firstUsePlaceholder');
    }

    if (currentHeatView === 'weekly') {
      renderHeatmapWeekly(dailyMap, firstUse);
    } else if (currentHeatView === 'monthly') {
      renderHeatmapMonthly(dailyMap, firstUse);
    } else if (currentHeatView === 'yearly') {
      renderHeatmapYearly(dailyMap, firstUse);
    } else if (currentHeatView === 'cum') {
      renderDailyOrCumHeatmap(dailyMap, firstUse, true);
    } else {
      renderDailyOrCumHeatmap(dailyMap, firstUse, false);
    }
  }

  function switchHeatView(view, skipPersist = false) {
    const valid = new Set(['daily', 'weekly', 'monthly', 'yearly', 'cum']);
    const next = valid.has(view) ? view : 'daily';
    currentHeatView = next;
    heatmapRangeOffset = 0;

    for (const v of valid) {
      el(`heat-tab-${v}`)?.classList?.toggle?.('active', v === next);
    }

    renderHeatmapGrid();
    if (!skipPersist) {
      saveSettingsPayloadBridge?.({ savedHeatView: next })?.catch?.(() => {});
    }
  }

  function shiftHeatRange(delta) {
    if (!Number.isFinite(delta) || delta === 0) return;
    if (delta < 0 && !lastHeatNavState.canPrev) return;
    if (delta > 0 && !lastHeatNavState.canNext) return;
    heatmapRangeOffset = Math.min(0, heatmapRangeOffset + Math.trunc(delta));
    renderHeatmapGrid();
  }

      // Module: Subscription Plan Dropdowns & Custom Plan Form Persistence
  const COUNTRY_OPTIONS = [
    { value: '未知', label: '🌐 未设置 / 自动', labelTw: '🌐 未設定 / 自動', labelEn: '🌐 Unset / Auto', aliases: ['auto', 'unset', 'unknown', '默认', '自动'] },
    { value: '美国 (US)', label: '🇺🇸 美国 (US)', labelTw: '🇺🇸 美國 (US)', labelEn: '🇺🇸 United States (US)', aliases: ['usa', 'us', 'america', 'united states', '美国', '美区'] },
    { value: '台湾 (TW)', label: '🇹🇼 台湾 (TW)', labelTw: '🇹🇼 台灣 (TW)', labelEn: '🇹🇼 Taiwan (TW)', aliases: ['tw', 'taiwan', 'ntd', '台湾', '台灣'] },
    { value: '日本 (JP)', label: '🇯🇵 日本 (JP)', labelTw: '🇯🇵 日本 (JP)', labelEn: '🇯🇵 Japan (JP)', aliases: ['jp', 'japan', 'jpy', '日本', '日区'] },
    { value: '新加坡 (SG)', label: '🇸🇬 新加坡 (SG)', labelTw: '🇸🇬 新加坡 (SG)', labelEn: '🇸🇬 Singapore (SG)', aliases: ['sg', 'singapore', 'sgd', '新加坡', '狮城'] },
    { value: '韩国 (KR)', label: '🇰🇷 韩国 (KR)', labelTw: '🇰🇷 韓國 (KR)', labelEn: '🇰🇷 South Korea (KR)', aliases: ['kr', 'korea', 'krw', '韩国', '韓區'] },
    { value: '香港 (HK)', label: '🇭🇰 香港 (HK)', labelTw: '🇭🇰 香港 (HK)', labelEn: '🇭🇰 Hong Kong (HK)', aliases: ['hk', 'hong kong', 'hkd', '香港', '港区'] },
    { value: '英国 (UK)', label: '🇬🇧 英国 (UK)', labelTw: '🇬🇧 英國 (UK)', labelEn: '🇬🇧 United Kingdom (UK)', aliases: ['uk', 'gb', 'britain', 'gbp', '英国'] },
    { value: '澳大利亚 (AU)', label: '🇦🇺 澳大利亚 (AU)', labelTw: '🇦🇺 澳洲 (AU)', labelEn: '🇦🇺 Australia (AU)', aliases: ['au', 'australia', 'aud', '澳大利亚', '澳洲'] },
    { value: '加拿大 (CA)', label: '🇨🇦 加拿大 (CA)', labelTw: '🇨🇦 加拿大 (CA)', labelEn: '🇨🇦 Canada (CA)', aliases: ['ca', 'canada', 'cad', '加拿大'] },
    { value: '印度 (IN)', label: '🇮🇳 印度 (IN)', labelTw: '🇮🇳 印度 (IN)', labelEn: '🇮🇳 India (IN)', aliases: ['in', 'india', 'inr', '印度', '印区'] },
    { value: '土耳其 (TR)', label: '🇹🇷 土耳其 (TR)', labelTw: '🇹🇷 土耳其 (TR)', labelEn: '🇹🇷 Turkey (TR)', aliases: ['tr', 'turkey', 'try', '土耳其'] },
    { value: '德国 (DE)', label: '🇩🇪 德国 (DE)', labelTw: '🇩🇪 德國 (DE)', labelEn: '🇩🇪 Germany (DE)', aliases: ['de', 'germany', 'eur', '德国'] },
    { value: '中国大陆 (CN)', label: '🇨🇳 中国大陆 (CN)', labelTw: '🇨🇳 中國大陸 (CN)', labelEn: '🇨🇳 Mainland China (CN)', aliases: ['cn', 'china', 'cny', 'rmb', '中国'] }
  ];

  const CURRENCY_OPTIONS = [
    { value: 'USD', code: 'USD', symbol: '$', label: 'USD ($) · 美元', labelTw: 'USD ($) · 美元', labelEn: 'USD ($) · US Dollar', name: '美元', nameEn: 'US Dollar', aliases: ['usd', 'dollar', '美元', '美金'] },
    { value: 'CNY', code: 'CNY', symbol: '¥', label: 'CNY (¥) · 人民币', labelTw: 'CNY (¥) · 人民幣', labelEn: 'CNY (¥) · Chinese Yuan', name: '人民币', nameEn: 'Chinese Yuan', aliases: ['cny', 'rmb', 'yuan', '人民币'] },
    { value: 'TWD', code: 'NTD', symbol: 'NT$', label: 'TWD (NT$) · 新台币', labelTw: 'TWD (NT$) · 新台幣', labelEn: 'TWD (NT$) · New Taiwan Dollar', name: '新台币', nameEn: 'New Taiwan Dollar', aliases: ['twd', 'ntd', 'taiwan', '台币', '台幣', '新台币'] },
    { value: 'JPY', code: 'JPY', symbol: '¥', label: 'JPY (¥) · 日元', labelTw: 'JPY (¥) · 日圓', labelEn: 'JPY (¥) · Japanese Yen', name: '日元', nameEn: 'Japanese Yen', aliases: ['jpy', 'yen', '日元', '日圓'] },
    { value: 'HKD', code: 'HKD', symbol: 'HK$', label: 'HKD (HK$) · 港元', labelTw: 'HKD (HK$) · 港元', labelEn: 'HKD (HK$) · Hong Kong Dollar', name: '港元', nameEn: 'Hong Kong Dollar', aliases: ['hkd', '港元', '港币'] },
    { value: 'SGD', code: 'SGD', symbol: 'S$', label: 'SGD (S$) · 新加坡元', labelTw: 'SGD (S$) · 新加坡幣', labelEn: 'SGD (S$) · Singapore Dollar', name: '新加坡元', nameEn: 'Singapore Dollar', aliases: ['sgd', '新币', '坡币'] },
    { value: 'KRW', code: 'KRW', symbol: '₩', label: 'KRW (₩) · 韩元', labelTw: 'KRW (₩) · 韓元', labelEn: 'KRW (₩) · South Korean Won', name: '韩元', nameEn: 'Korean Won', aliases: ['krw', 'won', '韩元', '韓元'] },
    { value: 'EUR', code: 'EUR', symbol: '€', label: 'EUR (€) · 欧元', labelTw: 'EUR (€) · 歐元', labelEn: 'EUR (€) · Euro', name: '欧元', nameEn: 'Euro', aliases: ['eur', 'euro', '欧元'] },
    { value: 'GBP', code: 'GBP', symbol: '£', label: 'GBP (£) · 英镑', labelTw: 'GBP (£) · 英鎊', labelEn: 'GBP (£) · British Pound', name: '英镑', nameEn: 'Pound', aliases: ['gbp', 'pound', '英镑'] },
    { value: 'AUD', code: 'AUD', symbol: 'A$', label: 'AUD (A$) · 澳元', labelTw: 'AUD (A$) · 澳幣', labelEn: 'AUD (A$) · Australian Dollar', name: '澳元', nameEn: 'Australian Dollar', aliases: ['aud', '澳元', '澳币'] },
    { value: 'CAD', code: 'CAD', symbol: 'C$', label: 'CAD (C$) · 加元', labelTw: 'CAD (C$) · 加幣', labelEn: 'CAD (C$) · Canadian Dollar', name: '加元', nameEn: 'Canadian Dollar', aliases: ['cad', '加元', '加币'] },
    { value: 'INR', code: 'INR', symbol: '₹', label: 'INR (₹) · 印度卢比', labelTw: 'INR (₹) · 印度盧比', labelEn: 'INR (₹) · Indian Rupee', name: '卢比', nameEn: 'Indian Rupee', aliases: ['inr', 'rupee', '卢比'] },
    { value: 'TRY', code: 'TRY', symbol: '₺', label: 'TRY (₺) · 土耳其里拉', labelTw: 'TRY (₺) · 土耳其里拉', labelEn: 'TRY (₺) · Turkish Lira', name: '里拉', nameEn: 'Turkish Lira', aliases: ['try', 'lira', '里拉'] }
  ];

  const CUSTOM_PLAN_STORAGE_KEY = '__ag_usage_custom_plans_v1__';
  const enhancedDropdowns = new Map();
  let planDetailExpanded = false;
  let lastSavedCustomPlan = null;
  let saveFeedbackTimer = null;
  let userActionSeq = 0;

  function closeAllDropdowns(exceptWrap = null) {
    const rootScope = (typeof shadow !== 'undefined' && shadow && shadow.querySelectorAll) ? shadow : (typeof document !== 'undefined' ? document : null);
    try {
      rootScope?.querySelectorAll?.('.ag-dropdown-wrapper.is-open')?.forEach(w => {
        if (w !== exceptWrap) removeClass(w, 'is-open');
      });
    } catch {}
  }

  function formatOptionLabelByLang(opt) {
    if (!opt) return '';
    if (currentPanelLanguage === 'en') {
      if (opt.labelEn) return opt.labelEn;
      if (opt.code && opt.symbol) return `${opt.code} (${opt.symbol}${opt.nameEn ? ' ' + opt.nameEn : ''})`;
      if (opt.value && opt.value !== '未知') {
        const flagMatch = String(opt.label || '').match(/^([\u{1F1E6}-\u{1F1FF}]{2}|🌐|🌏)\s*/u);
        const flag = flagMatch ? flagMatch[1] + ' ' : '';
        return `${flag}${opt.code || opt.value}`;
      }
      return t('plan.country.auto');
    }
    if (currentPanelLanguage === 'zh-TW' && opt.labelTw) return opt.labelTw;
    return opt.label;
  }

  function initDropdownController(cfg) {
    const wrap = el(cfg.wrapId);
    const trigger = el(cfg.triggerId);
    const label = el(cfg.labelId);
    const menu = el(cfg.menuId);
    const linkedSelect = cfg.selectId ? el(cfg.selectId) : null;
    if (!wrap || !trigger || !label || !menu) return null;
    if (trigger._bound) return wrap._controller || null;
    trigger._bound = true;

    let keyboardFocusIndex = -1;

    function renderMenu(kw = '') {
      menu.innerHTML = '';
      keyboardFocusIndex = -1;

      const searchWrap = document.createElement('div');
      searchWrap.className = 'ag-dropdown-search-wrap';
      const searchInput = document.createElement('input');
      searchInput.type = 'text';
      searchInput.className = 'ag-dropdown-search-input';
      searchInput.placeholder = (typeof cfg.searchPlaceholder === 'function' ? cfg.searchPlaceholder() : cfg.searchPlaceholder) || t('dropdown.searchPlaceholder');
      searchInput.value = kw;
      searchWrap.appendChild(searchInput);
      menu.appendChild(searchWrap);

      const listContainer = document.createElement('div');
      listContainer.className = 'ag-dropdown-list-container';
      menu.appendChild(listContainer);

      let visibleItems = [];

      function updateKeyboardHighlight(newIdx) {
        const itemEls = listContainer.querySelectorAll ? listContainer.querySelectorAll('.ag-dropdown-item') : [];
        if (!itemEls.length) return;
        keyboardFocusIndex = Math.max(0, Math.min(newIdx, itemEls.length - 1));
        Array.from(itemEls).forEach((elNode, idx) => {
          if (idx === keyboardFocusIndex) {
            addClass(elNode, 'is-keyboard-focus');
            elNode.scrollIntoView?.({ block: 'nearest' });
          } else {
            removeClass(elNode, 'is-keyboard-focus');
          }
        });
      }

      function selectOption(opt) {
        removeClass(wrap, 'is-open');
        const text = cfg.getLabelText ? cfg.getLabelText(opt) : (opt.label || opt.value);
        label.textContent = text;
        if (linkedSelect) {
          runWithUiHydration(() => { linkedSelect.value = opt.value; });
        }
        if (cfg.onSelect) cfg.onSelect(opt);
        trigger.focus?.();
      }

      function renderList(searchKey = '') {
        listContainer.innerHTML = '';
        const allItems = cfg.getOptions();
        const selectedVal = cfg.getSelectedValue();
        const matchesItem = it => {
          if (!searchKey) return true;
          if (cfg.filterItem) return cfg.filterItem(it, searchKey);
          const t1 = String(it.label || '').toLowerCase();
          const t2 = String(it.value || '').toLowerCase();
          const t3 = String(it.code || '').toLowerCase();
          const aliases = (it.aliases || []).map(a => String(a).toLowerCase());
          return t1.includes(searchKey) || t2.includes(searchKey) || t3.includes(searchKey) || aliases.some(a => a.includes(searchKey));
        };

        const renderEntries = [];
        let pendingHeader = null;
        visibleItems = [];
        for (const it of allItems) {
          if (it && it.isGroupHeader) {
            pendingHeader = it;
            continue;
          }
          if (matchesItem(it)) {
            if (pendingHeader) {
              renderEntries.push(pendingHeader);
              pendingHeader = null;
            }
            renderEntries.push(it);
            visibleItems.push(it);
          }
        }

        if (!visibleItems.length) {
          const emptyDiv = document.createElement('div');
          emptyDiv.style.cssText = 'padding:10px;text-align:center;color:var(--ag-text-muted);font-size:11px';
          emptyDiv.textContent = (typeof cfg.emptyText === 'function' ? cfg.emptyText() : cfg.emptyText) || t('dropdown.empty');
          listContainer.appendChild(emptyDiv);
          return;
        }

        renderEntries.forEach(opt => {
          if (opt && opt.isGroupHeader) {
            const groupEl = document.createElement('div');
            groupEl.className = 'ag-dropdown-group-title';
            groupEl.textContent = opt.label || '';
            listContainer.appendChild(groupEl);
            return;
          }
          const itemEl = document.createElement('div');
          const isSelected = cfg.isItemSelected ? cfg.isItemSelected(opt, selectedVal) : (opt.value === selectedVal);
          itemEl.className = 'ag-dropdown-item' + (isSelected ? ' is-selected' : '');

          const leftSpan = document.createElement('span');
          leftSpan.textContent = opt.displayLeft || opt.label;
          itemEl.appendChild(leftSpan);

          if (opt.displayRight) {
            const rightSpan = document.createElement('span');
            rightSpan.className = 'ag-dropdown-item-sub';
            rightSpan.textContent = opt.displayRight;
            itemEl.appendChild(rightSpan);
          }
          const check = document.createElement('span');
          check.className = 'ag-dropdown-item-check';
          check.textContent = '✓';
          itemEl.appendChild(check);

          itemEl.addEventListener('click', e => {
            e?.stopPropagation?.();
            selectOption(opt);
          });
          listContainer.appendChild(itemEl);
        });
      }

      searchInput.addEventListener('click', e => e?.stopPropagation?.());
      searchInput.addEventListener('input', e => renderList(e.target.value.trim().toLowerCase()));

      const keyHandler = e => {
        if (!hasClass(wrap, 'is-open')) return;
        if (e.key === 'ArrowDown') {
          e.preventDefault?.();
          updateKeyboardHighlight(keyboardFocusIndex + 1);
        } else if (e.key === 'ArrowUp') {
          e.preventDefault?.();
          updateKeyboardHighlight(keyboardFocusIndex <= 0 ? 0 : keyboardFocusIndex - 1);
        } else if (e.key === 'Enter') {
          e.preventDefault?.();
          if (keyboardFocusIndex >= 0 && visibleItems[keyboardFocusIndex]) selectOption(visibleItems[keyboardFocusIndex]);
          else if (visibleItems.length === 1) selectOption(visibleItems[0]);
        } else if (e.key === 'Escape') {
          e.preventDefault?.();
          removeClass(wrap, 'is-open');
          trigger.focus?.();
        }
      };
      searchInput.addEventListener('keydown', keyHandler);
      menu.addEventListener('keydown', keyHandler);
      renderList(kw);
    }

    renderMenu();

    function toggleOpen() {
      const isOpen = hasClass(wrap, 'is-open');
      if (!isOpen) {
        closeAllDropdowns(wrap);
        try {
          const rect = trigger.getBoundingClientRect?.() || { bottom: 0, top: 0 };
          const spaceBelow = (typeof window !== 'undefined' ? (window.innerHeight || 800) : 800) - rect.bottom;
          if (spaceBelow < 240 && rect.top > 240) addClass(wrap, 'open-up');
          else removeClass(wrap, 'open-up');
        } catch {
          removeClass(wrap, 'open-up');
        }
        renderMenu();
        addClass(wrap, 'is-open');
        setTimeout(() => menu.querySelector?.('.ag-dropdown-search-input')?.focus?.(), 30);
      } else {
        removeClass(wrap, 'is-open');
      }
    }

    trigger.addEventListener('click', e => { e?.stopPropagation?.(); toggleOpen(); });
    trigger.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault?.(); toggleOpen(); }
      else if (e.key === 'Escape') removeClass(wrap, 'is-open');
    });

    const controller = {
      refresh: () => {
        const val = cfg.getSelectedValue();
        const opts = cfg.getOptions();
        const found = opts.find(o => !o.isGroupHeader && o.value === val);
        if (found) label.textContent = cfg.getLabelText ? cfg.getLabelText(found) : (found.label || found.value);
        else if (cfg.emptyLabel) label.textContent = cfg.emptyLabel;
      },
      close: () => removeClass(wrap, 'is-open'),
      open: () => toggleOpen()
    };
    wrap._controller = controller;
    return controller;
  }

  function refreshDirectCountryDisplay(currentCountryVal) {
    const label = el('direct-country-label');
    if (!label) return;
    const val = currentCountryVal || ANTIGRAVITY_TOKEN_DATA.planStatus?.country || '未知';
    const matched = COUNTRY_OPTIONS.find(o => o.value === val);
    label.textContent = matched ? formatOptionLabelByLang(matched) : (val !== '未知' ? `🌐 ${val}` : t('plan.country.auto'));
  }

  function refreshDirectRegionDisplay(currentRegionText) {
    const directLabel = el('direct-region-label');
    if (!directLabel) return;
    const core = typeof __AGUsageCore !== 'undefined' ? __AGUsageCore : null;
    const reg = currentRegionText || ANTIGRAVITY_TOKEN_DATA.planStatus?.region || '未知';
    const matched = core?.findRegionPreset ? core.findRegionPreset(reg) : null;
    if (matched) {
      const curCode = matched.currency === 'TWD' ? 'NTD' : matched.currency;
      const cny = core?.convertToCNY ? core.convertToCNY(matched.monthlyPrice, matched.currency, matched.name) : (matched.monthlyPrice * matched.rateToCNY);
      const dispName = currentPanelLanguage === 'en' ? (matched.nameEn || matched.id || matched.name) : matched.name;
      directLabel.textContent = matched.currency === 'CNY'
        ? `${matched.flag || '🌏'} ${dispName} (${curCode}) · ¥${matched.monthlyPrice}${t('dropdown.perMonth')}`
        : `${matched.flag || '🌏'} ${dispName} (${curCode}) · ${matched.symbol}${matched.monthlyPrice} (${t('plan.cnyShort', { val: Number(cny).toFixed(1) })})`;
    } else if (reg && reg !== '未知') {
      directLabel.textContent = `🌏 ${reg}`;
    } else {
      directLabel.textContent = t('dropdown.regionUnknownShort');
    }
  }

  function refreshDirectCurrencyDisplay(currentCurrencyVal) {
    const label = el('direct-currency-label');
    if (!label) return;
    let val = currentCurrencyVal || ANTIGRAVITY_TOKEN_DATA.planStatus?.currency || 'USD';
    if (val === 'NTD') val = 'TWD';
    const matched = CURRENCY_OPTIONS.find(o => o.value === val);
    label.textContent = matched ? formatOptionLabelByLang(matched) : val;
  }

  function showPlanSaveFeedback(ok, message) {
    const fb = el('plan-save-feedback');
    if (!fb) return;
    if (saveFeedbackTimer) {
      clearTimeout(saveFeedbackTimer);
      saveFeedbackTimer = null;
    }
    fb.style.display = 'inline-block';
    fb.style.color = ok ? 'var(--ag-success)' : 'var(--ag-danger)';
    fb.textContent = ok ? (message || t('dropdown.autoSaved')) : t('dropdown.saveFailedDetail', { msg: message || t('dropdown.writeCfgFailed') });
    if (ok) {
      saveFeedbackTimer = setTimeout(() => {
        if (fb) fb.style.display = 'none';
        saveFeedbackTimer = null;
      }, 2800);
    }
  }

  function setPlanDetailExpanded(expanded) {
    planDetailExpanded = Boolean(expanded);
    const card = el('plan-detail-card');
    const toggleBtn = el('btn-toggle-plan-detail');
    if (card) card.hidden = !planDetailExpanded;
    if (toggleBtn) toggleBtn.textContent = planDetailExpanded ? t('plan.detail.toggleClose') : t('plan.detail.toggleOpen');
    if (planDetailExpanded) renderPlanDetail(ANTIGRAVITY_TOKEN_DATA.planStatus);
  }

  function readCustomPlanMap() {
    try {
      const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(CUSTOM_PLAN_STORAGE_KEY) : null;
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  }

  function writeCustomPlanMap(mapObj) {
    try {
      if (typeof localStorage !== 'undefined') localStorage.setItem(CUSTOM_PLAN_STORAGE_KEY, JSON.stringify(mapObj));
    } catch {}
  }

  function getStoredCustomPlanSnapshot(email) {
    const key = email || ANTIGRAVITY_TOKEN_DATA.planStatus?.email || 'default';
    if (lastSavedCustomPlan && (!lastSavedCustomPlan.email || lastSavedCustomPlan.email === key)) {
      return { ...lastSavedCustomPlan };
    }
    const mapObj = readCustomPlanMap();
    if (mapObj[key]) return { ...mapObj[key] };
    if (mapObj.default) return { ...mapObj.default };
    const hostCustom = ANTIGRAVITY_TOKEN_DATA.raw?.customPlan;
    if (hostCustom && typeof hostCustom === 'object') return { ...hostCustom };
    return {};
  }

  function applyCustomPlanObjectLocally(customObj, email = 'default') {
    const mapObj = readCustomPlanMap();
    const targetEmail = email || ANTIGRAVITY_TOKEN_DATA.planStatus?.email || 'default';
    if (customObj && !customObj.clear) {
      lastSavedCustomPlan = { ...customObj, email: targetEmail };
      mapObj[targetEmail] = customObj;
    } else {
      lastSavedCustomPlan = null;
      delete mapObj[targetEmail];
      delete mapObj.default;
    }
    writeCustomPlanMap(mapObj);

    const core = typeof __AGUsageCore !== 'undefined' ? __AGUsageCore : null;
    if (core?.resolveEffectivePlanStatus) {
      const merged = core.resolveEffectivePlanStatus(
        ANTIGRAVITY_TOKEN_DATA.raw?.planStatus || ANTIGRAVITY_TOKEN_DATA.planStatus || {},
        customObj?.clear ? null : customObj
      );
      ANTIGRAVITY_TOKEN_DATA.planStatus = merged;
    }
    renderPlanDetail(ANTIGRAVITY_TOKEN_DATA.planStatus);
    renderActiveCostEstimateView();
  }

  async function persistSettingsToHost(payload) {
    try {
      const res = await saveSettingsPayloadBridge(payload);
      if (res && res.ok) {
        showPlanSaveFeedback(true, t('dropdown.autoSaved'));
        if (typeof res.planStatus === 'object' && res.planStatus) {
          ANTIGRAVITY_TOKEN_DATA.planStatus = res.planStatus;
          renderPlanDetail(res.planStatus);
          renderActiveCostEstimateView();
        }
        return true;
      }
      showPlanSaveFeedback(false, (res && res.error) || t('dropdown.saveFailed'));
      return false;
    } catch (e) {
      showPlanSaveFeedback(false, e?.message || t('dropdown.persistErr'));
      return false;
    }
  }

  function syncCurrencyCountrySelectOptions() {
    const core = typeof __AGUsageCore !== 'undefined' ? __AGUsageCore : null;
    const countrySel = el('direct-country-select');
    if (countrySel) {
      runWithUiHydration(() => {
        countrySel.innerHTML = '';
        for (const o of COUNTRY_OPTIONS) {
          const opt = document.createElement('option');
          opt.value = o.value;
          opt.textContent = formatOptionLabelByLang(o);
          countrySel.appendChild(opt);
        }
      });
    }

    const curSels = [el('direct-currency-select'), el('select-custom-currency')];
    for (const sel of curSels) {
      if (!sel) continue;
      runWithUiHydration(() => {
        sel.innerHTML = '';
        for (const o of CURRENCY_OPTIONS) {
          const opt = document.createElement('option');
          opt.value = o.value;
          opt.textContent = formatOptionLabelByLang(o);
          sel.appendChild(opt);
        }
      });
    }

    const acqSel = el('select-acq-source');
    if (acqSel) {
      runWithUiHydration(() => {
        acqSel.innerHTML = '';
        const list = core?.SUBSCRIPTION_ACQUISITION_PRESETS || [{ id: 'normal_paid', defaultFree: false, label: '正常官方付费订阅' }];
        for (const item of list) {
          const opt = document.createElement('option');
          opt.value = item.id;
          opt.textContent = t(`plan.acqOpt.${item.id}`) || item.label;
          acqSel.appendChild(opt);
        }
      });
    }

    const cycleSel = el('select-custom-cycle');
    if (cycleSel) {
      runWithUiHydration(() => {
        cycleSel.innerHTML = '';
        const cycles = [
          { val: '月付', key: 'plan.cycleOpt.monthly' },
          { val: '年付', key: 'plan.cycleOpt.yearly' },
          { val: '免费/促销赠送', key: 'plan.cycleOpt.free' },
          { val: '随套餐赠送/免费', key: 'plan.cycleOpt.included' },
          { val: '其他周期', key: 'plan.cycleOpt.other' }
        ];
        for (const c of cycles) {
          const opt = document.createElement('option');
          opt.value = c.val;
          opt.textContent = t(c.key);
          cycleSel.appendChild(opt);
        }
      });
    }

    const presetSel = el('select-region-preset');
    if (presetSel) {
      runWithUiHydration(() => {
        presetSel.innerHTML = '';
        const ph = document.createElement('option');
        ph.value = '';
        ph.textContent = t('plan.form.presetPlaceholder');
        presetSel.appendChild(ph);
        for (const p of (core?.SUBSCRIPTION_REGIONS_PRESET || [])) {
          const opt = document.createElement('option');
          opt.value = p.id;
          const dispName = currentPanelLanguage === 'en' ? (p.id || p.name) : p.name;
          if (p.currency === 'CNY') {
            opt.textContent = t('plan.form.presetLineCny', { flag: p.flag || '🌏', name: dispName, price: p.monthlyPrice });
          } else {
            const cny = core?.convertToCNY ? core.convertToCNY(p.monthlyPrice, p.currency, p.name) : (p.monthlyPrice * p.rateToCNY);
            opt.textContent = t('plan.form.presetLine', { flag: p.flag || '🌏', name: dispName, id: p.id, sym: p.symbol, price: p.monthlyPrice, cny: Number(cny).toFixed(1) });
          }
          presetSel.appendChild(opt);
        }
        const customOpt = document.createElement('option');
        customOpt.value = '__custom__';
        customOpt.textContent = t('plan.form.presetCustom');
        presetSel.appendChild(customOpt);
      });
    }
  }

  function populateCustomFormFromState() {
    const ps = ANTIGRAVITY_TOKEN_DATA.planStatus || {};
    const email = ps.email || 'default';
    const prevCustom = getStoredCustomPlanSnapshot(email);
    const acq = prevCustom.acquisitionSource || ps.acquisitionSource || 'normal_paid';
    const acqSel = el('select-acq-source');
    const acqCustomWrap = el('wrap-acq-custom');
    const acqCustomIn = el('input-acq-custom');
    const zeroCheck = el('check-zero-extra');
    const countryIn = el('input-custom-country');
    const regIn = el('input-custom-region');
    const curSel = el('select-custom-currency');
    const paidIn = el('input-custom-paid');
    const cycleSel = el('select-custom-cycle');
    const validEndIn = el('input-custom-valid-end');
    const noteIn = el('input-custom-note');

    runWithUiHydration(() => {
      if (acqSel) acqSel.value = acq;
      if (acqCustomWrap) acqCustomWrap.style.display = acq === 'custom_source' ? '' : 'none';
      if (acqCustomIn) acqCustomIn.value = prevCustom.acquisitionSourceName || '';
      const isZero = Boolean(prevCustom.isZeroExtraCost || ps.isZeroExtraCost || ps.actualPricePaid === 0);
      if (zeroCheck) zeroCheck.checked = isZero;
      if (countryIn) countryIn.value = prevCustom.accountRegion || prevCustom.country || (ps.country && !String(ps.country).includes('未知') ? ps.country : '');
      if (regIn) regIn.value = prevCustom.subscriptionRegion || prevCustom.region || (ps.region && !String(ps.region).includes('未知') ? ps.region : '');
      if (curSel) curSel.value = (prevCustom.subscriptionCurrency || ps.currency || 'USD') === 'NTD' ? 'TWD' : (prevCustom.subscriptionCurrency || ps.currency || 'USD');
      if (paidIn) {
        paidIn.disabled = isZero;
        paidIn.value = isZero ? '0' : (prevCustom.actualPricePaid ?? ps.actualPricePaid ?? '');
      }
      if (cycleSel) cycleSel.value = prevCustom.billingCycle || ps.billingCycle || '月付';
      if (validEndIn) validEndIn.value = prevCustom.validEnd || ps.validEnd || '';
      if (noteIn) noteIn.value = prevCustom.note || ps.note || '';
    });
  }

  function togglePlanCustomForm(show) {
    const form = el('plan-custom-form');
    if (!form) return;
    const next = typeof show === 'boolean' ? show : form.hidden;
    form.hidden = !next;
    if (next) populateCustomFormFromState();
  }

  function switchPlanPriceMode(newMode) {
    ++userActionSeq;
    const core = typeof __AGUsageCore !== 'undefined' ? __AGUsageCore : null;
    const ps = ANTIGRAVITY_TOKEN_DATA.planStatus || {};
    const email = ps.email || 'default';
    const prevCustom = getStoredCustomPlanSnapshot(email);
    const targetMode = newMode === 'custom' ? 'custom' : 'preset';

    if (targetMode === 'preset') {
      const currentReg = prevCustom.subscriptionCountry || prevCustom.subscriptionRegion || prevCustom.region || ps.region || '';
      const matched = core?.findRegionPreset ? core.findRegionPreset(currentReg) : null;
      const curCode = matched ? matched.currency : (prevCustom.subscriptionCurrency || prevCustom.currency || 'USD');
      const curSymbol = matched ? matched.symbol : (core?.CURRENCY_SYMBOLS?.[curCode] || '$');
      const paid = matched ? matched.monthlyPrice : null;
      const customObj = {
        ...prevCustom,
        priceMode: 'preset',
        priceSource: 'preset_region',
        actualPricePaid: paid,
        subscriptionCurrency: curCode,
        currency: curCode,
        currencySource: 'preset_region',
        currencySymbol: curSymbol,
        billingCycle: '月付',
        isZeroExtraCost: false,
        updatedAt: new Date().toISOString()
      };
      applyCustomPlanObjectLocally(customObj, email);
      void persistSettingsToHost({ email, customPlan: customObj });
    } else {
      const isZero = Boolean(prevCustom.isZeroExtraCost || prevCustom.actualPricePaid === 0);
      const paid = isZero ? 0 : (prevCustom.actualPricePaid ?? prevCustom.customActualPrice ?? null);
      const customObj = {
        ...prevCustom,
        priceMode: 'custom',
        priceSource: 'custom',
        actualPricePaid: paid,
        customActualPrice: paid,
        updatedAt: new Date().toISOString()
      };
      applyCustomPlanObjectLocally(customObj, email);
      togglePlanCustomForm(true);
      void persistSettingsToHost({ email, customPlan: customObj });
    }
  }

  function applyDirectRegionSelection(regionItem) {
    if (!regionItem) return;
    ++userActionSeq;
    const core = typeof __AGUsageCore !== 'undefined' ? __AGUsageCore : null;
    const ps = ANTIGRAVITY_TOKEN_DATA.planStatus || {};
    const email = ps.email || 'default';
    const prevCustom = getStoredCustomPlanSnapshot(email);
    const regionName = `${regionItem.name} (${regionItem.currency === 'TWD' ? 'NTD' : regionItem.currency})`;
    const hasExplicitPaid = Boolean(prevCustom.isZeroExtraCost || (prevCustom.actualPricePaid !== null && prevCustom.actualPricePaid !== undefined && prevCustom.actualPricePaid !== ''));
    const mode = (prevCustom.priceMode === 'custom' || prevCustom.priceMode === 'preset')
      ? prevCustom.priceMode
      : (prevCustom.priceSource === 'custom' && hasExplicitPaid ? 'custom' : 'preset');

    const isZero = mode === 'custom' && Boolean(prevCustom.isZeroExtraCost || prevCustom.actualPricePaid === 0);
    const curCode = mode === 'custom' ? (prevCustom.subscriptionCurrency || prevCustom.currency || regionItem.currency) : regionItem.currency;
    const curSymbol = core?.CURRENCY_SYMBOLS?.[curCode] || regionItem.symbol || '$';
    const paid = isZero ? 0 : (mode === 'custom' ? (prevCustom.actualPricePaid ?? null) : regionItem.monthlyPrice);
    const cycle = isZero ? '随套餐赠送/免费' : (mode === 'custom' ? (prevCustom.billingCycle || '月付') : '月付');

    const customObj = {
      ...prevCustom,
      subscriptionCountry: regionName,
      subscriptionRegion: regionName,
      region: regionName,
      acquisitionSource: prevCustom.acquisitionSource || ps.acquisitionSource || 'normal_paid',
      isZeroExtraCost: isZero,
      actualPricePaid: paid,
      customActualPrice: mode === 'custom' ? paid : (prevCustom.customActualPrice ?? null),
      priceMode: mode,
      subscriptionCurrency: curCode,
      currency: curCode,
      currencySource: mode === 'custom' ? 'custom' : 'preset_region',
      currencySymbol: curSymbol,
      billingCycle: cycle,
      priceSource: mode === 'custom' ? 'custom' : 'preset_region',
      updatedAt: new Date().toISOString()
    };

    refreshDirectRegionDisplay(regionName);
    refreshDirectCurrencyDisplay(curCode);
    applyCustomPlanObjectLocally(customObj, email);
    void persistSettingsToHost({ email, customPlan: customObj });
  }

  function applyDirectCountrySelection(newCountryVal) {
    ++userActionSeq;
    const ps = ANTIGRAVITY_TOKEN_DATA.planStatus || {};
    const email = ps.email || 'default';
    const prevCustom = getStoredCustomPlanSnapshot(email);
    const cleanCountry = (newCountryVal && newCountryVal !== '未知') ? String(newCountryVal).trim() : '';
    const customObj = { ...prevCustom, updatedAt: new Date().toISOString() };
    if (cleanCountry) {
      customObj.accountRegion = cleanCountry;
      customObj.country = cleanCountry;
    } else {
      delete customObj.accountRegion;
      delete customObj.country;
    }
    refreshDirectCountryDisplay(cleanCountry || '未知');
    applyCustomPlanObjectLocally(customObj, email);
    void persistSettingsToHost({ email, customPlan: customObj });
  }

  function applyDirectCurrencySelection(newCurrencyVal) {
    if (!newCurrencyVal) return;
    ++userActionSeq;
    const core = typeof __AGUsageCore !== 'undefined' ? __AGUsageCore : null;
    const ps = ANTIGRAVITY_TOKEN_DATA.planStatus || {};
    const email = ps.email || 'default';
    const prevCustom = getStoredCustomPlanSnapshot(email);
    let curCode = String(newCurrencyVal).trim().toUpperCase();
    if (curCode === 'NTD') curCode = 'TWD';
    const curSymbol = core?.CURRENCY_SYMBOLS?.[curCode] || '$';
    const isZero = Boolean(prevCustom.isZeroExtraCost || prevCustom.actualPricePaid === 0);
    const mode = (prevCustom.priceMode === 'custom' || prevCustom.priceMode === 'preset') ? prevCustom.priceMode : 'preset';
    let paid = prevCustom.actualPricePaid;
    let priceSource = mode === 'custom' ? 'custom' : 'preset_region';
    if (isZero) {
      paid = 0;
      priceSource = 'custom';
    } else if (mode === 'preset') {
      const matched = core?.SUBSCRIPTION_REGIONS_PRESET?.find(p => p.currency === curCode);
      if (matched) paid = matched.monthlyPrice;
    }

    const customObj = {
      ...prevCustom,
      subscriptionCurrency: curCode,
      currency: curCode,
      currencySource: 'custom',
      currencySymbol: curSymbol,
      actualPricePaid: paid,
      priceMode: mode,
      priceSource,
      updatedAt: new Date().toISOString()
    };

    refreshDirectCurrencyDisplay(curCode);
    applyCustomPlanObjectLocally(customObj, email);
    void persistSettingsToHost({ email, customPlan: customObj });
  }

  function initDropdownAndPlanBindings() {
    syncCurrencyCountrySelectOptions();

    initDropdownController({
      wrapId: 'direct-country-wrap',
      triggerId: 'direct-country-trigger',
      labelId: 'direct-country-label',
      menuId: 'direct-country-menu',
      selectId: 'direct-country-select',
      searchPlaceholder: () => t('dropdown.countrySearch'),
      getOptions: () => COUNTRY_OPTIONS.map(o => ({ ...o, label: formatOptionLabelByLang(o) })),
      getSelectedValue: () => {
        const ps = ANTIGRAVITY_TOKEN_DATA.planStatus || {};
        return (ps.country && !String(ps.country).includes('未知')) ? String(ps.country).trim() : '未知';
      },
      getLabelText: opt => formatOptionLabelByLang(opt),
      onSelect: opt => applyDirectCountrySelection(opt.value),
      emptyText: () => t('dropdown.countryEmpty')
    });

    const core = typeof __AGUsageCore !== 'undefined' ? __AGUsageCore : null;
    const presets = core?.SUBSCRIPTION_REGIONS_PRESET || [];
    initDropdownController({
      wrapId: 'direct-region-wrap',
      triggerId: 'direct-region-trigger',
      labelId: 'direct-region-label',
      menuId: 'direct-region-menu',
      searchPlaceholder: () => t('dropdown.regionSearch'),
      getOptions: () => presets.map(p => {
        const curCode = p.currency === 'TWD' ? 'NTD' : p.currency;
        const dispName = currentPanelLanguage === 'en' ? (p.id || p.name) : p.name;
        const cny = core?.convertToCNY ? core.convertToCNY(p.monthlyPrice, p.currency, p.name) : (p.monthlyPrice * p.rateToCNY);
        const displayRight = p.currency === 'CNY'
          ? `${p.symbol}${p.monthlyPrice}${t('dropdown.perMonth')}`
          : `${p.symbol}${p.monthlyPrice}${t('dropdown.perMonth')} · ≈ ¥${Number(cny).toFixed(1)} CNY`;
        return {
          value: p.id,
          rawItem: p,
          label: `${p.flag || '🌏'} ${dispName} (${curCode})`,
          displayLeft: `${p.flag || '🌏'} ${dispName} (${curCode})`,
          displayRight,
          code: p.id,
          currency: curCode,
          aliases: p.aliases || []
        };
      }),
      getSelectedValue: () => {
        const reg = ANTIGRAVITY_TOKEN_DATA.planStatus?.region || '';
        const matched = core?.findRegionPreset ? core.findRegionPreset(reg) : null;
        return matched ? matched.id : '';
      },
      getLabelText: opt => {
        const p = opt.rawItem;
        if (!p) return opt.label;
        const curCode = p.currency === 'TWD' ? 'NTD' : p.currency;
        const dispName = currentPanelLanguage === 'en' ? (p.id || p.name) : p.name;
        if (p.currency === 'CNY') return `${p.flag || '🌏'} ${dispName} (${curCode}) · ¥${p.monthlyPrice}${t('dropdown.perMonth')}`;
        const cny = core?.convertToCNY ? core.convertToCNY(p.monthlyPrice, p.currency, p.name) : (p.monthlyPrice * p.rateToCNY);
        return `${p.flag || '🌏'} ${dispName} (${curCode}) · ${p.symbol}${p.monthlyPrice} (≈ ¥${Number(cny).toFixed(1)} CNY)`;
      },
      onSelect: opt => { if (opt.rawItem) applyDirectRegionSelection(opt.rawItem); },
      emptyText: () => t('dropdown.regionEmpty')
    });

    initDropdownController({
      wrapId: 'direct-currency-wrap',
      triggerId: 'direct-currency-trigger',
      labelId: 'direct-currency-label',
      menuId: 'direct-currency-menu',
      selectId: 'direct-currency-select',
      searchPlaceholder: () => t('dropdown.currencySearch'),
      getOptions: () => CURRENCY_OPTIONS.map(o => ({ ...o, label: formatOptionLabelByLang(o) })),
      getSelectedValue: () => {
        const cur = ANTIGRAVITY_TOKEN_DATA.planStatus?.currency || 'USD';
        return cur === 'NTD' ? 'TWD' : cur;
      },
      getLabelText: opt => formatOptionLabelByLang(opt),
      onSelect: opt => applyDirectCurrencySelection(opt.value),
      emptyText: () => t('dropdown.currencyEmpty')
    });

    el('btn-price-mode-preset')?.addEventListener('click', () => switchPlanPriceMode('preset'));
    el('btn-price-mode-custom')?.addEventListener('click', () => switchPlanPriceMode('custom'));
    el('btn-edit-plan-custom')?.addEventListener('click', () => togglePlanCustomForm());
    el('btn-quick-edit-plan')?.addEventListener('click', () => {
      setPlanDetailExpanded(true);
      togglePlanCustomForm(true);
    });
    el('btn-cancel-plan-custom')?.addEventListener('click', () => togglePlanCustomForm(false));

    el('select-acq-source')?.addEventListener('change', e => {
      if (isHydratingUiControls) return;
      const val = e.target.value;
      const wrap = el('wrap-acq-custom');
      if (wrap) wrap.style.display = val === 'custom_source' ? '' : 'none';
      const preset = (core?.SUBSCRIPTION_ACQUISITION_PRESETS || []).find(p => p.id === val);
      const zeroCheck = el('check-zero-extra');
      const paidIn = el('input-custom-paid');
      if (preset && zeroCheck && paidIn) {
        zeroCheck.checked = Boolean(preset.defaultFree);
        paidIn.disabled = Boolean(preset.defaultFree);
        if (preset.defaultFree) paidIn.value = '0';
      }
    });

    el('check-zero-extra')?.addEventListener('change', e => {
      if (isHydratingUiControls) return;
      const paidIn = el('input-custom-paid');
      if (paidIn) {
        paidIn.disabled = Boolean(e.target.checked);
        if (e.target.checked) paidIn.value = '0';
      }
    });

    el('select-region-preset')?.addEventListener('change', e => {
      if (isHydratingUiControls) return;
      const val = e.target.value;
      if (!val || val === '__custom__') return;
      const p = presets.find(item => item.id === val);
      if (!p) return;
      const regIn = el('input-custom-region');
      const curSel = el('select-custom-currency');
      const paidIn = el('input-custom-paid');
      const prevEl = el('region-cny-preview');
      if (regIn) regIn.value = `${p.name} (${p.currency === 'TWD' ? 'NTD' : p.currency})`;
      if (curSel) curSel.value = p.currency;
      if (paidIn && !el('check-zero-extra')?.checked) paidIn.value = String(p.monthlyPrice);
      if (prevEl) {
        const cny = core?.convertToCNY ? core.convertToCNY(p.monthlyPrice, p.currency, p.name) : (p.monthlyPrice * p.rateToCNY);
        prevEl.textContent = t('plan.cnyApprox', { val: Number(cny).toFixed(1) });
      }
    });

    el('btn-save-plan-custom')?.addEventListener('click', async () => {
      ++userActionSeq;
      const ps = ANTIGRAVITY_TOKEN_DATA.planStatus || {};
      const email = ps.email || 'default';
      const prevCustom = getStoredCustomPlanSnapshot(email);
      const acqVal = el('select-acq-source')?.value || 'normal_paid';
      const acqCustomName = el('input-acq-custom')?.value?.trim() || '';
      const isZero = Boolean(el('check-zero-extra')?.checked);
      const countryVal = el('input-custom-country')?.value?.trim() || '';
      const regVal = el('input-custom-region')?.value?.trim() || '';
      const curVal = el('select-custom-currency')?.value || 'USD';
      const paidRaw = el('input-custom-paid')?.value;
      const parsedPaid = paidRaw !== '' && paidRaw !== undefined && paidRaw !== null ? Number(paidRaw) : null;
      const paid = isZero ? 0 : (Number.isFinite(parsedPaid) ? parsedPaid : null);
      const cycleVal = el('select-custom-cycle')?.value || (isZero ? '随套餐赠送/免费' : '月付');
      const validEnd = el('input-custom-valid-end')?.value || '';
      const note = el('input-custom-note')?.value?.trim() || '';

      const acqPreset = (core?.SUBSCRIPTION_ACQUISITION_PRESETS || []).find(p => p.id === acqVal);
      const customObj = {
        ...prevCustom,
        acquisitionSource: acqVal,
        acquisitionSourceName: acqVal === 'custom_source' ? (acqCustomName || acqPreset?.label) : (acqPreset?.label || acqVal),
        isZeroExtraCost: isZero,
        accountRegion: countryVal || undefined,
        country: countryVal || undefined,
        subscriptionCountry: regVal || undefined,
        subscriptionRegion: regVal || undefined,
        region: regVal || undefined,
        subscriptionCurrency: curVal,
        currency: curVal,
        currencySymbol: core?.CURRENCY_SYMBOLS?.[curVal] || '$',
        actualPricePaid: paid,
        customActualPrice: paid,
        priceMode: paid !== null ? 'custom' : (prevCustom.priceMode || 'preset'),
        priceSource: paid !== null ? 'custom' : 'preset_region',
        billingCycle: cycleVal,
        validEnd: validEnd || undefined,
        note: note || undefined,
        updatedAt: new Date().toISOString()
      };

      applyCustomPlanObjectLocally(customObj, email);
      togglePlanCustomForm(false);
      await persistSettingsToHost({ email, customPlan: customObj });
    });

    el('btn-clear-plan-custom')?.addEventListener('click', async () => {
      ++userActionSeq;
      const ps = ANTIGRAVITY_TOKEN_DATA.planStatus || {};
      const email = ps.email || 'default';
      applyCustomPlanObjectLocally({ clear: true }, email);
      togglePlanCustomForm(false);
      await persistSettingsToHost({ email, customPlan: { clear: true } });
    });

    if (typeof document !== 'undefined' && document.addEventListener) {
      const onDocClick = e => {
        try {
          const path = typeof e?.composedPath === 'function' ? e.composedPath() : [];
          const insideDropdown = path.some(n => n?.classList?.contains?.('ag-dropdown-wrapper')) || Boolean(e?.target?.closest?.('.ag-dropdown-wrapper'));
          if (!insideDropdown) closeAllDropdowns();
        } catch {}
      };
      document.addEventListener('click', onDocClick);
      registerCleanup(() => document.removeEventListener('click', onDocClick));
    }
  }


    function updateBadgeTokensText(data) {
      const badgeText = el('badge-tokens-text');
      const badgeBtn = el('badge-tokens');
      if (!badgeText) return;
      const dailyMap = getActiveDailyMap(data || ANTIGRAVITY_TOKEN_DATA.raw || {});
      const todayStr = getTodayLocalStr();
      let totalTok = 0;
      for (const row of Object.values(dailyMap)) {
        totalTok += Number(row?.total || 0);
      }
      const todayTok = dailyMap[todayStr]?.total ?? 0;
      if (!data && !ANTIGRAVITY_TOKEN_DATA.raw && totalTok === 0 && todayTok === 0) {
        badgeText.textContent = 'Tokens --';
        badgeBtn?.removeAttribute?.('title');
        return;
      }
      const todayFmt = formatTokensK(todayTok);
      const totalFmt = formatTokensK(totalTok);
      const todaySpan = doc.createElement('span');
      todaySpan.className = 'ag-badge-today';
      todaySpan.textContent = t('tokens.badge.todayShort', { val: todayFmt });
      const sepSpan = doc.createElement('span');
      sepSpan.className = 'ag-badge-sep';
      sepSpan.setAttribute('aria-hidden', 'true');
      sepSpan.textContent = ' · ';
      const totalSpan = doc.createElement('span');
      totalSpan.className = 'ag-badge-total';
      totalSpan.textContent = totalFmt;
      badgeText.textContent = '';
      if (typeof badgeText.replaceChildren === 'function') {
        badgeText.replaceChildren(todaySpan, sepSpan, totalSpan);
      } else {
        badgeText.appendChild(todaySpan);
        badgeText.appendChild(sepSpan);
        badgeText.appendChild(totalSpan);
      }
      if (badgeBtn) {
        badgeBtn.setAttribute('title', t('tokens.badge.fullTitle', { today: todayFmt, total: totalFmt }));
      }
    }

    function renderTokenCards(data) {
      const dailyMap = getActiveDailyMap(data || ANTIGRAVITY_TOKEN_DATA.raw || {});
      const rawData = data || ANTIGRAVITY_TOKEN_DATA.raw || {};
      const todayStr = getTodayLocalStr();
      const monthPrefix = todayStr.slice(0, 7);
      const yearPrefix = todayStr.slice(0, 4);

      let totalVal = 0;
      let monthVal = 0;
      let yearVal = 0;
      let totalSteps = 0;
      let activeDaysYear = 0;
      const todayDates = [todayStr];
      const monthDates = [];
      const yearDates = [];

      for (const [ds, row] of Object.entries(dailyMap)) {
        const tot = Number(row?.total || 0);
        totalVal += tot;
        totalSteps += Number(row?.steps || 0);
        if (ds.startsWith(monthPrefix)) {
          monthVal += tot;
          monthDates.push(ds);
        }
        if (ds.startsWith(yearPrefix)) {
          yearVal += tot;
          yearDates.push(ds);
          if (tot > 0) activeDaysYear++;
        }
      }
      const todayVal = dailyMap[todayStr]?.total ?? 0;

      const allDates = Object.keys(dailyMap).sort();
      const totalStats = core?.calculateIntervalCost ? core.calculateIntervalCost(dailyMap, allDates, undefined, { todayStr }) : { totalCostUSD: 0, dailyAverageUSD: 0 };
      const todayStats = core?.calculateIntervalCost ? core.calculateIntervalCost(dailyMap, todayDates, undefined, { todayStr }) : { totalCostUSD: 0 };
      const monthStats = core?.calculateIntervalCost ? core.calculateIntervalCost(dailyMap, monthDates, undefined, { todayStr }) : { totalCostUSD: 0, dailyAverageUSD: 0 };
      const yearStats = core?.calculateIntervalCost ? core.calculateIntervalCost(dailyMap, yearDates, undefined, { todayStr }) : { totalCostUSD: 0 };

      const tTotal = el('t-total');
      const tTotalCost = el('t-total-cost');
      const tToday = el('t-today');
      const tTodaySub = el('t-today-sub');
      const tTodayCost = el('t-today-cost');
      const tMonth = el('t-month');
      const tMonthSub = el('t-month-sub');
      const tMonthCost = el('t-month-cost');
      const tYear = el('t-year');
      const tYearSub = el('t-year-sub');
      const tYearCost = el('t-year-cost');

      if (tTotal) tTotal.textContent = formatTokensK(totalVal);
      if (tTotalCost) {
        const usd = Number(totalStats.totalCostUSD || 0);
        const cny = usd * 7.2;
        const avgStr = t('tokens.dailyAvg', { val: Number(totalStats.dailyAverageUSD || 0).toFixed(2) });
        tTotalCost.textContent = `≈ $${usd.toFixed(2)}${avgStr}`;
        tTotalCost.setAttribute?.('title', `≈ $${usd.toFixed(2)} (¥${cny.toFixed(1)})${avgStr}`);
      }
      if (tToday) tToday.textContent = formatTokensK(todayVal);
      if (tTodaySub) {
        const nChats = hub?.getSessionUsageMap?.().size ?? (rawData.summary?.totalConversations || 0);
        tTodaySub.textContent = t('tokens.card.todaySub', { n: nChats });
      }
      if (tTodayCost) tTodayCost.textContent = `≈ $${Number(todayStats.totalCostUSD || 0).toFixed(2)}`;

      if (tMonth) tMonth.textContent = formatTokensK(monthVal);
      if (tMonthSub) {
        const dayOfMonth = Math.max(1, Number(todayStr.slice(8, 10)) || 1);
        tMonthSub.textContent = t('tokens.card.monthSub', { val: formatTokensK(monthVal / dayOfMonth) });
      }
      if (tMonthCost) tMonthCost.textContent = `≈ $${Number(monthStats.totalCostUSD || 0).toFixed(2)}`;

      if (tYear) tYear.textContent = formatTokensK(yearVal);
      if (tYearSub) tYearSub.textContent = t('tokens.card.yearSub', { n: activeDaysYear });
      if (tYearCost) tYearCost.textContent = `≈ $${Number(yearStats.totalCostUSD || 0).toFixed(2)}`;

      const metaEl = el('tokens-meta');
      if (metaEl) {
        const srcName = ANTIGRAVITY_TOKEN_DATA.activeSource === 'cli'
          ? t('tokens.src.cli')
          : (ANTIGRAVITY_TOKEN_DATA.activeSource === 'desktop' ? t('tokens.srcDesktopLabel') : t('tokens.srcAllLabel'));
        metaEl.textContent = `${srcName} · ${totalSteps.toLocaleString()} steps`;
      }
    }

    function renderPlanDetail(planStatus) {
      const ps = planStatus || ANTIGRAVITY_TOKEN_DATA.planStatus || {};
      const tierEl = el('plan-summary-tier');
      const acctEl = el('plan-summary-account');
      const priceBadge = el('plan-summary-price-badge');
      const srcPill = el('plan-summary-source-pill');

      const tierName = ps.planName || ps.tierName || t('common.unknown');
      if (tierEl) tierEl.textContent = tierName;
      if (acctEl) acctEl.textContent = ps.email || t('plan.account.unknown');

      if (priceBadge) {
        if (ps.isZeroExtraCost || ps.actualPricePaid === 0) {
          priceBadge.textContent = `${ps.currencySymbol || '$'}0 ${t('plan.summary.freeWithPlan')}`;
        } else if (ps.actualPricePaid !== null && ps.actualPricePaid !== undefined && ps.actualPricePaid !== '') {
          const sym = ps.currencySymbol || core?.CURRENCY_SYMBOLS?.[ps.currency] || '$';
          const cur = ps.currency || 'USD';
          const cny = core?.convertToCNY ? core.convertToCNY(Number(ps.actualPricePaid), cur, ps.region) : Number(ps.actualPricePaid);
          const cnyStr = cur !== 'CNY' && Number.isFinite(cny) ? ` (${t('plan.cnyShort', { val: cny.toFixed(1) })})` : '';
          priceBadge.textContent = `${sym}${ps.actualPricePaid}${t('plan.summary.perMonth')}${cnyStr}`;
        } else if (ps.publicRefPriceUsd) {
          priceBadge.textContent = `$${ps.publicRefPriceUsd}${t('plan.summary.perMonth')}`;
        } else {
          priceBadge.textContent = t('cost.unknown');
        }
      }

      if (srcPill) {
        srcPill.textContent = ps.priceSource === 'custom'
          ? t('plan.summary.custom')
          : (ps.identified ? t('plan.summary.identified') : t('plan.summary.unknown'));
      }

      const dtPlan = el('dt-plan-name');
      const dtEmail = el('dt-account-email');
      const dtAcq = el('dt-acq-source');
      const dtPrice = el('dt-price-text');
      const dtValRow = el('row-validity');
      const dtValText = el('dt-validity-text');
      const dtNoteRow = el('row-note');
      const dtNoteText = el('dt-note-text');
      const dtPromptRow = el('row-prompt-credits');
      const dtPromptVal = el('dt-prompt-credits');
      const dtFlowRow = el('row-flow-credits');
      const dtFlowVal = el('dt-flow-credits');
      const dtUpdated = el('dt-updated-at');

      if (dtPlan) dtPlan.textContent = tierName;
      if (dtEmail) dtEmail.textContent = ps.email || t('plan.account.unknown');
      if (dtAcq) dtAcq.textContent = localizeAcquisitionSource(ps.acquisitionSourceName || ps.acquisitionSource);

      if (dtPrice) {
        if (ps.isZeroExtraCost || ps.actualPricePaid === 0) {
          dtPrice.textContent = `${ps.currencySymbol || '$'}0 ${t('plan.summary.freeWithPlan')}`;
        } else if (ps.actualPricePaid !== null && ps.actualPricePaid !== undefined && ps.actualPricePaid !== '') {
          const sym = ps.currencySymbol || '$';
          const cycle = localizeBillingCycleLabel(ps.billingCycle);
          dtPrice.textContent = `${sym}${ps.actualPricePaid} · ${cycle}`;
        } else if (ps.publicRefPriceUsd) {
          dtPrice.textContent = t('cost.publicRefMonthly', { p: ps.publicRefPriceUsd });
        } else {
          dtPrice.textContent = t('common.notProvided');
        }
      }

      const modePresetBtn = el('btn-price-mode-preset');
      const modeCustomBtn = el('btn-price-mode-custom');
      const isCustomMode = ps.priceMode === 'custom' || (ps.priceSource === 'custom' && !ps.priceMode);
      modePresetBtn?.classList?.toggle?.('active', !isCustomMode);
      modeCustomBtn?.classList?.toggle?.('active', isCustomMode);

      if (dtValRow && dtValText) {
        if (ps.validEnd) {
          const isExpired = ps.validEnd < getTodayLocalStr();
          dtValRow.style.display = '';
          dtValText.textContent = t(isExpired ? 'plan.validity.expired' : 'plan.validity.active', { date: ps.validEnd });
        } else {
          dtValRow.style.display = 'none';
        }
      }

      if (dtNoteRow && dtNoteText) {
        if (ps.note) {
          dtNoteRow.style.display = '';
          dtNoteText.textContent = ps.note;
        } else {
          dtNoteRow.style.display = 'none';
        }
      }

      if (dtPromptRow && dtPromptVal) {
        if (ps.availablePromptCredits !== undefined || ps.monthlyPromptCredits !== undefined) {
          dtPromptRow.style.display = '';
          dtPromptVal.textContent = t('plan.credits.avail', {
            avail: ps.availablePromptCredits ?? '—',
            monthly: ps.monthlyPromptCredits ?? '—'
          });
        } else {
          dtPromptRow.style.display = 'none';
        }
      }

      if (dtFlowRow && dtFlowVal) {
        if (ps.availableFlowCredits !== undefined || ps.monthlyFlowCredits !== undefined) {
          dtFlowRow.style.display = '';
          dtFlowVal.textContent = t('plan.credits.avail', {
            avail: ps.availableFlowCredits ?? '—',
            monthly: ps.monthlyFlowCredits ?? '—'
          });
        } else {
          dtFlowRow.style.display = 'none';
        }
      }

      if (dtUpdated) {
        dtUpdated.textContent = ps.updatedAt ? String(ps.updatedAt).slice(0, 19).replace('T', ' ') : t('plan.summary.justNow');
      }

      refreshDirectCountryDisplay(ps.country);
      refreshDirectRegionDisplay(ps.region);
      refreshDirectCurrencyDisplay(ps.currency);
    }

    function renderActiveCostEstimateView() {
      const rawData = ANTIGRAVITY_TOKEN_DATA.raw || {};
      const dailyMap = getActiveDailyMap(rawData);
      const ps = ANTIGRAVITY_TOKEN_DATA.planStatus || {};
      const todayStr = getTodayLocalStr();
      const monthPrefix = todayStr.slice(0, 7);
      const isAllScope = ANTIGRAVITY_TOKEN_DATA.costScope === 'all';
      const dates = Object.keys(dailyMap).filter(d => isAllScope || d.startsWith(monthPrefix)).sort();

      const titleEl = el('cost-title');
      const tagEl = el('cost-period-tag');
      const heroEl = el('cost-ref-total');
      const subSpendEl = el('cost-sub-spend-pill');
      const quickEditBtn = el('btn-quick-edit-plan');

      if (titleEl) titleEl.textContent = isAllScope ? t('cost.titleAll') : t('cost.title');
      if (tagEl) tagEl.textContent = isAllScope ? t('cost.allHistory') : t('cost.periodTag');

      let inTok = 0;
      let cacheTok = 0;
      let outTok = 0;
      for (const ds of dates) {
        const row = dailyMap[ds] || {};
        inTok += Number(row.input || 0);
        cacheTok += Number(row.cache || 0);
        outTok += Number(row.output || 0);
      }

      let refSummary = {
        inputCostUSD: 0,
        cacheCostUSD: 0,
        outputCostUSD: 0,
        totalCostUSD: 0,
        matchedTier: { inputPerMillion: 0.30, cacheReadPerMillion: 0.03, outputPerMillion: 2.50 },
        modelDisplayName: 'Gemini 3.8 Flash Standard'
      };
      if (core?.calculateReferenceModelCost) {
        refSummary = core.calculateReferenceModelCost({
          inputTokens: inTok,
          cacheTokens: cacheTok,
          outputTokens: outTok,
          totalTokens: inTok + cacheTok + outTok
        }) || refSummary;
      }

      const activeSource = ANTIGRAVITY_TOKEN_DATA.activeSource || 'all';
      const identSourceEstimate = isAllScope
        ? (rawData.costEstimateBySource?.[activeSource] || rawData.costEstimate)
        : (activeSource === 'all' ? rawData.costEstimateCurrentMonth : rawData.costEstimateBySource?.[activeSource]);
      const identCost = Number(identSourceEstimate?.pricedCostUSD || 0);
      const identCount = Number(identSourceEstimate?.pricedRequestsCount || 0);
      const hybridObj = isAllScope
        ? (rawData.referenceCost?.hybrid?.hybrid)
        : (rawData.referenceCost?.currentMonthHybrid?.hybrid);

      let inputCostUSD = Number(refSummary.inputCostUSD || 0);
      let cacheCostUSD = Number(refSummary.cacheCostUSD || 0);
      let outputCostUSD = Number(refSummary.outputCostUSD || 0);
      let heroUsd = Number(refSummary.totalCostUSD || 0);

      if (ANTIGRAVITY_TOKEN_DATA.costMode === 'identified') {
        heroUsd = identCost;
        const cat = identSourceEstimate?.byCategory || {};
        const catSum = (cat.inputTokens || 0) + (cat.cacheTokens || 0) + (cat.outputTokens || 0);
        inputCostUSD = catSum > 0 ? (heroUsd * ((cat.inputTokens || 0) / catSum)) : 0;
        cacheCostUSD = catSum > 0 ? (heroUsd * ((cat.cacheTokens || 0) / catSum)) : 0;
        outputCostUSD = catSum > 0 ? (heroUsd * ((cat.outputTokens || 0) / catSum)) : 0;
      } else if (ANTIGRAVITY_TOKEN_DATA.costMode === 'hybrid') {
        if (activeSource === 'all' && hybridObj && Number.isFinite(hybridObj.combinedTotalUSD)) {
          heroUsd = Number(hybridObj.combinedTotalUSD || 0);
        } else if (identCount > 0) {
          heroUsd = Math.max(heroUsd, identCost);
        }
      }

      if (heroEl) heroEl.textContent = t('cost.approx', { val: heroUsd.toFixed(2) });

      if (subSpendEl) {
        if (ps.isZeroExtraCost || ps.actualPricePaid === 0) {
          subSpendEl.textContent = `${t('cost.subSpendLabel')}: ${ps.currencySymbol || '$'}0 (${t('cost.freePromo')})`;
          if (quickEditBtn) quickEditBtn.style.display = 'none';
        } else if (ps.actualPricePaid !== null && ps.actualPricePaid !== undefined && ps.actualPricePaid !== '') {
          const sym = ps.currencySymbol || '$';
          subSpendEl.textContent = `${t('cost.subSpendLabel')}: ${sym}${ps.actualPricePaid} (${localizeBillingCycleLabel(ps.billingCycle)})`;
          if (quickEditBtn) quickEditBtn.style.display = 'none';
        } else {
          subSpendEl.textContent = t('cost.subUnknown');
          if (quickEditBtn) quickEditBtn.style.display = '';
        }
      }

      const cIn = el('cost-card-input');
      const cInTok = el('cost-card-input-tok');
      const cCa = el('cost-card-cache');
      const cCaTok = el('cost-card-cache-tok');
      const cOut = el('cost-card-output');
      const cOutTok = el('cost-card-output-tok');
      if (cIn) cIn.textContent = `$${inputCostUSD.toFixed(2)}`;
      if (cInTok) cInTok.textContent = `${formatTokensK(inTok)} tok`;
      if (cCa) cCa.textContent = `$${cacheCostUSD.toFixed(2)}`;
      if (cCaTok) cCaTok.textContent = t('cost.tokCacheDiscount', { tok: formatTokensK(cacheTok) });
      if (cOut) cOut.textContent = `$${outputCostUSD.toFixed(2)}`;
      if (cOutTok) cOutTok.textContent = `${formatTokensK(outTok)} tok`;

      const covEl = el('cost-coverage-note');
      if (covEl) {
        if (ANTIGRAVITY_TOKEN_DATA.costMode === 'identified') {
          covEl.textContent = identCount > 0
            ? t('cost.identSub', { n: identCount })
            : t('cost.identSubNone');
        } else if (ANTIGRAVITY_TOKEN_DATA.costMode === 'hybrid') {
          covEl.textContent = t('cost.hybridSub', {
            known: identCost.toFixed(2),
            res: Math.max(0, heroUsd - identCost).toFixed(2)
          });
        } else {
          const tier = refSummary.matchedTier || {};
          covEl.textContent = t('cost.refSub', {
            model: refSummary.modelDisplayName || 'gemini-3.8-flash',
            in: tier.inputPerMillion ?? 0.30,
            ca: tier.cacheReadPerMillion ?? 0.03,
            out: tier.outputPerMillion ?? 2.50
          });
        }
      }

      const summaryLine = el('cost-usage-summary-line');
      if (summaryLine) {
        summaryLine.textContent = t('cost.usageSummary', {
          total: formatTokensK(inTok + cacheTok + outTok),
          cache: formatTokensK(cacheTok)
        });
      }

      const diffBox = el('cost-diff-box');
      if (diffBox) {
        if (isAllScope) {
          diffBox.textContent = t('cost.diffAll');
        } else if (ps.isZeroExtraCost || ps.actualPricePaid === 0) {
          diffBox.textContent = t('cost.diffFree', { val: heroUsd.toFixed(2) });
        } else if (ps.actualPricePaid !== null && ps.actualPricePaid !== undefined && ps.actualPricePaid !== '' && (ps.currency === 'USD' || !ps.currency)) {
          const diff = heroUsd - Number(ps.actualPricePaid);
          diffBox.textContent = t('cost.diffPaid', { sign: diff >= 0 ? '+' : '-', val: Math.abs(diff).toFixed(2) });
        } else {
          diffBox.textContent = t('cost.diffUnknown');
        }
      }

      const subLine = el('cost-sub-spend-line');
      if (subLine) {
        if (ps.isZeroExtraCost || ps.actualPricePaid === 0) {
          subLine.textContent = t('cost.subLineFree', { sym: ps.currencySymbol || '$', src: localizeAcquisitionSource(ps.acquisitionSourceName || ps.acquisitionSource) });
        } else if (ps.actualPricePaid !== null && ps.actualPricePaid !== undefined && ps.actualPricePaid !== '') {
          const sym = ps.currencySymbol || '$';
          subLine.textContent = t('cost.subLinePaid', {
            sym,
            val: ps.actualPricePaid,
            cny: '',
            cycle: localizeBillingCycleLabel(ps.billingCycle),
            exp: ''
          });
        } else {
          subLine.textContent = '';
        }
      }

      const bdEl = el('cost-model-breakdown');
      if (bdEl) {
        const entries = Object.entries(identSourceEstimate?.byModel || {});
        if (!entries.length) {
          bdEl.textContent = t('cost.breakdownNone');
        } else {
          const details = entries.slice(0, 6).map(([m, info]) => `${m}: $${Number(info?.costUSD || 0).toFixed(2)}`).join(' · ');
          bdEl.textContent = t('cost.breakdownPrefix', { details, note: '' });
        }
      }
    }

    function applyTokenHistoryPayload(payload) {
      if (!payload || typeof payload !== 'object') return;
      const normalizedPayload = core?.normalizeTokenHistoryPayload
        ? core.normalizeTokenHistoryPayload(payload)
        : payload;
      const prevPs = ANTIGRAVITY_TOKEN_DATA.planStatus || {};
      ANTIGRAVITY_TOKEN_DATA.raw = normalizedPayload;

      let plan = normalizedPayload.planStatus || prevPs;
      const localSnap = getStoredCustomPlanSnapshot(plan?.email || 'default');
      if (core?.resolveEffectivePlanStatus && Object.keys(localSnap).length && !normalizedPayload.customPlanSettings) {
        plan = core.resolveEffectivePlanStatus(plan, localSnap);
      } else if (core?.resolveEffectivePlanStatus && normalizedPayload.customPlanSettings) {
        plan = core.resolveEffectivePlanStatus(plan, normalizedPayload.customPlanSettings);
      }
      ANTIGRAVITY_TOKEN_DATA.planStatus = plan;

      updateBadgeTokensText(normalizedPayload);
      renderTokenCards(normalizedPayload);
      renderPlanDetail(plan);
      renderActiveCostEstimateView();
      renderHeatmapGrid(normalizedPayload);
    }

    async function syncTokenHistoryFromHost(force = false) {
      if (state.disposed) return;
      const now = Date.now();
      if (!force && now - state.lastBridgeSyncAt < 3000) return;
      state.lastBridgeSyncAt = now;

      const cachedUserStatus = hub?.getUserStatus?.() ?? undefined;
      const res = await callBridge('/token-history', { force, cachedUserStatus });
      if (res && res.ok && res.data) {
        applyTokenHistoryPayload(res.data);
      }
    }

    async function recordModelCallsRemote(calls) {
      if (!Array.isArray(calls) || !calls.length || state.disposed) return;
      const res = await callBridge('/record-calls', { calls });
      if (res && res.ok && res.changed) {
        await syncTokenHistoryFromHost(true);
      }
    }

    function switchTokenSource(src) {
      const valid = new Set(['all', 'desktop', 'cli']);
      const next = valid.has(src) ? src : 'all';
      ANTIGRAVITY_TOKEN_DATA.activeSource = next;
      heatmapRangeOffset = 0;
      for (const s of valid) {
        el(`src-tab-${s}`)?.classList?.toggle?.('active', s === next);
      }
      updateBadgeTokensText();
      renderTokenCards();
      renderActiveCostEstimateView();
      renderHeatmapGrid();
    }

    function switchTokenView(view) {
      const next = view === 'cost' ? 'cost' : 'tokens';
      ANTIGRAVITY_TOKEN_DATA.tokenView = next;
      el('tok-view-tokens')?.classList?.toggle?.('active', next === 'tokens');
      el('tok-view-cost')?.classList?.toggle?.('active', next === 'cost');
      const panel = el('panel-tokens');
      const mainView = el('tokens-main-view');
      const costCard = el('cost-estimate-card');
      if (next === 'cost') {
        addClass(panel, 'cost-compact-view');
        if (mainView) mainView.style.display = 'none';
        if (costCard) {
          costCard.style.display = '';
          toggleCostDetails(true);
        }
      } else {
        removeClass(panel, 'cost-compact-view');
        if (mainView) mainView.style.display = '';
        if (costCard) costCard.style.display = '';
      }
      renderActiveCostEstimateView();
      positionFloatingPanels();
    }

    function toggleCostDetails(forceExpand) {
      const body = el('cost-details-body');
      const btn = el('btn-toggle-cost-details');
      const next = typeof forceExpand === 'boolean' ? forceExpand : !ANTIGRAVITY_TOKEN_DATA.costDetailsExpanded;
      ANTIGRAVITY_TOKEN_DATA.costDetailsExpanded = next;
      if (body) body.style.display = next ? 'flex' : 'none';
      if (btn) btn.textContent = next ? t('cost.btnCollapse') : t('cost.btnExpand');
      positionFloatingPanels();
    }

    function updateSegmentedLanguageButtons() {
      const langs = ['zh-CN', 'zh-TW', 'en'];
      for (const l of langs) {
        const btn = el(`btn-top-lang-${l}`);
        btn?.classList?.toggle?.('is-active', currentPanelLanguage === l);
      }
    }

    function applyPanelLanguage(lang, opts = {}) {
      const normalized = normalizePanelLanguage(lang);
      currentPanelLanguage = normalized;
      try {
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem('ag_panel_language', normalized);
          localStorage.setItem('__agy_ctx_lang__', normalized === 'en' ? 'en' : 'zh');
          localStorage.setItem('__ag_usage_lang__', normalized);
        }
      } catch {}

      applyStaticPanelTranslations();
      updateSegmentedLanguageButtons();
      syncCurrencyCountrySelectOptions();
      updateBadgeTokensText();
      renderTokenCards();
      renderPlanDetail(ANTIGRAVITY_TOKEN_DATA.planStatus);
      renderActiveCostEstimateView();
      renderHeatmapGrid();
      applyTheme();
      toggleTokenColorsDrawer(state.colorsDrawerExpanded);
      const costToggleBtn = el('btn-toggle-cost-details');
      if (costToggleBtn) {
        costToggleBtn.textContent = ANTIGRAVITY_TOKEN_DATA.costDetailsExpanded ? t('cost.btnCollapse') : t('cost.btnExpand');
      }
      const planToggleBtn = el('btn-toggle-plan-detail');
      if (planToggleBtn) {
        planToggleBtn.textContent = planDetailExpanded ? t('plan.detail.toggleClose') : t('plan.detail.toggleOpen');
      }

      if (!opts.fromHub && hub?.setLanguage && hub.getLanguage?.() !== normalized) {
        hub.setLanguage(normalized, { persist: true });
      }
      if (!opts.skipPersist) {
        void saveSettingsPayloadBridge({ panelLanguage: normalized });
      }
    }

    async function restoreSettingsFromHost() {
      const res = await callBridge('/get-settings', {});
      if (!res || !res.ok || !res.settings) return;
      const st = res.settings;
      if (st.panelLanguage) {
        applyPanelLanguage(st.panelLanguage, { skipPersist: true });
      }
      if (st.savedHeatView) {
        switchHeatView(st.savedHeatView, true);
      }
      if (st.customPlan && typeof st.customPlan === 'object') {
        applyCustomPlanObjectLocally(st.customPlan, st.customPlan.email || 'default');
      }
    }

    function positionFloatingPanels() {
      const panel = el('panel-tokens');
      if (!panel || panel.hidden) return;
      try {
        const vw = (win && win.innerWidth) || 1280;
        const vh = (win && win.innerHeight) || 800;
        const badge = el('badge-tokens');
        const br = badge?.getBoundingClientRect?.();
        const pw = Math.min(hasClass(panel, 'cost-compact-view') ? 560 : 660, vw - 24);
        let top = br && (br.width > 0 || br.height > 0) ? Math.round(br.bottom + 8) : 44;
        let left = br && (br.width > 0 || br.height > 0) ? Math.round(br.right - pw) : Math.round(vw - pw - 12);
        left = Math.max(12, Math.min(vw - pw - 12, left));
        top = Math.max(36, Math.min(vh - 180, top));
        panel.style.left = `${left}px`;
        panel.style.top = `${top}px`;
      } catch {}
    }

    function showPanel(open) {
      const panel = el('panel-tokens');
      const badge = el('badge-tokens');
      if (!panel) return;
      state.tokensOpen = Boolean(open);
      panel.hidden = !state.tokensOpen;
      badge?.setAttribute?.('aria-expanded', state.tokensOpen ? 'true' : 'false');
      if (state.tokensOpen) {
        positionFloatingPanels();
        void syncTokenHistoryFromHost(true);
      } else {
        closeAllDropdowns();
        closeColorPicker(true);
        hideHeatPop();
      }
    }

    function toggleTokens() {
      showPanel(!state.tokensOpen);
    }

    function findDockTarget() {
      if (!doc || typeof doc.querySelector !== 'function') return null;

      // 1. Antigravity 2.x standalone chat/workbench titlebar: dock to the left of the right button cluster
      const agTitlebar = doc.querySelector('[class*="@container/titlebar"]');
      if (agTitlebar) {
        const directChildren = Array.from(agTitlebar.children || []);
        const rightGroup = directChildren.find(ch => {
          const cls = typeof ch?.className === 'string' ? ch.className : '';
          return cls.split(/\s+/).includes('shrink-0');
        }) || agTitlebar.lastElementChild || directChildren[directChildren.length - 1] || null;

        if (rightGroup && rightGroup !== (agTitlebar.firstElementChild || directChildren[0])) {
          return { container: rightGroup, mode: 'antd-right' };
        }
        return { container: agTitlebar, mode: 'antd-tb' };
      }

      // 2. Classic VS Code workbench titlebar selectors
      const selectors = [
        '.part.titlebar .titlebar-right .actions-container',
        '.part.titlebar .titlebar-right',
        '.titlebar-right',
        'header .actions-container'
      ];
      for (const sel of selectors) {
        const found = doc.querySelector(sel);
        if (found) return { container: found, mode: 'classic' };
      }
      return null;
    }

    function computeFloatingRightOffset() {
      const vw = (win && win.innerWidth) || 1280;
      const defaultRight = 12;
      if (!doc || typeof doc.querySelectorAll !== 'function') return defaultRight;
      try {
        const anchors = doc.querySelectorAll(
          'button[aria-label="More actions"], button[aria-label="Toggle Overview Panel"], button[aria-label="Toggle Side Panel"], [data-testid="toggle-aux-sidebar"], div.absolute.right-0.z-50'
        );
        let minLeft = vw;
        let foundTopBarAnchor = false;
        for (const node of anchors) {
          const r = node?.getBoundingClientRect?.();
          if (!r || r.width <= 0 || r.height <= 0) continue;
          if (r.top < 60 && r.left > vw * 0.4 && r.left < minLeft) {
            minLeft = r.left;
            foundTopBarAnchor = true;
          }
        }
        if (foundTopBarAnchor) {
          return Math.max(defaultRight, Math.ceil(vw - minLeft + 8));
        }
      } catch {}
      return defaultRight;
    }

    function ensureHostDocked() {
      if (state.disposed) return;
      const dockTarget = findDockTarget();
      if (dockTarget && dockTarget.container) {
        const { container: dockParent, mode } = dockTarget;
        host.setAttribute('data-dock', 'flow');
        if (host.style) {
          host.style.top = '';
          host.style.right = '';
          host.style.marginRight = '6px';
        }
        if (mode === 'antd-right') {
          const firstChild = dockParent.firstElementChild || dockParent.firstChild || null;
          if (host.parentElement !== dockParent) {
            if (firstChild && typeof dockParent.insertBefore === 'function') {
              dockParent.insertBefore(host, firstChild);
            } else {
              dockParent.appendChild?.(host);
            }
          }
        } else if (host.parentElement !== dockParent) {
          const firstAction = dockParent.querySelector?.('.action-item, .window-controls-container');
          if (firstAction && typeof dockParent.insertBefore === 'function') {
            dockParent.insertBefore(host, firstAction);
          } else {
            dockParent.appendChild?.(host);
          }
        }
      } else if (doc.body) {
        host.setAttribute('data-dock', 'floating');
        if (host.parentElement !== doc.body) {
          doc.body.appendChild?.(host);
        }
        if (host.style) {
          host.style.top = '6px';
          host.style.right = `${computeFloatingRightOffset()}px`;
          host.style.marginRight = '';
        }
      }
    }

    function bindPanelEvents() {
      el('badge-tokens')?.addEventListener('click', e => {
        e?.stopPropagation?.();
        toggleTokens();
      });
      el('btn-close-tokens')?.addEventListener('click', () => showPanel(false));

      el('btn-theme-tokens')?.addEventListener('click', () => cycleTheme());
      el('btn-token-colors-top')?.addEventListener('click', () => {
        if (!state.tokensOpen) {
          showPanel(true);
          toggleTokenColorsDrawer(true);
        } else {
          toggleTokenColorsDrawer();
        }
        if (state.colorsDrawerExpanded) {
          el('token-color-drawer')?.scrollIntoView?.({ behavior: 'smooth', block: 'nearest' });
        }
      });
      el('btn-toggle-token-colors')?.addEventListener('click', () => toggleTokenColorsDrawer());

      ['zh-CN', 'zh-TW', 'en'].forEach(l => {
        el(`btn-top-lang-${l}`)?.addEventListener('click', e => {
          e?.stopPropagation?.();
          applyPanelLanguage(l);
        });
      });

      ['all', 'desktop', 'cli'].forEach(s => {
        el(`src-tab-${s}`)?.addEventListener('click', () => switchTokenSource(s));
      });
      ['tokens', 'cost'].forEach(v => {
        el(`tok-view-${v}`)?.addEventListener('click', () => switchTokenView(v));
      });

      el('btn-toggle-plan-detail')?.addEventListener('click', () => setPlanDetailExpanded(!planDetailExpanded));
      el('plan-summary-price-badge')?.addEventListener('click', () => setPlanDetailExpanded(!planDetailExpanded));
      el('btn-toggle-cost-details')?.addEventListener('click', () => toggleCostDetails());

      el('cost-scope-period')?.addEventListener('click', () => {
        ANTIGRAVITY_TOKEN_DATA.costScope = 'period';
        el('cost-scope-period')?.classList?.add?.('active');
        el('cost-scope-all')?.classList?.remove?.('active');
        renderActiveCostEstimateView();
      });
      el('cost-scope-all')?.addEventListener('click', () => {
        ANTIGRAVITY_TOKEN_DATA.costScope = 'all';
        el('cost-scope-all')?.classList?.add?.('active');
        el('cost-scope-period')?.classList?.remove?.('active');
        renderActiveCostEstimateView();
      });

      ['ref', 'hybrid', 'identified'].forEach(m => {
        el(`cost-mode-${m}`)?.addEventListener('click', () => {
          ANTIGRAVITY_TOKEN_DATA.costMode = m;
          ['ref', 'hybrid', 'identified'].forEach(x => {
            el(`cost-mode-${x}`)?.classList?.toggle?.('active', x === m);
          });
          renderActiveCostEstimateView();
        });
      });

      el('btn-heat-prev')?.addEventListener('click', () => shiftHeatRange(-1));
      el('btn-heat-next')?.addEventListener('click', () => shiftHeatRange(1));
      ['daily', 'weekly', 'monthly', 'yearly', 'cum'].forEach(v => {
        el(`heat-tab-${v}`)?.addEventListener('click', () => switchHeatView(v));
      });

      if (doc && doc.addEventListener) {
        const onDocClickClose = e => {
          try {
            const path = typeof e?.composedPath === 'function' ? e.composedPath() : [];
            const insideSuite = path.includes(host) || (host.contains && host.contains(e?.target));
            if (!insideSuite) {
              if (!el('color-picker-popover')?.hidden) closeColorPicker();
              if (state.tokensOpen) showPanel(false);
            }
          } catch {}
        };
        const onKeyDown = e => {
          if (e?.key === 'Escape') {
            if (!el('color-picker-popover')?.hidden) closeColorPicker();
            else if (state.tokensOpen) showPanel(false);
          }
        };
        doc.addEventListener('click', onDocClickClose);
        doc.addEventListener('keydown', onKeyDown);
        registerCleanup(() => {
          doc.removeEventListener('click', onDocClickClose);
          doc.removeEventListener('keydown', onKeyDown);
        });
      }

      if (win && win.addEventListener) {
        const onResize = () => {
          ensureHostDocked();
          positionFloatingPanels();
          positionColorPickerPopover();
        };
        win.addEventListener('resize', onResize);
        registerCleanup(() => win.removeEventListener('resize', onResize));
      }
    }

    function start() {
      if (state.started || state.disposed) return controller;
      state.started = true;

      initColorBindings();
      initDropdownAndPlanBindings();
      bindPanelEvents();
      ensureHostDocked();

      const initialLang = hub?.getLanguage?.() || 'zh-CN';
      applyPanelLanguage(initialLang, { fromHub: true, skipPersist: true });

      if (hub) {
        if (typeof hub.subscribeFinalizedCalls === 'function') {
          state.unsubs.push(hub.subscribeFinalizedCalls(calls => {
            void recordModelCallsRemote(calls);
          }));
        }
        if (typeof hub.subscribeLanguage === 'function') {
          state.unsubs.push(hub.subscribeLanguage(lang => {
            applyPanelLanguage(lang, { fromHub: true, skipPersist: true });
          }));
        }
        if (typeof hub.subscribeUserStatus === 'function') {
          state.unsubs.push(hub.subscribeUserStatus(rawStatus => {
            if (rawStatus && core?.parseUserPlanStatus) {
              const parsedPlan = core.parseUserPlanStatus(rawStatus);
              const snap = getStoredCustomPlanSnapshot(parsedPlan?.email || 'default');
              const effective = core.resolveEffectivePlanStatus ? core.resolveEffectivePlanStatus(parsedPlan, snap) : parsedPlan;
              ANTIGRAVITY_TOKEN_DATA.planStatus = effective;
              renderPlanDetail(effective);
              renderActiveCostEstimateView();
            }
          }));
        }
      }

      try {
        const tb = doc.querySelector?.('[class*="@container/titlebar"]') || doc.querySelector?.('.part.titlebar');
        if (tb && typeof MutationObserver === 'function') {
          state.titlebarObserver = new MutationObserver(() => ensureHostDocked());
          state.titlebarObserver.observe(tb, { childList: true, subtree: true });
        } else if (doc.body && typeof MutationObserver === 'function') {
          state.titlebarObserver = new MutationObserver(() => ensureHostDocked());
          state.titlebarObserver.observe(doc.body, { childList: true, subtree: true });
        }
        if (win && typeof ResizeObserver === 'function' && doc.body) {
          state.resizeObserver = new ResizeObserver(() => {
            ensureHostDocked();
            positionFloatingPanels();
          });
          state.resizeObserver.observe(doc.body);
        }
      } catch {}

      if (options.autoSync !== false) {
        void restoreSettingsFromHost();
        void syncTokenHistoryFromHost(true);
        state.historyTimer = setInterval(() => {
          void syncTokenHistoryFromHost(false);
        }, 60000);
      }

      return controller;
    }

    function dispose() {
      if (state.disposed) return;
      state.disposed = true;
      if (state.historyTimer) { clearInterval(state.historyTimer); state.historyTimer = null; }
      if (saveFeedbackTimer) { clearTimeout(saveFeedbackTimer); saveFeedbackTimer = null; }
      if (state.titlebarObserver) { state.titlebarObserver.disconnect(); state.titlebarObserver = null; }
      if (state.resizeObserver) { state.resizeObserver.disconnect(); state.resizeObserver = null; }
      for (const unsub of state.unsubs) {
        try { unsub(); } catch {}
      }
      state.unsubs = [];
      for (const fn of cleanupCallbacks) {
        try { fn(); } catch {}
      }
      cleanupCallbacks.length = 0;
      try { host.remove?.(); } catch {}
    }

    const controller = {
      version: SUITE_VERSION,
      host,
      shadow,
      start,
      dispose,
      showPanel,
      toggleTokens,
      switchTokenSource,
      switchTokenView,
      switchHeatView,
      applyPanelLanguage,
      applyTokenHistoryPayload,
      syncTokenHistoryFromHost,
      recordModelCallsRemote,
      getLanguage: () => currentPanelLanguage,
      isDisposed: () => state.disposed,
      el
    };

    return controller;
  }

  const exported = {
    SUITE_VERSION,
    mountUsagePanel
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = exported;
  } else {
    root.__AGUsagePanelModule = exported;
  }
})(globalThis);
