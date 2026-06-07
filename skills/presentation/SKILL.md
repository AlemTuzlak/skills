---
name: presentation
description: Use when the user wants to create presentation slides, a slide deck, a technical talk, or a conference talk for a topic or library — built on Slidev. Interviews the user, deep-researches and code-grounds the topic FIRST, applies presentation-craft best practices, generates a Slidev deck, self-verifies it in a headless browser, and ends with the dev server running and the deck open in the browser with zero manual steps. Triggers on "make a presentation", "make slides", "build a deck", "presentation about X", "technical talk", "conference talk", "slidev deck", "build slides for X", "present <library>".
---

# presentation — technical slide decks that don't suck

A **director** layer on top of Slidev. This skill owns the **what** (researched,
grounded content) and the **how-well** (presentation craft). It **delegates
Slidev syntax mechanics** to the official `slidev` skill — it depends on that
skill and never duplicates its syntax reference.

You are not "filling a template." You are interviewing a speaker, researching
their topic until you actually understand it, and engineering a deck that an
audience will follow and remember.

## When to use

- The user wants to build/create a presentation, slide deck, or talk.
- "Make slides / a deck / a presentation about X", "technical talk", "conference
  talk", "build slides for <library>", "present <topic>".
- Revising/extending an existing Slidev deck (revision mode).

## When to skip

- The user only wants raw Slidev *syntax* help → use the `slidev` skill directly.
- A one-off non-deck answer (a definition, a snippet) → just answer.

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
delegation pointers — the things that bite an automated author. It is not a
syntax copy.

## Non-negotiables (read before working)

These are what the user is paying for. Do not skip them because a deck "looks
fine."

1. **Research + ground BEFORE the interview.** The moment you have a topic, run
   Gate 1 (`references/research-grounding.md`). Never build slides from model
   memory.
2. **Build from the brief, not from memory.** Every factual claim on a slide
   traces to the research/grounding brief.
3. **Flag weak claims; don't assert them.** If something is commonly repeated
   but poorly supported, skip it or caveat it. Never present a myth as fact.
4. **Assertion-evidence + lean text.** Slide titles are complete-sentence claims;
   the body is visual evidence, not a bullet dump. Keep on-slide text to a glance —
   aim ≤ ~20 words of body per slide; full sentences and detail belong in the
   speaker notes, not on the slide. (`references/presentation-craft.md` "Text
   budget")
5. **One idea per slide; ~1–2 min/slide.** Split rather than cram.
6. **Fill the canvas.** Every slide uses all available space with balanced
   proportions — never top-anchor content above a dead band, and never float a
   small element in a big empty region. Center/distribute the content group and
   size visuals to fill their region; distribute whitespace, don't dump it.
   (`references/presentation-craft.md`; concrete Slidev recipe in
   `references/slidev-cheatsheet.md`)
7. **Code discipline.** ≤5–7 lines visible at once, large, progressive reveal,
   dim irrelevant lines; prefer a diagram over a wall of code.
   (`references/technical-craft.md`)
8. **Generate every legitimately generatable asset** (code images, diagrams,
   charts). **Placeholder only the un-generatable** (real photos, product
   screenshots, demo videos) with a specific swap instruction. **Never fabricate
   evidence** — no fake screenshots, invented data, or hotlinked images.
   (`references/assets.md`)
9. **Storyboard approval before writing slides** (Gate 2).
10. **Self-verify before handing over** (Gate 3, `references/verification.md`).
11. **Finish live, zero manual steps.** End with the dev server running in the
    background and the deck open at `http://localhost:3030`. The user never runs
    a command.

## Workflow

```
Step 0  Detect topic (and whether it's a specific library/tool)
Gate 1  Research & Ground   → references/research-grounding.md   (BEFORE interview)
Step 2  Interview           → references/interview.md            (adaptive, one Q at a time)
Step 3  Deeper ground       → only if internals/architecture-focused or long-form
Gate 2  Storyboard approval → per-slide plan; user approves before any slides.md
Step 5  Scaffold + theme    → pnpm create slidev; visual theme selection in browser
Step 6  Generate slides.md  → craft refs + slidev skill + assets.md; respect gotchas
Gate 3  Self-verify loop    → references/verification.md         (screenshot → fix → repeat)
Step 8  Finish live         → bg dev server + open browser; then offer export
```

### Step 0 — Detect
Identify the topic. Decide whether it is *also* a specific library/tool (repo
path / GitHub URL / package name / docs URL / names a concrete library / user is
in a code repo) — this turns on Gate 1 Track B in addition to Track A.

### Gate 1 — Research & Ground (FIRST, before talking)
Load `references/research-grounding.md`. Run **Track A (topic research, always)**
and, when applicable, **Track B (code grounding)**. Light pass now (enough for a
smart interview); deeper pass later if the talk warrants. Produce the
**research + grounding brief**.

### Step 2 — Interview
Load `references/interview.md`. Ask the canonical questions adaptively, one at a
time, skipping anything the brief already answers.

### Step 3 — Deeper grounding (conditional)
If the chosen areas are internals/architecture-focused or the talk is long-form,
deepen the brief at the per-area depth the user set.

### Gate 2 — Storyboard approval
Present a per-slide storyboard: assertion title · content/asset · layout ·
speaker-note intent · place in the narrative arc · running time budget vs stated
duration. Get approval/edits before writing any `slides.md`.

### Step 5 — Scaffold + visual theme selection
Scaffold the Slidev project at the user's output location. Select a theme
**visually in the browser** — show 2–4 themes matching brand/tone (gallery
previews or a quick render); user picks. Then apply brand colors/fonts/logo. See
the branding-mode routing in `references/interview.md`.

### Step 6 — Generate `slides.md`
Apply the craft layer (`presentation-craft.md` + `technical-craft.md`). Consult
the `slidev` skill for all syntax. Produce/insert assets per
`references/assets.md`. Respect the gotchas in `references/slidev-cheatsheet.md`.

### Gate 3 — Self-verify loop
Load `references/verification.md`. Screenshot every slide in a headless browser,
detect overflow / clipped code / contrast / empty / overstuffed, fix, re-check
until clean.

### Step 8 — Finish live
Leave the dev server running in the background and open the deck in the browser.
Then offer the export targets the user chose (PDF/PPTX/SPA).

### Revision mode
Pointed at an existing Slidev project, skip scaffolding and
extend / restyle / tighten using the same craft layer + self-verify loop.

## Reference files

| File | Load when |
|------|-----------|
| `references/research-grounding.md` | Gate 1 — researching + grounding the topic |
| `references/interview.md` | Step 2 — running the interview; branding routing; slide-count math |
| `references/presentation-craft.md` | Step 6 — general craft rules + myth-flags |
| `references/technical-craft.md` | Step 6 — code/diagrams/demos/audience for technical talks |
| `references/slidev-cheatsheet.md` | Steps 5–6 — generator gotchas + delegation to the `slidev` skill |
| `references/assets.md` | Step 6 — generating assets + placeholder convention |
| `references/verification.md` | Gate 3 — self-verify checks + auto-fix loop |

## Asset helper

`assets/render-asset.mjs` renders standalone code (Shiki) and diagram (Mermaid)
PNGs into a deck's `public/`. Usage in `references/assets.md`. Install once with
`npm --prefix <skill>/assets install` and `npx playwright install chromium`.
