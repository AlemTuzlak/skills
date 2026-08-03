# Visual design, type, motion

CSS decides whether text can be read, whether a layout survives zoom, and whether an animation makes
someone sick. These are code decisions, not design decisions you can defer.

---

## Contrast

| Thing | AA | AAA |
|---|---|---|
| Body text (< 24px, or < 19px bold) | 4.5:1 | 7:1 |
| Large text (≥ 24px, or ≥ 19px bold) | 3:1 | 4.5:1 |
| UI component boundaries, icons, focus rings, chart lines (1.4.11) | 3:1 | 3:1 |

Check the **rendered** colours, not the palette. The states people forget: hover, active, visited,
placeholder, disabled, the focus ring, text over an image or gradient, `::selection`, form input
borders, and every one of these again in dark mode.

Low contrast text is on ~84% of home pages on the web. It is the single most common accessibility
failure and the easiest to avoid.

Notes:

- Contrast is not required for a genuinely disabled control, but if users must read it, it needs contrast.
  Prefer keeping the button enabled and explaining the error.
- Placeholder text almost always fails. One more reason not to use placeholders as labels.
- Text over an image needs a scrim, a solid panel, or `text-shadow` — not hope.
- Pure `#000` on pure `#fff` is uncomfortable for many dyslexic and light-sensitive readers. Very dark
  grey on off-white is kinder and still passes easily.
- Colour must never be the only signal (1.4.1). Add an icon, text, underline, or pattern. Check by
  viewing the page in greyscale.
- Links inside body text need to be distinguishable from the text without colour — underline them
  (a 3:1 contrast difference against the surrounding text alone is not enough for most designs).

---

## Type and zoom

```css
:root { font-size: 100%; }            /* respect the user's setting — never px here */
body  { font-size: 1rem; line-height: 1.5; }
h1    { font-size: clamp(1.75rem, 4vw, 3rem); }   /* rem bounds, not px bounds */
p     { max-width: 70ch; }            /* line length matters for dyslexic readers */
```

- `rem` scales with the user's browser font size. `px` on `:root`, `html`, or `body` silently ignores
  someone who set 24px because they cannot read 16px.
- `em` is fine for a child that should scale relative to its parent (`code` inside a `p`).
- In `clamp()`/`min()`/`max()`, the **bounds** must be `rem` too. `clamp(12px, 2vw, 36px)` caps text at
  36px no matter what the user asked for.
- Viewport units alone (`font-size: 2vw`) do not respond to user font settings at all. Always pair with
  `rem` inside `clamp()`.

Two things to actually test:

- **Resize text to 200%** (1.4.4 AA) — browser zoom or font-size setting. Nothing clipped, nothing lost.
- **Reflow** (1.4.10 AA) — at 320 CSS px wide (equivalent to 400% zoom on a 1280px screen), content
  must not require scrolling in two directions. Only data tables, maps, and code blocks are exempt, and
  those go in their own `overflow-x: auto` container.
- **Text spacing** (1.4.12 AA) — nothing may clip when a user forces line-height 1.5×, paragraph
  spacing 2×, letter-spacing 0.12em, word-spacing 0.16em. Fixed-height text containers are the usual
  cause. Use `min-height`, not `height`.

Other type rules:

- Do not put text in images (1.4.5). It cannot be resized, translated, recoloured, or selected.
- Use real text and `text-transform: uppercase` rather than typing IN CAPS — some screen readers spell
  capitalised words letter by letter, and the original casing stays available.
- Do not justify body text; the uneven word gaps ("rivers") are hard for dyslexic readers.
- Left-align LTR languages, right-align RTL. Use logical properties (`margin-inline-start`,
  `padding-block`, `inset-inline`) so RTL works without a second stylesheet.

---

## Motion and animation

Vestibular disorders make large motion physically sickening. Flashing can trigger seizures. Motion is
not a free layer of polish.

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

That blanket rule is a safety net, not the design. Better: keep short opacity fades and drop the
transforms, parallax, zoom, and spin.

- **Nothing flashes more than 3 times per second. Ever.** No `prefers-reduced-motion` exemption — this
  is a seizure risk, not a preference (2.3.1).
- Anything moving, blinking, scrolling, or auto-updating for more than 5 seconds needs a
  pause/stop/hide control (2.2.2). Carousels, marquees, animated backgrounds, live tickers.
- Do not autoplay video with motion, and never autoplay audio (1.4.2).
- Respect reduced motion in JS too: `window.matchMedia('(prefers-reduced-motion: reduce)').matches`
  before running a GSAP/Framer/Lottie timeline. Listen for `change` — people toggle it mid-session.
