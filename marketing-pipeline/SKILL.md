---
name: marketing-pipeline
description: Use when the user wants to run multiple marketing skills together (brief, blog post, social copy, changelog, newsletter, video script) from a single input, or when they mention "marketing pipeline", "full marketing", or "launch content"
---

# Marketing Pipeline

Orchestrate any combination of `/marketing-brief`, `/changelog`, `/blog-post`, `/newsletter`, `/social-copy`, and `/video-script` from a single input. Pick which skills to run and in what order. Each skill's output feeds into the next.

## How it works

This skill does NOT duplicate the logic of the sub-skills. It collects input, asks which skills to run, then invokes them in sequence, passing each output as input to the next.

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
> 4. Newsletter (`/newsletter`)
> 5. Social copy (`/social-copy`)
> 6. Video script (`/video-script`)
>
> "Pick any combination (e.g. '1, 3, and 5', 'all', '3 only')."

## Step 2b: Output directory

Ask where to save all generated content:

> "Want all content saved to a single directory? (e.g. `marketing/launch-<feature>/`). Otherwise each skill will use its own default location."

If the user picks a single directory, override each sub-skill's default output path. All files go into that directory:
- `brief.md` (marketing brief)
- `changelog.md` (changelog)
- `blog-post.md` (blog post)
- `newsletter.md` (newsletter)
- `social-copy.md` (social copy)
- `video-script.md` (video script)

Create the directory if it doesn't exist. When invoking each sub-skill's output phase, provide this path so the sub-skill skips its own "where to save?" question.

If the user declines, let each sub-skill use its own default path.

## Step 3: Determine execution order

Run selected skills in this order (each output feeds the next):

```
changelog -> marketing-brief -> blog-post -> newsletter -> social-copy -> video-script
```

The order is designed so that upstream outputs enrich downstream skills:

- **Changelog** runs first because it produces a structured list of changes that all other skills can use
- **Marketing brief** uses the changelog (or original input) to build strategy, positioning, and key messages
- **Blog post** uses the brief (or changelog/original input) for a deep content piece
- **Newsletter** uses the brief or blog post to craft the email announcement
- **Social copy** uses any upstream output for platform-specific posts
- **Video script** uses any upstream output for the video narrative

If a skill in the chain is not selected, skip it. The next skill receives whatever the most recent upstream output was. If no upstream skill was selected, use the original input.

The user only goes through discovery (confirming features, flagging sensitive items) once during the first skill. Subsequent skills reuse that context.

## Step 4: Run each skill

For each selected skill, invoke it using the Skill tool:

- Pass the output file from the most recent upstream skill as the argument (if available)
- If it's the first skill in the chain, pass the original input
- Let each skill run its full process (configuration, writing, output)

Between skills, confirm with the user before proceeding:

> "[Skill] is done. Ready to move on to [next skill]?"

This gives the user a chance to adjust, take a break, or stop early.

## Step 5: Summary

After all selected skills are complete, present a summary:

> "Here's everything that was generated:"
>
> - Changelog: `<path>/changelog.md`
> - Marketing brief: `<path>/brief.md`
> - Blog post: `<path>/blog-post.md`
> - Newsletter: `<path>/newsletter.md`
> - Social copy: `<path>/social-copy.md`
> - Video script: `<path>/video-script.md`
>
> (Only list the skills that were actually run. Show actual paths used.)

## What this skill does NOT do

- Replace the individual skills. Each sub-skill handles its own configuration, writing, and output.
- Force all skills. The user picks which ones to run.
- Skip the sub-skills' own question flows. Each skill still asks its own configuration questions.
