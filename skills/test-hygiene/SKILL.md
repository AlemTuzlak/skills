---
name: test-hygiene
description: Use when writing, modifying, or working near test code, when tests look tautological or snapshot-based, when adding a done-when check, or when covering error paths. Don't use for production-only edits with no tests, docs, or UI copy.
---

# Test Hygiene

Tautological tests considered harmful

This skill owns **what** a test pins and **how** the test file is written. It replaces any older `test-hygiene` copy.

<HARD-GATE>
Tautological tests considered harmful

A test is tautological if it still passes after you delete the production logic. Do not ship that test. Expected must be an independent value (literal or small fixture), not the implementation talking to itself.
</HARD-GATE>

## When To Use

Load when writing or changing tests, when working near a test file, or when a plan node needs a `done when` check.

Skip production-only edits with no tests, docs, and UI copy.

This skill does not force tests first. The pin must still fail if the production logic is gone.

## What to pin

Pin **observable behavior** only: return value, thrown error, rendered UI, or a real side effect (HTTP, DB, file).

Do not pin private helpers, internal call order, or framework wiring.

**Critical path:** the user-visible success path for this change, plus runtime failures that can still happen (empty list, network error, missing field from an API).

**How many:** one happy critical path, plus **one test per distinct runtime edge**. Stop when a new test does not fail for a different reason.

**Types already forbid it:** do not test “wrong input fails.” TypeScript blocked that call. Do not invent cases that cannot happen.

**Collaborators:** if `fetchOrder` calls `isOrderValid`, read `isOrderValid` tests first. `fetchOrder` tests pin `fetchOrder` branches only. Do not replay `isOrderValid` cases through `fetchOrder` unless that path is critical to success. Do not write the same behavior in five files.

If `isOrderValid` has no tests, write them next to `isOrderValid` first. Then keep `fetchOrder` tests on `fetchOrder` branches.

## How to assert

- Derive **expected** from the rule or spec, as a literal or small fixture. Then run the code. Then compare.
- **Banned:** `toMatchSnapshot`, `toMatchInlineSnapshot`, and any snapshot as the expected value.
- **Banned:** `expect(fn(x)).toBe(fn(x))`, copying the production formula into expected, `expect(obj.name).toBe(obj.name)`.
- **Banned:** a mock-only test that only proves the test called its own mock with the args it passed in, and still passes if the unit is deleted.
- **Mocks:** I/O at the boundary only (HTTP, DB, clock, filesystem). Do not mock the unit under test. Do not mock code **you wrote**.

```typescript
// BAD: expected is the formula under test
expect(discount(100, "gold")).toBe(100 * 0.75);

// BAD: still green if fetchOrder is empty; the mock was the test
await fetchOrder("1");
expect(http.get).toHaveBeenCalledWith("/orders/1");

// GOOD: independent expected; mock is the network only
http.get.mockResolvedValue({ id: "1", status: "open" });
expect(await fetchOrder("1")).toEqual({ id: "1", status: "open" });
```

## Phase 1: Reconnaissance (Before Writing)

<HARD-GATE>
Do not start writing `it()` or `describe()` blocks until reconnaissance is done. "I already know what is there" is not valid. Scan every time.
</HARD-GATE>

1. Search the current package (and neighbors) for `test-utils`, `test-helpers`, `setup`, `__mocks__/`, factories, fixtures.
2. If `A` calls `B`, read **B’s tests**. Do not duplicate B’s matrix in A.
3. If modifying a test file, list casts, duplicated setup, and dynamic imports for cleanup.
4. Decide helpers: existing util, file-local if only this file needs it, shared test-utils if another file in this package wants it.

## Phase 2: Enforcement (During and After Writing)

All rules below apply to **new** test code and to **existing** code in the same file. Preserve test semantics when cleaning up. Only change how they are written, not what they verify. Do not touch unrelated test files.

### Rule 1: Reusable utilities over duplication

Same setup, assertion, or mock pattern in 2+ tests → extract a helper. Each `it()` is slim after setup. Parameterize. If you extract a helper, use it everywhere in this file.

```typescript
// BAD: same three lines in every test
it("returns the open order", async () => {
  http.get.mockResolvedValue({ id: "1", status: "open" });
  const order = await fetchOrder("1");
  expect(order.status).toBe("open");
});

// GOOD
async function fetchOrderWith(body: Order) {
  http.get.mockResolvedValue(body);
  return fetchOrder(body.id);
}
it("returns the open order", async () => {
  const order = await fetchOrderWith({ id: "1", status: "open" });
  expect(order).toEqual({ id: "1", status: "open" });
});
```

### Rule 2: No type casts and no lazy types

**Banned:** `as any`, `as unknown as X`, double casts.

If a mock does not match the interface, build a typed factory. Writing a factory is cheap.

