---
name: produce-video
description: Use when the user wants to turn a raw talking-head / screen-share recording into a finished, edited, annotated video plus a full content package. Removes silences, flags mistakes for the user to cut, transcribes, adds transcript-synced overlays (code, on-screen code highlights, word highlights, lists, comparisons, diagrams, section labels, punch-in zooms), renders with original audio, then generates blog/socials/YouTube content. Triggers on "produce a video", "edit my video", "annotate my recording", "/produce-video".
---

# Produce Video

Take a recording the user provides and turn it into a finished video. The recording is the spine and drives the timeline; this skill edits (silence + chosen mistakes/pacing) and augments (overlays), then renders and generates launch content. It does NOT author a synthetic video — for PR-driven synthetic promos use `hyperframes-video` instead.

## Relation to other skills (delegate, don't re-derive)
- **`/transcribe-video`** — all transcription (returns word-level `transcript.words.json`). Invoke it; do not transcribe by hand.
- **`hyperframes`** — composition authoring rules (Visual Identity Gate, Layout Before Animation, timeline contract, video/overlay layering). **Invoke before writing/mounting any composition HTML.**
- **`hyperframes-cli`** — every `npx hyperframes` command (init, lint, inspect, preview, render).
- **`gsap`** — GSAP timeline/easing patterns for overlays.

