# Writing Guide — Learning {{TOPIC}}

This file is the shared brief for every chapter writer. **Read all of it before you write a word.** The consistency-pass agent uses these same rules to validate and patch your chapter.

## Learner profile (recorded from the interview)

- **Topic**: {{TOPIC}}
- **Current level**: {{CURRENT_LEVEL}}
- **Target proficiency**: {{TARGET_PROFICIENCY}}
- **Depth budget**: {{DEPTH}}
- **Practice load**: {{PRACTICE_LOAD}}
- **Scope/angle**: {{SCOPE}}
- **Canonical language** (technical topics): {{CANONICAL_LANGUAGE}}

## Analogy bank — domains the learner already knows

{{KNOWN_DOMAINS}}

**When you introduce a new abstract concept**, scan this list. If one domain shares relational structure with the concept, build an analogy from it. Use the format:

```markdown
> **Analogy**: <one-paragraph analogy mapped to a known domain>
>
> **Where this breaks down**: <one or two specific disanalogies>
```

If no domain in the bank fits cleanly, **skip the analogy**. A bad analogy is worse than no analogy — it teaches the wrong relational structure (Gentner 1983).

## The 12 non-negotiable rules

### 1. Concrete before abstract

The **first sentence** of every chapter names a concrete observable instance. No abstract noun in that first sentence until a concrete instance has been shown.

- ❌ "Classification is the task of assigning a label from a discrete set to an input."
- ✅ "A spam filter looks at every email in your inbox and decides: junk or not junk."

### 2. Cards, not essays

Each chapter is **5–9 cards**, separated by `---` (a horizontal rule on its own line).

- Each card: **250–500 words**, **one concept**, **one diagram** (if the concept is relational), one self-explanation prompt.
- A card >600 words without a diagram is a defect — find what should have been visualized.

### 3. Diagram-first for relational concepts

If a concept involves flow, hierarchy, state transitions, sequencing, comparison, architecture, or 3+ related entities → **diagram is mandatory**, not optional.

Diagrams support text. Text fills the gaps the diagram can't carry (the *why*, the gotchas, the trade-offs).

**No decorative imagery.** Every diagram must encode a proposition that's actually claimed in the surrounding prose. If you can't say what *information* the diagram adds beyond the words, delete it.

### 4. Diagram conventions

- ViewBox: `0 0 800 480` (or smaller — never larger)
- Colors (4-color palette only):
  - `#1f2937` — text and strokes
  - `#3b82f6` — primary fill
  - `#f59e0b` — accent
  - `#10b981` — positive/success
- Font: `system-ui, -apple-system, sans-serif`, 14–18px
- Strokes: 1.5px or 2px
- Padding: ≥16px around any text label
- **Labels are inline annotations on the diagram, not in a separate legend block.** No `## Legend` headers anywhere.
- Caption: every diagram has a one-sentence caption directly below.
- Opt-in interactivity: add `data-interactive="hover-explain"` on the root `<svg>` and `data-explain="<text>"` attrs on labeled elements to enable tooltips in the HTML viewer.

Files go in `./diagrams/chNN-<short-name>.svg`. Referenced from chapter as `![alt](./diagrams/chNN-<name>.svg)`.

### 5. Analogy hygiene

Every analogy must be followed within 2 paragraphs by an explicit "where this breaks down" disclaimer naming at least one disanalogy.

This rule catches phrases like "is like a", "think of … as", "imagine X as a Y", "**Analogy**:". The consistency-pass agent flags these and rejects chapters that don't have a disclaimer.

### 6. Jargon gate

Every technical term gets a definition in the same paragraph on first use OR links to a glossary entry from an earlier chapter (`[term](#term-slug)` or similar). **No exceptions for terms you consider "common"** — the learner might not.

In the chapter frontmatter `introduces.terms`, list every term you define. Future chapters will check this ledger before redefining.

### 7. B1 sentence discipline

- Mean sentence length **≤18 words**, max **25**.
- **≤1 subordinate clause per sentence.**
- **Passive voice ≤10%** of sentences. Default to active voice.
- Address the reader as **"you"**. We are a partner, not a textbook.
- **No idioms**, no cultural metaphors. Banned phrases include: "low-hanging fruit", "moving the needle", "on the same page", "down the rabbit hole", "boil the ocean", "the elephant in the room", "back to square one", "ahead of the curve". Use literal language.
- Prefer Anglo-Saxon over Latinate verbs: "use" not "utilize", "show" not "demonstrate", "help" not "facilitate".
- Avoid noun-stacking: not "user data access policy" — write "the policy for accessing user data".

### 8. No filler

Banned: "It's important to note that…", "In conclusion…", "This is a great way to…", "It is worth mentioning…", "At the end of the day…", "Needless to say…", "Without further ado…".

Just say the thing.

### 9. Retrieval and recap at end of every chapter

