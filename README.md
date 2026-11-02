# Skills

Skills propias para Claude Code, de distintos temas y usos. Cada carpeta de primer nivel con un `SKILL.md` es una skill independiente.

## Instalar / actualizar
```bash
git clone git@github.com:iansolari/skills.git ~/dev/Skills
~/dev/Skills/install.sh                # enlaza todas las skills en ~/.claude/skills
~/dev/Skills/install.sh <skill> ...    # o solo algunas
~/dev/Skills/install.sh --list         # ver las disponibles
git -C ~/dev/Skills pull               # actualizar (los enlaces ya apuntan al repo)
```
En Windows corré el instalador desde Git Bash: crea junctions, no copias.

## Skills
| Skill | Qué hace | Setup extra |
|---|---|---|
| `resumen-diario` | Cierre del día: resumen de tareas de todos los repos/sesiones para flocklabs.ar/backoffice, tiempo repartido a 7h | `resumen-diario/setup.sh` (requiere Node ≥ 18 y git) |

## Agregar una skill nueva
Crear `<nombre>/SKILL.md` (con `name` y `description` en el frontmatter), sumarla a la tabla y correr `./install.sh`. Si necesita configuración propia, va en `<nombre>/setup.sh`: el instalador la avisa pero nunca la ejecuta.
