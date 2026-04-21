---
name: remotion-video
description: Use when the user wants to generate a rendered promotional video (not just a script) for a PR, feature, or product change — produces a Remotion project, iterates with preview, and outputs mp4 + poster for X/LinkedIn/social.
---

# Remotion Video

Turn a PR into a rendered short-form promo video with a hook, code moments, and CTA, using Remotion. Iterate with live preview in Remotion Studio, then render `video.mp4` and `poster.jpg` for X/LinkedIn/social.

Unlike `/video-script` (which produces a textual script), this skill produces the actual video file.

## Triggers

Invoke when the user says: "make a video for this PR", "remotion video", "render a promo video", "video for X/LinkedIn", or when selected from `/marketing-pipeline`.

## Process Flow

```
Resolve input
  → Phase 1: Discovery
  → Phase 2: Configuration
  → Phase 3: Narrative planning
  → Phase 4: Scaffold
  → Phase 5: First draft + iterate
  → Phase 6: Render
  → Phase 7: Cleanup
```

Phases 1, 3, 5, and 7 have explicit approval gates. Phase 2 is an interactive Q&A. Phase 5 is a freeform iteration loop that can run many rounds.

## Input Resolution

Resolve the argument (if provided) in this order:

1. Path to a marketing brief (`.md` containing "Executive Summary" or "Key Messages") → **marketing brief**
2. Path to a blog post (`.md` with blog post structure) → **blog post**
3. Path to a changelog → **changelog**
4. GitHub PR URL or `#\d+` pattern → **PR**
5. Matches `<ref>..<ref>` or `<ref>...<ref>` (alphanumeric + `/`, `_`, `.`, `-` on each side) → **git ref range**
6. Resolves to an existing file/directory → **codebase feature**
7. Otherwise → **freeform text**

If no argument is provided, ask: "What should the video be about? You can provide a PR URL/number, marketing brief, blog post, changelog, git ref range, file/directory path, or just describe the feature."

When invoked from the pipeline with a PR *and* upstream marketing-brief/blog-post paths, read both: PR for technical accuracy, upstream content for positioning/tone.

(Detailed phase specs begin below — see Phase 1.)

## Phase 1: Discovery

### Step 1.1 — Check `remotion-best-practices` availability

Attempt to invoke the `remotion-best-practices` skill via the Skill tool. If unavailable, present:

> "The `remotion-best-practices` skill isn't installed. Options:
> a) proceed with baseline Remotion knowledge (quality may be reduced)
> b) wait while you install it
> c) cancel"

If the user picks (a), emit a warning in the final summary noting reduced quality.

### Step 1.2 — Analyze input

| Input type | What to read |
|---|---|
| Marketing brief | positioning, key messages, audience |
| Blog post | headline, narrative, examples |
| Changelog | highest-impact entry |
| PR | `gh pr view <n> --json title,body,files,labels`, diff (`gh pr diff`), commit messages, linked issues |
| Git refs | `git diff <range>` + `git log <range> --oneline` |
| Codebase path | read the specified files/directories |
| Freeform | parse the user's description |

For PRs with 20+ files, filter to user-facing changes only — skip `tests/`, `ci/`, `.github/`, lockfile changes, dep bumps.

**Error handling:**
- `gh` not available → tell the user, ask for an alternative (diff file, freeform description)
- Invalid PR/ref → ask user to verify
- File not found → ask for the correct path

### Step 1.3 — Read product context

Read if they exist: `README.md`, `docs/`, `package.json`. If nothing found, ask: "Can you briefly describe the product and who it's for?"

### Step 1.4 — Present understanding + get scope confirmation

Present:

> "Here's what I'll base the video on:
> - [feature summary bullet 1]
> - [feature summary bullet 2]
>
> The compelling angle: [proposed story seed in one sentence]
>
> Anything to add, remove, or correct?"

**Do not proceed until the user confirms.**

### Step 1.5 — Sensitive content scan

