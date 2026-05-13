---
description: Absorb captured lessons tagged related_skill=<name> into the existing skill's SKILL.md. Two-step confirmation - show diff first, apply on `apply` subcommand. Syncs to ~/.claude/skills/ mirror and commits+pushes the skills repo when the skill lives there.
disable-model-invocation: true
---

# /improve-skill

Vector 4 of the promotion hierarchy: absorb `related_skill: <name>`-tagged lessons into an **existing** skill's `SKILL.md`. This is the "the same bug keeps showing up in `hyperframes-video`" case — the user keeps correcting Claude on the same skill, so the corrections need to live inside the skill itself.

**Two-step confirmation.** The first invocation shows a diff preview. The second invocation (with the `apply` subcommand) writes the changes, syncs the mirror, and commits+pushes the skills repo.

The plugin's own files live under `${CLAUDE_PLUGIN_ROOT}`. The user's skills repo lives at `F:/projects/skills/`.

Follow every step in order.

---

## Step 1: Parse arguments

Read `$ARGUMENTS`. Expected:

- `/improve-skill <skill-name>` — diff preview only.
- `/improve-skill <skill-name> apply` — apply the changes.
- `/improve-skill <skill-name> [apply] --scope <all|repo|global>` — scope the lesson search. Default: `all`.

Requirements:

- Positional `<skill-name>` is required.
- Second positional token, if present, must be `apply` (any other value → reject with usage).
- `--scope` must be one of `all`, `repo`, `global`. Default: `all`.

Refuse with usage on any other shape:

```
Usage: /improve-skill <skill-name> [apply] [--scope all|repo|global]

  Step 1: /improve-skill <name>          Show proposed diff.
  Step 2: /improve-skill <name> apply    Apply, sync mirror, commit + push (with confirmation).
```

Record `apply_mode = (second token == "apply")`.

---

## Step 2: Locate the skill

Search in this order, stopping at the first match. The first match is the **edit target**.

1. `F:/projects/skills/skills/<skill-name>/SKILL.md` — user's skills repo. **Mirror flow applies.**
2. `$HOME/.claude/skills/<skill-name>/SKILL.md` — user-global. No mirror flow; edit in place.
3. `$HOME/.claude/plugins/cache/*/*/*/skills/<skill-name>/SKILL.md` — installed plugin. **Refuse**:

   ```
   Skill `<skill-name>` lives in plugin at <found-path>. Edit upstream in the plugin's repo, then re-install.
   ```

If no match anywhere, refuse:

```
Skill `<skill-name>` not found in F:/projects/skills/skills/, $HOME/.claude/skills/, or installed plugins. Did you mean `/promote-cluster <tag> --name <skill-name>` to create it?
```

Record `skill_location` ∈ {`repo`, `global`} (matching cases 1 or 2 respectively).

Read the current `SKILL.md` content (frontmatter + body) into `current_skill_md`.

---

## Step 3: Collect related lessons

Determine search piles per `--scope`:

- `all` → both repo and global piles.
- `repo` → `${CLAUDE_PROJECT_DIR}/.agent/self-learning/lessons/` only.
- `global` → `$HOME/.agent/self-learning/lessons/` only.

Within each pile, find all `*.md` files (skipping `lessons/promoted/`) whose frontmatter contains `related_skill: <skill-name>`.

Record for each match: absolute path, slug, scope, full file content.

### Threshold check

Read `skill_improve_threshold` from `.agent/self-learning/config.yml`:

- Prefer the repo config (`${CLAUDE_PROJECT_DIR}/.agent/self-learning/config.yml`).
- Fall back to the global config (`$HOME/.agent/self-learning/config.yml`).
- Default if neither defines it: `3`.

If `count == 0`, refuse:

```
No lessons with `related_skill: <skill-name>` found in the selected scope. Use `/learn` to capture lessons first.
```

If `count < threshold`, ask verbatim:

> Only `<count>` lesson(s) tagged `related_skill: <skill-name>` — below the configured threshold of `<threshold>`. Proceed anyway? (yes / no)

Stop on `no`. Continue on `yes`.

If `count >= threshold`, proceed silently.

---

## Step 4: Draft the SKILL.md update

