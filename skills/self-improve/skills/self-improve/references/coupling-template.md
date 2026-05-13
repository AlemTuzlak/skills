Drafts a structured coupling entry from a user assertion about architectural impact.

## Input contract

You receive the user's assertion message — a statement that describes how a change to one part of the codebase forces work elsewhere. Examples:

- "Whenever you add a new provider adapter you also need to add it to the e2e test matrix and create an example."
- "If you change StreamChunk, every adapter that produces chunks needs updating."
- "Adding a new package means updating the changeset config and the build pipeline."

## Identification steps

Extract two structured pieces:

1. **Trigger pattern.** The file, symbol, or glob whose modification (or creation) requires sibling work. Express as a concise human-readable phrase: `"modifying packages/typescript/ai/src/types.ts (StreamChunk type)"` or `"adding new directory matching packages/typescript/ai-*"`.
2. **Impacts list.** One entry per sibling artifact that must change or be created. Each impact has:
   - `target` — a file path, directory path, or glob pattern. May be a single string or an array of strings.
   - `kind` — exactly one of `change-required` or `new-code-required` (see below).
   - `why` — one sentence explaining the dependency.

## Two impact kinds

- **`change-required`** — modifying the trigger forces existing files at `target` to change. Example: editing `StreamChunk` requires every adapter under `packages/typescript/ai-*/src/adapters/text.ts` to update its chunk handling.
- **`new-code-required`** — creating a new instance of the trigger pattern creates a new gap at `target` that must be filled with new code. Example: adding a new provider directory `packages/typescript/ai-<provider>/` requires a new entry in `testing/e2e/test-matrix.ts`, a new example under `examples/`, and a new devtools provider config.

Use `change-required` when the trigger is a modification to existing code. Use `new-code-required` when the trigger is the introduction of a new package, directory, file, or symbol.

## ID generation

Generate a kebab-case `id` from the trigger's intent (3 to 6 words). Examples: `streamchunk-fanout`, `new-provider-adapter`, `new-package-changeset`. The id must match the regex `^[a-z0-9-]+$`. It identifies the rule in `coupling.json` and in pre-push warnings.

## Output format

Output a single JSON object conforming to `templates/coupling.schema.json`. This object is appended to the `couplings` array in `.agent/self-learning/coupling.json`:

```json
{
  "id": "<kebab-case-id>",
  "trigger": "<human-readable trigger description>",
  "impacts": [
    {
      "target": "<path-or-glob-or-array>",
      "kind": "change-required",
      "why": "<one-sentence justification>"
    },
    {
      "target": ["<path1>", "<path2>"],
      "kind": "new-code-required",
      "why": "<one-sentence justification>"
    }
  ]
}
```

Output the JSON object only, with no surrounding prose or code fences.
