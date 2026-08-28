# prove-it

Run `/prove-it` or say “prove the changes.” This skill does not run only because the agent wants to say done.

## What it does

- **UI:** uses the app like a person (click, type, navigate, related routes, empty/error if this change has them). Layout changes get desktop and a narrow viewport. One screenshot is not proof.
- **Server / API:** stops and asks how you want it proved (existing playground, example app, curl, or skip). Does not add a package or example until you say yes.
- **Both:** browser the UI, and ask for the server half.
- **Skip** means not proved. The agent must not say it works.
- **Optional report:** after a real proof, asks. Default no. If yes, `.agent/scratch/prove-it.md` (gitignored, opened, not committed).

Starts an existing `dev` / `preview` only if needed, then stops it.

## Usage

```
/prove-it
prove the changes
show me in the browser
```

## Output

Chat: what was tried and what happened.

Optional file: `.agent/scratch/prove-it.md` with screenshots, only if you ask after the proof.
