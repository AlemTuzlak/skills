# TanStack Palette

Every value verbatim from `src/styles/app.css` in `TanStack/tanstack.com`.
Ramps are 100 (lightest) → 500 (darkest). The **400** step is the saturated
brand step in light mode; **300** is its dark-mode counterpart.

## Ramps

### Green — `--color-ds-green-*` (Framework)
| Step | Hex |
|---|---|
| 100 | `#d8f0da` |
| 200 | `#a2e1a9` |
| 300 | `#69bc75` |
| 400 | `#39af46` |
| 500 | `#1d4226` |

### Terracotta — `--color-ds-terracotta-*` (Data & State)
| Step | Hex |
|---|---|
| 100 | `#f9d8c4` |
| 200 | `#edaa8d` |
| 300 | `#e06e49` |
| 400 | `#d3481b` |
| 500 | `#5f1a06` |

### Blue — `--color-ds-blue-*` (UI & UX, and the brand accent)
| Step | Hex |
|---|---|
| 100 | `#d8f0f3` |
| 200 | `#9cd5e2` |
| 300 | `#61adbf` |
| 400 | `#3aa3c4` |
| 500 | `#003e53` |

### Amber — `--color-ds-amber-*` (Performance)
| Step | Hex |
|---|---|
| 100 | `#fef6cc` |
| 200 | `#fae884` |
| 300 | `#f4d648` |
| 400 | `#ffa216` |
| 500 | `#624a00` |

### Purple — `--color-ds-purple-*` (creative accent; not a category)
| Step | Hex |
|---|---|
| 100 | `#cabfcc` |
| 200 | `#ca8ec5` |
| 300 | `#c56dcf` |
| 400 | `#b64cc7` |
| 500 | `#541f5d` |

### Neutrals — `--color-ds-neutral-*`
| Step | Hex | Role |
|---|---|---|
| 0 | `#ffffff` | white — UI surfaces only |
| 100 | `#eeebd4` | **cream — the brand background** |
| 200 | `#aea691` | warm gray — borders, dark-mode secondary text |
| 300 | `#756c5b` | muted text |
| 400 | `#3e3529` | charcoal — secondary text, Tooling accent |
| 500 | `#111111` | near-black — primary ink, dark background |

Cool tints, used where a warm neutral would muddy against another color:

| Token | Hex |
|---|---|
| `--color-ds-neutral-tint-100` | `#e8e7e5` |
| `--color-ds-neutral-tint-200` | `#c5c3bf` |

## Semantic tokens

Prefer these over raw ramp steps when building UI — they already encode the
light/dark switch.

| Token | Light | Dark |
|---|---|---|
| `text-primary` | `#111111` | `#ffffff` |
| `text-secondary` | `#3e3529` | `#aea691` |
| `text-muted` | `#756c5b` | `#756c5b` |
| `text-menu-title` | `#3e3529` | `#c5c3bf` |
| `text-accent` | `#003e53` | `#61adbf` |
| `text-disabled` | `#aea691` | `#3e3529` |
| `text-inverse` | `#ffffff` | `#111111` |
| `text-success` | `#1d4226` | `#69bc75` |
| `text-warning` | `#624a00` | `#f4d648` |
| `text-error` | `#5f1a06` | `#e06e49` |
| `text-info` | `#3aa3c4` | `#9cd5e2` |
| `background-default` | `#ffffff` | `#111111` |
| `background-surface` | `#ffffff` | `#1f1f1f` |
| `background-elevated` | `#ffffff` | `#2b2b2b` |
| `background-subtle` | `#fafafa` | `#1b1b1b` |
| `background-inverse` | `#111111` | `#ffffff` |
| `border-default` | `#aea691` | `#2d2d2d` |
| `border-strong` | `#3e3529` | `#aea691` |
| `border-subtle` | `#eeebd4` | `#232323` |
| `border-focus` | `#3aa3c4` | `#61adbf` |
| `border-error` | `#d3481b` | `#e06e49` |
| `border-success` | `#39af46` | `#69bc75` |
| `accent-brand` | `#003e53` | `#3aa3c4` |
| `accent-warm` | `#e06e49` | `#edaa8d` |
| `accent-highlight` | `#f4d648` | `#fae884` |
| `accent-nature` | `#39af46` | `#69bc75` |
| `accent-creative` | `#b64cc7` | `#c56dcf` |
| `surface-state-hover` | `#1111110f` (black 6%) | `#ffffff14` (white 8%) |
| `surface-state-pressed` | `#1111111f` (black 12%) | `#ffffff1f` (white 12%) |

