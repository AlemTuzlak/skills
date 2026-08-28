# fix-bug

Load when something is actually failing. Do not use it to design a new feature.

## What it does

- Reads the full error, then writes **at least three** hypotheses on the **hot path** (test or user action → stack → error, plus callers and callees).
- Turns on a third-party **debug mode** if that package is in play and has one.
- Logs before and after those paths, **eliminates** from the output, narrows.
- **Deletes the logs** (and debug flags), writes a **failing test**, then fixes the root cause and the same pattern nearby.
- Re-runs that test, then this package / this file’s suite.

No skipped tests, no swallowed errors, no timeout-as-fix.

## Usage

```
/fix-bug
this test is failing
CI is red
fix this
```

## Output

A root-cause fix and a test that was red, then green. No leftover debug logs in the diff.
