---
name: to-prd
description: Use when the user wants to write, draft, or generate a PRD after finishing work, or from a ticket, a PR, or a feature description. Triggers on /to-prd, "write a PRD", "generate a PRD", "draft a PRD", or "spec this work". Don't use for RFCs, implementation plans, or Team EEP Linear status moves.
---

# To PRD

Turn finished work, or a planned feature, into a review-ready PRD using the CopilotKit EEP spec template.

This skill writes the product spec. It does not start implementation. It does not move Linear tickets.

## Principles

- The template is the source of truth. Read `assets/prd-template.md` in full before asking questions or writing.
- Grill first. Do not fill the template until the user confirms a shared understanding.
- User stories are long and complete. Cover every actor and path, including empty, error, and admin cases.
- Implementation Decisions name modules, interfaces, schema, and API contracts. Do not include file paths or code snippets, except a short prototype snippet that encodes a decision better than prose.
- Problem and Solution are from the user's point of view, not the engineer's.
- Finding facts is the agent's job. Look in the repo, the PR, the ticket, and the current session. Ask the user only for decisions.

## Process

### Phase 1: Ground

1. Read `assets/prd-template.md` in full.
2. Resolve the input: finished work in this session, a PR, a Linear or GitHub ticket, a path, or a freeform description.
3. If inside a repo, scan the affected subsystem. Prefer the current diff, the latest commits, and any linked ticket.
4. Extract facts already known so the grill does not re-ask them.

### Phase 2: Grill

Load `grill-me` if present. If `batch-grill-me` is present, use that instead (one frontier round at a time).

Walk the template as the design tree. Each template heading is a branch:

1. Problem Statement
2. Solution
3. User Stories (actors, paths, edge cases)
4. Implementation Decisions (modules, interfaces, schema, APIs)
5. Testing Decisions
6. Manual Testing Plan
7. Out of Scope
8. Further Notes

For each question, recommend an answer from the grounded facts. Do not ask for facts the agent can look up.

The phase ends when the frontier is empty and the user confirms the shared understanding.

### Phase 3: Assemble

Fill every template section. Drop the `<spec-template>` wrapper and the `<user-story-example>` block. Keep the section headings exact.

User Stories stay numbered and use: `As an <actor>, I want a <feature>, so that <benefit>`.

Confirm the output path once:

- Repo with `docs/prds/`: `docs/prds/<slug>.md`
- Repo without one: `docs/prds/<slug>.md` (create the folder)
- Outside a repo: the current writable directory

Ask: `I'll write the PRD to <path>. Different location?`

If the user asks for Notion, create the page after the markdown is written. Do not create Notion by default.

### Phase 4: Self-critique

Before the user sees the draft:

- Problem and Solution are from the user's view
- User stories are extensive and cover all actors
- Implementation Decisions have no file paths (except a marked prototype snippet)
- Testing Decisions say what a good test is, which modules, and prior art
- Manual Testing Plan has human-readable production steps
- Out of Scope is explicit

Report what was fixed and what still needs the user.

### Phase 5: Review and open

Write the file. Open it in Plannotator (non-blocking on Windows):

```powershell
Start-Process -FilePath "$env:LOCALAPPDATA\plannotator\plannotator.exe" -ArgumentList @('annotate', '<absolute-path>')
```

Print title, one line, and both the relative path and the absolute path. Do not dump the full PRD in chat.

## Error Handling

- No input: grill from the current session and repo. Do not refuse.
- Ticket or PR unreadable: say so and continue from what the user described.
- User cannot answer a branch: put it under Further Notes as an open question. Do not invent it.