**Only exception:** TypeScript has a real limitation that cannot be worked around. Then add a comment that says why. `as const` is allowed. It narrows, it does not widen.

**Banned:** `Record<string, unknown>` as a lazy stand-in. Use the real type.

**Banned:** generic cast helpers like `field<T>(obj, key): T`.

Prefer `as const` on test data. Prefer inferred return types on factories.

```typescript
// BAD
const order = { id: "1", status: "open" } as any;

// GOOD
function createOrder(overrides?: Partial<Order>): Order {
  return { id: "1", status: "open", ...overrides };
}
```

### Rule 3: No dynamic or conditional imports in test bodies

All imports at module scope.

**Banned:** `await import(...)` inside `describe`, `it`, `beforeAll`, `beforeEach`, `afterAll`, `afterEach`.

For vitest mocks that need a re-import after `vi.mock()`, use `vi.hoisted()` and top-level `await import()`, not inside tests.

```typescript
// BAD
it("throws when missing", async () => {
  const { OrderNotFoundError } = await import("./order");
});

// GOOD
import { OrderNotFoundError } from "./order";
```

### Rule 4: Meaningful error path coverage

Read the code under test. Test guards, early returns, throws, and runtime edges that can still happen.

Do not manufacture cases the types or existing guards already make impossible.

One test per distinct failure behavior. Do not write 20 tests for one guard with slightly different inputs.

If the code has no handling for a scenario that must fail in a controlled way, flag it. Do not test undefined behavior.

### Rule 5: Cleanup existing violations in the same file

When touching a test file, fix Rules 1-4 and the tautology gate in that file. Preserve what the tests verify. Do not edit unrelated test files.

## Decision Tree

- About to write or change tests, or a `done when` check → Phase 1, then What to pin, then Phase 2.
- If this test still passes after the production function is empty → tautological. Rewrite or delete.
- Types already forbid the input → do not write that test.
- A calls B, B already has tests → A pins A’s branches only.
- A calls B, B has no tests → write B’s tests next to B first.
- Need a stand-in for HTTP/DB/clock/files → mock that boundary. Do not mock our modules.
- Snapshot looks convenient → ban. Use a literal.

## Red Flags

| Signal | What it means | Do instead |
|---|---|---|
| Test still green after deleting the function body | Tautological | Independent expected. Pin observable behavior. |
| `toMatchSnapshot` / inline snapshot | Expected is whatever the code did | Literal or fixture. |
| `expect(http.get).toHaveBeenCalledWith` as the only pin | Mock was the test | Assert the return or the real side effect. |
| `as any` / `as unknown as X` | Types were abandoned | Typed factory. |
| `await import` inside `it()` | Hidden load | Top-level import. |
| Five `fetchOrder` tests that only vary `isOrderValid` cases | Same behavior in two homes | Tests live next to `isOrderValid`. |
| Testing `fetchOrder("nope")` when the arg is `OrderId` | Types already forbid it | Skip. |
| Twenty tests, one guard | Coverage theater | One test per distinct fail reason. |
| Mocking `isOrderValid` from `fetchOrder` tests | Mocked our code | Use the real function. Cover `isOrderValid` in its file. |
| "Tests first is required here" | Wrong skill | This skill does not force red-green. The pin must still be able to fail. |

## Rationalization table

| Excuse | Reality |
|---|---|
| "The snapshot is easier" | Snapshots are banned. Write a literal. |
| "CalledWith proves it hit the API" | That stays green if `fetchOrder` does nothing else. Pin the result. |
| "Expected is 2 + 3 so the mapping is clear" | That copies the formula. Put `5`. |
| "The cast is just for tests" | Tests that lie about types hide bugs. Fix the mock. |
| "It is faster to copy-paste" | Extract a helper. |
| "The dynamic import is needed for mocking" | `vi.hoisted()` and top-level import. |
| "These existing tests are not my problem" | You are in the file. Leave it better. |
| "I will only test the happy path" | Add the runtime edges that can still happen. |
| "Wrong string input should throw" | If the type is `OrderId`, that call does not compile. No test. |
| "I will cover `isOrderValid` through `fetchOrder`" | One behavior, one home. |
| "`Record<string, unknown>` is fine for test data" | Use the real type. |
| "I will clean up later" | Later means never. Clean up now. |

## Error Handling

- **No test-utils in the package:** write a file-local helper. Extract to shared test-utils on the second file that needs it.
- **Cannot name an independent expected value:** the behavior is not pinned yet. Stop. Name the observable result in one line, then write the test.
- **B has no tests and A is in progress:** write B’s tests first in this same change, then A’s.
- **Clock or time in the unit:** mock the clock boundary, not the unit.
- **UI with no return value:** pin rendered output or a real side effect. Do not pin internal setState calls.
