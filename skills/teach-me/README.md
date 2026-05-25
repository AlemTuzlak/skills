# `/teach-me` — evidence-based course generator

Produce a self-paced, self-contained learning course on any topic. Markdown chapters, mandatory diagrams, an interactive HTML mini-course, and a pedagogy stack grounded in cognitive psychology.

## What it does

Run `/teach-me <topic>` and the skill:

1. Asks **what you already know**, **where you want to end up**, **how much depth**, **how much practice**, and **which domains** to pull analogies from.
2. Dispatches **four parallel research lanes** — authoritative content, niche-influencer blogs, canonical references (via `context7`), and the subtopic landscape.
3. Synthesises an `OUTLINE.md` and asks you which chapters to write (or to reshape the outline).
4. Generates the chapter set **in parallel batches** through subagents, each consuming a shared `WRITING_GUIDE.md` that enforces the pedagogy rules below.
5. Runs a **consistency-pass agent** that validates every chapter against the rules and patches drift.
6. Pre-renders the result into a **single self-contained `index.html`** via a Node build script (Shiki for code, callout transforms for blockquotes, figure wrappers for diagrams).
7. Opens the course folder and the HTML in your browser.

## Invocation

```text
/teach-me <topic>
/teach-me                          # asks for a topic
"teach me about X"                 # natural-language trigger
"I want to learn X"
"deep dive on X"
"create a course on X"
"study X with me"
```

Vague topics like `programming` or `science` get a narrowing follow-up. Topics that would produce harmful content are refused briefly with no lecture.

## What you get

Every course lives under `<output-location>/learn-<topic-slug>/`:

```
learn-<slug>/
├── README.md                  # course front page + reading order + time estimate
├── OUTLINE.md                 # recorded goal + subtopic landscape + sources
├── WRITING_GUIDE.md           # the shared brief every chapter writer obeyed
├── 01-<slug>.md … NN-<slug>.md  # one markdown file per chapter
├── diagrams/                  # SVG diagrams referenced from chapters
│   └── chNN-<name>.svg
├── concepts.json              # concept ledger (slug → definition, intro chapter, callbacks)
├── terms.json                 # term ledger (term → definition + first-use chapter)
├── course-meta.json           # title, learner profile, chapter index
├── resources.json             # machine-readable sources + influencers
├── resources.md               # human-readable bibliography
└── index.html                 # ⭐ self-contained interactive viewer (~800 KB)
```

The HTML opens straight from `file://` — no server, no CDN, fully offline.

## The pedagogy stack

Twelve non-negotiable rules baked into `WRITING_GUIDE.md` and enforced by the consistency-pass agent. Each is research-backed; details and citations in `SKILL.md`.

1. **Concrete before abstract** (Goldstone, Fyfe et al.) — every chapter opens with a concrete observable instance, never a definition.
2. **Retrieval practice** (Roediger & Karpicke; Rowland 2014 meta) — 3-5 free-recall prompts + 1 cross-chapter callback at every chapter end.
3. **Spaced exposure** (Cepeda et al. 2006) — every major concept is *used* (not redefined) in ≥2 later chapters via deliberate callbacks.
4. **Worked examples + backward fading** (Sweller; Renkl & Atkinson) — early chapters show full worked examples; middle chapters blank the last step; late chapters are prompt-only.
5. **Cognitive Load Theory** (Sweller; Mayer) — max ~4 new named concepts per chapter, one new dimension of difficulty at a time.
6. **Segmenting / cards** (Mayer & Pilegard) — chapters are decks of 5–9 cards, 250–500 words each.
7. **Diagram-first** (Mayer multimedia principles) — relational concepts get mandatory diagrams; no decorative imagery.
8. **Analogy hygiene** (Gentner structure-mapping) — every analogy is followed within 2 paragraphs by an explicit "where this breaks down" disclaimer.
9. **Jargon gate** (Nathan & Koedinger expert-blind-spot) — every technical term is defined on first use OR linked to a glossary entry from an earlier chapter.
10. **Self-explanation prompts** (Chi et al.; Bisra et al. 2018 g≈0.55) — between cards, constrained sentence-completion prompts with a model answer behind a toggle.
11. **B1 plain-language discipline** — mean sentence ≤18 words, max 25, ≤1 subordinate clause, passive ≤10%, active voice, second person, banned-phrase list.
12. **Build on what the learner already knows** (Ausubel) — the analogy bank captured in the pre-interview anchors every new abstract concept to a known domain.

**Explicitly rejected** — learning styles (VAK), "10,000 hours" framing, decorative gamification, neuromyths.

## HTML viewer

The generated `index.html` ships with:

