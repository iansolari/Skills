#!/usr/bin/env node
// Toma las tareas (JSON con 'weight' relativo por tarea) y reparte el tiempo para que
// sume exactamente el total (default 7h), en bloques de 15 min. Imprime el resultado
// por stdout; no escribe archivos salvo que se pida con --save DIR.
// Solo requiere Node >= 18 (sin dependencias).
//
// Uso: node render.mjs [tasks.json | -] [--hours 7] [--save DIR]
//   Sin archivo (o con "-") lee el JSON desde stdin.
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const expand = (p) => (p === "~" || p.startsWith("~/") || p.startsWith("~\\") ? path.join(os.homedir(), p.slice(1)) : p);

function distribute(weights, totalMin, step = 15) {
  const totalW = weights.reduce((s, w) => s + w, 0);
  const units = Math.floor(totalMin / step);
  const raw = weights.map((w) => (w / totalW) * units);
  const alloc = raw.map((r) => Math.max(1, Math.floor(r)));
  const sum = () => alloc.reduce((s, u) => s + u, 0);
  while (sum() < units) {
    let i = 0;
    raw.forEach((r, k) => { if (r - alloc[k] > raw[i] - alloc[i]) i = k; });
    alloc[i]++;
  }
  while (sum() > units) {
    let i = -1;
    alloc.forEach((u, k) => { if (u > 1 && (i < 0 || u - raw[k] > alloc[i] - raw[i])) i = k; });
    if (i < 0) break; // hay más tareas que bloques disponibles
    alloc[i]--;
  }
  return alloc.map((u) => u * step);
}

function fmt(m) {
  const h = Math.floor(m / 60), mm = m % 60;
  return h ? `${h}h` + (mm ? ` ${mm}m` : "") : `${mm}m`;
}

const argv = process.argv.slice(2);
let tasksJson = null, hours = 7, saveDir = null;
for (let i = 0; i < argv.length; i++) {
  if (argv[i] === "--hours") hours = parseFloat(argv[++i]);
  else if (argv[i] === "--save") saveDir = argv[++i];
  else tasksJson = argv[i];
}

const raw = tasksJson && tasksJson !== "-" ? fs.readFileSync(expand(tasksJson), "utf8") : fs.readFileSync(0, "utf8");
const data = JSON.parse(raw.replace(/^﻿/, ""));
const tasks = data.tasks;
const mins = distribute(tasks.map((t) => parseFloat(t.weight ?? 1)), Math.floor(hours * 60));
tasks.forEach((t, i) => {
  t.minutes = mins[i];
  t.time = fmt(mins[i]);
  t.title = `${t.summary} - ${t.topic}`;
});

const md = [`# Resumen del ${data.date} — total ${fmt(mins.reduce((s, m) => s + m, 0))}\n`];
for (const t of tasks) md.push(`## ${t.title}\n**Tiempo:** ${t.time}\n\n${t.description.trim()}\n`);
console.log(md.join("\n"));

if (saveDir) {
  const out = path.resolve(expand(saveDir));
  fs.mkdirSync(out, { recursive: true });
  fs.writeFileSync(path.join(out, `${data.date}.json`), JSON.stringify(data, null, 2));
  fs.writeFileSync(path.join(out, `${data.date}.md`), md.join("\n"));
}
