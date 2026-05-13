# self-improve — Integration Test Plan

Live integration testing requires a running Claude Code session with the plugin loaded — automated tests can't drive the hook + slash-command loop end-to-end. This plan is the manual script: execute each test top-to-bottom in a single CC session and record pass/fail.

Run from a shell with `jq` available on `PATH`.

---

## Test 0: Scaffold a throwaway test repo

Run once before the rest of the suite. Re-run between tests if you want a clean slate.

```bash
repo="C:/tmp/self-improve-test-$(date +%s)"
mkdir -p "$repo/packages/foo-a/src" "$repo/packages/foo-b/src" "$repo/packages/foo-c/src"
echo "export const a = 1" > "$repo/packages/foo-a/src/index.ts"
echo "export const b = 1" > "$repo/packages/foo-b/src/index.ts"
echo "export const c = 1" > "$repo/packages/foo-c/src/index.ts"
git -C "$repo" init
# Set a local git identity so `git commit` doesn't fail on a fresh machine that
# has no global user.email / user.name configured.
git -C "$repo" config user.email "test@example.com"
git -C "$repo" config user.name "Test"
git -C "$repo" add -A && git -C "$repo" commit -m "initial"
echo "Test repo at $repo"
```

Note: the regex-test helper (`tests/test-regex.sh`) and the pre-push hook both rely on GNU grep's `\b` word-boundary anchor. On macOS, install GNU grep via Homebrew (`brew install grep`) and ensure `ggrep` is on PATH (or alias `grep=ggrep`) before running Tests 3, 4, or 5.

The three sibling `packages/foo-*` directories give the bootstrap coupling scan something realistic to detect.

---

## Test 1: Smoke test — plugin loads

**Action:**
```bash
claude --plugin-dir <path-to-skills-repo>/skills/self-improve
```

Once CC starts, list loaded plugins. Use whichever of these the current CC build supports — confirm in the menu:
- `/plugin list` (preferred when available)
- `/plugins` (older builds)
- `/help` and locate the plugin index

**Pass criteria:**
- Claude Code starts without throwing on plugin load.
- The plugin index shows `self-improve@0.1.0`.
- `/self-improve init`, `/learn`, `/couple`, `/check-couplings`, `/curate-lessons`, `/curate`, `/promote`, `/promote-cluster`, `/improve-skill`, `/promote-skill` are all listed in the slash-command index (or autocompleted).

**Common failures:**
- `jq: command not found` → install per README. The hook will silently no-op; tests 3, 4, and 6 will fail.
- Plugin missing from the index → CC didn't load the manifest. Restart CC, re-check the `--plugin-dir` flag points at the plugin root (the dir containing `.claude-plugin/plugin.json`), not the `.claude-plugin/` subdir.

---

## Test 2: Init test

**Setup:** `cd` Claude Code into the throwaway repo from Test 0 (open it as the project directory).

**Action:**
1. Run `/self-improve init`.
2. When the bootstrap coupling scan presents proposed couplings derived from `packages/foo-*`, accept at least one (press `a`).
3. Skip remaining (press `s`) if more than one proposal is offered.
4. When prompted about the git pre-push hook, answer `yes`.

