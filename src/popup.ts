// popup.ts : 設定UI(フォント/行間/文字間/背景色/最大幅)。

import { applyStyle, removeStyle } from './content';
import { formatFixedDecimal, formatInteger, fractionDigitsForStep } from './core/format';
import { FONT_STACKS, getPremiumStatus as resolvePremiumStatus, type PremiumStatus, type Preset, type Settings } from './core/settings';
import { createChromeStorageAdapter } from './storage/chromeStorage';

const STATUS_TIMEOUT_MS = 1800;
const FREE_PRESET_LIMIT = 2;
let statusTimer: number | undefined;
let controlIdSequence = 0;
const storage = createChromeStorageAdapter();

async function loadSettings(): Promise<Settings> {
  return storage.loadSettings();
}

async function saveSettings(settings: Settings) {
  await storage.saveSettings(settings);
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

function createControlId(prefix: string): string {
  controlIdSequence += 1;
  return `font-fit-${prefix}-${controlIdSequence}`;
}

function getUiLocale(): string {
  return chrome.i18n.getUILanguage?.() || navigator.language || 'ja';
}

async function getPremiumStatus(): Promise<PremiumStatus> {
  const premiumState = await storage.loadPremiumState();
  const now = Date.now();

  let trialStart = premiumState.trialStartTs;
  if (!trialStart) {
    trialStart = now;
    await storage.saveTrialStartTs(trialStart);
  }

  return resolvePremiumStatus({ ...premiumState, trialStartTs: trialStart }, now);
}

async function loadPresets(): Promise<Preset[]> {
  return storage.loadPresets();
}

async function savePresets(presets: Preset[]) {
  await storage.savePresets(presets);
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
  return storage.loadAutoApplySites();
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
  const uiLocale = getUiLocale();

  const container = document.createElement('div');
  container.className = 'popup-panel';

  // Premium Banner
  const premiumBanner = document.createElement('div');
  premiumBanner.className = 'banner';
  premiumBanner.setAttribute('role', premiumStatus.trialExpired ? 'alert' : 'note');
  if (premiumStatus.trialExpired) {
    premiumBanner.classList.add('banner--danger');
    const upgradeLink = document.createElement('a');
    upgradeLink.href = 'https://checkout.stripe.com/pay/font-fit-premium';
    upgradeLink.target = '_blank';
    upgradeLink.rel = 'noopener noreferrer';
    upgradeLink.textContent = chrome.i18n.getMessage('upgradePremium');
    premiumBanner.append(
      document.createTextNode(chrome.i18n.getMessage('trialExpired')),
      document.createElement('br'),
      upgradeLink
    );
  } else if (premiumStatus.isTrialing) {
    premiumBanner.classList.add('banner--info');
    const trialMessageKey = premiumStatus.daysLeft === 1 ? 'premiumTrialOne' : 'premiumTrialOther';
    premiumBanner.textContent = chrome.i18n.getMessage(trialMessageKey, [formatInteger(premiumStatus.daysLeft, uiLocale)]);
  } else {
    premiumBanner.classList.add('banner--success');
    premiumBanner.textContent = chrome.i18n.getMessage('premiumActive');
  }
  container.appendChild(premiumBanner);

  const statusEl = document.createElement('p');
  statusEl.className = 'status-message';
  statusEl.setAttribute('role', 'status');
  statusEl.setAttribute('aria-live', 'polite');
  statusEl.setAttribute('aria-atomic', 'true');
  statusEl.hidden = true;
  container.appendChild(statusEl);
  if (initialStatusMessage) showStatus(statusEl, initialStatusMessage);

  // Font Family
  const fontSelect = document.createElement('select');
  fontSelect.id = createControlId('font-family');
  const fontLabel = createLabel(chrome.i18n.getMessage('fontFamily'), fontSelect.id);
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
  container.appendChild(createSliderSetting(chrome.i18n.getMessage('fontSize'), 0.8, 3.0, 0.1, settings.fontSize, uiLocale, (val) => {
    settings.fontSize = val;
    saveSettingsWithStatus(settings, statusEl);
  }));
  container.appendChild(createSliderSetting(chrome.i18n.getMessage('lineHeight'), 1.0, 3.0, 0.1, settings.lineHeight, uiLocale, (val) => {
    settings.lineHeight = val;
    saveSettingsWithStatus(settings, statusEl);
  }));
  container.appendChild(createSliderSetting(chrome.i18n.getMessage('letterSpacing'), 0, 0.5, 0.01, settings.letterSpacing, uiLocale, (val) => {
    settings.letterSpacing = val;
    saveSettingsWithStatus(settings, statusEl);
  }));

  // Background Color & Max Width
  const row2 = document.createElement('div');
  row2.className = 'form-row';

  const bgCol = document.createElement('div');
  const bgSelect = document.createElement('select');
  bgSelect.id = createControlId('background-color');
  bgCol.appendChild(createLabel(chrome.i18n.getMessage('bgColor'), bgSelect.id));
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
  const widthSelect = document.createElement('select');
  widthSelect.id = createControlId('max-width');
  widthCol.appendChild(createLabel(chrome.i18n.getMessage('maxWidth'), widthSelect.id));
  [
    { name: chrome.i18n.getMessage('pixelValue', [formatInteger(640, uiLocale)]), value: '640px' },
    { name: chrome.i18n.getMessage('pixelValue', [formatInteger(760, uiLocale)]), value: '760px' },
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
  const presetTitle = createSectionTitle(chrome.i18n.getMessage('presets'));
  presetContainer.setAttribute('aria-labelledby', presetTitle.id);
  presetContainer.appendChild(presetTitle);
  
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
    pBtn.type = 'button';
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
  savePresetBtn.type = 'button';
  savePresetBtn.textContent = chrome.i18n.getMessage('save');
  savePresetBtn.className = 'compact';
  if (!premiumStatus.isPremium && presets.length >= FREE_PRESET_LIMIT) {
    const morePresetsMessage = chrome.i18n.getMessage('premiumForMorePresets', [formatInteger(FREE_PRESET_LIMIT + 1, uiLocale)]);
    savePresetBtn.disabled = true;
    savePresetBtn.title = morePresetsMessage;
    savePresetBtn.setAttribute('aria-label', `${chrome.i18n.getMessage('save')} - ${morePresetsMessage}`);
  }
  savePresetBtn.addEventListener('click', async () => {
    const presetNumber = formatInteger(presets.length + 1, uiLocale);
    const name = prompt(chrome.i18n.getMessage('presetNamePrompt'), chrome.i18n.getMessage('defaultPresetName', [presetNumber]));
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
    aaCheck.id = createControlId('auto-apply');
    aaCheck.type = 'checkbox';
    aaCheck.checked = autoApplySites.includes(domain);
    const aaLabel = createLabel(chrome.i18n.getMessage('autoApply'), aaCheck.id);
    aaLabel.className = 'checkbox-label';
    if (!premiumStatus.isPremium) {
      aaCheck.disabled = true;
      aaRow.title = chrome.i18n.getMessage('premiumOnly');
      const premiumOnlyNote = document.createElement('span');
      premiumOnlyNote.id = createControlId('premium-only-note');
      premiumOnlyNote.className = 'visually-hidden';
      premiumOnlyNote.textContent = chrome.i18n.getMessage('premiumOnly');
      aaCheck.setAttribute('aria-describedby', premiumOnlyNote.id);
      aaRow.appendChild(premiumOnlyNote);
    }
    aaCheck.addEventListener('change', async () => {
      let sites = await loadAutoApplySites();
      if (aaCheck.checked) { if (!sites.includes(domain)) sites.push(domain); }
      else { sites = sites.filter(s => s !== domain); }
      await storage.saveAutoApplySites(sites);
      showStatus(statusEl, chrome.i18n.getMessage('savedStatus'));
    });
    aaRow.appendChild(aaCheck);
    aaRow.appendChild(aaLabel);
    container.appendChild(aaRow);
  }

  // Action Buttons
  const btnRow = document.createElement('div');
  btnRow.className = 'button-row';

  const applyBtn = document.createElement('button');
  applyBtn.type = 'button';
  applyBtn.textContent = chrome.i18n.getMessage('apply');
  applyBtn.addEventListener('click', async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab?.id) {
      await chrome.scripting.executeScript({ target: { tabId: tab.id }, func: applyStyle, args: [settings] });
      showStatus(statusEl, chrome.i18n.getMessage('appliedStatus'));
    }
  });
  
  const resetBtn = document.createElement('button');
  resetBtn.type = 'button';
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

function createLabel(text: string, htmlFor?: string): HTMLLabelElement {
  const label = document.createElement('label');
  label.textContent = text;
  if (htmlFor) label.htmlFor = htmlFor;
  return label;
}

function createSectionTitle(text: string): HTMLHeadingElement {
  const title = document.createElement('h2');
  title.id = createControlId('section-title');
  title.className = 'section-title';
  title.textContent = text;
  return title;
}

function createSliderSetting(label: string, min: number, max: number, step: number, value: number, locale: string, onChange: (val: number) => void): HTMLElement {
  const wrapper = document.createElement('div');
  const row = document.createElement('div');
  row.className = 'slider-row';
  const formatSliderValue = (sliderValue: number) => formatFixedDecimal(sliderValue, locale, fractionDigitsForStep(step));

  const slider = document.createElement('input');
  slider.id = createControlId('slider');
  slider.type = 'range';
  slider.min = min.toString(); slider.max = max.toString(); slider.step = step.toString();
  slider.value = value.toString();
  slider.setAttribute('aria-valuetext', formatSliderValue(value));
  wrapper.appendChild(createLabel(label, slider.id));

  const valDisp = document.createElement('span');
  valDisp.textContent = formatSliderValue(value);
  valDisp.className = 'value-pill';

  slider.addEventListener('input', () => {
    const val = parseFloat(slider.value);
    const formattedValue = formatSliderValue(val);
    valDisp.textContent = formattedValue;
    slider.setAttribute('aria-valuetext', formattedValue);
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