Invoke the sub-prompt at `${CLAUDE_PLUGIN_ROOT}/skills/self-improve/references/improve-skill-prompt.md`.

Provide it with:

1. `current_skill_md` — the full current SKILL.md content.
2. The collected lessons — each one's full frontmatter and body, prefixed with its absolute path.

Receive its output:

- `proposed_skill_md` — the proposed new SKILL.md content (full file, frontmatter + body).
- `unified_diff` — a unified diff between current and proposed.
- `conflicts[]` — list of conflicts the sub-prompt flagged (e.g. two lessons that contradict, a rule that conflicts with the existing skill body).

---

## Step 5: Show the diff (preview phase)

Print to the user:

```
Proposed changes to <absolute-path-to-SKILL.md>:

<unified_diff>
```

If `conflicts` is non-empty, also print:

```
Conflicts detected:
- <conflict 1 description>
- <conflict 2 description>
```

If `apply_mode == false`, stop here and append:

```
Re-run with `/improve-skill <skill-name> apply` to apply.
```

Do **not** write any files, sync the mirror, or commit. End of run.

If `apply_mode == true`, continue to Step 6.

---

## Step 6: Apply the changes

### 6a. Write the SKILL.md update

Write `proposed_skill_md` to the resolved skill path (Step 2's edit target).

### 6b. Sync the mirror (only if `skill_location == "repo"`)

If the skill lives in `F:/projects/skills/skills/<skill-name>/`:

```bash
rm -rf "$HOME/.claude/skills/<skill-name>"
cp -r "F:/projects/skills/skills/<skill-name>" "$HOME/.claude/skills/<skill-name>"
```

This mirrors the user's standing skill-mirror rule.

If `skill_location == "global"`, **skip** the mirror step and the commit-push step. Continue to 6d. After 6d, print a warning in Step 7:

```
Skill not in your skills repo (F:/projects/skills/skills/); edit applied to $HOME/.claude/skills/ only — no commit/push.
```

### 6c. Commit + push the skills repo (only if `skill_location == "repo"`)

#### 6c-i. Stage and show the diff

```bash
git -C F:/projects/skills add skills/<skill-name>
git -C F:/projects/skills diff --cached
```

Show the diff to the user.

#### 6c-ii. Ask for confirmation BEFORE pushing

Ask verbatim:

> About to commit and push the updated skill `<skill-name>` to `F:/projects/skills` (origin/main). Proceed? (yes / no)

If the user says **no**, stop here. Leave the SKILL.md edit and the staged git changes in place. Skip 6d and the report's commit-related lines.

If the user says **yes**:

```bash
git -C F:/projects/skills commit -m "feat(<skill-name>): incorporate captured learnings (N lessons)"
git -C F:/projects/skills push origin main
```

Where `N` is the lesson count from Step 3.

### 6d. Archive absorbed lessons

Compute today's date as `YYYY-MM-DD` (UTC).

For each lesson absorbed, move it to `lessons/promoted/<skill-name>-<YYYY-MM-DD>/` inside its **original** pile:

- Repo-scoped → `${CLAUDE_PROJECT_DIR}/.agent/self-learning/lessons/promoted/<skill-name>-<YYYY-MM-DD>/<slug>.md`
- Global-scoped → `$HOME/.agent/self-learning/lessons/promoted/<skill-name>-<YYYY-MM-DD>/<slug>.md`

Use `git mv` for repo-scoped lessons if git-tracked; otherwise `mv`.

### 6e. Remove entries from INDEX.md(s)

For each pile that contributed an absorbed lesson, edit its `INDEX.md`. Inside `<!-- LESSONS:START --> ... <!-- LESSONS:END -->`, remove the line for every slug that was absorbed.

---

## Step 7: Report

Print:

```
Updated `<skill-name>` SKILL.md. Absorbed N lessons.
```

If `skill_location == "repo"` and the push happened:

```
Mirror synced to $HOME/.claude/skills/<skill-name>/. Skills repo committed and pushed to origin/main.
```

If `skill_location == "repo"` and the user declined the push:

```
Edits applied locally. Staged for commit in F:/projects/skills — not yet pushed (declined).
```

If `skill_location == "global"`:

```
Skill not in your skills repo (F:/projects/skills/skills/); edit applied to $HOME/.claude/skills/ only — no commit/push.
```
