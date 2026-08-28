---
name: build-feature
description: Use when the user runs /build-feature or asks to implement or build a feature end to end. Don't use when a bug is already in play, for typos, comments, formatting, docs-only work, or when the user only wants a single leaf skill.
---

# Build Feature

Run the full feature path. This skill is the driver. It loads other pack skills. It does not invent a third planning method.

Leaves stay callable alone. This is the only pack skill that names them for a pipeline, besides `fix-bug` offering `prove-it`.

## When To Use

Load when the user runs `/build-feature`, or asks to implement / build a feature (including a refactor that is not a failure).

Skip if a failure is already in play. That job is `fix-bug`. Skip typos, comments, format, docs-only. Skip if they only asked for one leaf (`/touch-map`, `/lego-plan`, and similar).

## Hard Gates

1. **No production code until plan 2 is approved.** Spec and DAG first.
2. **Two blocks.** Plan 1 (design spec) must be approved. Plan 2 (implementation plan + DAG) must be approved. Silence is not approval. `approved`, `go`, `yes`, or `looks good` counts.
3. **`grill-me` is the only interview.** Do not run Superpowers `brainstorming` questions.
4. **Do not commit** the spec file or the plan file.
5. **Same-layer nodes run in parallel.** Do not use Superpowers `subagent-driven-development` as the dispatcher (that loop is one task, then review, then the next).
6. **Every implementer subagent must be told to load** `typescript-standards`, `test-hygiene`, `reuse-first`, and `docs`. Pass the confirmed reader list and tone. Workers do not re-ask persona or tone. Workers do not get `grill-me`, `touch-map`, `lego-plan`, `writing-plans`, or `prove-it`.
7. **Do not load `prove-it` until the end ask.** Default skip. A green DAG is not proof.

## Flow

```text
grill-me (or skip if design is already settled)
  → docs Phase 1 + persona gate (stop)
  → write spec, open, wait for approved          [block 1]
  → touch-map
  → reuse-first (once, on files-to-touch)
  → lego-plan
  → writing-plans file from the DAG, open, wait  [block 2]
  → one tone gate if any node writes docs pages
  → implement layers in parallel, redraw DAG
  → optional prove-it
```

Load each named skill and follow it. Overrides in this file win where they conflict (`writing-plans` grain, no sequential dispatcher, do not commit those two files).

## Procedures

### Procedure 1: Route

1. If a test is red, CI is red, or the user says it is broken / fix this: stop. Tell them to use `fix-bug`. Do not start this flow.
2. Else Procedure 2.

### Procedure 2: Grill or skip

1. If this conversation already has a settled design (grill already done, or they pasted a spec): do not run `grill-me`. Write or copy it to the plan-1 path if that file is missing. Then Procedure 3.
2. Else load `grill-me` and follow it until the design is shared. Then Procedure 3.
3. If the spec file already exists **and** they already approved it in this conversation **and** readers are already confirmed: Procedure 5.

### Procedure 3: Docs readers (persona gate)

1. Load `docs`. Run Phase 1 only: who reads this, and which pages are new or changed.
2. Show the persona list in chat. Stop. That message is the turn.
3. After they confirm, drop, or add readers: Procedure 4.
4. If readers were already confirmed in this conversation: skip the wait. Procedure 4.

### Procedure 4: Write spec (plan 1) and block

1. Path: `docs/superpowers/specs/YYYY-MM-DD-<topic>-design.md` (today’s date, kebab topic). New file. Create parent dirs if needed.
2. Write a short **design spec**: what we build, choices from the grill, confirmed readers, doc-impact pages. Not a task list. Not full source.
3. Open the file. Do not `git add` it. Do not commit it.
4. Wait until they approve. If they want changes: edit, open, wait again.
5. Procedure 5.

### Procedure 5: Map, reuse, lego

1. Load `touch-map` and follow it (six-section map, then it stops).
2. Load `reuse-first` once on the files-to-touch list. Record the `reuse:` line. The DAG must not invent a helper that this pass found.
3. Load `lego-plan` and follow it (chat DAG + `.agent/scratch/lego-plan.json`).
4. Procedure 6.

### Procedure 6: Implementation plan (plan 2) and block

