#!/usr/bin/env node
// Zero-dependency Whisper transcription runner. Node >= 22 (built-in fetch/FormData/Blob).
import { spawnSync } from "node:child_process";
import { readFileSync, writeFileSync, existsSync, rmSync, mkdirSync } from "node:fs";
import os from "node:os";
import path from "node:path";

const IMAGE = "transcribe-video-whisper";
const CONTAINER = "transcribe-video-whisper";
const DEFAULT_PORT = 9111;
const SERVICE_DIR = path.join(import.meta.dirname, "..", "assets", "whisper-service");

export function parseArgs(argv) {
  const o = { wordTs: true, port: DEFAULT_PORT, task: "transcribe", stop: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--stop") o.stop = true;
    else if (a === "--no-word-ts") o.wordTs = false;
    else if (a === "--word-ts") o.wordTs = true;
    else if (a === "--port") o.port = Number(argv[++i]);
    else if (a === "--language") o.language = argv[++i];
    else if (a === "--task") o.task = argv[++i];
    else if (a === "--out") o.out = argv[++i];
    else if (!a.startsWith("--") && o.input === undefined) o.input = a;
  }
  return o;
}

function sh(cmd, args, opts = {}) {
  return spawnSync(cmd, args, { encoding: "utf8", ...opts });
}

function dockerOrDie() {
  // Docker is REQUIRED — the Whisper service runs in a container.
  const r = sh("docker", ["info"]);
  if (r.error && r.error.code === "ENOENT") {
    console.error("[transcribe-video] Docker is REQUIRED but is not installed. Install Docker Desktop (https://www.docker.com/products/docker-desktop/), start it, then retry.");
    process.exit(1);
  }
  if (r.status !== 0) {
    console.error("[transcribe-video] Docker is installed but the daemon is not running. Start Docker Desktop, then retry.");
    process.exit(1);
  }
}

function ffmpegOrDie() {
  // ffmpeg is REQUIRED — used to extract a 16 kHz mono WAV (whisper.cpp only decodes WAV).
  const r = sh("ffmpeg", ["-version"]);
  if ((r.error && r.error.code === "ENOENT") || r.status !== 0) {
    console.error("[transcribe-video] ffmpeg is REQUIRED but was not found on PATH. Install ffmpeg, then retry.");
    process.exit(1);
  }
}

function imageExists() {
  return sh("docker", ["images", "-q", IMAGE]).stdout.trim() !== "";
}

function containerState() {
  const running = sh("docker", ["ps", "-q", "-f", `name=^${CONTAINER}$`]).stdout.trim();
  if (running) return "running";
  const exists = sh("docker", ["ps", "-aq", "-f", `name=^${CONTAINER}$`]).stdout.trim();
  return exists ? "stopped" : "absent";
}

function buildImage() {
  console.error(`[transcribe-video] Building ${IMAGE} (first build is slow: compiles whisper.cpp, bakes the model)...`);
  const r = sh("docker", ["build", "-t", IMAGE, SERVICE_DIR], { stdio: "inherit" });
  if (r.status !== 0) { console.error("[transcribe-video] Image build failed."); process.exit(1); }
}

function ensureContainer(port) {
  const state = containerState();
  if (state === "running") return;
  if (state === "stopped") {
    const r = sh("docker", ["start", CONTAINER]);
    if (r.status !== 0) { console.error("[transcribe-video] docker start failed:", r.stderr); process.exit(1); }
    return;
  }
  const r = sh("docker", ["run", "-d", "--name", CONTAINER, "--restart", "unless-stopped", "-p", `${port}:9001`, IMAGE]);
  if (r.status !== 0) {
    console.error(`[transcribe-video] docker run failed (is host port ${port} already taken by a non-${CONTAINER} process?):`, r.stderr);
    process.exit(1);
  }
}

async function waitHealthy(port, timeoutMs = 180000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(`http://localhost:${port}/healthz`);
      if (res.ok) { const j = await res.json(); if (j.ok) return; }
    } catch { /* not up yet */ }
    await new Promise((r) => setTimeout(r, 2000));
  }
  console.error("[transcribe-video] Health check timed out.");
  process.exit(1);
}

