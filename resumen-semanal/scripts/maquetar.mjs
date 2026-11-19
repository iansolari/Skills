import { readFileSync } from "node:fs";
import { extname } from "node:path";

const SIZE = { width: 1280, height: 720 };
const GRID = { margin: 64, column: 74, gap: 24, top: 208, bottom: 656 };
const COLOR = {
  fondo: "#FFFCF5",
  papel: "#FFFFFF",
  texto: "#171624",
  borde: "#D6CFED",
  violeta: "#5142F5",
  lima: "#E1EF44",
  fucsia: "#FF45CA",
  aqua: "#36DCCB",
};
const STATUS_COLOR = {
  Entregado: COLOR.lima,
  Validado: COLOR.lima,
  "En curso": COLOR.fondo,
  Bloqueado: COLOR.fucsia,
  "Por decidir": COLOR.aqua,
};
const TYPE = { portada: 90, titulo: 52, tarjeta: 38, dato: 64, cuerpo: 24, etiqueta: 18, pie: 18 };
const FONTS = { titular: "Judson", interfaz: "Zalando Sans SemiExpanded", cuerpo: "DM Sans" };
const IMAGE_TYPES = { ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg" };
const SURFACE_TINT = {
  [COLOR.violeta]: "#4031DF",
  [COLOR.lima]: "#F0F66A",
  [COLOR.fucsia]: "#FF68D8",
  [COLOR.aqua]: "#51E6D6",
  [COLOR.fondo]: "#F6F1FC",
  [COLOR.papel]: "#F5F2FC",
};

function rect(left, top, width, height) {
  return { left, top, width, height };
}

function columns(start, count, top = GRID.top, bottom = GRID.bottom) {
  const step = GRID.column + GRID.gap;
  return rect(GRID.margin + (start - 1) * step, top, count * step - GRID.gap, bottom - top);
}

function shape(slide, position, fill, { name, radius, outline, outlineWidth = 1, geometry = "rect" } = {}) {
  return slide.shapes.add({
    name,
    geometry,
    position,
    fill,
    ...(radius ? { borderRadius: radius } : {}),
    line: { fill: outline || "none", style: "solid", width: outline ? outlineWidth : 0 },
  });
}

function surfaceFill(base) {
  return {
    type: "gradient",
    gradientKind: "linear",
    angleDeg: 145,
    stops: [
      { offset: 0, color: base },
      { offset: 100000, color: SURFACE_TINT[base] },
    ],
  };
}

const AMBIENT_HALOS = {
  portada: [[COLOR.aqua, 470, 12, 810, 580, 18], [COLOR.fucsia, 20, 448, 690, 272, 15]],
  panorama: [[COLOR.aqua, 670, 0, 610, 342, 28], [COLOR.lima, 480, 20, 520, 328, 20]],
  proyecto: [[COLOR.aqua, 816, 4, 464, 240, 21]],
  movil: [[COLOR.fucsia, 716, 4, 564, 336, 19]],
  avance: [[COLOR.fucsia, 690, 0, 590, 334, 23], [COLOR.aqua, 0, 526, 620, 194, 18]],
  cierre: [[COLOR.lima, 670, 0, 610, 360, 24], [COLOR.aqua, 852, 0, 428, 260, 19]],
};

function ambientBackground(slide, layout) {
  slide.background.fill = surfaceFill(COLOR.fondo);
  for (const [color, x, y, width, height, strength] of AMBIENT_HALOS[layout] || []) {
    // The radial radius follows the longest axis. Fade inside the shortest edge.
    const fade = Math.floor(78 * Math.min(width, height) / Math.max(width, height));
    const midpoint = Math.round(fade * 0.42);
    const radial = `radial(${color}/${strength} 0%, ${color}/${Math.round(strength / 2)} ${midpoint}%, ${color}/0 ${fade}%, ${color}/0 100%)`;
    shape(slide, rect(x, y, width, height), radial, { name: "Halo de fondo", geometry: "ellipse" });
  }
}

function text(slide, font, name, value, position, fontSize, { bold = false, centered = false, face = "interfaz", color = COLOR.texto } = {}) {
  if (!value) return;
  const box = shape(slide, position, "none", { name, geometry: "textbox" });
  box.text = value;
  box.text.style = {
    typeface: font[face],
    fontSize,
    color,
    bold,
    autoFit: "none",
    wrap: "square",
    insets: 0,
    alignment: centered ? "center" : "left",
    verticalAlignment: centered ? "middle" : "top",
  };
}

function chip(slide, font, status, left, top) {
  if (!status) return 0;
  const fill = STATUS_COLOR[status];
  const position = rect(left, top, Math.max(104, 40 + status.length * 10), 36);
  shape(slide, position, fill || COLOR.papel, {
    name: "Etiqueta de estado",
    radius: 18,
    outline: fill ? undefined : COLOR.borde,
  });
  text(slide, font, "Estado", status, position, TYPE.etiqueta, { bold: true, centered: true });
  return 56;
}

function header(slide, font, { tipo, proyecto, titulo }) {
  if (proyecto) {
    const position = rect(64, 40, Math.min(660, 36 + proyecto.length * 11), 32);
    shape(slide, position, COLOR.lima, { name: "Cápsula de proyecto", radius: 16 });
    text(slide, font, "Proyecto", proyecto, position, TYPE.etiqueta, { bold: true, centered: true });
  }
  text(slide, font, "Título", titulo, rect(64, proyecto ? 78 : 52, 1094, proyecto ? 112 : 132), TYPE.titulo, {
    bold: true, face: "titular",
  });
  const motif = HEADER_GRAPHICS[tipo];
  if (motif) graficos[motif](slide, rect(1165, 48, 46, 46));
}

function card(slide, font, item, position, fill, featured = false) {
  const { left, top, width, height } = position;
  shape(slide, position, surfaceFill(fill), { name: "Tarjeta", radius: 32 });
  const x = left + 28;
  const contentWidth = width - 56;
  const color = fill === COLOR.violeta ? COLOR.fondo : COLOR.texto;
  const compact = height < 280;
  let y = top + 24;
  if (item.etiqueta) {
    text(slide, font, "Etiqueta", item.etiqueta, rect(x, y, contentWidth, 24), TYPE.etiqueta, { bold: true, color });
    y += 32;
  }
  if (item.dato) {
    const metricHeight = compact ? 54 : 76;
    text(slide, font, "Dato", item.dato, rect(x, y, contentWidth, metricHeight), compact ? 44 : TYPE.dato, { bold: true, color });
    y += metricHeight + 4;
  }
  const titleSize = featured ? (item.dato ? TYPE.tarjeta : 52) : 32;
  const titleHeight = featured ? (item.dato ? 88 : 130) : compact && item.dato ? 43 : 76;
  text(slide, font, "Título de tarjeta", item.titulo, rect(x, y, contentWidth, titleHeight), titleSize, {
    bold: true, face: "titular", color,
  });
  y += titleHeight + 6;
  if (featured) y = Math.max(y, top + height - 116);
  text(slide, font, "Detalle de tarjeta", item.texto, rect(x, y, contentWidth, top + height - y - 24), featured ? TYPE.cuerpo : 20, {
    face: "cuerpo", color,
  });
}

function frame(slide, font, capture, position) {
  const { left, top, width, height } = position;
  const pad = 12;
  const contentType = IMAGE_TYPES[extname(capture.ruta).toLowerCase()];
  if (!contentType) throw new Error("La captura debe estar en PNG o JPEG");
  shape(slide, position, surfaceFill(COLOR.papel), { name: "Marco de captura", radius: 24, outline: COLOR.borde });
  slide.images.add({
    blob: readFileSync(capture.ruta),
    contentType,
    alt: capture.alt || capture.pie,
    fit: "contain",
    position: rect(left + pad, top + pad, width - 2 * pad, height - 2 * pad),
    ...(capture.recorte ? { crop: capture.recorte } : {}),
  });
  text(slide, font, "Pie de captura", capture.pie, rect(left, top + height + 8, width, 44), TYPE.pie, { face: "cuerpo" });
}

function projectText(slide, font, content, position) {
  const { left, top, width, height } = position;
  shape(slide, position, surfaceFill(COLOR.violeta), { name: "Tarjeta de avance", radius: 32 });
  const x = left + 28;
  const contentWidth = width - 56;
  const y = top + 28 + chip(slide, font, content.estado, x, top + 28);
  const detailEnd = content.siguiente ? top + height - 116 : top + height - 28;
  text(slide, font, "Qué cambió", content.texto, rect(x, y, contentWidth, detailEnd - y), TYPE.cuerpo, { face: "cuerpo", color: COLOR.fondo });
  text(slide, font, "Próximo paso", content.siguiente, rect(x, top + height - 100, contentWidth, 72), TYPE.etiqueta, { bold: true, color: COLOR.lima });
}

function destello(slide, position) {
  shape(slide, position, COLOR.violeta, { name: "Destello", geometry: "star4" });
}

function flor(slide, { left, top, width, height }) {
  const x = left + width / 2;
  const y = top + height / 2;
  const diameter = Math.min(width, height);
  const petalWidth = diameter / 4;
  const petal = {
    type: "gradient",
    gradientKind: "linear",
    angleDeg: 35,
    stops: [
      { offset: 0, color: COLOR.lima },
      { offset: 37000, color: COLOR.fucsia },
      { offset: 100000, color: COLOR.violeta },
    ],
  };
  for (const rotation of [0, 45, 90, 135]) {
    shape(slide, { ...rect(x - diameter / 2, y - petalWidth / 2, diameter, petalWidth), rotation }, petal, {
      radius: petalWidth / 2,
      name: "Pétalos del gráfico",
    });
  }
}

function orbita(slide, { left, top, width, height }) {
  const size = Math.min(width, height);
  const x = left + (width - size) / 2;
  const y = top + (height - size) / 2;
  shape(slide, rect(x + size * 0.29, y + size * 0.29, size * 0.42, size * 0.42), surfaceFill(COLOR.aqua), {
    name: "Núcleo de órbita", geometry: "ellipse",
  });
  shape(slide, { ...rect(x + size * 0.05, y + size * 0.32, size * 0.9, size * 0.38), rotation: -30 }, "none", {
    name: "Anillo de órbita", geometry: "ellipse", outline: COLOR.violeta, outlineWidth: Math.max(1.7, size / 35),
  });
  shape(slide, rect(x + size * 0.72, y + size * 0.2, size * 0.17, size * 0.17), COLOR.lima, {
    name: "Satélite", geometry: "ellipse",
  });
}

function capsulas(slide, { left, top, width, height }) {
  const bandHeight = height * 0.31;
  const bandWidth = width * 0.78;
  const bands = [
    { x: left + width * 0.02, y: top + height * 0.29, fill: COLOR.fucsia, rotation: -24 },
    { x: left + width * 0.19, y: top + height * 0.47, fill: COLOR.lima, rotation: 19 },
  ];
  for (const { x, y, fill, rotation } of bands) {
    shape(slide, { ...rect(x, y, bandWidth, bandHeight), rotation }, surfaceFill(fill), {
      name: "Cápsula gráfica", radius: bandHeight / 2,
    });
  }
}

export const graficos = { destello, flor, orbita, capsulas };
const HEADER_GRAPHICS = { panorama: "capsulas", proyecto: "destello", movil: "destello", avance: "orbita", cierre: "flor" };

function cover(slide, font, content) {
  const main = columns(1, 7, 64);
  shape(slide, main, surfaceFill(COLOR.violeta), { name: "Bloque de portada", radius: 40 });
  text(slide, font, "Título de portada", content.titulo, rect(104, 114, 576, 280), TYPE.portada, {
    bold: true, face: "titular", color: COLOR.fondo,
  });
  if (content.periodo) {
    const date = rect(104, 511, 552, 59);
    shape(slide, date, COLOR.lima, { name: "Cápsula de fechas", radius: 30 });
    text(slide, font, "Período", content.periodo, date, 24, { bold: true, centered: true });
  }
  text(slide, font, "Corte del informe", content.corte, rect(105, 588, 549, 35), TYPE.cuerpo, {
    face: "cuerpo", color: COLOR.fondo,
  });
  const glow = {
    type: "gradient",
    gradientKind: "linear",
    angleDeg: 135,
    stops: [
      { offset: 0, color: COLOR.aqua },
      { offset: 52000, color: COLOR.papel },
      { offset: 100000, color: COLOR.fucsia },
    ],
  };
  shape(slide, columns(8, 5, 64, 466), glow, { name: "Campo de color", radius: 40 });
  flor(slide, rect(857, 149, 246, 246));
  destello(slide, rect(1119, 119, 57, 57));
  shape(slide, columns(8, 3, 490, 656), surfaceFill(COLOR.lima), { name: "Bloque lima", radius: 36 });
  destello(slide, rect(833, 520, 103, 103));
  shape(slide, columns(11, 2, 490, 656), surfaceFill(COLOR.fucsia), { name: "Bloque fucsia", radius: 36 });
  orbita(slide, rect(1054, 498, 150, 150));
}

function cards(slide, font, { tarjetas }, fills) {
  const [main, ...secondary] = tarjetas;
  card(slide, font, main, columns(1, secondary.length ? 7 : 12), fills[0], true);
  if (secondary.length === 1) {
    card(slide, font, secondary[0], columns(8, 5), fills[1]);
  }
  if (secondary.length === 2) {
    card(slide, font, secondary[0], columns(8, 5, GRID.top, 420), fills[1]);
    card(slide, font, secondary[1], columns(8, 5, 444, GRID.bottom), fills[2]);
  }
}

function desktop(slide, font, content) {
  projectText(slide, font, content, columns(1, 4));
  frame(slide, font, content.captura, columns(5, 8, GRID.top, 604));
}

function mobile(slide, font, content) {
  projectText(slide, font, content, columns(1, 7));
  frame(slide, font, content.captura, columns(9, 3, GRID.top, 604));
}

function comparacion(slide, font, content) {
  text(slide, font, "Antes", "Antes", columns(1, 6, GRID.top, 234), TYPE.etiqueta, { bold: true });
  text(slide, font, "Después", "Después", columns(7, 6, GRID.top, 234), TYPE.etiqueta, { bold: true });
  frame(slide, font, content.antes, columns(1, 6, 244, 548));
  frame(slide, font, content.despues, columns(7, 6, 244, 548));
  text(slide, font, "Cambio verificado", content.texto, columns(1, 12, 612, 656), TYPE.cuerpo, { bold: true });
}

const layouts = {
  portada: cover,
  panorama: (slide, font, content) => cards(slide, font, content, [COLOR.violeta, COLOR.lima, COLOR.fucsia]),
  proyecto: desktop,
  movil: mobile,
  comparacion,
  avance: (slide, font, content) => cards(slide, font, content, [COLOR.lima, COLOR.violeta, COLOR.aqua]),
  cierre: (slide, font, content) => cards(slide, font, content, content.bloqueo
    ? [COLOR.lima, COLOR.violeta, COLOR.fucsia]
    : [COLOR.violeta, COLOR.aqua, COLOR.lima]),
};

export function agregarDiapositiva(presentation, content, { fuentes } = {}) {
  const layout = Object.hasOwn(layouts, content.tipo) ? layouts[content.tipo] : null;
  if (!layout) throw new Error(`Plantilla desconocida: ${content.tipo}`);
  const font = { ...FONTS, ...fuentes };
  const slide = presentation.slides.add(SIZE);
  ambientBackground(slide, content.tipo);
  if (content.tipo !== "portada") header(slide, font, content);
  layout(slide, font, content);
  if (content.notas) slide.speakerNotes.text = content.notas;
  return slide;
}

export async function aplicarPlantillas({ presentation, input }) {
  for (const content of input.diapositivas) agregarDiapositiva(presentation, content, { fuentes: input.fuentes });
  return { agregadas: input.diapositivas.length };
}
