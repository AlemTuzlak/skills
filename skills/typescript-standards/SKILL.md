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
5. **Do not annotate function return types.** Let TypeScript infer. Do not write `: Foo` after `)`.
6. **If the function cannot work without a value, that value is required.** Do not take `T | undefined` and return early. Do not accept the property.
7. **Pipe types through callers.** If `A` needs `B`, `C` that calls `A` takes `B`. Do not take a looser type in `C` and cast inside `C`.
8. **Fix this skill’s smells only in the file you already opened.** Do not tour the folder.

## Inference

Design signatures so TypeScript infers from arguments and returned values.

```ts
createStore({ count: 0 })
```

not

```ts
createStore<{ count: number }>({ count: 0 })
```

Do not write the return type on the function. Infer it from `return`.

## Types

- Before a new `type` or `interface`, search the **current package and neighbors**. Use or extend the one that is the same shape. Do not grep the whole monorepo for a one-file type.
- One signature. Conditional types when the return depends on the input. No overload list.
- Constrain with **types**, not with runtime `typeof` / extra unions. `function f(b: string)` not `function f(b: string | undefined) { if (typeof b === "string") ... }`.
- Arrays stay constrained. `arr.map(a => ...)` infers `a`. Do not write `arr.map((a: Foo): Bar => ...)`.
- `filter` / narrow with a type predicate: `(value): value is X`. Do not leave the array as a loose union after a filter that is meant to narrow.
- Do not loosen types “just in case.” If the code cannot run without a field, that field is required on the argument.

## Functions

- First arg is the required value (URL, input, id).
- Extra flags go in an options object when a lone boolean is unclear (`fn(url, true)`) or when there is more than one extra. `add(a, b)` stays two values.
- Options/setup must still work if pulled into a helper. If extraction breaks types or behavior, fix the signature. Do not extract every options object by default.
- Return **the type the caller needs**, including nullish. If the next function wants `X | null`, return `X | null`. Do not return `X | undefined` and then `x ?? null`. Pick `null` or `undefined` for that path and keep it.
- Name complex conditions:

```ts
const isOpenGold = order.status === "open" && order.tier === "gold"
if (isOpenGold) { /* ... */ }
```

Do not dump a long `&&` / `||` chain into `if (...)`.
- **Early return** to narrow. Prefer an early `if` over nested `else`. For several missing values, one `if` with `||`:

```ts
if (a === null || a === undefined || b === null) return
```

Then use `a` and `b` as defined. Do not write `if (a !== null || a !== undefined)` (that check is always true).
- **Three or more** branches on the same value: exhaustive `switch`. Use a `never` default (or no default with a union the compiler checks). Do not write a ladder of `if` / `else if`.
- **Loops:** assign the list first, then iterate.

```ts
const values = getValues(input)
for (const value of values) { /* ... */ }
```

Do not call `getValues` in the `for` header.
- **Spreads stay flat.** `{ ...a, b: { ...c } }`. Do not convert fields in the spread (`c.x === undefined ? null : c`). If every call site converts format A to format B, the data model failed. Convert **once** at a boundary, or change the types so both sides match.
- **Public** functions (package entry, exported SDK, what users call) get **TSDoc**: what it does, the arguments, how to call it. Do not annotate the return type in the signature. You can describe the result in the comment.

## Casts

**Banned:** `as any`, `as unknown as X`, double casts, `(x as any).code`.

**Allowed:**

- `as const` only when a literal widens (string/number/array) and you need the literal type.
- `return x as T` only when TypeScript cannot infer a generic return (e.g. `JSON.parse` into `T`). Still do not write `: T` on the function.

## Errors

Custom `Error` subclasses only at a **boundary callers catch** (exported function, SDK, route handler). Internal helpers can `throw new Error(...)`. Document on that boundary (TSDoc) what can throw and which class to catch.

## Barrels

No `export *`. Inside the repo, import from the real file. The package public entry (`index.ts` behind `exports`) can re-export **named** symbols only.

## Procedures

### Procedure 1: Before a new type or signature

1. Search the current package and neighbors for an existing type.
2. Write one function signature. Infer from args and from `return`. No overloads. No call-site `<T>`. No return annotation.
3. If the body cannot run without a field, that field is required. Do not take it as optional.
4. If this function calls another that needs type `B`, this function takes `B`.
5. If extras are a magic boolean, use an options object.
6. If the function is public, write TSDoc (what, args, how to use).

