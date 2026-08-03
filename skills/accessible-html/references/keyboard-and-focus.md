# Keyboard and focus

Everything a keyboard or switch-device user experiences is decided here. Read this before writing any
`keydown` handler, any `tabindex`, or any `.focus()` call.

---

## The focus indicator

The single most common self-inflicted accessibility bug is `outline: none`. Without a ring, a keyboard
user has no idea where they are on the page. **Never `outline: none` unless you are replacing the ring
in the same rule.**

Use `:focus-visible`, not `:focus`. `:focus` also fires on mouse click, which is why people delete it;
`:focus-visible` only shows the ring when the browser would have shown one — keyboard, not mouse.

```css
/* Brand-coloured ring */
*:focus-visible {
  outline: 3px solid #009483;   /* ≥ 2px thick, ≥ 3:1 against both sides */
  outline-offset: 2px;          /* gap so the ring reads against the element AND the page */
}
```

Requirements (WCAG 2.4.7 AA, 1.4.11 AA, 2.4.13 AAA):

- At least as much area as a 2px perimeter around the element. Dashed or dotted? Double the thickness,
  the gaps do not count.
- At least 3:1 contrast against **adjacent colours** — the page behind it if the ring is outside, the
  component if inside, both if it sits on the border.
- An inside ring usually needs 3px to make up the area an outside ring gets for free.

Use `outline`, not only `box-shadow`. Windows forced-colors / High Contrast mode throws away
`box-shadow`, `border-color`, and `background`, but keeps `outline`. A ring that only exists as a
`box-shadow` disappears for exactly the users who need it most.

The bulletproof ring that works on any background — a dark outline with a light halo:

```css
:focus-visible {
  outline: 3px solid #000;
  box-shadow: 0 0 0 6px #fff;   /* the halo is the enhancement, the outline is the guarantee */
}
```

Also: the ring must not be **covered** (WCAG 2.2 2.4.11). Sticky headers, sticky footers, and cookie
bars routinely hide the focused element. Use `scroll-padding-top` on the scroll container equal to the
sticky header height.

---

## What is focusable already

The browser puts these in the tab order for free, no `tabindex` needed:

`<a href>`, `<button>`, `<input>` (not `type="hidden"`), `<select>`, `<textarea>`, `<summary>`,
`<iframe>`, `<audio controls>`, `<video controls>`, `[contenteditable]`, and anything with `tabindex`.

Disabled controls are skipped. Elements hidden with `display: none`, `visibility: hidden`, `hidden`, or
inside `inert` are skipped.

## `tabindex`, the only three values

| Value | Meaning | Use for |
|---|---|---|
| `0` | Add to the tab order, in DOM position | A custom widget that genuinely is a control |
| `-1` | Remove from the tab order, but allow `.focus()` | Roving-tabindex items, focus targets like a route `<h1>` or a dialog heading |
| `1`+ | **Never.** | Nothing |

**Positive `tabindex` is poison.** It breaks the natural order so the next stop no longer matches what
you see, and it jumps ahead of *every* untabbed element on the page. `<button tabindex="1">Next page</button>`
after a list of ten cards sends the user straight to "Next page" first, then back to the cards. Fixing
one positive value forces you to hand-number the whole page, forever. If you feel the need for one, the
DOM order is wrong — fix that.

**Do not add `tabindex="0"` to non-interactive things.** Headings, paragraphs, cards, and wrappers do
not need it. Screen readers already jump heading to heading (NVDA/JAWS `H`, VoiceOver Ctrl+Opt+Cmd+H).
Extra tab stops on static content mean more keys to press for no gain — you made it worse.

Two legitimate exceptions: a scrollable region needs `tabindex="0"` so a keyboard user can scroll it,
and a focus **target** (route heading, dialog heading, error summary) needs `tabindex="-1"`.

---

## Roving tabindex

For a group that should be **one** tab stop with arrow keys inside — tabs, menus, toolbars, radio
groups, reorderable lists:

- The active item has `tabindex="0"`. Every other item has `tabindex="-1"`.
- On arrow key: move `tabindex="0"` to the new item, set the old one to `-1`, and **call `.focus()` on
  the new item**. Changing the attribute alone moves nothing.
- Tab then leaves the whole group in one press.
- `Home`/`End` jump to first/last. Wrap at the ends unless the group is a list where wrapping is confusing.
- `event.preventDefault()` on the arrow keys you handle, so the page does not also scroll.

```js
list.addEventListener('keydown', (e) => {
  const items = [...list.querySelectorAll('[role="tab"]')];
  const i = items.indexOf(document.activeElement);
  let next = null;
  if (e.key === 'ArrowRight') next = items[(i + 1) % items.length];
  else if (e.key === 'ArrowLeft') next = items[(i - 1 + items.length) % items.length];
  else if (e.key === 'Home') next = items[0];
  else if (e.key === 'End') next = items.at(-1);
  if (!next) return;
  e.preventDefault();
  items.forEach((el) => (el.tabIndex = -1));
  next.tabIndex = 0;
  next.focus();
});
```

