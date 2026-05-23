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

const STATUS_TIMEOUT_MS = 1800;
let statusTimer: number | undefined;

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

function showStatus(statusEl: HTMLElement, message: string) {
  if (statusTimer) window.clearTimeout(statusTimer);
  statusEl.textContent = message;
  statusEl.hidden = false;
  statusTimer = window.setTimeout(() => {
    statusEl.hidden = true;
  }, STATUS_TIMEOUT_MS);
}

function saveSettingsWithStatus(settings: Settings, statusEl: HTMLElement) {
  void saveSettings(settings).then(() => {
    showStatus(statusEl, chrome.i18n.getMessage('savedStatus'));
  });
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

async function createUI(settings: Settings, initialStatusMessage = '') {
  const app = document.getElementById('app');
  const appTitle = document.getElementById('app-title');
  if (!app) return;
  if (appTitle) appTitle.textContent = chrome.i18n.getMessage('appName');
  app.innerHTML = '';
  app.className = '';
  app.setAttribute('aria-busy', 'false');

  const premiumStatus = await getPremiumStatus();
  const presets = await loadPresets();
  const domain = await getCurrentDomain();
  const autoApplySites = await loadAutoApplySites();

  const container = document.createElement('div');
  container.className = 'popup-panel';

  // Premium Banner
  const premiumBanner = document.createElement('div');
  premiumBanner.className = 'banner';
  if (premiumStatus.trialExpired) {
    premiumBanner.classList.add('banner--danger');
    premiumBanner.innerHTML = `${chrome.i18n.getMessage('trialExpired')}<br><a href="https://checkout.stripe.com/pay/font-fit-premium" target="_blank">${chrome.i18n.getMessage('upgradePremium')}</a>`;
  } else if (premiumStatus.isTrialing) {
    premiumBanner.classList.add('banner--info');
    premiumBanner.textContent = chrome.i18n.getMessage('premiumTrial', [premiumStatus.daysLeft.toString()]);
  } else {
    premiumBanner.classList.add('banner--success');
    premiumBanner.textContent = chrome.i18n.getMessage('premiumActive');
  }
  container.appendChild(premiumBanner);

  const statusEl = document.createElement('p');
  statusEl.className = 'status-message';
  statusEl.setAttribute('role', 'status');
  statusEl.hidden = true;
  container.appendChild(statusEl);
  if (initialStatusMessage) showStatus(statusEl, initialStatusMessage);

  // Font Family
  const fontLabel = createLabel(chrome.i18n.getMessage('fontFamily'));
  const fontSelect = document.createElement('select');
  [
    { name: chrome.i18n.getMessage('fontUD'), value: FONT_STACKS.UD_GOTHIC },
    { name: chrome.i18n.getMessage('fontSans'), value: FONT_STACKS.SANS_SERIF },
    { name: chrome.i18n.getMessage('fontSerif'), value: FONT_STACKS.SERIF }
  ].forEach(opt => {
    const el = document.createElement('option');
    el.value = opt.value;
    el.textContent = opt.name;
    if (opt.value === settings.fontFamily) el.selected = true;
    fontSelect.appendChild(el);
  });
  fontSelect.addEventListener('change', () => {
    settings.fontFamily = fontSelect.value;
    saveSettingsWithStatus(settings, statusEl);
  });
  container.appendChild(fontLabel);
  container.appendChild(fontSelect);

  // Sliders
  container.appendChild(createSliderSetting(chrome.i18n.getMessage('fontSize'), 0.8, 3.0, 0.1, settings.fontSize, (val) => {
    settings.fontSize = val;
    saveSettingsWithStatus(settings, statusEl);
  }));
  container.appendChild(createSliderSetting(chrome.i18n.getMessage('lineHeight'), 1.0, 3.0, 0.1, settings.lineHeight, (val) => {
    settings.lineHeight = val;
    saveSettingsWithStatus(settings, statusEl);
  }));
  container.appendChild(createSliderSetting(chrome.i18n.getMessage('letterSpacing'), 0, 0.5, 0.01, settings.letterSpacing, (val) => {
    settings.letterSpacing = val;
    saveSettingsWithStatus(settings, statusEl);
  }));

  // Background Color & Max Width
  const row2 = document.createElement('div');
  row2.className = 'form-row';

  const bgCol = document.createElement('div');
  bgCol.appendChild(createLabel(chrome.i18n.getMessage('bgColor')));
  const bgSelect = document.createElement('select');
  [
    { name: chrome.i18n.getMessage('bgWhite'), value: '#ffffff' },
    { name: chrome.i18n.getMessage('bgCream'), value: '#fdf5e6' },
    { name: chrome.i18n.getMessage('bgDark'), value: '#333333' }
  ].forEach(opt => {
    const el = document.createElement('option');
    el.value = opt.value; el.textContent = opt.name;
    if (opt.value === settings.backgroundColor) el.selected = true;
    bgSelect.appendChild(el);
  });
  bgSelect.addEventListener('change', () => {
    settings.backgroundColor = bgSelect.value;
    saveSettingsWithStatus(settings, statusEl);
  });
  bgCol.appendChild(bgSelect);
  row2.appendChild(bgCol);

  const widthCol = document.createElement('div');
  widthCol.appendChild(createLabel(chrome.i18n.getMessage('maxWidth')));
  const widthSelect = document.createElement('select');
  [
    { name: '640px', value: '640px' },
    { name: '760px', value: '760px' },
    { name: chrome.i18n.getMessage('widthFull'), value: 'none' }
  ].forEach(opt => {
    const el = document.createElement('option');
    el.value = opt.value; el.textContent = opt.name;
    if (opt.value === settings.maxWidth) el.selected = true;
    widthSelect.appendChild(el);
  });
  widthSelect.addEventListener('change', () => {
    settings.maxWidth = widthSelect.value;
    saveSettingsWithStatus(settings, statusEl);
  });
  widthCol.appendChild(widthSelect);
  row2.appendChild(widthCol);
  container.appendChild(row2);

  // Presets Section
  const presetContainer = document.createElement('div');
  presetContainer.className = 'section';
  presetContainer.appendChild(createLabel(chrome.i18n.getMessage('presets')));
  
  const presetList = document.createElement('div');
  presetList.className = 'preset-list';

  if (presets.length === 0) {
    const emptyState = document.createElement('p');
    emptyState.className = 'empty-state';
    emptyState.textContent = chrome.i18n.getMessage('noPresets');
    presetList.appendChild(emptyState);
  }

  presets.forEach((p) => {
    const pBtn = document.createElement('button');
    pBtn.textContent = p.name;
    pBtn.className = 'secondary compact';
    pBtn.addEventListener('click', async () => {
      Object.assign(settings, p.settings);
      await saveSettings(settings);
      await createUI(settings, chrome.i18n.getMessage('savedStatus'));
    });
    presetList.appendChild(pBtn);
  });
  presetContainer.appendChild(presetList);

  const savePresetBtn = document.createElement('button');
  savePresetBtn.textContent = chrome.i18n.getMessage('save');
  savePresetBtn.className = 'compact';
  if (!premiumStatus.isPremium && presets.length >= 2) {
    savePresetBtn.disabled = true;
    savePresetBtn.title = chrome.i18n.getMessage('premiumForMorePresets');
  }
  savePresetBtn.addEventListener('click', async () => {
    const name = prompt(chrome.i18n.getMessage('presetNamePrompt'), `P${presets.length + 1}`);
    if (name) {
      presets.push({ name, settings: { ...settings } });
      await savePresets(presets);
      await createUI(settings, chrome.i18n.getMessage('savedStatus'));
    }
  });
  presetContainer.appendChild(savePresetBtn);
  container.appendChild(presetContainer);

  // Auto Apply
  if (domain) {
    const aaRow = document.createElement('div');
    aaRow.className = 'auto-apply-row';
    const aaCheck = document.createElement('input');
    aaCheck.type = 'checkbox';
    aaCheck.checked = autoApplySites.includes(domain);
    if (!premiumStatus.isPremium) {
      aaCheck.disabled = true;
      aaRow.title = chrome.i18n.getMessage('premiumOnly');
    }
    aaCheck.addEventListener('change', async () => {
      let sites = await loadAutoApplySites();
      if (aaCheck.checked) { if (!sites.includes(domain)) sites.push(domain); }
      else { sites = sites.filter(s => s !== domain); }
      await chrome.storage.local.set({ autoApplySites: sites });
      showStatus(statusEl, chrome.i18n.getMessage('savedStatus'));
    });
    aaRow.appendChild(aaCheck);
    aaRow.appendChild(document.createTextNode(chrome.i18n.getMessage('autoApply')));
    container.appendChild(aaRow);
  }

  // Action Buttons
  const btnRow = document.createElement('div');
  btnRow.className = 'button-row';

  const applyBtn = document.createElement('button');
  applyBtn.textContent = chrome.i18n.getMessage('apply');
  applyBtn.addEventListener('click', async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab?.id) {
      await chrome.scripting.executeScript({ target: { tabId: tab.id }, func: applyStyle, args: [settings] });
      showStatus(statusEl, chrome.i18n.getMessage('appliedStatus'));
    }
  });
  
  const resetBtn = document.createElement('button');
  resetBtn.textContent = chrome.i18n.getMessage('reset');
  resetBtn.className = 'secondary';
  resetBtn.addEventListener('click', async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab?.id) {
      await chrome.scripting.executeScript({ target: { tabId: tab.id }, func: removeStyle });
      showStatus(statusEl, chrome.i18n.getMessage('resetStatus'));
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
  return label;
}

