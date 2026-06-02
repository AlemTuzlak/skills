---
name: transcribe-video
description: Use when the user wants to transcribe a video or audio file to text with word-level timestamps — spins up a self-contained local Whisper (whisper.cpp) Docker service bundled in this skill and returns transcript.txt, transcript.srt, and word-level transcript.words.json. Also used as a building block by /produce-video. Triggers on "transcribe this video", "get a transcript", "transcribe-video".
---

# Transcribe Video

Transcribes any video/audio file locally using a bundled whisper.cpp service. No external project or cloud API. Returns word-level timestamps (needed for synced overlays/captions).

## When to use
- "Transcribe this clip / video / audio", "get me a transcript with timestamps".
- As a sub-step of `/produce-video`.

## How it runs
Everything is driven by the bundled runner — never ask the user to manage Docker:

```bash
node scripts/transcribe.mjs <path-to-video-or-audio> [--out <dir>] [--port 9111] [--language en] [--no-word-ts] [--task transcribe|translate]
node scripts/transcribe.mjs --stop      # stop the warm container
```

The runner:
1. Checks the Docker daemon is reachable (fails loud with guidance if not).
2. Builds the `transcribe-video-whisper` image from `assets/whisper-service/` if it is missing (first build is slow: it compiles whisper.cpp and bakes the `ggml-base.en.bin` model).
3. Starts the `transcribe-video-whisper` container (host port 9111 → container 9001); reuses it if already running, `docker start`s it if stopped.
4. Waits for `GET /healthz` to report ok.
5. Extracts a 16 kHz mono WAV from the input with local **ffmpeg** (whisper.cpp only decodes WAV), then POSTs it to `/transcribe` with `word_ts=true`.
6. Writes `transcript.txt`, `transcript.srt`, `transcript.words.json` to `--out` (default: the input file's directory), and prints a JSON result line to stdout.

## Outputs
- `transcript.txt` — plain text.
- `transcript.srt` — subtitle text.
- `transcript.words.json` — `[{ "word", "start", "end" }]`, seconds, time-ordered. This is the sync source for overlays/captions.

stdout result line (for programmatic callers like `/produce-video`):
```json
{ "ok": true, "outDir": "...", "wordCount": 38, "segmentCount": 2, "files": { "txt": "transcript.txt", "srt": "transcript.srt", "words": "transcript.words.json" } }
```

## Requirements
- **Docker is REQUIRED** — the Whisper service runs in a container, so Docker Desktop must be installed AND running. The runner checks this first and fails loud with install/start guidance if Docker is missing or its daemon is down; there is no non-Docker fallback.
- **ffmpeg is REQUIRED** (used to extract a 16 kHz mono WAV for Whisper) — the runner checks for it up front and fails loud if it is not on PATH.
- Node ≥ 22.

## Notes
- The container is left running (`--restart unless-stopped`) for warm reuse; stop with `--stop`.
- If word timestamps are requested but none come back, the runner fails loud (overlay sync depends on them).
- See `references/` for the Docker lifecycle, the API shape, and the vendoring provenance.
