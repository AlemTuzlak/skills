# marketing-brief

Generate a structured marketing brief from a PR, git ref range, codebase feature, or freeform description. Designed for non-marketers who need professional-quality briefs.

The brief is the canonical source of truth that downstream skills (blog, social, newsletter, video) all key off — write it once, reuse everywhere.

## What's in the brief

Always-included sections:

- **Executive Summary** — TL;DR
- **Problem Statement** — what pain this solves
- **Solution Overview** — what was built (non-technical)
- **Technical Summary** — what was built (technical)
- **Target Audience** — personas, who benefits
- **Value Proposition** — why anyone should care
- **Competitive Positioning** — combines user-named competitors with web research
- **Key Messages** — 3-5 ready-to-use talking points
- **Suggested Channels** — where to distribute
- **Call to Action** — what readers should do
- **SEO Keywords** — search terms to target

Optional sections proposed only when relevant: Tone & Voice Guidance, Visual/Asset Suggestions, Timeline, Success Metrics, Risks/Sensitivities.

## Inputs

In resolution order:

1. GitHub PR URL or `#1234`
2. Git ref range — `v1.0...v2.0`
3. File or directory path
4. Freeform text

## Invoke

```
/marketing-brief #1234
/marketing-brief v1.0...v2.0
/marketing-brief src/features/dark-mode
/marketing-brief "we shipped a faster image pipeline"
```

Or trigger by description:

> "Write a marketing brief for the auth refactor."

## Output

Markdown file saved to `docs/marketing/brief-<feature-slug>.md` (auto-detects an existing marketing directory if present), and printed to terminal.

## How it works

Four phases: discovery (read input + product context, present scope, flag breaking changes / deprecations / security fixes for explicit framing), configuration (audience, detail level, competitors, conditional sections), generation (writes all approved sections with depth/tone adapted to audience), output.
