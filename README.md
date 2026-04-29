# Skills

Personal [Agent Skills](https://agentskills.io) I use across every project — turn a PR, a git ref, or a freeform idea into marketing briefs, blog posts, changelogs, social copy, newsletters, video scripts, rendered promo videos, and architecture impact docs.

Packaged as a Claude Code plugin, but the skills themselves are plain `SKILL.md` files with standard YAML frontmatter — the same format documented for **Claude Code, GitHub Copilot CLI, OpenAI Codex CLI, Google Gemini CLI, and Cursor**. Drop them in any of those tools' skills directories and they work. See [Install](#install).

---

## Why this exists

I kept rewriting the same prompts: "summarize this PR for marketing", "draft the changelog", "write a launch tweet", "make me a 30s promo video". Every time, slightly different framing, slightly different quality. So I baked the *expert versions* of those prompts into reusable skills with strong opinions:

- **Decision-maker framing.** Architecture and marketing skills lead with the *"so what?"* — not what was refactored.
- **Input pluralism.** Every skill accepts a PR URL, a git ref range (`v1.0...v2.0`), a file path, a marketing brief, an upstream blog post, or freeform text.
- **Composability.** The marketing skills feed each other: brief → blog post → social copy → newsletter, or run all of it via `/marketing-pipeline`.
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

---

## Why each one is cool

### [architecture-impact](./skills/architecture-impact)
**The "so what" engine for engineering leadership.** Most PR descriptions are written by/for the author. This produces a doc you can hand to a PM or eng lead. Forces a TL;DR, before/after diagrams (one diagram = one question), business-impact framing, and an *honest* risk section. Passes the "newspaper test": if someone reads only the title, they understand why it matters.

**How it works:** reads PR diff + description, extracts the actual architectural delta (not just file changes), generates Mermaid diagrams for before/after, then writes the doc with progressive disclosure — TL;DR first, technical detail at the bottom.

### [marketing-brief](./skills/marketing-brief)
**A brief that a non-marketer can actually produce.** Resolves any input (PR / ref range / path / freeform) into Executive Summary, Key Messages, Target Audience, Positioning, and Call to Action. It's the canonical source of truth that downstream skills (blog, social, newsletter, video) all key off — write it once, reuse everywhere.

### [changelog](./skills/changelog)
**Release notes that don't sound like commit messages.** Walks `git log` over a ref range (or a single PR), categorizes Added/Fixed/Changed/Removed, and *rewrites* commit subjects into user-facing language. Optional `gh release create`. Smart enough to take a single `#1234` and append it to an existing CHANGELOG.md version.

### [blog-post](./skills/blog-post)
**Tone-matched, SEO-aware long-form.** Will detect the repo's existing blog voice (if there are prior posts), nail the headline, structure for skimming, and propose hero/inline image directions. Accepts a marketing brief as input so you skip the "what's this about" round trip.

### [newsletter](./skills/newsletter)
**Email that respects an inbox.** Subject line + preview text + body, calibrated to user-facing audience (not eng-internal). Chains naturally off a blog post or changelog — it'll lift the hook from one and the bullets from the other.

### [social-copy](./skills/social-copy)
**Platform-native, algorithm-aware.** X gets short hooks + thread structure; LinkedIn gets the long-post format with a proper opening line and line breaks that survive mobile. Each platform has its own ruleset under [`platforms/`](./skills/social-copy/platforms). No "🚀 Excited to announce" energy.

### [video-script](./skills/video-script)
**Scripts with timing and visual directions.** Not a wall of narration — proper two-column-style with on-screen action, B-roll suggestions, pacing per platform (15s reel vs. 90s demo vs. 3min walkthrough), and a hook that earns the next 3 seconds.

### [remotion-video](./skills/remotion-video)
**An actual rendered `mp4`, via [Remotion](https://www.remotion.dev/).** Resolves a PR into a narrative (hook → code moments → CTA), generates a Remotion project, opens preview, iterates with you, then renders `video.mp4` + `poster.jpg` for X/LinkedIn. Brand auto-detection lives in [`brand-detection.md`](./skills/remotion-video/brand-detection.md); reusable scene patterns under [`patterns/`](./skills/remotion-video/patterns) and [`templates/`](./skills/remotion-video/templates).

### [hyperframes-video](./skills/hyperframes-video)
**Same shape as `remotion-video`, but on the HTML/GSAP stack.** Uses [HyperFrames](https://hyperframes.dev) for people who'd rather author in HTML/CSS than React. Enforces the canvas-fill rule (no letterboxing across formats), synchronized chapter narration, layout-before-animation discipline, and a brand scan + preview gate before render. Pairs with the `hyperframes` and `hyperframes-cli` skills if you have those installed.

### [marketing-pipeline](./skills/marketing-pipeline)
**One command, full launch kit.** Pick which skills to run (`brief, blog, social, newsletter, video`) and the order. Each step's output feeds the next — so the brief informs the blog, the blog informs the social posts, the changelog feeds the newsletter, and so on. No re-feeding context yourself.

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

Skills with extra structure (`hyperframes-video`, `remotion-video`, `social-copy`) ship supporting files alongside `SKILL.md` — patterns, templates, references, hooks — that the skill's body links to.

---

## Install

The repo's canonical layout is `skills/<skill-name>/SKILL.md`. Every supported CLI just needs that folder copied or symlinked into one of its discovery paths — no extra manifest beyond the `SKILL.md` files themselves (Claude Code's plugin manifests live in `.claude-plugin/` and are bundled with the repo).

### Claude Code — plugin marketplace (recommended)

```text
/plugin marketplace add alemtuzlak/skills
/plugin install alemtuzlak-skills@alemtuzlak
```

The repo ships both `.claude-plugin/plugin.json` and `.claude-plugin/marketplace.json`. `alemtuzlak` is the marketplace name, `alemtuzlak-skills` is the plugin name. Restart Claude Code (or run `/reload-plugins`) after installing.

Plugin-installed skills are invoked as `/alemtuzlak-skills:blog-post`, etc.

Docs: [Discover and install plugins](https://code.claude.com/docs/en/discover-plugins.md), [Create a plugin marketplace](https://code.claude.com/docs/en/plugin-marketplaces.md).

### Claude Code — drop-in skills (no plugin)

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

Optional per-skill `agents/openai.yaml` files can add Codex-specific UI metadata, invocation policy, and tool dependencies — none are required for the skills to work.

Docs: [Agent Skills — OpenAI Codex](https://developers.openai.com/codex/skills).

### Google Gemini CLI

Easiest — Gemini has a native install command for git repos:

```bash
gemini skills install https://github.com/alemtuzlak/skills.git --path skills
```

Or drop-in (paths: `.gemini/skills/` or `.agents/skills/` for project, `~/.gemini/skills/` or `~/.agents/skills/` for user — the `.agents/` alias takes precedence within each tier).

Docs: [Skills — Gemini CLI](https://geminicli.com/docs/cli/skills/).

### Cursor

Discovery paths: `.agents/skills/`, `.cursor/skills/` (project) and `~/.agents/skills/`, `~/.cursor/skills/` (user). Cursor also reads `.claude/skills/` and `.codex/skills/` for compatibility.

```bash
git clone git@github.com:alemtuzlak/skills.git /tmp/alem-skills
mkdir -p ~/.agents/skills
cp -r /tmp/alem-skills/skills/* ~/.agents/skills/
```

Docs: [Skills — Cursor](https://cursor.com/docs/skills).

### Once-and-done install for all `.agents/skills/` agents

Codex, Gemini, Copilot CLI, and Cursor all honor `~/.agents/skills/` — so a single copy makes the skills available in **all four**:

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

> Full launch content for #1234 — brief, blog, tweet, newsletter
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
├── skills/
│   ├── architecture-impact/SKILL.md
│   ├── blog-post/SKILL.md
│   ├── changelog/SKILL.md
│   ├── hyperframes-video/    # multi-file: patterns/, templates/, hooks/, references/
│   ├── marketing-brief/SKILL.md
│   ├── marketing-pipeline/SKILL.md
│   ├── newsletter/SKILL.md
│   ├── remotion-video/       # multi-file: patterns/, templates/, hooks/, references/
│   ├── social-copy/          # multi-file: platforms/
│   └── video-script/SKILL.md
└── README.md
```

---

## License

MIT. Fork them, edit them, make them yours. If you improve one, PRs welcome.