Before continuing, scan for: security patches, internal pricing, credentials, unreleased roadmap items, content marked confidential. Flag anything questionable to the user.

## Phase 2: Configuration

Ask these questions one at a time, in order.

### Q2.1 — Duration target

> "How long should the video be?
> 1. **30 seconds** (default) — best for X promo, highest completion rate
> 2. **45 seconds**
> 3. **60 seconds** — Fireship-style pace
> 4. **90 seconds**
>
> Duration is a target, not a cap. If the story lands in 27s or stretches to 34s, that's fine — optimize for impact."

### Q2.2 — Aspect ratio

> "Which aspect ratio?
> 1. **16:9 landscape** (1920×1080, default) — desktop X/LinkedIn
> 2. **1:1 square** (1080×1080) — mobile-friendly feed
> 3. **9:16 vertical** (1080×1920) — Reels/Shorts/TikTok
> 4. **Multi-format** — render all three from the same story"

Frame rate is fixed at 30fps (users who need 60fps can edit `remotion.config.ts` post-scaffold).

### Q2.3 — Remotion project location

> "Where should the Remotion project live?
> Default: `marketing/<feature-slug>/remotion/` (fresh per-video)
> Override: specify a path."

### Q2.4 — Brand assets (auto-detect → confirm)

Auto-detect using the heuristics documented in `brand-detection.md`. Present findings as:

> "I found:
> - Logo: `public/logo.svg`
> - Primary: `#0066ff` (from `tailwind.config.js`)
> - Font: `Inter` (from `next/font`)
>
> Use these, customize some, or provide your own?"

**Persistence:** write chosen brand to `.marketing/brand.json` (relative to repo root). On subsequent runs, ask:

> "I loaded brand settings from `.marketing/brand.json`. Use saved, or re-detect?"

**Fallback when nothing detected:** ask explicitly with these neutral defaults. These are intentionally neutral — auto-detection of the project's actual brand is always preferred, and these values should only appear when detection turns up nothing.
- Primary: `#3B82F6` (neutral blue)
- Accent: `#8B5CF6` (neutral violet)
- Background: `#0A0A0A` (near-black, dark mode)
- Text: `#FFFFFF` (white)
- Muted: `#9CA3AF`
- Success: `#22C55E`
- Danger: `#EF4444`
- Font: `Geist` (loaded automatically via `@remotion/google-fonts`)
- Logo: none

Confirm with the user before scaffolding.

**Note on fonts:** The default scaffold loads **Geist** via `@remotion/google-fonts` and wires it into `brand.font.family`. To use a different Google Font, edit `src/fonts.ts` to import from a different `@remotion/google-fonts/<Name>` module. `brand.font.googleFont` is the display name used by the skill to decide which module to load. Non-Google fonts require manual wiring.

## Phase 3: Narrative Planning

### Step 3.1 — Detect story pattern

Scan the PR/input for signals and pick one of 5 patterns. See the detection signals table in `patterns/README.md` — that file is the single source of truth.

Load the matching pattern spec from `patterns/<pattern>.md`.

**Confirm with user:**

> "This looks like an **[API/Library feature]** PR. I'll use that story template. Override? Options: api-library / ui / performance / bugfix / generic / describe a custom pattern"

### Step 3.2 — Decide code sourcing (hybrid)

Per pattern:

- **api-library-feature** → **synthesize** realistic usage examples that show how developers will actually use the feature
- **ui-feature** → **screenshots / mock components** (no code block scenes)
- **performance-win** → metric cards + optional code
- **bug-fix** → before (broken) + after (working) snippets, synthesized if raw diff is noisy
- **generic-fallback** → bullet benefits, no code

Offer user override:

> "For code snippets, I'll **synthesize realistic usage examples** rather than paste raw diff. Override: use-diff / synthesize / mix"

### Step 3.2b — Ground synthesized code in the real library

Before synthesizing usage code for a PR, verify the library's actual public API. Do **not** invent method names, argument shapes, or import paths.

