# AGENTS.md

Rules for any agent working in this repo. This repo holds personal agent skills, published as a Claude Code plugin.

## Every skill ships docs

Adding or changing a skill under `skills/<name>/` is not finished until its docs are written. Code without docs is half the work.

When you add or change a skill:

1. **Write or update `skills/<name>/README.md`.** Use the `docs` skill (`/docs`) to write it. It explains how the skill works to someone who has never seen it.
2. **Update the root `README.md`** in all three places that list skills:
   - the table under `## The skills`
   - a short section under `## Why each one is cool`
   - the tree under `## Repo layout`
3. **Put all of it in the same commit** as the skill change. A skill that lands without its docs is an incomplete commit, not a follow-up ticket.

This applies to changed behaviour too, not just new skills. If you change what a skill does, the README says the new thing before you call the work done.

## Writing the docs

Always use the `docs` skill. A few of its rules matter enough to repeat here, because they are easy to break by accident:

- No em dashes, no en dashes, no separator glyphs like `x` or `.`. Use commas, colons, periods, or parentheses.
- No "it's not X: it's Y" phrasing, no "key insight", no "gap".
- Plain B1 to B2 English. Short sentences. Swap big words for small ones.
- Anything that is a list gets formatted as a list, not a paragraph full of commas.

Match the neighbouring skill READMEs for shape: title, one line saying what it is, `## What it does` with bold lead-ins, `## Usage`, `## Output`.

## Skill file conventions

- `SKILL.md` frontmatter has two fields: `name` and `description`. The description says **when** to use the skill, in third person. It never summarises the workflow, because agents follow the description instead of reading the body.
- Heavy reference material goes in `references/`. Scripts and hooks go in `hooks/`.
- **Keep load-bearing rules in `SKILL.md` itself.** Pressure-testing `accessible-html` showed that a requirement living only in a `references/` file is a requirement agents never read when they are in a hurry. Reference files hold detail, not the rules you need followed.
- If a rule must hold whether or not the model chooses to load the skill, it needs a hook, not prose. A skill cannot enforce itself.

## Definition of done

- [ ] `SKILL.md` written or updated
- [ ] `skills/<name>/README.md` written with `/docs`
- [ ] Root `README.md` updated: table, why-each-one-is-cool, repo layout
- [ ] Mirrored to `C:/Users/AlemTuzlak/.claude/skills/<name>/` so it takes effect immediately
- [ ] Everything committed together and pushed
