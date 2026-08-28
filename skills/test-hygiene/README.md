# test-hygiene

Run `/test-hygiene` when writing or changing tests. Pin real behavior. Do not ship a test that stays green after you delete the production logic.

Tautological tests considered harmful.

## What it does

- **Says what to pin.** Observable behavior only: return, throw, UI, real side effect. Critical path plus distinct runtime edges. If types already forbid the input, skip that test.
- **Keeps one home per behavior.** If `fetchOrder` calls `isOrderValid`, cover `isOrderValid` next to `isOrderValid`. Do not replay it five times through `fetchOrder`.
- **Bans tautology and snapshots.** Expected is a literal or small fixture. No `toMatchSnapshot`. Mock I/O only. Do not mock code you wrote.
- **Writes clean test files.** Scan utils first. No `as any`. Top-level imports. Slim `it()` after helpers. Clean the file you touch.
- **Does not force tests first.** The pin must still fail if the production logic is gone.

## Usage

```
/test-hygiene
/test-hygiene write tests for fetchOrder
```

Load when working near test files, or when a plan node needs a `done when` check.

## Output

Tests in the repo, not a separate doc:

1. Recon (utils, collaborator tests, casts in the file)
2. Pins for the critical path and distinct edges
3. Cleanup of violations in the same file
