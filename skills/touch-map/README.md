# touch-map

Map what a behavior change must touch before anyone writes an implementation plan or code.

Use this after the feature or fix is chosen. It only maps. A later workflow skill can chain it with planning and build skills.

## What it does

- **Checks intent first.** If you are still deciding what you want, it stops and you grill. It does not map a feature that is not chosen.
- **Reads a domain atlas** at `.agent/domain-map.json` (creates one on first run from packages or top-level source folders). That file is domain grain only: `id`, `owns`, `talksTo`.
- **Zooms into this change.** Names modules, existing functions and types, and the files you must touch. Stops reading when the file list stops changing.
- **Picks one path** when several exist, in this order: reuse what exists, stay in the hit domain(s), no new package/layer/public API, then fewest files.
- **Stops after the map.** The six-section map is the product. It does not load the next skill. It never writes code.

## Usage

```
/touch-map
/touch-map what does adding retry to the fetch client touch
```

Skip it for typos, comments, formatting, lockfile-only, and docs with no code.

## Output

A six-section map in the chat (not a per-task markdown file):

1. Hit domain(s)
2. Parts (modules, functions, types, reuse already seen)
3. How they talk
4. Files to touch
5. Will not touch
6. Path pick

The atlas file updates only when a domain is added, removed, renamed, or a domain link changes. Commit `.agent/domain-map.json` with the repo.
