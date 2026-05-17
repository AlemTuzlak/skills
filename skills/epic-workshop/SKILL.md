---
name: epic-workshop
description: Use when generating, planning, authoring, or recording an Epic Web / Epic React style workshop, exercise, tip, or video. Applies Kent C. Dodds' "How to be an Epic Instructor" principles to workshop design, exercise structure, recording, and material delivery, and encodes Epic Web's exercise-comment emoji conventions. Used to generate workshops following https://www.epicweb.dev/get-started. Triggers on "create a workshop", "generate a workshop", "design an exercise", "record a workshop video", "Epic workshop", "Epic Web", "Epic React", or `/epic-workshop`.
---

# Epic Workshop

Generates and shapes Epic Web / Epic React style workshops. Encodes Kent C. Dodds' "How to be an Epic Instructor" guidance plus Epic Web's exercise-comment emoji conventions. Use whenever the user is producing teaching material in the Epic Web style — workshops, exercises, tips, recorded videos, or workshop apps.

The end goal is a workshop that fits the Epic Web getting-started flow at https://www.epicweb.dev/get-started — meaning it runs in the Epic workshop app (kcdshop), follows the welcome → exercise (intro → problem → solution → outro) → outro structure, and uses the emoji-key conventions in exercise comments.

## When this skill applies

Invoke when the user is doing any of:

- Designing a new workshop (topics, exercises, sequencing)
- Writing exercise problem/solution material
- Planning workshop video recordings
- Setting up the workshop app for a new workshop
- Reviewing existing workshop material against Epic standards
- Scheduling, pricing, or running a live workshop
- Recording tips or supplementary content tied to a workshop

## Guiding principles (these override generic instructional-design advice)

### 1. Opinions and consistency

The product is **the instructor's opinion**, not a survey of options. Learners are paying to skip analysis paralysis. So:

- Pick one solution and teach it deeply. Don't teach Next.js + Remix + Astro side-by-side.
- **Heuristic:** if it would not make sense to use both tools/approaches in the same app, teach only one. If both would coexist in a real app (e.g. in-memory cache + SQLite cache), teach both.
- Avoid contradicting earlier material or other Epic instructors. Consistency across the curriculum matters.

When the user proposes covering "multiple approaches," challenge it against this heuristic before agreeing.

### 2. Avoid distraction

Match example complexity to the format:

