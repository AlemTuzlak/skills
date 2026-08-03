---
name: accessible-html
description: Use whenever writing, editing, or reviewing markup or UI code — HTML, JSX/TSX, Vue/Svelte/Angular templates, web components, email HTML, or CSS that affects text size, color, focus, or motion. Also use when adding a button, link, form, input, modal, dropdown, menu, tabs, tooltip, toast, icon, image, table, or any click handler; when a design has to become code; and when the user says "accessibility", "a11y", "WCAG", "screen reader", "keyboard navigation", "aria", "contrast", "alt text", or "axe".
---

# accessible-html

Accessible markup is not a pass you make later. It is how you write the markup the first time.
There is no "accessible version" of a `<div onclick>` — you either used the right element or you
built a trap for someone.

**One rule above all: use the native HTML element that already does the job.** Native elements ship
focus, keyboard handling, state, and a role for free. Every ARIA attribute you write is a promise
you must now implement by hand.

## Non-negotiables (every file, every time)

| Do this | Never this |
|---|---|
| `<button type="button">` for actions, `<a href>` for navigation | `<div onclick>`, `<span onclick>`, `<div role="button">`, `<a>` with no `href` |
| `<label for=id>` or a wrapping `<label>` on every input | placeholder as the only label |
| Every image has `alt` — describe it, or `alt=""` if decorative | missing `alt`; `alt="image"`, `alt="icon"`, filename as alt |
| Give every control a real accessible name (visible text, or visually-hidden text next to an `aria-hidden="true"` icon) | icon-only button with no name; empty link |
| One `<h1>`, then `h2`→`h3`→`h4` with no skipped level | headings chosen for how big the text looks |
| `<html lang="en">` on every page | no `lang` |
| Landmarks: `<header> <nav> <main> <footer>`, one `<main>` per page | div soup |
| Text contrast ≥ 4.5:1 (≥ 3:1 for large text and for UI/graphic boundaries) | grey-on-grey, low-contrast placeholder, contrast "we'll fix in design QA" |
| `rem` for font size; `clamp(0.9rem, 2vw, 2rem)` | `px` font size on `:root`/`html`/`body`, or as the `clamp()` bounds |
| Keep the focus ring; restyle it if you must (`:focus-visible`) | `outline: none` |
| Interactive targets ≥ 24×24 CSS px | 12px icon hit areas |
| `<table>` with `<caption>` and `<th scope>` for data | tables for layout; grids of divs for tabular data |

If a control is not reachable and operable with Tab / Shift+Tab / Enter / Space / arrows, it is
broken. That is not a "nice to have"; a keyboard user cannot use your feature at all.

## The four rules of ARIA

1. Native element first. Always. `<button>` over `role="button"`.
2. Do not change native semantics. Wrap instead: `<div role="tab"><h3>…</h3></div>`, not `<h3 role="tab">`.
3. Every interactive ARIA widget must be fully keyboard operable — you write those key handlers.
4. Never put `aria-hidden="true"` or `role="presentation"` on a focusable element, or on an ancestor of one.

**No ARIA is better than bad ARIA.** `aria-label` on a `<div>` does not make it a button.

## Naming and describing

- Accessible name comes from visible text first. Prefer visible text over `aria-label` — visible
  text is also read by sighted, cognitive-load, and translation users.
- `aria-label` / `aria-labelledby`: only when there is no visible text to point at (icon button, an
  unlabelled landmark, a `<section>` that needs to be a landmark).
- `aria-describedby` for hints and help text. `aria-errormessage` + `aria-invalid="true"` for errors.
- Do not use visually-hidden text to fight pronunciation ("$99 per month"), and do not use it to
  say something sighted users also need. If the text is needed, show it.
- Same link text going to different places is a bug. "Read more about accessible design", not "Read more".

## Then check the two references

- **Interactive components** (dialog, dropdown/menu, combobox, tabs, disclosure, tooltip, toast/live
  region, drag, carousel, forms, tables): read `references/components.md` **before** you write one.
  Each pattern has an exact required keyboard map, ARIA state, and focus behaviour. Guessing produces
  a component that looks right and is unusable.
- **Before you say it's done**: run `references/audit.md`. It is the tab-through, the axe run, the
  zoom/contrast/motion pass, and the checklist.

## Red flags — stop, you are about to ship an inaccessible UI

- "I'll add `aria-label` to make this div accessible."
- "It's just a wrapper, no one tabs to it."
- "The designer specified this grey."
- "Accessibility is a follow-up ticket / separate PR."
- "It's an internal tool, no one with a disability uses it."
- "The design has no visible label, so placeholder is fine."
- "Screen readers probably handle that."
- "Removing the outline looks cleaner; we have a hover state."
- "I'll copy the ARIA from a Stack Overflow answer."

All of these mean: use the native element, give it a real name, keep the focus ring, and check
`references/components.md`.

## Common mistakes

| Mistake | Fix |
|---|---|
| Clickable card wrapping the whole thing in `<a>` with nested buttons | One `<a>` on the title; make the card clickable via a pseudo-element overlay |
| `<div role="button" tabindex="0">` | `<button type="button">`; reset styles with CSS |
| Toggle without state | `aria-expanded` on the trigger, `aria-pressed` for on/off |
| Custom modal | `<dialog>` + `showModal()`, or full focus trap + `inert` background + Escape + focus return |
| Loading spinner nobody hears | `aria-live="polite"` region, or `aria-busy` |
| Error summary that never gets announced | Move focus to it, or `role="alert"` |
| `tabindex="1"`+ to reorder focus | Fix the DOM order instead; only `0` and `-1` are ever correct |
| Auto-playing motion / parallax | `@media (prefers-reduced-motion: reduce)` |
| Form validated only on submit, no programmatic link to the message | `aria-invalid` + `aria-errormessage` on the input |

## Framework notes

- React: `useId()` for label/input/error ids — never hand-roll or index-derive ids. Vue 3.5+ `useId()`.
  Angular: generate a uuid per instance and let a prop override it.
- Component libraries: still your responsibility. Verify the rendered DOM, not the prop names.
- Server-rendered and client-rendered markup must produce the same ids, or `aria-labelledby` breaks
  on hydration.
