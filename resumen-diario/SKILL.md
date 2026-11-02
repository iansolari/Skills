---
name: resumen-diario
model: sonnet
description: Cierre del día. Recorre todos los repos locales y las sesiones de Claude Code del día (o de la fecha indicada), y arma el resumen de tareas para cargar en flocklabs.ar/backoffice?section=tasks, con título "[tarea] - [topico]", descripción no técnica y tiempo repartido hasta sumar 7h. Usar cuando pidan "resumen del día", "cargar mis tareas", "cierre diario" o similar.
---

# Resumen diario multirepo

Genera las tareas del día para el backoffice de Flock Labs. Por defecto es **hoy** (zona America/Argentina/Buenos_Aires); si el usuario aclara otra fecha o rango, usarlo (`--date YYYY-MM-DD`, una corrida por día).

## Pasos

1. **Recolectar** (determinístico, no inventar nada que no esté acá):
   ```bash
   node ~/.claude/skills/resumen-diario/scripts/collect.mjs [--date YYYY-MM-DD]
   ```
   Requiere solo Node >= 18 y git. Lee `~/.claude/daily-summary.json` (roots, autores, labels, exclusiones) e imprime el JSON por stdout, sin crear archivos. Contiene por repo: commits del día (todas las ramas, sin merges), archivos tocados, cambios sin commitear; y por sesión de Claude Code: prompts del usuario y horario.
   Si `repos` y `sessions` vienen vacíos, decirlo y no inventar tareas.

2. **Entender el trabajo**: cruzar commits con los prompts de las sesiones del mismo proyecto/cwd. Los prompts explican el *para qué*; los commits, el *qué*. Si algo es ambiguo, mirar el diff con `git -C <repo> show <sha> --stat` o `git diff`, pero no hace falta ser exhaustivo.

3. **Agrupar en tareas** (atomización):
   - Una tarea = un tema grande y coherente. **Máximo 2 tareas por repo, excepcionalmente 3**; muchas veces alcanza con 1.
   - Dos temas muy distintos en un mismo repo → dos tareas (ej. "Corrección de flujos de búsqueda" y "Cambios en la UI de candidatos", ambas de Agora Backoffice). Los detalles chicos van como subtareas dentro de la descripción, no como tareas aparte.
   - Trabajo de sesiones sin repo (investigación, diseño, presentaciones) cuenta como tarea propia si fue relevante.
   - Ignorar ruido: formateo, bumps de dependencias, merges, commits de "wip" sin contenido, sesiones de pocos minutos sin resultado.

4. **Redactar cada tarea** con estos campos:
   - `summary`: resumen corto de la tarea (ej. "Corrección de flujos de búsqueda").
   - `topic`: label de tópico (ej. "Agora Backoffice"). Usar `topic_labels` de la config; si el repo no está mapeado, inferirlo del nombre del repo en formato legible y avisar para que lo agreguen a la config.
   - `description`: detalle de lo realizado, **no 100% técnico y no muy extenso**. **Prosa por defecto**: uno o dos párrafos cortos. Usar viñetas solo cuando haya de verdad varios ítems separados que se leen mejor como lista (3 o más cosas distintas e independientes); no listar por costumbre ni partir en viñetas lo que se explica bien en una oración. Nunca mezclar un párrafo con viñetas que repiten lo mismo. Hablar del **trabajo en sí** (qué se resolvió/construyó/mejoró y para qué), **nunca** de commits, PRs, merges, ramas ni hashes. Tono neutro, en español, en pasado.
   - `weight`: número relativo de esfuerzo (el que más tiempo llevó o fue más costoso pesa más). No son horas reales.

5. **Renderizar**: pasar las tareas por stdin a `render.mjs`, que reparte exactamente 7h (420 min) en bloques de 15 min según los pesos. **No se guarda ningún archivo** (ni `.md` ni `.json`, ni temporales): el resultado vive solo en el chat.
   ```bash
   node ~/.claude/skills/resumen-diario/scripts/render.mjs <<'EOF'
   {"date": "2026-11-02", "tasks": [
     {"summary": "...", "topic": "...", "description": "...", "weight": 5}
   ]}
   EOF
   ```

6. **Presentar en el chat** el resultado de `render.mjs`, tarea por tarea, con título, tiempo y descripción, y el total al final. Es la única salida: no escribir el resumen en archivos. No reescribir los tiempos a mano: sumar siempre 7h.

## Formato de salida por tarea

```
## [resumen de tarea] - [Tópico]
**Tiempo:** 2h 30m

[Descripción: prosa corta; viñetas solo si hay varios ítems realmente separados]
```

## Publicación

Por ahora **no se publica automáticamente**: el resultado se muestra en el chat para copiar en https://www.flocklabs.ar/backoffice?section=tasks. Si más adelante el backoffice expone una API o se decide automatizar el formulario, agregar un paso 7 que use las tareas ya calculadas (`title`, `description`, `minutes`; `render.mjs --save DIR` las guarda en JSON si hiciera falta).
