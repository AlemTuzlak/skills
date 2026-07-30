# TanStack Type, Layout, and Motion

## Fonts

| Role | Family | Where used |
|---|---|---|
| Display | **Bricolage Grotesque** (Bold, 700) | Headings, library names, big numbers, titles |
| Body / UI | **Inter** | Everything else |
| Mono | **IBM Plex Mono** | Code, technical labels |

Full CSS stacks as declared in `app.css`:

```css
--font-sans:       'Inter', ui-sans-serif, system-ui, sans-serif,
                   'Apple Color Emoji', 'Segoe UI Emoji', Segoe UI Symbol, 'Noto Color Emoji';
--font-ds-display: 'Bricolage Grotesque', ui-sans-serif, system-ui, sans-serif;
--font-ds-mono:    'IBM Plex Mono', ui-monospace, SFMono-Regular, Menlo, monospace;
```

The shop/merch surfaces use a separate pair — `DM Sans` display and `DM Mono` —
which is intentional and scoped to shop pages only. Don't carry DM Sans into
general TanStack work.

Font files ship in `assets/fonts/`. Bricolage Grotesque is SIL Open Font License
1.1 (`OFL-Bricolage-Grotesque.txt` included). Inter is also OFL 1.1 (Inter
Project Authors, github.com/rsms/inter) — the license text is not bundled here,
so include it yourself if you redistribute the font files.

## Type scale

Verbatim tokens. Format: size / line-height / weight, plus tracking where set.

### Display — Bricolage Grotesque
| Token | Size | Line | Tracking | Weight |
|---|---|---|---|---|
| `display-2xl` | 96px | 96px | -1px | 800 |
| `display-xl` | 72px | 76px | -0.8px | 700 |
| `display-lg` | 56px | 60px | -0.5px | 700 |
| `display-md` | 48px | 53px | -0.3px | 500 |
| `display-sm` | 40px | 46px | — | 500 |

Negative tracking tightens as size grows — keep it, or big type looks loose and
un-set.

### Headings
| Token | Size | Line | Weight |
|---|---|---|---|
| `heading-1` | 36px | 41px | 500 |
| `heading-2` | 28px | 34px | 500 |
| `heading-3` | 24px | 29px | 700 |
| `heading-4` | 20px | 25px | 700 |
| `heading-5` | 16px | 21px | 700 |
| `heading-6` | 14px | 18px | 500 |

### Body — Inter
| Token | Size | Line | Weight |
|---|---|---|---|
| `body-xl` | 20px | 32px | 300 |
| `body-lg` | 18px | 28px | 300 |
| `body-md` | 16px | 24px | 300 |
| `body-sm` | 14px | 20px | 400 |
| `body-xs` | 12px | 17px | 400 |

**Body is light (300) down to 16px, then steps up to 400 for 14px and below.**
That crossover is deliberate — 300 gets too fragile at small sizes. Using 400
everywhere is the single most common way to make TanStack body copy look wrong.

### Labels
| Token | Size | Line | Tracking | Weight |
|---|---|---|---|---|
| `label-lg` | 16px | 19px | — | 500 |
| `label-md` | 14px | 17px | — | 500 |
| `label-sm` | 12px | 14px | 0.5px | 500 |

### Mono — IBM Plex Mono
| Token | Size | Line | Weight |
|---|---|---|---|
| `mono-display` | 24px | 31px | 400 |
| `mono-lg` | 18px | 27px | 400 |
| `mono-md` | 16px | 24px | 300 |
| `mono-sm` | 14px | 21px | 300 |
| `mono-xs` | 12px | 16px | — |

## The signature heading pattern

Library names are set as two stacked lines: `TanStack` small and neutral, the
library name large and in its category accent. Used on the site, OG images, and
README headers — it is the most recognizable TanStack typographic move.

```
TanStack          ← Inter or Bricolage, small, text-secondary
Query             ← Bricolage Bold, display size, category accent
```

With a framework qualifier the label goes inside the prefix line, not the name:
`TanStack React` / `Start` — never `TanStack` / `React Start`.

## Layout

- Fewer, well-defined containers over many small sections.
- Generous spacing creates separation **before** you reach for visual effects.
- Cards are fine when they express grouping or hierarchy — not as the default layout primitive.
- Cards should feel grounded, not floating: light elevation, border plus shadow, or surface contrast.
- Surface contrast or translucency instead of strong outlines.
- Glass/frosted effects are acceptable only when subtle and accessible.

## Corners

- Rounded corners are standard.
- Subtle radii that feel intentional, not playful.
- Avoid sharp 90° corners unless deliberately industrial.

## Depth

- Soft, low-contrast, diffused shadows.
- Shadows imply separation, not elevation theatrics.
- One to two shadow layers, max.
- No heavy drop shadows, no strong directional lighting.

## Interaction and motion

- Micro-transitions that reinforce spatial relationships.
- Hover/focus states feel responsive, not animated.
- No excessive motion, no springy overshoot.
- For anything beyond a hover state, the `design-motion-principles` skill in
  `TanStack/tanstack.com` (`.agents/skills/design-motion-principles/`) covers
  choreography, accessibility, and performance in depth.

Video and motion-graphic specifics: hold one accent for the whole piece, animate
opacity and small transforms, let type land rather than bounce. A TanStack video
should feel like a printed page being revealed, not a UI kit demo.

## What to avoid

- Chunky shadows
- Overly flat, sterile layouts
- Neumorphism as a primary style
- Over-designed card grids
- Neon-on-dark, multi-color gradients, gradient text
- White marketing backgrounds

**Summary: if depth does not improve comprehension, remove it.**
