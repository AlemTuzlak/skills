---
name: tanstack-branding
description: Use when designing or building anything that should look like TanStack — a landing or dashboard page, an OG/social image, a README header, a video or motion graphic, slides, a diagram, merch, or an email. Also use when reviewing whether an existing design is on brand, or when you need exact TanStack colors, fonts, logo files, or category accents. Triggers on "TanStack branding", "our branding", "TanStack colors", "on brand", "brand guidelines", "TanStack logo".
---

# TanStack Branding

Everything needed to produce on-brand TanStack output: exact tokens, the real
font and logo files, and the rules that make a thing read as TanStack rather
than as generic dev-tool blue.

**The one-sentence brand:** warm cream paper, near-black ink, a palm emblem, one
saturated accent per surface — calm and printed-looking, never neon, never
glassy, never gradient soup.

## The five decisions

Get these right and it reads as TanStack. Get them wrong and nothing else saves it.

| Decision | Answer |
|---|---|
| Background | Cream `#eeebd4` (light) or near-black `#111111` (dark). **Not white.** White is a UI surface, not a brand surface. |
| Ink | `#111111` on cream; `#ffffff` on near-black. Secondary text `#3e3529` / `#aea691`. |
| Display type | **Bricolage Grotesque Bold** — headings, library names, big numbers only. |
| Body type | **Inter** — everything else. Body weight is light (300), not regular. |
| Accent | Exactly **one** per surface, taken from the library's category (table below). Never two accents competing. |

## Category accents

A library's accent is not chosen — it is inherited from its category. Look up
the library, use that color.

| Category | Libraries | Light (400) | Dark (300) |
|---|---|---|---|
| Framework | Start, Router | `#39af46` green | `#69bc75` |
| Data & State | Query, DB, Store, AI | `#d3481b` terracotta | `#e06e49` |
| UI & UX | Table, Charts, Form, Hotkeys, Markdown, Highlight | `#3aa3c4` blue | `#61adbf` |
| Performance | Virtual, Pacer | `#ffa216` amber | `#f4d648` |
| Tooling | Devtools, Config, CLI, Intent, Ranger, MCP, Workflow | `#3e3529` charcoal | `#c5c3bf` |

Anything not listed is Tooling. Accents step *up* in lightness on dark
surfaces — a light-mode accent on near-black is a contrast failure, not a
shortcut.

For the full token set (neutrals, semantic tokens, all five ramps, both modes),
read `references/palette.md`.

## Assets in this skill

Real files, ready to embed — no downloading, no guessing at hexes.

```
assets/logos/     14 files — emblem / landscape / stacked, in black, charcoal, cream, white
assets/fonts/     Bricolage Grotesque Bold, Inter (ttf + woff2), plus OFL license
```

Pick the logo by surface, not by preference:

| Surface | File |
|---|---|
| Cream / light | `tanstack-landscape-black.svg` or `-charcoal.svg` |
| Near-black / dark | `tanstack-landscape-white.svg`; emblem → `tanstack-emblem-cream.svg` |
| Square / avatar / favicon | `tanstack-emblem-*.svg` |
| Vertical / poster / merch | `tanstack-stacked-*.svg` |
| Raster needed (video, canvas, OG) | `tanstack-landscape-black-640.png`, `tanstack-emblem-charcoal-256.png`, `tanstack-emblem-cream-256.png` |

Logo rules — short, and all three matter: keep original proportions, leave
clear space around the mark, and put dark marks on light surfaces / light marks
on dark. Never recolor a mark to an accent.

Full inventory, the live banner endpoints, and embedding recipes (CSS
`@font-face`, HTML/canvas, video runtimes): `references/logos-and-assets.md`.

## Layout, depth, and motion

TanStack surfaces are calm. The house rules, condensed:

- Fewer, larger containers over many small sections. Spacing separates before effects do.
- Rounded corners, subtle radii. Soft low-contrast shadows, one or two layers, max.
- Cards must feel grounded, not floating — and are not the default layout primitive.
- Surface contrast or translucency instead of hard outlines.
- Micro-transitions that reinforce spatial relationships. No spring, no bounce, no parallax theatre.

**Avoid:** chunky shadows, neumorphism, over-designed card grids, glassmorphism
as the main idea, neon-on-dark, multi-color gradients.

**The test:** if depth doesn't improve comprehension, remove it.

Full rules plus type scale and motion specifics: `references/layout-and-type.md`.

## Workflows

**Building a page or dashboard view.** Cream or near-black surface → Bricolage
headings, Inter body at 300 → one category accent → borders from
`--color-border-default`, not arbitrary grays. If it's inside tanstack.com,
prefer the existing `--color-*` CSS tokens and the `/ds` component pages over
new values; this skill is the source of truth only outside that codebase.

**Making an OG image, README header, or social card.** Don't hand-build it —
tanstack.com already renders them. `references/logos-and-assets.md` has the
endpoints, including light/dark and per-framework variants. Hand-build only for
a surface those endpoints don't cover.

**Making a video or motion graphic.** Cream or near-black stage, one accent for
the whole piece, Bricolage for titles and Inter for lower-thirds. Motion is
restrained: opacity and small transforms, no springy overshoot. Pair with the
`hyperframes` skills for the composition itself — this skill supplies the
palette, fonts, and logo files.

**Reviewing a design.** Walk the five decisions in order. Most "feels off but I
can't say why" comes from a white background, two accents, or Inter used where
Bricolage belongs.

## Common mistakes

| Mistake | Fix |
|---|---|
| White page background | Cream `#eeebd4`. White is for cards and inputs. |
| Two or more accents on one surface | One accent, from the library's category. |
| Bricolage in body copy | Bricolage is display-only. Inter for body. |
| Body text at weight 400+ | Body is 300. 400 is for small/`body-sm` sizes. |
| Light-mode accent on dark surface | Use the dark (300) step. |
| Recoloring the palm mark to an accent | Marks are black, charcoal, cream, or white. Nothing else. |
| Grabbing a hex from a screenshot | Every value is in `references/palette.md`. |
| Inventing an accent for a new library | Assign it a category; inherit the color. |

## Provenance

Values extracted from `TanStack/tanstack.com`: `src/styles/app.css` (tokens),
`src/libraries/categories.ts` (category map), `src/server/og/colors.ts` (render
literals), `.agents/ui-style.md` (layout rules). If tanstack.com's tokens change,
that repo wins — re-extract rather than trusting a stale copy here.
