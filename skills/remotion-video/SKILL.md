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

### Step 3.0 — Derive the signature motif from context

Before picking a story pattern, identify the **signature visual motif** that will carry the narrative across scenes. This is the single most important call for not looking generic.

1. **Finish this sentence in one verb**: "This feature lets developers ___ something."
   - Examples: *compose* music, *sync* state, *validate* inputs, *secure* tokens, *deploy* functions, *route* requests.
2. **Translate the verb into a physical / spatial metaphor**: a waveform for audio composition, packets traveling edges for sync, squiggle underlines for type validation, a padlock for auth, a rocket/checkpoint line for deploy, a switchboard for routing.
3. **Pick the state-change axis**: the motif must visibly change between Problem and Solution scenes (broken ↔ unified, empty ↔ full, disconnected ↔ connected). Pick ONE axis and hold it across the video.
4. **Look up the motif** in `references/visual-motifs.md` — the catalog maps 20+ common verbs to motifs, state axes, and example custom elements. If the verb isn't listed, apply the heuristic in that file.

**Confirm with user:**

> "The core verb is **compose music**, so I'll use an **animated waveform** as the signature motif — smooth/clean in the hook and solution, jagged/red in the problem. This thread will appear in scenes 1, 2, and 4. Approve, pick a different motif, or let me propose alternatives?"

Do NOT skip this step. A video without a derived motif defaults to generic bullet-list storytelling and fails the generic test (Storytelling Rule 10).

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

Before presenting, **self-audit the plan against these rules**. Do not skip — failing any of them silently is the fastest path to a generic video:

