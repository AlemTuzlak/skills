# Interview (core)

Runs after Gate 1, before the storyboard. The brief makes the interview smart.
Skip anything it already answers. Tailor options to detected context.

The engine adds medium questions around this list (Slidev theme, or Three.js
world / theme / story / timer). Do not duplicate those here.

## Conduct rules

- **One question at a time.** Never dump the whole list.
- **Structured picker** where possible: multiple choice + a recommended default +
  free-text "Other".
- **Adaptive.** Skip questions the research/grounding brief already answers.
  Tailor option sets to context (workshop vs exec pitch).
- Lead each question with your recommended answer and a one-line why.

## Canonical question set

1. **Topic + library/source.** What's the talk about? If it's a specific
   library/tool, the repo path / GitHub URL / package / docs to ground from.
   *(Routes Gate 1 Track B. Skip if already grounded.)*
2. **Audience + expertise + context.** Who's watching — beginners / intermediate
   / experts / mixed — and the setting: conference / internal team / exec pitch /
   workshop. *(Drives jargon, depth, structure, demo posture; see
   `technical-craft.md` per-context table.)*
3. **Areas to cover + per-area depth.** Which sections/areas to include, and for
   **each** how deep: **mention** / **explain** / **deep-dive-with-code**.
   *(Drives slide count and code/diagram density. Always ask it per area.)*
4. **Duration + single takeaway + tone.** Talk length (→ slide budget); the ONE
   thing the audience must remember; tone: professional / friendly / playful /
   academic.
5. **Speaker notes?** Generate per-slide speaker notes (talking points, full-prose
   assertion, transitions, time cues)? yes / no.
6. **Brand guidelines.** Colors / fonts / logo, and/or a brand *resource* (brand
   doc, website, Figma, design system, reference deck/image). The engine applies
   this to its medium.
7. **Diagrams.** Generate diagrams? Which kinds — flow / sequence / architecture /
   before-after?
8. **Ready-made assets.** Existing images, screenshots, logos, demo videos, code
   snippets — and where they live. *(Use these instead of placeholders.)*
9. **Output location.** Where to create the project.

## Slide-count heuristic

Turn duration + per-area depth into a target slide count. Treat as a starting
budget, then sanity-check against ~1–2 min/slide.

```
content_slides ≈ duration_minutes / 1.5     # baseline at ~1.5 min/slide
```

Distribute `content_slides` across the chosen areas weighted by per-area depth:

| Depth | Slides per area (guide) |
|-------|-------------------------|
| mention | 1 |
| explain | 2–4 |
| deep-dive-with-code | 4–6 |

The scale-toward-baseline step (below) may stretch any area ±1 beyond its
per-row guide to hit the duration budget.

Then add fixed slides: **title (1)**, **agenda (1, optional)**, **section
dividers (1 per section)**, **closing/takeaways (1)**.

**Worked example** — 25-minute conference talk, areas: *Intro* (mention),
*Core API* (deep-dive), *Architecture* (explain), *Demo* (explain):
- baseline ≈ 25 / 1.5 ≈ 16 content slides
- weights: 1 + 5 + 3 + 3 = 12 → scale up toward 16 (Core API → 6, Architecture →
  4, Demo → 4, Intro → 2)
- fixed: title 1 + agenda 1 + 4 section dividers + closing 1 = 7
- **≈ 23 slides total**, ~1.1 min each → trim toward ~18–20 to keep breathing
  room. Flag to the user if their content won't fit the time.
