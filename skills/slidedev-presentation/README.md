# slidedev-presentation

Build a researched Slidev deck and open it in the browser.

This engine loads `presentation` for research, interview, craft, and the
storyboard gate. Then it writes `slides.md` and verifies the rendered slides.

## What it does

1. **Loads `presentation`.** Research, interview, storyboard. No slides yet.
2. **Scaffolds Slidev.** Theme pick in the browser. Brand colors on top.
3. **Writes `slides.md`.** Assertion-evidence titles. One idea per slide.
4. **Self-verifies** every slide in a headless browser.
5. **Finishes live.** Dev server running. Deck open at
   `http://localhost:3030`.

## Usage

```
/slidedev-presentation
make a Slidev deck about X
build 2D slides for <library>
```

If you say "make a presentation" and do not name a medium, the agent asks once:
Slidev or Three.js world.

## Output

A Slidev project at the folder you pick. Dev server on port 3030.

## Layout

```
SKILL.md
references/
  interview.md             theme, brand routing, export targets
  slidev-cheatsheet.md     generator gotchas
  assets.md                Shiki / Mermaid PNG helper
  verification.md          screenshot loop
assets/
  render-asset.mjs
```