1. **Per-scene payoff**: for each scene, write one sentence of the form *"The new thing a viewer knows at the end of this scene is ___."* If two scenes produce the same sentence, one is redundant — merge or cut. If a scene's sentence is vague (e.g., *"the product is good"*), the scene is filler — redesign.
2. **Pacing variance**: scene durations must reflect cognitive load, not a uniform slice. Targets for a 30s video:
   - Hook: 2.5–3.5s (a single punch)
   - Problem / setup: 4–6s (enough to land one concrete claim)
   - Delivery (code / swap / comparison): 12–16s, with internal chapters if >~8s
   - CTA: 5–8s (breathes, doesn't rush)

   Reject plans where the shortest and longest scene differ by less than ~2×. Equal-slice plans are the single strongest "AI-generated" tell.
3. **Value prop by ~t=8s**: by the end of scene 2, the viewer must know what the feature does, who it's for, and why it matters. If that's not true with the current plan, restructure before scaffolding. Do NOT bury the value in the delivery scene.
4. **Motif presence and state-change**: the signature motif chosen in Phase 3.0 must appear in at least 2 scenes (typically 3: hook + problem + CTA) and visibly change state between at least one adjacent pair (e.g., clean → glitchy → clean again).

Example output:

> "Here's the plan (30s target):
>
> 1. **HookTitle** (0–3s, 90f) — `"Swap validation libs with one line"`
>    — *payoff: there's one line that replaces N SDKs*
> 2. **ProblemSetup** (3–8s, 150f) — three evidence cards with concrete conflicting API shapes
>    — *payoff: viewer sees the real API-shape conflict they live with today*
> 3. **LibrarySwap** (8–22s, 420f) — shared Standard Schema code, import line cycles zod → valibot → arktype
>    — *payoff: viewer sees the "one line change" literally happen on screen*
> 4. **CTAEndScreen** (22–30s, 240f) — `"Ship it"` + link to standardschema.dev
>    — *payoff: viewer knows exactly where to go next*
>
> Pacing: hook 3s / problem 5s / delivery 14s / CTA 8s (ratio ~4.7×) — passes variance check.
> Motif: schema-interop glyph (interlocking rings) appears in scenes 1, 2, 4; rings are disconnected in scene 2, unified in 1 and 4.
>
> Approve or adjust any section?"

**Do not scaffold until the user approves the scene plan.**

See `patterns/README.md` for how patterns map to scene plans.

### Step 3.4 — Plan scene transitions (match-cuts)

Hard cuts between scenes are acceptable; **match-cuts are what make a video feel crafted**. When the signature motif (Phase 3.0) appears in adjacent scenes, the motif must carry over as a match-cut, not restart from zero.

Rules:

1. When the same motif component appears in scene N and scene N+1, render it in the last ~8 frames of scene N with the entering state of scene N+1 already beginning. The motif's position, scale, and core geometry must be continuous across the cut — only its *state* (color, amplitude, opacity, shape) changes.
2. When adjacent scenes use different motifs, a text/background element may bridge them: e.g., the last word of scene N's tagline becomes the first word of scene N+1's caption, kept at the same position during the transition.
3. When scenes have NO common element, use a directional motion cue — a brand-primary bar sweeping left-to-right that covers the cut — never a generic fade-to-black.
4. `SceneBackground` variant must change between adjacent scenes (no two adjacent scenes share a variant). This is enforced at pre-render.

Write the planned transitions into the scene plan before scaffolding:

> Transition 1→2: waveform carries over at the same position; color fades from brand.primary → brand.danger; amplitude jitters from smooth to glitchy over 8 frames.
> Transition 2→3: glitch waveform contracts into a flat line → that line becomes the top border of the code card in scene 3.
> Transition 3→4: active-provider pill in scene 3 slides down and morphs into the URL pill of the CTA.

### Step 3.5 — UI moment (when a UI surface exists)

If the feature has a visible UI surface — a generated image, a rendered audio player, a dashboard, a settings toggle, a diff view — the video must include at least one beat that shows that surface. Research on product-launch video is consistent: "show the product in action" is the strongest single predictor of viewer recall.

Options (in order of preference):

1. **Real screen capture**: a short 2–3s clip of the feature running in the example app. Embedded via `<Video src={...}/>` in a Custom scene.
2. **Static screenshot with kinetic overlay**: a high-res shot of the UI with brand-primary-tinted call-out boxes or arrows animating in. Easiest to author; works for any UI.
3. **Mock UI rendered in React**: a stylized recreation of the UI inside the scene — buttons, progress bars, output previews — using only the scene's brand palette. Preferred when no screen capture is available and the UI is simple enough to fake convincingly.

Place the UI moment in the delivery scene (Scene 3 in the default structure), ideally at its midpoint so the viewer gets code-plus-result. A code-only delivery feels like a reference doc; code-plus-UI feels like a demo.

Skip this step only if the feature is purely API-level with no user-visible surface (a parser, a compiler pass, a type-level utility).

### Step 3.6 — Per-aspect narrative adjustment (multi-format)

When the user picked option 4 (Multi-format) in Q2.2, the skill must plan **per-aspect narrative variants** — a 9:16 vertical video is not just a cropped 16:9.

Adjustments to apply:

- **Text size**: the vertical variant needs ~30% larger text at the same reading distance. Caption font sizes that work at 48px on 16:9 need to move to ~60px on 9:16.
- **Horizontal-heavy scenes**: side-by-side `BeforeAfter`, multi-pill pill rows, and wide `LibrarySwap` layouts must switch to stacked (top/bottom) or single-item-at-a-time layouts on 9:16. Mark these scenes with an `aspectOverrides` hint during scene planning.
- **Motif sizing**: waveform/thread widths should scale with composition width, not be hardcoded. Review any reusable motif component for responsive sizing before scaffolding.
- **Pacing**: vertical-first platforms (Reels, TikTok) favor a faster cut rhythm than desktop X/LinkedIn. Consider shaving 3–5s from a 30s landscape plan when producing the 9:16 variant.
- **CTA URL placement**: URL pills are harder to scan on narrow aspects — consider shortening the URL shown (e.g., `tanstack.com/ai` instead of `https://tanstack.com/ai/audio-generation`) for 9:16.

Write the per-aspect deltas into the scene plan as a short section, even if most scenes render identically. Example:

> **9:16 deltas**: Scene 3 `LibrarySwap` stacks the code card above the provider pills (same content, vertical flow). Caption font +30%. Total duration shaved to 26s (hook 2.5s / problem 4s / delivery 12s / CTA 7.5s).

Skip this step if the user picked a single aspect.

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
- `shiki-theme.ts.template` → `src/shiki-theme.ts` (brand-derived Shiki theme — keywords in primary, strings in accent, comments in muted, background transparent)
- `highlighted-code.tsx.template` → `src/highlighted-code.tsx` (wraps `shiki` for Remotion async frame capture; defaults to `brandShikiTheme`)
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

The skill copies `Main.tsx.template` → `src/Main.tsx` in Step 4.1. That base file dispatches all 9 bundled scene types. Whenever a story plan uses a `Custom` scene, the skill must extend the `renderScene` switch in `src/Main.tsx`: add the `import` for the custom component and a `case` for its `componentName` that renders it with its `props` (instead of throwing). The base template throws on Custom so missing dispatch is loud, not silent.

**UIShowcase note**: When a `UIShowcase` scene references a `mockComponent` (instead of or in addition to `mediaSrc`), the skill must extend the `UIShowcase` dispatch case in `Main.tsx` to resolve the component name to an actual React element and pass it as the `mockComponentNode` prop. The default dispatch only handles `mediaSrc` (image/video files). Mock-component UI mocks follow the same "skill extends the switch" pattern as `Custom` scenes.

### Step 4.3c — Multi-format registration

When the user picked option 4 (Multi-format) in Q2.2, the skill modifies `src/Root.tsx` to register **three** compositions instead of one, each passing the same `Main` component with a different width/height:

- `MainLandscape` — 1920×1080
- `MainSquare` — 1080×1080
- `MainVertical` — 1080×1920

All three share the same `durationInFrames` and `fps` from `story.meta`. The base `Root.tsx.template` ships with a single `Main` composition by default; the skill replaces that block with the three-composition block when multi-format is selected.

### Step 4.4 — Custom scene extension slot

When the story plan calls for a scene shape the 9 bundled templates can't express, generate a custom scene under `src/scenes/custom/<Name>.tsx`.

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

**Technical checks:**

- [ ] `pnpm exec tsc --noEmit` passes
- [ ] Sum of `scenes[].durationFrames / meta.fps` is within ±15% of the target duration set at Q2.1
- [ ] Every scene with `code` renders without `shiki` errors (test by invoking the shiki highlighter on each snippet)
- [ ] Every brand asset referenced in `src/brand.ts` exists on disk
- [ ] Render flags include `--scale 2 --pixel-format yuv420p` (or `remotion.config.ts` sets both). 10-bit (`yuv420p10le`) is opt-in only; it breaks Win11 Films & TV and Discord inline playback.

**Storytelling audit (refuse to render if any fail — report to user and ask for a fix before proceeding):**

- [ ] Hook enforcement rules (see `hooks/hook-rules.md`) pass on the HookTitle scene's `text`
- [ ] **Motif presence**: the signature motif from Phase 3.0 appears in ≥2 scenes (check by grepping the motif component's import across `src/scenes/`)
- [ ] **State-change observed**: the motif's visual state (color, amplitude, geometry, opacity) differs between at least one adjacent scene pair — not identical across the whole deck
- [ ] **Pacing variance**: `max(scene.durationFrames) / min(scene.durationFrames) ≥ 2.0`. Uniform-duration plans refuse to render.
- [ ] **Value prop by ~t=8s**: sum of the first two scenes' durations is ≤ `0.30 × total duration`. If more than 30% of the video elapses before scene 3 begins, the value prop is buried.
- [ ] **No adjacent-scene background repeat**: consecutive scenes must use different `SceneBackground` variants (prevents the "same color for 15 seconds" flatness)
- [ ] **UI moment when applicable**: if the feature has a user-visible surface, at least one scene must include a UI showcase (screen capture, screenshot with overlay, or mock UI). See Phase 3.5.
- [ ] **Per-scene payoff**: every scene has a recorded payoff sentence from Phase 3.3. If any is missing, blank, or duplicates another, refuse.
- [ ] **Anti-clickbait**: the hook's promise is delivered by at least one non-hook scene (existing rule).
- [ ] **Transitions planned**: for each adjacent scene pair sharing a motif, a match-cut is described in the scene plan (Phase 3.4).

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

## Storytelling & Visual Uniqueness Rules

The default failure mode of an AI-generated promo video is *generic*: a hook, three bullet points, a code block, a CTA. Every scene stacked vertically, same rhythm, same layout language as ten thousand other "new feature launch" reels. Viewers scroll past in under 2 seconds. Technically correct ≠ memorable.

These rules exist to push back against that default.

### Rule 1: No plain bullet lists

A vertical stack of bullet points with icons is the most overused and forgettable scene shape in dev-marketing video. When the story asks for a "list of pains / benefits / reasons", the skill MUST transform the list into a structure that *visualizes what it's saying*:

- Fragmented APIs? Tilted "evidence cards" with real conflicting property names, connected by broken-chain glyphs (`≠`, `↯`).
- Slow-vs-fast? A physical race lane with two markers at different frame-sync'd positions.
- Many → one? Scattered inputs flying inward into a single funnel.
- Three providers compete? Provider logos or name pills with active-state indicators and crossfade swaps.

Every beat should ideally have a form that *only makes sense for that beat*. If the same bullet shape could hold "our five pillars of happiness" or "three reasons our API is fast", it is too generic — redesign it.

### Rule 2: Build a signature visual thread

Every promo video should have one recurring visual element tied to the subject matter — a "thread" that appears in 2–4 scenes (typically hook, problem, and CTA) and carries the theme.

The motif is **derived in Phase 3.0** from the product's core verb. See `references/visual-motifs.md` for the full catalog (20+ verb → motif mappings) and the heuristic for deriving a motif when the verb isn't listed.

Key principles (full detail in the catalog):
- The motif should be the *physical / spatial metaphor* for what the product does, not a decorative element. Stripe's gradients = money flowing. Linear's lines = motion. The test: would this motif make sense on an unrelated product? If yes, it's generic.
- The motif must **change state** between scenes to do narrative work. A clean magenta waveform in the hook becoming a jagged red glitch-wave in ProblemSetup, then resolving back to a confident unified wave in the CTA, delivers a complete three-act arc without a single caption.
- Motif reappearance with a new state is the oldest trick in cinematic storytelling (stairs in *Parasite*, mirrors in *Black Swan*). Same element, different meaning each time.

When scaffolding, create a reusable component (e.g., `src/audio-waveform.tsx`, `src/speed-streak.tsx`, `src/packet-flow.tsx`) in the project root and import it into each relevant scene. Never rebuild the thread scene-by-scene.

### Rule 3: Custom scenes over bundled, when it matters

The 9 bundled scenes (`HookTitle`, `ProblemSetup`, `CodeSnippet`, `LibrarySwap`, `BeforeAfter`, `MetricCompare`, `BulletList`, `CTAEndScreen`, `UIShowcase`) cover ~80% of cases and should be used when the story fits. They should NOT be the excuse for a lazy story.

If a beat's visual shape would be unique and memorable, create a `Custom` scene under `src/scenes/custom/<Name>.tsx` rather than bending a bundled scene into something it isn't. Examples that warrant Custom scenes:

- A split-screen showing two API shapes side by side with a rotating "≠" between them
- A synchronized pair of animations where one depends on the other (input → output pipeline)
- A physics-driven element (spring-chained cards falling into place, orbiting nodes)
- A kinetic-typography moment (words swapping in place, letters re-arranging)

The rule of thumb: if your first instinct is "I'll just use `BulletList`" and the content is interesting, stop. Either upgrade to a Custom scene or upgrade the bundled scene's *internal* storytelling (tilts, connection glyphs, staggered physics, per-item glyph variation).

### Rule 4: Replace abstract prose with concrete evidence

Inside any scene that describes a pain or a benefit, prefer *real, verifiable detail* over abstract claims. This makes the video technically credible and visually unique because the evidence IS the design element.

| Abstract (generic) | Concrete (unique + credible) |
|---|---|
| "Every provider is different" | `music_length_ms` vs `seconds_total` vs `duration` shown side-by-side |
| "Our SDK is type-safe" | A screenshot-like TS diagnostic with red squiggles on the bad line |
| "10× faster" | Two progress bars racing, finishing at t=500ms and t=50ms |
| "Works anywhere" | Animated pills of the supported runtimes lighting up in sequence |

When pulling evidence from a PR or codebase, quote the actual symbol names, parameter names, or model ids that appear in the source. If a viewer who uses those libraries recognizes the exact string you're showing, you've won credibility and memorability in the same frame.

### Rule 5: Animate with intent, not with defaults

Every animation should deliver information, not just "look animated". If removing an animation would not change what the viewer understands, it is decoration and should be reconsidered.

Good:
- **Text fades in AFTER the headline lands** → tells the viewer "the headline is the promise; what follows delivers it"
- **Cards stagger-enter at different tilts** → creates a "chaos / fragmentation" feel that matches the message
- **Waveform amplitude rises when a provider pill becomes active** → shows "this one is now playing"

Bad:
- All elements fade in together with identical timing (no narrative layer)
- Arbitrary bounces on every text element (dilutes emphasis)
- Continuous looping animations on every background element (fatigues the viewer)

### Rule 6: Fly-in taglines as insight delivery

After any multi-beat scene (evidence wall, problem pile-up, comparison), the viewer needs a one-line synthesis to carry forward. Reserve the last 25–35% of a scene's duration for a fly-in tagline that states the insight:

- After "three conflicting APIs" → "Same goal. Different shapes."
- After "three slow steps" → "That's a full coffee break."
- After "five different SDKs" → "Five SDKs to learn. Or one."

The tagline should:
- Land AFTER all the evidence has arrived (don't overlap with stagger-in)
- Use distinct styling from the beats (different font weight or color — typically lower saturation so it reads as "narrator voice, not beat")
- Be ≤ 6 words per half, ≤ 2 halves

This is the single biggest lever for turning "nice visual" into "actually communicates a point".

### Rule 7: Motion with a payload — kinetic type restraint

Research on high-performing kinetic typography and motion graphics is consistent: **text moves only when motion adds clarity**, never because there's a 3-second hole to fill. Motion without a payload is the single biggest "looks AI-generated" tell.

Good motion choices:
- A word scales up because it's the answer the previous scene teed up
- Letters slide in one-by-one because the sequence *is* the message ("M · U · S · I · C" on a music feature)
- A headline morphs into a different headline because the topic shifted

Bad motion choices (generic):
- Every headline bouncing into place with the same ease on every scene
- Continuous shimmer/pulse/loop on every text layer (visual fatigue, no signal)
- Emoji or icon wobble without a narrative reason
- Every letter fading in one-by-one on every text element — reserve that for the one letter-by-letter beat of the video

Counter-expectation is underused: when the default register is fast-and-loud, going **still-and-soft** for one beat can land harder than any spring animation. If the surrounding scenes are busy, let the insight tagline (see Rule 6) sit dead-still for 1.5 seconds.

### Rule 8: Color script — emotion across scenes, not palette within one

The brand palette is static; a **color script** is the scene-to-scene emotional arc layered on top. Individual scenes should feel different from each other along a temperature or saturation dimension:

- **Hook** — warm, on-brand, confident (`SceneBackground variant="primary-glow"`)
- **Problem** — cooler, red-accented, tense (`variant="vignette"` with a danger-colored overlay or glitch accent)
- **Solution / LibrarySwap / BeforeAfter** — transitional, forward-leaning (`variant="diagonal"`)
- **CTA** — return to warm, saturated, resolved (`variant="primary-glow"` again)

The arc should support the narrative ("confident → tense → resolved"). A problem scene that uses the same warm glow as the hook robs the narrative of its tension beat. A CTA that stays cool/red reads as unresolved.

Implementation: the existing `SceneBackground` variants are the lightweight color-script surface. For a more cinematic arc, nudge the `hexToRgba` alphas, add a `brand.colors.danger`-tinted overlay in Problem scenes, or add a subtle saturation boost in the CTA.

### Rule 9: First-10-seconds value prop

By the ~10-second mark, the viewer must know (a) what this feature does, (b) who it's for, (c) why it matters. This is a research finding from every major product-launch-video study: the single strongest predictor of completion rate is value clarity before the ~10s mark.

Mapping to the standard 30s structure:
- Hook (0–3s): promises the value
- ProblemSetup (3–8s): reveals the stakes / gives the "why"
- LibrarySwap or CodeSnippet (8–22s): delivers the "how"
- CTA (22–30s): converts

During Phase 3.3 (scene-plan approval), explicitly self-check: "By the end of scene 2 (around t=8s), does the viewer know what the product does and why?" If no, the scene plan is wrong — restructure before scaffolding. Don't bury the value in the LibrarySwap.

### Rule 10: The generic test

Before rendering, run this self-check against every scene. If the answer to ANY is "no", the scene is generic and should be redesigned:

1. Could I swap the topic from "audio generation" to "image generation" and this scene would look identical?
2. Does every visual element in this scene have a reason to exist that ties to THIS story?
3. Is there at least one element per scene a viewer would remember 10 minutes later?

If a scene fails the test, the fix is rarely "change the copy". It's a layout or visual-element change: add a signature thread appearance, introduce a domain-specific glyph, replace a bullet with a concrete evidence card, pull a real symbol name from the source.

## Hook Enforcement Rules

Hard rules applied whenever the skill writes or edits HookTitle scene text. See `hooks/hook-rules.md` and `hooks/hook-patterns.md` for details.

1. **Max 7 words** on the hook caption (string length check)
2. **Blocked openings** — reject if the hook starts with any blocked phrase. See the full list in `hooks/hook-rules.md` (Rule 2).
3. **Required pattern** — the hook must match one of: Result, Mistake, Secret, Comparison, Pattern-interrupt, Curiosity-gap, or Visual-hook (see `hooks/hook-patterns.md`)
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
4. **Code blocks**: always render with `<HighlightedCode>`. The default `theme` is `brandShikiTheme` (from `src/shiki-theme.ts`) — a theme derived from `brand.ts` colors so syntax tokens match the rest of the presentation (keywords in `brand.primary`, strings in `brand.accent`, comments in `brand.muted`, background transparent). Do NOT fall back to `vitesse-dark`, `github-dark`, or any other stock theme unless the brand is explicitly monochrome. If the brand palette shifts, regenerate — never hardcode `#0d1117` or any GitHub-dark-derived color. Container background = `rgba(255,255,255,0.04)` with `1px solid rgba(255,255,255,0.08)` border and a brand-primary-tinted `boxShadow`.
5. **Spacing rhythm — harmony, not extremes**: follow a single consistent scale across every scene so the eye doesn't have to relearn the layout. Defaults that work:
   - **Scene padding**: 80–100px outer
   - **Title → next element**: 72–80px (titles always get breathing room; never ≤48px gap — text crowds into the thing below)
   - **Peer content elements** (cards, code block and pills, caption and content): 40–56px
   - **Tight pairs** (glyph+text, number+label): 16–24px
   - **Ambient decorations** (waveforms, background particles): position absolutely with ≥70px edge inset and low opacity (≤0.5); never place them within ~100px of a focal element
   
   If a layout feels "too airy", the gap is probably ≥120px between peers — tighten to the 40–56px band. If a title feels "stuck to" what's below, the gap is ≤48px — push to 72+. When in doubt, pick ONE scale and use it everywhere; inconsistent gaps look more "generic AI slideshow" than any single choice.

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

TypeScript diagnostic comments (`// TS2322 ...`, `// ~~~~~~~~~~~~~`, `// TS2345 ...`) are the visual punchline of "wrong provider" / "broken code" scenes. Any dark theme (the default `brandShikiTheme`, `vitesse-dark`, etc.) renders comments in a muted color, which destroys the signal.

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
