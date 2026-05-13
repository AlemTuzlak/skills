# Self-Improve Plugin — Final Verification

This file maps each locked decision in `F:/projects/tanstack/ai/.claude/specs/2026-05-13-self-improving-agent-plugin-design.md` §10 to the file(s) that implement it.

| # | Decision (spec §10) | Implementation file(s) | Verified |
|---|---|---|---|
| 1 | **Form factor:** Global Claude Code plugin, published to marketplace. | `skills/self-improve/.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json` (paths relative to the skills marketplace repo root) | ✅ |
| 2 | **Packaging:** Plugin source lives in the user's skills marketplace repo at `<skills-repo>/skills/self-improve/`. Plugin installs into `~/.claude/plugins/cache/<marketplace>/<plugin>/<version>/` per Claude Code's plugin loader. Mirror sync scripts are not used; development uses `--plugin-dir`. | Plugin tree under `skills/self-improve/`; `.claude-plugin/plugin.json` declares the plugin manifest; the parent marketplace's `marketplace.json` references it via `source: "./skills/self-improve"`. Cache layout documented in `RESEARCH.md` §6. | ✅ |
| 3 | **Trigger model:** Hybrid — hook-based auto-detection (regex pre-filter) + slash command. | `skills/self-improve/hooks/hooks.json` (UserPromptSubmit registration), `hooks/user-prompt-submit.sh` (regex pre-filter + additionalContext injection), `lib/regex-patterns.json` (correction + coupling patterns), `commands/*.md` (slash commands). | ✅ |
| 4 | **Portability:** CC-only automation, portable `.agent/` data layer namespaced under `.agent/self-learning/`, AGENTS.md + CLAUDE.md both reference it. | `templates/INDEX.md.tmpl`, `templates/coupling.json.tmpl`, `templates/coupling.schema.json`, `templates/config.yml.tmpl`, `templates/curation-state.yml.tmpl` (data layer); `commands/self-improve-init.md` Step 4 inserts the same `<!-- SELF-IMPROVE:START --> ... <!-- SELF-IMPROVE:END -->` reference block into both `CLAUDE.md` and `AGENTS.md`. | ✅ |
| 5 | **Scope of plugin:** Global install, repo opts in by `/self-improve init` creating `.agent/self-learning/`. | `commands/self-improve-init.md` (bootstrap procedure); `hooks/user-prompt-submit.sh` activation gate (no-op unless `<cwd>/.agent/self-learning/` or `$HOME/.agent/self-learning/` exists, lines 41–50). | ✅ |
| 6 | **Model invocation:** No direct LLM calls from hooks; `additionalContext` injection delegates classification to main model. | `hooks/user-prompt-submit.sh` (emits JSON with `additionalContext` only, no API calls); `hooks/pre-push.sh` (pure git/jq, no model calls); `commands/*.md` all run inside the main model's turn. | ✅ |
| 7 | **Regex strictness:** Loose (LLM is the real arbiter). | `lib/regex-patterns.json` (loose patterns); `templates/config.yml.tmpl` defaults `correction_detection.regex_strictness: loose` and `coupling_detection.regex_strictness: loose`. | ✅ |
| 8 | **Memory separation:** Hard split — `CLAUDE.md` (curated instruction memory) vs `.agent/self-learning/lessons/` (accumulated learning memory). | `templates/INDEX.md.tmpl` (managed `<!-- LESSONS:START -->` region — routing-only, not lesson bodies); `templates/lesson.md.tmpl` (lesson bodies live in separate files); `commands/promote.md` defines the `--to claude-md` vector for explicit promotion across the split. | ✅ |
| 9 | **Index style:** INDEX.md as routing conditions, not topic summaries. | `templates/INDEX.md.tmpl` (each entry is a `Use when ...` routing description); `commands/learn.md` writes routing descriptions, not summaries; `skills/self-improve/SKILL.md` Consult-lesson section confirms "routing descriptions" terminology. | ✅ |
| 10 | **Coupling model:** Impact-surface — `change-required` vs `new-code-required`. | `templates/coupling.schema.json` (`kind` enum: `change-required` \| `new-code-required`); `templates/coupling.json.tmpl` (empty array with schema reference); `commands/couple.md` and `commands/check-couplings.md` operate on both kinds. | ✅ |
| 11 | **Coupling population:** Bootstrap scan + manual + auto-sibling-fallback + pattern-promotion. | `commands/self-improve-init.md` Step 3 (bootstrap scan via `references/bootstrap-scan-prompt.md`); `commands/couple.md` (manual `add` + auto-detect `yes` paths); `commands/check-couplings.md` (auto-sibling-fallback when no explicit coupling matches). | ✅ |
| 12 | **Coupling enforcement:** Plan-time + pre-push + manual `/check-couplings`. | `hooks/user-prompt-submit.sh` (plan-time injection when prompt looks like a feature plan); `hooks/pre-push.sh` (git hook gate); `commands/check-couplings.md` (manual invocation). | ✅ |
| 13 | **Capture flow:** Write-immediately with contradiction check; scope decided at capture (model-suggested). | `commands/learn.md` (write-immediately flow); `skills/self-improve/references/contradiction-check.md` (contradiction sub-prompt invoked on each capture); `skills/self-improve/references/scope-judge-prompt.md` (model-suggested scope); `templates/config.yml.tmpl` `promotion.auto_suggest_global: true`. | ✅ |
| 14 | **Curation:** Manual `/curate-lessons` + passive nag (next-nag date in `curation-state.yml`) + missing-ref nudge. | `commands/curate-lessons.md` (manual full-pass); `commands/curate.md` (per-slug + `snooze`); `templates/curation-state.yml.tmpl` (next-nag date); `hooks/user-prompt-submit.sh` nag injection; `skills/self-improve/SKILL.md` Consult-lesson section (missing-reference passive nudge). | ✅ |
| 15 | **Cross-repo learning:** Two-layer (global + repo) for lessons, INDEX, curation state. Model judges scope and suggests global when universal. | `commands/self-improve-init.md` Step 6 (global pile scaffolding); `hooks/user-prompt-submit.sh` reads both `REPO_PILE` and `GLOBAL_PILE`; `commands/learn.md` `--global` / `--repo` flags; `commands/promote.md` `--global` vector; `references/scope-judge-prompt.md`. | ✅ |
| 16 | **Promotion:** Five vectors — lesson→CLAUDE.md, lesson→global, cluster→new skill, lessons→existing skill (§5.7), skill→global. | `commands/promote.md` (lesson→CLAUDE.md, lesson→global); `commands/promote-cluster.md` (cluster→new skill); `commands/improve-skill.md` (lessons→existing skill); `commands/promote-skill.md` (skill→global). | ✅ |
| 17 | **Skill self-improvement:** `related_skill` lesson frontmatter populated by model from tool-use trace; threshold nag at 3 lessons; `/improve-skill <name>` writes SKILL.md update + syncs to `~/.claude/skills/` + commits & pushes skills repo. | `templates/lesson.md.tmpl` (`related_skill` frontmatter field); `commands/learn.md` (model populates from tool-use trace); `templates/config.yml.tmpl` `promotion.skill_improve_threshold: 3`; `hooks/user-prompt-submit.sh` threshold nudge; `commands/improve-skill.md` (diff preview, mirror sync, push gated on user confirm); `skills/self-improve/references/improve-skill-prompt.md`. | ✅ |

