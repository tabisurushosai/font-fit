// popup.ts : 設定UI(フォント/行間/文字間/背景色/最大幅)。

import { applyStyle, removeStyle } from './content';
import { formatCurrency, formatFixedDecimal, formatInteger, formatShortDate, fractionDigitsForStep } from './core/format';
import {
  BACKGROUND_COLORS,
  FONT_STACKS,
  MAX_WIDTHS,
  getPremiumStatus as resolvePremiumStatus,
  shouldShowInitialOnboardingGuide,
  type BackgroundColor,
  type FontFamily,
  type MaxWidth,
  type PremiumStatus,
  type Settings
} from './core/settings';
import { createChromeStorageAdapter } from './storage/chromeStorage';

const STATUS_TIMEOUT_MS = 1800;
const FREE_PRESET_LIMIT = 2;
const PREMIUM_PRICE_USD = 3;
let statusTimer: number | undefined;
let controlIdSequence = 0;
const storage = createChromeStorageAdapter();

type SelectOption<Value extends string = string> = Readonly<{
  name: string;
  value: Value;
}>;

type SelectSettingConfig<Value extends string = string> = Readonly<{
  idPrefix: string;
  label: string;
  options: readonly SelectOption<Value>[];
  selectedValue: Value;
  onChange: (value: Value) => void;
}>;

function showStatus(statusEl: HTMLElement, message: string): void {
  if (statusTimer) window.clearTimeout(statusTimer);
  statusEl.textContent = message;
  statusEl.hidden = false;
  statusTimer = window.setTimeout(() => {
    statusEl.hidden = true;
  }, STATUS_TIMEOUT_MS);
}

