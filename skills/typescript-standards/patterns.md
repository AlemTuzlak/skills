# TypeScript Standards: patterns

Before/after for each rule in `SKILL.md`.

## 1. Inference at the call site

```ts
// BAD: caller passes a type param
createStore<{ count: number }>({ count: 0 })

// GOOD: inferred from the value
function createStore<TState>(initial: TState): Store<TState> { /* ... */ }
createStore({ count: 0 })
```

If the caller must write `<T>`, the signature is wrong.

## 2. No overloads

```ts
// BAD
function load(id: string): Promise<Order>
function load(id: string, opts: { raw: true }): Promise<string>
function load(id: string, opts?: { raw?: boolean }): Promise<Order | string> {
  /* ... */
}

// GOOD: one signature, conditional return
type LoadResult<T extends { raw?: boolean } | undefined> =
  T extends { raw: true } ? string : Order

function load<T extends { raw?: boolean } | undefined>(
  id: string,
  opts?: T,
) {
  /* ... */
}
```

Do not write `: Promise<LoadResult<T>>` on the function. Infer the return.

## 3. Options object, not magic booleans

```ts
// BAD
connect(url, true, 5000)

// GOOD
connect(url, { retry: true, timeout: 5000 })

// GOOD: two real values, no options object
add(1, 2)
```

## 4. Casts

```ts
// BAD
const data = response as unknown as Order
const value = something as any
;(error as any).code

// BAD: as const as a habit
const label = "Save" as const

// GOOD: as const only to stop widening
const status = "open" as const
// status is "open", not string

// GOOD: generic return TS cannot infer. No `: T` on the function.
function parse<T>(input: string) {
  const result = JSON.parse(input)
  return result as T
}
```

## 5. Search for a type first

```ts
// BAD: second Order in the same package
export type OrderRow = { id: string; status: string }

// GOOD: the package already has Order
import type { Order } from "./order"
```

## 6. Extractability (smell test)

```ts
// BAD: options only type-check inside this one call
createClient(url, {
  headers: buildHeadersFromReactContext(),
})

// GOOD: a helper still type-checks
const options = createClientOptions({ token })
createClient(url, options)
```

Do not extract every options object. If pulling it out breaks, fix the signature.

## 7. Errors at a catchable boundary

```ts
// GOOD: public boundary
export class OrderNotFoundError extends Error {
  constructor(public readonly id: string) {
    super(`Order not found: ${id}`)
    this.name = "OrderNotFoundError"
  }
}

/** Fetch one order by id. Throws OrderNotFoundError if missing. */
export async function fetchOrder(id: string) {
  const row = await db.find(id)
  if (!row) throw new OrderNotFoundError(id)
  return row
}

// GOOD: internal helper. id is required. No optional + early return.
function requireToken(token: string) {
  if (token.length === 0) throw new Error("token is empty")
  return token
}
```

## 8. Barrels

```ts
// BAD: inside the repo
export * from "./deepMerge"
export * from "./order"

// GOOD: package public entry, named only
export { createClient } from "./client"
export type { ClientOptions } from "./types"

// GOOD: inside the repo
import { deepMerge } from "../utils/deepMerge"
```

## 9. Named conditions and early returns

```ts
// BAD
if (order.status === "open" && order.tier === "gold" || user.id === ownerId) {
  /* ... */
}

// GOOD
const isOpenGold = order.status === "open" && order.tier === "gold"
const isOwner = user.id === ownerId
if (isOpenGold || isOwner) {
  /* ... */
}

// BAD: optional that the body cannot run without
function title(user: { name?: string }) {
  if (typeof user.name === "string") return user.name.toUpperCase()
}

// GOOD: required. Types constrain. Early return only for remaining empty string if that is a real runtime case.
function title(user: { name: string }) {
  return user.name.toUpperCase()
}

// GOOD: several missing values, one early if
function area(width: number | null, height: number | null) {
  if (width === null || height === null) return
  return width * height
}
```

## 10. Pipe types. Do not cast in the middle

```ts
function paint(color: Hex) { /* ... */ }

// BAD: C takes string and casts
function themedPaint(raw: string) {
  paint(raw as Hex)
}

// GOOD: C takes Hex too
function themedPaint(color: Hex) {
  paint(color)
}
```

## 11. One nullish. Simple spreads

```ts
// BAD: undefined here, null at the next call
function readName(row: Row) {
  return row.name
}
save({ name: readName(row) ?? null })

// GOOD: return what save wants
function readName(row: Row) {
  return row.name ?? null
}
save({ name: readName(row) })

// BAD: convert inside the spread
const payload = { ...row, nested: { id: nested.id === undefined ? null : nested.id } }

// GOOD: same shape, or one mapper at the boundary
const payload = { ...row, nested: { ...nested } }
```

If every file converts format A to format B, the types failed. Fix the model. Convert once at the edge.

## 12. Assign, then loop. Infer callbacks. Predicates

```ts
// BAD
for (const value of getValues(input)) { /* ... */ }

// GOOD
const values = getValues(input)
for (const value of values) { /* ... */ }

// BAD
ids.map((id: string): Order => load(id))

// GOOD
ids.map((id) => load(id))

// BAD
rows.filter((row) => row.ok)

// GOOD
function isOk(row: Row): row is OkRow {
  return row.ok
}
rows.filter(isOk)
```

## 13. Exhaustive switch (3+ branches)

```ts
// BAD
if (status === "open") { /* ... */ }
else if (status === "closed") { /* ... */ }
else if (status === "pending") { /* ... */ }

// GOOD
function assertNever(value: never): never {
  throw new Error(`unexpected: ${value}`)
}

switch (status) {
  case "open":
    return open()
  case "closed":
    return closed()
  case "pending":
    return pending()
  default:
    assertNever(status)
}
```

## 14. TSDoc on public functions

```ts
/**
 * Load an order by id.
 *
 * @param id - Order id from the URL
 * @returns The order, or `null` if it is missing
 *
 * @example
 * const order = await fetchOrder("ord_1")
 */
export async function fetchOrder(id: string) {
  return db.find(id) ?? null
}
```

No `: Promise<Order | null>` on the signature. The comment can describe the result.

