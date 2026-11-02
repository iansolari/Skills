# skills

Mis skills personales para Claude Code. Cada carpeta en `skills/` es una skill (con su `SKILL.md`).

## Instalar / actualizar
```bash
git clone git@github.com:iansolari/skills.git ~/dev/skills
~/dev/skills/install.sh      # enlaza todas las skills en ~/.claude/skills
git -C ~/dev/skills pull     # actualizar (los enlaces ya apuntan al repo)
```

## Skills
| Skill | Qué hace | Setup extra |
|---|---|---|
| `resumen-diario` | Cierre del día: resumen de tareas de todos los repos/sesiones para flocklabs.ar/backoffice, tiempo repartido a 7h | `skills/resumen-diario/setup.sh` |

## Agregar una skill nueva
Crear `skills/<nombre>/SKILL.md` (con `name` y `description` en el frontmatter) y correr `./install.sh`.
