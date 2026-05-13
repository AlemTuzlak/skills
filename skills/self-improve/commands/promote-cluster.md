---
description: Promote a tag cluster of lessons into a new Claude Code skill (only when no existing skill matches the tag). Use when ≥3 lessons share a tag/related_skill and represent a coherent invokable workflow.
disable-model-invocation: true
---

# /promote-cluster

Vector 3 of the promotion hierarchy: take a coherent **cluster** of lessons (≥3 lessons that share a `related_skill` or `tag`) and synthesize them into a new Claude Code skill.

**Only use this when no skill with the target name exists.** If a skill already exists, use `/improve-skill <name>` instead — that's the correct vector for absorbing new lessons into an existing skill.

The plugin's own files live under `${CLAUDE_PLUGIN_ROOT}`. The target repo is `${CLAUDE_PROJECT_DIR}`. The user's skills repo lives at `F:/projects/skills/`.

Follow every step in order.

---

## Step 1: Parse arguments

Read `$ARGUMENTS`. Expected:

- `/promote-cluster <tag> --name <skill-name>`
- `/promote-cluster <tag> --name <skill-name> --target repo-skills`
- `/promote-cluster <tag> --name <skill-name> --target global-skills`

Requirements:

- Positional `<tag>` is required.
- `--name <skill-name>` is required — this is the new skill's directory name (kebab-case).
- `--target <repo-skills|global-skills>` is optional. Default: `repo-skills`.

Refuse with usage on any other shape:

```
Usage: /promote-cluster <tag> --name <skill-name> [--target repo-skills|global-skills]

  <tag>             Cluster identifier — matches `related_skill: <tag>` or `<tag>` in `tags[]`.
  --name <name>     The new skill's directory name (kebab-case).
  --target          Where to create the skill. Default `repo-skills` (F:/projects/skills/skills/<name>/).
```

---

## Step 2: Refuse if the skill already exists

Search in order:

