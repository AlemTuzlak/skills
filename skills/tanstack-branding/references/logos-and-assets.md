# TanStack Logos and Assets

The mark is a **palm tree on an island** inside a rounded-rectangle emblem, with
a heavy geometric `TANSTACK` wordmark. Three lockups, four colorways.

## Inventory — `assets/logos/`

### Emblem (square-ish, 64.04 × 83.84)
Mark only. Avatars, favicons, app icons, tight spaces, video stingers.

| File | Ink |
|---|---|
| `tanstack-emblem-black.svg` | `#121212` |
| `tanstack-emblem-charcoal.svg` | `#3a3a38` |
| `tanstack-emblem-cream.svg` | `#ece8d1` |
| `tanstack-emblem-white.svg` | `#ffffff` |
| `tanstack-emblem-charcoal-256.png` | 256px raster, for renderers |
| `tanstack-emblem-cream-256.png` | 256px raster, for renderers |

### Landscape (321.33 × 50, ≈6.4:1)
Emblem + wordmark side by side. Headers, navbars, README banners, wide footers.

| File | Ink |
|---|---|
| `tanstack-landscape-black.svg` | `#121212` |
| `tanstack-landscape-charcoal.svg` | `#3a3a38` |
| `tanstack-landscape-white.svg` | white (`currentColor`-style, no explicit hex) |
| `tanstack-landscape-black-640.png` | 640px raster, for renderers |

### Stacked (212.66 × 83.84, ≈2.5:1)
Emblem above wordmark. Posters, merch, vertical layouts, splash and title cards.

| File | Ink |
|---|---|
| `tanstack-stacked-black.svg` | `#121212` |
| `tanstack-stacked-charcoal.svg` | `#3a3a38` |
| `tanstack-stacked-cream.svg` | `#ece8d1` |
| `tanstack-stacked-white.svg` | white |

Note the mark inks are near-but-not-equal to the palette neutrals — `#121212`
vs `#111111`, `#ece8d1` vs `#eeebd4`, `#3a3a38` vs `#3e3529`. That's how the
assets ship. Use the files as-is rather than "correcting" them to token values.

## Choosing a variant

| Surface | Lockup | Colorway |
|---|---|---|
| Cream `#eeebd4` marketing page | landscape or stacked | black or charcoal |
| White app chrome | landscape | black |
| Near-black `#111111` | landscape or stacked | white; emblem → cream |
| Photo / busy background | emblem | white or black, whichever separates |
| Avatar, favicon, icon | emblem | charcoal on light, cream on dark |
| Poster, sticker, shirt | stacked | any, one ink |

## Rules

1. **Keep the original proportions.** Scale, never stretch.
2. **Leave clear space around the mark.** No text or edge crowding it.
3. **Dark marks on light surfaces, light marks on dark surfaces.**
4. **Never recolor the mark to an accent.** Black, charcoal, cream, or white — that's the whole set.
5. **Don't reconstruct it.** Use these files; don't redraw the palm or reset the wordmark.
6. **Don't add effects.** No shadow, glow, outline, gradient, or bevel on the mark.

## Fonts — `assets/fonts/`

| File | Use |
|---|---|
| `BricolageGrotesque-Bold.ttf` | Display / headings |
| `Inter-Regular.ttf` | Body (400) |
| `Inter-ExtraBold.ttf` | Heavy UI emphasis |
| `Inter-Black.ttf` | Maximum weight |
| `Inter-latin.woff2` | Web-optimized subset |
| `Inter-latin-ext.woff2` | Web-optimized extended subset |
| `OFL-Bricolage-Grotesque.txt` | Bricolage license (SIL OFL 1.1) |

Web embedding:

```css
@font-face {
  font-family: 'Bricolage Grotesque';
  src: url('./assets/fonts/BricolageGrotesque-Bold.ttf') format('truetype');
  font-weight: 700;
  font-display: swap;
}
@font-face {
  font-family: 'Inter';
  src: url('./assets/fonts/Inter-latin.woff2') format('woff2');
  font-weight: 100 900;
  font-display: swap;
}
```

Prefer the `woff2` files on the web (smaller); the `ttf` files exist because
image and video renderers usually need TrueType.

## Generated banners — use the endpoints, don't hand-build

tanstack.com renders branded images on demand. Hitting an endpoint beats
recreating a layout by hand.

### OG / social cards — 1200 × 630

```
https://tanstack.com/api/og/<libraryId>.png
  ?title=<override heading>
  &description=<override subline>
```

Example: `https://tanstack.com/api/og/query.png?title=Overview&description=Guides%20and%20API%20reference`

Unknown library → 404.

### README headers — 1800 × 450

**Status: added in `TanStack/tanstack.com` PR #1076 — confirm it has merged
before relying on it.**

```
https://tanstack.com/api/readme/<libraryId>.png
  ?framework=<react|solid|vue|…>   # must be valid for that library, else 400
  &theme=<light|dark>              # default light; invalid → 400
  &title=<replaces the whole name>
  &subtitle=<replaces the tagline>
```

`framework` produces the qualified name — `?framework=react` on `start` renders
"TanStack React / Start". Both themes exist so a README can serve the right one
via `<picture>`:

```html
<picture>
  <source media="(prefers-color-scheme: dark)"
          srcset="https://tanstack.com/api/readme/query.png?theme=dark">
  <img src="https://tanstack.com/api/readme/query.png" alt="TanStack Query">
</picture>
```

Both endpoints render server-side with these same fonts and category accents, so
their output is on brand by construction.

## Other brand material in tanstack.com

Not bundled here, but worth knowing about:

| Path | What |
|---|---|
| `/brand-guide` | Live download page: current marks plus a previous-assets archive |
| `/ds` | 22-page design-system explorer — palette, semantic tokens, typography, shadows, effects, iconography, and per-component pages |
| `media/brand.sketch` | Source design file |
| `scripts/generate-brand-assets.mjs` | Regenerates the raster variants (needs `sharp`) |
| `public/images/hero-palm-gradient*.{webp,jpg}` | Hero background imagery |
| `src/blog/tanstack-has-a-new-look.md` | The rebrand writeup |

Icons: TanStack uses **Phosphor Icons** (`@phosphor-icons/react`). Match that
family rather than mixing icon sets.
