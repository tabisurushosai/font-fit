// popup.ts : 設定UI(フォント/行間/文字間/背景色/最大幅)。Geminiが実装する。

import { Settings } from './content';

const defaultSettings: Settings = {
  fontFamily: 'sans-serif',
  fontSize: 1.2,
  lineHeight: 1.8,
  letterSpacing: 0.05,
  backgroundColor: '#ffffff',
  maxWidth: '760px'
};

async function loadSettings(): Promise<Settings> {
  const data = await chrome.storage.local.get('settings');
  return { ...defaultSettings, ...data.settings };
}

async function saveSettings(settings: Settings) {
  await chrome.storage.local.set({ settings });
}

function createUI(settings: Settings) {
  const app = document.getElementById('app');
  if (!app) return;
  app.innerHTML = '';

  const container = document.createElement('div');
  container.style.display = 'flex';
  container.style.flexDirection = 'column';
  container.style.gap = '12px';

  // Font Family
  const fontLabel = createLabel('フォント');
  const fontSelect = document.createElement('select');
  [
    { name: 'ゴシック (UD代替)', value: '"BIZ UDPGothic", "Hiragino Kaku Gothic ProN", "Meiryo", sans-serif' },
    { name: 'サンセリフ', value: 'sans-serif' },
    { name: 'セリフ', value: 'serif' }
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

  // Font Size
  container.appendChild(createSliderSetting('文字サイズ', 0.8, 3.0, 0.1, settings.fontSize, (val) => {
    settings.fontSize = val;
    saveSettings(settings);
  }));

  // Line Height
  container.appendChild(createSliderSetting('行間', 1.0, 3.0, 0.1, settings.lineHeight, (val) => {
    settings.lineHeight = val;
    saveSettings(settings);
  }));

  // Letter Spacing
  container.appendChild(createSliderSetting('文字間', 0, 0.5, 0.01, settings.letterSpacing, (val) => {
    settings.letterSpacing = val;
    saveSettings(settings);
  }));

  // Background Color
  const bgLabel = createLabel('背景色');
  const bgSelect = document.createElement('select');
  [
    { name: '白', value: '#ffffff' },
    { name: 'クリーム', value: '#fdf5e6' },
    { name: 'ダークグレー', value: '#333333' }
  ].forEach(opt => {
    const el = document.createElement('option');
    el.value = opt.value;
    el.textContent = opt.name;
    if (opt.value === settings.backgroundColor) el.selected = true;
    bgSelect.appendChild(el);
  });
  bgSelect.addEventListener('change', () => {
    settings.backgroundColor = bgSelect.value;
    saveSettings(settings);
  });
  container.appendChild(bgLabel);
  container.appendChild(bgSelect);

  // Max Width
  const widthLabel = createLabel('本文最大幅');
  const widthSelect = document.createElement('select');
  [
    { name: '640px', value: '640px' },
    { name: '760px', value: '760px' },
    { name: '全幅', value: 'none' }
  ].forEach(opt => {
    const el = document.createElement('option');
    el.value = opt.value;
    el.textContent = opt.name;
    if (opt.value === settings.maxWidth) el.selected = true;
    widthSelect.appendChild(el);
  });
  widthSelect.addEventListener('change', () => {
    settings.maxWidth = widthSelect.value;
    saveSettings(settings);
  });
  container.appendChild(widthLabel);
  container.appendChild(widthSelect);

  // Buttons
  const btnRow = document.createElement('div');
  btnRow.style.display = 'flex';
  btnRow.style.gap = '8px';
  btnRow.style.marginTop = '8px';

  const applyBtn = document.createElement('button');
  applyBtn.id = 'apply-btn';
  applyBtn.textContent = '適用';
  applyBtn.style.flex = '1';
  applyBtn.style.padding = '8px';
  
  const resetBtn = document.createElement('button');
  resetBtn.id = 'reset-btn';
  resetBtn.textContent = '元に戻す';
  resetBtn.style.flex = '1';
  resetBtn.style.padding = '8px';

  btnRow.appendChild(applyBtn);
  btnRow.appendChild(resetBtn);
  container.appendChild(btnRow);

  app.appendChild(container);
}

function createLabel(text: string): HTMLElement {
  const label = document.createElement('label');
  label.textContent = text;
  label.style.fontSize = '12px';
  label.style.fontWeight = 'bold';
  return label;
}

function createSliderSetting(label: string, min: number, max: number, step: number, value: number, onChange: (val: number) => void): HTMLElement {
  const wrapper = document.createElement('div');
  wrapper.style.display = 'flex';
  wrapper.style.flexDirection = 'column';
  
  const labelEl = createLabel(label);
  const sliderRow = document.createElement('div');
  sliderRow.style.display = 'flex';
  sliderRow.style.alignItems = 'center';
  sliderRow.style.gap = '8px';

  const slider = document.createElement('input');
  slider.type = 'range';
  slider.min = min.toString();
  slider.max = max.toString();
  slider.step = step.toString();
  slider.value = value.toString();
  slider.style.flex = '1';

  const valueDisplay = document.createElement('span');
  valueDisplay.textContent = value.toString();
  valueDisplay.style.fontSize = '12px';
  valueDisplay.style.minWidth = '30px';

  slider.addEventListener('input', () => {
    const val = parseFloat(slider.value);
    valueDisplay.textContent = val.toString();
    onChange(val);
  });

  sliderRow.appendChild(slider);
  sliderRow.appendChild(valueDisplay);
  wrapper.appendChild(labelEl);
  wrapper.appendChild(sliderRow);
  return wrapper;
}

document.addEventListener('DOMContentLoaded', async () => {
  const settings = await loadSettings();
  createUI(settings);
});
