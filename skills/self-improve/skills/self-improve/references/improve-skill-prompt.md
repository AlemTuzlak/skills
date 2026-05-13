Drafts a unified diff for a skill's `SKILL.md` from its accumulated related lessons, invoked by `/improve-skill <name>`.

## Input

You receive two inputs:

1. The current full content of the target skill's `SKILL.md` (frontmatter + body).
2. N lessons whose `related_skill` frontmatter field matches this skill's name. Each lesson is provided in full: frontmatter (including `description`, `tags`, `scope`) plus body (`Rule`, `Why`, `How to apply`).

If N is zero, return an empty diff and an empty conflicts list — nothing to absorb.

## Algorithm

1. **Section mapping.** For each lesson, identify the section of `SKILL.md` it most naturally belongs in:
   - Match the lesson's intent against existing headings in the skill body. Use literal heading text, not approximations.
   - If no existing section fits, mark the lesson as needing a new section. Propose a heading title derived from the lesson's tags or rule.

2. **Edit drafting.** For each lesson:
   - If mapped to an existing section: draft an inline addition. Prefer a one-line bullet or a short paragraph that paraphrases the lesson's `Rule` and `How to apply`. Do not duplicate the lesson's `Why` — skills are directive, not narrative.
   - If mapped to a new section: draft the new heading plus a short body containing the rule and its application. Place the new section after the most topically adjacent existing section.
   - Express every edit as a unified-diff hunk against the current `SKILL.md` (`@@ ... @@` headers, `+`/`-`/` ` line prefixes). Combine all hunks into a single unified diff with `--- a/SKILL.md` / `+++ b/SKILL.md` headers.

3. **Conflict detection.** A conflict exists when the lesson's directive contradicts text already in the skill — for example, the skill says "always use approach A" and a related lesson says "never use approach A". Do not silently overwrite. Record the conflict, leave the existing skill text alone, and emit no diff hunk for that lesson. The user resolves conflicts interactively before the diff is applied.

4. **Routing description.** If absorbing the lessons changes when the skill should activate, propose an updated `description` frontmatter line. Include it in the diff. Preserve the active `Use when ...` form.

## Output

Output a single JSON object:

```json
{
  "unified_diff": "--- a/SKILL.md\n+++ b/SKILL.md\n@@ ... @@\n ...\n+ ...\n",
  "conflicts": [
    {
      "lesson_slug": "<slug>",
      "skill_section": "<heading text or 'frontmatter'>",
      "conflict_description": "<one sentence: what the skill says vs what the lesson says>"
    }
  ]
}
```

`unified_diff` is a single string containing the full diff (use real newline characters in the JSON string). An empty diff is the empty string `""`. `conflicts` is an array, empty when no conflicts were found.

Output only the JSON object. No prose, no code fences.