- **Tip / standalone video** → can use a richer, more domain-specific context (full app)
- **Workshop exercise** → must use a simple, isolated example, OR a domain the learner has been progressively built up to in earlier exercises
- **Screen setup** → defer to [howtoegghead.io](https://howtoegghead.com/instructor/screencasting/) for screencast hygiene; minimize on-screen clutter
- **Face on camera** → encouraged (small corner circle is fine, no green screen required); makes flow more natural and reduces editing

If an exercise requires the learner to "onboard" to the example before learning can start, the example is too domain-specific.

### 3. Problems before solutions

Never present a solution without first establishing the problem. The pattern:

1. State the goal
2. Try the obvious-but-wrong approach (or a couple of them)
3. Show why it fails
4. Then introduce the real solution

Reference example: Simon's Tailwind glassmorphism tip — `bg-transparent` → fail → `bg-white/20` → `blur-md` → fail → real solution.

Cap this at 1–2 wrong attempts. Don't enumerate every possible misstep.

### 4. Desirable difficulties

Workshops follow **problem → learner attempts → solution**, not "watch me code." The learner's failure during the attempt is the learning event. When designing exercises:

- The problem step must be solvable enough that a motivated learner can make progress, but hard enough that they engage
- The solution step reveals the canonical answer after they've tried
- Don't collapse problem + solution into a single "follow along" video

### 5. Experience-based instruction

Don't teach a tech you've only spent two hours with. Either:

- Ship something real with it, or
- Spend serious time using it and talking to people who have shipped with it

Workshops iterate through live delivery. The rule: **never give the same workshop twice without changes**. Take notes on every live delivery — split exercises, delete exercises, add exercises, even split a workshop into multiple workshops. Only record after several live deliveries have stabilized the material.

### 6. Instructors make their own demos

The instructor authors the exercise material themselves. Outside help is fine for design polish or feedback, but the instructor owns the demo end-to-end. This is non-negotiable for live Q&A quality.

### 7. Give freely

- All workshop material is open source on GitHub
- Free articles, tips, talks, tutorials are *encouraged* alongside paid material — they don't cannibalize, they amplify
- Long instruction blocks often graduate into standalone blog posts; tangents become tips. Both can be linked back from exercise instructions.

## Workshop structure

Every workshop is a **flat list of laser-focused exercises** plus framing videos:

- Workshop welcome
  - Exercise 1 intro
    - Exercise 1 **problem**
    - Exercise 1 **solution**
  - Exercise 1 outro
  - Exercise 2 intro
    - Exercise 2 **problem**
    - Exercise 2 **solution**
  - Exercise 2 outro
  - ... (one block per exercise)
- Workshop outro

Each exercise has **exactly one** problem and **exactly one** solution. There are no "steps" within exercises.

Reference: https://foundations.epicweb.dev/

Exercises are embedded in the workshop app (https://github.com/epicweb-dev/kcdshop). Videos published on epicweb.dev are embedded back into instructions via:

```html
<EpicVideo url="https://www.epicweb.dev/workshops/.../solution" />
```

## One exercise = one concept

**Each exercise teaches one specific concept and has exactly one problem/solution pair. No multi-step exercises.**

If you catch yourself drafting "Exercise X has 2 steps: first A, then B" — that's two exercises, not one. Split them: Exercise X teaches A; Exercise X+1 teaches B.

Signs an exercise has been over-packed:

- The title needs the word "and" — "Build X **and** wire Y"
- Pacing creeps over ~30 minutes of focused work
- The problem-before-solution framing has more than one "aha" moment
- The plan uses numbered sub-steps inside the exercise
- You're tempted to write `01.problem.foo`, `02.problem.bar`, etc. inside the same exercise directory

Why this matters:

- Tighter problem → solution arcs are easier to record, easier to ship as embeddable videos, and easier for learners to consume on-demand
- Learners hit a success milestone every 15–30 minutes, which builds momentum
- Each exercise becomes individually skippable for learners who already know one concept but want the next
- The workshop is easier to remix later (add, remove, reorder) when every exercise is atomic

When in doubt, split. It's almost always easier to merge two short exercises later than to surgically split one bloated one.

## Logistics defaults

- **Length:** 5–6 hours including breaks (longer drains learners)
- **Price:** ~$300–350 per day
- **Frequency:** instructor's choice
- **Venue:** Gather.town by default; otherwise instructor specifies
- **Team needs from instructor:** dates, times, venue details, copy/description
- **Code of conduct:** https://kentcdodds.com/conduct (PG content — keep it shareable with a 6-year-old)
- **AI assistants:** use them on camera; teaching learners to evaluate AI output is part of the job

## Recording rules

- **Never show the workshop app on camera.** It evolves and dates the video. Show the playground in the editor / browser / terminal instead.
- Record only after the workshop has been delivered live multiple times.
- Face-in-corner is recommended.
- Editing: self-edit, or upload raw to Dropbox for Skill Recordings editors (cost deducted from first royalties).
- Screencast technical guidance: https://howtoegghead.com/instructor/screencasting/

## Process when invoked

When the user says "I want to create a new workshop" (or similar), run this flow before any material is written:

1. **Clarify the workshop topic and target audience.** Confirm the *one* opinionated stack/approach being taught. Surface and resolve any "should we cover X or Y" questions using the same-app heuristic.
2. **Validate experience.** Has the user shipped with this tech, or spent serious time with it? If not, flag it and discuss how to close the gap before teaching.
3. **Outline the exercise progression.** Each exercise must build on the previous so by the time a domain-specific exercise appears, the learner is already onboarded. Draft the exercise list before any code.
4. **For each exercise, draft problem-before-solution framing.** What's the goal? What's the obvious-but-wrong attempt? What's the canonical solution?
5. **Plan the live delivery cadence before recording.** Recording is the *last* step, after several live runs.
6. **Confirm scope.** Is this a single workshop or should it be split? (Kent's "Build an Epic Web App" started as one and became four.)

Only after these are settled should the user start writing exercise code or recording.

## Red flags to push back on

If the user proposes any of these, surface the principle and ask them to reconsider:

| Proposal | Principle violated |
|----------|---------------------|
| "Let's compare React Router vs Remix in this workshop" | Opinions and consistency |
| "We'll just have them follow along and code with me" | Desirable difficulties |
| "I'll record this before running it live" | Experience-based instruction |
| "Let's use a full production app as the exercise sandbox" | Avoid distraction (for exercises specifically) |
| "Skip the wrong-attempt step, just show the answer" | Problems before solutions |
| "I'll outsource the exercise authoring" | Instructors make their own demos |
| "Let's keep this workshop closed-source so it stays valuable" | Give freely |

## Emoji Key

Epic Web exercises use a recurring cast of named emoji characters in code comments and `README.mdx` files to guide the learner through each step. Use these consistently when authoring exercise content (problem code, solution code, instructions). Don't invent new ones — the cast is fixed across all Epic Web workshops, which is how learners build intuition for what each emoji means.

| Emoji | Name | Role |
|-------|------|------|
| 👨‍💼 | Peter the Product Manager | Tells us what our users want |
| 🧝‍♀️ | Kellie the Co-worker | A co-worker who sometimes does work ahead of your exercises |
| 🐨 | Kody the Koala | Tells you when there's something specific you should do |
| 🦺 | Lily the Life Jacket | Helps with TypeScript-specific parts of the exercises |
| 💰 | Marty the Money Bag | Gives specific tips (and sometimes code) along the way |
| 📝 | Nancy the Notepad | Encourages you to take notes on what you're learning |
| 🦉 | Olivia the Owl | Gives useful tidbits and best-practice notes |
| 📜 | Dominic the Document | Gives links to useful documentation |
| 💣 | Barry the Bomb | Hangs around anywhere you need to blow stuff up (delete code) |
| 💪 | Matthew the Muscle | Indicates you're working with an exercise |
| 🏁 | Chuck the Checkered Flag | Indicates you're working with a final |
| 🚨 | Alfred the Alert | Shows up in test failures with potential explanations for why the tests are failing |

### Authoring rules

- **Match the emoji to the role.** Don't use Kody for a TypeScript hint — that's Lily. Don't use Olivia for a doc link — that's Dominic.
- **Stay terse.** One sentence per emoji line. The character is the framing; the instruction is what matters.
- **Wrong-attempt code uses 💣.** When the learner needs to delete the wrong-attempt placeholder before writing the real solution, Barry shows up there.
- **Doc links go through 📜 Dominic.** Don't drop bare links into instructions; have Dominic introduce them.
- **TypeScript-only friction goes through 🦺 Lily.** This keeps the main flow language-agnostic in tone even when the code is TS.
- **🚨 Alfred lives in test output**, not in instruction prose. Use him in test assertion messages so failure logs read in-character.

## Scope of learner work

The learner's job is to **consume identifiers**, not introduce them. Every problem-step starter must already have:

- **All required `import` lines pre-added** — even if the imported identifier isn't used yet. Learners never write or uncomment imports. They reference identifiers that the scaffold already brought into scope.
- **All presentational code pre-built** — JSX, styling, layout, dark mode, ARIA, form HTML, animations. None of this is on the learner's plate unless the workshop is explicitly about UI.
- **All infrastructure pre-built** — DB queries, ORM setup, framework loaders/actions/middleware, env config, route registration, package installs.

The carved-out hole the learner fills is whatever the workshop is *actually about* — the library API, the hook call, the schema, the tool definition, the system prompt, etc. Carve it as small as possible.

When 💣-marking wrong-attempt code, prefer leaving the imports in place (the imports stay legitimate after the new approach lands) and only marking the wrong *usage* for deletion. If an import truly becomes dead, mention it in the README instructions rather than asking the learner to delete an `import` line in code.

If your project's TS settings flag unused pre-added imports, fix the tsconfig (`"noUnusedLocals": false` or equivalent) rather than asking learners to write imports.

## References

- Workshop app: https://github.com/epicweb-dev/kcdshop
- Epic Web getting started (workshop generator entrypoint): https://www.epicweb.dev/get-started
- Workshop chat management: https://www.coursebuilder.dev/tips/workshop-chat-m7gb9
- Calendar event communication: https://www.coursebuilder.dev/tips/google-calendar-for-workshop-attendee-communication-hw6c2
- Gather.town setup: https://www.coursebuilder.dev/tips/gather-town-setup-for-online-coding-workshops-gvo8u
- Screencasting guide: https://howtoegghead.com/instructor/screencasting/
- Code of conduct: https://kentcdodds.com/conduct
- Example workshop site structure: https://foundations.epicweb.dev/
