// popup.ts : 設定UI(フォント/行間/文字間/背景色/最大幅)。

import { Settings, applyStyle, removeStyle, FONT_STACKS } from './content';

const defaultSettings: Settings = {
  fontFamily: FONT_STACKS.UD_GOTHIC,
  fontSize: 1.2,
  lineHeight: 1.8,
  letterSpacing: 0.05,
  backgroundColor: '#ffffff',
  maxWidth: '760px'
};

type Preset = {
  name: string;
  settings: Settings;
};

type PremiumStatus = {
  isPremium: boolean;
  isTrialing: boolean;
  daysLeft: number;
  trialExpired: boolean;
};

async function loadSettings(): Promise<Settings> {
  const data = await chrome.storage.local.get('settings');
  return { ...defaultSettings, ...data.settings };
}

async function saveSettings(settings: Settings) {
  await chrome.storage.local.set({ settings });
}

async function getPremiumStatus(): Promise<PremiumStatus> {
  const data = await chrome.storage.local.get(['is_premium', 'trial_start_ts']);
  const now = Date.now();
  const sevenDays = 7 * 24 * 60 * 60 * 1000;
  
  let trialStart = data.trial_start_ts;
  if (!trialStart) {
    trialStart = now;
    await chrome.storage.local.set({ trial_start_ts: trialStart });
  }

  const trialExpiresAt = trialStart + sevenDays;
  const isTrialing = now < trialExpiresAt;
  const isPremium = !!data.is_premium || isTrialing;
  const daysLeft = Math.ceil((trialExpiresAt - now) / (24 * 60 * 60 * 1000));

  return { 
    isPremium, 
    isTrialing: isTrialing && !data.is_premium, 
    daysLeft: isTrialing ? daysLeft : 0,
    trialExpired: !isTrialing && !data.is_premium
  };
}

async function loadPresets(): Promise<Preset[]> {
  const data = await chrome.storage.local.get('presets');
  return data.presets || [];
}

async function savePresets(presets: Preset[]) {
  await chrome.storage.local.set({ presets });
}

async function getCurrentDomain(): Promise<string> {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab?.url) {
    try {
      return new URL(tab.url).hostname;
    } catch {
      return '';
    }
  }
  return '';
}

async function loadAutoApplySites(): Promise<string[]> {
  const data = await chrome.storage.local.get('autoApplySites');
  return data.autoApplySites || [];
}

