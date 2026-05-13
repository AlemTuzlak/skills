Drafts a structured lesson file from a user correction.

## Input contract

You receive two things:

1. The user's correction message (the prompt that triggered capture — e.g. "you should always run the linter before claiming the task is done").
2. The prior turn's assistant response, including any tool-use trace (file edits, Skill invocations, command runs). Use this to identify what the model actually did wrong and which skill, if any, was active.

## Extraction steps

From the correction message and prior turn, extract:

- **The durable rule.** A single declarative sentence stating what must (or must not) be done. Strip the situational framing; keep the rule generalizable. Example: "Run the package lint script after every code change before reporting completion."
- **The reason or incident.** Why this rule exists, grounded in the specific failure that prompted the correction. One or two sentences.
- **When and how to apply it.** Concrete trigger conditions and the action to take when they match. This becomes the body's "How to apply" line.

## Routing description (critical)

The `description` frontmatter field is the routing condition the agent reads in `INDEX.md` to decide whether to load the full lesson. It MUST start with the literal phrase `Use when ` followed by an active condition describing the triggering situation, then an em-dash, then a short statement of what the lesson governs.

Correct form: `Use when modifying any StreamChunk type — requires updating every provider adapter that produces or consumes that chunk.`

Incorrect form (passive summary): `This lesson is about StreamChunk types and adapters.`

Routing descriptions are not summaries of the lesson's topic. They are conditions the agent matches against the current task.

## Scope prediction

Decide `scope: repo` or `scope: global`:

- **repo** — the rule references repo-specific paths, package names, internal symbols, repo-specific tooling, or organization-specific conventions.
- **global** — the rule is a universal engineering principle that applies to any project in the same language/tech stack with no repo-specific references.

If the rule is borderline, default to `repo`. A repo-scoped lesson can be promoted to global later via `/promote --global`; a prematurely-globalized rule is harder to retract.

## Tag prediction

Pick 1 to 3 kebab-case tags drawn from the rule's domain (e.g. `testing`, `linting`, `adapter-system`, `streaming`, `documentation`). Tags drive clustering for `/promote-cluster`. Prefer existing tags from `INDEX.md` when they fit; coin a new tag only when no existing one is close.

## related_skill prediction

Inspect the prior turn's tool-use trace for any `Skill` invocation. If a skill was active when the failure happened, set `related_skill: <skill-name>` (bare skill name, no `plugin:` prefix). Otherwise set `related_skill: null`. This field drives `/improve-skill` — lessons tagged with a `related_skill` are candidates for absorption back into that skill's SKILL.md.

## Slug

Generate a kebab-case slug from the rule's intent (3 to 6 words). Examples: `run-lint-before-completion`, `streamchunk-adapter-coupling`, `prefer-toolDefinition-over-monolithic-adapter`. The slug becomes the filename (`<slug>.md`) and the `name` frontmatter field.

## Output format

Output the complete lesson file content matching `templates/lesson.md.tmpl`:

```
---
name: <slug>
description: Use when <condition> — <what this lesson governs>
tags: [<tag1>, <tag2>]
scope: <repo|global>
source:
  type: auto-captured
  created: <ISO-8601 datetime>
related_skill: <skill-name|null>
related: []
---

# <Title Case version of the rule>

**Rule:** <one-sentence rule>

**Why:** <reason or incident, 1-2 sentences>

**How to apply:** <when and where this kicks in>

<optional extended body — only if the rule has non-obvious caveats>
```

Do not output anything outside the file body. No preamble, no explanation.