For each snippet the skill plans to include:
1. Locate the real library code locally (e.g., `packages/<name>/src/index.ts`, docs examples in `docs/`, test fixtures in `tests/`).
2. Confirm every imported name exists as exported.
3. Confirm every method/function signature matches (argument names, shape, async vs sync).
4. Prefer patterns from the library's own docs over inferred shapes.

If the library isn't available locally and the skill can't verify, **ask the user** before synthesizing. A wrong API in the first draft destroys user trust and wastes a full iteration round.

### Step 3.3 — Present scene plan for approval

Example output:

> "Here's the plan (30s target):
>
> 1. **HookTitle** (0-3s) — `"Swap validation libs with one line"`
> 2. **ProblemSetup** (3-8s) — 3 libraries, 3 different syntaxes, same task
> 3. **LibrarySwap** (8-22s) — same Standard Schema code, swap zod → valibot → arktype
> 4. **CTAEndScreen** (22-30s) — `"Ship it"` + link to standardschema.dev
>
> Approve or adjust any section?"

**Do not scaffold until the user approves the scene plan.**

See `patterns/README.md` for how patterns map to scene plans.

(Caption emphasis syntax, text alignment, background variants, and code-block theming are governed by the **Layout and Typography Rules** section below.)

## Phase 4: Scaffold

### Step 4.1 — Create the project skeleton

At the location chosen in Q2.3 (default `marketing/<feature-slug>/remotion/`):

```
<project-root>/
├── package.json
├── tsconfig.json
├── remotion.config.ts
├── src/
│   ├── index.ts              # Entry point: registerRoot + font side-effect
│   ├── Root.tsx              # Composition registry
│   ├── Main.tsx              # Scene dispatcher
│   ├── story.ts              # Typed story JSON (written by skill from scene plan)
│   ├── story-types.ts        # Scene union type (source of truth)
│   ├── brand.ts              # Brand tokens (extended palette: primary/accent/background/text/muted/success/danger)
│   ├── fonts.ts              # Loads Geist via @remotion/google-fonts — default font
│   ├── highlight.tsx         # <Highlight text="**word**" /> component for caption emphasis
│   ├── highlighted-code.tsx  # Shiki-based code highlighter
│   ├── scenes/               # Copied from templates/scenes/
│   └── assets/               # Copied logo, intro/outro if any
```

Copy files from `skills/remotion-video/templates/project/` (stripping the `.template` suffix):
- `package.json.template` → `package.json`
- `tsconfig.json.template` → `tsconfig.json`
- `remotion.config.ts.template` → `remotion.config.ts`
- `index.ts.template` → `src/index.ts` (entry point — calls `registerRoot` and imports `./fonts` for side-effect)
- `Root.tsx.template` → `src/Root.tsx`
- `brand.ts.template` → `src/brand.ts` (then populate with Q2.4 values)
- `story-types.ts.template` → `src/story-types.ts` (scene union type — single source of truth)
- `fonts.ts.template` → `src/fonts.ts` (loads Geist by default via `@remotion/google-fonts/Geist`)
- `highlight.tsx.template` → `src/highlight.tsx` (text emphasis helper — renders `**word**` in primary color)
- `highlighted-code.tsx.template` → `src/highlighted-code.tsx` (wraps `shiki` for Remotion async frame capture)
- `scene-background.tsx.template` → `src/scene-background.tsx` (brand-tinted scene wrapper — every scene uses this)
- `Main.tsx.template` → `src/Main.tsx` (scene dispatcher)

Copy all `.tsx` files from `skills/remotion-video/templates/scenes/` into `<project-root>/src/scenes/`.

### Step 4.2 — Install dependencies

Detect package manager from lockfile (`pnpm-lock.yaml` → pnpm, `bun.lockb` → bun, `yarn.lock` → yarn, `package-lock.json` → npm). Install:

```
remotion @remotion/cli @remotion/google-fonts shiki react react-dom typescript @types/react @types/react-dom @types/node
```

