/**
 * content.ts : ページ本文に可読性スタイルを適用/解除する。
 */

export { FONT_STACKS, type Settings } from './core/settings';

import type { Settings as FontFitSettings } from './core/settings';

const STYLE_ID = 'font-fit-style';
const ACTIVE_CLASS = 'font-fit-active';
const MAIN_CONTENT_SELECTORS = [
  'article',
  'main',
  '[role="main"]',
  '.main',
  '#main',
  '.content',
  '#content',
  '.post-content',
  '.article-body'
] as const;

/**
 * 本文要素を検出してスタイルを注入する
 */
export function applyStyle(settings: FontFitSettings): void {
  // 本文と思われる要素を探す
  const findMainElement = (): HTMLElement => {
    for (const selector of MAIN_CONTENT_SELECTORS) {
      const el = document.querySelector(selector);
      if (el instanceof HTMLElement) return el;
    }
    return document.body;
  };

  // 既存のスタイルとクラスをクリア
  const existingStyle = document.getElementById(STYLE_ID);
  if (existingStyle) existingStyle.remove();
  const existingElements = document.querySelectorAll(`.${ACTIVE_CLASS}`);
  existingElements.forEach(el => el.classList.remove(ACTIVE_CLASS));

  // 新しいスタイルを作成
  const style = document.createElement('style');
  style.id = STYLE_ID;
  
  // 文字色を背景色に合わせて簡易的に調整
  const isDark = settings.backgroundColor === '#333333';
  const textColor = isDark ? '#eeeeee' : '#333333';

  style.textContent = `
    .${ACTIVE_CLASS} {
      font-family: ${settings.fontFamily} !important;
      font-size: ${settings.fontSize}rem !important;
      line-height: ${settings.lineHeight} !important;
      letter-spacing: ${settings.letterSpacing}em !important;
      background-color: ${settings.backgroundColor} !important;
      color: ${textColor} !important;
      max-width: ${settings.maxWidth} !important;
      margin-left: auto !important;
      margin-right: auto !important;
      padding: 2rem 1.5rem !important;
      box-sizing: border-box !important;
      display: block !important;
      word-break: break-word !important;
    }
    /* 本文内の基本要素にも継承を促す */
    .${ACTIVE_CLASS} p, 
    .${ACTIVE_CLASS} li, 
    .${ACTIVE_CLASS} div {
      font-family: inherit !important;
      line-height: inherit !important;
      color: inherit !important;
    }
  `;
  document.head.appendChild(style);

  // クラスを適用
  const mainEl = findMainElement();
  mainEl.classList.add(ACTIVE_CLASS);
  
  // 全体の背景色も調整（隙間が目立たないように）
  if (settings.backgroundColor !== '#ffffff' && settings.backgroundColor !== 'transparent') {
    document.body.style.backgroundColor = settings.backgroundColor;
  }
}

/**
 * スタイルを解除する
 */
export function removeStyle(): void {
  const style = document.getElementById(STYLE_ID);
  if (style) style.remove();
  
  const elements = document.querySelectorAll(`.${ACTIVE_CLASS}`);
  elements.forEach(el => el.classList.remove(ACTIVE_CLASS));
  
  document.body.style.backgroundColor = '';
}
