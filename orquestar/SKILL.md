---
name: orquestar
description: Trabajar en modo orquestador — la sesión principal (Opus) planifica y decide, y reparte la lectura, búsqueda, ejecución y verificación en subagentes baratos (Haiku/Sonnet: explorador, verificador, mecanico, ejecutor, navegador); después revisa y sintetiza. Usar cuando el usuario diga "orquestá esto", "usá subagentes", "modo orquestador", "que lo hagan agentes más baratos", "ahorrá tokens" o "que rinda el límite", o ante tareas con muchas piezas independientes (varios archivos o módulos, un lote de tickets, auditorías, búsquedas amplias).
---

# Orquestar con subagentes baratos

Vos (la sesión principal, el modelo caro) pensás y decidís; los workers baratos leen, buscan, ejecutan y reportan. El ahorro sale de dos lados: el modelo caro **no lee en crudo** lo que puede resumir uno barato, y el trabajo mecánico corre en Haiku/Sonnet (a precio API, Haiku 4.5 cuesta ~1/4 de Opus 5.5 y Sonnet 5 ~1/2).

Ojo: sin esta skill, los subagentes **no son baratos**. `Explore` y `general-purpose` heredan el modelo de la sesión (Opus). Por eso hay que usar los workers de abajo, que tienen su modelo fijado.

## 0. Primero: ¿conviene delegar?

Delegar tiene costo fijo: brief, arranque del subagente sin caché compartida, reporte y revisión. Solo paga cuando hay **volumen para repartir**. Medido por Anthropic: con trabajo en piezas independientes, o más grande que una ventana de contexto, el orquestador salió ~55% más barato. Con una cadena dependiente, o algo que entra en un solo contexto, **salió más caro** que el modelo caro solo con menos esfuerzo.

Delegá si se cumple al menos una:
- ≥3 piezas independientes (archivos, módulos, búsquedas, tickets, páginas).
- Lectura o búsqueda voluminosa de la que solo necesitás la conclusión, no el detalle.
- Trabajo mecánico bien especificado (renombres, cambios repetitivos, correr tests/build y resumir logs).

Hacelo vos directamente si:
- Es una sola cadena donde cada paso depende del anterior (debug fino, diseño).
- Son <3 archivos o poco trabajo.
- Necesitás el contexto intermedio para juzgar bien (ej. un diff sutil).
- Ya tenés en contexto lo que habría que leer.

Si no delegás, decilo en una línea ("lo hago directo: es una cadena dependiente") y seguí.

## 1. Planificar (vos)

Partí la tarea en unidades. Cada una lleva: objetivo, entradas (archivos/URLs), restricciones, criterio de "terminado" y formato de salida. Marcá dependencias; lo que no dependa de nada va en paralelo.

## 2. Rutear al worker más barato que lo resuelve

| Unidad | `subagent_type` | Modelo |
|---|---|---|
| Buscar/ubicar código, leer y resumir archivos, docs o páginas, inventarios | `explorador` | Haiku |
| Correr tests/lint/typecheck/build/scripts y resumir resultados o logs | `verificador` | Haiku |
| Cambios mecánicos exactos (renombres, reemplazos, boilerplate, textos) | `mecanico` | Haiku |
| Implementar un cambio acotado con spec clara, escribir tests, borradores de docs | `ejecutor` | Sonnet, effort medium |
| Leer o preparar cosas en el navegador (backoffices, deploys, formularios) | `navegador` | Sonnet, effort medium |
| Arquitectura, debug ambiguo, decisiones de producto, revisión de cambios riesgosos, síntesis | **vos** | Opus |

- Ante la duda entre Haiku y Sonnet, elegí Sonnet: un reintento cuesta más que la diferencia de precio.
- Si no existe el worker que necesitás, usá `general-purpose` **siempre con `model: "haiku"` o `model: "sonnet"`**. Sin `model`, corre en Opus.
- No uses `Explore` para ahorrar: corre en el modelo de la sesión.
- Para escalar sin cambiar de worker, pasá `model` en la invocación: pisa al del agente (ej. `mecanico` con `model: "sonnet"`).
- Navegador: uno a la vez (comparten el mismo panel de browser).

## 3. Escribir el brief (lo más importante)

El worker arranca **sin tu contexto**: no vio la conversación. Un brief flojo = trabajo repetido. Plantilla:

```
Objetivo: <una oración: qué y para qué>
Contexto mínimo: <repo/ruta, decisiones ya tomadas, lo que NO hay que tocar>
Entradas: <archivos, rutas, funciones, URLs exactas que ya conocés>
Hacé: <pasos concretos>
No hagas: <commits, push, deploy, borrar, tocar otros módulos, instalar paquetes, enviar/guardar formularios>
Terminado cuando: <criterio verificable: test X pasa, build ok, lista completa>
Devolvé (máx. 15 líneas): qué hiciste · archivos tocados · verificación y resultado · dudas o bloqueos.
```

Pasale lo que ya sabés (rutas exactas, nombres) para que no lo vuelva a buscar. Si una acción irreversible (guardar, enviar, publicar) está aprobada por el usuario en el chat, decilo explícitamente en el brief; si no, el worker se frena antes y reporta.

## 4. Despachar

- Unidades independientes: **todas en un mismo mensaje** (varias llamadas a Agent) para que corran en paralelo, en background.
- Si dos workers editan en paralelo archivos que se pisan, usá `isolation: "worktree"` o serializalos.
- Mientras corren, no dupliques su trabajo ni releas lo mismo: esperá la notificación.
- Lote muy grande (10+ unidades): proponé al usuario correrlo como workflow. No lo lances sin que lo pida.

## 5. Verificar barato y escalar

- Revisá sin releer todo: `git diff --stat`, el diff de los archivos clave y el reporte del `verificador`.
- Si falla: 1 reintento con el brief corregido (qué salió mal + pista concreta), subiendo un escalón (Haiku → Sonnet → Opus vía `model`). Si vuelve a fallar, lo hacés vos.
- Un "listo" sin evidencia (test que pasa, build ok, captura) no cuenta.

## 6. Cerrar

Síntesis corta para el usuario: qué se hizo, cómo se verificó y qué quedó pendiente. Una línea con el reparto (ej. "3 unidades a Haiku, 1 a Sonnet, revisión mía").

## Anti-patrones

- Delegar una tarea chica "por las dudas": pagás el costo fijo sin volumen.
- Pedirle al worker que "investigue y decida": las decisiones son tuyas; el worker ejecuta o informa.
- Releer vos los archivos que ya resumió el explorador.
- Aceptar reportes con archivos enteros o logs completos: pedí siempre el resumen acotado.
- Workers que coordinan entre ellos: la coordinación pasa por vos.
