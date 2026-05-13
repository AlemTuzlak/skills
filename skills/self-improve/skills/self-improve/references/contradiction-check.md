Detects whether a newly drafted lesson contradicts an existing one at capture time.

## Input

You receive two inputs:

1. The newly drafted lesson (full file content including frontmatter and body).
2. The matching `INDEX.md` content — the global one if the new lesson is `scope: global`, the repo one if `scope: repo`. The index lists each existing lesson by slug and its routing description.

Conflict detection runs against the index first (cheap, no file reads). When a candidate conflict is identified, read the full conflicting lesson file from the lessons directory before classifying.

## Detection categories

Classify any detected conflict into exactly one of these:

- **Direct contradiction.** Same triggering condition, opposite directive. Example: an existing lesson says "always run the full test suite before pushing" and the new draft says "never run the full test suite before pushing — it's too slow, use the affected suite." Mutually exclusive rules covering the same situation.
- **Strong overlap.** Same triggering condition, different (but not opposite) directive. Example: an existing lesson says "format with prettier before commit" and the new draft says "run eslint before commit." Both could coexist but they cover the same trigger and should probably be merged.
- **Soft overlap.** Related triggering conditions, possibly mergeable. Example: an existing lesson about React component testing and a new lesson about hook testing — adjacent concerns that may or may not warrant consolidation.

If no conflict is detected across all existing lessons, the result is no-conflict (`conflict: false`).

## Output

Output a single JSON object:

```json
{
  "conflict": true,
  "conflicting_slugs": ["existing-slug-1", "existing-slug-2"],
  "category": "direct-contradiction",
  "resolution_options": ["keep_new", "keep_old", "merge", "rename_scope"]
}
```

Or, when no conflict is found:

```json
{
  "conflict": false,
  "conflicting_slugs": [],
  "category": null,
  "resolution_options": []
}
```

Field semantics:

- `category` is one of `"direct-contradiction"`, `"strong-overlap"`, `"soft-overlap"`, or `null`.
- `resolution_options` is a subset of `["keep_new", "keep_old", "merge", "rename_scope"]`. Include `"rename_scope"` only when the conflict could be resolved by giving the new lesson a narrower routing condition (e.g. scoping to a specific package).

Output only the JSON object. No prose, no code fences.
