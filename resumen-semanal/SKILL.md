---
name: resumen-semanal
description: Crea en Codex Spaces una presentación semanal editable de 8 a 10 diapositivas a partir del recolector de resumen-diario, las tareas y avances del usuario en todos sus proyectos y capturas reales de los resultados. Usar para cierres semanales y presentaciones de seguimiento al líder o equipo.
---

# Resumen semanal de trabajo

Al generar la presentación, delegá en cuatro subagentes con responsabilidades distintas. Seguí el [flujo de agentes](references/agentes.md) para asignar cada etapa y pasar sus resultados. El agente principal coordina la ejecución y verifica la entrega final.

## Reuní los registros de la semana

- Aplicá las fechas que indique el usuario. Por defecto, tomá la semana de lunes a domingo en su zona horaria. Si está en curso, usá como corte el momento de ejecución. «La semana pasada» es la semana calendario anterior completa. Indicá el período y, si corresponde, el corte en la portada.
- Ejecutá el [recolector de resumen-diario](scripts/collect.mjs) una vez por cada fecha local del período, de la más antigua a la más reciente. Es la copia verificada de [iansolari/Skills](https://github.com/iansolari/Skills/blob/f10eeab8ded22fb221a4685e1e78deaba493a9c3/resumen-diario/scripts/collect.mjs). Usa Node 18 o posterior y Git. El cierre diario habitual deja el texto en el chat, así que reconstruí el intervalo desde la evidencia original.
- Si existe `~/.claude/daily-summary.json`, usalo para respetar las raíces, autores, etiquetas y exclusiones ya configurados. Como segunda opción, usá `references/daily-summary.local.json` si el usuario lo configuró. Si faltan los dos, usá [la configuración de ejemplo](references/daily-summary.example.json). El recolector usa el correo configurado en Git si la lista de autores está vacía. Si el JSON devuelve `authors` vacío, verificá la autoría antes de atribuir commits. Ajustá las raíces, los autores o la zona con los datos del usuario. Sustituí las rutas y la fecha en este comando. La salida JSON llega por stdout.

  ```sh
  GIT_OPTIONAL_LOCKS=0 node "<ruta-del-skill>/scripts/collect.mjs" --config "<ruta-a-la-configuración>" --date YYYY-MM-DD
  ```

- Cruzá `repos[].commits` y los archivos tocados con `sessions[]` para entender el alcance y el propósito. Los prompts describen intenciones. Verificá qué se concretó con el resultado del chat, un diff o un entregable accesible. `uncommitted_files` describe el estado actual del checkout y solo aporta contexto para el trabajo abierto. El reparto diario de 7 horas y la duración entre mensajes son estimaciones del flujo diario, no medidas de esfuerzo semanal.
- Completá los datos y las referencias con los chats y las fuentes del proyecto a las que tengas acceso. Incluí los cierres diarios que el usuario comparta. En Codex, buscá chats activos y archivados con `list_threads` en modo `history` y consultá los turnos relevantes con `read_thread`. Incluí chats anteriores que tuvieron actividad en el período. Si faltan datos, avanzá con lo verificable e indicá qué cobertura pudiste revisar.
- Consolidá las entradas por proyecto y entregable. Si un tema aparece varios días, mostrá su avance durante la semana y su estado al corte. Conservá una referencia verificable. Una asignación o una actualización ajena no acredita aporte propio. Identificá la contribución del usuario en los resultados del equipo.

## Conseguí evidencia visual de los avances

- Elegí los hitos que mejor se explican con una captura. Buscá primero imágenes ya adjuntas al registro diario o a los chats de trabajo. Si hace falta una toma nueva, abrí la pantalla, diseño, prototipo o vista previa del proyecto con la herramienta disponible. Usá la versión del período si se puede identificar y usá flujos de solo lectura o datos de prueba cuando corresponda.
- Mostrá el estado que acredita el avance, con una captura grande y legible por diapositiva. Usá un par antes/después solo cuando haya dos estados verificables y la comparación aclare el cambio. Recortá lo que distraiga y ocultá datos sensibles antes de subir la imagen a la presentación.
- Agregá un pie breve con lo que se ve y el estado pertinente, como prototipo, preview o producción. Guardá la referencia de la fuente, versión o fecha en notas o junto al pie. Si solo existe una vista posterior al período, usala únicamente si el cambio semanal sigue siendo verificable e indicá que es una vista actual.
- Para trabajo sin interfaz o sin una toma verificable, usá evidencia pertinente, como un entregable, una decisión documentada o un resultado de validación. El texto breve con su fuente alcanza cuando la imagen no agrega información. Usá capturas reales para mostrar avances visuales.

## Armá y verificá la presentación

- Entregá una presentación editable de 8 a 10 diapositivas en Codex Spaces. Seguí el skill de presentaciones y usá español con un tono de seguimiento para el líder o equipo, salvo que el usuario indique otra preferencia. Aplicá el [sistema de diseño del resumen semanal](references/diseno.md) y sus plantillas editables como estilo predeterminado.
- Una estructura de 9 diapositivas puede incluir portada con fechas, panorama de la semana, cuatro diapositivas de avances por proyecto o hito, resultados o decisiones, bloqueos o decisiones pendientes, y próximos pasos. Ajustá la cantidad de diapositivas de avance al material disponible. Agrupá proyectos con menos actividad y cubrí todos los que tengan trabajo verificable. Si hay poca actividad, usá 8 diapositivas con contexto pertinente y evitá repetir tareas.
- En cada diapositiva de avance explicá qué cambió y su estado al corte. Cuantificá el efecto cuando haya evidencia. Para los bloqueos, mostrá qué los destraba si se conoce. Para los próximos pasos, diferenciá los compromisos confirmados de las propuestas.
- Verificá la cantidad de diapositivas, la cobertura por proyecto, el respaldo de fechas y estados, y la legibilidad de las capturas. Comprobá que la presentación esté guardada en Spaces. Devolvé el enlace y explicá cualquier limitación relevante de fuentes o capturas.
