#!/usr/bin/env node
// Remove silent sections with auto-editor; report before/after duration. Zero-dep (Node>=22 + auto-editor + ffprobe).
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";

export function parseArgs(argv) {
  const o = { margin: "0.3s" };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--out") o.out = argv[++i];
    else if (a === "--margin") o.margin = argv[++i];
    else if (!a.startsWith("--") && o.input === undefined) o.input = a;
  }
  return o;
}

function duration(file) {
  const r = spawnSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "default=nw=1:nk=1", file], { encoding: "utf8" });
  const d = parseFloat((r.stdout || "").trim());
  return Number.isFinite(d) ? d : null;
}

function main() {
  const o = parseArgs(process.argv.slice(2));
  if (!o.input || !existsSync(o.input)) { console.error("[desilence] input not found"); process.exit(1); }
  if (!o.out) { console.error("[desilence] --out <file> required"); process.exit(1); }
  const before = duration(o.input);
  if (before == null) console.error("[desilence] warning: ffprobe unavailable or failed — before/after duration report will be empty.");
  const r = spawnSync("auto-editor", [o.input, "--margin", o.margin, "-o", o.out], { encoding: "utf8" });
  if (r.status !== 0 || !existsSync(o.out)) { console.error("[desilence] auto-editor failed:", r.stderr || r.stdout); process.exit(1); }
  const after = duration(o.out);
  process.stdout.write(JSON.stringify({
    ok: true,
    out: o.out,
    beforeSec: before,
    afterSec: after,
    removedSec: before != null && after != null ? Math.round((before - after) * 100) / 100 : null,
  }) + "\n");
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(import.meta.filename)) main();