function saveSettingsWithStatus(settings: Settings, statusEl: HTMLElement): void {
  void storage.saveSettings(settings).then(() => {
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

function localizeAppTitle(): void {
  const appName = chrome.i18n.getMessage('appName');
  document.title = appName;

  const appTitle = document.getElementById('app-title');
  if (appTitle) appTitle.textContent = appName;

  const appDescription = document.getElementById('app-description');
  if (appDescription) appDescription.textContent = chrome.i18n.getMessage('extDesc');
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

async function getActiveTab(): Promise<chrome.tabs.Tab | undefined> {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab;
}

async function getCurrentDomain(): Promise<string> {
  const tab = await getActiveTab();
  if (tab?.url) {
    try {
      return new URL(tab.url).hostname;
    } catch {
      return '';
    }
  }
  return '';
}

async function createUI(settings: Settings, initialStatusMessage = ''): Promise<void> {
  const app = document.getElementById('app');
  if (!app) return;
  localizeAppTitle();
  app.innerHTML = '';
  app.className = '';
  app.removeAttribute('role');
  app.setAttribute('aria-busy', 'false');

  const premiumStatus = await getPremiumStatus();
  const presets = await storage.loadPresets();
  const domain = await getCurrentDomain();
  const autoApplySites = await storage.loadAutoApplySites();
  const uiLocale = getUiLocale();

  const container = document.createElement('div');
  container.className = 'popup-panel';

  // Premium Banner
  const premiumBanner = document.createElement('div');
  premiumBanner.className = 'banner';
  premiumBanner.setAttribute('role', premiumStatus.trialExpired ? 'alert' : 'note');
  if (premiumStatus.trialExpired) {
    premiumBanner.classList.add('banner--danger');
    const upgradeLabel = chrome.i18n.getMessage('upgradePremium', [formatCurrency(PREMIUM_PRICE_USD, 'USD', uiLocale)]);
    const upgradeLink = document.createElement('a');
    upgradeLink.href = 'https://checkout.stripe.com/pay/font-fit-premium';
    upgradeLink.target = '_blank';
    upgradeLink.rel = 'noopener noreferrer';
    upgradeLink.textContent = upgradeLabel;
    upgradeLink.setAttribute('aria-label', chrome.i18n.getMessage('upgradePremiumNewTab', [upgradeLabel]));
    premiumBanner.append(
      document.createTextNode(chrome.i18n.getMessage('trialExpired')),
      document.createElement('br'),
      upgradeLink
    );
  } else if (premiumStatus.isTrialing) {
    premiumBanner.classList.add('banner--info');
    const trialMessageKey = premiumStatus.daysLeft === 1 ? 'premiumTrialOne' : 'premiumTrialOther';
    premiumBanner.textContent = chrome.i18n.getMessage(trialMessageKey, [
      formatInteger(premiumStatus.daysLeft, uiLocale),
      formatShortDate(premiumStatus.trialEndsAt, uiLocale)
    ]);
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

  if (shouldShowInitialOnboardingGuide(settings, presets, autoApplySites)) {
    const onboardingTip = document.createElement('p');
    onboardingTip.className = 'onboarding-tip';
    onboardingTip.setAttribute('role', 'note');
    onboardingTip.textContent = chrome.i18n.getMessage('onboardingTip');
    container.appendChild(onboardingTip);
  }

  // Readability Settings
  const settingsSection = document.createElement('section');
  settingsSection.className = 'section';
  const settingsTitle = createSectionTitle(chrome.i18n.getMessage('readingSettings'));
  const settingsHelp = createSectionDescription(chrome.i18n.getMessage('readingSettingsHelp'), 'reading-settings-help');
  settingsSection.setAttribute('aria-labelledby', settingsTitle.id);
  settingsSection.setAttribute('aria-describedby', settingsHelp.id);
  settingsSection.append(settingsTitle, settingsHelp);

  settingsSection.appendChild(createSelectSetting({
    idPrefix: 'font-family',
    label: chrome.i18n.getMessage('fontFamily'),
    options: [
      { name: chrome.i18n.getMessage('fontUD'), value: FONT_STACKS.UD_GOTHIC },
      { name: chrome.i18n.getMessage('fontSans'), value: FONT_STACKS.SANS_SERIF },
      { name: chrome.i18n.getMessage('fontSerif'), value: FONT_STACKS.SERIF }
    ] satisfies readonly SelectOption<FontFamily>[],
    selectedValue: settings.fontFamily,
    onChange: (value) => {
      settings.fontFamily = value;
      saveSettingsWithStatus(settings, statusEl);
    }
  }));

  // Sliders
  settingsSection.appendChild(createSliderSetting(chrome.i18n.getMessage('fontSize'), 0.8, 3.0, 0.1, settings.fontSize, uiLocale, (val) => {
    settings.fontSize = val;
    saveSettingsWithStatus(settings, statusEl);
  }));
  settingsSection.appendChild(createSliderSetting(chrome.i18n.getMessage('lineHeight'), 1.0, 3.0, 0.1, settings.lineHeight, uiLocale, (val) => {
    settings.lineHeight = val;
    saveSettingsWithStatus(settings, statusEl);
  }));
  settingsSection.appendChild(createSliderSetting(chrome.i18n.getMessage('letterSpacing'), 0, 0.5, 0.01, settings.letterSpacing, uiLocale, (val) => {
    settings.letterSpacing = val;
    saveSettingsWithStatus(settings, statusEl);
  }));

  // Background Color & Max Width
  const row2 = document.createElement('div');
  row2.className = 'form-row';

  const bgCol = createSelectSetting({
    idPrefix: 'background-color',
    label: chrome.i18n.getMessage('bgColor'),
    options: [
      { name: chrome.i18n.getMessage('bgWhite'), value: BACKGROUND_COLORS.WHITE },
      { name: chrome.i18n.getMessage('bgCream'), value: BACKGROUND_COLORS.CREAM },
      { name: chrome.i18n.getMessage('bgDark'), value: BACKGROUND_COLORS.DARK }
    ] satisfies readonly SelectOption<BackgroundColor>[],
    selectedValue: settings.backgroundColor,
    onChange: (value) => {
      settings.backgroundColor = value;
      saveSettingsWithStatus(settings, statusEl);
    }
  });
  row2.appendChild(bgCol);

  const widthCol = createSelectSetting({
    idPrefix: 'max-width',
    label: chrome.i18n.getMessage('maxWidth'),
    options: [
      { name: chrome.i18n.getMessage('pixelValue', [formatInteger(640, uiLocale)]), value: MAX_WIDTHS.NARROW },
      { name: chrome.i18n.getMessage('pixelValue', [formatInteger(760, uiLocale)]), value: MAX_WIDTHS.DEFAULT },
      { name: chrome.i18n.getMessage('widthFull'), value: MAX_WIDTHS.FULL }
    ] satisfies readonly SelectOption<MaxWidth>[],
    selectedValue: settings.maxWidth,
    onChange: (value) => {
      settings.maxWidth = value;
      saveSettingsWithStatus(settings, statusEl);
    }
  });
  row2.appendChild(widthCol);
  settingsSection.appendChild(row2);
  container.appendChild(settingsSection);

  // Presets Section
  const presetContainer = document.createElement('div');
  presetContainer.className = 'section';
  const presetTitle = createSectionTitle(chrome.i18n.getMessage('presets'));
  const presetHelp = createSectionDescription(chrome.i18n.getMessage('presetsHelp'), 'presets-help');
  presetContainer.setAttribute('role', 'group');
  presetContainer.setAttribute('aria-labelledby', presetTitle.id);
  presetContainer.setAttribute('aria-describedby', presetHelp.id);
  presetContainer.append(presetTitle, presetHelp);

  const presetList = document.createElement('div');
  presetList.className = 'preset-list';
  presetList.setAttribute('role', 'group');
  presetList.setAttribute('aria-label', chrome.i18n.getMessage('presetList'));
  let emptyPresetStateId: string | undefined;

  if (presets.length === 0) {
    emptyPresetStateId = createControlId('empty-presets');
    const emptyState = document.createElement('div');
    emptyState.id = emptyPresetStateId;
    emptyState.className = 'empty-state';
    emptyState.setAttribute('role', 'note');

    const emptyStateTitle = document.createElement('strong');
    emptyStateTitle.className = 'empty-state__title';
    emptyStateTitle.textContent = chrome.i18n.getMessage('noPresetsTitle');

    const emptyStateBody = document.createElement('span');
    emptyStateBody.className = 'empty-state__body';
    emptyStateBody.textContent = chrome.i18n.getMessage('noPresetsDescription');

    const emptyStateAction = document.createElement('span');
    emptyStateAction.className = 'empty-state__action';
    emptyStateAction.textContent = chrome.i18n.getMessage('noPresetsAction');

    emptyState.append(emptyStateTitle, emptyStateBody, emptyStateAction);
    presetList.appendChild(emptyState);
  }

  presets.forEach((p) => {
    const pBtn = document.createElement('button');
    pBtn.type = 'button';
    pBtn.textContent = p.name;
    pBtn.className = 'secondary compact';
    pBtn.setAttribute('aria-label', chrome.i18n.getMessage('loadPresetAriaLabel', [p.name]));
    pBtn.addEventListener('click', async () => {
      Object.assign(settings, p.settings);
      await storage.saveSettings(settings);
      await createUI(settings, chrome.i18n.getMessage('savedStatus'));
    });
    presetList.appendChild(pBtn);
  });
  presetContainer.appendChild(presetList);

  const savePresetBtn = document.createElement('button');
  savePresetBtn.type = 'button';
  savePresetBtn.textContent = chrome.i18n.getMessage('save');
  savePresetBtn.className = 'compact';
  savePresetBtn.setAttribute('aria-label', chrome.i18n.getMessage('savePresetAriaLabel'));
  const isSavePresetLimitReached = !premiumStatus.isPremium && presets.length >= FREE_PRESET_LIMIT;
  let presetLimitNoteId: string | undefined;
  if (isSavePresetLimitReached) {
    const morePresetsMessage = chrome.i18n.getMessage('premiumForMorePresets', [formatInteger(FREE_PRESET_LIMIT + 1, uiLocale)]);
    const presetLimitNote = createVisuallyHiddenText(morePresetsMessage, 'preset-limit-note');
    presetLimitNoteId = presetLimitNote.id;
    presetContainer.appendChild(presetLimitNote);
    savePresetBtn.setAttribute('aria-disabled', 'true');
    savePresetBtn.title = morePresetsMessage;
  }
  setDescribedBy(savePresetBtn, emptyPresetStateId, presetLimitNoteId);
  savePresetBtn.addEventListener('click', async (event) => {
    if (isSavePresetLimitReached) {
      event.preventDefault();
      return;
    }

    const presetNumber = formatInteger(presets.length + 1, uiLocale);
    const name = prompt(chrome.i18n.getMessage('presetNamePrompt'), chrome.i18n.getMessage('defaultPresetName', [presetNumber]));
    if (name) {
      presets.push({ name, settings: { ...settings } });
      await storage.savePresets(presets);
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
      const premiumOnlyNote = createVisuallyHiddenText(chrome.i18n.getMessage('premiumOnly'), 'premium-only-note');
      setDescribedBy(aaCheck, premiumOnlyNote.id);
      aaRow.appendChild(premiumOnlyNote);
    }
    aaCheck.addEventListener('change', async () => {
      let sites = await storage.loadAutoApplySites();
      if (aaCheck.checked) {
        if (!sites.includes(domain)) sites.push(domain);
      } else {
        sites = sites.filter((site) => site !== domain);
      }
      await storage.saveAutoApplySites(sites);
      showStatus(statusEl, chrome.i18n.getMessage('savedStatus'));
    });
    aaLabel.prepend(aaCheck);
    aaRow.appendChild(aaLabel);
    container.appendChild(aaRow);
  }

  // Action Buttons
  const btnRow = document.createElement('div');
  btnRow.className = 'button-row';
  btnRow.setAttribute('role', 'group');
  btnRow.setAttribute('aria-label', chrome.i18n.getMessage('pageActions'));

  const applyBtn = document.createElement('button');
  applyBtn.type = 'button';
  applyBtn.textContent = chrome.i18n.getMessage('apply');
  applyBtn.addEventListener('click', async () => {
    const tab = await getActiveTab();
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
    const tab = await getActiveTab();
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

function createVisuallyHiddenText(text: string, idPrefix: string): HTMLSpanElement {
  const note = document.createElement('span');
  note.id = createControlId(idPrefix);
  note.className = 'visually-hidden';
  note.textContent = text;
  return note;
}

function setDescribedBy(el: HTMLElement, ...ids: Array<string | undefined>): void {
  const describedBy = ids.filter((id): id is string => Boolean(id));
  if (describedBy.length > 0) el.setAttribute('aria-describedby', describedBy.join(' '));
}

function appendSelectOptions<Value extends string>(
  select: HTMLSelectElement,
  options: readonly SelectOption<Value>[],
  selectedValue: Value
): void {
  for (const option of options) {
    const el = document.createElement('option');
    el.value = option.value;
    el.textContent = option.name;
    if (option.value === selectedValue) el.selected = true;
    select.appendChild(el);
  }
}

function createSelectSetting<Value extends string>({
  idPrefix,
  label,
  options,
  selectedValue,
  onChange
}: SelectSettingConfig<Value>): HTMLDivElement {
  const wrapper = document.createElement('div');
  wrapper.className = 'setting-group';

  const select = document.createElement('select');
  select.id = createControlId(idPrefix);
  wrapper.appendChild(createLabel(label, select.id));
  appendSelectOptions(select, options, selectedValue);
  select.addEventListener('change', () => {
    const selectedOption = options.find((option) => option.value === select.value);
    if (selectedOption) onChange(selectedOption.value);
  });
  wrapper.appendChild(select);

  return wrapper;
}

function createSectionTitle(text: string): HTMLHeadingElement {
  const title = document.createElement('h2');
  title.id = createControlId('section-title');
  title.className = 'section-title';
  title.textContent = text;
  return title;
}

function createSectionDescription(text: string, idPrefix: string): HTMLParagraphElement {
  const description = document.createElement('p');
  description.id = createControlId(idPrefix);
  description.className = 'section-description';
  description.textContent = text;
  return description;
}

function createSliderSetting(label: string, min: number, max: number, step: number, value: number, locale: string, onChange: (val: number) => void): HTMLElement {
  const wrapper = document.createElement('div');
  wrapper.className = 'setting-group';
  const row = document.createElement('div');
  row.className = 'slider-row';
  const formatSliderValue = (sliderValue: number): string => formatFixedDecimal(sliderValue, locale, fractionDigitsForStep(step));

  const slider = document.createElement('input');
  slider.id = createControlId('slider');
  slider.type = 'range';
  slider.min = min.toString();
  slider.max = max.toString();
  slider.step = step.toString();
  slider.value = value.toString();
  slider.setAttribute('aria-valuetext', formatSliderValue(value));
  wrapper.appendChild(createLabel(label, slider.id));

  const valDisp = document.createElement('output');
  valDisp.id = createControlId('slider-value');
  valDisp.htmlFor.add(slider.id);
  valDisp.textContent = formatSliderValue(value);
  valDisp.className = 'value-pill';
  setDescribedBy(slider, valDisp.id);

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
  localizeAppTitle();
  if (app) {
    app.textContent = chrome.i18n.getMessage('loading');
    app.setAttribute('aria-busy', 'true');
  }

  const settings = await storage.loadSettings();
  const premiumStatus = await getPremiumStatus();
  const domain = await getCurrentDomain();
  const autoApplySites = await storage.loadAutoApplySites();

  await createUI(settings);

  // Auto-apply logic
  if (premiumStatus.isPremium && domain && autoApplySites.includes(domain)) {
    const tab = await getActiveTab();
    if (tab?.id) {
      void chrome.scripting.executeScript({ target: { tabId: tab.id }, func: applyStyle, args: [settings] });
    }
  }
});