Example (pnpm):

```bash
pnpm --dir marketing/<feature-slug>/remotion install
```

### Step 4.3 — Write `story.ts`

Populate from the approved scene plan. The `Story` and `Scene` types are defined in `src/story-types.ts` (copied from `templates/project/story-types.ts.template`). See that file for the full type definitions.

### Step 4.3b — Extend `src/Main.tsx` for Custom scenes

The skill copies `Main.tsx.template` → `src/Main.tsx` in Step 4.1. That base file dispatches all 8 bundled scene types. Whenever a story plan uses a `Custom` scene, the skill must extend the `renderScene` switch in `src/Main.tsx`: add the `import` for the custom component and a `case` for its `componentName` that renders it with its `props` (instead of throwing). The base template throws on Custom so missing dispatch is loud, not silent.

### Step 4.3c — Multi-format registration

When the user picked option 4 (Multi-format) in Q2.2, the skill modifies `src/Root.tsx` to register **three** compositions instead of one, each passing the same `Main` component with a different width/height:

- `MainLandscape` — 1920×1080
- `MainSquare` — 1080×1080
- `MainVertical` — 1080×1920

All three share the same `durationInFrames` and `fps` from `story.meta`. The base `Root.tsx.template` ships with a single `Main` composition by default; the skill replaces that block with the three-composition block when multi-format is selected.

### Step 4.4 — Custom scene extension slot

When the story plan calls for a scene shape the 8 bundled templates can't express, generate a custom scene under `src/scenes/custom/<Name>.tsx`.

**Rules (enforced by the skill):**

1. Only a React component exporting a default function
2. May import only from: `remotion`, `shiki`, `react`, `../../highlighted-code`, `../../scene-background`, and `../../brand`
3. Must typecheck (`tsc --noEmit`) before render — skill runs typecheck and self-corrects up to 2 times on failure
4. Must use `interpolate` / `spring` for animations (no `setTimeout`, no external animation libs)
5. Must respect `durationFrames` from its `Scene` entry
6. Must be registered in `src/Root.tsx` alongside the bundled scenes

Use `remotion-best-practices` skill when available for guidance. Fallback to baseline Remotion docs patterns.

## Phase 5: First Draft + Iterate

### Step 5.1 — Start Remotion Studio

Run as a background process, invoking the scaffolded project via `--dir`:

```bash
pnpm --dir marketing/<feature-slug>/remotion exec remotion studio --port 3000
```

(Fall back: try 3001, 3002, 3003 if 3000 is in use. Fail loud if all taken.)

Capture the URL and present to the user:

> "Studio is running at http://localhost:3000. Open it in your browser and review the first draft.
>
> What do you want to change? (freeform — 'make the hook punchier', 'swap scenes 2 and 3', 'use arktype instead of yup', 'drop the problem scene', 'longer pause on the code', anything you want.)"

### Step 5.2 — Accept freeform feedback → edit → HMR refresh

Parse the user's request and decide which file to edit:

