# lego-plan

Turn a settled change into a layered DAG from simple primitives to a working feature. Plan only. Then stop.

Same idea as a pyramid: independent blocks at the bottom (a driver can run them in parallel), composed blocks above, one finish node. A later workflow can redraw this graph and mark node ids done.

## What it does

- **Refuses to stack** if what to build is still open. Ask first.
- **Splits two grains.** Graph **nodes** are primitives a subagent can own (`write fetchOrder`, `write OrderCard`, `wire fetchOrder`). **Parts** inside a node are the functions that must compile together. Parts stay in order on one subagent. Do not fan them out.
- **Layers from deps.** No `depends on` → layer 0 (parallel). No cycles.
- **Each node lists:** id, name, depends on, files, ordered parts, done when (a test or command to run before the next layer).
- **Always draws Mermaid** whose node ids match the plan ids, so a later driver can clone the graph and mark progress.

It does not write code, write tests, dispatch subagents, or load other skills.

## Usage

```
/lego-plan
/lego-plan stack the order fetch feature
```

If a files-to-touch list is already in the chat, it uses that. Skip typos, comments, formatting, and docs-only work.

## Output

Chat only (no plan file unless you ask):

1. Layers
2. Nodes (the six fields)
3. Mermaid `flowchart` with the same ids, all pending
