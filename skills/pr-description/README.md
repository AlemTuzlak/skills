# pr-description

Write the GitHub pull request title and body from the diff, then post them.

The skill runs on demand (`/pr-description`) and on its own: right before `gh pr create`, and again after an agent `git push` on a branch that already has a PR.

## What it does

- **Posts immediately.** It does not wait for you to approve the text.
- **Matches this repo's titles.** Reads recent PR titles and follows that shape.
- **Opens with 1 to 4 sentences.** A feature says what the PR does. A bugfix says what the bug is and how this PR fixes it.
- **Fills the repo template**, then adds Testing, Screenshots (when the PR has UI), Linked issues, Risk / rollback, and Public API change when the published surface moved.
- **Public API before/after is caller usage**, not the internal diff. The heading is omitted when nothing public changed.
- **Tries browser screenshots on UI PRs.** It opens the changed screen, saves PNGs on the branch, and embeds them in the body. If capture fails, it still posts and says why. This is a try, not a gate.
- **Splits by kind.** A feature cannot post until the branch has a test, a runnable command, or an example-app change. A bugfix does not refuse. Chore and docs PRs do not refuse. A screenshot does not replace that gate.
- **Writes through `simple-english` and `i-have-adhd`.** If either skill is missing, it stops.
- **Rewrites on every agent push.** A human `git push` in another terminal does not trigger it. There is no git hook.

## Usage

```
/pr-description
```

Or just open a PR. The agent must load this skill before `gh pr create`.

## Output

A GitHub PR title and body, posted with `gh pr create` or `gh pr edit`.

## Companion skills

- `simple-english` (required at write time)
- `i-have-adhd` (required at write time)
