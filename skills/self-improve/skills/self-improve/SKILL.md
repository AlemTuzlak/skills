---
name: self-improve
description: Use when curating lessons, capturing corrections, capturing couplings, promoting clusters to skills, or improving an existing skill from accumulated lessons. Invoked indirectly via /learn, /couple, /check-couplings, /curate-lessons, /promote, /promote-cluster, /improve-skill, /promote-skill commands.
disable-model-invocation: true
---

# Self-Improve Skill

This skill is the workflow backbone for the self-improve plugin. It is invoked indirectly via slash commands. Each command in `commands/*.md` calls into this skill with a specific sub-task.

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

(These are written in Task 1.9 — they may not exist yet at the time you read this.)