## Bundled assets
- `scripts/desilence.mjs` — auto-editor silence removal + before/after duration.
- `scripts/extract-frame.mjs` — single-frame grab (framing detection + on-screen highlight).
- `templates/overlays/*.html` — 9 overlay sub-composition templates (filled per instance; sub-comps are standalone HTML docs in the installed CLI — read each file's header comment).
- `templates/project/{DESIGN.md,styles.css}` — Visual Identity Gate + brand `var(--brand-*)` tokens the overlays consume.
- `assets/content-gen/` — vendored blog/socials/YouTube generator (run via `node assets/content-gen/node_modules/tsx/dist/cli.mjs generate-content.ts <transcript.txt> <outDir> [transcript.srt]`).
- `references/` — `mistake-detection.md`, `overlay-triggers.md`, `framing-safe-zones.md`, `frame-analysis.md`.

## Gates (non-negotiable)
1. **P2 mistake review** — present flagged cuts/ramps; the user decides. Never auto-apply.
2. **P4 overlay plan approval** — present the timestamped overlay table; no build until approved.
3. **Preview is always agent-launched** — for both the P2 review and the P5 review, the agent starts `npx hyperframes preview` and opens the browser tab itself. NEVER ask the user to run preview or open a URL.
4. **Explicit-render HARD-GATE** — render runs ONLY on an explicit user render command ("render", "ship it"). After a render, edit requests return to the preview loop and do NOT re-render until the user explicitly says so again. Every render needs its own fresh command. This overrides any "use sane defaults / non-interactive / just ship it" phrasing.

"Use sane defaults" / "don't ask questions" skips the *configuration questions* (P0) and the iteration prompting — it NEVER skips the approval gates, the agent-launched preview, or the explicit-render gate.

## Process

### P0 — Input & configuration
- Input: path to the raw recording (required).
- Optional: a repo/files for real code grounding; visual style/brand (else run the `hyperframes` Visual Identity Gate — detect from the repo, else ask 3 style questions; write `templates/project/DESIGN.md` + brand values into `styles.css`); overlay **density** (sparse / balanced / rich).
- **Single output folder (`<OUT>`):** everything this skill produces lives under ONE folder, default `<recording-dir>/<video-slug>-produced/` (override with a user-supplied path). Create it now. Final structure:
  ```
  <OUT>/
    final.mp4                 # rendered video (P5)
    hyperframes/              # the HyperFrames project: index.html, styles.css, DESIGN.md, compositions/, renders/ (P4–P5)
    transcript.txt            # final edited transcript (P3 / P6)
    transcript.srt
    transcript.words.json
    youtube.md                # P6
    socials.md                # P6
    blog.md                   # P6
    .work/                    # intermediates: 01_desilenced.mp4, 02_edit_N.mp4, frames/ (prunable in P7)
  ```
  All subsequent phases write inside `<OUT>` — never scatter outputs elsewhere. `<work>` below = `<OUT>/.work`.

### P1 — De-silence
```
node scripts/desilence.mjs <input> --out <work>/01_desilenced.mp4 --margin 0.3s
```
Report before/after duration and seconds removed. This becomes the working copy.

### P2 — Mistake & pacing review loop  (approval gate)
1. Transcribe the working copy: invoke `/transcribe-video` on `<work>/01_desilenced.mp4` with `--out <work>` → working transcript (intermediate; superseded by the P3 final transcript).
2. Detect flags per `references/mistake-detection.md` (cuts + speed-ramps), snapped to word boundaries.
3. Scaffold a lightweight hyperframes preview project with the video as the base track; place visually-distinct temporary markers at each flagged span (cut vs ramp, labeled with the excerpt). **Agent starts `npx hyperframes preview` and opens the browser** (per `references/framing-safe-zones.md`).
4. The user picks per span: cut / speed-ramp (factor, default ~1.5–2×) / leave / add their own ranges.
5. Bake selections with auto-editor (cuts `--cut-out s,e …`; ramps `--set-speed-for-range speed,s,e …`, pitch preserved) → `<work>/02_edit_N.mp4`. Re-preview.
6. Loop until the user says "done". Drift guard: after ~10 rounds offer to reset to an earlier intermediate. Final artifact: `<work>/final_cut.mp4`.

Cuts and ramps are baked into the footage HERE (before P3) so the final transcript's word timestamps match the edited timeline.

### P3 — Final transcription
Invoke `/transcribe-video` on `<work>/final_cut.mp4` with `--out <OUT>` so `transcript.txt` / `transcript.srt` / `transcript.words.json` land at the top of the output folder. This word-timestamped transcript is the sync source for all overlays (P4) and the input to content generation (P6).

### P4 — Overlay design & build  (approval gate)
1. **Framing detection** (`references/framing-safe-zones.md`): sample frames with `extract-frame.mjs`, classify phases, confirm phases + safe zones with the user.
2. **Overlay-trigger detection** (`references/overlay-triggers.md`): scan the word-timestamped transcript → overlay plan rows `{start, est_duration, type, content, safe_zone, why}`. For on-screen code, use `references/frame-analysis.md` (extract frame → locate → normalized box → stability guard). For code cards, repo-if-available-else-synthesize (flag synthesized).
3. **Self-improvement pass** (≥2 iterations): honor density, enforce gaps + dwell minimums, validate every overlay against the active phase's safe zone.
4. **Approval gate:** present the timestamped table; user edits/removes/retimes/adds. Synthesized code shown for verification. No build until approved.
5. **Build** (invoke `hyperframes` + `gsap` first):
   - `npx hyperframes init <OUT>/hyperframes --video <OUT>/.work/final_cut.mp4` (the project lives at `<OUT>/hyperframes`; base: video track 0 `muted playsinline`; audio on a separate track at volume 1 so the voice plays). **Read the generated `index.html` to learn this CLI version's sub-composition include syntax.**
   - Copy `templates/project/styles.css` (with the confirmed brand values) into `<OUT>/hyperframes`.
   - For each approved row: instantiate the matching `templates/overlays/*.html`, give it a unique composition id + `data-composition-id`, fill its `{{tokens}}`, set `data-start` = the transcript timestamp and `data-duration` = the dwell, mount it above the video. Punch-in zooms scale the video's WRAPPER div (never the `<video>`).
   - Output dimensions inherit the source recording.

### P5 — Preview & render  (mandatory agent-launched preview + explicit-render gate)
- `npx hyperframes lint` + `npx hyperframes inspect` (overflow + safe zones) + `npx hyperframes validate` (contrast). Fix until clean.
- **Agent starts `npx hyperframes preview` and opens the browser.** Freeform iteration loop on overlays.
- Pre-render audits: every overlay in its phase's safe zone; dwell minimums; no two overlays fighting the same region simultaneously; lint/inspect/validate clean.
- **On the user's explicit render command only:** `npx hyperframes render --output <OUT>/final.mp4` (run from `<OUT>/hyperframes`) → final mp4 with original audio preserved, written to the top of the output folder. After render, further edits return to the loop and require a fresh explicit render command.

### P6 — Content generation (vendored, self-contained)
- Ensure deps once: `pnpm --dir assets/content-gen install` (only if `assets/content-gen/node_modules` is absent). Ensure `assets/content-gen/.env` is configured (copy `.env.example`; OpenAI key or local Ollama) — if unconfigured, ask the user once or skip P6 with a warning (the rendered video is already saved).
- Run on the **final edited transcript** (from P3), writing into `<OUT>` so transcript + content land alongside the video:
  ```
  node assets/content-gen/node_modules/tsx/dist/cli.mjs assets/content-gen/generate-content.ts <OUT>/transcript.txt <OUT> <OUT>/transcript.srt
  ```
  (Use the direct `tsx` path — `pnpm exec` trips its deps-status check.)
- Produces `youtube.md` (title/description/tags/chapters), `socials.md` (X+thread, Bluesky, LinkedIn, Reddit), `blog.md` directly in `<OUT>`.
- If the LLM call fails (auth/network), report it separately — the rendered video is not lost.

### P7 — Cleanup & handoff
- Confirm `<OUT>` contains the consolidated result: `final.mp4`, `hyperframes/`, `transcript.*`, `youtube.md`, `socials.md`, `blog.md`.
- Offer to prune `<OUT>/.work/` (intermediates: de-silenced/cut files, extracted frames). The user owns disposition.
- **Open `<OUT>` in the file explorer for the user** and report the single folder path.

## Requirements
Docker (for `/transcribe-video`), auto-editor + ffmpeg, Node ≥22, a HyperFrames-capable environment, and an LLM provider for P6.
