Predicts whether a drafted lesson should be repo-scoped or global.

## Input

You receive the drafted lesson — full file content including frontmatter and body. Inspect the rule, the rationale, and the "How to apply" section together.

## Heuristics

Choose **repo** if any of the following are true:

- The rule references specific package names from the current repo (e.g. `@tanstack/ai-openai`, `@scope/internal-package`).
- The rule references file paths under the repo (e.g. `packages/typescript/ai/src/types.ts`, `testing/e2e/`).
- The rule references repo-specific tooling, scripts, or build commands (e.g. `pnpm test:e2e`, `nx affected`).
- The rule references organization-specific conventions, naming patterns, or internal libraries.

Choose **global** if all of the following are true:

- The rule is a general engineering principle (e.g. "always write the failing test before the fix", "never commit generated artifacts").
- It applies to any project in the same language or technology stack, not just this repo.
- It contains no repo-specific paths, package names, symbols, or tooling references.

## Edge cases

When the rule is borderline — for example, a TypeScript-specific principle that happens to have been articulated in this repo but applies anywhere — lean **repo**. A repo-scoped lesson can be promoted to global later via `/promote --global` once it has demonstrated cross-repo applicability. A prematurely-globalized rule is harder to retract and risks polluting the global pile with rules that turn out to be repo-specific.

## Confidence levels

- **high** — the rule clearly satisfies the criteria for the chosen scope with no ambiguity.
- **medium** — the rule satisfies the criteria but has some characteristics of the other scope.
- **low** — the rule is genuinely borderline; the default-to-repo rule was applied.

## Output

Output a single JSON object:

```json
{
  "scope": "repo",
  "confidence": "high",
  "rationale": "<one sentence citing the specific repo references that drove the decision, or the absence thereof>"
}
```

`scope` is exactly `"repo"` or `"global"`. `confidence` is exactly `"high"`, `"medium"`, or `"low"`. Output only the JSON object. No prose, no code fences.
