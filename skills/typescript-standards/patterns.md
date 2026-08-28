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
): Promise<LoadResult<T>> {
  /* ... */
}
```

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

// GOOD: generic return TS cannot infer
function parse<T>(input: string): T {
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

export async function fetchOrder(id: string): Promise<Order> {
  const row = await db.find(id)
  if (!row) throw new OrderNotFoundError(id)
  return row
}

// GOOD: internal helper
function requireId(id: string | undefined): string {
  if (!id) throw new Error("id is required")
  return id
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
