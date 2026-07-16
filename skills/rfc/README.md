# rfc

Interactively write an RFC (Request for Comments) / technical design doc that survives review.

An RFC's value is the thinking it forces (honest goals, real alternatives, named risks, a concrete design), not the document itself. This skill is built to force that thinking rather than generate an RFC-shaped document with hand-waved sections.

## What it does

- **Interviews you** to surface the thinking, driving toward 10 core dimensions (problem, why-now, goals, non-goals, design, alternatives, risks, rollout, approvers, open questions). Asks only what your request/ticket/code hasn't already answered.
- **Grounds in your codebase.** Inside a repo it scans the affected subsystem and cites real files, and detects + adopts your existing RFC template if you have one.
- **Shows you working code.** Presents 2-3 concrete API/code-snippet approaches to the design and lets you choose. The one you pick becomes the Proposed Design; the ones you reject become the Alternatives Considered section, code and all, so alternatives are real instead of strawmen.
- **Self-critiques** the draft against a quality rubric (measurable goals, real alternatives, mitigated risks, concrete design, backed claims) before you ever see it.
- **Outputs** a markdown RFC at a repo-aware path, with a Mermaid diagram when warranted, and opens it for you.

## Usage

```
/rfc
/rfc add per-tenant rate limiting to the API gateway
/rfc <GitHub PR or issue URL>
```

Frontmatter (status/author/approvers) and RFC numbering are off by default; ask for them if your repo files RFCs that way.

## Output

Markdown, written to your repo's RFC directory if it has one, else `docs/rfcs/<slug>.md`, and opened in a new VS Code window on finish.