- Auto-advancing carousels: stop on hover and on focus, and give a visible pause button.

## Scroll

- Do not hijack scroll. Scrolljacking, custom scroll speed, and "smooth" scroll libraries break
  keyboard scrolling, break Page Up/Down, break screen-reader cursors, and cause motion sickness.
- `scroll-behavior: smooth` belongs behind `prefers-reduced-motion`.
- Scroll-driven animations (`animation-timeline: scroll()`/`view()`) are CSS-native and cheap, but they
  are still motion — gate them on `prefers-reduced-motion`.
- `scroll-snap` that cannot be escaped is a trap. Test it with keyboard only.
- Infinite scroll needs a keyboard-reachable "load more" and must not destroy focus. It also strands
  anyone who needs the footer.
- Give sticky headers a matching `scroll-padding-top` on the scroll container, or focused elements land
  underneath them (2.4.11).

---

## User preference media queries

Support these; each one is a user telling you what they need.

```css
@media (prefers-reduced-motion: reduce) { }     /* vestibular, ADHD, motion sickness */
@media (prefers-contrast: more)         { }     /* boost contrast, thicken borders */
@media (prefers-contrast: less)         { }     /* soften for light sensitivity */
@media (prefers-color-scheme: dark)     { }     /* re-check every contrast ratio here */
@media (prefers-reduced-transparency: reduce) { } /* drop the frosted glass */
@media (forced-colors: active)          { }     /* Windows High Contrast */
@media (scripting: none)                { }     /* JS blocked or failed */
```

Read them in JS the same way, and always listen for changes:

```js
const mq = window.matchMedia('(prefers-contrast: more)');
apply(mq.matches);
mq.addEventListener('change', (e) => apply(e.matches));
```

### Forced colors (Windows High Contrast)

The OS replaces your colours with a user-chosen set. It **discards** `background-color`, `border-color`,
`box-shadow`, and `background-image` on many elements. Consequences:

- Focus rings built only from `box-shadow` vanish. Use `outline`.
- Anything conveyed only by a background colour (a selected chip, an active tab, a filled toggle)
  becomes invisible. Add a border, an underline, an icon, or text.
- Use the system colour keywords when you need to fix something up: `Canvas`, `CanvasText`,
  `LinkText`, `ButtonFace`, `ButtonText`, `Highlight`, `HighlightText`.
- `forced-color-adjust: none` exists for charts and colour pickers where the actual colour is the
  content. Use it there and nowhere else.

---

## Cursors and hover-only UI

- Never replace the system cursor with a custom image or a JS-follower blob. It breaks the size,
  contrast, and shape that a low-vision or cognitively impaired user has configured, and it lags.
- Nothing important may live behind hover alone. Hover does not exist on touch and does not exist for
  keyboards.
- Content that *does* appear on hover or focus (tooltip, popover, dropdown) must be (1.4.13 AA):
  **dismissible** without moving focus (Escape), **hoverable** — the pointer can travel into it without
  it vanishing, and **persistent** until dismissed, focus moves, or it is no longer valid. Do not use a
  timeout to hide it.
- `@media (hover: hover)` is for progressive enhancement, not for gating functionality.

---

## Layout order

Screen readers, keyboards, and the accessibility tree all follow **DOM order**. CSS can move things
visually and it does not move any of that.

Never use these to reorder meaningful content: `order:`, `flex-direction: row-reverse` /
`column-reverse`, `grid-row`/`grid-column` placement, `position: absolute`, `float`, or `direction`.
Reorder the DOM instead, and use CSS only for presentation. (WCAG 1.3.2 Meaningful Sequence, 2.4.3
Focus Order.)

Also watch out: `display: contents` and setting `display: flex`/`grid`/`block` on `<table>`, `<tr>`,
`<td>`, `<ul>`, or `<li>` can strip the element's semantics in some browsers. If you must, restore the
role explicitly (`role="list"`, `role="row"`) and verify in the accessibility tree.

`list-style: none` is the common case: Safari drops list semantics, so add `role="list"` to the `<ul>`.

---

## Mobile and touch

- `<meta name="viewport" content="width=device-width, initial-scale=1">` — nothing more. `user-scalable=no`
  or `maximum-scale=1` blocks pinch zoom and fails WCAG 1.4.4.
- Never lock orientation (1.3.4 AA). Portrait-only breaks anyone with a wheelchair-mounted device.
- No horizontal page scroll at 320px.
- Touch targets: 44×44 with real gaps between them. Leave a scrollable margin so a user can scroll a
  list without activating a row.
