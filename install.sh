#!/usr/bin/env bash
# Enlaza cada skill del repo (carpeta de primer nivel con SKILL.md) en ~/.claude/skills.
# Con `git pull` las skills se actualizan solas porque los enlaces apuntan al repo.
#
# Uso:
#   ./install.sh                 instala todas las skills
#   ./install.sh a b             instala solo las skills a y b
#   ./install.sh --list          lista las skills disponibles
#
# En Windows (Git Bash) usa junctions: `ln -s` copiaría la carpeta en silencio.
set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"
DEST="$HOME/.claude/skills"

case "$(uname -s)" in MINGW*|MSYS*|CYGWIN*) WIN=1 ;; *) WIN=0 ;; esac

all_skills() {
  local d
  for d in "$HERE"/*/; do
    if [ -f "${d}SKILL.md" ]; then basename "$d"; fi
  done
}

is_link() {
  if [ "$WIN" = 1 ]; then
    [ -n "$(powershell.exe -NoProfile -Command "(Get-Item -LiteralPath '$(cygpath -w "$1")' -Force).LinkType" | tr -d '\r')" ]
  else
    [ -L "$1" ]
  fi
}

make_link() { # $1 = carpeta real, $2 = ruta del enlace
  if [ "$WIN" = 1 ]; then
    cmd.exe //c mklink //J "$(cygpath -w "$2")" "$(cygpath -w "$1")" >/dev/null
  else
    ln -s "$1" "$2"
  fi
}

remove_link() { # nunca borra el contenido: rmdir sobre una junction quita solo el enlace
  if [ "$WIN" = 1 ]; then cmd.exe //c rmdir "$(cygpath -w "$1")"; else rm "$1"; fi
}

if [ "${1:-}" = "--list" ]; then all_skills; exit 0; fi

skills=()
if [ $# -gt 0 ]; then
  skills=("$@")
else
  while IFS= read -r s; do skills+=("$s"); done < <(all_skills)
fi

mkdir -p "$DEST"
fail=0
for name in "${skills[@]}"; do
  case "$name" in */*|.*) echo "✘ $name: nombre inválido"; fail=1; continue ;; esac
  src="$HERE/$name"; link="$DEST/$name"
  if [ ! -f "$src/SKILL.md" ]; then
    echo "✘ $name: no es una skill (falta $name/SKILL.md)"; fail=1; continue
  fi
  if [ -e "$link" ] || [ -L "$link" ]; then
    if is_link "$link"; then
      remove_link "$link"
    else
      echo "✘ $name: ya existe en $DEST y no es un enlace (renombralo o borralo a mano)"; fail=1; continue
    fi
  fi
  make_link "$src" "$link"
  if ! is_link "$link"; then echo "✘ $name: no se pudo crear el enlace"; fail=1; continue; fi
  echo "✔ $name"
  if [ -x "$src/setup.sh" ]; then echo "  (setup extra, correr a mano: $src/setup.sh)"; fi
done
exit $fail
