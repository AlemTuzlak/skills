# presentation

Build polished, technically-correct **Slidev** decks for technical talks,
conference presentations, and library/tool deep-dives — with the research,
craft, and verification a generic "make me slides" prompt skips.

It's a **director layer**: it owns researched content and presentation craft, and
delegates Slidev *syntax* to the official [`slidev` skill](https://github.com/slidevjs/slidev/tree/main/skills/slidev)
(installs it if missing). Slidev's syntax evolves in their skill; the craft here
stays valid.

## What it does

1. **Researches + grounds first.** Deep web research on the topic (flagging
   weakly-supported claims), and — for a specific library/tool — analyzes the
   real code (local repo > GitHub > package > docs). Slides are built from a cited
   brief, not model memory.
2. **Interviews you.** Adaptive, one-question-at-a-time: audience/context, areas +
   per-area depth, duration/takeaway/tone, speaker notes, brand, diagrams,
   assets, output + export targets.
3. **Storyboards for approval** before writing any slides.
4. **Generates the deck** applying assertion-evidence headlines, one-idea-per-
   slide, code discipline (≤5–7 lines, progressive reveal), diagrams-over-walls-
   of-code, and a hook→takeaways narrative arc.
5. **Generates assets** it legitimately can (Shiki code images, Mermaid diagrams
   via `assets/render-asset.mjs`); placeholders the rest with specific swap
   instructions; never fabricates evidence.
6. **Self-verifies** every slide in a headless browser (overflow / clipped code /
   contrast / overstuffed) and auto-fixes.
7. **Finishes live** — dev server running, deck open in the browser, zero manual
   steps — then offers PDF/PPTX/SPA export.

## Trigger it

"make a presentation about X", "build slides for <library>", "conference talk on
…", "slidev deck for …".

## Layout

```
SKILL.md                       workflow, gates, non-negotiables, dependency on the slidev skill
references/
  research-grounding.md        Gate 1: topic research + code grounding
  interview.md                 adaptive question set, branding routing, slide-count math
  presentation-craft.md        general craft + myth-flags
  technical-craft.md           code/diagrams/demos/audience for technical talks
  slidev-cheatsheet.md         generator gotchas + delegation to the slidev skill
  assets.md                    asset-generation policy + render pipeline
  verification.md              Gate 3 self-verify checks + auto-fix loop
assets/
  render-asset.mjs             Shiki code / Mermaid diagram -> PNG
  package.json                 shiki + playwright + mermaid
```