async function createUI(settings: Settings) {
  const app = document.getElementById('app');
  if (!app) return;
  app.innerHTML = '';

  const premiumStatus = await getPremiumStatus();
  const presets = await loadPresets();
  const domain = await getCurrentDomain();
  const autoApplySites = await loadAutoApplySites();

  const container = document.createElement('div');
  container.style.display = 'flex';
  container.style.flexDirection = 'column';
  container.style.gap = '10px';
  container.style.padding = '10px';
  container.style.width = '300px';

  // Premium Banner
  const premiumBanner = document.createElement('div');
  premiumBanner.style.padding = '8px';
  premiumBanner.style.borderRadius = '4px';
  premiumBanner.style.fontSize = '11px';
  if (premiumStatus.trialExpired) {
    premiumBanner.style.backgroundColor = '#ffebee';
    premiumBanner.style.color = '#c62828';
    premiumBanner.innerHTML = `試用期間終了。機能制限中。<br><a href="https://checkout.stripe.com/pay/font-fit-premium" target="_blank" style="color:#c62828; font-weight:bold;">Premiumへアップグレード ($3)</a>`;
  } else if (premiumStatus.isTrialing) {
    premiumBanner.style.backgroundColor = '#e3f2fd';
    premiumBanner.style.color = '#1565c0';
    premiumBanner.textContent = `Premium試用中 (残り ${premiumStatus.daysLeft} 日)`;
  } else {
    premiumBanner.style.backgroundColor = '#e8f5e9';
    premiumBanner.style.color = '#2e7d32';
    premiumBanner.textContent = 'Premium有効';
  }
  container.appendChild(premiumBanner);

  // Font Family
  const fontLabel = createLabel('フォント');
  const fontSelect = document.createElement('select');
  [
    { name: 'ゴシック (UD代替)', value: FONT_STACKS.UD_GOTHIC },
    { name: 'サンセリフ', value: FONT_STACKS.SANS_SERIF },
    { name: 'セリフ', value: FONT_STACKS.SERIF }
  ].forEach(opt => {
    const el = document.createElement('option');
    el.value = opt.value;
    el.textContent = opt.name;
    if (opt.value === settings.fontFamily) el.selected = true;
    fontSelect.appendChild(el);
  });
  fontSelect.addEventListener('change', () => {
    settings.fontFamily = fontSelect.value;
    saveSettings(settings);
  });
  container.appendChild(fontLabel);
  container.appendChild(fontSelect);

  // Sliders
  container.appendChild(createSliderSetting('文字サイズ', 0.8, 3.0, 0.1, settings.fontSize, (val) => {
    settings.fontSize = val;
    saveSettings(settings);
  }));
  container.appendChild(createSliderSetting('行間', 1.0, 3.0, 0.1, settings.lineHeight, (val) => {
    settings.lineHeight = val;
    saveSettings(settings);
  }));
  container.appendChild(createSliderSetting('文字間', 0, 0.5, 0.01, settings.letterSpacing, (val) => {
    settings.letterSpacing = val;
    saveSettings(settings);
  }));

  // Background Color & Max Width
  const row2 = document.createElement('div');
  row2.style.display = 'flex';
  row2.style.gap = '8px';

  const bgCol = document.createElement('div');
  bgCol.style.flex = '1';
  bgCol.appendChild(createLabel('背景色'));
  const bgSelect = document.createElement('select');
  bgSelect.style.width = '100%';
  [{ name: '白', value: '#ffffff' }, { name: 'クリーム', value: '#fdf5e6' }, { name: 'ダーク', value: '#333333' }].forEach(opt => {
    const el = document.createElement('option');
    el.value = opt.value; el.textContent = opt.name;
    if (opt.value === settings.backgroundColor) el.selected = true;
    bgSelect.appendChild(el);
  });
  bgSelect.addEventListener('change', () => { settings.backgroundColor = bgSelect.value; saveSettings(settings); });
  bgCol.appendChild(bgSelect);
  row2.appendChild(bgCol);

  const widthCol = document.createElement('div');
  widthCol.style.flex = '1';
  widthCol.appendChild(createLabel('最大幅'));
  const widthSelect = document.createElement('select');
  widthSelect.style.width = '100%';
  [{ name: '640px', value: '640px' }, { name: '760px', value: '760px' }, { name: '全幅', value: 'none' }].forEach(opt => {
    const el = document.createElement('option');
    el.value = opt.value; el.textContent = opt.name;
    if (opt.value === settings.maxWidth) el.selected = true;
    widthSelect.appendChild(el);
  });
  widthSelect.addEventListener('change', () => { settings.maxWidth = widthSelect.value; saveSettings(settings); });
  widthCol.appendChild(widthSelect);
  row2.appendChild(widthCol);
  container.appendChild(row2);

  // Presets Section
  const presetContainer = document.createElement('div');
  presetContainer.style.borderTop = '1px solid #eee';
  presetContainer.style.paddingTop = '8px';
  presetContainer.appendChild(createLabel('プリセット'));
  
  const presetList = document.createElement('div');
  presetList.style.display = 'flex';
  presetList.style.gap = '4px';
  presetList.style.flexWrap = 'wrap';
  presetList.style.margin = '4px 0';

  presets.forEach((p, i) => {
    const pBtn = document.createElement('button');
    pBtn.textContent = p.name;
    pBtn.style.fontSize = '10px';
    pBtn.style.padding = '2px 6px';
    pBtn.addEventListener('click', () => {
      Object.assign(settings, p.settings);
      saveSettings(settings);
      createUI(settings);
    });
    presetList.appendChild(pBtn);
  });
  presetContainer.appendChild(presetList);

  const savePresetBtn = document.createElement('button');
  savePresetBtn.textContent = '保存';
  savePresetBtn.style.fontSize = '10px';
  if (!premiumStatus.isPremium && presets.length >= 2) {
    savePresetBtn.disabled = true;
    savePresetBtn.title = 'Premiumなら3つ以上保存可能';
  }
  savePresetBtn.addEventListener('click', async () => {
    const name = prompt('名前:', `P${presets.length + 1}`);
    if (name) {
      presets.push({ name, settings: { ...settings } });
      await savePresets(presets);
      createUI(settings);
    }
  });
  presetContainer.appendChild(savePresetBtn);
  container.appendChild(presetContainer);

  // Auto Apply
  if (domain) {
    const aaRow = document.createElement('div');
    aaRow.style.fontSize = '11px';
    const aaCheck = document.createElement('input');
    aaCheck.type = 'checkbox';
    aaCheck.checked = autoApplySites.includes(domain);
    if (!premiumStatus.isPremium) {
      aaCheck.disabled = true;
      aaRow.title = 'Premium専用機能';
    }
    aaCheck.addEventListener('change', async () => {
      let sites = await loadAutoApplySites();
      if (aaCheck.checked) { if (!sites.includes(domain)) sites.push(domain); }
      else { sites = sites.filter(s => s !== domain); }
      await chrome.storage.local.set({ autoApplySites: sites });
    });
    aaRow.appendChild(aaCheck);
    aaRow.appendChild(document.createTextNode(` このサイトで自動適用 (Premium)`));
    container.appendChild(aaRow);
  }

  // Action Buttons
  const btnRow = document.createElement('div');
  btnRow.style.display = 'flex';
  btnRow.style.gap = '8px';

  const applyBtn = document.createElement('button');
  applyBtn.textContent = '適用';
  applyBtn.style.flex = '1';
  applyBtn.addEventListener('click', async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab?.id) {
      await chrome.scripting.executeScript({ target: { tabId: tab.id }, func: applyStyle, args: [settings] });
    }
  });
  
  const resetBtn = document.createElement('button');
  resetBtn.textContent = '元に戻す';
  resetBtn.style.flex = '1';
  resetBtn.addEventListener('click', async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab?.id) {
      await chrome.scripting.executeScript({ target: { tabId: tab.id }, func: removeStyle });
    }
  });

  btnRow.appendChild(applyBtn);
  btnRow.appendChild(resetBtn);
  container.appendChild(btnRow);

  app.appendChild(container);
}

