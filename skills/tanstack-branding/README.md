# tanstack-branding

The TanStack brand kit as a skill: exact color tokens, the full type scale, the
real logo and font files, and the layout rules — so anything you build for
TanStack looks like TanStack instead of like generic dev-tool blue.

**The brand in one sentence:** warm cream paper, near-black ink, a palm emblem,
one saturated accent per surface. Calm and printed-looking, never neon, never
glassy, never gradient soup.

## What it's for

Invoke it whenever you're producing something TanStack-branded:

- A landing page, marketing section, or dashboard view
- An OG/social card or README header
- A video, motion graphic, or title card
- Slides, diagrams, merch, email
- Reviewing whether an existing design is actually on brand
- Just looking up a hex, a font, or which logo file to use

## What it gives you

**Exact values, extracted from source.** Every token comes out of
`TanStack/tanstack.com` — `src/styles/app.css` for the ramps and semantic
tokens, `src/libraries/categories.ts` for the category map,
`src/server/og/colors.ts` for the render literals, `.agents/ui-style.md` for the
layout rules. Nothing eyeballed from a screenshot.

**The category accent model.** A library doesn't get to pick a color — it
inherits one from its category, and that color has a separate light (400) and
dark (300) step:

| Category | Libraries | Light | Dark |
|---|---|---|---|
| Framework | Start, Router | `#39af46` | `#69bc75` |
| Data & State | Query, DB, Store, AI | `#d3481b` | `#e06e49` |
| UI & UX | Table, Charts, Form, Hotkeys, Markdown, Highlight | `#3aa3c4` | `#61adbf` |
| Performance | Virtual, Pacer | `#ffa216` | `#f4d648` |
| Tooling | Devtools, Config, CLI, Intent, Ranger, MCP, Workflow | `#3e3529` | `#c5c3bf` |

**Measured contrast, not vibes.** Light-mode accents mostly *fail* as text on
cream — blue 2.42:1, green 2.36:1, amber 1.67:1, terracotta 3.71:1. So on cream,
accents are for marks, fills, keylines, and display-size headings — never small
labels. Every dark 300-step accent passes AA on near-black (5.84–13.09:1), which
is exactly why that step exists.

**The real files.** No downloading, no hunting:

```
assets/logos/   14 variants — emblem / landscape / stacked, in black, charcoal, cream, white
assets/fonts/   Bricolage Grotesque Bold, Inter (ttf + woff2), plus the OFL license
```

**The traps, called out.** Body copy is Inter at weight **300** down to 16px,
then steps to **400** at 14px and below — using 400 everywhere is the single
most common way TanStack body text comes out subtly wrong. And the brand
background is cream `#eeebd4`; white is a UI surface, not a brand surface.

## Trigger it

`/tanstack-branding`, or naturally: "make this on brand", "TanStack colors",
"our branding", "which logo do I use", "build a TanStack landing page",
"is this on brand?".

## Layout

```
SKILL.md                          the five decisions, category accents, workflows, common mistakes
references/
  palette.md                      all five ramps, semantic tokens (light + dark), shadows, measured contrast
  layout-and-type.md              fonts, full type scale, signature heading pattern, layout/depth/motion rules
  logos-and-assets.md             logo inventory + rules, font embedding recipes, live banner endpoints
assets/
  logos/                          14 logo files
  fonts/                          Bricolage Grotesque + Inter, with license
```

Read `SKILL.md` first — it's built to answer most questions on its own and points
at a reference file only when you need the full table.

## Notes

- **Inside `tanstack.com` itself, prefer the live CSS tokens** (`--color-*`) and
  the `/ds` component pages over values copied from here. This skill is the
  source of truth for work *outside* that codebase; in-repo, the repo wins.
- **Generated banners beat hand-built ones.** tanstack.com renders OG cards
  (`/api/og/<library>.png`) and README headers (`/api/readme/<library>.png`)
  server-side with these same fonts and accents. `logos-and-assets.md` has the
  parameters.
- **The mark inks differ slightly from the palette neutrals** — `#121212` vs
  `#111111`, `#ece8d1` vs `#eeebd4`, `#3a3a38` vs `#3e3529`. That's how the
  assets ship. Use them as-is; don't "fix" them to token values.
- **If tanstack.com's tokens change, re-extract.** The provenance paths are
  listed at the bottom of `SKILL.md`.

## Fonts and licensing

Bricolage Grotesque is SIL Open Font License 1.1 and its license text ships in
`assets/fonts/OFL-Bricolage-Grotesque.txt`. Inter is also OFL 1.1 (Inter Project
Authors, [rsms/inter](https://github.com/rsms/inter)) — that license text is
*not* bundled here, so include it yourself if you redistribute the font files.
The TanStack logos are TanStack's marks; this kit is for representing TanStack,
not for reuse as your own branding.
