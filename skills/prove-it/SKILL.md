---
name: prove-it
description: Use when the user runs /prove-it or says prove it, prove the changes, show me in the browser, or asks to prove a UI or API change. Don't use only because the agent is about to say done, for types-only work, or for docs with no behavior to prove.
---

# Prove It

Prove the change the way a person uses it. Do not claim it works without that proof.

This skill does not auto-load on “done.” The user must ask. It does not load other skills.

## When To Use

Load when the user:

- runs `/prove-it`
- says prove it, prove the changes, show me in the browser, or the same idea (including in the first message)

Skip if they did not ask. Skip types-only, comments, lockfile, docs with no behavior.

## Hard Gates

1. **User asked.** If they did not ask to prove, this skill does not run.
2. **Do not say it works, is done, or is fixed** unless this skill actually proved it. Skip means **not proved**.
3. **A screenshot of one screen is not proof.** Click, type, submit, navigate.
4. **No new package, dependency, example app, or browser runner** unless the user picked that option and said yes.
5. **Stop any server this skill started** before the skill ends. Do not leave `dev` / `preview` running.

## UI vs server

- **UI** (page, component, route, form, visible state): prove in the **browser**.
- **Server / API / library with no screen:** **ask** how to prove. Do not pick in silence.
- **Both:** browser the UI, **and** ask how to prove the server half.

## Procedures

### Procedure 1: Classify

1. List the surfaces: UI, server/API, or both.
2. UI → Procedure 2.
3. Server/API → Procedure 3.
4. Both → Procedure 2, then Procedure 3 for the API.

### Procedure 2: Browser (UI)

1. If the app is not running, start **only** an existing command (`dev`, `preview`, the repo’s documented start). If none exists, say UI cannot be proved. Offer skip, or that the user starts the app.
2. Use it like a user:
   - click, type, submit, navigate
   - every route/page that shares this state
   - empty and error UI if this change has them
   - desktop and a narrow viewport if layout or CSS changed
3. Hunt for breakage, not only the happy path.
4. In chat, say what you did and what you saw. Do not say “looks good” with no steps.
5. Stop the process from step 1 if this skill started it.
6. Procedure 4.

### Procedure 3: Ask (server / API)

1. Stop. Show 2–3 options. Put a reasonable first pick first. Always include **skip**.
   - existing example / playground / demo
   - example app that uses the new API (only if they confirm place + any new package/dep)
   - curl or a small script against a running server
   - skip
2. Wait. Do not build or run until they pick.
3. If **skip:** say **not proved**. Do not say it works. Stop (no Procedure 4).
4. If **existing playground:** run that, then prove in the browser if it has a UI, or show the command output if it is a script.
5. If **example app:** ask where. Prefer an existing example. Do not add a package or dependency unless they said yes. Then run it and prove.
6. If **curl/script:** run it. Quote exit code and the part of the output that proves the claim.
7. Procedure 4.

### Procedure 4: Optional report

1. After a real proof, ask: write a screenshot report? Default **no**.
2. If no: stop. Chat already has the evidence.
3. If yes: write `.agent/scratch/prove-it.md` (overwrite). Gitignore `.agent/scratch/` if missing (same as other scratch files). Include what was clicked and the shots. Open the file. Do not commit it.
4. Skip proof → no report.

### Procedure 5: Stop

After proof or skip, stop. Do not start unrelated work from this skill.

## Decision Tree

- User did not ask to prove → this skill does not apply.
- UI → Procedure 2 → 4 → 5.
- Server/API → Procedure 3 → 4 → 5 (skip ends at 3).
- Both → 2 then 3, then 4 → 5.
- No start command and app not running → say cannot prove UI. Skip or user starts it.
- User says skip → not proved. No success claim.

## Red Flags

| Signal | What it means | Do instead |
|---|---|---|
| Saying done because tests passed | This skill was not asked, or proof was skipped | Only claim proved after Procedure 2 or 3. |
| One screenshot, no clicks | Not a user path | Procedure 2 step 2. |
| Building `examples/foo` before they pick | Unasked app | Procedure 3. Wait. |
| Adding Playwright / a new server | New dependency | Existing start command only. |
| Leaving `pnpm dev` running | Watcher left on | Hard gate 5. |
| "Skip, but it works" | Skip turned into a claim | Say not proved. |
| Report file in `docs/` | Product doc | `.agent/scratch/prove-it.md`. |
| Opening the report when they said no | Unasked file | Procedure 4 default no. |
| Proving only the page for a new public API | Server half skipped in silence | Procedure 3 for the API. |

## Error Handling

- **No browser tools:** say UI cannot be proved here. Offer skip, or that they click while you wait on a URL. Do not fake a screenshot.
- **Start command fails:** quote the error. Do not say the UI works. Offer skip or a fix, then prove again.
- **Proof fails** (click does the wrong thing, curl is not 200): say **not proved**. Name what failed. Do not call it done.
- **They pick example app then refuse a new package:** use curl, an existing example, or skip. Do not add the package anyway.
- **Scratch write fails:** keep the proof in chat. Say the report file was not written.

See nothing else. Chat is the default evidence. The markdown file is optional.
