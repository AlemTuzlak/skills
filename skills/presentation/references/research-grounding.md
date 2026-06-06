# Gate 1 — Research & Grounding

Runs **before the interview**. Produces one **research + grounding brief** that
the interview, storyboard, and slide generation all read from. Slides are
generated from this brief, never from unverified model memory.

Two tracks. Track A always runs. Track B runs when the topic is a specific
library/tool.

---

## Track A — Topic research (ALWAYS)

The moment the user gives a topic, research it deeply before going further.

**Method**
- Fan out web searches (broad → narrow). Prefer authoritative/canonical sources
  (official docs, primary sources, recognized experts) over SEO content farms.
- For libraries/frameworks/APIs, also use the `context7` MCP docs tools and the
  project's own docs/`llms.txt`.
- Read enough to actually understand the subject, its current state, and where it
  is contested.

**Capture (brief fields)**
- **Current state** — what's true now; version/era if it matters.
- **Key facts & definitions** — the load-bearing concepts the talk needs.
- **Notable recent developments** — what changed lately and why it matters.
- **Common misconceptions** — what people get wrong (great slide material).
- **Evidence per claim** — for each non-obvious claim, the strongest source and a
  confidence level.

**Rigor rule (non-negotiable)**
- **Flag commonly-stated-but-weakly-supported claims.** If a "fact" is widely
  repeated but lacks real evidence (or has evidence against it), either omit it
  or present it with an explicit caveat. Never let a myth onto a slide as fact.
- Examples of the genre to watch for: Mehrabian "7%/38%/55%", the "10/20/30
  rule", the "6×6 rule" — treat as folklore, not law (see
  `presentation-craft.md`).

---

## Track B — Code grounding (CONDITIONAL: specific library/tool)

When the topic is a concrete library/tool, analyze the **real code** so every
slide is technically correct, not hallucinated API.

**Source detection** — turn this track on when the user supplies a repo path,
GitHub URL, package name, or docs URL; names a concrete library/framework/CLI;
or is standing in a code repo.

**Sources, priority order**
1. **Local repo path** — most accurate; includes unreleased changes. Read:
   `README`, public API surface (exports/entry points), `examples/`, tests,
   `package.json`, `CHANGELOG`/recent `git log`.
2. **GitHub URL / owner+repo** — via `gh`/web: README, public API, examples,
   docs, recent releases/commits.
3. **Package name → resolve to repo** — npm/PyPI/crate → repository + docs, then
   analyze as above.
4. **Docs site URL** (+ `llms.txt`) — when source isn't available or the talk is
   usage-focused rather than internals-focused.

**What to extract** — what the library actually does, its real public API,
canonical usage examples (copy from real examples/tests, don't invent), notable
recent changes, and — for deeper passes — architecture and data flow.

---

## Depth — scaled to the talk, in two passes (both tracks)

- **Light pass now (always).** Enough to make the interview *smart*. Code: README
  + public API + examples + recent changes ("I see exports X, Y, Z — which is the
  talk centered on?"). Research: the topic landscape + key facts.
- **Deeper targeted pass later (after the interview, conditional).** Only if the
  talk is internals/architecture-focused or long-form. Deepen exactly the areas
  the user chose, at the per-area depth they set (see `interview.md`). Code:
  architecture, data flow, key source files, tests. Research: deep-dives per
  chosen area.

Do not over-research a 10-minute intro talk; do not under-research an
architecture deep-dive.

---

## Brief format (template)

```md
# Research + Grounding Brief: <topic>

## Summary (3–5 sentences)
<what this is, why it matters now>

## Key facts
| # | Claim | Source | Confidence |
|---|-------|--------|------------|
| 1 | ...   | <url>  | high/med/low (+caveat) |

## Definitions / glossary
- term — plain-language definition

## Recent developments
- ...

## Common misconceptions (and the correction)
- myth → reality (source)

## Code grounding (if Track B)
- What it does:
- Real public API (verbatim signatures):
- Canonical examples (from real examples/tests):
- Notable recent changes:
- Architecture (deeper pass only):

## Open questions to resolve in the interview
- ...
```

The "Open questions" feed directly into a sharper interview.
