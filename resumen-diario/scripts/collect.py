#!/usr/bin/env python3
"""Recolecta la actividad de un día en todos los repos bajo uno o más roots
y en los transcripts de sesiones de Claude Code. Imprime JSON a stdout."""
import argparse, json, os, subprocess, sys
from datetime import datetime, timedelta, timezone
from pathlib import Path
from zoneinfo import ZoneInfo

SKIP_DIRS = {"node_modules", ".git", "venv", ".venv", "dist", "build", ".next", "__pycache__", "Library", ".cache"}

def load_config(path):
    p = Path(path).expanduser()
    return json.loads(p.read_text()) if p.exists() else {}

def git(repo, *args):
    r = subprocess.run(["git", "-C", str(repo), *args], capture_output=True, text=True)
    return r.stdout if r.returncode == 0 else ""

def find_repos(roots, max_depth):
    seen, repos = set(), []
    for root in roots:
        root = Path(root).expanduser()
        if not root.exists():
            continue
        base = len(root.parts)
        for dirpath, dirnames, _ in os.walk(root):
            depth = len(Path(dirpath).parts) - base
            if ".git" in dirnames or (Path(dirpath) / ".git").is_file():
                common = git(dirpath, "rev-parse", "--git-common-dir").strip()
                key = str((Path(dirpath) / common).resolve()) if common else dirpath
                if key not in seen:
                    seen.add(key); repos.append(Path(dirpath))
                dirnames[:] = []
                continue
            dirnames[:] = [d for d in dirnames if d not in SKIP_DIRS and depth < max_depth]
    return repos

def repo_activity(repo, start, end, authors):
    args = ["log", "--all", "--no-merges", f"--since={start.isoformat()}", f"--until={end.isoformat()}",
            "--format=%x1e%H%x1f%aI%x1f%an%x1f%ae%x1f%s%x1f%b", "--numstat"]
    for a in authors:
        args.append(f"--author={a}")
    out = git(repo, *args)
    commits = []
    for chunk in out.split("\x1e")[1:]:
        lines = chunk.split("\n")
        h, d, an, ae, subj, *body = lines[0].split("\x1f")
        files, add, dele = [], 0, 0
        for ln in lines[1:]:
            parts = ln.split("\t")
            if len(parts) == 3:
                a_, d_, f = parts
                add += int(a_) if a_.isdigit() else 0
                dele += int(d_) if d_.isdigit() else 0
                files.append(f)
        commits.append({"time": d, "subject": subj, "body": "\n".join(body).strip()[:400],
                        "files": files[:15], "n_files": len(files), "added": add, "deleted": dele})
    wip = git(repo, "status", "--porcelain").strip().splitlines()
    branch = git(repo, "rev-parse", "--abbrev-ref", "HEAD").strip()
    return commits, [l[3:] for l in wip][:20], branch

def text_of(content):
    if isinstance(content, str):
        return content
    if isinstance(content, list):
        return "\n".join(b.get("text", "") for b in content if isinstance(b, dict) and b.get("type") == "text")
    return ""

def session_activity(projects_dir, start, end, tz):
    res = {}
    base = Path(projects_dir).expanduser()
    if not base.exists():
        return []
    for f in base.glob("*/*.jsonl"):
        try:
            if datetime.fromtimestamp(f.stat().st_mtime, tz) < start:
                continue
        except OSError:
            continue
        prompts, cwd, first, last = [], None, None, None
        for line in f.open(errors="ignore"):
            try:
                e = json.loads(line)
            except ValueError:
                continue
            ts = e.get("timestamp")
            if not ts:
                continue
            t = datetime.fromisoformat(ts.replace("Z", "+00:00")).astimezone(tz)
            if not (start <= t < end):
                continue
            cwd = e.get("cwd") or cwd
            first = first or t; last = t
            if e.get("type") == "user" and not e.get("isSidechain") and not e.get("isMeta"):
                txt = text_of(e.get("message", {}).get("content")).strip()
                if txt and not txt.startswith("<") and not txt.startswith("Caveat:"):
                    prompts.append(txt[:300])
        if prompts:
            res[f.stem] = {"session": f.stem, "project": f.parent.name, "cwd": cwd,
                           "first": first.isoformat(), "last": last.isoformat(),
                           "active_minutes_span": int((last - first).total_seconds() // 60),
                           "n_prompts": len(prompts), "prompts": prompts[:12]}
    return sorted(res.values(), key=lambda s: s["first"])

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--config", default="~/.claude/daily-summary.json")
    ap.add_argument("--date", help="YYYY-MM-DD (default: hoy)")
    ap.add_argument("--root", action="append")
    ap.add_argument("--author", action="append")
    a = ap.parse_args()
    cfg = load_config(a.config)
    tz = ZoneInfo(cfg.get("timezone", "America/Argentina/Buenos_Aires"))
    day = datetime.strptime(a.date, "%Y-%m-%d").date() if a.date else datetime.now(tz).date()
    start = datetime(day.year, day.month, day.day, tzinfo=tz); end = start + timedelta(days=1)
    roots = a.root or cfg.get("roots", ["~/dev"])
    authors = a.author or cfg.get("authors", [])
    if not authors:
        authors = [git(".", "config", "user.email").strip()] if git(".", "config", "user.email").strip() else []
    excluded = set(cfg.get("exclude_repos", []))
    labels = cfg.get("topic_labels", {})
    repos_out = []
    for repo in find_repos(roots, cfg.get("max_depth", 4)):
        if repo.name in excluded:
            continue
        commits, wip, branch = repo_activity(repo, start, end, authors)
        if commits or wip:
            repos_out.append({"repo": repo.name, "path": str(repo), "label": labels.get(repo.name, repo.name),
                              "branch": branch, "commits": commits[::-1], "uncommitted_files": wip})
    out = {"date": day.isoformat(), "timezone": str(tz), "authors": authors,
           "repos": repos_out,
           "sessions": session_activity(cfg.get("claude_projects_dir", "~/.claude/projects"), start, end, tz)}
    json.dump(out, sys.stdout, ensure_ascii=False, indent=2)

if __name__ == "__main__":
    main()
