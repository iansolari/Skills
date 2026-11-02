#!/usr/bin/env node
// Recolecta la actividad de un día en todos los repos bajo uno o más roots
// y en los transcripts de sesiones de Claude Code. Imprime JSON a stdout.
// Solo requiere Node >= 18 y git (sin dependencias).
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const SKIP_DIRS = new Set(["node_modules", ".git", "venv", ".venv", "dist", "build", ".next", "__pycache__", "Library", ".cache"]);

const expand = (p) => (p === "~" || p.startsWith("~/") || p.startsWith("~\\") ? path.join(os.homedir(), p.slice(1)) : p);

function loadConfig(p) {
  const f = expand(p);
  return fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, "utf8").replace(/^﻿/, "")) : {};
}

function git(repo, ...args) {
  try {
    return execFileSync("git", ["-C", String(repo), ...args], { encoding: "utf8", maxBuffer: 256 * 1024 * 1024, stdio: ["ignore", "pipe", "ignore"] });
  } catch {
    return "";
  }
}

// --- zonas horarias (Intl, sin tzdata externo) ---
function tzParts(date, tz) {
  const f = new Intl.DateTimeFormat("en-CA", {
    timeZone: tz, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
  });
  return Object.fromEntries(f.formatToParts(date).map((p) => [p.type, p.value]));
}
function tzOffsetMs(date, tz) {
  const p = tzParts(date, tz);
  const asUtc = Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute, +p.second);
  return asUtc - Math.floor(date.getTime() / 1000) * 1000;
}
// Instante UTC en que empieza el día `y-m-d` en la zona `tz`.
function startOfDay(y, m, d, tz) {
  let guess = Date.UTC(y, m - 1, d);
  for (let i = 0; i < 2; i++) guess = Date.UTC(y, m - 1, d) - tzOffsetMs(new Date(guess), tz);
  return new Date(guess);
}
function isoLocal(date, tz) {
  const p = tzParts(date, tz);
  const off = tzOffsetMs(date, tz) / 60000;
  const sign = off < 0 ? "-" : "+";
  const abs = Math.abs(off);
  const hh = String(Math.floor(abs / 60)).padStart(2, "0");
  const mm = String(abs % 60).padStart(2, "0");
  return `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}:${p.second}${sign}${hh}:${mm}`;
}

// --- repos ---
function findRepos(roots, maxDepth) {
  const seen = new Set();
  const repos = [];
  for (const rootRaw of roots) {
    const root = path.resolve(expand(rootRaw));
    if (!fs.existsSync(root)) continue;
    const stack = [[root, 0]];
    while (stack.length) {
      const [dir, depth] = stack.pop();
      let entries;
      try {
        entries = fs.readdirSync(dir, { withFileTypes: true });
      } catch {
        continue;
      }
      if (entries.some((e) => e.name === ".git")) {
        const common = git(dir, "rev-parse", "--git-common-dir").trim();
        const key = common ? path.resolve(dir, common) : dir;
        if (!seen.has(key)) {
          seen.add(key);
          repos.push(dir);
        }
        continue;
      }
      if (depth >= maxDepth) continue;
      for (const e of entries) {
        if (e.isDirectory() && !SKIP_DIRS.has(e.name)) stack.push([path.join(dir, e.name), depth + 1]);
      }
    }
  }
  return repos.sort();
}

function repoActivity(repo, start, end, authors, includeWip) {
  const args = ["log", "--all", "--no-merges", `--since=${start.toISOString()}`, `--until=${end.toISOString()}`,
    "--format=%x1e%H%x1f%aI%x1f%an%x1f%ae%x1f%s%x1f%b", "--numstat"];
  for (const a of authors) args.push(`--author=${a}`);
  const out = git(repo, ...args);
  const commits = [];
  for (const chunk of out.split("\x1e").slice(1)) {
    const lines = chunk.split("\n");
    const [, d, , , subj, ...body] = lines[0].split("\x1f");
    const files = [];
    let add = 0, del = 0;
    for (const ln of lines.slice(1)) {
      const parts = ln.split("\t");
      if (parts.length === 3) {
        if (/^\d+$/.test(parts[0])) add += +parts[0];
        if (/^\d+$/.test(parts[1])) del += +parts[1];
        files.push(parts[2]);
      }
    }
    commits.push({ time: d, subject: subj, body: body.join("\n").trim().slice(0, 400),
      files: files.slice(0, 15), n_files: files.length, added: add, deleted: del });
  }
  // El estado del working tree es el de ahora: solo tiene sentido si se pide el día de hoy.
  const wip = includeWip ? git(repo, "status", "--porcelain").split("\n").filter(Boolean) : [];
  const branch = git(repo, "rev-parse", "--abbrev-ref", "HEAD").trim();
  return { commits, wip: wip.map((l) => l.slice(3)).slice(0, 20), branch };
}

