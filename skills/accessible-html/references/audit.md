# Before you say it's done

Run this on the UI you just touched. Not on the whole app — on your change. It takes a few minutes.
"I reviewed the code" is not this list.

## 1. Tab through it (no mouse)

Put the mouse down and use only Tab, Shift+Tab, Enter, Space, arrows, Escape.

- [ ] Every control is reachable, in the order it appears on screen.
- [ ] You can always see where focus is. No invisible focus, no ring hidden behind a sticky header
      or under a modal (WCAG 2.2 2.4.11).
- [ ] Focus never gets stuck, and never jumps somewhere surprising.
- [ ] Escape closes anything that opened, and focus goes back where it came from.
- [ ] No keyboard trap: you can always Tab out of every widget.
- [ ] Nothing is reachable that should not be — no tab stops inside a closed menu or a hidden panel.

## 2. Run axe

```bash
npx @axe-core/cli http://localhost:3000
```

Or the axe DevTools browser extension, or `jest-axe` / `vitest-axe` in a component test, or
`@axe-core/playwright` in an e2e test.

- [ ] Zero violations. Not "only minor ones".
- Automated tools catch roughly a third of real problems. A clean axe run plus a failed tab-through
  means the UI is broken.

## 3. Look at it differently

- [ ] Zoom the browser to 200%. Nothing is cut off, overlapping, or horizontally scrolling.
- [ ] Set the browser's default font size to 24px. The layout still works (this is what `rem` is for).
- [ ] Check contrast on the real rendered colours, including hover, disabled, placeholder, focus ring,
      and text over images: ≥ 4.5:1 body text, ≥ 3:1 large text and UI boundaries.
- [ ] Turn on OS "reduce motion". Animation is gone or minimal.
- [ ] Grayscale the page. Is any information now missing? Colour must never be the only signal —
      add an icon, text, or underline.
- [ ] Windows High Contrast / forced-colors mode does not erase your borders and icons.

## 4. Read the accessibility tree

DevTools → Elements → Accessibility pane, or Firefox's Accessibility inspector.

- [ ] Every control has a sensible **name** and the right **role**.
- [ ] No "button" with an empty name. No `generic` where an interactive element should be.
- [ ] Headings form a sane outline (one `h1`, no skipped levels) — check the "Headings" list.
- [ ] Landmarks present: banner, navigation, main, contentinfo.

## 5. Listen to it once

At least once per non-trivial feature, with a real screen reader:

- macOS VoiceOver: Cmd+F5. Rotor: Ctrl+Opt+U. Next heading: Ctrl+Opt+Cmd+H.
- Windows NVDA (free): Insert+Down to read. `H` next heading, `Insert+F7` element list.
- [ ] The purpose of each control is clear from what is announced.
- [ ] State changes are announced (expanded, selected, invalid, loading finished).
- [ ] Nothing is announced twice, and nothing important is silent.

## 6. Final checklist

- [ ] `<html lang>` set.
- [ ] Unique, descriptive `<title>` per page.
- [ ] Skip link to `<main>`.
- [ ] One `<main>`; multiple `<nav>` each have an `aria-label`.
- [ ] Every `img` has `alt`; decorative ones `alt=""`.
- [ ] Every input has a `<label>`; no placeholder-only labels.
- [ ] Every button and link has a non-empty accessible name.
- [ ] Link text makes sense out of context (no bare "Read more" / "Click here").
- [ ] No `tabindex` above 0.
- [ ] No `aria-hidden` on anything focusable or containing something focusable.
- [ ] Targets ≥ 24×24px.
- [ ] Errors are announced and programmatically linked to their field.
- [ ] Any drag or swipe has a click alternative.
- [ ] No `outline: none` left in the CSS.

## 7. Write it down

If you shipped a known gap, say so in the PR description with what is missing and why. A silent gap
becomes a permanent one.

## Where the real-world failures are

WebAIM scans a million home pages every year. 96% of all detected errors are six things:

| Failure | Share of home pages |
|---|---|
| Low contrast text | ~84% |
| Missing image alt text | ~53% |
| Missing form input labels | ~51% |
| Empty links | ~46% |
| Empty buttons | ~31% |
| Missing document language | ~14% |

None of these are hard. They are all on the checklist above. Getting these six right in the code you
write puts you ahead of nearly every site on the web.

## WCAG in one paragraph

Level A is the floor (alt text, labels, keyboard operation). **Level AA is the normal legal and
contractual target** — it adds contrast ratios, text resizing, heading structure, focus visibility,
target size, and drag alternatives. AAA (7:1 contrast, sign language) is aspirational, not a default.
Aim at AA unless you are told otherwise.

WCAG 2.2 added, and these get missed most often: focus not obscured by sticky headers (2.4.11, AA),
a non-drag alternative for every drag (2.5.7, AA), 24×24px targets (2.5.8, AA), help in a consistent
place (3.2.6, A), no re-entering data you already gave (3.3.7, A), and no memory or puzzle test to
log in (3.3.8, AA).

Accessibility overlay widgets do not fix any of this. They are marketing.

## Sources

- The Art of Accessibility, Playful Programming — https://playfulprogramming.com/collections/art-of-accessibility
- WCAG 2.2 quick reference — https://www.w3.org/WAI/WCAG22/quickref/
- ARIA Authoring Practices Guide (patterns, keyboard maps) — https://www.w3.org/WAI/ARIA/apg/patterns/
- Rules of ARIA use — https://www.w3.org/TR/using-aria/
- W3C alt decision tree — https://www.w3.org/WAI/tutorials/images/decision-tree/
- WebAIM Million — https://webaim.org/projects/million/
