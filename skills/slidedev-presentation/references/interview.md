# Interview extras (Slidev)

Run these **after** the `presentation` interview core, or skip if already
answered. One question at a time. Recommended default first.

## Branding-mode routing (from brand question)

| Brand answer | Mode | What the skill does |
|--------------|------|---------------------|
| Just colors/fonts/logo, or "no strong brand" | **Default** | Pick closest base theme (visual selection), apply brand colors/fonts/logo via headmatter + UnoCSS + scoped styles + a global logo layer |
| Points to a brand resource (doc/site/Figma/design system/reference deck) | **Resource-derived custom theme** | Derive palette/type/spacing from the resource and scaffold a custom Slidev theme/styles |
| "Keep it minimal / internal" | **Minimal** | Default theme + brand colors + logo only |

For **Default** mode, do the theme pick **visually**: show 2–4 candidate themes
matching brand/tone in the browser (gallery previews or a quick render) and let
the user choose.

## Export targets

Ask which exports beyond the live dev server: PDF / PPTX / hosted SPA. Skip if
the user already said none.
