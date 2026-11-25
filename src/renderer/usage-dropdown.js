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
