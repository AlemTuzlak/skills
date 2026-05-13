---
description: Promote a skill from the user's skills repo to the user-global skills dir (~/.claude/skills/). Use when a repo-local skill proves universally useful.
disable-model-invocation: true
---

# /promote-skill

Vector 5 of the promotion hierarchy: copy a skill from the user's skills repo (`${SKILLS_REPO}/<name>/`) into the user-global skills directory (`$HOME/.claude/skills/<name>/`) so it is available across every Claude Code session.

This is effectively the same sync-mirror behavior the user already does manually after editing a skill — `/promote-skill` just formalizes the first-time copy.

Follow every step in order.

---

## Step 0: Resolve the skills repo path

Read `skills_repo` from `.agent/self-learning/config.yml` (repo first, global fallback, default `~/.claude/skills`). Expand `~` to `$HOME`. Record as `SKILLS_REPO`.

If `SKILLS_REPO == $HOME/.claude/skills`, refuse:

```
`/promote-skill` copies from your skills repo to $HOME/.claude/skills/ — but `skills_repo` is configured as $HOME/.claude/skills itself, so there's nothing to copy. Configure a separate `skills_repo` in .agent/self-learning/config.yml first.
```

---

## Step 1: Parse arguments

Read `$ARGUMENTS`. Expected:

- `/promote-skill <skill-name> --global`

Requirements:

- Positional `<skill-name>` is required.
- `--global` is **required**. (It is the only supported direction in v1 — the flag is mandatory so the workflow remains explicit and future-proof for additional targets.)

Refuse with usage on any other shape:

```
Usage: /promote-skill <skill-name> --global

  Copy ${SKILLS_REPO}/<name>/ → $HOME/.claude/skills/<name>/.
```

---

## Step 2: Locate the source

Source path: `${SKILLS_REPO}/<skill-name>/`.

Verify the directory exists and contains a `SKILL.md`. If not, refuse:

```
Skill `<skill-name>` not found at ${SKILLS_REPO}/<skill-name>/. Make sure the skill lives in your skills repo before promoting.
```

---

## Step 3: Check the destination

Destination path: `$HOME/.claude/skills/<skill-name>/`.

If the destination **does not** exist, proceed to Step 4.

If the destination **does** exist, ask the user verbatim:

> `$HOME/.claude/skills/<skill-name>/` already exists. Choose:
> 1. **Overwrite** — replace the global copy with the current repo version.
> 2. **Abort** — make no changes.
> 3. **Rename** — copy the source under a different name (you'll be asked for the new name).
>
> (1 / 2 / 3)

Wait for an explicit choice:

- **Overwrite** → delete the existing destination (`rm -rf "$HOME/.claude/skills/<skill-name>"`), then proceed to Step 4.
- **Abort** → stop and report `Aborted — global copy left untouched.`
- **Rename** → ask for a new `<new-name>`. Validate it as kebab-case. Use `$HOME/.claude/skills/<new-name>/` as the destination for Step 4.

---

## Step 4: Copy source → destination

Substitute `[skill-name]`, `[destination-name]`, and `${SKILLS_REPO}` as literal values before executing:

```bash
mkdir -p "$HOME/.claude/skills"
cp -r "${SKILLS_REPO}/[skill-name]" "$HOME/.claude/skills/[destination-name]"
```

(`[destination-name]` is `[skill-name]` unless the user chose Rename.)

---

## Step 5: Report

Print:

```
Skill `<skill-name>` available globally at $HOME/.claude/skills/<destination-name>/.
```

Append a reminder about the standing mirror rule:

```
Source of truth remains ${SKILLS_REPO}/<skill-name>/. Subsequent edits should happen there, then re-mirror per your standing skill-mirror rule (or re-run `/promote-skill <skill-name> --global` to re-sync).
```
