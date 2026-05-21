# font-fit (もじ、ふわっと) 仕様書 v1_0

## ゴール
今見ているWebページの本文を、ワンクリックで読みやすいタイポグラフィに整えるChrome拡張。
ディスレクシア・視覚過敏・発達特性児・高齢者・疲れ目の人向け。

## 絶対制約
- 外部API・ネットワーク通信は一切しない。完全オフライン。
- 個人情報を収集しない。設定は chrome.storage.local のみ。
- 権限は activeTab / scripting / storage のみ。host_permissions は追加しない。
- Manifest V3 / TypeScript / Vite。

## 機能
1. ツールバーアイコンクリック→popupで設定。「適用」で現在タブ本文にスタイル注入(scripting.executeScript)。
2. 調整項目: フォント(UDゴシック等のwebセーフ代替/sans-serif/serif), 文字サイズ倍率, 行間, 文字間, 背景色(白/クリーム/ダークグレー), 本文最大幅。
3. 「元に戻す」で解除。
4. 設定は storage.local に保存し次回も再現。
5. 無料で全機能の基本動作。Premium($3 買い切り, Stripe Checkout)はプリセット保存3つ以上・サイト別自動適用を解放(7日トライアル)。

## 触ってはいけない
- manifest の permissions を増やさない。
- 外部スクリプト/フォントCDNを読み込まない(同梱フォントスタックのみ)。

## 完了条件
- npm run build 成功 / dist 生成。
- _locales ja/en 完備。icons 16/48/128。
- popupで全調整項目が動き、適用/解除がページに反映。
- release/font-fit.zip 生成。
