---
description: Targeted curation actions. `/curate snooze <duration>` defers the next nag without curating. `/curate <slug>` curates a single lesson.
disable-model-invocation: true
---

# /curate

Targeted curation entry point. Two forms:

- `/curate snooze <duration>` — defer the next curation nag without doing a full review. Does NOT update `last_curated`.
- `/curate <slug>` — review one specific lesson now.

Use `/curate-lessons` for a full walkthrough of the pile.

The plugin's own files live under `${CLAUDE_PLUGIN_ROOT}`. The target repo is `${CLAUDE_PROJECT_DIR}`. The global pile is at `$HOME/.agent/self-learning/`.

---

## Step 1: Parse arguments

Read `$ARGUMENTS`. Determine the form:

- First positional token is `snooze` → **snooze form** (Step 2 → 3).
- First positional token is anything else → treat it as a **slug** and proceed to Step 4.
- Empty `$ARGUMENTS` → print usage and stop:

```
Usage:
  /curate snooze <Nd|Nw|Nm> [--repo-only|--global-only]
      Defer the next curation nag by N days/weeks/months without curating.

  /curate <slug>
      Review a single lesson now (no effect on the nag cadence).
```

For snooze form, also parse:

- `--repo-only` → only update the repo pile's `curation-state.yml`.
- `--global-only` → only update the global pile's `curation-state.yml`.
- Neither → update both piles that exist.

Reject if both are passed.

---

## Step 2: Parse `<duration>` (snooze form)

The duration token must match `^([0-9]+)(d|w|m)$`. Map to days:

- `Nd` → N days
- `Nw` → N * 7 days
- `Nm` → N * 30 days (calendar-month approximation; do not attempt anchor-date math)

If the token doesn't match, refuse:

```
Invalid duration `<token>`. Expected `Nd`, `Nw`, or `Nm` (e.g. `30d`, `4w`, `3m`).
```

Compute the new `next_nag` date: today (UTC) + computed days. Use `date -u -d "+<N> days" +%Y-%m-%d` (or platform equivalent).

---

## Step 3: Apply snooze

Determine target piles based on flags from Step 1. For each target pile:

- `state_path` = `<pile-root>/.agent/self-learning/curation-state.yml`
- If the file doesn't exist, skip the pile with `<pile> pile not initialized; skipping.`
- Otherwise, update **only** the `next_nag` key. Preserve `last_curated` and `default_interval_days`.

Write the file back. After all updates, report:

```
Next nag deferred until <ISO-date>.
  Updated: <list of piles updated>
```

Stop. Do **not** proceed to Step 4.

---

## Step 4: Locate the lesson by slug (slug form)

Use the first positional token as the slug. Search in this order:

1. `${CLAUDE_PROJECT_DIR}/.agent/self-learning/lessons/<slug>.md`
2. `$HOME/.agent/self-learning/lessons/<slug>.md`

If neither path exists, stop:

```
No lesson with slug `<slug>` found in repo or global piles.
```

Record which pile owns the lesson — that determines which `INDEX.md` will be touched if the user picks `delete` or `merge`.

---

## Step 5: Invoke the curation sub-prompt for one lesson

Read `${CLAUDE_PLUGIN_ROOT}/skills/self-improve/references/curation-prompt.md`. Provide the sub-prompt with:

1. The contents of just this one lesson file (with the `--- <slug> ---` separator for consistency).
2. The contents of the owning pile's `INDEX.md`.
3. A capped diff: `git -C ${CLAUDE_PROJECT_DIR} log --since="<last_curated-from-curation-state>" --name-only --pretty=format: 2>/dev/null | sort -u | sed '/^$/d' | head -200`. If `last_curated` is missing, use `--since="6 months ago"`.

Receive a single JSON entry of `{ slug, category, recommendation, supporting_evidence }`.

---

## Step 6: Present the lesson and apply the action

Print:

```
Lesson: <slug>
Category: <stale|duplicate|drift|underused|healthy>
Recommendation: <recommendation>
Supporting evidence: <supporting_evidence>
Actions: [keep] [edit] [delete] [merge with <other-slug>] [snooze]
```

Wait for the user's action choice. Apply it using the same semantics as `/curate-lessons` Step 4:

- **`keep`** — no change.
- **`edit`** — `code --new-window "<absolute-path>"`, wait for the user.
- **`delete`** — confirm once. Delete the lesson file and remove its INDEX line (inside the `<!-- LESSONS:START --> ... <!-- LESSONS:END -->` markers).
- **`merge with <other-slug>`** — read both files, produce a merged draft, get user approval, write to surviving slug, delete superseded file, update INDEX. The "other slug" can live in either pile; if it lives in the opposite pile, ask the user which pile the survivor should live in.
- **`snooze`** — no-op for this command; tell the user to use `/curate snooze <duration>` for cadence changes.

---

## Step 7: Report

Do **NOT** update `last_curated`. This command is targeted, not a full review.

Print:

```
Lesson `<slug>` <action-taken>.
```

Examples: `Lesson \`stripe-webhook-idempotency\` kept.`, `Lesson \`old-tsconfig-rule\` deleted.`, `Lesson \`router-middleware-order\` merged with \`router-middleware-precedence\`.`