function createLabel(text: string): HTMLElement {
  const label = document.createElement('label');
  label.textContent = text;
  label.style.fontSize = '11px';
  label.style.fontWeight = 'bold';
  label.style.display = 'block';
  return label;
}

function createSliderSetting(label: string, min: number, max: number, step: number, value: number, onChange: (val: number) => void): HTMLElement {
  const wrapper = document.createElement('div');
  wrapper.appendChild(createLabel(label));
  const row = document.createElement('div');
  row.style.display = 'flex';
  row.style.alignItems = 'center';
  row.style.gap = '8px';

  const slider = document.createElement('input');
  slider.type = 'range';
  slider.min = min.toString(); slider.max = max.toString(); slider.step = step.toString();
  slider.value = value.toString();
  slider.style.flex = '1';

  const valDisp = document.createElement('span');
  valDisp.textContent = value.toFixed(2);
  valDisp.style.fontSize = '10px';
  valDisp.style.minWidth = '25px';

  slider.addEventListener('input', () => {
    const val = parseFloat(slider.value);
    valDisp.textContent = val.toFixed(2);
    onChange(val);
  });

  row.appendChild(slider);
  row.appendChild(valDisp);
  wrapper.appendChild(row);
  return wrapper;
}

document.addEventListener('DOMContentLoaded', async () => {
  const settings = await loadSettings();
  const premiumStatus = await getPremiumStatus();
  const domain = await getCurrentDomain();
  const autoApplySites = await loadAutoApplySites();

  createUI(settings);

  // Auto-apply logic
  if (premiumStatus.isPremium && domain && autoApplySites.includes(domain)) {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab?.id) {
      chrome.scripting.executeScript({ target: { tabId: tab.id }, func: applyStyle, args: [settings] });
    }
  }
});

