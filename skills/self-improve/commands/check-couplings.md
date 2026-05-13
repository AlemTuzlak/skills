---
description: Check the current diff against .agent/self-learning/coupling.json and report missing impacted artifacts. Includes auto-sibling-fallback when no coupling matches. Use ad hoc; runs the same check that pre-push does, plus extras.
disable-model-invocation: true
---

# /check-couplings

Run the coupling-enforcement check against the current diff. Reports any triggered couplings with missing impacted artifacts, plus a "sibling-fallback" soft warning when new top-level shapes are added without a coupling rule.

This is the same logic as the pre-push hook, but invocable ad hoc and with one extra signal (sibling-fallback) that the pre-push hook intentionally omits.

The plugin's own files live under `${CLAUDE_PLUGIN_ROOT}`. The target repo is `${CLAUDE_PROJECT_DIR}`.

Follow every step in order.

---

## Step 1: Parse arguments

Read `$ARGUMENTS`. Supported flags:

- `--against <ref>` — git ref to diff against. Defaults to:
  - `origin/HEAD` if that ref resolves (`git rev-parse --verify origin/HEAD` succeeds), else
  - `HEAD~1`.

If `$ARGUMENTS` is empty, use the default.

---

## Step 2: Verify the coupling pile

Confirm `${CLAUDE_PROJECT_DIR}/.agent/self-learning/coupling.json` exists. If not, print:

```
No coupling rules at ${CLAUDE_PROJECT_DIR}/.agent/self-learning/coupling.json. Run /self-improve init, then /couple add to define rules.
```

and stop.

---

## Step 3: Resolve the diff

Run `git diff --name-only <ref>...HEAD` (note the triple-dot — diff against the common ancestor, which matches what reviewers see). Collect the changed-files list. If the list is empty:

```
No changes since <ref>. Nothing to check.
```

and stop.

---

## Step 4: Walk couplings

Read `${CLAUDE_PROJECT_DIR}/.agent/self-learning/coupling.json`. For each entry in `couplings[]`:

1. **Trigger match.** Treat `trigger` as a regex first (test with `printf '' | grep -qE "<trigger>"` — exit code 2 means invalid regex, fall back to glob). If valid regex, match each changed file with `grep -E`. If invalid, glob-match each changed file. A match on any file means the coupling is **triggered**.

2. **If triggered**, evaluate each impact:
   - Resolve `target`: string or array of strings.
   - At least one target value must match at least one changed file (regex first, then glob/prefix — `<target>/*` counts as matching). If yes, that impact is **satisfied**. If no target matches, the impact is **missing**.

3. **Categorize the coupling**:
   - **PASS** — triggered, every impact satisfied.
   - **FAIL** — triggered, at least one impact missing.
   - Not triggered → skip silently.

---

## Step 5: Auto-sibling-fallback

For every changed file not covered by any triggered coupling, identify candidate "new shapes":

- A path is a **new top-level directory** if it lives under a path like `<parent>/<new-name>/...` AND `<parent>` contains at least one sibling directory at the same depth (e.g. `packages/foo-bar/...` next to existing `packages/foo-baz/`, `packages/foo-qux/`).
- A path is a **new significant file** if it's a single top-level file (e.g. a new `Dockerfile`, `Makefile`, or root config) and a sibling with similar naming exists.

For each detected new shape:

1. Find the **nearest sibling** by directory name similarity within the same parent. Use prefix/suffix similarity or Levenshtein on the directory name. Pick exactly one sibling.
2. List files under the new shape and under the sibling (relative to each shape's root, top 2 levels deep — cap at 100 entries per side).
3. Files present in the sibling but missing in the new shape are **soft warnings**: `<new-shape>/<path-fragment> missing (sibling <sibling-shape>/<path-fragment> has it)`.
4. Compute a stable **shape key** for the deduper: `<parent>/*` (e.g. `packages/*`). All sibling-fallback hits at the same parent share a shape key.

Track shape-key counts in `${CLAUDE_PROJECT_DIR}/.agent/self-learning/fallback-counts.json`:

```json
{
  "shapes": {
    "packages/*": 2,
    "examples/*": 1
  }
}
```

- Auto-create the file with `{ "shapes": {} }` if missing.
- For each shape key that fired in this run, increment its counter by 1.
- Write the file back.
- If any shape key's post-increment count is `>= 3`, set a `nudge_<shape-key>` flag to surface in the report.

---

## Step 6: Render the report

Output structured markdown. Skip any empty section. If all sections are empty AND no nudges fired, print:

```
No coupling violations or sibling-fallback warnings since <ref>.
```

Otherwise:

```
# Coupling check (against <ref>)

## Triggered (PASS)
- `<id>` — trigger `<trigger>` — all impacts satisfied

## Triggered (FAIL)
- `<id>` — trigger `<trigger>`
  - MISSING [<kind>]: <target> (<why>)
  - MISSING [<kind>]: <target> (<why>)

## Soft warnings (sibling-fallback)
- New shape `<new-path>` (sibling: `<sibling-path>`):
  - <file-fragment> missing (sibling has it)
  - <file-fragment> missing (sibling has it)
```

If any shape-key counter reached `>= 3`, append:

```
📌 This shape (`<shape-key>`) has triggered sibling-fallback 3 times. Want to add a coupling rule? `/couple add`.
```

---

## Step 7: Exit semantics

This command is informational — it does not change exit codes for the calling shell. Pre-push uses the same data and is the enforcer.