function createSliderSetting(label: string, min: number, max: number, step: number, value: number, onChange: (val: number) => void): HTMLElement {
  const wrapper = document.createElement('div');
  wrapper.appendChild(createLabel(label));
  const row = document.createElement('div');
  row.className = 'slider-row';

  const slider = document.createElement('input');
  slider.type = 'range';
  slider.min = min.toString(); slider.max = max.toString(); slider.step = step.toString();
  slider.value = value.toString();

  const valDisp = document.createElement('span');
  valDisp.textContent = value.toFixed(2);
  valDisp.className = 'value-pill';

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
  const app = document.getElementById('app');
  const appTitle = document.getElementById('app-title');
  if (appTitle) appTitle.textContent = chrome.i18n.getMessage('appName');
  if (app) {
    app.textContent = chrome.i18n.getMessage('loading');
    app.setAttribute('aria-busy', 'true');
  }

  const settings = await loadSettings();
  const premiumStatus = await getPremiumStatus();
  const domain = await getCurrentDomain();
  const autoApplySites = await loadAutoApplySites();

  await createUI(settings);

  // Auto-apply logic
  if (premiumStatus.isPremium && domain && autoApplySites.includes(domain)) {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab?.id) {
      chrome.scripting.executeScript({ target: { tabId: tab.id }, func: applyStyle, args: [settings] });
    }
  }
});

