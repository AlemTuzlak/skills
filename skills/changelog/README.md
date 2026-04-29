# changelog

Generate a Keep-a-Changelog-style release notes file from git history, a tag range, or a single PR. Optionally creates a GitHub Release.

The point: release notes that don't sound like commit messages. Walks `git log` over a range, categorizes changes into Breaking / Added / Changed / Deprecated / Removed / Fixed / Security, and *rewrites* each entry into user-facing language ("Reports load 3x faster" beats "Optimized SQL query execution plan").

Smart enough to:

- Detect existing `CHANGELOG.md` format and emoji style, and match it
- Group large ranges (50+ commits) into higher-level entries instead of dumping every commit
- Take a single PR (`#1234`) and append it to an existing version section
- Produce an optional technical appendix for developer docs alongside the user-facing notes

## Inputs

In resolution order:

1. Git ref range — `v1.0.0...v1.1.0`, `v1.0.0..HEAD`
2. A single tag — interpreted as "from this tag to HEAD"
3. GitHub PR URL or `#1234` — single-PR mode (no version header)

## Invoke

```
/changelog v1.4.0...v1.5.0
/changelog v1.4.0          # since v1.4.0 to HEAD
/changelog #1234           # single-PR entry
```

Or trigger by description:

> "Generate release notes for the v1.5.0 release."
> "Write a changelog entry for #1234."

## Output

Prepended to the repo's `CHANGELOG.md` (or creates one with a Keep a Changelog header if missing). Optionally creates a GitHub Release via `gh release create <tag>`.

## How it works

Five phases: gather (commits + merged PRs via `gh pr list`), categorize (uses conventional-commit prefixes if present, else diff analysis), polish (rewrites each entry into user-benefit language), review, output. Detects existing changelog format and matches it.

## Companion skills

Pairs naturally with `marketing-brief`, `blog-post`, and `newsletter` — the changelog feeds all three in `marketing-pipeline`.
