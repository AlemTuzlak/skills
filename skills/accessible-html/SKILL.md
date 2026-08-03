---
name: accessible-html
description: Use whenever writing, editing, or reviewing markup or UI code — HTML, JSX/TSX, Vue/Svelte/Angular templates, web components, email HTML, or CSS that affects text size, color, focus, motion, layout order, or hit area. Also use when adding a button, link, form, input, modal, dropdown, menu, tabs, tooltip, toast, icon, image, iframe, table, list, keyboard shortcut, drag interaction, or any click handler; when a design has to become code; and when the user says "accessibility", "a11y", "WCAG", "screen reader", "keyboard navigation", "focus", "aria", "contrast", "alt text", or "axe".
---

# accessible-html

Accessible markup is not a pass you make later. It is how you write the markup the first time.
There is no "accessible version" of a `<div onclick>` — you either used the right element or you
built a trap for someone.

**One rule above all: use the native HTML element that already does the job.** Native elements ship
focus, keyboard handling, state, and a role for free. Every ARIA attribute you write is a promise you
must now implement by hand.

Target **WCAG 2.2 Level AA** unless told otherwise. That is the normal legal and contractual bar.

## Non-negotiables (every file, every time)

| Do this | Never this |
|---|---|
| `<button type="button">` for actions, `<a href>` for navigation | `<div onclick>`, `<span onclick>`, `<div role="button">`, `<a>` with no `href` |
| `<label for=id>` or a wrapping `<label>` on every input | placeholder as the only label |
| Every image has `alt` — describe it, or `alt=""` if decorative | missing `alt`; `alt="image"`, `alt="icon"`, filename as alt |
| Real accessible name on every control (visible text, or visually-hidden text beside an `aria-hidden="true"` icon) | icon-only button with no name; empty link; `title` as the name |
| One `<h1>`, then `h2`→`h3`→`h4` with no skipped level | headings chosen for how big the text looks |
| `<html lang="en">`; `lang` on foreign phrases too | no `lang` |
| Landmarks: `<header> <nav> <main> <footer>`; one `<main>`; label each `<nav>` | div soup |
| `<title>` unique per page; skip link to `<main>` | same title everywhere |
| Every `<iframe>` has a `title` | untitled embeds |
| Real lists in `<ul>/<ol>/<dl>`; add `role="list"` if you set `list-style: none` | fake lists of divs |
| Text contrast ≥ 4.5:1 (≥ 3:1 large text, UI borders, icons, focus rings) | grey-on-grey; "design QA will catch it" |
| `rem` for font size, including `clamp()` bounds | `px` font size on `:root`/`html`/`body` |
| Visible focus ring: `:focus-visible`, ≥ 2px, ≥ 3:1 contrast, uses `outline` | `outline: none`; ring only from `box-shadow` |
| DOM order == visual order | `flex-direction: row-reverse`, `order:`, or grid placement to reorder content |
| Interactive targets ≥ 24×24 CSS px (aim 44×44 on touch) | 12px icon hit areas |
| `<table>` + `<caption>` + `<th scope>` for data | tables for layout; div grids for tabular data |
| `<meta name="viewport" content="width=device-width, initial-scale=1">` | `user-scalable=no`, `maximum-scale=1` |
| Unique `id` per element | duplicate ids (silently breaks `for` and `aria-labelledby`) |

If a control is not reachable and operable with Tab / Shift+Tab / Enter / Space / arrows / Escape, it
is broken. A keyboard user cannot use your feature at all — that is not a "nice to have".

Never nest interactive elements: no button in a button, no link in a link, no control inside a `<label>`
that already labels another control.

## The four rules of ARIA

1. Native element first. Always. `<button>` over `role="button"`.
2. Do not change native semantics. Wrap instead: `<div role="tab"><h3>…</h3></div>`, not `<h3 role="tab">`.
3. Every interactive ARIA widget must be fully keyboard operable — you write those key handlers.
4. Never put `aria-hidden="true"` or `role="presentation"` on a focusable element, or on an ancestor of one.

**No ARIA is better than bad ARIA.** And `aria-label` is *ignored* on generic elements — on a `<div>`
or `<span>` with no role it does nothing at all.

## Naming things

- Visible text is the best accessible name. Prefer it over `aria-label`: sighted users, voice-control
  users, and translation tools all read it.
- **Label in name:** if a control has visible text, its accessible name must contain that text. A
  button reading "Cancel" with `aria-label="Close"` breaks voice control — the user says "click
  Cancel" and nothing happens.
- `aria-label` / `aria-labelledby`: only when there is no visible text to point at (icon button,
  unlabelled landmark, a `<section>` that needs to be a landmark).