### Procedure 2: While editing

1. Do not add banned casts. `as const` only for widening. Do not add return type annotations.
2. Name long conditions. Early-return to narrow. Switch when there are 3+ branches on one value.
3. Assign loop lists before `for`. Keep spreads simple. Match `null` vs `undefined` to the caller.
4. Direct imports. No new `export *`.
5. If this file already has this skill’s smells, fix those in this file.

### Procedure 3: Throws at a catchable boundary

1. If callers are expected to `instanceof` a specific error, use a custom class.
2. If the throw is internal only, `new Error` is enough.

## Decision Tree

- Writing/reviewing `.ts` / `.tsx` → this skill.
- Test file → not this skill.
- New type → Procedure 1 step 1.
- New function → Procedure 1.
- Optional arg plus `typeof` / early return because it is missing → Hard gate 6. Make it required, or do not take it.
- `as` needed → Casts. If not an allowed case, fix the types.
- Helper **file home** → not this skill.
- `debug` / logger on config → not this skill.

## Red Flags

| Signal | What it means | Do instead |
|---|---|---|
| `fn<Foo>(...)` at the call site | Signature does not infer | Change the definition so args carry the type. |
| `function fn(...): A` plus two more `function fn` | Overloads | One signature, conditional return. |
| `function fn(): Order` | Return type annotated | Drop `: Order`. Infer from `return`. |
| `as unknown as X` inside a wrapper to call `A` | Types not piped | The wrapper takes the same type `A` takes. |
| `as unknown as X` | Types were abandoned | Fix the types. |
| `"open" as const` on every string | Habit | Use `as const` only when the type is otherwise `string`. |
| `fn(url, true)` | Magic boolean | `fn(url, { retry: true })`. |
| `add({ b: 2 })` for two numbers | Options object overused | `add(a, b)`. |
| `if (a.x === "a" && a.y === 2 \|\| z)` | Unnamed condition | `const isReady = ...` then `if (isReady)`. |
| `b: string \| undefined` then `typeof b === "string"` | Runtime used as a type | `b: string`. |
| `id?: string` then `if (!id) return` because the body needs `id` | Optional that cannot be optional | Required `id: string`. |
| `return x ?? null` after `X \| undefined` | Nullish mismatch | Return `X \| null` from the start (or `undefined` if that is the contract). |
| `for (const x of getValues(a))` | Work hidden in the header | `const values = getValues(a)` then `for`. |
| `arr.map((a: Foo): Bar =>` | Types forced on the callback | Constrain `arr`. Let `a` infer. |
| `filter` that still leaves `T \| undefined` | No predicate | `function isDefined<T>(v: T \| undefined): v is T`. |
| Spread with `=== undefined ? null` inside | Conversion in the spread | Spread as-is, or one mapper at a boundary. |
| Three `if (status ===` in a row | Missing exhaustive switch | `switch (status)` over the union. |
| `export * from './foo'` | Barrel | Direct import, or named re-export at package entry. |
| Public export with no TSDoc | Users cannot read the contract | What it does, args, how to call it. |
| Custom class for an internal throw | Extra type | `throw new Error(...)`. |
| Creating `packages/shared` from this skill | Placement | Not this skill. |
| Adding `debug?: boolean` to every config | Old rule | Not this skill. |
| Fixing casts in a file you did not open | Drive-by | Procedure 2, this file only. |

## Error Handling

- **Generic return cannot infer** (`parse<T>` / `JSON.parse`): `return result as T` is the allowed exception. Do not write `: T` on the function. Do not add `as any` on the way there.
- **No existing type in package/neighbors:** write one. Do not invent a parallel name for the same shape in this change.
- **Conditional type cannot express the return:** still no overloads. Split the function or narrow with a discriminated input. Still no return annotation.
- **Callers must catch a specific failure:** Procedure 3. Custom class at that boundary. TSDoc names the class.
- **Downstream wants `null`, this function returns `undefined`:** change this function’s return. Do not patch with `??` at every call site.
- **User interrupts that a type home is wrong:** move it in this same change. Update imports in opened files.

See `patterns.md` for before/after code.
