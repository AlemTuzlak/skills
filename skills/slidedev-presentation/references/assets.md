# Asset generation (Slidev)

Honesty rules live in `presentation` → `references/assets.md`. This file is the
Slidev render pipeline.

## Generatable → how

### Code

- **Default: native in-deck.** Use Slidev/Shiki fenced code blocks with
  line-highlighting and progressive reveal.
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

Simple SVGs, charts, and tables: generate inline (Mermaid/HTML/Markdown table)
rather than asking the user for an image.

## Placeholder on a slide

```md
<!-- ASSET-TODO: swap for an image that demonstrates the dashboard's live filtering -->
<div class="asset-todo">ASSET NEEDED: screenshot showing the dashboard filtering 10k rows in real time</div>
```

Collect every `ASSET-TODO` and surface the list at finish.

## Path rule

All assets live in the deck's `public/` and are referenced absolutely
(`/asset.png`). Relative paths 404 after build.

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
