# video-script

Write a video script (text only, no rendered video) for a product demo, feature walkthrough, launch video, or social clip.

Two length tiers, both with on-screen action, visual directions, and timing:

- **Short-form (30-90 seconds)** — Reels, Shorts, TikTok, X video
- **Medium-form (3-5 minutes)** — YouTube, product demos, walkthroughs

Pacing is calibrated to ~135 words per minute, so word counts match runtime targets (~65 words for 30s, ~135 for 60s, ~200 for 90s). The script earns the next 3 seconds with a hook and keeps doing it through the body.

This skill produces *text*. If you want an actual rendered `mp4`, use `remotion-video` or `hyperframes-video` instead.

## Inputs

In resolution order:

1. Path to a marketing brief (`.md` containing "Executive Summary" or "Key Messages")
2. Path to a blog post
3. Path to a changelog
4. Path to a newsletter
5. GitHub PR URL or `#1234`
6. Git ref range — `v1.0...v2.0`
7. File or directory path
8. Freeform text

## Invoke

```
/video-script .tmp/marketing-brief.md
/video-script blog/posts/auth-refactor.md
/video-script #1234
```

Or trigger by description:

> "Write a 30-second launch video script for the dark mode feature."

## Output

Markdown file with timestamped scenes, narration, on-screen text, and visual directions. Saved alongside other marketing assets when run from `/marketing-pipeline`, otherwise to a path you choose at output time.

## How it works

Six phases: discovery (input + product context), configuration (platform, length, audience, tone), outline approval, write (scene-by-scene with narration + visuals + timing), review, output.

## Companion skills

For the actual rendered video file, use `remotion-video` (React/Remotion-based) or `hyperframes-video` (HTML/GSAP-based).
