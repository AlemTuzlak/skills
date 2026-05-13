---
description: Use after a correction to capture the lesson. `/learn yes` confirms with predicted scope. Flags: `--global`/`--repo` (override scope), `--skill <name>`/`--no-skill` (override related_skill), `--edit` (open in editor after writing).
disable-model-invocation: true
---

# /learn

You are capturing a durable lesson from the previous correction. The auto-detection that fired in this conversation already drafted the rule, predicted a scope, and predicted a `related_skill`. Your job here is to confirm (with any flag overrides), check for contradictions against the existing lesson pile, write the file, append it to the INDEX, and surface skill-cluster thresholds.

The plugin's own files live under `${CLAUDE_PLUGIN_ROOT}`. The target repo is `${CLAUDE_PROJECT_DIR}`. The global lesson pile is at `$HOME/.agent/self-learning/`.

Follow every step in order.

---

## Step 1: Parse arguments

Read `$ARGUMENTS`. Expected forms:

- `/learn yes`
- `/learn yes --global`
- `/learn yes --repo`
- `/learn yes --skill <name>`
- `/learn yes --no-skill`
- `/learn yes --edit`
- Any combination of the above flags after `yes`.

If the first positional token is **not** `yes`, print usage and stop:

```
Usage: /learn yes [--global|--repo] [--skill <name>|--no-skill] [--edit]

Run /learn after the plugin detected a correction worth capturing. The previous turn drafted the rule and predicted a scope — `yes` confirms it. Use flags to override.
```

Parse flags:

- `--global` → `override_scope = global`
- `--repo` → `override_scope = repo`
- `--skill <name>` → `override_skill = <name>`
- `--no-skill` → `override_skill = null`
- `--edit` → `open_editor = true`

If both `--global` and `--repo` are passed, refuse and ask the user to choose one.

If both `--skill <name>` and `--no-skill` are passed, refuse and ask the user to choose one.

---

## Step 2: Recover the drafted lesson from conversation context

Look back through this conversation for the most recent injected `## Correction detected` block (from the UserPromptSubmit hook) followed by your model response containing a line of the form:

```
📌 Saw you corrected me about [<rule>]. Capture as [<predicted-scope>] lesson? ...
```

Extract:

- `rule` — the one-line rule text inside the first `[...]`.
- `predicted_scope` — `repo` or `global`, from the second `[...]`.
- `predicted_skill` — if your earlier response also surfaced a `related_skill = <name>` line in the correction-detected analysis, use it. Otherwise `null`.

If you cannot locate a recent drafted correction in the conversation, stop and tell the user:

```
No recent correction draft found in this conversation. /learn is meant to confirm an auto-detected correction. If you want to capture a lesson manually, draft the rule in plain text first and I'll write the file.
```

(In the manual case, ask the user for: rule text, scope, related_skill, then proceed from Step 3.)

---

## Step 3: Apply flag overrides

- Final `scope` = `override_scope` if set, else `predicted_scope`.
- Final `related_skill` = `override_skill` if `--skill` or `--no-skill` was passed (the latter forces `null`), else `predicted_skill`.

---

## Step 4: Determine target paths

- If `scope == "repo"`:
  - `lessons_dir = ${CLAUDE_PROJECT_DIR}/.agent/self-learning/lessons`
  - `index_path = ${CLAUDE_PROJECT_DIR}/.agent/self-learning/INDEX.md`
  - `config_path = ${CLAUDE_PROJECT_DIR}/.agent/self-learning/config.yml`
- If `scope == "global"`:
  - `lessons_dir = $HOME/.agent/self-learning/lessons`
  - `index_path = $HOME/.agent/self-learning/INDEX.md`
  - `config_path = $HOME/.agent/self-learning/config.yml`

Verify the target pile is initialized — i.e. the `lessons` directory's parent (`.agent/self-learning/`) exists. If not, refuse:

```
The <scope> lesson pile is not initialized. Run /self-improve init in <repo|home> first.
```

---

## Step 5: Compute slug and filename

Derive a kebab-case slug from the rule's *intent* (not a verbatim slugify — pick the salient noun-phrase). Cap at 50 chars. Strip trailing hyphens. Lowercase ASCII + digits + hyphens only.

Compute today's UTC date as `YYYY-MM-DD`. The lesson filename is `<YYYY-MM-DD>-<slug>.md` (the date prefix gives chronological sort and disambiguates re-use of the same intent on different dates).

If `${lessons_dir}/<YYYY-MM-DD>-<slug>.md` already exists, append a numeric suffix: `<YYYY-MM-DD>-<slug>-2.md`, `<YYYY-MM-DD>-<slug>-3.md`, etc.

In subsequent steps, references to "`<slug>`" in the lesson filename mean the full `<YYYY-MM-DD>-<slug>` prefix; the bare slug is still used for INDEX entries and for the lesson's frontmatter `slug:` field.

---

## Step 6: Contradiction check

Read the sub-prompt at `${CLAUDE_PLUGIN_ROOT}/skills/self-improve/references/contradiction-check.md` for the full input/output contract.

Provide it with:

