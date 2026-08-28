---
name: fix-bug
description: Use when a bug is in play: a test fails, CI is red, an API returns the wrong result, a stack trace appears, or the user says it is broken or fix this. Don't use for a new feature with no failure, for types-only work, or for docs.
---

# Fix Bug

Find the root cause. Do not patch a symptom. App or library does not change this.

This skill loads `prove-it` only after a green fix, and only if the user picks it or already asked to prove. It does not overwrite CopilotKit debug skills.

## When To Use

Load when a failure is in play: failing test, red CI, unexpected result, stack trace, or the user says it is broken / fix this.

Skip greenfield features with no failure. Skip docs and types-only edits.

## Hard Gates

1. **No fix until the cause is pinned from logs.** No “try a few things.”
2. **At least three hypotheses** on the **hot path**, different places (our function, caller, dependency).
3. **Debug logs** before and after every hypothesized path. If a third-party package in play has a **debug mode**, turn it on for this hunt.
4. **When the cause is pinned: delete every log this skill added, and turn third-party debug off.** Then write the failing test. Then fix. Logs must not land in the fix.
5. **Do not skip, delete, or disable the failing test** to go green. Do not swallow the error (`|| true`, empty catch). Do not raise a timeout to hide a race.
6. **Fix the root cause**, plus the same pattern in that file / nearby module. No extra refactor.
7. **Do not load `prove-it` unless the user picks it, or already asked to prove this fix.** A green suite is not proof. Default is skip.

## Hot path

From the failing test (or the user action) down the stack to the error line, plus the functions that call and are called there.

Start there. **Eliminate.** Narrow. Widen only if every hypothesis on that path is dead.

## Procedures

### Procedure 1: Read

1. Read the full error, stack, or CI log. Every line.
2. Read the failing test body if there is one.
3. Read the diff that likely introduced it, if one exists.
4. Do not edit yet.

### Procedure 2: Hypotheses

1. Map the hot path (files and functions).
2. Write **at least three** hypotheses: “The error is caused by X because Y.” They must span the hot path (not three guesses at one line).
3. If you cannot write three, you have not read enough. Return to Procedure 1.

### Procedure 3: Instrument

1. For each third-party package named in a hypothesis: check its docs for a debug flag or env. If it exists, turn it on.
2. Add temporary logs **before and after** each hypothesized branch (input in, output out). Use the repo’s existing logger or `console`. Do not add a logging package.
3. Reproduce once. Read the logs. **Cross off** hypotheses the logs kill.
4. If all three are dead, widen the hot path one step (the next caller or the next dependency). New hypotheses. New logs. Eliminate again.
5. When one cause is pinned: **delete all logs this skill added.** Turn third-party debug **off**. Confirm the working tree has none of those logs left.

### Procedure 4: Failing test, then fix

1. Write a test that fails **because of this bug** (red). Independent expected value. Do not skip this step.
2. Run it. It must fail for the reason you named.
3. Fix only the root cause. Also fix copies of the same mistake in that file / nearby module.
4. Run that test (green). Then run the existing tests for this package / this file’s suite.
5. If a new failure appears, treat it as a new bug. Start at Procedure 1. Do not ship the first fix on top of a new break.

### Procedure 5: Optional prove-it

1. After the suite for this package is green and logs are gone, **ask once**. Options: load `prove-it`, or skip. Default **skip**.
2. Wait. Do not load `prove-it` until they pick.
3. If they already asked to prove this fix in this conversation, skip the ask. Load `prove-it`.
4. If **skip:** say the fix is **not proved** as a user path. Do not treat the green suite as proof. Procedure 6.
5. If they pick `prove-it`: load `prove-it` and follow it. Then Procedure 6.
6. Do not click through the app, curl the API, or write a proof report inside this skill. That work belongs to `prove-it`.

### Procedure 6: Stop

After skip, or after `prove-it` returns, stop.

## Decision Tree

- Failure in play → Procedure 1 → 2 → 3 → 4 → 5 → 6.
- Cannot reproduce → stop. Say not reproduced. Ask for steps. Do not guess-fix.
- Logs kill every hot-path hypothesis → widen, Procedure 2 again.
- Test still red after the fix → wrong cause. Revert the fix. Back to Procedure 2.
- Same pattern in the next function → fix it in this same change (Hard gate 6).
- Suite green, no prove ask yet → Procedure 5 (ask, default skip).
- User already asked to prove this fix → load `prove-it`, then Procedure 6.

## Red Flags

| Signal | What it means | Do instead |
|---|---|---|
| One hypothesis, then a patch | Guess | Procedure 2. Three on the hot path. |
| Fix with no logs | No elimination | Procedure 3. |
| Debug `console.log` still in the diff | Logs not nuked | Procedure 3 step 5. Then the test. |
| Third-party `DEBUG=*` left on | Hunt flag shipped | Turn it off with the logs. |
| `.skip` / delete the failing test | Symptom | Fix the code. |
| `\|\| true` / empty catch | Swallow | Explain or fix the cause. |
| Longer timeout | Hidden race | Fix the race. |
| Refactor while fixing | Drive-by | Root cause + same pattern only. |
| Whole-monorepo test run | Unasked | This package / this suite. |
| “Works on my machine” | Different env | Same command / same conditions as the failure. |
| Loading `prove-it` with no ask | Unasked proof | Procedure 5. Default skip. |
| Mini browser pass inside this skill | Duplicate of `prove-it` | Load `prove-it` after they pick it. |
| “Tests passed, so it is proved” | Green suite treated as proof | Procedure 5. Skip means not proved. |

## Error Handling

- **Not reproduced:** say so. List what you ran. Do not invent a fix.
- **No debug mode on the dependency:** skip that step. Still log our code on the hot path.
- **Logs are huge:** log only the hypothesized branches, not every line in the file.
- **Failing test cannot be written yet** (no harness): a one-file script that asserts the bug is the stand-in. Still red, then fix, then green.
- **Fix makes a different test fail:** Procedure 1 on that failure. Do not push the first fix until the cascade is resolved.
- **`prove-it` is missing on this agent:** say so. Offer skip. Do not invent a second prove procedure here.
- **They pick `prove-it`, then skip inside it:** the fix is not proved. Procedure 6.

This skill does not place helpers or write docs. Proof is Procedure 5 only.
