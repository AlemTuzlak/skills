---
name: presentation
description: Use when slidedev-presentation or threejs-presentation needs research, interview, craft, or storyboard rules. Don't use alone to generate a deck. Don't use for raw Slidev syntax or a one-off definition.
disable-model-invocation: true
---

# presentation — shared talk craft

A **library**. Engines load it. It does not scaffold a project.

You own the **what** (researched, grounded content) and the **how-well** (presentation craft). The engine owns the **medium** (Slidev markup or a Three.js world).

## When to use

- `slidedev-presentation` or `threejs-presentation` is running.
- An engine needs Gate 1, the interview core, craft rules, or the storyboard gate.

## When to skip

- The user asked to generate a deck. Load an engine instead.
- The user wants raw Slidev syntax. Use the official `slidev` skill.
- A one-off answer (a definition, a snippet). Just answer.

## Non-negotiables (read before working)

These are what the user is paying for. Do not skip them because a deck "looks fine."

1. **Research + ground BEFORE the interview.** The moment you have a topic, run Gate 1 (`references/research-grounding.md`). Never build from model memory.
2. **Build from the brief, not from memory.** Every factual claim traces to the research/grounding brief.
3. **Flag weak claims; don't assert them.** If something is commonly repeated but poorly supported, skip it or caveat it. Never present a myth as fact.
4. **Assertion-evidence + lean text.** Titles are complete-sentence claims. The body is visual evidence, not a bullet dump. Keep on-surface text to a glance. Aim ≤ ~20 words of body per slide. Full sentences belong in speaker notes. (`references/presentation-craft.md` "Text budget")
5. **One idea per slide; ~1–2 min/slide.** Split rather than cram.
6. **Fill the canvas.** Every slide uses all available space with balanced proportions. Never top-anchor content above a dead band. Never float a small element in a big empty region. The engine has the layout recipe.
7. **Code discipline.** ≤5–7 lines visible at once, large, progressive reveal, dim irrelevant lines. Prefer a diagram over a wall of code. (`references/technical-craft.md`)
8. **Generate every legitimately generatable asset.** Placeholder only the un-generatable (real photos, product screenshots, demo videos) with a specific swap instruction. **Never fabricate evidence.** (`references/assets.md`)
9. **Storyboard approval before writing slides** (Gate 2).

## What an engine must run

```
Step 0  Detect topic (and whether it is a specific library/tool)
Gate 1  Research & Ground   → references/research-grounding.md   (BEFORE interview)
Step 2  Interview core      → references/interview.md            (adaptive, one Q at a time)
Step 3  Deeper ground       → only if internals/architecture-focused or long-form
Gate 2  Storyboard approval → per-slide plan; user approves before any engine output
```

The engine inserts its own medium questions (Slidev theme, or Three.js world/theme/story/timer) around Step 2. Then the engine scaffolds, generates, verifies, and finishes.

### Step 0 — Detect

Identify the topic. Decide whether it is *also* a specific library/tool (repo path / GitHub URL / package name / docs URL / names a concrete library / user is in a code repo). This turns on Gate 1 Track B in addition to Track A.

### Gate 1 — Research & Ground (FIRST, before talking)

Load `references/research-grounding.md`. Run **Track A (topic research, always)** and, when applicable, **Track B (code grounding)**. Light pass now (enough for a smart interview). Deeper pass later if the talk warrants. Produce the **research + grounding brief**.

### Step 2 — Interview core

Load `references/interview.md`. Ask the canonical questions adaptively, one at a time, skipping anything the brief already answers.

### Step 3 — Deeper grounding (conditional)

If the chosen areas are internals/architecture-focused or the talk is long-form, deepen the brief at the per-area depth the user set.

### Gate 2 — Storyboard approval

Present a per-slide storyboard: assertion title · content/asset · layout or catalog form · speaker-note intent · place in the narrative arc · running time budget vs stated duration. Get approval/edits before writing any engine output (`slides.md`, `src/talk.js`, or world code).

## Reference files

| File | Load when |
|------|-----------|
| `references/research-grounding.md` | Gate 1 |
| `references/interview.md` | Step 2 — core questions, slide-count math |
| `references/presentation-craft.md` | Generate — general craft + myth-flags |
| `references/technical-craft.md` | Generate — code/diagrams/demos/audience |
| `references/assets.md` | Generate — never fabricate, placeholders |
