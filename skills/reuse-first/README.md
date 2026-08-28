# reuse-first

Search for an existing helper before writing a new one. Import it, extract repeated logic, or write it in the right home.

Use this whenever you are about to add a util, type guard, mapper, or small generic function. It stops after that decision. It does not implement the rest of the feature.

## What it does

- **Searches by job, not by the name you wanted.** Current package, neighbors, then `shared` / `utils` / `lib`.
- **Exact match:** import and call. No copy, no wrap, no rename-re-export.
- **Close match:** extend the existing function if it is still the same job. Ask first if that would change a public API.
- **Two copies of the same `if` / guard in opened files:** extract one function and replace those copies.
- **Places by kind.** Domain (`isCancelledOrder`) stays next to the type. Generic (`isRecord`, `isDate`) goes to the repo’s utils home on the first write, so domain files do not grow a 400-line util header.

## Usage

```
/reuse-first
```

Or it loads when the agent is about to add a helper. Skip UI copy, comments, and one-off JSX.

## Output

One reuse line, then the import, extract, or write:

```
reuse: import isRecord from packages/shared/src/isRecord.ts
reuse: extracted isCancelledOrRefunded from 2 copies in order.ts
reuse: no match in current package / neighbors / shared. writing isRecord in src/utils.ts
```

Then it stops.
