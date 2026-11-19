# Sistema de diseño del resumen semanal

Aplicá la paleta y el estilo gráfico de la segunda referencia. Combiná una base crema con halos difusos, tarjetas de color de tamaños distintos, cápsulas redondeadas y un gráfico abstracto en la portada. Conservá las capturas reales como evidencia de cada avance.

## Grilla y jerarquía

- Trabajá en un lienzo de 1280 × 720 px. Usá 12 columnas de 74 px, calles de 24 px y márgenes laterales de 64 px. El encabezado ocupa la franja superior. El contenido arranca a 208 px y termina a 656 px.
- Alineá título, tarjetas y contenido a la grilla. Usá 8 px para separar elementos relacionados, 24 px entre módulos y 28 px como margen interno de tarjeta. Usá un radio de 32 px en tarjetas y 24 px en marcos de captura.
- Usá **Judson Bold** en portada (90 px), titulares (52 px) y títulos de tarjeta (32–52 px). Usá **Zalando Sans SemiExpanded** en cifras (44–64 px), cápsulas y etiquetas (18–24 px). Usá **DM Sans Regular** en cuerpo (20–24 px), pies de captura (18 px) y aclaraciones del período (24 px). Si un título supera dos líneas, acortalo conservando la idea y revisá el render. [Judson](https://fonts.google.com/specimen/Judson) · [Zalando Sans SemiExpanded](https://fonts.google.com/specimen/Zalando+Sans+SemiExpanded) · [DM Sans](https://fonts.google.com/specimen/DM+Sans)
- Usá texto crema o lima sobre violeta. Usá tinta oscura sobre la base crema, el lima, el fucsia y el aqua. La portada lleva la mayor concentración de color. Las diapositivas de proyecto reservan un campo crema alrededor de la captura.

## Degradados

- **Fondo.** Usá una base diagonal de crema `#FFFCF5` a lila suave `#F6F1FC`. En las composiciones que llevan halos, poné uno o dos de aqua, lima o fucsia cerca de un borde o esquina, con el centro al 15–28 % de opacidad y una caída suave hasta transparente. La comparación usa la misma base suave para las dos capturas.
- **Superficies de color.** Usá una transición diagonal visible entre tonos cercanos. Los pares son violeta `#5142F5` a `#4031DF`, lima `#E1EF44` a `#F0F66A`, fucsia `#FF45CA` a `#FF68D8` y aqua `#36DCCB` a `#51E6D6`. En la galería, aplicá una transición equivalente a las cuatro versiones pastel. Reservá el degradado multicolor para el gráfico de portada.
- **Marcos y etiquetas.** El marco usa una transición suave de blanco `#FFFFFF` a lila casi blanco `#F5F2FC`. Las etiquetas, el texto y los bordes usan color sólido para que se lean con claridad.

[Vista de las plantillas](../assets/previews/plantillas.png) · [Galería de elementos gráficos](../assets/previews/elementos-graficos.png)

| Color | HEX | Función |
| --- | --- | --- |
| Crema | `#FFFCF5` | Fondo y texto principal sobre violeta |
| Blanco | `#FFFFFF` | Interior de marcos de captura |
| Tinta | `#171624` | Títulos, cuerpo y pies sobre fondos claros |
| Lila grisáceo | `#D6CFED` | Contorno de 1 px en marcos y etiquetas neutras |
| Violeta eléctrico | `#5142F5` | Portada, tarjeta protagonista y paneles de proyecto |
| Lima ácido | `#E1EF44` | Cápsulas de fechas y proyecto, estados «Entregado» o «Validado», decisión destacada |
| Fucsia | `#FF45CA` | Tarjeta de contraste, estado «Bloqueado» y gráfico de portada |
| Aqua | `#36DCCB` | Estado «Por decidir», tarjeta de apoyo y degradado de portada |

## Componentes

| Componente | Anatomía y regla de uso |
| --- | --- |
| Encabezado | Cápsula lima con el nombre del proyecto cuando corresponde, titular en Judson debajo y un motivo pequeño en el margen derecho según la plantilla. |
| Tarjeta de avance | Etiqueta opcional, título y una explicación de una o dos frases. Puede llevar un siguiente paso concreto si aporta contexto. |
| Tarjeta de resultado | Variante con cifra grande, unidad o título y contexto breve. Incluí la referencia de la cifra en las notas. La tarjeta también funciona con un resultado cualitativo. |
| Etiqueta de estado | Cápsula de 36 px de alto con estado escrito. Usá la variante neutra para otros estados legítimos. El estado de trabajo y el entorno de la captura se leen en sus respectivos componentes. |
| Marco de captura | Superficie blanca, contorno de 1 px y 12 px de margen interior. Mantené la proporción de la imagen. Recortá al área que demuestra el cambio si la interfaz se vería demasiado chica. El pie indica lo que se ve y, cuando corresponda, el entorno o la versión. |
| Tarjeta de decisión o próximo paso | Enunciado que se pueda resolver y una línea de contexto. Incluí el responsable, la dependencia o la fecha cuando estén confirmados. |
| Gráfico de portada | Flor abstracta de ocho pétalos, destello y órbita en módulos redondeados. Usá formas nativas de la presentación. |

## Elementos gráficos

El módulo de maquetación incluye cuatro elementos hechos con formas nativas de la presentación. La portada puede combinarlos. En las demás diapositivas, usá uno como máximo y ubicalo en el margen, separado de textos y capturas.

| Elemento | Uso habitual |
| --- | --- |
| Destello | Acompaña encabezados de proyecto y refuerza el contraste sobre lima en portada. |
| Flor | Es el motivo principal de portada. En tamaño chico puede acompañar el cierre. |
| Órbita | Anillo inclinado, núcleo y satélite. Puede acompañar avances técnicos o de investigación. |
| Cápsulas | Dos bandas cortas superpuestas en lima y fucsia. Acompañan el panorama de la semana. |

## Plantillas editables

| Plantilla | Composición | Cuándo elegirla |
| --- | --- | --- |
| `portada` | Bloque violeta de 7 columnas con título crema y fecha en cápsula lima, gráfico de color de 5 columnas a la derecha | Abrir el informe y ubicar la semana |
| `panorama` | Tarjeta protagonista de 7 columnas y hasta dos tarjetas de 5 columnas apiladas | Mostrar el resultado principal y los avances secundarios |
| `proyecto` | Panel violeta de 4 columnas y captura apaisada de 8 columnas | Explicar una funcionalidad con una captura grande |
| `movil` | Panel de texto de 7 columnas y un marco vertical de 3, centrado en las 5 restantes | Mostrar una pantalla móvil o vertical |
| `comparacion` | Dos marcos de 6 columnas con «Antes» y «Después» a igual escala y una frase común al pie | Mostrar dos estados verificables de la misma pantalla. Elegí el mismo recorte y proporción para ambos |
| `avance` | Tarjeta de 7 columnas para el entregable y hasta dos de 5 para evidencia, validación o siguiente paso | Contar trabajo sin captura, como una decisión, investigación o tarea técnica |
| `cierre` | Tarjeta principal lima para una decisión o bloqueo y violeta para próximos pasos, con hasta dos tarjetas secundarias | Cerrar con decisiones, bloqueos o próximos pasos |

Cuando dos proyectos compartan diapositiva, nombrá cada uno en su propia tarjeta. Si una captura pierde detalle en la comparación, usá una sola captura ampliada en `proyecto`. En tarjetas secundarias apiladas con cifra, usá un título de una línea y una línea de cuerpo. Ajustá el texto al espacio y revisá cada diapositiva antes de entregar.

## Aplicación en Spaces

Usá [maquetar.mjs](../scripts/maquetar.mjs) para materializar las plantillas como elementos nativos editables. El módulo recibe el guion como datos y se ejecuta sobre la presentación que ya abrió el skill de presentaciones. Cada ejecución agrega diapositivas. Aplicá primero la portada y luego los lotes restantes una sola vez por diapositiva. Seguí el flujo de sesiones del skill de presentaciones.

```js
const { aplicarPlantillas } = await import(rutaAbsolutaAlModulo);
const resultado = await artifactSession.run(aplicarPlantillas, {
  artifactRef,
  input: {
    diapositivas: [{ tipo: "portada", titulo: "Resumen\nsemanal", periodo: "16–20 de noviembre" }],
  },
});
```

Cada diapositiva recibe `tipo`, `titulo`, `proyecto` cuando corresponde y `notas` con sus fuentes. La portada agrega `periodo` y `corte` si la semana está en curso. Las plantillas de tarjetas reciben `tarjetas` con uno a tres objetos `{ titulo, texto?, etiqueta?, dato? }`. En esta notación, `?` indica un campo opcional. En `cierre`, usá `bloqueo: true` para la variante lima.

`proyecto` y `movil` reciben `texto`, `estado` si se conoce, `siguiente` si agrega valor y `captura`. `comparacion` recibe `texto`, `antes` y `despues`. Cada captura usa `{ ruta, pie, alt?, recorte? }` con una ruta local absoluta a un PNG o JPEG y el recorte opcional en fracciones por lado.

Las fuentes TTF originales y sus licencias están en [recursos tipográficos](../assets/fuentes/LEEME.md). Verificá en el visor que se apliquen las tres familias. Si una fuente se sustituye, indicá cuál y conservá el texto editable. Corroborá el contraste, los saltos de línea, la lectura de las capturas y la cobertura por proyecto.
