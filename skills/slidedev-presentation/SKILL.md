---
name: slidedev-presentation
description: Use when the user wants a Slidev deck, 2D slides, slides.md, or a conference talk that is not a 3D world. Triggers on "slidev deck", "make slides", "2D presentation". If they say "make a presentation" and do not name Slidev, Three.js, 3D, or a world, ask once: Slidev or Three.js world. Don't use for Three.js / spatial / world talks (threejs-presentation) or raw Slidev syntax (official slidev skill).
---

# slidedev-presentation — Slidev decks

A **director** on top of Slidev. Load `presentation` for research, interview,
craft, and the storyboard gate. This skill owns scaffolding, theme, `slides.md`,
screenshot verify, and the live finish.

## When to use

- The user wants a Slidev deck, 2D slides, or `slides.md`.
- Revising an existing Slidev project.

## When to skip

- Three.js / 3D / world talk → `threejs-presentation`.
- Raw Slidev syntax only → official `slidev` skill.
- A one-off non-deck answer → just answer.

If the user says "make a presentation" and does not name a medium, ask once:
Slidev or Three.js world. Then load that engine.

## Dependency: `presentation`

Load `presentation` before Gate 1. Use its non-negotiables and reference files.
Do not copy those rules into this skill.

## Dependency: the official `slidev` skill

This skill produces Slidev markup but does **not** carry Slidev's syntax
reference. Before generating any `slides.md`:

1. Ensure the official skill is available. If not, install it:
   `npx skills add slidevjs/slidev`
2. For **any** syntax question (layouts, magic-move, click animations,
   components, export flags), consult the `slidev` skill / its reference files,
   or `https://sli.dev/llms.txt` as a fallback. Do not hand-roll syntax you can
   look up — getting it wrong breaks rendering.

`references/slidev-cheatsheet.md` carries only the **generator gotchas** and the
delegation pointers.

## Workflow

```
Step 0  Detect topic
Gate 1  Research & Ground   → presentation
Step 2  Interview           → presentation core + this skill's extras
Step 3  Deeper ground       → presentation (conditional)
Gate 2  Storyboard approval → presentation
Step 5  Scaffold + theme    → pnpm create slidev; visual theme in browser
Step 6  Generate slides.md  → presentation craft + slidev skill + assets
Gate 3  Self-verify loop    → references/verification.md
Step 8  Finish live         → bg dev server + open http://localhost:3030
```

### Step 2 extras (after presentation core)

Load `references/interview.md` in this skill for:

- Visual theme pick (2–4 themes in the browser)
- Branding-mode routing (default / resource-derived / minimal)
- Export targets: PDF / PPTX / hosted SPA

### Step 5 — Scaffold + visual theme selection

Scaffold the Slidev project at the user's output location. Select a theme
**visually in the browser**. Then apply brand colors/fonts/logo. See branding
routing in `references/interview.md`.

Scaffolding is interactive. Pipe a decline, with the parent folder as the
working directory: `"n" | npm create slidev@latest <project-name>`. Then install
and run yourself. Use a relative project name.

### Step 6 — Generate `slides.md`

Apply the craft layer from `presentation`. Consult the `slidev` skill for all
syntax. Produce/insert assets per `references/assets.md`. Respect the gotchas in
`references/slidev-cheatsheet.md`.

### Gate 3 — Self-verify loop

Load `references/verification.md`. Screenshot every slide in a headless browser,
detect overflow / clipped code / contrast / empty / overstuffed, fix, re-check
until clean.

### Step 8 — Finish live

Leave the dev server running in the background and open the deck in the browser
at `http://localhost:3030`. Then offer the export targets the user chose.

### Revision mode

Pointed at an existing Slidev project, skip scaffolding and
extend / restyle / tighten using the same craft layer + self-verify loop.

## Reference files

| File | Load when |
|------|-----------|
| `presentation` skill | Gates 1–2, craft, shared assets honesty |
| `references/interview.md` | Theme, brand routing, export targets |
| `references/slidev-cheatsheet.md` | Steps 5–6 — gotchas + delegation |
| `references/assets.md` | Step 6 — Shiki/Mermaid PNG helper |
| `references/verification.md` | Gate 3 |

## Asset helper

`assets/render-asset.mjs` renders standalone code (Shiki) and diagram (Mermaid)
PNGs into a deck's `public/`. Usage in `references/assets.md`. Install once with
`npm --prefix <skill>/assets install` and `npx playwright install chromium`.
