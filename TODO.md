# font-fit TODO

- [x] T001: src/content.ts に、本文要素を検出してスタイル(フォント/サイズ/行間/文字間/背景/最大幅)を注入する applyStyle(settings) と removeStyle() を実装
- [x] T002: src/popup.ts に設定UI(各スライダー/セレクト)を実装し、変更を chrome.storage.local に保存
- [x] T003: popupの「適用」で chrome.scripting.executeScript により現在タブに content の applyStyle を実行、「元に戻す」で removeStyle
- [x] T004: storage.local から前回設定を読み込みpopupに反映、起動時に復元
- [x] T005: 同梱フォントスタック(UDゴシック代替→Hiragino/Meiryo/sans-serif)を定義、CDN不使用
- [x] T006: 背景色プリセット(白/クリーム/ダークグレー)と本文最大幅(640/760/全幅)を実装
- [x] T007: Premiumゲート(7日トライアル+Stripe Checkout URL生成)を storage.local の trial_start_ts で実装。無料は基本動作、Premiumでプリセット3+とサイト別自動適用
- [x] T008: _locales ja/en の文言を全UIに適用(chrome.i18n)
- [ ] T009: npm run build を通し、tsエラー/lint警告を解消
- [ ] T010: release/font-fit.zip を生成(manifest+icons+_locales+dist、node_modules除外)
- [ ] T011: legal/PRIVACY.md と TERMS.md を作成(外部通信なし・データ収集なしを明記)
