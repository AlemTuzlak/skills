# to-prd

Write a review-ready PRD from finished work, a ticket, a PR, or a short feature note.

A PRD here is the CopilotKit EEP spec: problem and solution from the user's view, a long user-story list, implementation decisions, testing decisions, a manual test plan, and out of scope. The skill grills you first so the document is an agreed spec, not a guess after the fact.

## What it does

- **Uses the EEP template.** The section list lives in `assets/prd-template.md`. That file is the source of truth.
- **Grounds in what already exists.** It reads the current session, the repo, the PR, or the ticket so it does not ask you for facts it can look up.
- **Grills before it writes.** It walks each template heading as a decision. You confirm the shared picture, then it fills the spec.
- **Keeps user stories long.** Every actor and path, including empty, error, and admin cases. Each line is `As an <actor>, I want a <feature>, so that <benefit>`.
- **Keeps implementation decisions stable.** Modules, interfaces, schema, and API contracts. No file paths. A short prototype snippet only when prose cannot hold the decision.
- **Opens the draft.** Writes markdown and opens it in Plannotator. Notion only if you ask.

## Usage

```
/to-prd
/to-prd write a PRD for the work we just finished
/to-prd <GitHub PR or Linear issue URL>
```

Or say:

> Generate a PRD from this work.
> Draft a PRD for the channels isolation fix.

## Output

Markdown with the EEP headings, written to `docs/prds/<slug>.md` unless you pick another path. Title, one line, and both the relative path and the absolute path in chat. The full spec stays in the file.