- **Card-by-card navigation** — each chapter is a deck of cards; prev/next within chapter, sidebar nav across chapters.
- **Nested card list in the sidebar** — every chapter expands to show its cards; click any card to jump.
- **📖 Glossary** — dedicated full-screen view with a type-ahead filter, alphabetical grid, and links back to the chapter that first defined each term.
- **📚 Resources** — dedicated full-screen view with sources (tagged by type) and niche-influencer profiles.
- **Shiki code highlighting** — pre-rendered at build time with dual `github-light` / `github-dark` themes via CSS variables. No runtime highlighter, no flash of unstyled code.
- **Callouts** — `> [!NOTE]`, `> [!TIP]`, `> [!ANALOGY]`, `> [!BREAKDOWN]`, `> [!INSIGHT]`, `> [!IMPORTANT]`, `> [!WARNING]`, `> [!CAUTION]`, `> [!QUOTE]`, `> [!HISTORY]`, and the legacy `> **Self-explain**:` / `> **Analogy**:` / `> **Where this breaks down**:` patterns are all auto-detected and styled.
- **Diagram cards** — every `![alt](*.svg)` plus optional `*caption*` line auto-wraps in a high-contrast light card that reads in both themes.
- **Component library** — info cards, definition cards, stat cards, compare grids, tabs, pills, platform pills, **nested step lists** (1 → 1.1 → 1.1.1) — see `assets/COMPONENTS.md`.
- **Beautiful `<details>` disclosures** — custom chevron, hover lift, two-tone open state, contextual variants inside callouts, proper body padding.
- **Light / dark / auto theme toggle** persisted in localStorage.
- **Substring search** across all chapter content; results jump to the matching card.
- **Reading progress** persisted in localStorage; chapter nav shows ✓ for completed chapters and a dot for in-progress.
- **Interactive SVG diagrams** — opt-in via `data-interactive="hover-explain"` on the root `<svg>` and `data-explain="<text>"` on labelled elements.
- **Keyboard navigation** — `→` / `j` next card, `←` / `k` previous card. Suppressed while in a reference view.

## How the HTML is built

A small Node script (`assets/build-html.mjs`) does the assembly:

1. Reads each chapter markdown.
2. Transforms blockquote callouts and image-with-caption blocks into the matching HTML.
3. Auto-wraps every `<details>` body in `<div class="details-body">` so padding actually applies.
4. Pre-renders every fenced code block with Shiki (15 languages: TS, JS, TSX/JSX, JSON, YAML, Bash, Python, Go, SQL, HTML, CSS, Markdown, Diff).
5. Inlines `marked.min.js`, `styles.css`, `viewer.js`, the chapter scripts, and the JSON ledgers into the template.
6. Writes the result to `<course-folder>/index.html`.

Run it standalone:

```bash
node <skill-dir>/assets/build-html.mjs <course-folder>
```

On first use the skill runs `npm --prefix <skill-dir>/assets install` to fetch Shiki. The result is cached forever; subsequent builds reuse `node_modules/`.

## Skill layout

```
skills/teach-me/
├── README.md                  # this file
├── SKILL.md                   # the 10-phase pipeline spec (the contract)
└── assets/
    ├── build-html.mjs         # Node build script (Shiki + transforms + template fill)
    ├── COMPONENTS.md          # chapter-author reference for every component
    ├── marked.min.js          # vendored at first use via WebFetch
    ├── package.json           # pins Shiki ^1.24
    ├── package-lock.json
    ├── styles.css             # viewer CSS (themes, components, layout)
    ├── viewer.js              # viewer JS (card nav, glossary/resources views, search, etc.)
    └── templates/
        ├── index.template.html        # HTML template with {{PLACEHOLDER}} tokens
        └── WRITING_GUIDE.template.md  # shared brief consumed by every chapter writer
```

## Extending

- **New component** — add CSS to `styles.css` (under `Component library`), wire any interactivity in `viewer.js`, document in `COMPONENTS.md`, and (if it should be auto-generated from markdown conventions) add a transform pass in `build-html.mjs`.
- **New callout type** — add an entry to `CALLOUT_TYPES` in `build-html.mjs` and a `.callout-<type>` rule in `styles.css`. Optionally add a loose-pattern regex if you want it triggered by `> **Label**:` syntax.
- **New language for Shiki** — add to the `SUPPORTED_LANGS` array in `build-html.mjs` and to the `langs` array in `createHighlighter()`.
- **New pedagogy rule** — add to `WRITING_GUIDE.template.md`, add a validation check to the consistency-pass agent's brief in `SKILL.md` Phase 8.

## When not to use

- Quick factual questions ("what is X?") — just answer them.
- Library API lookups — use `context7` instead.
- Code help, debugging — use the relevant debugging skills.
- One-off tutorials — the 14-chapter pipeline is overkill for a single explainer.

## Output expectations

A typical course (~14 chapters, ~7 cards each, 30 diagrams, full ledgers) runs about **15–30 minutes** of skill execution wall time (most of it in the chapter-writing parallel batches and the consistency pass). Token cost varies with chapter depth; the bulk of work happens in subagents that don't pollute the orchestrator's context.

The output is durable. Re-running `/teach-me` on the same topic detects the existing folder and offers **Extend** (add chapters, regenerate specific ones) / **Start fresh** (archives the old course with a date suffix) / **Cancel**. Nothing is ever destructively overwritten.

---

For the full pipeline spec, see [`SKILL.md`](./SKILL.md).
For the component reference chapter authors and the consistency-pass agent rely on, see [`assets/COMPONENTS.md`](./assets/COMPONENTS.md).
