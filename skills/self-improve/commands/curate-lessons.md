---
description: Walk through every captured lesson and categorize for action (stale, duplicate, drift, underused, healthy). Updates curation-state.yml on completion. One-by-one user confirmation. Flags: `--repo-only` / `--global-only`.
disable-model-invocation: true
---

# /curate-lessons

Walk the full lesson pile (repo, global, or both) and decide per-lesson what to do — keep, edit, delete, merge, or snooze. This is the gardener loop. Run it when the curation nag fires (`⏰ Lesson curation overdue`) or whenever you want to clean house.

The plugin's own files live under `${CLAUDE_PLUGIN_ROOT}`. The target repo is `${CLAUDE_PROJECT_DIR}`. The global pile is at `$HOME/.agent/self-learning/`.

Follow every step in order.

---

## Step 1: Parse arguments

Read `$ARGUMENTS`. Supported flags:

- `--repo-only` — only curate the repo pile.
- `--global-only` — only curate the global pile.
- Neither flag → curate both piles in sequence (repo first, then global) if both exist.

If both flags are passed, refuse and ask the user to pick one.

Build the list of target piles. For each pile resolve:

- `pile_dir` — `${CLAUDE_PROJECT_DIR}/.agent/self-learning` (repo) or `$HOME/.agent/self-learning` (global).
- `lessons_dir` — `<pile_dir>/lessons`.
- `index_path` — `<pile_dir>/INDEX.md`.
- `state_path` — `<pile_dir>/curation-state.yml`.
- `config_path` — `<pile_dir>/config.yml`.

If a selected pile's `pile_dir` does not exist, skip it with a note (`<pile> pile not initialized; skipping.`).

If both piles end up skipped, stop with `No lesson piles to curate. Run /self-improve init first.`

---

## Step 2: For each pile, gather inputs

Repeat Steps 2–4 for each target pile.

1. Read `<state_path>` and extract `last_curated` (ISO date). If missing, treat as `1970-01-01`.
2. Read `default_interval_days` from `<state_path>`. Default to `30` if absent.
3. Compute the change window:
   - For the **repo pile**: `git -C ${CLAUDE_PROJECT_DIR} log --since="<last_curated>" --name-only --pretty=format: 2>/dev/null | sort -u | sed '/^$/d' | head -200` — capped to avoid context blowup.
   - For the **global pile**: same command but in `$HOME` is not meaningful — fall back to `git -C ${CLAUDE_PROJECT_DIR} log --since="<last_curated>" --name-only --pretty=format: 2>/dev/null | sort -u | head -200` as a proxy for "what has been touched recently". If the user wants a richer global signal they will tell us.
4. Read every `*.md` file in `<lessons_dir>/`. If none, skip the pile with `<pile> has no lessons; nothing to curate.`
5. Read `<index_path>`.

---

## Step 3: Invoke the curation sub-prompt

Read `${CLAUDE_PLUGIN_ROOT}/skills/self-improve/references/curation-prompt.md`. That file documents the input/output contract.

Provide the sub-prompt with:

1. The concatenated contents of every lesson file (with a clear `--- <slug> ---` separator between each file).
2. The contents of `<index_path>`.
3. The capped diff from Step 2.

Receive a JSON array of `{ slug, category, recommendation, supporting_evidence }` entries.

---

## Step 4: Present each lesson one-by-one

Iterate the JSON entries in order. For each entry, print:

```
Lesson: <slug>
Category: <stale|duplicate|drift|underused|healthy>
Recommendation: <recommendation>
Supporting evidence: <supporting_evidence>
Actions: [keep] [edit] [delete] [merge with <other-slug>] [snooze]
```

Wait for the user's action choice. Apply it:

- **`keep`** — no change. Move on.
- **`edit`** — open the lesson file with `code --new-window "<absolute-path-to-lesson>"` and wait for the user to confirm they're done. Re-read the file. Move on.
- **`delete`** — confirm once (`Delete <slug>? (y/n)`). On `y`: delete the lesson file AND remove its line from `<index_path>` (inside the `<!-- LESSONS:START --> ... <!-- LESSONS:END -->` block). On `n`: treat as `keep`.
- **`merge with <other-slug>`** — read both lesson files. Produce a merged draft that consolidates rule + rationale + applicability of both. Present the merged content to the user for approval. On approval: write the merged content to the surviving slug (use the more general / more recently updated slug as the survivor; ask if ambiguous). Delete the superseded file. Update `<index_path>`: drop the merged-away line, keep (or rewrite) the survivor line.
- **`snooze`** — append the lesson's slug to an in-memory snooze list for this run; do not write any per-lesson state, just skip writing any action for it this round.

Track per-action counts (`kept`, `edited`, `deleted`, `merged`, `snoozed`) for the final report.

If the user types anything outside the action menu, ask them again with the same prompt.

---

## Step 5: Update `curation-state.yml`

Once the pile is fully reviewed:

- Compute today's UTC date: `date -u +%Y-%m-%d`.
- Read `default_interval_days` (already loaded in Step 2).
- Compute `next_nag` = today + `default_interval_days` days. Use `date -u -d "+<N> days" +%Y-%m-%d` (or the equivalent on git-bash; `date -u -v +<N>d +%Y-%m-%d` on macOS).
- Write `<state_path>`:

```yaml
last_curated: <today>
next_nag: <next_nag>
default_interval_days: <unchanged>
```

Preserve any other keys in the file that we didn't explicitly manage.

---

## Step 6: Per-pile summary

After each pile, print:

```
<pile> pile curated.
  reviewed: <total>
  kept: <n>
  edited: <n>
  deleted: <n>
  merged: <n>
  snoozed: <n>
  next nag: <ISO-date>
```

After all piles, print:

```
Curation complete.
```
