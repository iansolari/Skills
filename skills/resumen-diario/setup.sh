#!/usr/bin/env bash
# Setup propio de resumen-diario: config y automatización (no instala la skill; eso lo hace ../../install.sh)
set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"
[ -f ~/.claude/daily-summary.json ] || cp "$HERE/daily-summary.example.json" ~/.claude/daily-summary.json
cp "$HERE/run-daily.sh" ~/.claude/run-daily-summary.sh && chmod +x ~/.claude/run-daily-summary.sh
echo "Editá ~/.claude/daily-summary.json (roots y topic_labels)."
echo "Para automatizar a las 18:30 (lun-vie):"
echo "  (crontab -l 2>/dev/null; echo '30 18 * * 1-5 $HOME/.claude/run-daily-summary.sh') | crontab -"
