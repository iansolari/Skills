#!/usr/bin/env python3
"""Toma tasks.json (con 'weight' relativo por tarea) y reparte el tiempo para que
sume exactamente el total (default 7h), en bloques de 15 min. Escribe .md y .json final."""
import argparse, json
from pathlib import Path

def distribute(weights, total_min, step=15):
    total_w = sum(weights)
    units = total_min // step
    raw = [w / total_w * units for w in weights]
    alloc = [max(1, int(r)) for r in raw]
    while sum(alloc) < units:
        i = max(range(len(raw)), key=lambda k: raw[k] - alloc[k]); alloc[i] += 1
    while sum(alloc) > units:
        i = max((k for k in range(len(alloc)) if alloc[k] > 1), key=lambda k: alloc[k] - raw[k]); alloc[i] -= 1
    return [u * step for u in alloc]

def fmt(m):
    h, mm = divmod(m, 60)
    return f"{h}h" + (f" {mm}m" if mm else "") if h else f"{mm}m"

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("tasks_json"); ap.add_argument("--hours", type=float, default=7)
    ap.add_argument("--outdir", default="~/.claude/daily-summaries")
    a = ap.parse_args()
    data = json.loads(Path(a.tasks_json).read_text())
    tasks = data["tasks"]
    mins = distribute([float(t.get("weight", 1)) for t in tasks], int(a.hours * 60))
    for t, m in zip(tasks, mins):
        t["minutes"] = m; t["time"] = fmt(m); t["title"] = f'{t["summary"]} - {t["topic"]}'
    out = Path(a.outdir).expanduser(); out.mkdir(parents=True, exist_ok=True)
    (out / f'{data["date"]}.json').write_text(json.dumps(data, ensure_ascii=False, indent=2))
    md = [f'# Resumen del {data["date"]} — total {fmt(sum(mins))}\n']
    for t in tasks:
        md.append(f'## {t["title"]}\n**Tiempo:** {t["time"]}\n\n{t["description"].strip()}\n')
    (out / f'{data["date"]}.md').write_text("\n".join(md))
    print("\n".join(md))

if __name__ == "__main__":
    main()
