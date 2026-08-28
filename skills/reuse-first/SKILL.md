---
name: reuse-first
description: Use when the agent is about to add a helper, util, type guard, mapper, or small generic function. Use when the same if/guard/snippet already appears in two places the change has opened. Don't use for UI copy, comments, one-off JSX, or for implementing feature behavior that is not a helper.
---

# Reuse First

Search for an existing helper before writing a new one. Prefer import, then extract, then write. Less code wins.

This skill owns the reuse decision and the helper’s home. It does not implement the rest of the feature. It does not load the next skill in a pipeline.

## When To Use

Load when the agent is about to add:

- a helper or util
- a type guard
- a mapper
- a small generic function
- an extract of repeated inline logic (`if (object.isCancelled || object.isRefunded)` in two functions)

Skip UI copy, comments, and one-off JSX that is not a helper.

## Hard Gates

1. **Search before write.** No new helper until Procedure 2 has run.
2. **Prove the search in one line, then act.** Do not wait for approval.
3. **Stop after the reuse decision.** Do not load another skill from this one.
4. **Do not add a new package** for a util unless the user asked.

## Domain vs generic

Decide **before** choosing a file.

1. Does it name or take a **domain type** (`Order`, `Invoice`, `Cart`)? → **domain.** Keep it next to that type (`isCancelledOrder` in `order.ts`).
2. Would it still make sense in an unrelated package with **no** domain imports (`isRecord`, `isDate`, `assertNever`)? → **generic.** Put it in the shared utils home. Do not leave it at the top of a domain file.
3. If unsure → **domain** (keep it local). Generic is the high bar.

Repeated inline logic uses the same two tests. `isCancelledOrRefunded(order)` stays next to `Order`. It does not go to shared `utils.ts`.

## Procedures

### Procedure 1: Name the job

1. State the job in one line (plain-object guard, cancelled-or-refunded check, date parse).
2. This is the search key. Search **behavior**, not only the name the agent wanted to type.

### Procedure 2: Search

Search these areas, in order. Stop when a match is found or the list is done:

1. Current package
2. Neighbor packages
3. Existing `shared` / `utils` / `lib` areas

Do not open the whole monorepo for a 3-line local helper. Do not search only the current file.

### Procedure 3: Act on what you found

Print **one** reuse line, then do the matching step. Do not wait.

**Exact match**

```
reuse: import isRecord from packages/shared/src/isRecord.ts
```

Import and call it. Do not copy it. Do not wrap it to make it nicer. Do not re-export it under a new name in this package.

**Close match (same job, missing a case)**

Prefer **extend** the existing function (option, overload, extra case). Write a new function only when the job is actually different. Do not grow a util into a second product. If the extend would change a **public API**, ask first.

**Repeated inline logic (two or more copies in files this change already opened)**

```
reuse: extracted isCancelledOrRefunded from 2 copies in order.ts
```

Extract one small function. Replace **every copy in the files already opened**. Do not mechanical-replace the rest of the monorepo. Classify domain vs generic, then place with Procedure 4.

**No match**

```
reuse: no match in current package / neighbors / shared. writing isRecord in src/utils.ts
```

Write it. Place it with Procedure 4.

### Procedure 4: Place a new helper

**Generic** (`isRecord`, `isDate`):

1. Find the repo’s existing generic-utils home (`utils.ts`, `lib/utils`, `packages/shared`, or similar).
2. Put the helper there on the **first** write. Domain files must not collect 400 lines of random utils at the top.
3. If no home exists, create the smallest file that matches this repo’s layout (usually `src/utils.ts` or `lib/utils.ts`).
4. Do not add a new package or a new `utils/` tree unless the user asked.

**Domain** (`isCancelledOrder` in `order.ts`):

1. Write it next to that type on the first call site.
2. Move it only if **this change** already has two or more real domain call sites (Procedure 3 already extracted in that case).
3. Do not extract “for later.”

### Procedure 5: Stop

After the import, extract, or write, stop. Do not implement the rest of the feature from this skill.

## Decision Tree

- About to add a helper / guard / mapper / generic util → Procedure 1 → 2 → 3 → 4 → 5.
- Two copies of the same inline `if` / guard in opened files → Procedure 3 extract path.
- UI copy, comments, one-off JSX → this skill does not apply.
- Exact match vs close vs none → Procedure 3.
- Domain vs generic → Domain vs generic section, then Procedure 4.

## Red Flags

| Signal | What it means | Do instead |
|---|---|---|
| Writing `isRecord` in `order.ts` | Generic parked in a domain file | Procedure 4 generic path. |
| Putting `isCancelledOrder` in `utils.ts` | Domain helper in shared | Keep it next to `Order`. |
| Copying an existing helper | Second `isRecord` | Import it. |
| Wrapping an existing helper with a new name | Unasked abstraction | Call the original. |
| "Might be reused later" into shared | Speculative extract | Domain stays local until two real copies. |
| Adding `packages/shared` for one guard | New package nobody asked for | Ask, or use the existing utils home. |
| Replacing similar `if`s repo-wide | Drive-by refactor | Only files this change already opened. |
| No reuse line | Search was skipped | Procedure 3. Print the line first. |
| Loading the next pipeline skill | Leaves compose at the workflow | Procedure 5. Stop. |

## Error Handling

- **Search areas do not exist** (no neighbors, no shared): search the current package. Write the no-match line. Place with Procedure 4.
- **Two helpers do the same job under different names:** import one. Delete or stop using the duplicate in opened files. Do not add a third.
- **Extend would change a public export:** stop and ask. Do not change the public API in silence.
- **Unsure domain vs generic:** keep it domain-local. State that in the reuse line.
- **User interrupts that the home is wrong:** move the helper in this same change. Update the imports in opened files.
