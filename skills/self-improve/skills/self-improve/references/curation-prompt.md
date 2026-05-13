Reviews the lesson pile during `/curate-lessons` and recommends per-lesson actions.

## Input

You receive three inputs:

1. The contents of every lesson file in the pile being curated (one pile per invocation — global or repo).
2. The current `INDEX.md` for that pile.
3. The repo diff (`git log --stat` and changed-file list) since `last_curated` in `curation-state.yml`. For the global pile, this is the diff aggregated across recent sessions; for a repo pile, it is the repo's own diff.

## Per-lesson categorization

Assign exactly one category to each lesson:

- **Stale.** The lesson references a file path, package name, or symbol that no longer exists in the repo, OR the lesson's directive contradicts the current code state (e.g. the lesson says "always use X" but the codebase has moved to Y). Evidence must be cited from the diff or the current file tree.
- **Duplicate.** The lesson is semantically equivalent to another lesson in the pile — same triggering condition and same directive, possibly worded differently. Identify the duplicate group by listing all overlapping slugs.
- **Drift.** The lesson pulls against another lesson without being a direct contradiction — adjacent rules that have started to interfere as the codebase evolved. Borderline; flag for the user to decide.
- **Underused.** The lesson is tagged for a code area that has not been touched in the time window covered by the diff (typically 6 months). This is a soft signal only — do not recommend deletion based on underuse alone. The lesson may still be correct and important; it just hasn't fired.
- **Healthy.** No action needed. The lesson's references are still valid, no duplicates, no drift.

## Per-lesson recommendation

For each lesson, produce a recommendation paired with a reason:

- For **Stale** lessons: recommend `delete` or `rewrite` and cite the broken reference.
- For **Duplicate** lessons: recommend `merge into <surviving-slug>` and name which slug should survive (usually the more general or more recently updated one).
- For **Drift** lessons: recommend `review with <other-slug>` and name the lesson it conflicts with.
- For **Underused** lessons: recommend `keep` with a note that it hasn't fired recently.
- For **Healthy** lessons: recommend `keep` with no further note.

Never recommend silent deletion. The user is the only authority that can remove a lesson; this prompt produces a curation report, not autonomous edits.

## Output

Output a JSON array, one entry per lesson reviewed:

```json
[
  {
    "slug": "<lesson-slug>",
    "category": "stale|duplicate|drift|underused|healthy",
    "recommendation": "<short action verb + target>",
    "supporting_evidence": "<file path, diff hunk, or sibling slug that justifies the category>"
  }
]
```

Output only the JSON array. No prose, no code fences.
