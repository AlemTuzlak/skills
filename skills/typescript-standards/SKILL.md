---
name: typescript-standards
description: Use when writing, reviewing, or architecting TypeScript in app or library code. Don't use for test-only files, docs, CSS, or helper placement (that is a different search).
---

# TypeScript Standards

Public APIs must feel like JavaScript. Callers write JS. You hide the type work. App or library does not change this.

This skill does not decide where a **helper file** lives. It does not add `debug` flags. It does not load other skills.

## When To Use

Load when writing or reviewing TypeScript (`.ts`, `.tsx`). App code and library code both use these rules.

Skip test-only files, docs, and CSS.

## Hard Gates

1. **Call sites never write `<T>`.** If they must, the signature is wrong. Generic **definitions** are fine.
2. **Never write overloads.** One signature. Derive the return with inference and conditional types.
3. **No `as any`, `as unknown as X`, or cast chains.** If you need `as`, the types are usually wrong.
4. **`as const` only to stop widening** (e.g. `"open"` staying `"open"`, not `string`). Not a habit.
5. **Fix this skill’s smells only in the file you already opened.** Do not tour the folder.

## Inference

Design signatures so TypeScript infers from arguments and returned values.

```ts
createStore({ count: 0 })
```

not

```ts
createStore<{ count: number }>({ count: 0 })
```

## Types

- Before a new `type` or `interface`, search the **current package and neighbors**. Use or extend the one that is the same shape. Do not grep the whole monorepo for a one-file type.
- One signature. Conditional types when the return depends on the input. No overload list.

## Functions

- First arg is the required value (URL, input, id).
- Extra flags go in an options object when a lone boolean is unclear (`fn(url, true)`) or when there is more than one extra. `add(a, b)` stays two values.
- Options/setup must still work if pulled into a helper. If extraction breaks types or behavior, fix the signature. Do not extract every options object by default.

## Casts

**Banned:** `as any`, `as unknown as X`, double casts, `(x as any).code`.

**Allowed:**

- `as const` only when a literal widens (string/number/array) and you need the literal type.
- `return x as T` only when TypeScript cannot infer a generic return (e.g. `JSON.parse` into `T`).

## Errors

Custom `Error` subclasses only at a **boundary callers catch** (exported function, SDK, route handler). Internal helpers can `throw new Error(...)`. Document on that boundary what can throw and which class to catch.

## Barrels

No `export *`. Inside the repo, import from the real file. The package public entry (`index.ts` behind `exports`) can re-export **named** symbols only.

## Procedures

### Procedure 1: Before a new type or signature

1. Search the current package and neighbors for an existing type.
2. Write one function signature. Infer from args. No overloads. No call-site `<T>`.
3. If extras are a magic boolean, use an options object.

### Procedure 2: While editing

1. Do not add banned casts. `as const` only for widening.
2. Direct imports. No new `export *`.
3. If this file already has this skill’s smells (`as any`, magic booleans, call-site `<T>`, overloads), fix those in this file.

### Procedure 3: Throws at a catchable boundary

1. If callers are expected to `instanceof` a specific error, use a custom class.
2. If the throw is internal only, `new Error` is enough.

## Decision Tree

- Writing/reviewing `.ts` / `.tsx` → this skill.
- Test file → not this skill.
- New type → Procedure 1 step 1.
- New function → Procedure 1 steps 2-3.
- `as` needed → Casts. If not an allowed case, fix the types.
- Helper **file home** → not this skill.
- `debug` / logger on config → not this skill.

## Red Flags

| Signal | What it means | Do instead |
|---|---|---|
| `fn<Foo>(...)` at the call site | Signature does not infer | Change the definition so args carry the type. |
| `function fn(...): A` plus two more `function fn` | Overloads | One signature, conditional return. |
| `as unknown as X` | Types were abandoned | Fix the types. |
| `"open" as const` on every string | Habit | Use `as const` only when the type is otherwise `string`. |
| `fn(url, true)` | Magic boolean | `fn(url, { retry: true })`. |
| `add({ b: 2 })` for two numbers | Options object overused | `add(a, b)`. |
| `export * from './foo'` | Barrel | Direct import, or named re-export at package entry. |
| Custom class for an internal throw | Extra type | `throw new Error(...)`. |
| Creating `packages/shared` from this skill | Placement | Not this skill. |
| Adding `debug?: boolean` to every config | Old rule | Not this skill. |
| Fixing casts in a file you did not open | Drive-by | Procedure 2 step 3, this file only. |

## Error Handling

- **Generic return cannot infer** (`parse<T>` / `JSON.parse`): `return result as T` is the allowed exception. Do not add `as any` on the way there.
- **No existing type in package/neighbors:** write one. Do not invent a parallel name for the same shape in this change.
- **Conditional type cannot express the return:** still no overloads. Split the function or narrow with a discriminated input.
- **Callers must catch a specific failure:** Procedure 3. Custom class at that boundary.
- **User interrupts that a type home is wrong:** move it in this same change. Update imports in opened files.

See `patterns.md` for before/after code.