// whisper.cpp (whisper-cli) only decodes WAV. Normalize any input (mp4, mov, mp3, wav)
// to 16 kHz mono WAV locally before uploading. ffmpeg must be on PATH.
function extractWav(input) {
  const safe = path.basename(input).replace(/[^A-Za-z0-9._-]+/g, "_");
  const wav = path.join(os.tmpdir(), `transcribe-video-${safe}-16k.wav`);
  const r = sh("ffmpeg", ["-y", "-loglevel", "error", "-i", input, "-ar", "16000", "-ac", "1", wav]);
  if (r.status !== 0 || !existsSync(wav)) {
    console.error("[transcribe-video] ffmpeg WAV extraction failed (is ffmpeg on PATH?):", r.stderr);
    process.exit(1);
  }
  return wav;
}

async function transcribeFile(opts, mediaPath) {
  const buf = readFileSync(mediaPath);
  const form = new FormData();
  form.append("file", new Blob([buf]), "audio.wav");
  if (opts.language) form.append("language", opts.language);
  form.append("task", opts.task);
  if (opts.wordTs) form.append("word_ts", "true");

  const res = await fetch(`http://localhost:${opts.port}/transcribe`, { method: "POST", body: form });
  if (!res.ok) {
    console.error(`[transcribe-video] /transcribe failed: HTTP ${res.status}`, await res.text());
    process.exit(1);
  }
  const data = await res.json();
  if (opts.wordTs && (!Array.isArray(data.word_timestamps) || data.word_timestamps.length === 0)) {
    console.error("[transcribe-video] Word timestamps were requested but none were returned. Aborting (overlay sync needs them).");
    process.exit(1);
  }
  return data;
}

function writeOutputs(outDir, data) {
  writeFileSync(path.join(outDir, "transcript.txt"), data.text ?? "", "utf8");
  writeFileSync(path.join(outDir, "transcript.srt"), data.srt ?? "", "utf8");
  writeFileSync(path.join(outDir, "transcript.words.json"), JSON.stringify(data.word_timestamps ?? [], null, 2), "utf8");
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));

  if (opts.stop) {
    dockerOrDie();
    sh("docker", ["stop", CONTAINER], { stdio: "inherit" });
    return;
  }
  if (!opts.input || !existsSync(opts.input)) {
    console.error("[transcribe-video] Provide a path to an existing video/audio file.");
    process.exit(1);
  }
  if (!Number.isInteger(opts.port) || opts.port < 1 || opts.port > 65535) {
    console.error(`[transcribe-video] --port must be an integer 1-65535 (got: ${opts.port}).`);
    process.exit(1);
  }
  if (!["transcribe", "translate"].includes(opts.task)) {
    console.error(`[transcribe-video] --task must be "transcribe" or "translate" (got: ${opts.task}).`);
    process.exit(1);
  }
  ffmpegOrDie();

  // Resolve and ensure the output directory up front, so a bad --out fails loud
  // BEFORE the (slow) transcription rather than throwing a raw ENOENT after it.
  const outDir = opts.out ?? path.dirname(path.resolve(opts.input));
  if (!existsSync(outDir)) {
    try {
      mkdirSync(outDir, { recursive: true });
    } catch (e) {
      console.error(`[transcribe-video] --out directory is not usable: ${outDir} (${e.message})`);
      process.exit(1);
    }
  }

  dockerOrDie();
  if (!imageExists()) buildImage();
  ensureContainer(opts.port);
  await waitHealthy(opts.port);

  const wav = extractWav(opts.input);
  let data;
  try {
    data = await transcribeFile(opts, wav);
  } finally {
    try { rmSync(wav, { force: true }); } catch { /* best-effort temp cleanup */ }
  }
  writeOutputs(outDir, data);

  process.stdout.write(JSON.stringify({
    ok: true,
    outDir,
    wordCount: (data.word_timestamps ?? []).length,
    segmentCount: (data.segments ?? []).length,
    files: { txt: "transcript.txt", srt: "transcript.srt", words: "transcript.words.json" },
  }) + "\n");
}

// Run main() only when executed directly, not when imported by tests.
if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(import.meta.filename)) {
  main();
}