## Sanity-check results

- All JSON files under the plugin tree parse (`plugin.json`, `hooks/hooks.json`, `lib/regex-patterns.json`, `templates/coupling.schema.json`).
- `marketplace.json` at the skills repo root parses and contains the `self-improve` entry with `source: "./skills/self-improve"`.
- No occurrences of the legacy `${pluginDir}` variable outside `RESEARCH.md` (where the bug fix is documented).
- Both hook scripts (`hooks/pre-push.sh`, `hooks/user-prompt-submit.sh`) have the executable bit set.
- 26 phase commits on `feature/self-improve-plugin` ahead of `main`.

## CR Round 1 fixes (branch `cr-fix-r1`)

Sixteen follow-up commits applied on top of the original phase commits to address findings from a 7-agent code review. Each line is one commit:

1. `feat(self-improve): config-driven skills_repo path` — replace hardcoded `F:/projects/skills` with a configurable `skills_repo` field (default `~/.claude/skills`). Threaded through `/improve-skill`, `/promote-cluster`, `/promote-skill`, `/learn` Step 9.
2. `fix(self-improve): rename /self-improve-init -> /self-improve with init subcommand` — slash-command name now matches the documented `/self-improve init` form.
3. `fix(self-improve): wrap hook command with bash for Windows compatibility` — `hooks.json` now invokes the script via `bash` so Windows runs it.
4. `fix(self-improve): stop polluting context on neutral prompts` — `UserPromptSubmit` hook gates INDEX injection on at least one signal firing.
5. `fix(self-improve): prefix /learn lesson filename with YYYY-MM-DD date` — matches README + integration-test expectations.
6. *(Bundled into #1)* `/improve-skill` step ordering + dynamic default-branch detection.
7. `fix(self-improve): pre-push hook - drop substring fallback, fix YAML scoping` — `pre-push.sh` cleanup.
8. `fix(self-improve): UserPromptSubmit hook YAML parsing + set -u defense` — independent strictness per detection type; date comparison rewritten without `-o`; stanza variables initialised.
9. `fix(self-improve): tighten regex pre-filter patterns` — drop overly broad patterns (`instead of`, `impacts?`, `needs ... when`), tighten `if X changes` to require an identifier-like subject. Test cases updated.
10. `fix(self-improve): /learn skill-threshold count skips lessons/promoted/` — already-absorbed lessons no longer re-trigger the nag.
11. *(Bundled into #1)* `[skill-name]` square-bracket placeholders in bash commands.
12. `fix(self-improve): /promote --to claude-md preserves lesson frontmatter` — promoted lessons still readable by contradiction-check.
13. `fix(self-improve): /self-improve init scaffolds .gitignore for agent-private state` — `fallback-counts.json`, `*.bak`, `.DS_Store`.
14. `fix(marketplace): drop alemtuzlak-skills entry; fill self-improve fields` — entry referenced a non-existent plugin manifest at repo root.
15. `docs(self-improve): clean up stale notes and fix plugin cache path` — SKILL.md, VERIFICATION.md, README troubleshooting glob.
16. `fix(self-improve): integration test plan portability fixes` — git identity, bare-repo for Test 5, portable yesterday-date, explicit `git add` paths, GNU-grep note.
