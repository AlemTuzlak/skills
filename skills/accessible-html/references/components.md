# Interactive component patterns

Read the pattern before you write the component. Each one lists the required keys, the required ARIA
state, and the required focus behaviour. If you cannot implement all three, use a simpler pattern —
a link and a page, or a `<details>` — instead of a broken widget.

Every pattern below assumes: the trigger is a real `<button type="button">`, the focus ring is
visible, and hit areas are ≥ 24×24px.

---

## Disclosure (show/hide, accordion)

Cheapest correct option: `<details><summary>`. Browser gives you the keys and the state.

Custom version:

```html
<button type="button" aria-expanded="false" aria-controls="panel-1" id="trigger-1">
  Shipping options
</button>
<div id="panel-1" hidden>…</div>
```

- Keys: Enter and Space toggle (free from `<button>`).
- State: `aria-expanded` on the **trigger**, not the panel. Toggle `hidden` on the panel.
- No `role="button"`, no `aria-hidden` on the panel — `hidden` already removes it.
- Accordion = a list of disclosures. Arrow keys are optional; do not add them half-way.

---

## Modal dialog

**First: does this need to be a modal?** A modal interrupts, steals focus, traps the keyboard, and
hides the rest of the page from assistive tech. It is the most expensive UI you can ship. A page, an
inline expanded section, a `<details>`, or a non-modal popover is usually better and always cheaper.
Modals stacked on modals are a design failure, not a technical one.

If you do need one: use `<dialog>` + `dialog.showModal()`. You get the focus trap, Escape, `inert`
background, and the top layer for free. Anything else is a re-implementation.

```html
<dialog id="confirm" aria-labelledby="confirm-title">
  <h2 id="confirm-title">Delete project?</h2>
  <p id="confirm-desc">This cannot be undone.</p>
  <form method="dialog">
    <button value="cancel">Cancel</button>
    <button value="delete">Delete</button>
  </form>
</dialog>
```

Required, whether native or custom:

- Focus moves into the dialog on open — to the first focusable control, or the heading with `tabindex="-1"`.
- Focus returns to the element that opened it on close. Store that element.
- Escape closes it.
- Tab cycles inside only. Background is not reachable (`inert` on the app root if hand-rolling).
- Named by its heading (`aria-labelledby`), described by its body if needed (`aria-describedby`).
- `role="alertdialog"` only for a message that interrupts and needs a response.
- Do not scroll-lock by removing content from the DOM in a way that loses focus.

---

## Popover (non-modal overlay)

The native Popover API is the right tool for anything anchored and non-blocking: a settings panel, a
notification tray, a rich dropdown, a hint card.

```html
<button popovertarget="prefs">Preferences</button>
<div id="prefs" popover>
  <h2>Preferences</h2>
  …
  <button popovertarget="prefs" popovertargetaction="hide">Close</button>
</div>
```

What you get free: top layer (never clipped by `overflow` or `z-index`), light dismiss (click outside),
Escape to close, and the trigger/target wiring. Focus is **not** trapped, which is correct here.

- `popover="auto"` (the default) — light dismiss, and only one auto popover in a chain stays open.
- `popover="manual"` — you control opening and closing entirely; no light dismiss. Use for toasts.
- Add `aria-expanded` on the trigger yourself if the popover is a disclosure-style panel; the attribute
  is not automatic.
- `popovertargetaction="show|hide|toggle"` for extra buttons.
- Pair with CSS anchor positioning (`anchor-name` / `position-anchor`) where supported, with a
  fallback — do not position with JS on scroll, that is jank and it fights zoom.
- Do not use a popover as a modal. If the background must be unusable, it is a dialog.

---

## Dropdown menu (a list of actions)

Only use `role="menu"` for an application menu of **commands**. A dropdown of links is a `<nav>` with
a `<ul>` of `<a>` inside a disclosure — do that instead, it is far less to get wrong.

Real menu button:

```html
<button type="button" aria-haspopup="true" aria-expanded="false" aria-controls="menu-1" id="menu-btn">
  Actions
</button>
<ul role="menu" id="menu-1" aria-labelledby="menu-btn" hidden>
  <li role="menuitem" tabindex="-1">Rename</li>
  <li role="menuitem" tabindex="-1">Duplicate</li>
</ul>
```

- Trigger keys: Enter / Space / ArrowDown open and focus first item. ArrowUp opens and focuses last.
- Inside: ArrowDown/ArrowUp move (wrap), Home/End jump, typing a letter jumps to the next matching
  item, Enter/Space activate, Escape closes and returns focus to the trigger, Tab closes the menu.
- Only one item is in the tab order at a time (`tabindex="0"` on the active item, `-1` on the rest) —
  and you must call `.focus()` yourself when you move it.
- `role="menu"` children must be `menuitem`, `menuitemcheckbox`, or `menuitemradio`. No plain text,
  no arbitrary divs.

