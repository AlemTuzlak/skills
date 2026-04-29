# newsletter

Write product update emails and feature announcement newsletters from a brief, blog post, changelog, PR, or freeform description.

Email that respects an inbox: 3-5 subject line options (each with explanation and trade-offs), preview text optimized for inbox previews, body calibrated to the audience (all users / power users / new users / specific tier / developers / non-technical), and a single clear CTA.

Auto-picks the right format based on input:

- **Single major update** → focused single-feature email (problem → what changed → visual → CTA)
- **Multiple updates** → digest email (lead update full-treatment, secondary updates as bullets, quick fixes grouped at the bottom)

Optionally generates segment variants (a more technical version for developers, a simpler one for non-technical users) after the primary email is approved.

## Inputs

In resolution order:

1. Path to a marketing brief (`.md` containing "Executive Summary" or "Key Messages")
2. Path to a blog post
3. Path to a changelog (or `CHANGELOG.md`)
4. GitHub PR URL or `#1234`
5. Git ref range — `v1.0...v2.0`
6. File or directory path
7. Freeform text

## Invoke

```
/newsletter .tmp/marketing-brief.md
/newsletter blog/posts/auth-refactor.md
/newsletter CHANGELOG.md
/newsletter #1234
```

Or trigger by description:

> "Write the launch email for the dark mode feature."

## Output

Subject line options + preview text + email body, in either copy-only format (drop into your email tool) or markdown. Saved to `emails/<slug>.md` by default.

## How it works

Five phases: discovery (input + product context, format detection), configuration (audience, format, tone, CTA), write (subject lines first with explanations, then preview text per subject, then body using single-feature or digest structure), review, output.

Hard rules: subject lines 30-50 chars, preview 40-130 chars, no spam trigger words, no em-dashes in generated content.
