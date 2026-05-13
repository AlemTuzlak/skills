---
description: Promote a single lesson. `--to claude-md` moves the lesson body into the SELF-IMPROVE block of CLAUDE.md (lesson file becomes a redirect stub). `--global` moves the lesson from repo pile to global ~/.agent/self-learning/.
disable-model-invocation: true
---

# /promote

Promote a single captured lesson up the memory hierarchy. Two vectors:

- `--to claude-md` — inline the lesson body into `${CLAUDE_PROJECT_DIR}/CLAUDE.md`'s SELF-IMPROVE block (so every conversation in this repo sees it without needing the routing layer). The lesson file is replaced with a redirect stub.
- `--global` — move the lesson from the repo pile (`${CLAUDE_PROJECT_DIR}/.agent/self-learning/`) to the global pile (`$HOME/.agent/self-learning/`) so it applies across every repo.

The plugin's own files live under `${CLAUDE_PLUGIN_ROOT}`. The target repo is `${CLAUDE_PROJECT_DIR}`.

Follow every step in order.

---

## Step 1: Parse arguments

Read `$ARGUMENTS`. Expected:

- `/promote <slug> --to claude-md`
- `/promote <slug> --global`

Requirements:

- Positional `<slug>` is required.
- Exactly **one** of `--to claude-md` or `--global` must be passed. Refuse if both, neither, or anything else is passed:

```
Usage:
  /promote <slug> --to claude-md    Inline lesson into CLAUDE.md's SELF-IMPROVE block.
  /promote <slug> --global          Move lesson from the repo pile to the global pile.
```

---

## Step 2: Locate the lesson

Search in order:

1. `${CLAUDE_PROJECT_DIR}/.agent/self-learning/lessons/<slug>.md` (repo pile)
2. `$HOME/.agent/self-learning/lessons/<slug>.md` (global pile)

Record which pile the lesson was found in as `source_scope` (`repo` or `global`).

If found in neither, refuse:

```
Lesson `<slug>` not found in either the repo pile (.agent/self-learning/lessons/) or the global pile (~/.agent/self-learning/lessons/).
```

Read the file. Split into:

- `frontmatter` (the YAML between the leading `---` lines)
- `body` (everything after the closing `---`)

Extract from frontmatter:

- `title` — the `Title:` heading inside the body (first `# ` line), or fall back to the slug Title-Cased.

---

## Step 3 (only if `--to claude-md`): Inline into CLAUDE.md

### 3a. Verify SELF-IMPROVE markers exist

Read `${CLAUDE_PROJECT_DIR}/CLAUDE.md`. Search for the literal markers:

- `<!-- SELF-IMPROVE:START -->`
- `<!-- SELF-IMPROVE:END -->`

If either marker is missing, abort:

```
${CLAUDE_PROJECT_DIR}/CLAUDE.md does not have a SELF-IMPROVE block. Run `/self-improve init` first to wire it up.
```

### 3b. Append the lesson body inside the block

Inside the markers, append:

```markdown
## <Title>

<body of the lesson, frontmatter stripped>

---
```

(The `---` is a horizontal rule separating successive promoted lessons.)

Preserve everything that's already inside the markers — append after existing content, before the `<!-- SELF-IMPROVE:END -->` line.

Write the updated `CLAUDE.md`.

### 3c. Replace the lesson file body with a redirect stub (preserve frontmatter)

Compute today's date as `YYYY-MM-DD` (UTC).

**Preserve the original frontmatter** so that downstream tooling (the `/learn` contradiction check, the curation walker, the INDEX renderer) can still see the lesson exists and is marked as promoted. Mutate the frontmatter in place:

- Set `promoted: true` (add the key if absent).
- Set `promoted_at: <YYYY-MM-DD>`.
- Preserve every other field unchanged (`description`, `scope`, `tags`, `related_skill`, `created`, `source`, `supersedes`, etc.).

Replace the **body** (everything after the closing `---` of the frontmatter) with the redirect stub:

```markdown
Promoted to CLAUDE.md on <YYYY-MM-DD>. Body lives at CLAUDE.md > <Title>.
```

The final file shape:

```markdown
---
<preserved frontmatter>
promoted: true
promoted_at: <YYYY-MM-DD>
---

Promoted to CLAUDE.md on <YYYY-MM-DD>. Body lives at CLAUDE.md > <Title>.
```

### 3d. Mark the INDEX entry

Open the matching INDEX:

- If `source_scope == "repo"`: `${CLAUDE_PROJECT_DIR}/.agent/self-learning/INDEX.md`
- If `source_scope == "global"`: `$HOME/.agent/self-learning/INDEX.md`

Inside the `<!-- LESSONS:START --> ... <!-- LESSONS:END -->` block, find the line for `<slug>`. Rewrite it as:

```
- ~~[<slug>](lessons/<slug>.md) — <original-description>~~ (promoted to CLAUDE.md)
```

Skip to Step 5.

---

## Step 4 (only if `--global`): Move repo lesson to global pile

### 4a. Refuse if source is already global

If `source_scope == "global"`, refuse:

```
Lesson `<slug>` already lives in the global pile. Nothing to do.
```

### 4b. Move the file

Ensure `$HOME/.agent/self-learning/lessons/` exists (`mkdir -p`).

Move the file from `${CLAUDE_PROJECT_DIR}/.agent/self-learning/lessons/<slug>.md` to `$HOME/.agent/self-learning/lessons/<slug>.md`:

- If the repo is a git repo and the file is tracked, use `git mv` (run from `${CLAUDE_PROJECT_DIR}`) to preserve history. Note: `git mv` won't work across the repo boundary into `$HOME`, so this is effectively a `git rm` + `mv`. Concretely:
  ```bash
  cp "${CLAUDE_PROJECT_DIR}/.agent/self-learning/lessons/<slug>.md" "$HOME/.agent/self-learning/lessons/<slug>.md"
  git -C "${CLAUDE_PROJECT_DIR}" rm ".agent/self-learning/lessons/<slug>.md"
  ```
- Otherwise just `mv`.

If `$HOME/.agent/self-learning/lessons/<slug>.md` already exists, refuse with:

```
$HOME/.agent/self-learning/lessons/<slug>.md already exists. Resolve manually (rename or delete the global copy) and re-run.
```

### 4c. Update frontmatter

Read the moved file. In its YAML frontmatter, set `scope: global`. Preserve every other field (`description`, `tags`, `related_skill`, `created`, `source`, `supersedes`, etc.). Write back.

### 4d. Update INDEX files

- Remove the `<slug>` line from `${CLAUDE_PROJECT_DIR}/.agent/self-learning/INDEX.md` (inside the LESSONS block).
- Add the line to `$HOME/.agent/self-learning/INDEX.md` inside its LESSONS block. The line format:

  ```
  - [<slug>](lessons/<slug>.md) — <description from frontmatter>
  ```

  Verify `$HOME/.agent/self-learning/INDEX.md` exists. If not, refuse:

  ```
  Global lesson pile not initialized at $HOME/.agent/self-learning/. Run `/self-improve init` with $HOME as the target first.
  ```

---

## Step 5: Report

Print exactly:

- For `--to claude-md`: `Promoted \`<slug>\` to CLAUDE.md.`
- For `--global`: `Promoted \`<slug>\` to global.`