---

## Tabs

```html
<div role="tablist" aria-label="Code language">
  <button role="tab" id="js-tab" aria-selected="true"  aria-controls="js-panel" tabindex="0">JavaScript</button>
  <button role="tab" id="ts-tab" aria-selected="false" aria-controls="ts-panel" tabindex="-1">TypeScript</button>
</div>
<div role="tabpanel" id="js-panel" aria-labelledby="js-tab" tabindex="0">…</div>
<div role="tabpanel" id="ts-panel" aria-labelledby="ts-tab" hidden>…</div>
```

- Tab key moves **into** the tablist (one stop), then **out** to the active panel. It does not move
  between tabs.
- ArrowLeft/ArrowRight (or Up/Down for a vertical tablist) move between tabs and wrap. Home/End jump.
- Roving tabindex: active tab `tabindex="0"`, others `-1`, and call `.focus()` on the new tab.
- `aria-selected` on the tab. `hidden` on inactive panels.
- Panels get `tabindex="0"` only when they contain no focusable content.

---

## Combobox / autocomplete

The hardest pattern in this file. If a plain `<select>`, `<input list>` + `<datalist>`, or a
filtered list of checkboxes will do the job, use that.

```html
<label for="city">City</label>
<input id="city" role="combobox" aria-expanded="false" aria-controls="city-list"
       aria-autocomplete="list" autocomplete="off">
<ul role="listbox" id="city-list">
  <li role="option" id="opt-1" aria-selected="true">Amsterdam</li>
</ul>
```

- Focus **stays in the input**. Never move DOM focus into the list.
- `aria-activedescendant` on the input points at the highlighted option's id.
- Keys: ArrowDown/ArrowUp move the active option (open the list if closed), Enter selects, Escape
  closes then clears, Home/End, Tab selects the active option and moves on.
- Announce result counts through a polite live region ("6 results").
- Scroll the active option into view — highlighted-but-off-screen is a bug for sighted keyboard users.

---

## Tooltip

- Must appear on **both** hover and keyboard focus, and stay while the pointer moves onto it.
- Dismissible with Escape without moving focus.
- `aria-describedby` from the trigger to the tooltip. Never `aria-hidden` a tooltip that is visible.
- A tooltip is never the only accessible name and never holds essential or interactive content
  (no links or buttons inside — use a popover for that).
- Not on a non-focusable element. If it needs a tooltip, it needs focus.

---

## Live regions (toasts, validation, async status)

```html
<div aria-live="polite" aria-atomic="true" class="visually-hidden" id="status"></div>
```

- The region must exist in the DOM **before** you put text in it. Inserting a filled region is
  usually not announced.
- `polite` for everything routine. `assertive` / `role="alert"` only for genuine interruptions
  (errors, session about to expire). Assertive spam makes screen reader use impossible.
- `role="status"` = polite, `role="alert"` = assertive, both implicit.
- Toasts: keep them on screen long enough to read, do not put the only copy of an action in one, and
  do not steal focus to them.
- Route changes in an SPA: move focus to the new page's `<h1>` (`tabindex="-1"`) and/or announce the
  new title. Otherwise a screen reader user hears nothing after a click.

---

## Forms

```html
<label for="email">Email address</label>
<input id="email" type="email" name="email" autocomplete="email"
       aria-describedby="email-hint" aria-invalid="true" aria-errormessage="email-err">
<p id="email-hint">We only use this for receipts.</p>
<p id="email-err">Enter an email address like name@example.com.</p>
```

- One label per input, one input per label. Labels hold phrasing content only — no headings, no landmarks.
- Use the right `type` and `autocomplete`; it gives mobile users the right keyboard and everyone
  autofill. Required for WCAG 2.2 Redundant Entry.
- Group radios and related checkboxes in `<fieldset>` with a `<legend>`.
- Errors: text, not colour alone. Say what to do, not "invalid input". Link them with
  `aria-errormessage` and set `aria-invalid`.
- On failed submit: move focus to an error summary at the top, or to the first bad field.
- Never disable the submit button as the only feedback about what is wrong.
- Required: use `required` (and `aria-required` only if you cannot). An asterisk alone is not a label.
- Do not block paste, and do not require a memory or puzzle test to log in (WCAG 2.2 3.3.8).

---

## Data tables

```html
<table>
  <caption>Q3 revenue by region</caption>
  <thead>
    <tr><th scope="col">Region</th><th scope="col">Revenue</th></tr>
  </thead>
  <tbody>
    <tr><th scope="row">EMEA</th><td>€1.2M</td></tr>
  </tbody>
</table>
```

- `<caption>` names the table. `<th scope="col|row">` on every header. `headers`/`id` for split headers.
- Sortable columns: the header contains a `<button>`, and the `<th>` carries `aria-sort="ascending|descending|none"`.
- Do not use `role="grid"` unless you are actually implementing spreadsheet-style cell navigation.
- A responsive table that turns into cards must keep each value paired with its header text.

