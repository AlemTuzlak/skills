# typescript-standards

Run `/typescript-standards` when writing or reviewing TypeScript. App or library does not matter. Callers write JavaScript. You hide the types.

## What it does

- **Infers at the call site.** No `<T>` in calls. No overloads. One signature, conditional return if needed.
- **Bans sloppy casts.** No `as any` or `as unknown as X`. `as const` only to stop a literal widening to `string`.
- **Keeps functions extendable.** First arg is the value. Extra flags go in options when a boolean is magic. `add(a, b)` stays two args.
- **Reuses types.** Search this package and neighbors before a new `type` / `interface`.
- **Limits extras.** Custom errors only where callers `instanceof`. No `export *`. Fix this skill’s smells only in the file you opened.

It does not place helpers, and it does not add `debug` flags.

## Usage

```
/typescript-standards
```

Skip test-only files, docs, and CSS.

## Output

Edits in the TypeScript you are already writing. Before/after examples live in `patterns.md`.
