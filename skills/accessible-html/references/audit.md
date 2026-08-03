# Before you say it's done

Run this on the UI you just touched. Not the whole app — your change. It takes a few minutes.
"I reviewed the code" is not this list.

## 1. Tab through it (no mouse)

Put the mouse down. Use only Tab, Shift+Tab, Enter, Space, arrows, Escape.

- [ ] Every control is reachable, in the order it appears on screen.
- [ ] You can always see where focus is. Ring is ≥ 2px, ≥ 3:1 contrast, and not hidden behind a sticky
      header, footer, or cookie bar (2.4.11).
- [ ] Focus never gets stuck, and never jumps somewhere surprising.
- [ ] Escape closes whatever opened, and focus returns to what opened it.
- [ ] Nothing is reachable that should not be — no tab stops in a closed menu, an `opacity: 0` panel,
      or an offscreen drawer.
- [ ] No junk tab stops on headings, cards, or wrappers.
- [ ] Delete an item from a list: focus lands somewhere sensible, not on `<body>`.
- [ ] Any drag interaction also works with buttons or keys.
- [ ] Shortcuts do not fire while you are typing in a field.

## 2. Lint and run axe

Lint catches it before it ships. Add and keep enabled:

- React/JSX: `eslint-plugin-jsx-a11y`
- Vue: `eslint-plugin-vuejs-accessibility`
- Svelte: built-in a11y compiler warnings (do not suppress them)
- Angular: `@angular-eslint` template a11y rules

Then run axe against the rendered page:

```bash
npx @axe-core/cli http://localhost:3000
```

- axe DevTools browser extension for interactive states (open the menu, *then* scan).
- `jest-axe` / `vitest-axe` in component tests, `@axe-core/playwright` in e2e — one assertion per
  component gives you a permanent regression net.
- Lighthouse accessibility score, WAVE extension, and HeadingsMap (heading outline at a glance) are
  useful second opinions.
- [ ] Zero violations. Not "only minor ones".

Automated tools catch roughly a third of real problems. A clean axe run plus a failed tab-through means
the UI is broken. Do not let a green score end the review.

## 3. Look at it differently

- [ ] Zoom to 200%. Nothing clipped or lost (1.4.4).
- [ ] Resize the window to 320px wide (or zoom to 400%). No two-directional scrolling; only tables,
      maps and code may scroll sideways, inside their own container (1.4.10).
- [ ] Set the browser's default font size to 24px. Layout still works — this is what `rem` is for.
- [ ] Force text spacing (line-height 1.5, letter-spacing 0.12em, word-spacing 0.16em, paragraph
      spacing 2em). Nothing clips (1.4.12). Use a text-spacing bookmarklet or paste the CSS in DevTools.
- [ ] Contrast on the real render: body text, large text, icons, input borders, placeholder, disabled,
      hover, visited, focus ring, text over images, `::selection` — and all of it again in dark mode.
- [ ] Greyscale the page. Is any information gone? Colour must never be the only signal (1.4.1).
- [ ] OS "reduce motion" on: animation gone or minimal, no parallax, no auto-advance.
- [ ] Windows High Contrast / `forced-colors` mode: borders, icons, focus rings, and selected states
      all still visible.
- [ ] Rotate to landscape and portrait; both work (1.3.4).
- [ ] Pinch zoom works on mobile (no `user-scalable=no`).

Polypane, or the Chrome DevTools "Rendering" pane (emulate vision deficiencies, `prefers-reduced-motion`,
`forced-colors`), does most of this without changing OS settings.

## 4. Read the accessibility tree

DevTools → Elements → Accessibility pane, or Firefox's Accessibility inspector.

- [ ] Every control has a sensible **name** and the right **role**.
- [ ] No "button" with an empty name. No `generic` where a control should be.
- [ ] The visible label text appears in the accessible name (2.5.3 Label in Name).
- [ ] Headings form a sane outline — one `h1`, no skipped levels.
- [ ] Landmarks present: banner, navigation, main, contentinfo. Multiple navs are labelled.
- [ ] No duplicate `id`s (they silently break `for` and `aria-labelledby`).

## 5. Listen to it once

At least once per non-trivial feature, with a real screen reader:

- macOS VoiceOver: Cmd+F5. Rotor Ctrl+Opt+U. Next heading Ctrl+Opt+Cmd+H.
- Windows NVDA (free): Insert+Down reads. `H` next heading, `Insert+F7` element list.
- [ ] Each control's purpose is clear from what is announced.
- [ ] State changes are announced: expanded, selected, invalid, "loading finished", "3 results".
- [ ] Nothing important is silent; nothing is announced twice.
- [ ] After a route change or a submit, you hear where you are.

## 6. Final checklist

