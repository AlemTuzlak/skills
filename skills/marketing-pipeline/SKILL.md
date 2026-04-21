---
name: marketing-pipeline
description: Use when the user wants to run multiple marketing skills together (brief, blog post, social copy, changelog, newsletter, video script) from a single input, or when they mention "marketing pipeline", "full marketing", or "launch content"
---

# Marketing Pipeline

Orchestrate any combination of `/marketing-brief`, `/changelog`, `/blog-post`, `/newsletter`, `/social-copy`, and `/video-script` from a single input. Pick which skills to run and in what order. Each skill's output feeds into the next.

## How it works

This skill does NOT duplicate the logic of the sub-skills. It collects input, asks which skills to run, then invokes them in sequence, passing each output as input to the next. Each skill runs its full process including its own discovery, configuration, writing, and output phases.

## Step 1: Input

Accept the same input types as the sub-skills:

1. GitHub PR (URL or `#number`)
2. Git ref range (e.g. `v1.0...v2.0`)
3. File/directory path
4. Freeform text

If no argument provided, ask: "What should I create marketing content for? You can provide a PR, git ref range, file path, or just describe the feature."

## Step 2: Select skills

Ask the user which skills to run:

> "Which of these do you want me to generate?"
>
> 1. Marketing brief (`/marketing-brief`)
> 2. Changelog (`/changelog`)
> 3. Blog post (`/blog-post`)
> 4. Remotion video (`/remotion-video`)
> 5. Newsletter (`/newsletter`)
> 6. Social copy (`/social-copy`)
> 7. Video script (`/video-script`)
>
> "Pick any combination (e.g. '1, 3, and 5', 'all', '3 only')."

`"all"` means skills 1 through 7.

### Input compatibility check

After selection, check if the original input is compatible with each selected skill:

- **Changelog** requires a git ref range or PR. If the original input is freeform text or a file path, skip changelog and tell the user: "Skipping changelog because it needs a git ref range or PR. The other skills will proceed from the original input."

## Step 2b: Output directory

Ask where to save all generated content:

> "Want all content saved to a single directory? (e.g. `marketing/launch-<feature>/`). Otherwise each skill will use its own default location."

If the user picks a single directory, all files go into that directory:
- `brief.md` (marketing brief)
- `changelog.md` (changelog)
- `blog-post.md` (blog post)
- `video.mp4` + `poster.jpg` + `remotion/` subdirectory (remotion video)
- `newsletter.md` (newsletter)
- `social-copy.md` (social copy)
- `video-script.md` (video script)

Create the directory if it doesn't exist. When each sub-skill asks "where to save?", respond with the shared path and filename on behalf of the user.

If the user declines, let each sub-skill use its own default path. Track the actual output paths for the summary.

## Step 3: Determine execution order

Run selected skills in this order (each output feeds the next):

```
changelog -> marketing-brief -> blog-post -> remotion-video -> newsletter -> social-copy -> video-script
```

The order is designed so that upstream outputs enrich downstream skills:

- **Changelog** runs first because it produces a structured list of changes that all other skills can use
- **Marketing brief** uses the changelog (or original input) to build strategy, positioning, and key messages
- **Blog post** uses the brief (or changelog/original input) for a deep content piece
- **Remotion video** uses the blog post (or brief / changelog / original input) to produce a rendered mp4 + poster; runs after the text content is settled so its narrative plan can reuse the positioning
- **Newsletter** uses the brief or blog post to craft the email announcement
- **Social copy** uses any upstream output for platform-specific posts. If a Remotion video was generated, reference the `video.mp4` + `poster.jpg` paths so the posts can embed them.
- **Video script** uses any upstream output for the video narrative

If a skill in the chain is not selected, skip it. The next skill receives whatever the most recent upstream output was. If no upstream skill was selected, use the original input.

### Feeding non-adjacent selections

When feeding output from one skill to a non-adjacent skill (e.g. changelog directly to social-copy), explicitly tell the downstream skill what the input represents: "This is a changelog. Treat it as a structured list of feature descriptions and changes."

## Step 4: Run each skill

For each selected skill, invoke it using the Skill tool:

- Pass the output file from the most recent upstream skill as the argument (if available)
- If it's the first skill in the chain, pass the original input
- Let each skill run its full process (discovery, configuration, writing, output)
- If a sub-skill asks about tone or audience and the user already answered this for a previous skill in the chain, suggest the same answer as default and let the user confirm or change

Between skills, confirm with the user before proceeding:

> "[Skill] is done. Ready to move on to [next skill]?"

This gives the user a chance to adjust, take a break, or stop early.

### Error recovery

If a sub-skill fails or the user cancels mid-process, ask: "Want to skip this skill and continue to the next one, or stop the pipeline here?" List what was already completed.

## Step 5: Summary

After all selected skills are complete, present a summary:

> "Here's everything that was generated:"
>
> - Changelog: `<path>/changelog.md`
> - Marketing brief: `<path>/brief.md`
> - Blog post: `<path>/blog-post.md`
> - Remotion video: `<path>/video.mp4` + `<path>/poster.jpg` (+ `<path>/remotion/` project if kept)
> - Newsletter: `<path>/newsletter.md`
> - Social copy: `<path>/social-copy.md`
> - Video script: `<path>/video-script.md`
>
> (Only list the skills that were actually run. Show actual paths used.)

## What this skill does NOT do

- Replace the individual skills. Each sub-skill handles its own configuration, writing, and output.
- Force all skills. The user picks which ones to run.
- Skip the sub-skills' own question flows. Each skill still asks its own configuration questions.
