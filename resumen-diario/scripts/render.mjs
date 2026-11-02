#!/usr/bin/env node
// Toma tasks.json (con 'weight' relativo por tarea) y reparte el tiempo para que
// sume exactamente el total (default 7h), en bloques de 15 min. Escribe .md y .json final.
// Solo requiere Node >= 18 (sin dependencias).
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
let tasksJson = null, hours = 7, outdir = "~/.claude/daily-summaries";
for (let i = 0; i < argv.length; i++) {
  if (argv[i] === "--hours") hours = parseFloat(argv[++i]);
  else if (argv[i] === "--outdir") outdir = argv[++i];
  else tasksJson = argv[i];
}
if (!tasksJson) { console.error("Uso: render.mjs tasks.json [--hours 7] [--outdir DIR]"); process.exit(2); }

const data = JSON.parse(fs.readFileSync(tasksJson, "utf8").replace(/^﻿/, ""));
const tasks = data.tasks;
const mins = distribute(tasks.map((t) => parseFloat(t.weight ?? 1)), Math.floor(hours * 60));
tasks.forEach((t, i) => {
  t.minutes = mins[i];
  t.time = fmt(mins[i]);
  t.title = `${t.summary} - ${t.topic}`;
});
const out = expand(outdir);
fs.mkdirSync(out, { recursive: true });
fs.writeFileSync(path.join(out, `${data.date}.json`), JSON.stringify(data, null, 2));
const md = [`# Resumen del ${data.date} — total ${fmt(mins.reduce((s, m) => s + m, 0))}\n`];
for (const t of tasks) md.push(`## ${t.title}\n**Tiempo:** ${t.time}\n\n${t.description.trim()}\n`);
fs.writeFileSync(path.join(out, `${data.date}.md`), md.join("\n"));
console.log(md.join("\n"));