- [ ] `<html lang>` set; `lang` on foreign phrases.
- [ ] Unique, descriptive `<title>` per page.
- [ ] Skip link to `<main>`, visible on focus.
- [ ] One `<main>`; each `<nav>` labelled; landmarks wrap all content.
- [ ] Every `img` has `alt`; decorative ones `alt=""`; complex ones have a real text alternative.
- [ ] Every `iframe` has a `title`.
- [ ] Every input has a `<label>`; no placeholder-only labels; `autocomplete` set where relevant.
- [ ] Every button and link has a non-empty accessible name; link text works out of context.
- [ ] Lists are real lists; `role="list"` added wherever `list-style: none` is set.
- [ ] Data tables have `<caption>` and `<th scope>`.
- [ ] No `tabindex` above 0; no `autofocus`; no `accesskey`.
- [ ] No `aria-hidden` on anything focusable or containing something focusable.
- [ ] No `outline: none` left anywhere; no ring built only from `box-shadow`.
- [ ] DOM order matches visual order.
- [ ] Targets ≥ 24×24px with spacing between them.
- [ ] Errors announced, described in text, and linked to their field.
- [ ] Single-character shortcuts can be turned off or are scoped to a focused component.
- [ ] Timeouts are extendable; no data has to be re-entered.
- [ ] Nothing autoplays; nothing flashes more than 3×/sec.

## 7. Write it down

If you shipped a known gap, say so in the PR with what is missing and why. A silent gap becomes a
permanent one.

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

None of these are hard. Getting these six right in the code you write puts you ahead of nearly every
site on the web.

## WCAG 2.2 Level A and AA, compressed

Level A is the floor. **AA is the target.** AAA (7:1 contrast, sign language, 44px targets) is
aspirational.

**Perceivable** — text alternatives for all non-text content (1.1.1); captions and transcripts for
media (1.2.x); structure and relationships in real markup (1.3.1); reading order matches meaning
(1.3.2); instructions never rely on shape, colour, or position alone (1.3.3); do not lock orientation
(1.3.4); set `autocomplete` (1.3.5); colour is never the only signal (1.4.1); no autoplay audio
(1.4.2); contrast 4.5:1 / 3:1 (1.4.3); text resizes to 200% (1.4.4); use text, not images of text
(1.4.5); reflow at 320px (1.4.10); non-text contrast 3:1 (1.4.11); text spacing overrides do not clip
(1.4.12); hover/focus content is dismissible, hoverable, persistent (1.4.13).

**Operable** — everything works from the keyboard (2.1.1); no keyboard traps (2.1.2); single-key
shortcuts are off-able (2.1.4); time limits adjustable (2.2.1); moving content can be paused (2.2.2);
nothing flashes over 3×/sec (2.3.1); skip link (2.4.1); page titles (2.4.2); logical focus order
(2.4.3); link purpose is clear (2.4.4); more than one way to find a page (2.4.5); descriptive headings
and labels (2.4.6); focus is visible (2.4.7); focus is not obscured (2.4.11 — **new in 2.2**);
activate on pointer-up and allow abort (2.5.2); accessible name contains the visible label (2.5.3);
motion-actuated features have an alternative (2.5.4); every drag has a non-drag path (2.5.7 — **new**);
targets ≥ 24×24px (2.5.8 — **new**).

**Understandable** — page language (3.1.1) and language of parts (3.1.2); no context change on focus
(3.2.1) or on input (3.2.2); consistent navigation (3.2.3) and naming (3.2.4); help in a consistent
place (3.2.6 — **new**); errors identified (3.3.1); labels and instructions provided (3.3.2); fix
suggestions given (3.3.3); reversible or confirmed submissions for legal/financial data (3.3.4); no
redundant re-entry (3.3.7 — **new**); no memory or puzzle test to log in (3.3.8 — **new**).

**Robust** — name, role, value exposed for every component (4.1.2); status messages announced without
taking focus (4.1.3).

The six criteria marked **new** in 2.2 are the ones most often missed in existing codebases.

Accessibility overlay widgets fix none of this. They are marketing, and they frequently make things
worse. There is no silver bullet, no one-line script, no plugin.

## Sources

- The Art of Accessibility, Playful Programming — https://playfulprogramming.com/collections/art-of-accessibility
- WCAG 2.2 quick reference — https://www.w3.org/WAI/WCAG22/quickref/
- ARIA Authoring Practices Guide (patterns, keyboard maps) — https://www.w3.org/WAI/ARIA/apg/patterns/
- Rules of ARIA use — https://www.w3.org/TR/using-aria/
- W3C alt decision tree — https://www.w3.org/WAI/tutorials/images/decision-tree/
- The A11Y Project checklist — https://www.a11yproject.com/checklist/
- WebAIM Million — https://webaim.org/projects/million/
- Sara Soueidan on focus indicators — https://www.sarasoueidan.com/blog/focus-indicators/
- Scott O'Hara, "Fixing" lists — https://www.scottohara.me/blog/2019/01/12/lists-and-safari.html
- eslint-plugin-jsx-a11y — https://github.com/jsx-eslint/eslint-plugin-jsx-a11y