Note the split: `background-default` is **white** in the app UI, but branded
surfaces (marketing pages, OG images, banners, video) use cream `#eeebd4`. Both
are correct in their own context — don't put a marketing hero on white, and
don't put a data table on cream.

## Category accents

Library → category comes from `src/libraries/categories.ts`; unlisted ids
default to Tooling.

| Category | Label | Libraries | Light | Dark |
|---|---|---|---|---|
| `framework` | Framework | start, router | `#39af46` | `#69bc75` |
| `data` | Data & State | query, db, store, ai | `#d3481b` | `#e06e49` |
| `ui` | UI & UX | table, charts, form, hotkeys, markdown, highlight | `#3aa3c4` | `#61adbf` |
| `performance` | Performance | virtual, pacer | `#ffa216` | `#f4d648` |
| `tooling` | Tooling | devtools, config, cli, intent, ranger, mcp, workflow, react-charts, create-tsrouter-app | `#3e3529` | `#c5c3bf` |

Display order is Framework → Data & State → UI & UX → Performance → Tooling.

**Tooling's dark step is deliberately `#c5c3bf` (`neutral-tint-200`), not the
site's `#aea691`.** On a dark banner `#aea691` collides with secondary text and
flattens the hierarchy. Keep the tint.

## Render surfaces

What tanstack.com's own image renderers use — match these when hand-building a
banner, card, or video frame:

| Theme | Background | Secondary text |
|---|---|---|
| light | `#eeebd4` | `#3e3529` |
| dark | `#111111` | `#aea691` |

## Shadows

| Token | Value |
|---|---|
| `--shadow-xs` | `0 1px 2px 0 rgba(0,0,0,0.03)` |
| `--shadow-sm` | `0 1px 3px 0 rgba(0,0,0,0.05), 0 1px 2px 0 rgba(0,0,0,0.03)` |
| `--shadow-2xl` | `0 25px 50px -12px rgba(0,0,0,0.2)` |
| `--shadow-3xl` | `0 35px 60px -15px rgba(0,0,0,0.25)` |
| `--shadow-inset` | `inset 0 2px 4px 0 rgba(0,0,0,0.04)` |

Note how low the opacities are — 3–5% for the everyday steps. That restraint is
the brand. The 2xl/3xl steps exist for modals and overlays, not cards.

## Contrast

Measured ratios, not estimates. AA needs 4.5:1 for body text, 3:1 for large
text (≥24px, or ≥19px bold).

| Foreground | Background | Ratio | Verdict |
|---|---|---|---|
| `#111111` | `#eeebd4` | 15.71 | AA body — the primary pairing |
| `#3e3529` | `#eeebd4` | 10.00 | AA body — secondary text |
| `#756c5b` | `#eeebd4` | 4.31 | **large text only** — just under AA body |
| `#ffffff` | `#111111` | 18.88 | AA body — dark primary |
| `#aea691` | `#111111` | 7.79 | AA body — dark secondary |
| `#c5c3bf` | `#111111` | 10.73 | AA body |

**Light-mode accents on cream mostly fail as text.** This is the trap:

| Accent on `#eeebd4` | Ratio | Verdict |
|---|---|---|
| `#d3481b` terracotta | 3.71 | large text only |
| `#3aa3c4` blue | 2.42 | FAIL — fills and rules only |
| `#39af46` green | 2.36 | FAIL — fills and rules only |
| `#ffa216` amber | 1.67 | FAIL — never as text on cream |

So on cream, accents are for **marks, fills, keylines, and display-size
headings** — not body copy, not small labels. A library name at
`display-lg`/`display-xl` in its accent is fine; a 14px accent-colored caption
is not.

**Dark-mode accents on near-black all pass**, which is why the 300 step exists:

| Accent on `#111111` | Ratio |
|---|---|
| `#f4d648` amber | 13.09 |
| `#69bc75` green | 8.14 |
| `#61adbf` blue | 7.41 |
| `#e06e49` terracotta | 5.84 |