1. Announce that `writing-plans` is in use, with **node grain** (not 2-minute steps).
2. Load Superpowers `writing-plans` for header and file path only.
3. Path: `docs/superpowers/plans/YYYY-MM-DD-<topic>.md`. New file.
4. Tasks are the lego **nodes**. Each task has id, name, depends, files, parts, done-when. Embed the Mermaid DAG (same ids). Point at `.agent/scratch/lego-plan.json`. **No full production source.** Do not ask which execution mode. This skill is the driver.
5. Open the file. Do not commit it.
6. Wait until they approve. If they want changes: edit the plan and the live board together (keep ids stable). Open. Wait again.
7. Procedure 7.

### Procedure 7: Tone, then implement

1. If any node `files` include docs pages, and tone is not already chosen in this conversation: one tone gate from `docs`. Stop. Then continue.
2. If no docs pages: skip tone.
3. Ready layer = every `pending` node whose `depends` are all `done` (empty depends = ready).
4. Set those nodes to `in-progress` in `.agent/scratch/lego-plan.json`. Redraw the DAG in chat (ids stable, label each status).
5. Spawn **one subagent per in-progress node**, in parallel. Each prompt must include:
   - node id, name, files, ordered parts, done-when
   - the spec path and the relevant spec facts
   - confirmed readers and tone (if that node writes docs)
   - **Load these skills and follow them:** `typescript-standards`, `test-hygiene`, `reuse-first`, `docs`
   - do not edit paths outside `files`
   - do not re-plan, do not grill, do not re-ask persona or tone
6. When a node’s `done when` is green: set `done`. Update the JSON. Redraw the DAG in chat.
7. If `done when` is red or the subagent errors: keep other in-progress nodes running. Load `fix-bug` for that node (driver or a subagent with the same file list). Do not start the next layer until every node in this layer is `done`, or the user stops the run.
8. Repeat from step 3 until every node is `done`.
9. Procedure 8.

### Procedure 8: Optional prove-it

1. Ask once: load `prove-it`, or skip. Default **skip**.
2. Wait.
3. If skip: say the feature is **not proved** as a user path. Procedure 9.
4. If they pick it, or already asked to prove in this conversation: load `prove-it` and follow it. Then Procedure 9.

### Procedure 9: Stop

Stop. Do not start unrelated work.

## Decision Tree

- Failure already in play → Procedure 1 (stop, `fix-bug`).
- `/build-feature` or implement a feature → Procedure 2 → … → 9.
- Design already settled → skip `grill-me` (Procedure 2 step 1).
- Readers already confirmed → skip persona wait.
- Spec already approved in this conversation → skip plan-1 wait.
- No docs pages in the DAG → skip tone.
- Layer has 2+ ready nodes → parallel (Hard gate 5).
- Node red → `fix-bug`; rest of layer continues.
- All nodes `done` → Procedure 8.

## Red Flags

| Signal | What it means | Do instead |
|---|---|---|
| Coding during grill or before plan-2 approval | Skipped the blocks | Hard gates 1–2. |
| Superpowers `brainstorming` questions | Second interview | `grill-me` only. |
| Committing the spec or plan file | Generated artifact in git | Hard gate 4. |
| One node, then review, then the next | Sequential dispatcher | Hard gate 5. Parallel layer. |
| Classic `writing-plans` full source in steps | Wrong grain | Procedure 6. Nodes, no source dump. |
| Worker without `docs` / `typescript-standards` | Quality gate dropped | Hard gate 6. Put the four skills in the prompt. |
| Worker asks personas again | Double docs gate | Pass the confirmed list. |
| Loading `prove-it` before the end | Unasked proof | Procedure 8. |
| Next layer while a node is still `in-progress` | Broke the DAG | Procedure 7 step 7. |
| Skipping `reuse-first` before `lego-plan` | DAG invents existing helpers | Procedure 5 step 2. |
| Running this on “fix this failing test” | Wrong skill | Procedure 1. |

## Error Handling

- **`grill-me` missing:** interview in the same shape (one question at a time, recommended option first). Say the skill file was not found.
- **`writing-plans` missing:** still write plan 2 at the Superpowers plan path with the node contract. Say the skill file was not found.
- **`docs` missing:** stop. Do not skip docs. Tell the user.
- **Cannot spawn parallel subagents:** run the ready layer one node at a time. Say that in chat. Keep the same prompts and skills.
- **User rejects spec or plan:** edit, open, wait. Do not start the next procedure.
- **User stops the run mid-layer:** stop dispatch. Leave the live board as it is. Do not mark skipped nodes `done`.
- **`prove-it` missing:** say so. Offer skip. Do not invent a second prove procedure.
- **They pick `prove-it`, then skip inside it:** not proved. Procedure 9.
