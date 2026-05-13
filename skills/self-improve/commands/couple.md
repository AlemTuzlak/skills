---
description: Capture an architectural coupling rule. `/couple yes` confirms an auto-detected coupling from your last message; `/couple add` is manual entry. Couplings are checked at plan-time and pre-push.
disable-model-invocation: true
---

# /couple

Capture an architectural coupling — a rule that says "when X changes, Y must also change (or new Y must be added)". Couplings live in `${CLAUDE_PROJECT_DIR}/.agent/self-learning/coupling.json`. They are consulted at plan-time (via the UserPromptSubmit hook) and enforced at pre-push (via the git hook).

Follow every step in order.

---

## Step 1: Parse arguments

Read `$ARGUMENTS`. Two forms are supported:

- **`/couple yes`** — confirm a coupling drafted by the auto-detection in the previous turn. No further args required.
- **`/couple add`** — manual entry. Accepts flags:
  - `--target <path-or-glob>` (repeatable; collect into an array if passed multiple times)
  - `--kind <change-required|new-code-required>`
  - `--trigger <pattern>`
  - `--why <reason>`
  - `--id <kebab-case-id>` (optional; otherwise generated)

If the first positional token is neither `yes` nor `add`, print usage and stop:

```
Usage:
  /couple yes
      Confirm a coupling auto-detected from your previous message.

  /couple add --target <path|glob> --kind <change-required|new-code-required> --trigger <pattern> --why <reason> [--id <slug>]
      Manually add a coupling.
```

---

## Step 2A: `yes` path — recover drafted entry from context

Look back through this conversation for the most recent injected `## Coupling assertion detected` block followed by your model response containing a line of the form:

```
📌 Saw you describe a coupling — `/couple yes` to capture, ignore to dismiss.
```

In that same response you should have drafted a structured entry of the shape:

```json
{
  "id": "<kebab-case>",
  "trigger": "<pattern>",
  "impacts": [
    { "target": "<path-or-array>", "kind": "change-required|new-code-required", "why": "<reason>" }
  ]
}
```

Extract that draft. If no such draft is in context, fall back to asking the user for each field (`id`, `trigger`, and for each impact: `target`, `kind`, `why`) and build the entry interactively. Continue to Step 3.

## Step 2B: `add` path — build entry from arguments

Collect:

- `id` — if `--id` provided, use it; otherwise derive a kebab-case id from `--trigger` (or ask the user if `--trigger` isn't sufficient). Must match `^[a-z0-9-]+$`.
- `trigger` — value of `--trigger`. If missing, ask the user: `What file/symbol/glob triggers this coupling?`
- `kind` — value of `--kind`. If missing, ask the user: `Kind: change-required (existing code must change) or new-code-required (new code must be added)?` Validate it's one of the two enum values.
- `target` — value(s) from `--target`. If a single `--target` was passed, store as string. If multiple were passed, store as an array of strings. If none were passed, ask: `What path(s) or glob(s) must change/be-added when the trigger fires?`
- `why` — value of `--why`. If missing, ask the user: `Why is this coupling necessary?`

Assemble:

```json
{
  "id": "<id>",
  "trigger": "<trigger>",
  "impacts": [
    { "target": <string-or-array>, "kind": "<kind>", "why": "<why>" }
  ]
}
```

(Only one impact is created via `add`. For multi-impact couplings, edit `coupling.json` manually after capture.)

---

## Step 3: Contradiction check against existing couplings

Read `${CLAUDE_PROJECT_DIR}/.agent/self-learning/coupling.json`. For each existing entry in `couplings[]`:

- **Overlapping trigger:** if existing `trigger` equals the new `trigger`, OR either is a substring of the other, treat the triggers as overlapping.
- **Overlapping target:** for each impact in the new entry, check whether any existing entry has an impact whose `target` overlaps (string equality, substring, or — for glob-looking strings — overlapping glob coverage like `packages/foo/*` vs `packages/foo/bar/*`).

If both trigger AND target overlap with an existing entry, surface the conflict:

```
Possible conflict with existing coupling `<existing-id>`:
  Existing trigger: <existing-trigger>
  Existing impact:  <target> [<kind>] — <why>
  New trigger:      <new-trigger>
  New impact:       <target> [<kind>] — <why>

Options:
  merge   — add the new impact to the existing coupling instead of creating a new entry
  replace — overwrite the existing coupling with the new entry
  skip    — keep both; the new entry is added alongside
  abort   — cancel the capture
```

Wait for an explicit choice. Apply it:

- `merge` → append the new impact to the existing entry's `impacts` array (dedup by `(target, kind)`); do not create a separate entry. Use the existing `id`.
- `replace` → drop the existing entry; add the new entry in its place.
- `skip` → proceed with both entries coexisting.
- `abort` → stop with `Aborted — no changes written.`

If there is no overlap, continue to Step 4 without prompting.

---

## Step 4: Validate against the schema

Read `${CLAUDE_PROJECT_DIR}/.agent/self-learning/coupling.schema.json`. Check the new (or merged) entry satisfies:

- `id` is a string matching `^[a-z0-9-]+$`.
- `trigger` is a non-empty string.
- `impacts` is a non-empty array.
- Each impact has `target` (string OR array of strings), `kind` ∈ `["change-required", "new-code-required"]`, and a non-empty `why`.

If any constraint fails, refuse with a precise error message identifying the bad field, and stop without writing.

---

## Step 5: Append to `coupling.json`

Read the current `coupling.json`. Apply the action from Step 3 (`merge` / `replace` / new entry). Preserve the `$schema` field and preserve the existing array order — new entries append at the end. Pretty-print with 2-space indent. Trailing newline.

Write the updated file back to `${CLAUDE_PROJECT_DIR}/.agent/self-learning/coupling.json`.

---

## Step 6: Report

Print:

```
Coupling `<id>` saved. Will be checked at plan-time and pre-push.
```

If Step 3 resolved as `merge` or `replace`, note that explicitly:

```
Coupling `<id>` merged into existing entry. Will be checked at plan-time and pre-push.
```

or

```
Coupling `<id>` replaced existing entry. Will be checked at plan-time and pre-push.
```
