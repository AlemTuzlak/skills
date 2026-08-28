# lego-plan

Run `/lego-plan` after the change is chosen. The skill prints a layered DAG and stops.

Plan only. Independent blocks at the bottom (a driver can run them in parallel), composed blocks above, one finish node. A later driver can redraw this graph and mark node ids done.

## What it does

- **Refuses to stack** if what to build is still open. Ask first.
- **Splits two grains.** Graph **nodes** are primitives a subagent can own (`write fetchOrder`, `write OrderCard`, `wire fetchOrder`). **Parts** inside a node are the functions that must compile together. Parts stay in order on one subagent. Do not fan them out. Last part is write or extend the node test.
- **Layers from deps.** No `depends on` means layer 0 (parallel). Nodes that create or edit the same file cannot share a layer. No cycles.
- **Each node lists:** id, name, depends on, files, ordered parts, done when, `status: pending`.
- **Always emits the full contract,** even for one node: layers, Mermaid (same ids, no colors), a JSON fence, and `.agent/scratch/lego-plan.json` for agents. A new plan overwrites that file. The file is not opened for you.

It does not write code, write tests, dispatch subagents, or load other skills.

## Usage

```
/lego-plan
/lego-plan stack the order fetch feature
```

If a files-to-touch list is already in the chat, it uses that. Skip typos, comments, formatting, and docs-only work.

## Output

Chat, in this order:

1. Layers
2. Nodes (the seven fields)
3. Mermaid `flowchart` with the same ids, all pending
4. JSON fence (same object as the live board)

Agents also get `<repo>/.agent/scratch/lego-plan.json` (gitignored). Chat is what you read. The file is what a later driver updates.
