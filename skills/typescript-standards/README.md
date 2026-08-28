# typescript-standards

Run `/typescript-standards` when writing or reviewing TypeScript. App or library does not matter. Callers write JavaScript. You hide the types.

## What it does

- **Infers.** No `<T>` in calls. No overloads. No return-type annotation. Callbacks in `map` infer. `filter` uses `value is X`.
- **Constrains with types.** Required args if the body cannot run without them. Pipe `B` through callers of `A`. Match `null` vs `undefined` to the next function. Named conditions. Early returns. Exhaustive `switch` for 3+ branches.
- **Keeps call sites simple.** Options object for magic booleans. Assign the list, then loop. Flat spreads. Convert shapes once at a boundary, not in every spread.
- **Documents public functions** with TSDoc (what, args, how to call). Custom errors only where callers `instanceof`.
- **Bans sloppy casts and barrels.** Search this package for a type before inventing a second `Order`. Fix this skill’s smells only in the file you opened.

It does not place helpers, and it does not add `debug` flags.

## Usage

```
/typescript-standards
```

Skip test-only files, docs, and CSS.

## Output

Edits in the TypeScript you are already writing. Before/after examples live in `patterns.md`.
