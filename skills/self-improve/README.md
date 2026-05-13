# self-improve

A Claude Code plugin that captures lessons from corrections, enforces architectural couplings, and absorbs learnings back into your skills — three arms of self-improvement that run on mechanical hooks, with no extra API calls and no provider lock-in. Claude Code's built-in auto-memory has a documented bug where saved feedback is not reliably re-applied (lessons get buried in a bloating `CLAUDE.md`, the model glosses them, and there is no mechanism to enforce architectural side-effects when a feature is added). `self-improve` closes those gaps by keeping `CLAUDE.md` small and loading lessons on-demand via a routing `INDEX.md`, by detecting corrections with deterministic hooks instead of model willpower, and by gating pushes on architectural impact rules.

---

## How it works (three arms)

### (a) Lesson capture

A `UserPromptSubmit` hook (`hooks/user-prompt-submit.sh`) regex-filters every user message against `lib/regex-patterns.json` for correction language ("you forgot...", "stop doing...", "next time...", etc.). On a hit, the hook injects a system note via `additionalContext` instructing the main model to judge the correction's durability and, if durable, append an inline `📌 Saw you corrected me about <X>. /learn yes to capture.` line at the end of its next response. Confirming with `/learn yes` writes a structured lesson file under `.agent/self-learning/lessons/` and updates `INDEX.md`.

> User: "you keep forgetting to run typecheck after touching the types"
> Claude: …response… `📌 Saw you corrected me about skipping typecheck after type-surface changes. /learn yes to capture.`
> User: `/learn yes`
> → writes `.agent/self-learning/lessons/2026-05-13-run-typecheck-after-type-surface-changes.md` + INDEX entry.

### (b) Coupling enforcement

`.agent/self-learning/coupling.json` describes architectural impact-surface rules in two flavors: `change-required` (when X changes, Y must change too) and `new-code-required` (when a new X is added, a new Y must also be added). Rules are checked twice — at **plan time** via hook context injection when a user prompt looks like a feature plan, and at **git pre-push** via an installed `.git/hooks/pre-push` that runs `hooks/pre-push.sh`. Missing impacted artifacts block the push unless `enforcement.pre_push_block: false` in `config.yml`.

> Rule: when `packages/typescript/ai/src/types.ts` changes, an entry must be added to `docs/changelog/*.md`.
> User stages a change to `types.ts` with no changelog edit and runs `git push`.
> → pre-push hook reports the violation and exits non-zero. Use `--no-verify` to bypass.

### (c) Skill self-improvement

Lessons captured against an existing skill (via `related_skill` frontmatter that `/learn` populates automatically from the recent tool-use trace) accumulate over time. Once N≥3 lessons share a `related_skill`, the plugin nudges the user. `/improve-skill <name>` reads every lesson tagged for that skill, drafts a unified diff for the skill's `SKILL.md`, presents it for review, and on `apply` writes the change, mirrors it to `~/.claude/skills/<name>/`, and commits + pushes the user's configured skills repo (`skills_repo` in `config.yml`; defaults to `~/.claude/skills`). User confirmation is required before the push.

> Three captured lessons all tag `related_skill: hyperframes-video`.
> Claude nudges: "3 lessons share `related_skill: hyperframes-video`. `/improve-skill hyperframes-video` to absorb."
> User: `/improve-skill hyperframes-video` → diff preview → `/improve-skill hyperframes-video apply` → SKILL.md updated, mirror synced, commit pushed.

---

## Installation

### Dev / direct edit (recommended for early iteration)

```bash
claude --plugin-dir <path-to-skills-repo>/skills/self-improve
```

This loads the plugin directly from source. Edits to hook scripts, sub-prompts, and command files take effect on Claude Code restart.

### Marketplace install

```bash
/plugin marketplace add <path-to-skills-repo>
/plugin install self-improve@alemtuzlak
```

(The marketplace is the skills repo root via its `.claude-plugin/marketplace.json`.)

### Prerequisite: `jq`

The `UserPromptSubmit` hook parses `lib/regex-patterns.json` with `jq`. `jq` must be on `PATH`.

- **macOS:** `brew install jq`
- **Linux:** `apt install jq` / `dnf install jq` / etc.
- **Windows:** `winget install jqlang.jq` or download from <https://stedolan.github.io/jq/>. The hook scripts target bash and git-bash, so the standard Windows `jq.exe` on `PATH` works.

If `jq` is missing the hook exits silently — the plugin becomes a no-op rather than breaking your turn. Install `jq` to enable capture.

---

## Quick start

After installation, inside any repo where you want lessons + couplings to apply:

