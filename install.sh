#!/usr/bin/env bash
# Enlaza (symlink) cada skill de este repo en ~/.claude/skills. Con `git pull` se actualizan solas.
set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"
mkdir -p ~/.claude/skills
for d in "$HERE"/skills/*/; do
  [ -f "$d/SKILL.md" ] || continue
  name="$(basename "$d")"
  ln -sfn "${d%/}" ~/.claude/skills/"$name"
  echo "✔ $name"
  [ -x "$d/setup.sh" ] && echo "  (tiene setup extra: $d/setup.sh)"
done
