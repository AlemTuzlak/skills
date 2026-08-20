# Skills

Personal [Agent Skills](https://agentskills.io) I use across every project. They turn a PR, a git ref, or a freeform idea into marketing briefs, blog posts, changelogs, social copy, newsletters, video scripts, rendered promo videos, architecture impact docs, technical presentation decks, documentation, RFCs, PRDs, and full courses.

Packaged as a Claude Code plugin, but the skills themselves are plain `SKILL.md` files with standard YAML frontmatter, the same format documented for **Claude Code, GitHub Copilot CLI, OpenAI Codex CLI, Google Gemini CLI, and Cursor**. Drop them in any of those tools' skills directories and they work. See [Install](#install).

---

## Why this exists

I kept rewriting the same prompts: "summarize this PR for marketing", "draft the changelog", "write a launch tweet", "make me a 30s promo video". Every time, slightly different framing, slightly different quality. So I baked the *expert versions* of those prompts into reusable skills with strong opinions:

- **Decision-maker framing.** Architecture and marketing skills lead with the *"so what?"*, not what was refactored.
- **Input pluralism.** Every skill accepts a PR URL, a git ref range (`v1.0...v2.0`), a file path, a marketing brief, an upstream blog post, or freeform text.
- **Composability.** The marketing skills feed each other: brief, then blog post, then social copy, then newsletter, or run all of it via `/marketing-pipeline`.
- **No fluff.** Skills enforce hooks, length limits, layout gates, and brand checks. The output is shippable, not "AI-generated".

---

## The skills

| Skill | What it does |
|---|---|
| [architecture-impact](./skills/architecture-impact) | Before/after architecture analysis for a PR with visual diagrams |
| [marketing-brief](./skills/marketing-brief) | Structured marketing brief from a PR, ref range, or feature |
| [changelog](./skills/changelog) | Polished, Keep-a-Changelog-style release notes from git history |
| [blog-post](./skills/blog-post) | Long-form blog posts with SEO, structure, and tone matching |
| [newsletter](./skills/newsletter) | Product update emails with subject line + preview text |
| [social-copy](./skills/social-copy) | Platform-specific copy (X, LinkedIn, etc.) tuned per algorithm |
| [video-script](./skills/video-script) | Timed, paced video scripts with visual directions |
| [remotion-video](./skills/remotion-video) | Rendered `mp4` + poster via Remotion (React-based) |
| [hyperframes-video](./skills/hyperframes-video) | Rendered `mp4` + poster via HyperFrames (HTML/GSAP-based) |
| [marketing-pipeline](./skills/marketing-pipeline) | Orchestrate any combination of the above from one input |
| [presentation](./skills/presentation) | Research-grounded, craft-driven technical slide decks built on Slidev, live in the browser with zero manual steps |
| [teach-me](./skills/teach-me) | Evidence-based course generator: markdown course plus interactive HTML mini-course |
| [epic-workshop](./skills/epic-workshop) | Epic Web / Epic React-style workshops, exercises, tips, and recordings |
| [docs](./skills/docs) | Framework-agnostic documentation writer: shows you the readers, asks for tone, then writes pages through `simple-english` and `i-have-adhd` |
| [rfc](./skills/rfc) | Interactive RFC / design-doc writer: interviews you, grounds the proposal in your codebase, shows real API options to pick from |
| [to-prd](./skills/to-prd) | PRD writer from finished work, a ticket, or a PR, using the CopilotKit EEP spec template |
| [produce-video](./skills/produce-video) | Turn a raw recording into a finished, edited, annotated video + content package |
| [transcribe-video](./skills/transcribe-video) | Transcribe video/audio to text with word-level timestamps (local Whisper) |
| [youtube-copy](./skills/youtube-copy) | YouTube metadata: title, SEO description, tags, timestamped chapters |
| [i-have-adhd](./skills/i-have-adhd) | ADHD-shaped output: next action first, numbered steps, lists capped at 5. Also the writing filter `docs` loads before pages |
| [accessible-html](./skills/accessible-html) | Accessible markup by default: loads on any UI code, plus a hook that catches defects as they are written |
| [tanstack-branding](./skills/tanstack-branding) | TanStack brand kit: exact tokens, category accents, contrast data, plus the real logo and font files |

---

## Why each one is cool

### [architecture-impact](./skills/architecture-impact)
**The "so what" engine for engineering leadership.** Most PR descriptions are written by/for the author. This produces a doc you can hand to a PM or eng lead. Forces a TL;DR, before/after diagrams (one diagram = one question), business-impact framing, and an *honest* risk section. Passes the "newspaper test": if someone reads only the title, they understand why it matters.

**How it works:** reads PR diff + description, extracts the actual architectural delta (not just file changes), generates Mermaid diagrams for before/after, then writes the doc with progressive disclosure: TL;DR first, technical detail at the bottom.

### [marketing-brief](./skills/marketing-brief)
**A brief that a non-marketer can actually produce.** Resolves any input (PR / ref range / path / freeform) into Executive Summary, Key Messages, Target Audience, Positioning, and Call to Action. It's the canonical source of truth that downstream skills (blog, social, newsletter, video) all key off. Write it once, reuse everywhere.

### [changelog](./skills/changelog)
**Release notes that don't sound like commit messages.** Walks `git log` over a ref range (or a single PR), categorizes Added/Fixed/Changed/Removed, and *rewrites* commit subjects into user-facing language. Optional `gh release create`. Smart enough to take a single `#1234` and append it to an existing CHANGELOG.md version.

### [blog-post](./skills/blog-post)
**Tone-matched, SEO-aware long-form.** Will detect the repo's existing blog voice (if there are prior posts), nail the headline, structure for skimming, and propose hero/inline image directions. Accepts a marketing brief as input so you skip the "what's this about" round trip.

### [newsletter](./skills/newsletter)
**Email that respects an inbox.** Subject line + preview text + body, calibrated to user-facing audience (not eng-internal). Chains naturally off a blog post or changelog: it lifts the hook from one and the bullets from the other.

### [social-copy](./skills/social-copy)
**Platform-native, algorithm-aware.** X gets short hooks + thread structure; LinkedIn gets the long-post format with a proper opening line and line breaks that survive mobile. Each platform has its own ruleset under [`platforms/`](./skills/social-copy/platforms). No "🚀 Excited to announce" energy.

### [video-script](./skills/video-script)
**Scripts with timing and visual directions.** Not a wall of narration: proper two-column style with on-screen action, B-roll suggestions, pacing per platform (15s reel vs. 90s demo vs. 3min walkthrough), and a hook that earns the next 3 seconds.

### [remotion-video](./skills/remotion-video)
**An actual rendered `mp4`, via [Remotion](https://www.remotion.dev/).** Resolves a PR into a narrative (hook, code moments, CTA), generates a Remotion project, opens preview, iterates with you, then renders `video.mp4` + `poster.jpg` for X/LinkedIn. Brand auto-detection lives in [`brand-detection.md`](./skills/remotion-video/brand-detection.md); reusable scene patterns under [`patterns/`](./skills/remotion-video/patterns) and [`templates/`](./skills/remotion-video/templates).

### [hyperframes-video](./skills/hyperframes-video)
**Same shape as `remotion-video`, but on the HTML/GSAP stack.** Uses [HyperFrames](https://hyperframes.dev) for people who'd rather author in HTML/CSS than React. Enforces the canvas-fill rule (no letterboxing across formats), synchronized chapter narration, layout-before-animation discipline, and a brand scan + preview gate before render. Pairs with the `hyperframes` and `hyperframes-cli` skills if you have those installed.

### [marketing-pipeline](./skills/marketing-pipeline)
**One command, full launch kit.** Pick which skills to run (`brief, blog, social, newsletter, video`) and the order. Each step's output feeds the next, so the brief informs the blog, the blog informs the social posts, the changelog feeds the newsletter, and so on. No re-feeding context yourself.

### [presentation](./skills/presentation)
**A technical deck that's actually been researched, not hallucinated.** A director layer on top of [Slidev](https://sli.dev): it owns the *content* and the *craft*, and delegates Slidev syntax to Slidev's own official skill (installing it if missing), so when Slidev's syntax evolves, the craft here stays valid. Before it talks to you it does deep research on the topic (flagging weakly-supported presentation myths instead of repeating them) and, for a specific library/tool, analyzes the *real code* (local repo > GitHub > package > docs) so every slide is technically correct. Then it interviews you (audience, per-area depth, tone, brand, assets, output), storyboards for approval, and generates a deck applying evidence-based craft: assertion-evidence headlines, one-idea-per-slide, 5 to 7 lines of code with progressive reveal, diagrams over walls of code, a hook-to-takeaways arc.

**What sets it apart:** it *generates* the assets it legitimately can (Shiki code images, Mermaid diagrams rendered to PNG) and only leaves clearly-marked placeholders for what must be real, never faking screenshots or data. It then **self-verifies** every slide in a headless browser (overflow, clipped code, contrast, overstuffed) and auto-fixes, and **finishes live**: dev server running, deck open in the browser, zero manual steps.

### [docs](./skills/docs)
**Docs a human actually wants to read.** Treats "document feature X" as the wrong goal and "help someone do Y with X" as the right one. Finds your docs folder (or asks where it is), reads a few existing pages to learn structure and components, and reuses whatever the site already has (steps, tabs, callouts) for storytelling, so it's tied to no framework. Plans the reader's story first, then **stops**: it shows you the discovered readers and waits, then asks for tone (neighbors are a proposed default, not a silent yes). Only after that does it load `simple-english` and `i-have-adhd` and write the pages. Splits a topic into short linked pages instead of one giant wall. Shows runnable code over prose, and enforces hard bans: no em-dashes, no separator glyphs, no "not X: it's Y" phrasing, and no justifying the shipped API against names or approaches that never shipped. Fires at feature planning and implementation time, not only when asked, because docs ship with the code.

### [i-have-adhd](./skills/i-have-adhd)
**Output an ADHD brain can act on.** Vendored from [ayghri/i-have-adhd](https://github.com/ayghri/i-have-adhd). First line is the next action, multi-step work is numbered, lists cap at 5, state is restated every turn, wins are visible, no preamble or closer. It does not auto-invoke (`disable-model-invocation: true`). Call `/i-have-adhd` for a session, or let `docs` load it as a writing filter for documentation pages. When `docs` loads it, the rules apply to the pages only.

### [rfc](./skills/rfc)
**An RFC that survives review, not a doc-shaped placeholder.** An RFC's value is the thinking it forces (honest goals, real alternatives, named risks, a concrete design), so this skill forces that thinking instead of generating an RFC-shaped document with hand-waved sections. It interviews you to surface the parts your ticket and code haven't already answered, and inside a repo it scans the affected subsystem and cites real files. It shows you 2 to 3 concrete API/code approaches and lets you pick: the one you choose becomes the Proposed Design, the ones you reject become the Alternatives Considered section with their code intact, so the alternatives are real instead of strawmen. It self-critiques the draft against a quality rubric before you ever see it, then writes the RFC to a repo-aware path and opens it.

### [to-prd](./skills/to-prd)
**A PRD from the work you just finished, not a blank spec.** Uses the CopilotKit EEP template (problem and solution from the user's view, a long user-story list, implementation decisions, testing decisions, a manual test plan, out of scope). It reads the session, the repo, the PR, or the ticket first, then grills you on each heading until you agree. Implementation decisions stay at modules and contracts, not file paths. Writes markdown to `docs/prds/` and opens it in Plannotator.

### [accessible-html](./skills/accessible-html)
**Accessibility as a writing habit, not an audit.** Accessible markup rarely fails from ignorance: it fails because someone knew the rule and skipped it at 5pm. So this skill loads on any UI code (HTML, JSX/TSX, Vue, Svelte, Angular templates, CSS that touches focus, contrast, motion, or hit area) and on element names like button, modal, dropdown, or any click handler, not just on the word "accessibility". It keeps the load-bearing rules in `SKILL.md` where they get read, gates its reference files behind a trigger table, and names the required parts of each widget so a dialog without focus return or a `role="menu"` without arrow keys reads as unfinished. It also handles the ugly real case: adding to a file that is already broken and marked "do not refactor".

**How it works:** the rules come from Playful Programming's Art of Accessibility series, WCAG 2.2 AA, the ARIA Authoring Practices patterns, and the WebAIM Million failure data. It ships `hooks/a11y-guard.js`, a `PreToolUse` hook that reads the markup you are about to write and reports the specific defects (`outline: none` with no replacement, click handlers on divs, positive `tabindex`, missing alt, blocked pinch zoom, single-key shortcuts with no off switch). It never blocks and says nothing when the code is clean. The hook exists because pressure-testing proved a skill cannot enforce itself: one run never loaded the skill and reported that it had.

---

## How they work (under the hood)

Each skill is a single `SKILL.md` file with YAML frontmatter:

```markdown
---
name: blog-post
description: Use when the user wants to write a blog post about a feature, product change, PR, git diff, or any technical topic
---

# Blog Post Writer
...
```

The agent loads the description at session start to decide *when* to invoke the skill, and loads the body on demand when it does. That means:

- **Zero context cost when idle.** Skills don't pollute the context window unless you use them.
- **Triggered automatically.** "Write a blog post about #1234" triggers `blog-post` without you typing `/blog-post`.
- **Composable.** Skills can reference other skills and pass artifacts between them.

Skills with extra structure (`hyperframes-video`, `remotion-video`, `social-copy`) ship supporting files alongside `SKILL.md` (patterns, templates, references, hooks) that the skill's body links to.

---

## Install

The repo's canonical layout is `skills/<skill-name>/SKILL.md`. Every supported CLI just needs that folder copied or symlinked into one of its discovery paths. No extra manifest beyond the `SKILL.md` files themselves (Claude Code's plugin manifests live in `.claude-plugin/` and are bundled with the repo).

### Claude Code: plugin marketplace (recommended)

```text
/plugin marketplace add alemtuzlak/skills
/plugin install alemtuzlak-skills@alemtuzlak
```

The repo ships both `.claude-plugin/plugin.json` and `.claude-plugin/marketplace.json`. `alemtuzlak` is the marketplace name, `alemtuzlak-skills` is the plugin name. Restart Claude Code (or run `/reload-plugins`) after installing.

Plugin-installed skills are invoked as `/alemtuzlak-skills:blog-post`, etc.

Docs: [Discover and install plugins](https://code.claude.com/docs/en/discover-plugins.md), [Create a plugin marketplace](https://code.claude.com/docs/en/plugin-marketplaces.md).

### Claude Code: drop-in skills (no plugin)

```bash
git clone git@github.com:alemtuzlak/skills.git /tmp/alem-skills

# Personal (all projects)
cp -r /tmp/alem-skills/skills/* ~/.claude/skills/

# Or project-scoped
mkdir -p .claude/skills && cp -r /tmp/alem-skills/skills/blog-post .claude/skills/
```

Drop-in skills are invoked as `/blog-post`, `/changelog`, etc.

### GitHub Copilot CLI

Discovery paths: `.github/skills/`, `.claude/skills/`, `.agents/skills/` (project), `~/.copilot/skills/`, `~/.agents/skills/` (personal).

```bash
git clone git@github.com:alemtuzlak/skills.git /tmp/alem-skills
mkdir -p ~/.agents/skills
cp -r /tmp/alem-skills/skills/* ~/.agents/skills/
```

Docs: [Adding agent skills for GitHub Copilot CLI](https://docs.github.com/en/copilot/how-tos/copilot-cli/customize-copilot/add-skills).

### OpenAI Codex CLI

Discovery paths (in precedence order): `$CWD/.agents/skills`, `$REPO_ROOT/.agents/skills`, `~/.agents/skills`, `/etc/codex/skills`.

```bash
git clone git@github.com:alemtuzlak/skills.git /tmp/alem-skills
mkdir -p ~/.agents/skills
cp -r /tmp/alem-skills/skills/* ~/.agents/skills/
```

Optional per-skill `agents/openai.yaml` files can add Codex-specific UI metadata, invocation policy, and tool dependencies. None are required for the skills to work.

Docs: [Agent Skills for OpenAI Codex](https://developers.openai.com/codex/skills).

### Google Gemini CLI

Easiest, since Gemini has a native install command for git repos:

```bash
gemini skills install https://github.com/alemtuzlak/skills.git --path skills
```

Or drop-in (paths: `.gemini/skills/` or `.agents/skills/` for project, `~/.gemini/skills/` or `~/.agents/skills/` for user; the `.agents/` alias takes precedence within each tier).

Docs: [Skills for Gemini CLI](https://geminicli.com/docs/cli/skills/).

### Cursor

Discovery paths: `.agents/skills/`, `.cursor/skills/` (project) and `~/.agents/skills/`, `~/.cursor/skills/` (user). Cursor also reads `.claude/skills/` and `.codex/skills/` for compatibility.

```bash
git clone git@github.com:alemtuzlak/skills.git /tmp/alem-skills
mkdir -p ~/.agents/skills
cp -r /tmp/alem-skills/skills/* ~/.agents/skills/
```

Docs: [Skills for Cursor](https://cursor.com/docs/skills).

### Once-and-done install for all `.agents/skills/` agents

Codex, Gemini, Copilot CLI, and Cursor all honor `~/.agents/skills/`, so a single copy makes the skills available in **all four**:

```bash
git clone git@github.com:alemtuzlak/skills.git /tmp/alem-skills
mkdir -p ~/.agents/skills
cp -r /tmp/alem-skills/skills/* ~/.agents/skills/
```

### Other tools

- **Windsurf (Cascade):** uses `.windsurf/skills/<name>/` and `~/.codeium/windsurf/skills/<name>/`. Does **not** read `.agents/skills/`. Manual copy required.
- **Aider, continue.dev:** no native agent-skills support at this time.

### Claude Agent SDK / custom runner

The `SKILL.md` files are plain markdown with `name` / `description` YAML frontmatter. Load them yourself:

```ts
import { readFileSync } from "node:fs";
import matter from "gray-matter";

const skill = matter(readFileSync("skills/blog-post/SKILL.md", "utf8"));
// skill.data.name, skill.data.description, skill.content
```

---

## Usage

Once installed, just describe what you want. The agent picks the right skill from the description.

```
> Write me a launch tweet for #1234
   → triggers social-copy

> Generate release notes between v1.4.0 and v1.5.0
   → triggers changelog

> Make a 30-second promo video for the auth refactor PR
   → triggers remotion-video (or hyperframes-video)

> Full launch content for #1234: brief, blog, tweet, newsletter
   → triggers marketing-pipeline
```

Or invoke explicitly:

```
/marketing-brief #1234
/blog-post .tmp/marketing-brief.md
/changelog v1.4.0...v1.5.0
/marketing-pipeline #1234
```

---

## Repo layout

```
.
├── .claude-plugin/
│   ├── plugin.json           # Claude Code plugin manifest
│   └── marketplace.json      # Claude Code marketplace listing
├── AGENTS.md                 # rules for agents working in this repo
├── CLAUDE.md                 # pointer to AGENTS.md
├── skills/
│   ├── accessible-html/      # multi-file: references/, hooks/ (PreToolUse a11y guard)
│   ├── architecture-impact/SKILL.md
│   ├── blog-post/SKILL.md
│   ├── changelog/SKILL.md
│   ├── docs/SKILL.md
│   ├── epic-workshop/SKILL.md
│   ├── i-have-adhd/SKILL.md  # ADHD output style; also a docs writing filter
│   ├── hyperframes-video/    # multi-file: patterns/, templates/, hooks/, references/
│   ├── marketing-brief/SKILL.md
│   ├── marketing-pipeline/SKILL.md
│   ├── newsletter/SKILL.md
│   ├── presentation/         # multi-file: references/, assets/ (Shiki+Mermaid render helper)
│   ├── produce-video/SKILL.md
│   ├── remotion-video/       # multi-file: patterns/, templates/, hooks/, references/
│   ├── rfc/SKILL.md
│   ├── to-prd/               # multi-file: assets/prd-template.md (EEP spec)
│   ├── social-copy/          # multi-file: platforms/
│   ├── teach-me/             # multi-file: assets/ (HTML mini-course builder)
│   ├── transcribe-video/     # multi-file: bundled local Whisper service
│   ├── video-script/SKILL.md
│   └── youtube-copy/SKILL.md
└── README.md
```

---

## License

MIT. Fork them, edit them, make them yours. If you improve one, PRs welcome.
