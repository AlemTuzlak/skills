# social-copy

Generate platform-specific social media copy from a marketing brief, blog post, PR, git diff, codebase feature, or freeform description.

Each platform gets copy tuned to its rules and algorithm — not the same paragraph reflowed five ways. X gets short hooks and thread structure; LinkedIn gets the long-post format with a strong opening line and mobile-friendly line breaks. Per-platform rulesets live under [`platforms/`](./platforms).

Default platforms: Twitter/X and LinkedIn. Add Reddit, Hacker News, Discord, Mastodon, Bluesky, etc. on request — for platforms without a dedicated ruleset, the skill adapts using its knowledge of that platform's conventions.

## Inputs

In resolution order:

1. Path to a marketing brief (`.md` containing "Executive Summary" or "Key Messages")
2. Path to a blog post
3. GitHub PR URL or `#1234`
4. Git ref range — `v1.0...v2.0`
5. File or directory path
6. Freeform text

## Invoke

```
/social-copy .tmp/marketing-brief.md
/social-copy blog/posts/auth-refactor.md
/social-copy #1234
```

Or trigger by description:

> "Write a launch tweet for the dark mode feature."
> "Generate LinkedIn copy for #1234."

## Output

Platform-specific copy blocks (subject lines / hooks / threads / CTAs depending on platform), saved to a markdown file. Each platform section is self-contained so you can copy-paste straight into the respective tool.

## Files

- [`SKILL.md`](./SKILL.md) — the skill itself
- [`platforms/`](./platforms) — per-platform rulesets (character limits, formatting conventions, algorithm cues, what works and what doesn't)

## How it works

Five phases: discovery (input + product context, scope confirmation), configuration (platforms, tone), write (per-platform, using the appropriate ruleset), review, output. Tone is detected from the repo's existing voice (README, docs, prior posts) when possible, then confirmed.
