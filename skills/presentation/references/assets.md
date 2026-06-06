# Asset generation

**Generate everything legitimately generatable; placeholder only what must be
real; never fabricate evidence.**

Generated diagrams and code images are legitimate. Faked screenshots, invented
data, and hotlinked images are not.

---

## Generatable → how

### Code
- **Default: native in-deck.** Use Slidev/Shiki fenced code blocks with
  line-highlighting and progressive reveal. This is almost always what you want —
  it stays crisp and animatable.
- **Standalone PNG** (for export robustness, or use outside the deck): render with
  the helper and save into the deck's `public/`.

```bash
# write the snippet to a file first, then:
node <skill>/assets/render-asset.mjs --type code --lang ts --theme vitesse-dark \
  --in ./snippet.ts --out <deck>/public/snippet.png
```
Reference it on a slide as `/snippet.png` (absolute path — see gotchas).

### Diagrams
- **Default: native Mermaid/PlantUML in-deck** (` ```mermaid `), per the `slidev`
  skill.
- **Standalone PNG** when a static asset is needed:

```bash
node <skill>/assets/render-asset.mjs --type mermaid \
  --in ./diagram.mmd --out <deck>/public/diagram.png
```

### Other
- Simple SVGs, charts, and tables: generate inline (Mermaid/HTML/Markdown table)
  rather than asking the user for an image.

---

## Un-generatable → placeholder convention

For things that must be real and that you cannot legitimately produce — real
product screenshots, photos, brand imagery, recorded demos — insert a clearly
marked placeholder **and** a specific instruction telling the user exactly what to
add. Be specific about *what the asset should show*, not just "add image here."

On the slide, both a visible marker and an authoring comment:

```md
<!-- ASSET-TODO: swap for an image that demonstrates the dashboard's live filtering -->
<div class="asset-todo">📷 ASSET NEEDED: screenshot showing the dashboard filtering 10k rows in real time</div>
```

Collect every `ASSET-TODO` and surface the list to the user at the finish so none
are missed.

---

## Rules

- **Path rule:** all assets live in the deck's `public/` and are referenced
  absolutely (`/asset.png`). Relative paths 404 after build.
- **Never invent evidence:** no fabricated UI screenshots, no made-up benchmark
  numbers, no images hotlinked from the web as if they were the user's. If a fact
  needs a real artifact you don't have, placeholder it.
- **Prefer the user's assets:** if the interview surfaced ready-made assets, use
  those before generating or placeholdering.

---

## Helper setup (once)

```bash
npm --prefix <skill>/assets install
npx playwright install chromium
```

The helper exports `renderCodeToPng({code|in, lang, theme, out})` and
`renderMermaidToPng({definition|in, out, theme})`, and a CLI
(`--type code|mermaid --in --lang --theme --out`). It uses Shiki for code and a
headless Chromium (Playwright) to rasterize — the same browser machinery Gate 3
uses.
