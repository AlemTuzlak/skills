---
name: threejs-presentation
description: Use when the user wants a 3D presentation, Three.js talk, world talk, or spatial deck. Triggers on "threejs presentation", "3D talk", "world talk", "presentation in 3D space". If they say "make a presentation" and do not name Slidev, Three.js, 3D, or a world, ask once: Slidev or Three.js world. Don't use for Slidev / 2D slides.md (slidedev-presentation) or raw Three.js API help.
---

# threejs-presentation — talks in a 3D world

A **director** on top of a Vite + React Three Fiber skeleton. Load `presentation`
for research, interview core, craft, and the storyboard gate. This skill owns the
world, the camera, the catalog on a hero surface, and the local preview.

Each talk gets a **unique world** designed for that topic. The skeleton is shared.
The set is not.

## When to use

- 3D / Three.js / world / spatial presentation.
- Revising an existing talk that already uses this skeleton.

## When to skip

- Slidev / 2D `slides.md` → `slidedev-presentation`.
- Raw Three.js API help → a Three.js or R3F skill, not this one.
- A one-off non-talk answer → just answer.

If the user says "make a presentation" and does not name a medium, ask once:
Slidev or Three.js world. Then load that engine.

## Dependency: `presentation`

Load `presentation` before Gate 1. Use its non-negotiables and reference files.
Do not copy those rules into this skill.

## Non-negotiables (this medium)

1. **World gate before any app code.** Propose 2 to 4 worlds that fit the
   argument. Stop until the user picks or rewrites one.
2. **Hero surface is the default.** Titles, charts, and code fill the surface.
   Punch beats use the world. Group punch beats. Do not bounce glass → room →
   glass on every slide.
3. **Closed catalog on a texture.** Forms: title, statement, quote, chart, code,
   image. No HTML in the projected picture. `?flat` is the authoring view and the
   stage fallback.
4. **Blockout first.** Three.js primitives and CC0 models so `npm run dev` works in
   the same session. Blender is a later pass, only if the user asks.
5. **Zurich keys.** Arrows move one slide. Enter / Backspace step the glass.
   Counter always on. Space does nothing. `f` is fullscreen. `?slide=id` deep-links.
6. **Timer is optional.** Hidden at load. `T` starts count-up. `T` again stops
   and leaves the time on screen. If the user said no timer, `T` does nothing.
7. **No auto-deploy.** Preview locally. Run `npm run build`. The user uploads `dist`
   if they want.

## Workflow

```
Step 0  Detect topic
Gate 1  Research & Ground        → presentation
Gate W  World                    → references/interview.md  HARD STOP
Step 2  Theme, story, then core  → this interview + presentation interview
Step 3  Deeper ground            → presentation (conditional)
Gate 2  Storyboard approval      → presentation + catalog form or punch per slide
Step 5  Copy skeleton            → template/ → output folder; npm install; npm run dev
Step 6  Blockout world + talk.js → catalog painter; punch slides in the world
Gate 3  Self-verify              → references/verification.md
Step 8  Finish                   → preview open, then npm run build. Stop.
```

### Gate W — World (hard stop)

Load `references/interview.md`. Propose 2 to 4 worlds. Each world must serve the
argument, not decorate it. No scaffold, no `talk.js`, no Blender until the user
picks or rewrites one.

### Step 2 — Theme, story, then presentation core

Ask **theme** (palette, light, mood) and **story** (how the camera moves through
that world). Then run the `presentation` interview core. After duration is known,
ask if they want a **timer**.

### Gate 2 — Storyboard

Per slide: assertion title · catalog form or punch · camera · Enter steps ·
speaker-note intent · place in the arc · time. User approves before app code.

### Step 5 — Copy skeleton

Copy `template/` into the output folder. `npm install`. `npm run dev`. Open the
local URL. The empty world and sample slides must already run.

### Step 6 — Blockout + slides

Replace `src/scene/World.jsx` with the picked world (primitives + CC0). Fill
`src/talk.js`: one object per slide (id, camera, form or punch, optional steps).
Paint catalog forms onto the surface. Punch slides leave the glass empty or dim
and show the world.

When you write scene code, load an installed Three.js / R3F skill if one exists.
Do not invent a second renderer.

### Gate 3 — Self-verify

Load `references/verification.md`. Arrows, Enter, counter, timer, `?flat`,
`?slide=`. Then `npm run build`.

### Step 8 — Finish

Leave `npm run dev` running. Open the talk in the browser. Run `npm run build`.
Stop. Do not upload.

### Blender pass (only if the user asks)

Load `references/blender.md`. Rebuild hero sets, export GLB, swap into the same
slide list. If Blender is missing, keep the blockout.

### Revision mode

Pointed at an existing skeleton project, skip the copy step. Keep the same
gates for new slides or a new world.

## Reference files

| File | Load when |
|------|-----------|
| `presentation` skill | Gates 1–2, craft, honesty |
| `references/interview.md` | World, theme, story, timer |
| `references/catalog.md` | Step 6 — forms and `talk.js` shape |
| `references/skeleton.md` | Step 5 — what the template contains |
| `references/verification.md` | Gate 3 |
| `references/blender.md` | Optional quality pass |