The alternative to roving tabindex is `aria-activedescendant` (focus stays on a container, which points
at the active child's id). Use it for comboboxes, where focus must stay in the text input.

---

## Moving focus yourself

Move focus when the user's context changed and the old focus no longer exists or no longer makes sense:

| Event | Move focus to |
|---|---|
| Dialog opens | First control inside, or the dialog heading (`tabindex="-1"`) |
| Dialog closes | The element that opened it — store it before opening |
| SPA route change | New page `<h1>` (`tabindex="-1"`) |
| Submit fails | Error summary, or the first invalid field |
| Item deleted from a list | Next item, or the list container. Never leave focus on a removed node |
| "Add item" | The new item's first field |
| Expand a panel | Nothing. Leave focus on the trigger |

Never move focus on hover, on scroll, on a timer, or on page load.

If focus lands on a removed element, the browser resets it to `<body>` and the user is silently thrown
to the top of the page. Always re-place focus **before** you remove the node.

In React, do this in an effect against a ref, not during render. Framework element references:
React `useRef` + `ref.current.focus()`, Vue template refs, Angular `viewChild` / `ElementRef`.

---

## Focus traps

A modal needs one. Nothing else does.

Correct approach: `<dialog>.showModal()`, which traps focus, hides the background from assistive tech,
and handles Escape. Hand-rolled equivalent: put `inert` on everything outside the dialog, listen for
Escape, and restore focus on close.

Never trap focus where the user cannot escape (WCAG 2.1.2). Any custom trap must release on Escape.

The mirror-image bug: **invisible focusable elements.** A menu you hid with `opacity: 0`, `height: 0`,
`transform: translateX(-100%)`, or `clip-path` still receives Tab. The user tabs into nothing. Use
`hidden`, `display: none`, `visibility: hidden`, or `inert` to hide, and check by tabbing.

---

## Keys you must not break

- Enter activates links and buttons. Space activates buttons, checkboxes, and scrolls the page.
  Both work free on a real `<button>`. On a `<div role="button">` you must implement both yourself —
  which is one of several reasons not to.
- Enter in a single-input form submits it. Keep a real `<form>` and a real submit button.
- Escape closes the topmost thing.
- Do not `preventDefault()` broadly. Never intercept Tab except inside a modal trap.
- Never touch browser or assistive-tech chords: Ctrl/Cmd+T/W/L/F/R/+/-, F5, F6, Alt+Arrow, Insert+…,
  Ctrl+Opt+… . NVDA and VoiceOver own huge swathes of the keyboard; a conflict makes your app unusable.
- Read `event.key` (`'ArrowDown'`, `'Enter'`, `' '`). `keyCode` is deprecated and breaks on non-US layouts.
- Avoid `accesskey`. It collides with assistive tech and browser shortcuts.

---

## App-level keyboard shortcuts

Shortcuts are great for power users and for motor-impaired users who cannot aim a pointer. They are
also a WCAG requirement once they are single characters.

**WCAG 2.1.4 Character Key Shortcuts (Level A):** if a shortcut uses only letters, numbers,
punctuation, or symbols, you must offer at least one of:

1. a way to turn it off,
2. a way to remap it to include a modifier, or
3. only make it active while the relevant component has focus.

Why: speech-recognition users emit stray characters constantly. A bare `j`/`k`/`/` shortcut fires at
random for them.

Rules that follow from that:

- Ignore shortcuts while focus is in an `<input>`, `<textarea>`, `<select>`, or `[contenteditable]`.
- Prefer a modifier, or a scoped shortcut, or a leader key.
- Document them, and give a discoverable list (`?` is the convention — itself scoped).
- Show the shortcut in the UI next to the action it triggers (`<kbd>`), so it is discoverable and not
  just a secret.
- Match the platform: Cmd on macOS, Ctrl elsewhere — check `event.metaKey || event.ctrlKey`.

```js
const typing = (el) =>
  el.matches('input, textarea, select, [contenteditable]');

document.addEventListener('keydown', (e) => {
  if (typing(e.target) || e.altKey) return;
  // Cmd/Ctrl + K — a modifier shortcut, no 2.1.4 obligation
  if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
    e.preventDefault();
    openCommandPalette();
    return;
  }
  // Bare "/" — needs the escape hatch to satisfy 2.1.4
  if (e.key === '/' && shortcutsEnabled) {
    e.preventDefault();
    focusSearch();
  }
});
```

`shortcutsEnabled` must be a real user setting, not a constant.

---

## Pointer rules that affect keyboard users too

- **Activate on `pointerup`/`click`, not `pointerdown`** (WCAG 2.5.2). Down-event activation cannot be
  aborted — a user with a tremor who lands on the wrong control has already triggered it. Let them
  drag off to cancel.
- **Every drag needs a non-drag path** (WCAG 2.2 2.5.7 AA): "move up"/"move down" buttons, a "move
  to…" menu, or keyboard reorder. Announce the result in a live region.
- **Every swipe, long-press, double-click, right-click, and multi-finger gesture needs a plain button
  equivalent.**
- **Targets ≥ 24×24 CSS px** (2.5.8 AA); 44×44 is the enhanced bar (2.5.5 AAA) and what Apple and
  Google both recommend for touch. Grow the hit area with padding, or a pseudo-element, without
  growing the visual:

  ```css
  .icon-button { position: relative; }
  .icon-button::after {
    content: ''; position: absolute; inset: 50%;
    width: 44px; height: 44px; translate: -50% -50%;
  }
  ```
- Spacing counts: adjacent 24px targets that touch are still a miss-tap machine. Leave gaps.
- Hover and focus states belong in CSS (`:hover`, `:focus-visible`), not JS mouse listeners. JS
  listeners miss keyboard users, and `mouseenter` never fires for them.
- `cursor: pointer` is not an affordance. It is invisible on touch, invisible to screen readers, and
  absent for keyboard users. The element must also *look* interactive.