1. **`/self-improve init`** — scaffolds `.agent/self-learning/` (INDEX.md, coupling.json, curation-state.yml, config.yml, lessons/), runs a bootstrap coupling scan that proposes structural rules derived from sibling-directory patterns in the repo, inserts a reference block into `CLAUDE.md` and `AGENTS.md`, and offers to install the pre-push hook. Repeat per-repo.
2. **Work normally.** When you correct Claude ("you forgot X" / "stop doing Y" / "next time, do Z"), watch for the inline `📌` confirmation at the end of its next response. Run `/learn yes` to capture. The lesson is judged by the model for durability before being saved.
3. **Describe a coupling.** "Whenever I update Foo.ts, I also need to update Bar.ts" triggers a `📌 ... /couple yes` prompt; confirm to capture into `coupling.json`.
4. **Curate periodically.** `/curate-lessons` (or wait for the 30-day passive nag) walks you through stale / contradicting / drifting lessons one at a time.

---

## Commands reference

| Command | Purpose |
|---|---|
| `/self-improve init` | Bootstrap `.agent/self-learning/` in this repo (scaffold, coupling scan, CLAUDE.md/AGENTS.md wiring, optional pre-push hook). |
| `/learn yes [--global\|--repo] [--skill <name>\|--no-skill] [--edit]` | Capture a lesson from a detected correction. Defaults: scope chosen by model; `related_skill` inferred from tool-use trace. |
| `/couple yes` / `/couple add ...` | Capture a coupling rule. `yes` confirms an auto-detected suggestion; `add` opens a manual rule editor. |
| `/check-couplings [--against <ref>]` | Run coupling enforcement on the current diff (default: `HEAD`). Reports missing impacted artifacts. |
| `/curate-lessons [--repo-only\|--global-only]` | Review captured lessons for staleness, duplicates, and drift. Resets the next-nag date. |
| `/curate snooze <Nd\|Nw\|Nm>` | Defer the next curation nag by N days/weeks/months. |
| `/curate <slug>` | Curate a single lesson by its slug. |
| `/promote <slug> --to claude-md` | Promote a lesson into `CLAUDE.md` prose and delete the lesson file. |
| `/promote <slug> --global` | Move a repo-scoped lesson to the global pile. |
| `/promote-cluster <tag> --name <skill-name>` | Promote a tag-cluster of lessons into a brand new skill at `${skills_repo}/<skill-name>/` (path is configurable, defaults to `~/.claude/skills`). |
| `/improve-skill <name> [apply]` | Absorb related lessons into an existing skill's `SKILL.md`. First call previews the diff; `apply` writes, mirrors, commits, and pushes. |
| `/promote-skill <name> --global` | Mirror a skills-repo skill to `~/.claude/skills/<name>/`. |

---

## Configuration

`.agent/self-learning/config.yml` (created by `/self-improve init` from `templates/config.yml.tmpl`):

```yaml
# Self-improve plugin behavior knobs. Edit and commit per repo.
correction_detection:
  enabled: true
  regex_strictness: loose       # loose | strict
coupling_detection:
  enabled: true
  regex_strictness: loose
enforcement:
  pre_push_block: true          # false = warn only, do not block push
curation:
  default_interval_days: 30
promotion:
  auto_suggest_global: true
  skill_improve_threshold: 3
skills_repo: ~/.claude/skills
```

Knobs:

- **`correction_detection.enabled`** — global kill-switch for the `📌 /learn` capture flow.
- **`correction_detection.regex_strictness`** — `loose` matches broad correction language and trusts the model to filter; `strict` requires more deliberate phrasing. Loose is recommended (the LLM is the real arbiter).
- **`coupling_detection.enabled`** — global kill-switch for the `📌 /couple` capture flow.
- **`coupling_detection.regex_strictness`** — same scale as above for coupling-shaped phrases.
- **`enforcement.pre_push_block`** — when `true`, missing impacted artifacts cause `git push` to exit non-zero. When `false`, the hook still reports violations but exits zero (warn-only).
- **`curation.default_interval_days`** — days between curation nags. Used to compute `next_nag` in `curation-state.yml`.
- **`promotion.auto_suggest_global`** — when capturing a lesson the model judges as universal, suggest the global scope inline.
- **`promotion.skill_improve_threshold`** — N lessons sharing a `related_skill` before `/improve-skill <name>` is nudged.
- **`skills_repo`** — path to the user's skills monorepo (where skills live as `<skills_repo>/<skill-name>/`). Defaults to `~/.claude/skills`. Override if you keep skills in a separate versioned repo (e.g. `~/work/skills`); `/improve-skill`, `/promote-cluster`, `/promote-skill`, and `/learn`'s skill-existence check all resolve `<skill-name>` against this path. When `skills_repo == ~/.claude/skills`, the mirror-copy + commit/push branches in `/improve-skill` and `/promote-cluster` are skipped (the source of truth and the global mirror are the same path).

---

## Data layout

### Repo-local (`<repo>/.agent/self-learning/`)