1. The newly drafted lesson (a complete draft of the file you're about to write, including frontmatter and body — built from Step 7 substitutions but not yet saved).
2. The current contents of `${index_path}`.

The sub-prompt will return JSON:

```json
{
  "conflict": true|false,
  "conflicting_slugs": [...],
  "category": "direct-contradiction"|"strong-overlap"|"soft-overlap"|null,
  "resolution_options": [...]
}
```

If `conflict == false`, continue to Step 7.

If `conflict == true`, surface the result to the user. Render the option menu **dynamically from the sub-prompt's `resolution_options` array** — present only the options the sub-prompt returned, not a static hardcoded list. For each option in `result.resolution_options`, print its identifier and the matching one-line description from the table below:

| Option id | Description |
|---|---|
| `keep_new` | proceed with the new lesson; old lesson(s) untouched |
| `keep_old` | abort, do not write the new lesson |
| `merge` | open both files and produce a merged single lesson |
| `rename_scope` | narrow the new lesson's `description` (routing condition) so it doesn't overlap |

Format (only including the options that appeared in `resolution_options`):

```
Contradiction check: <category>
Conflicts with: <slug-1>, <slug-2>
Options:
  <option-id-1>  — <description-1>
  <option-id-2>  — <description-2>
  ...

Which option?
```

Wait for an explicit choice and act accordingly:

- `keep_new` → continue to Step 7 as drafted.
- `keep_old` → stop, report `Aborted — kept existing lesson(s).`
- `merge` → read each conflicting lesson, produce a merged draft (the new + old rules consolidated into a single lesson), then continue to Step 7 using the merged content. Delete the superseded files after the new file is written, and remove their INDEX entries.
- `rename_scope` → ask the user for a narrower routing condition, update the draft's `description`, then continue to Step 7.

If the user picks an option that wasn't in `resolution_options`, refuse and re-ask — only the offered options are valid for this conflict.

---

## Step 7: Write the lesson file

Read `${CLAUDE_PLUGIN_ROOT}/templates/lesson.md.tmpl` and substitute placeholders:

| Placeholder | Value |
|---|---|
| `{{slug}}` | the slug from Step 5 |
| `{{routing-condition}}` | a precise "Use when …" trigger phrase derived from the rule |
| `{{what-this-governs}}` | a brief noun phrase summarising the topic |
| `{{tags-csv}}` | 1–4 short topical tags, comma-separated, lowercase |
| `{{repo\|global}}` | `repo` or `global` (the resolved scope) |
| `{{auto-captured\|manual\|promoted-from-coupling}}` | `auto-captured` |
| `{{ISO-DATETIME}}` | current UTC datetime in ISO-8601 (e.g. `2026-05-13T14:22:31Z`) |
| `{{skill-name\|null}}` | `related_skill` value, or the literal `null` if absent |
| `{{other-slugs-csv}}` | leave empty (will be filled by curation if needed) |
| `{{Title}}` | a human-readable title (Title Case, no punctuation) |
| `{{one-sentence-rule}}` | the rule text |
| `{{rationale-from-user-or-incident}}` | quote the user's correction (or paraphrase faithfully if a verbatim quote isn't appropriate) |
| `{{when-where-this-kicks-in}}` | concrete description of when this rule should be applied |
| `{{optional-extended-body}}` | omit unless the rule needs elaboration |

Write the substituted content to `${lessons_dir}/<YYYY-MM-DD>-<slug>.md` (the full date-prefixed filename from Step 5). Ensure `${lessons_dir}` exists (`mkdir -p`).

---

## Step 8: Append to INDEX

Read `${index_path}`. Locate the marker block:

```
<!-- LESSONS:START -->
...
<!-- LESSONS:END -->
```

Inside that block, append a single line (idempotently — if the exact line already exists, do not duplicate it):

```
- [<slug>](lessons/<YYYY-MM-DD>-<slug>.md) — <description from the lesson's frontmatter>
```

Where `<description from the lesson's frontmatter>` is the `description:` field you wrote in Step 7 (e.g. `Use when … — …`). Preserve existing entries and the markers.

---

## Step 9: Skill-improvement threshold check

Determine the resolved `related_skill` from Step 3. If it is `null`, skip this entire step.

Otherwise:

1. Count lessons whose frontmatter has `related_skill: <name>`. Scan both `${CLAUDE_PROJECT_DIR}/.agent/self-learning/lessons/` and `$HOME/.agent/self-learning/lessons/`. Sum the counts.
2. Read `skill_improve_threshold` from the active `config.yml` (Step 4's `config_path`, falling back to the global config if the repo one omits the key). Default: `3`.
3. If `count >= threshold`:
   - **Check whether the skill exists.** First resolve `SKILLS_REPO` from `.agent/self-learning/config.yml`'s `skills_repo` field (repo first, global fallback, default `~/.claude/skills`; expand `~` to `$HOME`). Then search in this order:
     1. `${SKILLS_REPO}/<name>/SKILL.md` (the user's configured skills repo)
     2. `$HOME/.claude/skills/<name>/SKILL.md` (global; same as #1 when `SKILLS_REPO` is the default)
     3. Any installed plugin's `skills/<name>/SKILL.md` under `$HOME/.claude/plugins/cache/*/*/*/skills/<name>/SKILL.md`
   - **If a matching SKILL.md is found**, append to your final response:

     ```
     📌 Skill `<name>` now has <count> captured lessons. `/improve-skill <name>` to absorb them into its SKILL.md.
     ```

   - **If no SKILL.md is found**, append:

     ```
     📌 `<name>` has <count> orphan lessons. `/promote-cluster <name> --name <name>` to create a new skill.
     ```

If `count < threshold`, skip silently.

---

## Step 10: Report

Print:

```
Saved <absolute-path-to-lesson-file>. Edit if needed.
```

If `--edit` was passed in Step 1, additionally run:

```
code --new-window "<absolute-path-to-lesson-file>"
```

(Use the Bash tool with the resolved absolute path.)

Append the skill-threshold notice from Step 9 if it fired.
