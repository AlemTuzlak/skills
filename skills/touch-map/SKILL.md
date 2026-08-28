---
name: touch-map
description: Use when the change intent is already settled and the agent must map what a behavior change touches before an implementation plan or any code. Use for new features, bug fixes, and refactors that move a boundary. Don't use for typos, comments, formatting, lockfile-only diffs, docs with no code, or while the user is still deciding what they want.
---

# Touch Map

Build a mental map of what this change must touch to finish. Do not write an implementation plan. Do not write code. Do not load the next skill in a pipeline. A later workflow skill sequences this map with other skills.

The map is the product: the parts and files required to get the change over the line.

## When To Use

Load after the user has decided **what** the change is, and any **how** they already chose.

- **Run for:** a new feature, a bug fix, a refactor that moves a boundary.
- **Skip:** typos, comments, formatting, lockfile-only, docs with no code.
- **If intent is still open** ("implement X" with no chosen behavior): stop. Ask until the change is settled. Then map. Do not map a feature that is not chosen yet.

## Hard Gates

1. **No code and no next skill.** This skill maps. It does not plan blocks. It does not implement.
2. **Show the map and stop.** Do not wait for approval. The user interrupts if the map is wrong.
3. **Do not read `coupling.json`.** That is a later, separate check.
4. **Do not hunt the whole repo for utils.** Record reuse the agent actually saw in the hit domain(s). A later skill owns the full search.

## Persistent Atlas

Path: `<repo>/.agent/domain-map.json`

Committed with the repo. Domain grain only. Function names do not belong here.

```json
{
  "version": 1,
  "domains": [
    {
      "id": "auth",
      "owns": ["packages/auth", "packages/auth-ui"],
      "talksTo": ["users", "sessions"]
    }
  ]
}
```

- `id` — short name, one word or kebab-case.
- `owns` — package or folder paths.
- `talksTo` — other domain ids.

**Write this file only when a domain-level fact changed:** a domain added, removed, or renamed; `owns` paths; or a `talksTo` link. Adding a function inside an existing domain must not edit this file.

## Procedures

### Procedure 1: Confirm settled intent

1. If the change is already clear (named bug, named function, named behavior), continue.
2. If the user is still choosing what they want, stop mapping. Ask until intent is settled. Then return here.

### Procedure 2: Load or bootstrap the atlas

1. If `.agent/domain-map.json` exists, read it.
2. If it is missing, build a first atlas at **domain grain only**:
   - Prefer `packages/*` (or the repo's package folders).
   - Else use top-level area folders under `src/` (or the main source root).
   - Set `talksTo` from import edges between those `owns` paths.
   - Do not put function names in the atlas.
3. Create `.agent/` if needed. Write the file. Show the new atlas in the same turn. Continue. Do not wait.

### Procedure 3: Zoom into this change

1. Pick the hit domain(s) from the atlas and the settled intent.
2. Start from the modules that clearly belong to the change.
3. Read those files. Follow imports **only while the "files to touch" list is still changing**.
4. Stop when a newly opened file does not change the map. Do not read a package for completeness.
5. Name parts as **modules plus existing functions and types** the change will use or sit next to. Files are pointers, not the map.
6. Note reuse actually seen in those files (path + symbol). Do not grep the whole workspace for helpers.

### Procedure 4: Pick the path if more than one exists

If only one honest path exists, state it in one line.

If more than one path exists, pick one. Stop at the first ladder step that decides:

1. Reuse something that exists over writing a new module.
2. Stay inside the hit domain(s). Do not open a new domain.
3. Do not add a package, layer, or public API if an internal change works.
4. Then fewest files.

Name the winner and **which step** decided it. Fewest files is the tie-break, not the whole rule. Do not stuff new behavior into a god file to win on file count.

### Procedure 5: Update the atlas (domain-level only)

1. If this change adds, removes, or renames a domain, or changes `owns` / `talksTo`, patch `.agent/domain-map.json` in this same work.
2. If nothing at domain grain changed, leave the file alone.

### Procedure 6: Show the per-change map

Show these six sections, in this order. Do not write a per-task markdown file.

1. **Hit domain(s)** — from the atlas.
2. **Parts** — modules, plus existing functions and types in play. Include reuse seen (path + symbol).
3. **How they talk** — only edges this change uses (calls, types, data). Not a full call graph. Add a Mermaid diagram only if those edges are hard to see in bullets.
4. **Files to touch** — the finish-line list. This is the standalone product.
5. **Will not touch** — explicit. Stops drive-by edits.
6. **Path pick** — one line if there was one path. If there were several, the winner and the ladder step.

### Procedure 7: Stop

1. After Procedure 6, stop.
2. Do not write code. Do not load another skill from this one.

## Decision Tree

- Intent not settled → Procedure 1, then stop mapping until it is.
- Intent settled, behavior change → Procedure 2 → 3 → 4 → 5 → 6 → 7.
- Typo / comment / format / lockfile / docs-only → this skill does not apply.
- Atlas file missing → Procedure 2 step 2 (bootstrap), then continue.
- One path vs many paths → Procedure 4.

## Red Flags

| Signal | What it means | Do instead |
|---|---|---|
| Mapping before the user chose the feature | Intent is not settled | Procedure 1. Grill first. |
| Opening every file in `owns` | Tour, not a map | Procedure 3: stop when the file list is stable. |
| Grepping the monorepo for `isRecord` | Full search is a different skill | Record only reuse already seen. |
| Reading `coupling.json` | Wrong file | Leave that check for later. |
| Waiting for "looks good?" on the map | Gate is show-and-stop | Show the six sections and stop. |
| Starting to code after the map | This skill only maps | Procedure 7. No code. |
| Loading the next pipeline skill from here | Leaves compose at the workflow | Stop. Let the workflow skill sequence. |
| Writing `.agent/touch-maps/<task>.md` | Stale task junk | Chat (or session) only. Atlas file is the only persist. |
| Editing the atlas because a helper was added | Function grain in the atlas | Leave the atlas. Put the helper in section 2. |
| Picking the path with fewest files first | God-file trap | Run the full ladder. |

## Error Handling

- **Not inside a git repo:** map this change in the six sections. Skip the atlas file. Say that in one line.
- **Atlas JSON is invalid:** do not guess. Report the parse error. Rebuild from Procedure 2 step 2 only if the user agrees, or fix the JSON if the intent is obvious (trailing comma, missing bracket).
- **Hit domain is unclear:** pick the smallest set of domains that can own the change. State the doubt in Path pick. Do not invent a new domain for a one-file bug.
- **User interrupts that the map is wrong:** correct the six sections. Re-run Procedure 4 if the path changed. Then stop.