---

## Drag, swipe, and pointer-only interactions (WCAG 2.2 2.5.7 / 2.5.8)

- Every drag has a non-drag alternative: "Move up"/"Move down" buttons, a "move to…" menu, or
  keyboard reorder with arrow keys after picking the item up with Space.
- Every swipe has a visible button equivalent.
- Do not put functionality only on hover, double-click, long-press, right-click, or multi-finger gestures.
- Reorderable lists: announce the move through a live region ("Item 3 of 7, moved up").

---

## Links, cards, and click targets

A link is `<a href>`. That is not pedantry — the browser attaches a pile of behaviour to a real href
that a click handler cannot reproduce:

| User does | Real `<a href>` | `onClick` on a div/card |
|---|---|---|
| Middle-click / Ctrl+click / Cmd+click | Opens in a new tab | Nothing, or navigates in place |
| Right-click → copy link | Works | No link to copy |
| Hover | Shows the destination in the status bar | Nothing |
| Drags it to a bookmark bar | Works | Nothing |
| Keyboard Enter | Works | Only if you wrote the handler |
| JS fails to load | Still navigates | Dead page |

So: **the whole-card click target is a CSS problem, not a JS problem.** Put one real link on the
heading and stretch it:

```html
<article class="card">
  <h3><a href="/posts/thing" class="card-link">Thing</a></h3>
  <p>Summary…</p>
  <button type="button">Save</button>   <!-- stays independently clickable -->
</article>
```

```css
.card { position: relative; }
.card-link::after { content: ''; position: absolute; inset: 0; }  /* card-wide hit area */
.card button { position: relative; }                              /* sits above the overlay */
```

This gives one accessible name ("Thing"), one tab stop for the card, working middle-click, and nested
controls that still work. Never wrap a whole card in `<a>` — the link's accessible name becomes the
entire card text, and any button inside becomes invalid nested-interactive markup.

Also:

- Links in body text need an underline, not just a colour.
- Say when a link opens a new tab or downloads a file — an icon with a visually-hidden "(opens in a
  new tab)", or in the link text.
- Do not use `target="_blank"` by default; it removes the user's choice and their Back button.
- Buttons that navigate and links that act are both wrong. `<a>` goes somewhere, `<button>` does something.

---

## Iframes and embeds

- Every `<iframe>` needs a `title` that says what is inside it ("YouTube video player: setup guide"),
  not "iframe" or "embed". It is a landmark in screen-reader element lists.
- An iframe is focusable. A hidden or empty one is an invisible tab stop — add `tabindex="-1"` or
  remove it from the DOM.
- Third-party embeds (maps, chat widgets, video players, payment fields) are usually the least
  accessible thing on your page and you cannot fix their internals. Provide an alternative path: an
  address in text next to the map, a phone number next to the chat widget, a transcript next to the video.
- A cookie or consent banner in an iframe still must not obscure focus, and must be reachable first.

---

## Video and audio

- Captions for all prerecorded dialogue (1.2.2 A) and for live audio at AA (1.2.4).
- Audio description or a full text alternative when the video shows information the soundtrack does not
  mention (1.2.5 AA).
- Transcripts for audio-only content. They also help everyone who would rather read.
- Use native `<video controls>` / `<audio controls>` unless you are prepared to rebuild every control
  as a labelled, keyboard-operable button — including the timeline slider, which is the hard part.
- Never autoplay audio. Anything auto-playing over 3 seconds needs a pause/stop or volume control.
- Motion, flashing, and auto-advancing content rules live in `visual-and-motion.md`. Carousels: pause
  button, stop on hover and focus, and honour `prefers-reduced-motion`.

---

## Icons and images

```html
<button type="button">
  <svg aria-hidden="true" focusable="false">…</svg>
  <span class="visually-hidden">Settings</span>
</button>
```

- Decorative icon inside a labelled control: `aria-hidden="true"` plus `focusable="false"` (for IE/Edge legacy SVG).
- Standalone meaningful SVG: `role="img"` + `aria-label`, or a `<title>` referenced by `aria-labelledby`.
- Image inside a link: the alt describes the **destination**, not the picture.
- Charts and complex images: short `alt`, and the real data in a table or nearby text.
- Text in an image: repeat that text in the `alt`, or better, do not put text in an image.
- Background images that carry meaning are invisible to assistive tech. Use `<img>`.

---

## The visually-hidden class (use exactly this)

```css
.visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
  border: 0;
}
```

`display: none`, `visibility: hidden`, `hidden`, and `width: 0` all hide content from screen readers
too. They are not "visually hidden".

Skip link — the one place this class should also un-hide on focus:

```html
<a href="#main" class="skip-link">Skip to main content</a>
```

```css
.skip-link:not(:focus) { /* visually-hidden rules */ }
```
