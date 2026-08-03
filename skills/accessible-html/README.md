# accessible-html

Write markup that works for keyboard, screen reader, and low-vision users the first time, instead of fixing it in an audit later.

Accessibility usually fails for a boring reason: the code was written under a deadline, by someone who knew better and shipped it anyway. This skill loads whenever markup is being written, states the rules that are easy to skip, and comes with a hook that checks the code as it is written.

## What it does

- **Loads on markup work, not on the word "accessibility".** The trigger list covers `.html`, JSX/TSX, Vue, Svelte, Angular templates, web components, and CSS that touches text size, colour, focus, motion, layout order, or hit area. It also fires on element names: adding a button, modal, dropdown, table, icon, or any click handler.
- **Puts the load-bearing rules in `SKILL.md`.** Native element over ARIA, real labels, alt text, one `h1`, visible focus rings, contrast ratios, `rem` sizing, DOM order matching visual order, 24px targets. These are in the file that gets read, not buried in a reference.
- **Gates the reference files.** A trigger table says which file to open before writing code: a `keydown` handler or `tabindex` means read `references/keyboard-and-focus.md` first. Widget contracts (dialog, menu, combobox, tabs, live regions) live in `references/components.md`.
- **Names the required parts of a feature.** A dialog is not done without focus return and Escape. A menu claiming `role="menu"` is not done without arrow keys. A single-key shortcut is not done without an off switch, which WCAG 2.1.4 requires at Level A.
- **Handles the "already approved, do not refactor" case.** Adding to a file that is already broken has its own protocol: add the item as asked, comment the defect at the insertion point, then state the cost in users, the fix with a line count, and one direct question.
- **Checks the code with a hook.** `hooks/a11y-guard.js` runs on every `Write` and `Edit` to a markup or style file and reports the specific defects in the content being written. It never blocks, and it says nothing when the code is clean.
- **Ships a verification pass.** `references/audit.md` is the tab-through, the axe run, the 320px reflow and text-spacing checks, the accessibility tree read, and the screen reader listen.

## Why the hook exists

Pressure-testing found that a skill cannot enforce itself. In one run the agent made zero tool calls, never loaded the skill, and still reported that it had used it. The hook runs in the harness, so it fires whether or not the model decided to read anything.

It looks for twelve high-precision defects, including:

- `outline: none` with no `:focus-visible` replacement
- click handlers on `div`, `span`, and other non-interactive elements
- positive `tabindex`
- `img` without `alt`, `iframe` without `title`
- pinch zoom disabled by the viewport meta tag
- `aria-label` on a `div` or `span` that has no role, where it is ignored
- `role="menu"` with no arrow-key handling
- a single-character keyboard shortcut with no off switch

## Install the hook

The skill works without it, but the hook is what makes the rules hold when nobody remembers to load the skill. Add this to `~/.claude/settings.json`:

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Write|Edit",
        "hooks": [
          {
            "type": "command",
            "command": "node",
            "args": ["~/.claude/skills/accessible-html/hooks/a11y-guard.js"],
            "timeout": 10
          }
        ]
      }
    ]
  }
}
```

Use a full path rather than `~` if your setup does not expand it. The script needs Node and nothing else.

## Usage

It loads on its own when you touch markup. To call it directly:

```
/accessible-html
/accessible-html review this component
/accessible-html why is this dropdown broken for keyboard users
```

## Output

Markup and CSS that meets WCAG 2.2 Level AA, plus a short note on anything you chose to ship with a known gap. When the hook finds a defect, you get the specific problem and the fix, at the moment the code is written.

## Where the rules come from

- [The Art of Accessibility](https://playfulprogramming.com/collections/art-of-accessibility) by Playful Programming, including the unpublished keyboard chapter
- [WCAG 2.2](https://www.w3.org/WAI/WCAG22/quickref/) Level A and AA
- [ARIA Authoring Practices Guide](https://www.w3.org/WAI/ARIA/apg/patterns/) for the widget keyboard maps
- [The A11Y Project checklist](https://www.a11yproject.com/checklist/)
- [WebAIM Million](https://webaim.org/projects/million/), which is why the six most common real-world failures get top billing
