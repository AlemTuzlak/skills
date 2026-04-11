---
name: marketing-pipeline
description: Use when the user wants to run multiple marketing skills together (brief, blog post, social copy) from a single input, or when they mention "marketing pipeline", "full marketing", or "launch content"
---

# Marketing Pipeline

Orchestrate `/marketing-brief`, `/blog-post`, and `/social-copy` from a single input. Pick which skills to run and in what order. Each skill's output feeds into the next.

## How it works

This skill does NOT duplicate the logic of the three sub-skills. It collects input, asks which skills to run, then invokes them in sequence, passing each output as input to the next.

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
> 2. Blog post (`/blog-post`)
> 3. Social copy (`/social-copy`)
>
> "Pick any combination (e.g. '1 and 3', 'all', '2 only')."

## Step 2b: Output directory

Ask where to save all generated content:

> "Want all content saved to a single directory? (e.g. `marketing/launch-<feature>/`). Otherwise each skill will use its own default location."

If the user picks a single directory, override each sub-skill's default output path. All files go into that directory:
- `brief.md` (marketing brief)
- `blog-post.md` (blog post)
- `social-copy.md` (social copy)

Create the directory if it doesn't exist. When invoking each sub-skill's output phase, provide this path so the sub-skill skips its own "where to save?" question.

If the user declines, let each sub-skill use its own default path.

## Step 3: Determine execution order

Run selected skills in this order (each output feeds the next):

```
marketing-brief → blog-post → social-copy
```

- If brief is selected, run it first. Its output file becomes the input for subsequent skills.
- If brief is NOT selected but blog post is, run blog post from the original input. Its output becomes input for social copy.
- If only social copy is selected, run it from the original input.
- If only brief is selected, run it and stop.
- If brief + social copy (no blog), brief output feeds social copy directly.

The user only goes through discovery (confirming features, flagging sensitive items) once during the first skill. Subsequent skills reuse that context.

## Step 4: Run each skill

For each selected skill, invoke it using the Skill tool:

- Pass the output file from the previous skill as the argument (if available)
- If it's the first skill in the chain, pass the original input
- Let each skill run its full process (configuration, writing, output)

Between skills, confirm with the user before proceeding:

> "[Skill] is done. Ready to move on to [next skill]?"

This gives the user a chance to adjust, take a break, or stop early.

## Step 5: Summary

After all selected skills are complete, present a summary:

> "Here's everything that was generated:"
>
> - Marketing brief: `<path>/brief.md`
> - Blog post: `<path>/blog-post.md`
> - Social copy: `<path>/social-copy.md`
>
> (Only list the skills that were actually run. Show actual paths used.)

## What this skill does NOT do

- Replace the individual skills. Each sub-skill handles its own configuration, writing, and output.
- Force all three skills. The user picks which ones to run.
- Skip the sub-skills' own question flows. Each skill still asks its own configuration questions.
