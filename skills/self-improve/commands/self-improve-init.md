---
description: Use when bootstrapping self-improve in a repo for the first time — scaffolds `.agent/self-learning/`, runs the initial coupling scan, wires CLAUDE.md/AGENTS.md, and optionally installs a git pre-push hook.
disable-model-invocation: true
---

# /self-improve init

You are bootstrapping the self-improve plugin inside the user's current repository (`${CLAUDE_PROJECT_DIR}`). Follow every step below in order. Do not skip steps. Do not proceed past a step that requires user consent without obtaining it.

The plugin's own files (templates, hook scripts, sub-prompts) live under `${CLAUDE_PLUGIN_ROOT}`. The target repo is `${CLAUDE_PROJECT_DIR}`.

---

## Step 1: Pre-check — is the repo already initialized?

Check whether `${CLAUDE_PROJECT_DIR}/.agent/self-learning/` already exists.

- If it does **not** exist, continue to Step 2.
- If it **does** exist, stop and ask the user verbatim:

  > `.agent/self-learning/` already exists in this repo. Re-initializing is destructive and will overwrite the existing INDEX.md, coupling.json, curation-state.yml, and config.yml. Lessons under `lessons/promoted/` will be preserved.
  >
  > Choose:
  > 1. **Re-init** — overwrite the four top-level files; keep `lessons/promoted/`.
  > 2. **Abort** — make no changes.

  Wait for an explicit choice. On "Abort", exit with no changes. On "Re-init", continue to Step 2 and overwrite the four files; leave `lessons/promoted/` untouched.

Do **not** proceed without an explicit choice.

---

## Step 2: Scaffold the directory tree

Create the following structure inside `${CLAUDE_PROJECT_DIR}`:

```
.agent/self-learning/
├── INDEX.md
├── lessons/
│   └── promoted/         # empty, kept with a .gitkeep
├── coupling.json
├── curation-state.yml
└── config.yml
```

For each file, copy from the matching template under `${CLAUDE_PLUGIN_ROOT}/templates/` and substitute placeholders:

### `.agent/self-learning/INDEX.md`

Copy `${CLAUDE_PLUGIN_ROOT}/templates/INDEX.md.tmpl` verbatim. The `<!-- LESSONS:START --> ... <!-- LESSONS:END -->` block stays empty — it will be populated by `/learn` later.

### `.agent/self-learning/coupling.json`

Copy `${CLAUDE_PLUGIN_ROOT}/templates/coupling.json.tmpl` verbatim. The contents must be:

```json
{
  "$schema": "./coupling.schema.json",
  "couplings": []
}
```

Also copy `${CLAUDE_PLUGIN_ROOT}/templates/coupling.schema.json` to `${CLAUDE_PROJECT_DIR}/.agent/self-learning/coupling.schema.json` so the `$schema` reference resolves locally.

### `.agent/self-learning/curation-state.yml`

Copy `${CLAUDE_PLUGIN_ROOT}/templates/curation-state.yml.tmpl` and substitute:

- `{{ISO-DATE}}` → today's date in `YYYY-MM-DD` form (UTC).
- `{{ISO-DATE-PLUS-INTERVAL}}` → today's date plus 30 days, in `YYYY-MM-DD` form.

Final shape:

```yaml
# Curation cadence state. Updated by /curate-lessons and /curate snooze.
last_curated: 2026-05-13
next_nag: 2026-06-12
default_interval_days: 30
```

(Use the real current date — the values above are illustrative.)

### `.agent/self-learning/config.yml`

Copy `${CLAUDE_PLUGIN_ROOT}/templates/config.yml.tmpl` verbatim — no substitutions.

### `.agent/self-learning/lessons/promoted/.gitkeep`

Create an empty file so the directory is tracked by git.

---

## Step 3: Bootstrap coupling scan

Generate a recursive directory listing of `${CLAUDE_PROJECT_DIR}` (paths only, no file contents). Exclude `node_modules`, `.git`, `dist`, `build`, `.next`, `.turbo`, `.nx`, `coverage`, and any other vendor/build output dirs. Pass that listing as input to the sub-prompt at `${CLAUDE_PLUGIN_ROOT}/skills/self-improve/references/bootstrap-scan-prompt.md`.

The sub-prompt will return a JSON array of proposed couplings, ranked by confidence. For each proposed coupling, present it to the user in this format:

```
Proposed coupling: <id>  (confidence: <high|medium|low>)
  Derived from: <example_sibling>
  Trigger: <trigger>
  Impacts:
    - <target>  [<kind>]  — <why>
    - ...

Action? [a]ccept / [r]eject / [e]dit / [s]kip remaining
```

Handle each response:

- **accept** — append the `rule` object to the `couplings` array in `${CLAUDE_PROJECT_DIR}/.agent/self-learning/coupling.json`. Track the accepted id.
- **reject** — drop the rule, move to next.
- **edit** — show the rule's JSON, let the user revise inline, validate against `coupling.schema.json`, then append on confirm.
- **skip remaining** — stop iterating and write whatever has been accepted so far.

After the loop, save `coupling.json` once with the final accepted set. Track the list of accepted ids — you will report them in Step 7.

If the sub-prompt returned an empty array, skip this step silently and note "no couplings proposed" in the summary.

---

## Step 4: Insert reference block into CLAUDE.md and AGENTS.md

For each of `${CLAUDE_PROJECT_DIR}/CLAUDE.md` and `${CLAUDE_PROJECT_DIR}/AGENTS.md`:

1. If the file does **not** exist, create it containing **only** the reference block below.
2. If the file **does** exist, read it and search for the literal marker `<!-- SELF-IMPROVE:START -->`.
   - If the marker is present, skip — the file is already wired. Do **not** modify it.
   - If the marker is absent, append the reference block to the end of the file with a single blank line of separation.

The reference block to insert is **exactly** this (including the HTML comment markers — they let `/learn` and future tooling locate and update the section idempotently):

```markdown
<!-- SELF-IMPROVE:START -->
## Lessons & couplings

See [`.agent/self-learning/INDEX.md`](.agent/self-learning/INDEX.md) for routing descriptions of captured lessons.
See [`.agent/self-learning/coupling.json`](.agent/self-learning/coupling.json) for architectural impact-surface rules.
<!-- SELF-IMPROVE:END -->
```

Track which of the two files were modified (created, appended, skipped-because-already-present) for the summary in Step 7.

---

## Step 5: Offer git pre-push hook install

Ask the user verbatim:

> Install a git `pre-push` hook to enforce couplings before push? Recommended — the hook blocks pushes whose diff violates `coupling.json`. To bypass, pass `--no-verify` (skips ALL hooks) or set `SKIP_COUPLING_CHECK=1` (per-script bypass — leaves other hooks running). (yes / no)

Branch on the answer:

- **no** — skip silently. Note "user declined" for the summary.
- **yes** — proceed:
  1. Verify `${CLAUDE_PROJECT_DIR}/.git/` exists. If not, this is not a git repo — print a warning, skip, note that fact in the summary.
  2. Check whether `${CLAUDE_PROJECT_DIR}/.git/hooks/pre-push` already exists.
     - **If it exists** — do **not** overwrite. Print:
       > A `.git/hooks/pre-push` is already present. The self-improve hook will not overwrite it. You can merge the logic from `${CLAUDE_PLUGIN_ROOT}/hooks/pre-push.sh` into your existing hook manually.
       Note "skipped — existing hook" for the summary.
     - **If it does not exist** — copy `${CLAUDE_PLUGIN_ROOT}/hooks/pre-push.sh` to `${CLAUDE_PROJECT_DIR}/.git/hooks/pre-push` and make it executable (`chmod +x`). Note "installed" for the summary.

---

## Step 6: Initialize the global `~/.agent/self-learning/` if missing

Check whether `$HOME/.agent/self-learning/` exists.

- If it **does** exist, skip silently.
- If it **does not** exist, scaffold it from the same templates as Step 2 with these differences:
  - **No coupling scan.** The global pile is repo-agnostic; couplings are always repo-scoped. Write `coupling.json` with the empty `{"couplings": []}` template and also drop in `coupling.schema.json` alongside.
  - All other files (`INDEX.md`, `curation-state.yml`, `config.yml`, `lessons/promoted/.gitkeep`) come from the same templates with the same substitutions (today's date / +30 days for `curation-state.yml`).

Path resolution: use `$HOME` (the plugin's shell scripts run under bash, including git-bash on Windows, so `$HOME` resolves correctly across platforms — on Windows it maps to `%USERPROFILE%`).

Track whether you scaffolded the global pile or skipped — report in Step 7.

---

## Step 7: Report summary

Print a final summary to the user with these sections:

```
self-improve init — complete

Files added in this repo:
  - .agent/self-learning/INDEX.md
  - .agent/self-learning/coupling.json
  - .agent/self-learning/coupling.schema.json
  - .agent/self-learning/curation-state.yml
  - .agent/self-learning/config.yml
  - .agent/self-learning/lessons/promoted/.gitkeep
  - <CLAUDE.md or AGENTS.md if created/appended>

Couplings accepted: <count>
  - <id-1>
  - <id-2>
  - ...
  (or: "none")

Pre-push hook: <installed | skipped — existing hook | skipped — not a git repo | declined>

Global ~/.agent/self-learning/: <scaffolded | already present>
```

Suggest the user commit the new `.agent/` directory and any modified `CLAUDE.md`/`AGENTS.md`:

```
git add .agent/ CLAUDE.md AGENTS.md
git commit -m "chore: bootstrap self-improve"
```

Do not run the commit yourself — leave that to the user.
