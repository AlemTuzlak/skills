---
name: youtube-copy
description: Use when the user wants YouTube metadata for a video — a click-worthy title, an SEO/above-the-fold description, tags, and timestamped chapters. Accepts a transcript (ideally timestamped SRT), a topic, a PR, or a freeform description. Used standalone and by /produce-video. Triggers on "youtube title", "youtube description", "youtube chapters", "youtube tags", "youtube metadata", "youtube-copy".
---

# YouTube Copy

Write the four pieces of YouTube metadata that drive clicks and rank: **title, description, tags, chapters**. Ground everything in the provided source (transcript / topic) — never invent claims the source doesn't support. For chapters you need a **timestamped** source (SRT or `words.json`); without timestamps, ask for them or skip chapters.

## Output format
Write `youtube.md` (or print the same structure) exactly like this:

```
# YouTube

**Title**

<title>

**Description**

<description>

**Tags**

#tag1 #tag2 #tag3 ...

**Chapters**

00:00 - <chapter>
01:15 - <chapter>
...
```

(When `/produce-video` calls this skill, write `youtube.md` into the output folder.)

## Writing rule (non-negotiable)
**Never use em-dashes (— or –). Use a hyphen `-` instead.** This applies to the title, description, chapter separators, everything.

## Title (the single highest-leverage element)
- **60-70 characters** (hard max 100; anything past ~70 truncates on most surfaces).
- **Primary keyword near the front** so YouTube and viewers see the topic immediately.
- Do all three: **spark curiosity/emotion** (surprise, urgency, FOMO, benefit), **include the keyword**, and **set honest expectations** (a title that oversells tanks watch-time and is clickbait — avoid it).
- Use a **number** when natural (numbers attract the eye) and **emotive/power words** ("actually", "finally", "stop", "the right way", "type-safe", "without").
- Use the audience's real **lingo**, not generic phrasing.
- Optional: 1-2 relevant hashtags only if they add discovery; usually skip in the title.
- Avoid: misleading bait, ALL CAPS spam, profanity, >70 chars.
- Useful formula starters (pick what fits, don't force): "How to X (without Y)", "The X that Y", "Stop doing X - do this instead", "X explained in N minutes", "I tried X so you don't have to", "N ways to X".

## Description
Structure, front-loaded (the first ~100-160 chars show above the fold / in search):
1. **Hook (first 1-2 sentences)** containing the **primary keyword** — answer "what is this and why watch it?". Promise the outcome.
2. A short paragraph (2-4 sentences) expanding what the viewer learns.
3. **Chapters/timestamps** (see below) for videos > ~10 min (or whenever there are clear sections).
4. Optional links/CTA (main link, "watch next", subscribe) - only if the user provided them; don't fabricate URLs.
5. **2-3 relevant hashtags** at the very end.
- Length: tight and useful, roughly **150-300 words / under ~1000 characters**. Write for humans; weave related keywords naturally, never keyword-stuff.

## Tags
- **5-15** tags, comma/space free per tag (no spaces inside a multi-word tag is not required, but keep them clean).
- **Primary keyword/phrase first**, then a mix of **broad** (e.g. `react`, `webdev`) and **specific** (e.g. `react router loader data`, `unstable_useRouteLoaderData`).
- Quality over quantity; all tags must genuinely describe the content. No unrelated/spam tags, no competitor names.
- Output them prefixed with `#` in `youtube.md` for readability (they're entered without `#` in YouTube's tag box).

## Chapters (need a timestamped source)
YouTube's hard rules: **first chapter must be `00:00`**, **at least 3 chapters in ascending order**, each chapter **>= 10 seconds** long.
- **First chapter (`00:00`)** answers *"why did they click?"* - name it the payoff/topic (e.g. "Type-safe loader data", "The final result"), NOT "Intro".
- Titles: **3-8 words**, one clear noun phrase (mobile crops long ones). Replace useless labels ("Intro", "Demo", "Conclusion", "Q&A") with the actual topic of that section.
- Frequency: roughly every **2-4 minutes** for tutorials, **5-10 minutes** for long-form; aim for **5-15 chapters** total, never > ~20.
- Derive each `MM:SS` start from the timestamped source (the moment that section actually begins). Use `MM:SS` (or `H:MM:SS` past an hour). Separator is `-` (a hyphen), never an em-dash.

## Process
1. Read the source. If it's an SRT/`words.json`, use the timestamps for chapters; if it's plain text or a topic, write title/description/tags and note that chapters need a timestamped source.
2. Identify the **primary keyword/topic** (what someone would search) and the **payoff** (why they'd click).
3. Draft 2-3 title options, pick the strongest against the rules above, then write description, tags, chapters.
4. Self-check: title <= 70 chars and keyword-forward; description hook has the keyword in the first sentence; tags 5-15 and relevant; chapters start at 00:00, ascending, >=3, descriptive; **no em-dashes anywhere**.

## References
- [vidIQ - YouTube titles (11 formulas)](https://vidiq.com/blog/post/youtube-video-title/)
- [vidIQ - YouTube descriptions](https://vidiq.com/blog/post/youtube-video-descriptions/)
- [YouTube Help - Video chapters](https://support.google.com/youtube/answer/9884579)
