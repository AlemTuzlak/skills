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

### A shortcut feature has four parts. Ship all four.

Any keyboard-shortcut feature that uses bare characters (`j`, `k`, `x`, `/`, `g i`) consists of
**exactly these parts**, in this order. A shortcut module missing part 2 is not finished — it fails
WCAG 2.1.4 at **Level A**, the lowest bar there is.

1. **A typing guard** — ignore every shortcut while focus is in `<input>`, `<textarea>`, `<select>`, or
   `[contenteditable]`, and bail on modifier keys you do not own.
2. **A user-controlled off switch** — a real persisted setting the user can turn off, or a remap to
   modifier chords, or shortcuts scoped to a focused component. **This is the part that gets skipped.
   It is not optional and it is not a follow-up.** Read it from storage, expose it in the settings UI,
   default it to on if you like — but it must be switchable by the user, not a constant in your source.
3. **The handlers** — one per shortcut, each `preventDefault()`ing only the key it handles.
4. **A discoverable list** — a shortcuts help panel (`?` by convention, itself guarded), and `<kbd>`
   hints next to the actions in the UI. A secret shortcut is not a feature.

Why part 2 is non-negotiable: speech-recognition users emit stray characters constantly. Dictating one
sentence into a page with bare `j`/`k`/`x` shortcuts scrolls, archives, and navigates at random. They
cannot use your app at all, and they cannot turn the shortcuts off without your switch.

```js
// 2. The off switch — persisted, user-controlled. Not a constant.
const KEY = 'shortcuts.singleKey.enabled';
const singleKeyEnabled = () => localStorage.getItem(KEY) !== 'off';
// …and a real checkbox in Settings that writes 'off'/'on' to that key.

// 1. The typing guard
const typing = (el) => el.matches('input, textarea, select, [contenteditable]');

document.addEventListener('keydown', (e) => {
  if (typing(e.target) || e.altKey) return;

  // Modifier chords are exempt from 2.1.4 — no off switch needed
  if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
    e.preventDefault();
    openCommandPalette();
    return;
  }
  if (e.metaKey || e.ctrlKey) return;   // never shadow browser/AT chords

  // 3. Bare single-character shortcuts — gated on the switch from part 2
  if (!singleKeyEnabled()) return;
  switch (e.key) {
    case 'j': e.preventDefault(); move(1); break;
    case 'k': e.preventDefault(); move(-1); break;
    case '/': e.preventDefault(); focusSearch(); break;
  }
});
```

If you copy this example and leave `singleKeyEnabled` returning a hardcoded `true`, you have written the
bug the example exists to prevent.

Also:

- Announce what a shortcut did in a polite live region ("Message archived"), or the action is silent for
  screen reader users.
- Move focus sensibly after a destructive shortcut — archiving the selected row must not drop focus to
  `<body>`.
- Match the platform: Cmd on macOS, Ctrl elsewhere.
- Avoid `accesskey` entirely.

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