- `aria-describedby` for hints. `aria-errormessage` + `aria-invalid="true"` for errors.
- `title` is not an accessible name. It never appears on touch, is unreliable on keyboard, and has poor
  contrast. Use a real label.
- Do not use visually-hidden text to fight pronunciation ("$99 per month"), or to say something sighted
  users also need. If the text is needed, show it.
- Same link text to different destinations is a bug. "Read more about accessible design", not "Read more".
  Say when a link opens a new tab.

## Do not surprise the user

- No change of context on focus or on input. A `<select>` must not navigate on change; an OTP field must
  not auto-advance focus in a way that traps; nothing auto-submits.
- No `autofocus`. No stealing focus on load.
- Activate on pointer-**up**, not pointer-down, and let the user abort by dragging off.
- Session timeouts must be extendable, and warn before expiring.
- Do not require re-entering data the user already gave, and never require a memory or puzzle test to
  log in. Do not block paste in password fields.
- Errors: text, not colour alone. Say what to do. Move focus to the error summary or first bad field.

## Then read the reference you need

- `references/keyboard-and-focus.md` — focus indicators, `tabindex` (and why positive values are
  poison), roving tabindex, programmatic `focus()`, focus order and traps, focus return, keyboard
  shortcuts. Read before writing any key handler.
- `references/components.md` — dialog, popover, dropdown/menu, combobox, tabs, disclosure, tooltip,
  live regions, forms, tables, drag, carousels, media, icons. Each has an exact key map, ARIA state,
  and focus behaviour. **Read before you write one** — guessing produces a component that looks right
  and is unusable.
- `references/visual-and-motion.md` — contrast, type scale, zoom and reflow, text spacing, colour,
  motion and animation, scroll behaviour, cursors, forced-colors, user preference media queries.
- `references/audit.md` — the verification pass and tooling. Run before you say it's done.

## Red flags — stop, you are about to ship an inaccessible UI

- "I'll add `aria-label` to make this div accessible."
- "It's just a wrapper, no one tabs to it."
- "The designer specified this grey." / "The design has no visible label, so placeholder is fine."
- "Accessibility is a follow-up ticket / separate PR."
- "It's an internal tool, no one with a disability uses it."
- "Screen readers probably handle that."
- "Removing the outline looks cleaner; we have a hover state."
- "I'll copy the ARIA from a Stack Overflow answer."
- "I'll just bump this one `tabindex` to 1."
- "`role="menu"` sounds right for this dropdown of links."
- "Users can zoom out if it doesn't fit."

All of these mean: use the native element, give it a real name, keep the focus ring, and open the
matching reference file.

## Common mistakes

| Mistake | Fix |
|---|---|
| `<div role="button" tabindex="0">` | `<button type="button">`; reset styles with CSS |
| Clickable card as one big `<a>` around nested buttons | One `<a>` on the title, expanded by a pseudo-element overlay |
| Card click handled in JS `onclick` | Middle-click, Ctrl/Cmd-click, and "copy link" all break. Use a real `<a href>` |
| Toggle without state | `aria-expanded` on the trigger; `aria-pressed` for on/off |
| Custom modal | `<dialog>` + `showModal()`, or full focus trap + `inert` background + Escape + focus return |
| Loading spinner nobody hears | `aria-live="polite"` region, or `aria-busy` |
| `tabindex="1"`+ to reorder focus | Fix the DOM order. Only `0` and `-1` are ever correct |
| `tabindex="0"` on headings/divs "for convenience" | Screen readers already jump by heading. You just added junk tab stops |
| `list-style: none` | Add `role="list"` — Safari drops list semantics |
| Auto-playing motion / parallax / scrolljacking | `@media (prefers-reduced-motion: reduce)`, and never hijack scroll |
| Single-key shortcut like `/` or `j`/`k` | Must be off-able or remappable; ignore it while a field has focus |
| Icon-only button with `title` only | Visually-hidden text inside the button |
| Contrast checked on the design, not the render | Check hover, disabled, placeholder, focus ring, and text over images |

## Framework notes

- React `useId()` / Vue 3.5+ `useId()` for label/input/error ids. Angular: uuid per instance with a
  prop override. Never index-derive ids, and never let SSR and client ids diverge — that breaks
  `aria-labelledby` on hydration.
- Add `eslint-plugin-jsx-a11y` (or `eslint-plugin-vuejs-accessibility` / `svelte`'s built-in a11y
  warnings) and do not silence its rules. It catches most of the table above at lint time.
- Component libraries are still your responsibility. Verify the rendered DOM, not the prop names.
- Web components: focus does not cross shadow boundaries by itself — use `delegatesFocus: true`, and
  remember `aria-labelledby` cannot reference an id in another shadow root.
- SPA route change: move focus to the new `<h1>` (`tabindex="-1"`) and update `<title>`. Otherwise a
  screen reader user hears nothing after a click.
