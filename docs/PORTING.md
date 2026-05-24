# Porting guide

font-fit を iOS / Android アプリへ移植するときの境界をまとめます。

## 基本方針

- `src/core` は純粋な TypeScript ロジックの置き場です。`chrome.*`、DOM、通信、プラットフォーム固有 API を参照しません。
- 保存処理は `src/storage` のアダプタ越しに行います。Chrome 拡張では `createChromeStorageAdapter()` を使い、アプリ版では同じ `FontFitStorage` IF を実装します。
- UI 層は表示、入力、プラットフォーム API 呼び出しに寄せ、設定の既定値や Premium 判定などの共通計算は `src/core` を使います。

## 保存データ形式

既存の保存キーと値の形は互換性維持の対象です。

- `settings`: `Settings`
- `presets`: `Preset[]`
- `autoApplySites`: `string[]`
- `is_premium`: `boolean`
- `trial_start_ts`: `number`

移植先のストレージでも、上記の意味を保ったまま `FontFitStorage` を実装してください。Chrome 拡張固有の `chrome.storage.local` へ直接依存するコードは `src/storage/chromeStorage.ts` に閉じ込めます。

## ストレージアダプタ

- `FontFitStorage` はアプリ全体が使う高レベル IF です。UI からはこの IF 経由で読み書きし、保存キーを直接扱いません。
- `FontFitStorageArea` は `get` / `set` だけを持つ低レベル IF です。Chrome 拡張では `chrome.storage.local` を渡し、iOS / Android では Keychain、SharedPreferences、SQLite などの保存先をこの形に合わせます。
- 保存キーは `STORAGE_KEYS` に集約しています。移植先でもキー名と値の形を変えず、既存データをそのまま読めるようにしてください。
- `src/core` は保存先を知りません。既定値の補完や Premium 判定などの純ロジックだけを置き、永続化は `src/storage` のアダプタで吸収します。

## 移植時の確認事項

- `src/core` に `chrome.*` が入っていないこと。
- Manifest V3 の権限 (`activeTab`, `scripting`, `storage`) と `host_permissions` なしの方針を変えないこと。
- 外部 API、remote code、eval、外部 CDN、外部フォントを追加しないこと。
- 既存の保存キーを変更せず、既存ユーザーの設定をそのまま読めること。
