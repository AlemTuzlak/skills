---
name: self-improve
description: Use when the user asks to capture a lesson or correction, remember what went wrong, add or check architectural couplings, curate accumulated lessons, promote lessons into AGENTS.md or skills, improve an existing skill from lessons, or run self-improvement after a mistake. Also use for requests equivalent to /learn, /couple, /check-couplings, /curate-lessons, /promote, /promote-cluster, /improve-skill, /promote-skill, or /self-improve.
---

# Self-Improve Skill

This skill is the workflow backbone for self-improvement tasks. In Claude it may be invoked indirectly via slash commands; in Codex it should trigger directly from the user's request text.

## Operations

- **capture-lesson** — write a new lesson file from drafted content. Includes contradiction check against INDEX.md.
- **capture-coupling** — append a coupling entry. Contradiction check against existing rules.
- **check-couplings** — diff repo vs `coupling.json`, report missing impacted artifacts.
- **curate** — review lessons for staleness, duplicates, drift. One-by-one user confirmation.
- **promote** — execute one of five promotion vectors.
- **improve-skill** — absorb skill-related lessons into an existing skill's SKILL.md.
- **bootstrap** — scan repo for structural patterns, propose coupling rules.

## Sub-prompts

See the following files in `references/`:
- `lesson-template.md`
- `coupling-template.md`
- `contradiction-check.md`
- `curation-prompt.md`
- `scope-judge-prompt.md`
- `bootstrap-scan-prompt.md`
- `improve-skill-prompt.md`

## Consult-lesson behavior (passive missing-reference nudge)

When you load a lesson file (because its `Use when ...` description matched the current task), inspect the body for inline file/symbol references. Heuristic: backtick-quoted strings matching:
- File extensions: `\.(ts|tsx|js|jsx|md|json|yml|yaml|py|sh|sql)$`
- Path-like: starting with `/`, `./`, `~/`, or containing `/`
- Function/method calls: identifiers immediately followed by `(`

For each detected reference:
1. Verify the file/symbol exists in the current project (or in `$HOME` for path-like `~/...`).
2. If missing, append a single line to your response: `📌 Lesson \`<slug>\` references missing \`<symbol-or-path>\` — \`/curate <slug>\` to fix.`

Do not surface this for every lesson — only when a missing reference is detected. Skip the check on lessons that don't have inline file/symbol references.
