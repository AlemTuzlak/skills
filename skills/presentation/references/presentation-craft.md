# Presentation craft — general

Evidence-based defaults for turning a brief + interview answers into slides that
an audience can follow and remember. **Opinionated but overridable**: apply these
unless the user explicitly asks otherwise. Each rule has its backing; myths are
flagged at the bottom.

---

## Structure & narrative

- **Assertion-evidence (Michael Alley).** Each slide's title is a *complete
  sentence claim*, and the body is *visual evidence* for it — a chart, diagram,
  image, or minimal code. Not "Sales by region" but "The North region beat target
  by 23%." This is the one slide model with controlled studies showing better
  comprehension and recall and lower cognitive load. **No bullet-list-only
  slides.**
- **Sparkline / oscillation (Nancy Duarte, *Resonate*).** Strong talks oscillate
  between **"what is"** (status quo, pain) and **"what could be"** (the better
  future), repeatedly, building tension toward resolution. Use contrast slides
  (before/after, problem/solution) to create that pull.
- **Problem → solution arc.** Establish a visceral problem, reveal the
  solution/vision (benefits, not just features), then evidence + call to action.
  Return to the opening problem at the close.
- **Hook opening (10–15s).** Open with a surprising stat, a sharp question, a bold
  claim, or a short story — not "Hi, today I'll talk about…". The hook earns the
  next five minutes.
- **One memorable takeaway.** Decide the single thing the audience must remember;
  reinforce it at the open, in transitions, and at the close.
- **Closing that loops.** End by summarizing to ~3 takeaways and referencing the
  opening. No new information in the close. The final slide should linger (an
  image or statement), not a bare "Questions?".

## One idea per slide & cognitive load

- **Exactly one main idea per slide.** If a bullet needs a comma or semicolon,
  split it. Multiple visuals competing on one slide = overload; use more slides.
- **Signal-to-noise (Garr Reynolds).** Every element must serve the message.
  Decorative clip art, unused colors, extra shapes, gratuitous animation = noise.
  Remove it.
- **Mayer's multimedia principles:**
  - *Redundancy* — don't put your full narration on the slide as text. Short
    labels/annotations next to the relevant visual, not transcripts.
  - *Signaling* — use bold/arrows/boxes/color to point attention at the part that
    matters right now.
  - *Coherence* — cut extraneous detail and decoration; it competes for attention.
  - *Segmenting* — break complex material into learner-paced chunks (reveal
    progressively; more slides over denser slides).

## Typography, hierarchy, whitespace

- Sans-serif, large enough to read from the back row. Body text large; never
  shrink fonts to cram more in — split the slide instead.
- Clear hierarchy: headline largest/boldest, subhead smaller, body smallest.
- **~30–40% of the slide should be whitespace.** It reduces load, groups related
  content, and paces delivery.
- Contrast: meet WCAG AA (≥4.5:1 for body text). Don't rely on color alone
  (color-blindness); reinforce with text/shape/position.

## Fill the canvas — use all available space

- **Every slide should use the full canvas with balanced proportions.** No slide
  should top-anchor its content and leave a large dead band at the bottom (or any
  one edge). Compose so the frame reads as *designed*: the content sits as a
  balanced block, visuals are sized to occupy their region, and whitespace is
  *distributed around* the content, not dumped in one corner.
- **Balance, don't stretch.** "Use the space" means proportionate sizing and
  vertical balance — center or distribute the content group — **not** blowing text
  up to the edges or inserting gratuitous gaps. The ~30–40% whitespace guidance
  still holds; it should frame the content evenly.
- **Size elements to their role and region.** Titles large; body comfortably
  readable from the back; code/diagrams/placeholders sized to fill the column or
  half they occupy. A small panel floating in a big empty half is a smell — make
  it fill its region, or rebalance the split.
- **This is a generation default, not a touch-up.** Most slide frameworks
  top-anchor content by default, so left alone slides look like drafts with a
  dead lower third. Set deck-wide rules so *every* slide fills and balances out of
  the box (see the concrete Slidev recipe in `slidev-cheatsheet.md`), then catch
  stragglers in the Gate 3 self-verify "under-filled" check.

## Color

- 2–3 primary colors per deck. Apply 60-30-10 (dominant / secondary / accent).
- Use color with purpose: categorize, highlight, or show a scale. Gray out
  non-essential elements to direct focus.

## Data visualization

- **Remove chartjunk (Tufte):** no 3D, no heavy gridlines, no decorative
  backgrounds, no redundant labels, no shadows. Maximize data-ink.
- Use familiar chart types (bar / line / scatter / table / a single big number).
  Familiar charts are read faster and more accurately than novelty visuals.
- **Highlight the takeaway:** color the one bar/line you're discussing, gray the
  rest, and annotate the insight directly on the chart ("peak here").
- For technical/expert audiences include methodology, caveats, and confidence —
  rigor builds trust.

## Pacing & slide count

- Budget ~**1–2 minutes per slide**. Dense slides take longer; simple ones move
  fast. (See `interview.md` for the slide-count formula.)
- Don't front-load; spread content so each slide breathes.
- Vary slide style (diagram → code → photo → statement) to avoid monotony;
  change pace for emphasis.

## Speaker notes vs on-slide text

- Slides are for the **audience** (visual, minimal). Notes are for the
  **speaker** (talking points, the full-prose assertion, stats, transitions, time
  cues). Put the detail in notes; keep the slide clean. (Whether to generate notes
  is an interview question.)

## Animation

- Animation has a cognitive cost. Use it only when motion *conveys information*
  (revealing a process step-by-step, showing cause/effect). Keep it slow and
  predictable. No decorative motion.

---

## Myth-flags — DO NOT cite these as law

- **Mehrabian 7%/38%/55% ("93% of communication is non-verbal").** Misapplied.
  The original work was about *incongruent messages of feeling/attitude*, not
  general or technical communication. Don't use it to justify slide decisions.
- **10/20/30 rule (Kawasaki).** A reasonable heuristic *for startup pitch decks*,
  not a universal law. Structure to the actual audience/duration/medium.
- **6×6 rule (≤6 bullets, ≤6 words).** A nudge toward brevity, not a rule. Prefer
  assertion-evidence over counting words; split dense ideas across slides.

Treat all three as folklore. If a user insists, comply, but don't *originate*
slides from them.

---

## Sources

- Garr Reynolds — *Presentation Zen* / Design tips: https://www.garrreynolds.com/design-tips
- Nancy Duarte — *Slide:ology*: https://www.duarte.com/resources/books/slideology/ ; *Resonate* / sparkline: https://www.duarte.com/blog/creating-moments-of-impact-using-sparklines-for-strategic-conversations/
- Michael Alley — Assertion-Evidence: https://www.assertion-evidence.com/ ; study: https://peer.asee.org/assertion-evidence-slides-appear-to-lead-to-better-comprehension-and-recall-of-more-complex-concepts.pdf
- Edward Tufte — chartjunk / data-ink; *The Cognitive Style of PowerPoint*: https://www.edwardtufte.com/tufte/powerpoint
- Richard Mayer — multimedia learning principles: https://www.digitallearninginstitute.com/blog/mayers-principles-multimedia-learning
- Mehrabian myth debunk: https://publicwords.com/2009/07/23/debunking-the-debunkers-the-mehrabian-myth-explained-correctly/
- 10/20/30 (Kawasaki): https://guykawasaki.com/the_102030_rule/
- Whitespace: https://www.brightcarbon.com/blog/presentation-whitespace/
- Color contrast/accessibility: https://slidescorner.com/color-contrast-and-accessibility-in-slide-design-2026-complete-guide