| Request kind | File to edit |
|---|---|
| Content / copy change | `src/story.ts` (scene's `text`, `caption`, `code` fields) |
| Timing / ordering change | `src/story.ts` (reorder array, update `durationFrames`) |
| Visual / animation tweak on a bundled scene | `src/scenes/<Scene>.tsx` |
| Novel visual request the library can't express | `src/scenes/custom/<Name>.tsx` (create new) + `src/Root.tsx` (register) + `src/story.ts` (reference with `{ type: "Custom", componentName: "<Name>", props: {...} }`) |
| Brand change (colors, font, logo) | `src/brand.ts` |

After each edit:

1. Run `pnpm exec tsc --noEmit` silently
2. If typecheck fails, self-correct (up to 2 attempts) before telling the user
3. Remotion Studio HMR reloads automatically — no manual refresh needed

Re-prompt:

> "Saved. Studio should have refreshed. Next change, or ready to render?"

### Step 5.3 — Loop until approved

User signals "ready to render", "looks good", "ship it", "render", "done", or similar → move to Phase 6.

### Step 5.4 — Drift guard

Each iteration stores a snapshot of `src/story.ts` content in an in-memory session history. If the iteration loop hits 10 rounds without approval:

> "We've iterated 10 times. Options:
> 1. Reset to an earlier draft (I'll show the history)
> 2. Keep going
> 3. Render the current draft as-is"

If the user picks (1), show a numbered list of snapshot summaries (hook text of each draft) and let them pick.

## Phase 6: Render

#### Render quality is not optional

The Studio preview is pristine; the render pipeline must preserve that.
Two structural problems ruin h264 output of otherwise-perfect React scenes:

1. **Chroma subsampling (YUV 4:2:0)** halves color resolution. Pink text
   on dark backgrounds, thin colored lines, and subpixel anti-aliasing get
   blurred. The fix is **supersampling**: render at 2x composition
   dimensions (`--scale 2`) so ffmpeg downsamples from a sharper source.

2. **8-bit quantization** gives only 256 luminance steps — gradients band.
   The fix must be **at the source**, not at the codec: `SceneBackground`
   ships a subtle SVG noise overlay (`NoiseDither`) that dithers the
   quantization below perception. 8-bit h264 encoding is the only format
   that plays reliably across Windows 11 Films & TV, Discord, browsers,
   VLC, and social upload pipelines. Do NOT default to 10-bit
   (`yuv420p10le`) — consumer GPU decoders often skip h264 high10 without
   falling back to software, producing black frames on Win11/Discord.

Defaults ship: `--scale 2` + `--image-format png` + `--crf 14` +
`--pixel-format yuv420p`. A 30-40s 1080p video lands around 6-15 MB.

**Edge case — 10-bit opt-in:** the `render:10bit` npm script exists for
creators who verified their end-to-end pipeline supports h264 high10
profile (e.g., shipping to a known YouTube upload that always transcodes,
or to a target audience on mpv/VLC only). Never use as a default.

**Never** render with `--image-format jpeg` for a final. The JPEG
quality-80 intermediate blurs text independently of anything else.

**How `NoiseDither` works:** an overlay layer inside `SceneBackground`
renders an SVG `feTurbulence` fractalNoise filter at ~4% opacity in
overlay blend mode. The noise breaks up the 8-bit gradient-quantization
step boundaries perceptually, turning visible bands into faint grain.
This is the same technique Figma and export pipelines use.

### Step 6.1 — Pre-render checks (fail loud)

Before rendering, all of these must pass. If any fail, report exactly what and where, and do not render.

- [ ] `pnpm exec tsc --noEmit` passes
- [ ] Sum of `scenes[].durationFrames / meta.fps` is within ±15% of the target duration set at Q2.1
- [ ] Every scene with `code` renders without `shiki` errors (test by invoking the shiki highlighter on each snippet)
- [ ] Every brand asset referenced in `src/brand.ts` exists on disk
- [ ] Hook enforcement rules (see `hooks/hook-rules.md`) pass on the HookTitle scene's `text`
- [ ] Render flags include `--scale 2 --pixel-format yuv420p` (or
      `remotion.config.ts` sets both). 10-bit (`yuv420p10le`) is opt-in
      only; it breaks Win11 Films & TV and Discord inline playback.

### Step 6.2 — Render mp4 + poster

Stop the Remotion Studio background process first.

For a single-aspect video:

```bash
pnpm --dir marketing/<feature-slug>/remotion exec remotion render src/index.ts Main out/video.mp4 --codec h264 --crf 14 --image-format png --pixel-format yuv420p --scale 2
pnpm --dir marketing/<feature-slug>/remotion exec remotion still src/index.ts Main out/poster.jpg --frame 0 --image-format png --scale 2
```

For multi-format (user picked 4 in Q2.2), render each composition:

```bash
pnpm --dir marketing/<feature-slug>/remotion exec remotion render src/index.ts MainLandscape out/video-landscape.mp4 --codec h264 --crf 14 --image-format png --pixel-format yuv420p --scale 2
pnpm --dir marketing/<feature-slug>/remotion exec remotion still  src/index.ts MainLandscape out/poster-landscape.jpg --frame 0 --image-format png --scale 2
pnpm --dir marketing/<feature-slug>/remotion exec remotion render src/index.ts MainSquare    out/video-square.mp4    --codec h264 --crf 14 --image-format png --pixel-format yuv420p --scale 2
pnpm --dir marketing/<feature-slug>/remotion exec remotion still  src/index.ts MainSquare    out/poster-square.jpg   --frame 0 --image-format png --scale 2
pnpm --dir marketing/<feature-slug>/remotion exec remotion render src/index.ts MainVertical  out/video-vertical.mp4  --codec h264 --crf 14 --image-format png --pixel-format yuv420p --scale 2
pnpm --dir marketing/<feature-slug>/remotion exec remotion still  src/index.ts MainVertical  out/poster-vertical.jpg --frame 0 --image-format png --scale 2
```

Move artifacts from `<project>/out/` to `marketing/<feature-slug>/`:
- `video.mp4` (or per-aspect files)
- `poster.jpg` (or per-aspect files)

### Step 6.3 — Print summary

```
✓ Rendered: marketing/<feature-slug>/video.mp4 (30s, 16:9, <size>)
✓ Poster:   marketing/<feature-slug>/poster.jpg
```

## Phase 7: Cleanup

Ask the user what to do with the scaffolded Remotion project:

> "Video is ready. What do you want to do with the Remotion project at `marketing/<feature-slug>/remotion/`?
>
> 1. **Keep it** — useful for re-rendering or variants later
> 2. **Delete it** — keep only the mp4 and poster
> 3. **Archive** — move to `marketing/<feature-slug>/remotion.zip` and delete the folder"

Execute the chosen action. End.

## Hook Enforcement Rules

Hard rules applied whenever the skill writes or edits HookTitle scene text. See `hooks/hook-rules.md` and `hooks/hook-patterns.md` for details.

1. **Max 7 words** on the hook caption (string length check)
2. **Blocked openings** — reject if the hook starts with any blocked phrase. See the full list in `hooks/hook-rules.md` (Rule 2).
3. **Required pattern** — the hook must match one of: Result, Mistake, Secret, Comparison, Pattern-interrupt, or Curiosity-gap (see `hooks/hook-patterns.md`)
4. **Visual reinforces text** — the HookTitle scene's `visual` field (`pattern-interrupt` / `curiosity-gap` / `social-proof`) must align with the text (checked at scene-plan approval in Phase 3.3)
5. **Anti-clickbait check** — before render, verify the hook's promise is delivered by at least one non-hook scene. If not, refuse to render and ask the user to adjust.

If any rule fails, the skill proposes up to 3 alternative hooks that comply.

### Layout and Typography Rules

Applied whenever the skill generates or edits any scene.

1. **Backgrounds**: every scene uses `<SceneBackground variant="…">`. Flat background fills are banned — if a scene absolutely needs one, document why in a code comment and pass `variant="flat"` explicitly. Variants: `primary-glow` (radial glow of the brand primary at top-left), `vignette` (dark vignette around the edges for focus scenes), `diagonal` (subtle accent→primary linear gradient), `flat` (no overlay).
2. **Text alignment**:
   - **Centered**: hooks, titles, CTAs, emphatic one-liners
   - **Left-aligned**: lists, prose paragraphs, side-by-side panel labels, code captions
   - Justify only when there's a strong reason; otherwise left or center
3. **Emphasis**: in any `text`, `caption`, `headline`, or other string field passed to a scene, wrap key words in `**word**` so `<Highlight>` renders them in `brand.colors.primary`. Limit 1–2 emphasized runs per caption. Example: `"Mix providers wrong — **ship a landmine**."`
4. **Code blocks**: always render with `<HighlightedCode>`, default `theme="vitesse-dark"`. Container background = `rgba(255,255,255,0.04)` (light overlay on dark bg) with `1px solid rgba(255,255,255,0.08)` border and a brand-primary-tinted `boxShadow`. Never hardcode `#0d1117` or any GitHub-dark-derived color.

### Code Scene Rules

#### Tell a story with chapters

Code scenes (`CodeSnippet`, `BeforeAfter`) should walk the viewer through the code over time, not dump everything at once. Use the `chapters` array on the scene to sequence emphasis:

1. **Imports arrive** — highlight all imports (~3s)
2. **The new import** — zoom to the key import line (~3s)
3. **The usage site** — shift focus to where the import is consumed (~3–4s)
4. **Victory beat** — full clarity, all lines visible (~1–2s)

Non-focused lines dim to ~0.22 opacity with a slight blur; 700ms CSS transitions animate the change. On `BeforeAfter`, the non-focused panel additionally fades (to ~0.35 effective opacity), blurs 1.5px, and scales down slightly, via 600ms transitions.

Rules:
- Give viewers ~3s per chapter (90 frames at 30fps). 1–2s feels rushed — they haven't finished reading before the focus shifts.
- Sum of chapter `durationFrames` should match the scene's `durationFrames`. Extra frames hold on the last chapter; missing frames truncate.
- Each chapter may override the scene's `caption` for a per-beat narration. The caption cross-fades (300ms) when it changes.
- `chapters` is preferred over the static `emphasizedLines` for anything longer than ~3s.

#### Make code fit the slide

- **Single-panel `CodeSnippet`** (full width): lines up to ~75 chars fit comfortably at 36px.
- **Side-by-side `BeforeAfter`** (half width each): lines must stay under **~45–50 chars** at 20px. Long imports and long JSX lines overflow at the original 28px — the template uses 20px with tighter padding (24) as the floor.
- **Break long imports** in side-by-side contexts across two lines — it reads naturally at 20px:
  ```ts
  import { webSearchTool }
    from '@tanstack/ai-anthropic/tools'
  ```
- The `BeforeAfter` Panel ships with `minWidth: 0` on the flex child and `overflow: hidden` on the code container as a safety net, but you should still keep lines short rather than relying on truncation.

#### Render errors as errors

TypeScript diagnostic comments (`// TS2322 ...`, `// ~~~~~~~~~~~~~`, `// TS2345 ...`) are the visual punchline of "wrong provider" / "broken code" scenes. Shiki's default `vitesse-dark` theme renders comments in muted gray, which destroys the signal.

Mark error lines in `story.ts` via `side.errorLines` on a `BeforeAfter` panel — the Panel automatically renders those lines in `brand.colors.danger`, overriding Shiki:

```ts
before: {
  label: "Wrong provider",
  language: "ts",
  code: `...
  //      ~~~~~~~~~~~~~ TS2322
  // Anthropic tool ≠ OpenAI adapter`,
  errorLines: [9, 10],
},
```

Rule of thumb: any line whose comment starts with `TS\d+`, contains squiggle indicators (`~~~~`), or explains why the preceding line is wrong should be an error line.

#### CTA slide rule

The end-screen CTA is the last frame viewers see. It must match the deck's visual language — no outlier treatment.

- Use `<SceneBackground variant="primary-glow">` (same as most other scenes).
- **NO** full-bleed solid-color or gradient backgrounds — they break visual cohesion with every other scene in the deck.
- Headline in `brand.colors.text` (white) with pink/primary `<Highlight>` accents on the key words.
- Action verb in solid `brand.colors.primary` at large weight (160px, 900) with a `textShadow` glow derived from the primary — the primary is the star *against* the dark bg, not fighting a colored background.
- URL pill: translucent white bg (`rgba(255,255,255,0.06)`) + thin primary-tinted border (`hexToRgba(primary, 0.5)`) + subtle primary outer glow (`boxShadow: 0 0 40px hexToRgba(primary, 0.2)`).

#### Format synthesized code for video readability

Video code is displayed at 20-36px on a static frame — not in an IDE with horizontal scroll. Format for that medium, not for what `prettier` would emit.

Rules:

1. **Multi-line arrays when any element spans multiple lines.** If an array element is itself a multi-line call or object literal, put each element on its own line with the brackets on their own lines:

   ```ts
   // Bad — hard to parse at display size
   tools: [webSearchTool({ name: 'web_search', type: 'web_search_20250305' })]

   // Good — readable
   tools: [
     webSearchTool({
       name: 'web_search',
       type: 'web_search_20250305',
     }),
   ]
   ```

2. **Elide configs with `/*…*/`** when the config shape isn't the point of the scene. A video has ~2–4 seconds per chapter — don't spend those seconds on boilerplate:

   ```ts
   // Good — highlights the tool, not its config
   tools: [computerUseTool(/*…*/)]
   ```

3. **Break long imports across lines in side-by-side scenes.** At 20px font with ~50% of the slide width, imports longer than ~45 chars overflow. Pre-break them:

   ```ts
   import { computerUseTool }
     from '@tanstack/ai-anthropic/tools'
   ```

4. **No trailing semicolons in captions that reference line numbers.** Line numbers in `chapters[].lines` are 1-indexed over the raw template string — every newline matters for accurate line-number references.

#### Choose meaningful wrong/right comparisons

For `BeforeAfter` scenes that show a compile error → fix, pick a comparison that teaches something non-obvious:

- **Weak**: "wrong provider's tool with a different provider's adapter" — viewers already expect this to fail; it's not a surprise.
- **Strong**: "same tool, two different models of the same provider" — shows that the library's type system is *per-model*, not just *per-provider*. This is the insight most devs don't expect.
- **Strong**: "old API vs new API on the same feature" — shows the migration path and the diagnostic UX.

The compile error is the punchline; make sure the setup earns it. Look at the library's actual capabilities map (e.g., `<Provider>ChatModelToolCapabilitiesByName`) for real model/tool mismatches that exist in the current release — don't fabricate mismatches that wouldn't actually fire.

## Error Handling

| Failure | Response |
|---|---|
| `gh` CLI not available | Tell user, offer alternative input (diff file / freeform description) |
| Invalid PR or ref | Ask user to verify |
| Node / package manager not available | Fail loud, tell user what to install |
| `remotion-best-practices` missing | Per Phase 1.1: offer (a) proceed, (b) install, (c) cancel |
| Typecheck fails after 2 self-correct attempts | Show the error, ask user to describe the fix in freeform, retry |
| Render crashes | Show Remotion's error; offer (a) retry, (b) simplify the failing scene, (c) abort |
| Port 3000 in use | Try 3001, 3002, 3003 in order; fail loud if all taken |
| Studio background process crashes mid-iteration | Restart once; if it crashes again, surface the error and ask user |
| Brand auto-detection finds nothing | Ask user explicitly with sensible defaults (see Phase 2.4 fallback block for the full primary/accent/background/text/font/logo list) |
| Entry point missing (studio fails with "No Remotion entrypoint was found") | Skill forgot to copy `index.ts.template` during scaffold — recopy from templates and retry |
| Font not rendering at runtime (text shows in fallback sans-serif) | `src/fonts.ts` wasn't imported for side-effect by `src/index.ts` — verify the `import "./fonts"` line is present |

## What This Skill Does NOT Do

- Write blog posts, social copy, changelogs, or scripts (separate skills exist)
- Upload the video anywhere
- Generate thumbnails beyond the first-frame poster
- Handle voiceover or audio (silent + captions only)
- Maintain a cross-project asset library (every video scoped to its own directory; `.marketing/brand.json` is the only shared state)
- Re-run on previously-rendered videos without user invocation
- Make editorial judgments about whether a PR is worth a video — if invoked, it runs
