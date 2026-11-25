# build-feature

Run `/build-feature` (or ask to implement a feature). This skill is the driver for the whole path. It is not a live-bug fixer.

## What it does

- **Grills** with `grill-me` until the design is shared. Skips the grill if this conversation already settled it.
- **Does not stop for approval after the grill.** Plan 1 is a design spec under `docs/superpowers/specs/`. Plan 2 is a Superpowers `writing-plans` file whose tasks are lego **nodes**, plus the DAG. It shows both paths and continues. Neither file is committed. Interrupt it if a plan is wrong.
- **Maps, then reuses, then legos:** `touch-map` → `reuse-first` once → `lego-plan`.
- **Picks the readers and the tone itself.** It shows them in chat and continues. It does not stop to ask. You can change them at any time. Node workers do not re-ask.
- **Implements** each node as soon as its `depends` are `done`. It does not wait for a full layer or for unrelated running nodes. Each subagent must load `typescript-standards`, `test-hygiene`, `reuse-first`, and `docs`.
- **Always paints the live DAG.** The **main agent** paints it in chat after each node change. `done` nodes are green. A "be concise" rule in `AGENTS.md` or `CLAUDE.md` does not remove the paint.
- A red node runs `fix-bug`. Nodes that depend on it wait. All other nodes keep going.
- After every node is `done`, it does not ask about `prove-it`. It runs `prove-it` only if you asked for it.

It does not run Superpowers `brainstorming` questions. It does not use sequential one-task-then-review as the dispatcher.

## Usage

```
/build-feature
implement the order list
build this feature
```

Do not use it when a test is already failing. Use `/fix-bug`.

## Output

A built feature that followed the spec and the DAG. Optional `prove-it` only if you pick it. Spec and plan markdown stay uncommitted.