**Pass criteria:**
- `ls "$repo/.agent/self-learning/"` shows: `INDEX.md`, `coupling.json`, `coupling.schema.json`, `curation-state.yml`, `config.yml`, `lessons/promoted/.gitkeep`.
- `cat "$repo/CLAUDE.md"` (created if absent) contains the `<!-- SELF-IMPROVE:START -->` reference block.
- `cat "$repo/AGENTS.md"` (created if absent) contains the same block.
- `cat "$repo/.agent/self-learning/coupling.json"` contains at least one entry in the `couplings` array.
- `ls -l "$repo/.git/hooks/pre-push"` exists and is executable.
- `cat "$repo/.agent/self-learning/curation-state.yml"` has today's date in `last_curated` and today + 30 days in `next_nag`.
- `ls "$HOME/.agent/self-learning/"` exists (if it didn't already), with the same files except `coupling.json` is empty.

---

## Test 3: Correction capture test

**Setup:** Throwaway repo from Test 2, `.agent/self-learning/` present.

**Action:**
1. Type into Claude Code: `you forgot to run typecheck after that change`.
2. Read the response. The last line should be: `📌 Saw you corrected me about <something about skipping typecheck>. /learn yes to capture.`
3. Run `/learn yes`.
4. If `/learn` asks for scope and `related_skill`, accept the model's suggestion.

**Pass criteria:**
- The `📌` line appears at the end of step 2's response.
- `ls "$repo/.agent/self-learning/lessons/"` shows a new `<YYYY-MM-DD>-<slug>.md` file.
- `cat` that file: it has frontmatter (`scope`, `related_skill`, `tags`, `created`) and a body with the rule + rationale.
- `cat "$repo/.agent/self-learning/INDEX.md"` shows a new entry inside `<!-- LESSONS:START --> ... <!-- LESSONS:END -->` with a `Use when ...` routing description pointing at the new lesson file.

**Common failures:**
- No `📌` line → check `config.yml` has `correction_detection.enabled: true`; check `jq` is on PATH; check the prompt actually matched a regex in `lib/regex-patterns.json` (try a more obvious phrasing: "next time, run typecheck after type changes").

---

## Test 4: Coupling capture test

**Setup:** Throwaway repo, post-Test 3.

**Action:**
1. Type: `whenever I update packages/foo-a/src/index.ts we also need to update packages/foo-b/src/index.ts`.
2. Watch for the `📌 Detected a coupling rule ... /couple yes to capture.` line.
3. Run `/couple yes`. Accept the model's draft (or edit if needed).

**Pass criteria:**
- The `📌` line appears.
- `cat "$repo/.agent/self-learning/coupling.json"` now contains a new entry whose trigger matches `packages/foo-a/src/index.ts` and whose impacts include `packages/foo-b/src/index.ts`.
- Entry validates against `coupling.schema.json` (no JSON error on save).

---

## Test 5: Coupling enforcement test

**Setup:** Throwaway repo, post-Test 4 (the foo-a → foo-b coupling exists).

**Action:**
```bash
cd "$repo"
# `git push` only invokes the pre-push hook when a remote is configured.
# Create a local bare repo so the hook actually runs without a network call.
bare="$repo.git"
if [ ! -d "$bare" ]; then
  git init --bare "$bare"
  git -C "$repo" remote add origin "$bare"
  git -C "$repo" push origin HEAD 2>/dev/null || true   # seed the bare repo
fi
echo "export const a2 = 2" >> packages/foo-a/src/index.ts
git add packages/foo-a/src/index.ts
git commit -m "modify foo-a only"
git push 2>&1 || echo "push exited non-zero (expected)"
```

(If you'd rather not create a bare repo, invoke the hook directly:
```bash
sha="$(git -C "$repo" rev-parse HEAD)"
echo "refs/heads/main $sha refs/heads/main 0000000000000000000000000000000000000000" \
  | bash "$repo/.git/hooks/pre-push" origin "file://$repo"
```)

**Pass criteria:**
- Output contains a message naming the missing impact: `packages/foo-b/src/index.ts` not modified.
- Exit status of `git push` is non-zero (the hook blocks).
- Re-run `git push --no-verify` (or skip — we only need to verify the gate triggered).
- Flip `enforcement.pre_push_block: false` in `config.yml`, re-run `git push`; verify it now warns but exits zero.

---

## Test 6: Curation nag test

**Setup:** Throwaway repo, post-Test 5, with at least one lesson in `lessons/`.

**Action:**
1. Edit `$repo/.agent/self-learning/curation-state.yml` and set `next_nag` to yesterday's date. Compute it portably:
   ```bash
   yday="$(date -d 'yesterday' +%F 2>/dev/null || date -v-1d +%F)"
   echo "yesterday: $yday"
   ```
   then substitute `$yday` into the YAML.
2. In Claude Code, type any prompt — e.g. `hello`.
3. Read the response.

**Pass criteria:**
- The response (or the system context preceding it) contains a curation nag along the lines of `<N> lessons pending review. /curate-lessons to walk through them.`
- Run `/curate-lessons`. It walks through each lesson, asks keep/edit/drop, and on completion updates `last_curated` and `next_nag` (today + 30 days).

---

## Test 7: Skill self-improvement test

**Setup:** Throwaway repo, post-Test 6. This test exercises the `${SKILLS_REPO}/<name>/` mirror flow (where `SKILLS_REPO` comes from `.agent/self-learning/config.yml`'s `skills_repo` field — default `~/.claude/skills`). Pick a skill you don't mind temporarily modifying — recommendation: create a disposable test skill first:

```bash
SKILLS_REPO="${SKILLS_REPO:-$HOME/.claude/skills}"
mkdir -p "$SKILLS_REPO/_test-skill-throwaway"
cat > "$SKILLS_REPO/_test-skill-throwaway/SKILL.md" <<'EOF'
---
name: _test-skill-throwaway
description: Disposable test skill for self-improve integration. Delete after.
---
# Test skill
Original body.
EOF
# Commit the test skill in the skills repo (if it's git-tracked).
git -C "$SKILLS_REPO" add "_test-skill-throwaway" 2>/dev/null && \
  git -C "$SKILLS_REPO" commit -m "temp: test skill" 2>/dev/null || \
  echo "(skills repo not git-tracked at $SKILLS_REPO — skipping commit)"
```

**Action:**
1. Capture 3 lessons that tag `related_skill: _test-skill-throwaway`. For each:
   - Type a correction phrased so the model infers the test skill from your prompt context (mention the skill name explicitly: "when working with the _test-skill-throwaway skill, you should always X").
   - On `/learn yes`, if the inferred `related_skill` is wrong, pass `--skill _test-skill-throwaway` explicitly.
2. After the 3rd capture, watch for a nudge: `3 lessons share related_skill: _test-skill-throwaway. /improve-skill _test-skill-throwaway to absorb.`
3. Run `/improve-skill _test-skill-throwaway`. Confirm a unified diff against the skill's SKILL.md is previewed (no write yet).
4. Run `/improve-skill _test-skill-throwaway apply`. When prompted to commit + push, answer `yes`.

**Pass criteria:**
- Step 2 produces the threshold nudge.
- Step 3 produces a diff preview without modifying any file.
- Step 4:
  - `cat "$SKILLS_REPO/_test-skill-throwaway/SKILL.md"` shows the absorbed rules from the 3 lessons.
  - `cat "$HOME/.claude/skills/_test-skill-throwaway/SKILL.md"` is byte-identical to the source (skipped when `SKILLS_REPO == $HOME/.claude/skills` — same path).
  - `git -C "$SKILLS_REPO" log -1` shows a new commit referencing the skill (only when `SKILLS_REPO` is a separate git-tracked repo).
  - `git -C "$SKILLS_REPO" status` is clean (push completed if remote is configured; if not, the local commit is enough).
- The 3 lessons are moved to `.agent/self-learning/lessons/promoted/` (archived).

**Cleanup:**
```bash
# Resolve the skills repo path from the plugin's config (or substitute literally).
SKILLS_REPO="${SKILLS_REPO:-$HOME/.claude/skills}"
rm -rf "$SKILLS_REPO/_test-skill-throwaway" "$HOME/.claude/skills/_test-skill-throwaway"
# Stage explicit paths instead of -A so unrelated working-tree changes aren't
# accidentally swept into the cleanup commit.
git -C "$SKILLS_REPO" add "_test-skill-throwaway" 2>/dev/null || true
git -C "$SKILLS_REPO" commit -m "cleanup: remove test skill" 2>/dev/null || true
```

---

## Reporting

For each test record: PASS / FAIL / SKIPPED + one-line note. File any failure as a follow-up issue on the plugin tracker (or the skills repo's issues) with:
- Test number
- CC build / version
- OS + `jq --version`
- Last 50 lines of CC log + the failing output

A full clean pass means the plugin is shippable to marketplace.