// --- sesiones de Claude Code ---
function textOf(content) {
  if (typeof content === "string") return content;
  if (Array.isArray(content)) return content.filter((b) => b && b.type === "text").map((b) => b.text || "").join("\n");
  return "";
}

function sessionActivity(projectsDir, start, end, tz) {
  const base = expand(projectsDir);
  if (!fs.existsSync(base)) return [];
  const res = [];
  for (const proj of fs.readdirSync(base, { withFileTypes: true })) {
    if (!proj.isDirectory()) continue;
    const pdir = path.join(base, proj.name);
    for (const fname of fs.readdirSync(pdir)) {
      if (!fname.endsWith(".jsonl")) continue;
      const f = path.join(pdir, fname);
      try {
        if (fs.statSync(f).mtime < start) continue;
      } catch {
        continue;
      }
      const prompts = [];
      let cwd = null, first = null, last = null;
      for (const line of fs.readFileSync(f, "utf8").split("\n")) {
        if (!line) continue;
        let e;
        try {
          e = JSON.parse(line);
        } catch {
          continue;
        }
        if (!e.timestamp) continue;
        const t = new Date(e.timestamp);
        if (!(t >= start && t < end)) continue;
        cwd = e.cwd || cwd;
        first = first || t;
        last = t;
        if (e.type === "user" && !e.isSidechain && !e.isMeta) {
          const txt = textOf(e.message?.content).trim();
          if (txt && !txt.startsWith("<") && !txt.startsWith("Caveat:")) prompts.push(txt.slice(0, 300));
        }
      }
      if (prompts.length) {
        res.push({ session: fname.replace(/\.jsonl$/, ""), project: proj.name, cwd,
          first: isoLocal(first, tz), last: isoLocal(last, tz),
          active_minutes_span: Math.floor((last - first) / 60000),
          n_prompts: prompts.length, prompts: prompts.slice(0, 12), _t: first.getTime() });
      }
    }
  }
  return res.sort((a, b) => a._t - b._t).map(({ _t, ...s }) => s);
}

// --- main ---
function parseArgs(argv) {
  const a = { config: "~/.claude/daily-summary.json", date: null, root: [], author: [], out: null };
  for (let i = 0; i < argv.length; i++) {
    const k = argv[i];
    if (k === "--config") a.config = argv[++i];
    else if (k === "--out") a.out = argv[++i];
    else if (k === "--date") a.date = argv[++i];
    else if (k === "--root") a.root.push(argv[++i]);
    else if (k === "--author") a.author.push(argv[++i]);
    else { console.error(`Argumento desconocido: ${k}`); process.exit(2); }
  }
  return a;
}

const a = parseArgs(process.argv.slice(2));
const cfg = loadConfig(a.config);
const tzName = cfg.timezone || "America/Argentina/Buenos_Aires";
let y, m, d;
if (a.date) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(a.date)) { console.error("--date debe ser YYYY-MM-DD"); process.exit(2); }
  [y, m, d] = a.date.split("-").map(Number);
} else {
  const p = tzParts(new Date(), tzName);
  [y, m, d] = [+p.year, +p.month, +p.day];
}
const start = startOfDay(y, m, d, tzName);
const end = startOfDay(y, m, d + 1, tzName);
const roots = a.root.length ? a.root : cfg.roots || ["~/dev"];
let authors = a.author.length ? a.author : cfg.authors || [];
if (!authors.length) {
  const email = git(".", "config", "user.email").trim();
  authors = email ? [email] : [];
}
const now = tzParts(new Date(), tzName);
const isToday = +now.year === y && +now.month === m && +now.day === d;
const excluded = new Set(cfg.exclude_repos || []);
const labels = cfg.topic_labels || {};

const repos = [];
for (const repo of findRepos(roots, cfg.max_depth ?? 4)) {
  const name = path.basename(repo);
  if (excluded.has(name)) continue;
  const { commits, wip, branch } = repoActivity(repo, start, end, authors, isToday);
  if (commits.length || wip.length) {
    repos.push({ repo: name, path: repo, label: labels[name] || name, branch,
      commits: commits.reverse(), uncommitted_files: wip });
  }
}

const out = {
  date: `${String(y).padStart(4, "0")}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`,
  timezone: tzName, authors, repos,
  sessions: sessionActivity(cfg.claude_projects_dir || "~/.claude/projects", start, end, tzName),
};
const json = JSON.stringify(out, null, 2) + "\n";
if (a.out) {
  const f = path.resolve(expand(a.out));
  fs.mkdirSync(path.dirname(f), { recursive: true });
  fs.writeFileSync(f, json);
  console.log(`${f}: ${repos.length} repos, ${out.sessions.length} sesiones`);
} else {
  process.stdout.write(json);
}