```
.agent/self-learning/
├── INDEX.md                 # routing descriptions of captured lessons (managed region between <!-- LESSONS:START --> ... <!-- LESSONS:END -->)
├── coupling.json            # architectural impact-surface rules
├── coupling.schema.json     # JSON Schema for coupling.json (copied at init for editor validation)
├── curation-state.yml       # last_curated + next_nag dates
├── config.yml               # behavior knobs (above)
└── lessons/
    ├── <slug>.md            # active lessons, frontmatter + body
    └── promoted/
        └── <slug>.md        # archived lessons promoted into CLAUDE.md or skills
```

### Global (`~/.agent/self-learning/`)

```
~/.agent/self-learning/
├── INDEX.md
├── coupling.json            # always empty {couplings: []} — couplings are repo-scoped
├── coupling.schema.json
├── curation-state.yml
├── config.yml
└── lessons/
    ├── <slug>.md            # cross-repo lessons
    └── promoted/
        └── <slug>.md
```

Same shape, different scope. The hook reads both piles when the user is in a repo whose `.agent/self-learning/` exists. `$HOME` resolves correctly under bash and git-bash (Windows maps it to `%USERPROFILE%`).

---

## Mirror sync flow (for skills the user manages)

When `/improve-skill <name>` or `/promote-cluster <tag> --name <name>` writes or modifies a skill, it follows the user's standing convention. The source of truth path is **configurable** via the `skills_repo` field in `.agent/self-learning/config.yml`:

- **Source of truth for skills:** `${skills_repo}/<name>/` — defaults to `~/.claude/skills` if not configured. Set it to a dedicated skills monorepo path (e.g. `~/work/skills`) if you keep skills separately versioned.
- **Mirror to:** `$HOME/.claude/skills/<name>/` (so the change takes effect immediately in the running Claude Code). Skipped when `skills_repo` already resolves to `$HOME/.claude/skills`.
- **Commit + push** from the skills repo's git working tree to `origin`. The default branch is detected dynamically (works for `main`, `master`, or any configured default). Skipped when `skills_repo == $HOME/.claude/skills` since there's no separate repo to push.

Both `/improve-skill` and `/promote-cluster` gate the push on **explicit user confirmation** — `/improve-skill` asks once up front for all of (write, mirror, push), while `/promote-cluster` asks before commit+push at Step 8b.

---

## Reliability mechanisms

Each design choice maps to a documented failure mode of Claude's built-in auto-memory (see spec §8):

| Failure mode | Mitigation |
|---|---|
| Model forgets to capture lessons. | Mechanical `UserPromptSubmit` hook detects correction language with regex; injected context forces the durability question on every match. Not model willpower. |
| Lessons get buried, model glosses them. | Instruction memory (`CLAUDE.md`) stays small; learning memory (`lessons/`) is loaded on-demand via the routing descriptions in `INDEX.md`. Each rule in `CLAUDE.md` has weight because the pile is curated. |
| Pile bloats with noise / contradictions. | Capture-time contradiction check (see `references/contradiction-check.md`) + scheduled-nag curation in `curation-state.yml`. No autonomous edits. |
| User forgets to enforce coupling on PRs. | Pre-push hook gates the push; plan-time hook injection front-loads the work when the user is still describing the feature. |
| Plugin only works for me; team can't benefit. | Marketplace publishing via the parent marketplace repo's `.claude-plugin/marketplace.json`; portable `.agent/` data layer; `AGENTS.md` cross-pointer for non-CC agents. |
| Different agents (Cursor, Cline, Aider) can't read the lessons. | `.agent/self-learning/` is plain files referenced from `AGENTS.md` — any agent following the standard reads the same pile. Only the automation is CC-specific. |

---

## Troubleshooting

- **`jq` not on PATH** — install per Installation section. Verify with `jq --version` in a fresh shell. The hook will silently no-op without it.
- **Hook not firing** — check the cached plugin path: `ls ~/.claude/plugins/cache/*/self-improve/*/hooks/hooks.json` (or the equivalent under `%USERPROFILE%/.claude/plugins/cache/` on Windows). If missing, the plugin didn't load — re-run `claude --plugin-dir ...` or re-install via `/plugin install`. Restart Claude Code after a fresh install.
- **Pre-push hook missing in a repo** — re-run `/self-improve init` (it offers reinstall), or copy manually: `cp ${CLAUDE_PLUGIN_ROOT}/hooks/pre-push.sh .git/hooks/pre-push && chmod +x .git/hooks/pre-push`.
- **Capture flow not triggering** — verify `.agent/self-learning/config.yml` has `correction_detection.enabled: true`. If `regex_strictness: strict`, try `loose`. Inspect `lib/regex-patterns.json` to see what phrasing the pre-filter looks for.
- **Conflicting lessons** — run `/curate <slug>` on the duplicate, or run a full `/curate-lessons` pass which surfaces contradiction pairs automatically.
- **Activation not happening in this repo** — the plugin no-ops unless `<repo>/.agent/self-learning/` OR `$HOME/.agent/self-learning/` exists. Run `/self-improve init` to opt this repo in.
