# marketing-pipeline

Orchestrate any combination of `/marketing-brief`, `/changelog`, `/blog-post`, `/remotion-video`, `/newsletter`, `/social-copy`, and `/video-script` from one input. One launch kit, one command.

Each step's output feeds the next, so you don't re-feed context yourself: the changelog informs the brief, the brief informs the blog, the blog informs the social posts and newsletter, and the rendered video gets referenced by social copy with poster + mp4 paths.

## What it doesn't do

This is an orchestrator, not a re-implementation. Each sub-skill runs its full process — discovery, configuration, writing, output — including its own questions about audience, tone, and CTA. It just chains them together with the right inputs.

## Inputs

Same as the sub-skills:

1. GitHub PR URL or `#1234`
2. Git ref range — `v1.0...v2.0`
3. File or directory path
4. Freeform text

## Invoke

```
/marketing-pipeline #1234
```

Or trigger by description:

> "Full launch content for #1234 — brief, blog, tweet, newsletter."
> "Run the marketing pipeline on v1.4.0...v1.5.0."

You'll be asked which skills to run (`"1, 3, and 5"`, `"all"`, `"3 only"`, etc.) and whether everything should land in a single output directory like `marketing/launch-<feature>/`.

## Execution order

The chain is fixed so that upstream output enriches downstream skills:

```
changelog → marketing-brief → blog-post → remotion-video → newsletter → social-copy → video-script
```

Skipped skills don't break the chain — the next selected skill receives whatever the most recent upstream output was, or the original input if nothing came before it.

## Compatibility checks

- **Changelog** needs a git ref range or PR. If the original input is freeform text or a file path, changelog is auto-skipped with a note.
- The pipeline confirms with you between skills before continuing, so you can stop early or adjust mid-flight.

## Output

A summary listing every generated artifact with its actual path. If you picked a shared directory, all outputs land in `marketing/launch-<feature>/` with predictable filenames (`brief.md`, `changelog.md`, `blog-post.md`, `video.mp4`, `poster.jpg`, `newsletter.md`, `social-copy.md`, `video-script.md`).
