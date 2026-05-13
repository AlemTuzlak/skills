---
description: Absorb captured lessons tagged related_skill=<name> into the existing skill's SKILL.md. Two-step confirmation - show diff first, apply on `apply` subcommand. Syncs to ~/.claude/skills/ mirror and commits+pushes the skills repo when the skill lives there.
disable-model-invocation: true
---

# /improve-skill

Vector 4 of the promotion hierarchy: absorb `related_skill: <name>`-tagged lessons into an **existing** skill's `SKILL.md`. This is the "the same bug keeps showing up in `hyperframes-video`" case — the user keeps correcting Claude on the same skill, so the corrections need to live inside the skill itself.

**Two-step confirmation.** The first invocation shows a diff preview. The second invocation (with the `apply` subcommand) writes the changes, syncs the mirror, and commits+pushes the skills repo.

The plugin's own files live under `${CLAUDE_PLUGIN_ROOT}`. The user's skills repo path is configurable — see Step 0.

Follow every step in order.

---

## Step 0: Resolve the skills repo path

Read the `skills_repo` field from `.agent/self-learning/config.yml`. Lookup order:

1. `${CLAUDE_PROJECT_DIR}/.agent/self-learning/config.yml` (repo-local, preferred).
2. `$HOME/.agent/self-learning/config.yml` (global fallback).
3. If neither is set, default to `~/.claude/skills`.

Expand `~` to `$HOME`. Record the resolved absolute path as `SKILLS_REPO`. Subsequent steps that reference the user's skills repo MUST use `${SKILLS_REPO}` (i.e. `${SKILLS_REPO}/<skill-name>/`), not a hard-coded path.

Note: when `SKILLS_REPO` resolves to `$HOME/.claude/skills` (the default), there is no separate "repo" location — the global mirror and the source of truth are the same path, so the mirror-sync + commit+push branch in Step 6 is a no-op. Detect this case via `[ "$SKILLS_REPO" = "$HOME/.claude/skills" ]` and treat `skill_location` accordingly (see Step 2).

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

1. `${SKILLS_REPO}/<skill-name>/SKILL.md` — user's skills repo (from Step 0). **Mirror flow applies** when `SKILLS_REPO` is distinct from `$HOME/.claude/skills`.
2. `$HOME/.claude/skills/<skill-name>/SKILL.md` — user-global. No mirror flow; edit in place.
3. `$HOME/.claude/plugins/cache/*/*/*/skills/<skill-name>/SKILL.md` — installed plugin. **Refuse**:

   ```
   Skill `<skill-name>` lives in plugin at <found-path>. Edit upstream in the plugin's repo, then re-install.
   ```

If no match anywhere, refuse:

```
Skill `<skill-name>` not found in ${SKILLS_REPO}/, $HOME/.claude/skills/, or installed plugins. Did you mean `/promote-cluster <tag> --name <skill-name>` to create it?
```

Record `skill_location`:
- `repo` if the match was case 1 AND `SKILLS_REPO != $HOME/.claude/skills` (mirror + commit+push branch applies).
- `global` if the match was case 2, OR case 1 when `SKILLS_REPO == $HOME/.claude/skills` (edit in place, no mirror/push).

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

### 6.pre Up-front consolidated confirmation

Before writing any file, ask the user verbatim (substitute `[skill-name]`, `<absolute-path>`, and `${SKILLS_REPO}` with literal values; if `skill_location == "global"` omit the mirror + push bullets):

> About to:
>   (a) write `<absolute-path-to-SKILL.md>`,
>   (b) mirror to `$HOME/.claude/skills/[skill-name]/`,
>   (c) commit + push the skills repo (`${SKILLS_REPO}` → origin).
>
> Proceed? (yes / no)

If the user says **no**, do **not** modify any file. Print the proposed unified diff (from Step 4) again as a reference so they can apply it manually if desired, and stop.

If the user says **yes**, proceed through 6a–6e without further prompts.

### 6a. Write the SKILL.md update

Write `proposed_skill_md` to the resolved skill path (Step 2's edit target).

### 6b. Sync the mirror (only if `skill_location == "repo"`)

If the skill lives in `${SKILLS_REPO}/<skill-name>/` and `SKILLS_REPO != $HOME/.claude/skills`:

#### 6b-i. Confirmation already obtained in Step 6 prelude (see below)

Step 6 (the apply phase) is gated by a single up-front confirmation that covers (a) writing the SKILL.md, (b) mirroring to `$HOME/.claude/skills/`, and (c) committing + pushing the skills repo. By the time control reaches 6b the user has already said yes to all three.

#### 6b-ii. Transactional copy

Perform the mirror copy transactionally so a mid-copy failure can't leave a destroyed mirror with no replacement. Copy into a sibling temp directory first; only after the copy succeeds, swap it in. Substitute `${SKILLS_REPO}` and `[skill-name]` as literal values before executing:

```bash
tmp_dir="$HOME/.claude/skills/[skill-name].new-$$"
cp -r "${SKILLS_REPO}/[skill-name]/" "$tmp_dir" || { rm -rf "$tmp_dir"; echo "Mirror copy failed; aborted, no changes made to $HOME/.claude/skills/[skill-name]/" >&2; exit 1; }
rm -rf "$HOME/.claude/skills/[skill-name]"
mv "$tmp_dir" "$HOME/.claude/skills/[skill-name]"
```

This mirrors the user's standing skill-mirror rule without ever leaving the destination in a half-deleted state.

If `skill_location == "global"`, **skip** the mirror step and the commit-push step. Continue to 6d. After 6d, print a warning in Step 7:

```
Skill not in your skills repo (${SKILLS_REPO}/); edit applied to $HOME/.claude/skills/ only — no commit/push.
```

### 6c. Commit + push the skills repo (only if `skill_location == "repo"`)

The single confirmation in 6.pre already covered the commit + push. Stage, commit, and push in one go. Detect the default branch dynamically so this works on `main`, `master`, or any other configured default. Substitute `[skill-name]` and `${SKILLS_REPO}` as literal values before executing:

```bash
git -C "${SKILLS_REPO}/.." add "skills/[skill-name]"   # if ${SKILLS_REPO} is .../<repo>/skills
# (If ${SKILLS_REPO} points at the repo root directly, drop the /.. and use:)
# git -C "${SKILLS_REPO}" add "[skill-name]"
git -C "${SKILLS_REPO}/.." diff --cached
default_branch="$(git -C "${SKILLS_REPO}/.." symbolic-ref refs/remotes/origin/HEAD 2>/dev/null | sed 's|^refs/remotes/origin/||')"
default_branch="${default_branch:-main}"
git -C "${SKILLS_REPO}/.." commit -m "feat([skill-name]): incorporate captured learnings (N lessons)"
git -C "${SKILLS_REPO}/.." push origin "$default_branch"
```

Where `N` is the lesson count from Step 3.

Note: the placeholder `[skill-name]` and the env var `${SKILLS_REPO}` MUST be substituted to literal values before running these commands — bash will parse `<...>` as redirection and fail. Use square brackets in the model's rendered commands as a substitution marker that bash treats as literal text.

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
Mirror synced to $HOME/.claude/skills/<skill-name>/. Skills repo (${SKILLS_REPO}) committed and pushed to origin/<default-branch>.
```

If `skill_location == "repo"` and the user declined the up-front confirmation in 6.pre:

```
No changes made. Proposed diff printed above for reference — apply manually if desired.
```

If `skill_location == "global"`:

```
Skill not in your skills repo (${SKILLS_REPO}/); edit applied to $HOME/.claude/skills/ only — no commit/push.
```
