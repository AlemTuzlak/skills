# Slidev cheatsheet — gotchas & delegation

This is **not** a Slidev syntax reference. The official `slidev` skill carries the
full syntax (layouts, code, animations, components, export). This file carries
only what an automated author needs that the syntax docs won't shout about.

## Delegation directive (do this first)

- For **any** syntax — layouts, magic-move, `v-click`/`v-clicks`, components,
  frontmatter/headmatter options, export flags — **consult the official `slidev`
  skill** and its `references/*.md`.
- If the `slidev` skill isn't installed: `npx skills add slidevjs/slidev`.
- Fallback docs for LLMs: `https://sli.dev/llms.txt` (and `llms-full.txt`).
- Do not hand-roll syntax you can look up. Wrong syntax silently breaks rendering;
  Gate 3 will catch it but it wastes a cycle.

## Generator gotchas (the value-add)

1. **Asset paths are absolute from `public/`.** Put assets in `public/` and
   reference them as `/img.png`, never `./img.png` or relative — Vite can't
   statically analyze relative paths in Markdown and they 404 after `build`.
2. **Quote YAML special chars** in headmatter/frontmatter. Paths and strings with
   `: # | > { }` must be quoted: `background: "/bg.png"`.
3. **Comark inline styling** uses the `[text]{attrs}` form, all on one line —
   brackets around the text, then a brace block of attributes:
   `This is [important]{style="color:red"}` (or a class: `[important]{.text-red}`).
   It is **not** `{color:red}{important}`. Requires `comark: true` in the
   headmatter.
4. **Click numbering must be consistent.** Don't mix manual (`v-click="2"`) and
   auto-numbered clicks on the same slide carelessly — it breaks ordering. Let it
   auto-number, or number all of them.
5. **Magic-move needs the wrapper:** the fenced block must be
   ` ````md magic-move ` containing the sequential code blocks. Each inner block
   must be valid standalone code.
6. **Export needs Chromium:** `pnpm add -D playwright-chromium` (or
   `npx playwright install chromium`). PDF/PPTX/PNG export fails without it.
7. **Remote assets on export:** add `--wait <ms>` so remote images finish loading.
8. **Speaker notes** are HTML comments at the end of a slide:
   `<!-- your speaker notes here -->`. They don't render to the audience; they
   show in presenter view.
9. **Layouts top-anchor content — fill the canvas deck-wide.** Slidev's `default`
   layout is `display:block` and `two-cols`/`two-cols-header` lay columns out in a
   top-aligned grid, so content piles at the top and leaves a dead band below
   (looks like a draft). Filling the canvas is a non-negotiable
   (`presentation-craft.md` → "Fill the canvas"), so set it deck-wide in
   `styles/index.css` rather than per slide:
   ```css
   /* center the content group on plain content slides */
   .slidev-layout.default { display: flex; flex-direction: column; justify-content: center; }
   /* each column fills full height and centers its own content */
   .slidev-layout.two-columns .col-left,  .slidev-layout.two-columns .col-right,
   .slidev-layout.two-cols-header .col-left, .slidev-layout.two-cols-header .col-right {
     display: flex; flex-direction: column; justify-content: center; height: 100%;
   }
   /* visual/placeholder panels stretch to fill their column */
   .slidev-layout .asset-todo { height: 100%; }
   ```
   Gotchas: the **rendered** two-column class is `two-columns` (not `two-cols`);
   columns expose `.col-left`/`.col-right` (and `.col-header`/`.col-bottom` on
   `two-cols-header`). Leave `cover`/`quote`/`statement`/`center`/`end` alone —
   they already center via their own `my-auto` child. Then bump body/code font
   sizes so content is proportionate, and re-run Gate 3 to confirm the bigger type
   didn't introduce overflow.

## CLI quick map

```bash
pnpm create slidev            # scaffold a project
pnpm dev                      # dev server on http://localhost:3030 (run in background for the live finish)
slidev build                  # static SPA → dist/
slidev export                 # → PDF (default)
slidev export --format pptx   # → PowerPoint
slidev export --format png    # → per-slide PNGs
slidev export --with-clicks   # one page per click state
```

For exact flags, defer to the `slidev` skill / `slidev --help`.

### Running it reliably (verified — incl. Windows)

- **Scaffolding is interactive.** `create-slidev` always prompts *"Install and start
  it now?"*, ignores `--template`/`--yes`, and needs a **relative** project name (an
  absolute path produces a broken nested path). To scaffold non-interactively, pipe a
  decline, with the parent folder as the working directory:
  `"n" | npm create slidev@latest <project-name>`. Then install/run yourself.
- **Run dev/build/export from the project directory.** Prefer the package scripts the
  scaffold writes — `npm run dev`, `npm run build`, `npm run export` — or call the local
  binary directly: `node node_modules/@slidev/cli/bin/slidev.mjs <slides.md> --port 3030`.
  A global/`npx --prefix` `slidev` invocation is unreliable across setups.
- **Windows/PowerShell:** call `npm` as a bare command and put the subcommand first
  (`npm install --prefix <path>`). Invoking via the `&` call operator (`& npm install …`)
  can mangle into an "Unknown command pm" error.
- **Live finish:** start the dev server as a background process and poll
  `http://localhost:3030` for HTTP 200 before declaring done (see `verification.md`).

## Layout cheat (pointer-level — details in the `slidev` skill)

| Reach for | When |
|-----------|------|
| `cover` / `intro` | title slide |
| `section` | a new section divider |
| `center` | a single centered idea/statement |
| `default` | normal content |
| `two-cols` / `two-cols-header` | side-by-side (code+explanation, before/after) — content after `::right::` |
| `image` / `image-left` / `image-right` | a dominant image (set `image:` in frontmatter) |
| `iframe` / `iframe-left` / `iframe-right` | embed a live URL |
| `quote` | a quotation |
| `fact` / `statement` | a single big number or assertion |
| `end` | closing slide |
