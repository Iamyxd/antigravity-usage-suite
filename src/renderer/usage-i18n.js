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
