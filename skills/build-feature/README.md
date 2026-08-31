# build-feature

Run `/build-feature` (or ask to implement a feature). This skill is the driver for the whole path. It is not a live-bug fixer.

## What it does

- **Grills** with `grill-me` until the design is shared. Skips the grill if this conversation already settled it.
- **Blocks twice.** Plan 1 is a design spec under `docs/superpowers/specs/`. Plan 2 is a Superpowers `writing-plans` file whose tasks are lego **nodes**, plus the DAG. Both files are opened. Neither is committed. Silence is not approval.
- **Maps, then reuses, then legos:** `touch-map` → `reuse-first` once → `lego-plan`.
- **`docs` once for readers** (persona gate, then stop). **One tone gate** before any page is written. Node workers do not re-ask.
- **Implements** same-layer nodes in parallel. Each subagent must load `typescript-standards`, `test-hygiene`, `reuse-first`, and `docs`. The **main agent** paints the live DAG in chat after each subagent return. `done` nodes are green.
- A red node runs `fix-bug`. The rest of that layer keeps going. The next layer waits.
- After every node is `done`, **asks once** to load `prove-it`. Skip is the default.

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