Every chapter ends with:

```markdown
## Recall (before scrolling away)

<details><summary>1. <free-recall question>?</summary>
<short answer>
</details>

<details><summary>2. <free-recall question>?</summary>
<short answer>
</details>

<details><summary>3. <free-recall question>?</summary>
<short answer>
</details>

<details><summary>4. Callback: <question about a concept from 2 chapters back, by name>?</summary>
<short answer>
</details>

## Recap
- <mirror of "What you'll learn" bullets, now stated as facts>

## Next
<one sentence pointing to the next chapter>
```

Free recall / short answer prompts only. **No multiple choice** — too easy to recognize without retrieving.

### 10. Self-explanation prompts between cards

After the main body of each card (before the next card divider), add:

```markdown
> **Self-explain**: Finish this sentence — "<concept> works because ___"
>
> <details><summary>Sample answer</summary>
> <model explanation in 1–2 sentences — concrete, not abstract>
> </details>
```

Constrained prompts (sentence-completion) beat open prompts ("explain this") for low-prior-knowledge readers.

### 11. Code blocks (technical topics only)

If the topic is technical:

- Language is **{{CANONICAL_LANGUAGE}}** unless the user's scope said otherwise.
- Every block has a **one-line code comment above** (what it does in code terms).
- Every block has a **one-line plain-English explanation below** (what it does for the reader).
- Code must be **runnable / copy-pasteable**. No abstract pseudocode.

Example:
```markdown
```ts
// Start a workflow and wait for its result.
const handle = await client.workflow.start(myWorkflow, { args: ['order-123'] });
const result = await handle.result();
```
This kicks off `myWorkflow` with one argument and waits until it finishes before continuing.
```

### 12. Worked examples with backward fading

Your assigned **fading stage** is given in the chapter brief. Match it:

- **`full-worked`** (early chapters, 1–3): show complete worked examples with every step annotated.
- **`backward-faded`** (middle chapters, 4 to N-2): blank the **last** step of the worked example and ask the learner to complete it. Show the answer in a `<details>` toggle. Subsequent examples blank earlier steps.
- **`prompt-only`** (last 2 chapters): pose the problem, no worked example. A "stuck?" toggle reveals a hint, not the full solution.

## Required chapter structure

```markdown
---
chapter: NN
title: <Title>
slug: <chapter-slug>
requires:
  chapters: [...]
  concepts: [...]
introduces:
  concepts:
    - slug: ...
      label: ...
      first-definition: "..."
  terms:
    - term: ...
      definition: "..."
callbacks: [concept-slug, ...]
fading-stage: full-worked | backward-faded | prompt-only
---

## What you'll learn
- 3–5 bullets

## Prereq check
> Quick check before you start. Click each to reveal the answer.

<details><summary>1. <prereq question>?</summary><answer></details>
<details><summary>2. <prereq question>?</summary><answer></details>
<details><summary>3. <prereq question>?</summary><answer></details>

---

## Card 1: <Title>
<concrete opener>
<body, ≤500 words>
![alt](./diagrams/chNN-<name>.svg)
*<caption>*
> **Self-explain**: ...

---

## Card 2: <Title>
...

---

<5–9 cards total>

---

## Recall (before scrolling away)
<3 free-recall prompts + 1 cross-chapter callback>

## Recap
<bullets>

## Next
<one sentence>
```

## Frontmatter conventions

- `chapter`: integer (matches NN in filename)
- `slug`: kebab-case
- `requires`: chapters and concept-slugs the reader needs first
- `introduces.concepts`: every new named concept (these become entries in `concepts.json`)
- `introduces.terms`: every term you defined for the first time (these become entries in `terms.json`)
- `callbacks`: concept-slugs from earlier chapters that you deliberately use here without redefining (this is how spaced exposure works)
- `fading-stage`: `full-worked` | `backward-faded` | `prompt-only`

## Density checks the consistency-pass will run

- Card word count between 250 and 600 → flagged if outside
- ≥1 diagram per card whose concept is relational → flagged if missing
- First sentence of chapter does not start with an abstract definitional pattern (`X is the…`, `X refers to…`, `X is defined as…`) → flagged if it does
- Mean sentence ≤18 words, max 25 → flagged if exceeded
- Every "is like a"/"think of … as"/"**Analogy**:" has a "**Where this breaks down**:" within 2 paragraphs → flagged if missing
- Every technical term in the chapter is either defined in the same paragraph on first use OR present in the term ledger from an earlier chapter → flagged if neither
- Required sections present: `## What you'll learn`, `## Prereq check`, ≥3 cards, `## Recall`, `## Recap`, `## Next` → flagged if missing
- ≥1 callback to a concept from ≥2 chapters back in the Recall section → flagged if missing
- No banned phrases or filler → flagged if found

Patch your chapter before submitting if any of these would fire.