1. `F:/projects/skills/skills/<name>/SKILL.md` (user's skills repo)
2. `$HOME/.claude/skills/<name>/SKILL.md` (user-global)
3. Any installed plugin: `$HOME/.claude/plugins/cache/*/*/*/skills/<name>/SKILL.md`

If **any** match, refuse:

```
Skill `<name>` already exists at <found-path>. Use `/improve-skill <name>` to absorb new lessons into it instead.
```

---

## Step 3: Collect the cluster

Scan both lesson piles:

- `${CLAUDE_PROJECT_DIR}/.agent/self-learning/lessons/*.md` (skip `lessons/promoted/`)
- `$HOME/.agent/self-learning/lessons/*.md` (skip `lessons/promoted/`)

For each lesson, parse the frontmatter. Include in the cluster if **either**:

- `related_skill == <tag>`, OR
- `<tag>` is in the `tags` list

Record for each match: absolute path, slug, scope (repo|global), full file content.

- If the count is `0` or `1`, refuse:

  ```
  Only N lesson(s) matched cluster `<tag>` — need at least 2 lessons to form a meaningful cluster. Use `/learn` to capture more, then re-run.
  ```

- If the count is `2`, warn but continue:

  ```
  ⚠ Cluster `<tag>` has only 2 lessons (the soft threshold is 3). Proceeding anyway — a skill can be improved later via `/improve-skill <name>`.
  ```

- If the count is `≥ 3`, proceed silently.

---

## Step 4: Compose the new SKILL.md

Draft the SKILL.md content with the following structure:

### Frontmatter

```yaml
---
name: <name>
description: Use when <synthesized condition from the combined routing descriptions of the cluster's lessons>
disable-model-invocation: true
---
```

Synthesize `description` from the union of each lesson's `description` field. Make it a single coherent "Use when …" trigger phrase that an autorouter could match against future prompts. Keep it terse.

Note about `disable-model-invocation: true`: this defaults to user-invoked workflows. Mention to the user in the final report that they can flip it to `false` if they want the autorouter to invoke the skill automatically.

### Body

Build a structured walkthrough that **absorbs every rule** from the cluster:

1. A short opening paragraph naming the workflow and when it applies (1–3 sentences).
2. One section per major rule, headed with `## <Rule title>`. Inside each section:
   - State the rule as a single declarative sentence.
   - Include the rationale (consolidate overlapping rationales — don't repeat the same justification verbatim across sections).
   - Include concrete examples or commands where the lesson provided them.
3. A closing "Related lessons absorbed" section listing the slugs that were merged in (for audit).

**Rules for merging**:

- Do **not** lose any rule. If two lessons disagree, surface the conflict to the user before writing — ask which to keep, or whether to keep both as "see also" notes.
- **Do** dedupe overlapping rationales — pick the clearest phrasing.
- Preserve concrete commands, file paths, and code snippets verbatim from the lessons.

---

## Step 5: Write the skill

Determine the target path:

- `--target repo-skills` (default): `F:/projects/skills/skills/<name>/SKILL.md`
- `--target global-skills`: `$HOME/.claude/skills/<name>/SKILL.md`

Create the directory (`mkdir -p`). Write the composed SKILL.md.

**If `--target repo-skills`**, also mirror to global per the user's standing skill-mirror rule:

```bash
mkdir -p "$HOME/.claude/skills/<name>"
cp -r "F:/projects/skills/skills/<name>/." "$HOME/.claude/skills/<name>/"
```

(For `--target global-skills` there is no mirror flow — the file is already in the global location.)

---

## Step 6: Archive source lessons

For each lesson in the cluster, move it to `lessons/promoted/<name>/` inside its **original** pile (preserving scope):

- Repo-scoped lessons → `${CLAUDE_PROJECT_DIR}/.agent/self-learning/lessons/promoted/<name>/<slug>.md`
- Global-scoped lessons → `$HOME/.agent/self-learning/lessons/promoted/<name>/<slug>.md`

Preserve the full file (frontmatter + body) verbatim for audit.

Use `git mv` for repo-scoped lessons if they're git-tracked; otherwise plain `mv`.

---

## Step 7: Remove cluster entries from INDEX.md(s)

For each pile that contributed to the cluster, edit its `INDEX.md`:

- `${CLAUDE_PROJECT_DIR}/.agent/self-learning/INDEX.md`
- `$HOME/.agent/self-learning/INDEX.md`

Inside the `<!-- LESSONS:START --> ... <!-- LESSONS:END -->` block, remove the line for every slug that was absorbed. Leave the markers and any unrelated lines intact.

---

## Step 8: Commit + push the skills repo (only if `--target repo-skills`)

Skip this step entirely if `--target global-skills`.

### 8a. Stage and show the diff

```bash
git -C F:/projects/skills add skills/<name>/
git -C F:/projects/skills diff --cached
```

Show the diff to the user.

### 8b. Ask for confirmation BEFORE committing or pushing

Ask verbatim:

> About to commit and push the new skill `<name>` to `F:/projects/skills` (origin/main). Proceed? (yes / no)

If the user says **no**, stop here and report what was staged. Leave the staged changes in place so the user can inspect/amend manually.

If the user says **yes**:

```bash
git -C F:/projects/skills commit -m "feat(<name>): new skill from cluster \`<tag>\` (N lessons absorbed)"
git -C F:/projects/skills push origin main
```

Where `N` is the number of lessons absorbed.

---

## Step 9: Report

Print:

```
Created skill `<name>` from cluster `<tag>` (N lessons absorbed). Skill registered at <absolute-path-to-SKILL.md>.
```

Append a follow-up note:

```
Note: the new skill has `disable-model-invocation: true` (user-invoked only). Flip to `false` if you want the autorouter to suggest it automatically.
```

If `--target repo-skills` and the push happened, also note:

```
Mirror synced to $HOME/.claude/skills/<name>/. Skills repo committed and pushed to origin/main.
```
