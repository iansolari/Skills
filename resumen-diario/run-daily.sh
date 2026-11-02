#!/usr/bin/env bash
# Cierre diario automático. Lo dispara cron/launchd. Genera el borrador en ~/.claude/daily-summaries/
set -euo pipefail
export PATH="$HOME/.local/bin:/usr/local/bin:/opt/homebrew/bin:$PATH"
LOG="$HOME/.claude/daily-summaries/run.log"; mkdir -p "$(dirname "$LOG")"
# Salta fines de semana
[ "$(date +%u)" -ge 6 ] && exit 0
# Modelo configurable: SUMMARY_MODEL=haiku para el más barato (default: sonnet)
claude -p "/resumen-diario" \
  --model "${SUMMARY_MODEL:-sonnet}" \
  --allowedTools "Bash(python3:*) Bash(git:*) Read Write" \
  >> "$LOG" 2>&1
# Aviso (macOS) cuando está listo
command -v osascript >/dev/null && osascript -e 'display notification "Borrador listo en ~/.claude/daily-summaries" with title "Resumen diario"' || true
