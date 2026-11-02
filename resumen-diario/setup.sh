#!/usr/bin/env bash
# Setup propio de resumen-diario: config y automatización (no instala la skill; eso lo hace ../install.sh)
set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"
[ -f ~/.claude/daily-summary.json ] || cp "$HERE/daily-summary.example.json" ~/.claude/daily-summary.json
chmod +x "$HERE/run-daily.sh"
echo "Editá ~/.claude/daily-summary.json (roots y topic_labels)."
echo "Para automatizar a las 18:30 (lun-vie), apuntando al script del repo (se actualiza con git pull):"
case "$(uname -s)" in
  MINGW*|MSYS*|CYGWIN*)
    echo "  (Windows, sin probar) schtasks /Create /TN ResumenDiario /SC WEEKLY /D MON,TUE,WED,THU,FRI /ST 18:30 /TR \"bash.exe -lc '$HERE/run-daily.sh'\""
    ;;
  *)
    echo "  (crontab -l 2>/dev/null; echo '30 18 * * 1-5 $HERE/run-daily.sh') | crontab -"
    ;;
esac
