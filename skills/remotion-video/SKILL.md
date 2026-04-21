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

Each phase has an approval gate. Phase 5 is a freeform loop that can run many rounds.

## Input Resolution

Resolve the argument (if provided) in this order:

1. Path to a marketing brief (`.md` containing "Executive Summary" or "Key Messages") → **marketing brief**
2. Path to a blog post (`.md` with blog post structure) → **blog post**
3. Path to a changelog → **changelog**
4. GitHub PR URL or `#\d+` pattern → **PR**
5. Contains `...` or `..` → **git ref range**
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

**Auto-detection sequence:**

1. **Logo:** glob `public/logo.{svg,png}`, `assets/logo.*`, `static/logo.*`, `apps/*/public/logo.*`, favicon
2. **Primary color:** search `tailwind.config.{js,ts,mjs}` for `primary`, CSS files for `--primary`, any `brand.json` / `design-tokens.json`
3. **Accent / background / text colors:** same sources
4. **Font family:** `package.json` dependencies for font packages (`@fontsource/*`, `next/font`), Tailwind `fontFamily`, Google Fonts imports
5. **Intro/outro clips:** glob `marketing/intro.*`, `marketing/outro.*`, `assets/intro.*`, `assets/outro.*`

**Present findings:**

> "I found:
> - Logo: `public/logo.svg`
> - Primary: `#0066ff` (from `tailwind.config.js`)
> - Font: `Inter` (from `next/font`)
>
> Use these, customize some, or provide your own?"

**Persistence:** write chosen brand to `.marketing/brand.json` (relative to repo root). On subsequent runs, ask:

> "I loaded brand settings from `.marketing/brand.json`. Use saved, or re-detect?"

**Fallback when nothing detected:** ask explicitly with sensible defaults (black `#000` text, white `#fff` background, system font, no logo).

See `brand-detection.md` for full heuristics.

## Phase 3: Narrative Planning

### Step 3.1 — Detect story pattern

Scan the PR/input for signals and pick one of 5 patterns:

| Signal | Pattern |
|---|---|
| Public API / types / exports change | `api-library-feature` |
| UI component files, Storybook updates, CSS changes | `ui-feature` |
| Perf keywords in title (ms, throughput, speedup, faster), benchmark files | `performance-win` |
| "fix" in title, bug labels, issue links | `bug-fix` |
| None of the above | `generic-fallback` |

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

See `patterns/README.md` for how patterns map to scene sequences.

## Phase 4: Scaffold

### Step 4.1 — Create the project skeleton

At the location chosen in Q2.3 (default `marketing/<feature-slug>/remotion/`):

```
<project-root>/
├── package.json
├── tsconfig.json
├── remotion.config.ts
├── src/
│   ├── Root.tsx              # Composition registry
│   ├── story.ts              # Typed story JSON (written by skill from scene plan)
│   ├── brand.ts              # Brand tokens (written by skill from Q2.4)
│   ├── scenes/               # Copied from templates/scenes/
│   └── assets/               # Copied logo, intro/outro if any
```

Copy files from `skills/remotion-video/templates/project/` (stripping the `.template` suffix):
- `package.json.template` → `package.json`
- `tsconfig.json.template` → `tsconfig.json`
- `remotion.config.ts.template` → `remotion.config.ts`
- `Root.tsx.template` → `src/Root.tsx`
- `brand.ts.template` → `src/brand.ts` (then populate with Q2.4 values)
- `story-types.ts.template` → `src/story-types.ts` (scene union type — single source of truth)

Copy all `.tsx` files from `skills/remotion-video/templates/scenes/` into `<project-root>/src/scenes/`.

### Step 4.2 — Install dependencies

Detect package manager from lockfile (`pnpm-lock.yaml` → pnpm, `bun.lockb` → bun, `yarn.lock` → yarn, `package-lock.json` → npm). Install:

```
remotion @remotion/cli @remotion/shiki @remotion/google-fonts react react-dom typescript @types/react @types/node
```

Example (pnpm):

```bash
cd marketing/<feature-slug>/remotion && pnpm install
```

### Step 4.3 — Write `story.ts`

Populate from the approved scene plan. The `Story` type is defined in `src/story-types.ts`:

```ts
export type Story = {
  meta: {
    durationSeconds: number;
    aspectRatio: "16:9" | "1:1" | "9:16";
    fps: 30 | 60;
    slug: string;
  };
  brand: Brand;
  scenes: Scene[];
};

export type Brand = {
  logoPath?: string;
  colors: { primary: string; accent: string; background: string; text: string };
  font: { family: string; googleFont?: string };
  introPath?: string;
  outroPath?: string;
};

export type SceneContent = { label: string; code?: string; language?: string };
export type Metric = { label: string; value: string };

export type Scene =
  | { type: "HookTitle"; durationFrames: number; text: string; visual: "pattern-interrupt" | "curiosity-gap" | "social-proof"; }
  | { type: "ProblemSetup"; durationFrames: number; text: string; visualBeats: string[]; }
  | { type: "CodeSnippet"; durationFrames: number; language: string; code: string; highlightLines?: number[]; caption?: string; }
  | { type: "LibrarySwap"; durationFrames: number; sharedCode: string; libraries: { name: string; importLine: string }[]; caption?: string; }
  | { type: "BeforeAfter"; durationFrames: number; before: SceneContent; after: SceneContent; caption?: string; }
  | { type: "MetricCompare"; durationFrames: number; before: Metric; after: Metric; caption?: string; }
  | { type: "BulletList"; durationFrames: number; items: string[]; caption?: string; }
  | { type: "CTAEndScreen"; durationFrames: number; headline: string; actionVerb: string; url?: string; }
  | { type: "Custom"; durationFrames: number; componentName: string; props: Record<string, unknown>; };
```

### Step 4.4 — Custom scene extension slot

When the story plan calls for a scene shape the 8 bundled templates can't express, generate a custom scene under `src/scenes/custom/<Name>.tsx`.

**Rules (enforced by the skill):**

1. Only a React component exporting a default function
2. May import only from: `remotion`, `@remotion/shiki`, `@remotion/google-fonts`, `react`, and `../../brand`
3. Must typecheck (`tsc --noEmit`) before render — skill runs typecheck and self-corrects up to 2 times on failure
4. Must use `interpolate` / `spring` for animations (no `setTimeout`, no external animation libs)
5. Must respect `durationFrames` from its `Scene` entry
6. Must be registered in `src/Root.tsx` alongside the bundled scenes

Use `remotion-best-practices` skill when available for guidance. Fallback to baseline Remotion docs patterns.
