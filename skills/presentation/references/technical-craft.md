# Presentation craft — technical talks

Rules specific to technical presentations (conference talks, dev/engineering
talks, teaching code). Layer these on top of `presentation-craft.md`.
Opinionated but overridable.

---

## Talk structure

- **Four-stage arc:** Exposition (0–15%: context + the problem, "why care?") →
  Rising action (15–50%: deepen the problem, obstacles) → Climax (50–75%: the
  solution/insight + results) → Resolution (75–100%: implications, takeaways,
  call to action).
- **Hook in 10–15s** (stat / question / bold claim / story). Not your bio.
- **One core takeaway**, reinforced throughout. End with an explicit
  conclusions/takeaways slide — make the payoff unmissable.

## Code on slides

- **≤5–7 lines visible at once.** Omit imports, logging, error handling, and
  boilerplate that doesn't serve the point; use `…` for elisions. Long code is
  only acceptable to demonstrate "look how awful long code is."
- **Big and high-contrast.** Monospaced, large (think 24pt+ equivalent), readable
  from the back. Never shrink to fit — split across slides.
- **Progressive reveal.** Show 1–3 lines at a time as you explain them (Slidev
  `v-clicks`, line-highlighting `{1|2-3|all}`, or magic-move for diffs). For
  diffs, highlight changed lines and **dim** previously-discussed code.
- **Direct attention.** Highlight the 1–3 lines under discussion; de-emphasize the
  rest (gray/opacity). Don't make the audience hunt.
- **Prefer a diagram or pseudocode** when the audience can't realistically read
  code off a projector. Code is secondary to understanding.

## Demos

- **Recorded by default.** Live demos carry real risk (network, environment,
  nerves). Use a recorded/screenshot demo unless the payoff is small and
  immediate (<~60s, one impressive result).
- **If live:** show the end result first, then walk backward — avoid "watch me
  type for five minutes." Always have a backup (recording, screenshots, or a
  hosted copy that runs on someone else's laptop).

## Diagrams

- **Default to diagrams** for architecture, data flow, and relationships — they
  beat code/text for conveying structure.
- **C4 hierarchy:** Context → Containers → Components → Code; start high-level,
  zoom in. Prevents overwhelm.
- Standard notation and familiar icons (UML/sequence/flow, cloud-provider icons).
  Keep them clean — essential elements only, generous whitespace.
- **Before/after** diagrams to show evolution or improvement (pairs with the
  sparkline oscillation).
- Tune diagram complexity to the audience (peers: detailed flows; mixed:
  high-level blocks; non-technical: business-impact flows).

## Audience calibration & curse of knowledge

- Identify the primary audience: **beginner / intermediate / expert / mixed**, and
  the **context** (conference / internal / exec pitch / workshop).
- Beginners: no jargon, heavy analogies, one concept per slide. Intermediate:
  assume fundamentals, focus on application/best practice. Experts: precision,
  methodology, perf numbers; skip the obvious.
- **Mixed audiences:** layer — high-level overview first, details/appendix for
  experts. Don't insult either end.
- Define jargon on first use with a concrete example. Use analogies — and within
  ~2 sentences say where the analogy breaks down.
- **Curse of knowledge:** you over-assume shared context. Sanity-check that
  someone less expert could follow the slides.

## Cognitive load & pacing (technical material)

- Dense material needs *more* slides and *more* whitespace, not smaller fonts.
- Reveal progressively; one new hard idea at a time.
- Break the talk into 5–10 minute segments and switch modes (code → diagram →
  story → demo) to refresh attention.

## Math, benchmarks, APIs

- Equations: large, high-contrast, well-spaced; render with LaTeX; few per slide;
  color the key term.
- Benchmarks: lead with the single headline metric, then supporting data as
  evidence. Use bar/ranking visuals over dense tables. For experts: methodology +
  confidence + caveats.
- API surfaces: show the *shape* (signatures/types), not the whole surface.
  Ground signatures in the real code (Track B), don't invent them.

## Failure modes to avoid

- Reading slides verbatim (means too much text on the slide).
- Walls of code or text → split, diagram, or reduce.
- Covering everything → depth over breadth; one concept well beats ten skimmed.
- Reading code line-by-line with no narrative or payoff.
- Decorative clutter (borders, logos eating content, gratuitous animation).

## Per-context variants

| Context | Structure | Demos | Code volume | Goal |
|---------|-----------|-------|-------------|------|
| Conference (30–50m, large) | hook → problem → solution → insights → Q&A | recorded + backup | minimal, curated | memorable takeaway, thought leadership |
| Internal team (20–30m) | quick context → problem → solution → action items | live OK (small room) | more, interactive | alignment, decisions |
| Exec / sales pitch (15–20m) | business problem → impact → solution → ROI | polished outcome, not internals | avoid; high-level diagrams | credibility, approval |
| Workshop / tutorial (60m+) | outcomes → concept → step-by-step → practice | live, paced for following along | generous, copy-pasteable | skill transfer |

---

## Sources

- UW — Giving a technical talk: https://homes.cs.washington.edu/~mernst/advice/giving-talk.html
- Sebastian Witowski — great conference talk: https://switowski.com/blog/how-to-make-a-great-conference-talk/
- Chelsea Troy — preparing a tech talk: https://chelseatroy.com/2022/08/03/how-i-do-and-dont-prepare-a-talk-for-a-technical-conference/
- Code for slides: https://smyachenkov.com/posts/code-for-slides/
- Syntax highlighting for slides: https://rmoff.net/2018/06/20/syntax-highlighting-code-for-presentation-slides/
- C4 model / architecture diagrams: https://vfunction.com/blog/architecture-diagram-guide/
- Curse of knowledge: https://mitsloan.mit.edu/ideas-made-to-matter/curse-knowledge-why-experts-struggle-to-explain-their-work
- Live vs recorded demos: https://www.guideflow.com/blog/live-demos-vs-recorded-demos
