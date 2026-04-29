# blog-post

Write a high-quality blog post from a marketing brief, PR, git diff, codebase feature, or freeform topic.

Detects the repo's existing blog voice (if there are prior posts), runs competitive research via web search, generates 3-5 headline options with explanations, and writes with proper SEO frontmatter — `meta_description`, `primary_keyword`, `slug`, secondary and long-tail keywords.

Three post types it can produce:

- **Feature announcement** — "We shipped X, here's why it matters" (~600-1000 words)
- **Deep-dive technical** — "How we built X" (~1500-2500 words)
- **Problem-solution narrative** — "You have problem X, here's how this solves it" (~1000-2000 words)

## Inputs

In resolution order:

1. Path to a marketing brief (`.md` containing "Executive Summary" or "Key Messages")
2. GitHub PR URL or `#1234`
3. Git ref range — `v1.0...v2.0`
4. File or directory path
5. Freeform text

## Invoke

```
/blog-post .tmp/marketing-brief.md
/blog-post #1234
/blog-post v1.4.0...v1.5.0
/blog-post src/features/auth
```

Or trigger by description:

> "Write a blog post about the auth refactor in #1234."

## Output

Markdown file with SEO YAML frontmatter, saved to the auto-detected blog directory (`content/blog/`, `_posts/`, `blog/posts/`, etc.). Code examples, mermaid diagrams, and image placeholders with ready-to-use generation prompts are inserted inline.

## How it works

Six phases: discovery (input + product context), competitive blog research (web search), configuration (audience, tone, post type, CTA, involvement level), outline approval, sectioned writing with self-review backfills, and headline selection. Three involvement levels — A (just write it), B (outline approval), C (section-by-section).

## Companion skills

Pairs naturally with `marketing-brief` (write the brief first, feed it in), and with `social-copy` / `newsletter` downstream to amplify the post.
