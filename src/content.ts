/**
 * content.ts : ページ本文に可読性スタイルを適用/解除する。
 */

export interface Settings {
  fontFamily: string;
  fontSize: number;      // 倍率 (rem相当)
  lineHeight: number;    // 行間
  letterSpacing: number; // 文字間 (em)
  backgroundColor: string; // 背景色 (hex)
  maxWidth: string;      // 本文最大幅 (px or 'none')
}

/**
 * 本文要素を検出してスタイルを注入する
 */
export function applyStyle(settings: Settings) {
  const STYLE_ID = 'font-fit-style';
  const ACTIVE_CLASS = 'font-fit-active';

  // 本文と思われる要素を探す
  const findMainElement = (): HTMLElement => {
    const selectors = [
      'article', 
      'main', 
      '[role="main"]', 
      '.main', 
      '#main', 
      '.content', 
      '#content',
      '.post-content',
      '.article-body'
    ];
    for (const selector of selectors) {
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
export function removeStyle() {
  const STYLE_ID = 'font-fit-style';
  const ACTIVE_CLASS = 'font-fit-active';

  const style = document.getElementById(STYLE_ID);
  if (style) style.remove();
  
  const elements = document.querySelectorAll(`.${ACTIVE_CLASS}`);
  elements.forEach(el => el.classList.remove(ACTIVE_CLASS));
  
  document.body.style.backgroundColor = '';
}
