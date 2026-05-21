#!/bin/bash
cd "$HOME/Documents/font-fit" || exit 1
MAX=40; i=0
echo "===== font-fit Gemini自走 開始 $(date) ====="
while :; do
  i=$((i+1))
  if [ "$i" -gt "$MAX" ]; then echo "反復上限($MAX)到達。停止。"; break; fi
  REMAIN=$(grep -cE '^[[:space:]]*-[[:space:]]*\[ \]' TODO.md 2>/dev/null || echo 0)
  if [ "$REMAIN" -eq 0 ]; then echo "✅ 全タスク完了。自動停止。"; break; fi
  echo "[$i] 残 $REMAIN 件 → Gemini実行 $(date +%H:%M:%S)"
  gtimeout 900 gemini --yolo -p "$(cat GEMINI.md)" 2>&1 | tail -20 || echo "(このイテレーションでタイムアウト/エラー、次へ)"
done
echo "===== 終了 $(date) ====="
