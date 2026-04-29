# architecture-impact

Before/after architectural analysis of a PR, written for decision makers.

Most PR descriptions are written by/for the author. This skill produces a doc you can hand to a PM, eng lead, or stakeholder. It forces a TL;DR, before/after diagrams (one diagram = one question), business-impact framing, and an honest risk section. Output passes the "newspaper test": if someone reads only the title, they understand why the change matters.

For PRs with market impact (new platforms, integrations, ecosystem expansion), it switches to a customer-facing structure: fan-out diagrams, "new users this opens up", "new partner opportunities", and a 3-step adoption pattern.

## Inputs

PRs only. Pass any of:

- GitHub PR URL — `https://github.com/owner/repo/pull/1234`
- Issue/PR shorthand — `#1234`

## Invoke

```
/architecture-impact #1234
```

Or trigger by description:

> "What's the architectural impact of this PR?"
> "Write up the before/after for #1234 for the PM team."

## Output

Markdown document with rendered Mermaid diagrams, written to `docs/architecture/PR-<number>-impact.md`. If an impact-radius diagram is needed, an SVG file is placed alongside.

## How it works

Six phases: analyze the PR (size-aware diff reading), classify changes as architectural vs. implementation, complete the "we are doing X so that Y" sentence, generate diagrams (before/after with identical layout, plus optional fan-out or impact-radius), pick the customer-facing or internal document structure, and write with progressive disclosure.

The skill enforces a semantic color system across diagrams (added / removed / modified / unchanged / focus) so visuals stay consistent and accessible.
