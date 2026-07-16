# docs

Write documentation a real person wants to read: short, plain, and built around someone trying to do a real thing.

The skill treats "document feature X" as the wrong goal. The right goal is "help someone do Y with X". It plans the reader's story first, then writes in a tight, human style.

## What it does

- **Finds your docs.** Looks for a docs folder (`docs/`, `documentation/`, `content/docs/`, and so on). If it finds none, it asks you where docs should go instead of guessing.
- **Adapts to your site.** Reads a few existing pages, learns the voice and frontmatter, and reuses whatever components the site already has (steps, tabs, callouts, cards) for storytelling. It never invents a component your site does not have and is not tied to any framework.
- **Plans the story.** Lists who reads the page and what each one wants, writes a user story per reader, and turns those stories into a set of short linked pages instead of one giant page.
- **Writes like a human.** Digestible, plain B1 to B2 English, light markdown, show-don't-tell with runnable code over walls of prose.
- **Bans the tells.** No em dashes or en dashes, no separator glyphs, no "not X: it's Y" phrasing, no "key insight" or "gap".
- **Links it up.** Places pages where the reader's path expects them, cross-links both ways, and keeps every page reachable from the nav.

## Usage

```
/docs
/docs write docs for tool interrupts
/docs reorganize the auth section
```

## Output

Documentation written into your project's docs folder (or the location you point it at), split across short linked pages when the topic has more than one journey.
