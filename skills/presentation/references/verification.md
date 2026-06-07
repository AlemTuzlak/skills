# Gate 3 — Self-verify loop

Slides silently overflow, clip code, and render at unreadable contrast even when
the Markdown looks fine. Verify the *rendered* deck before handing it over.

## Procedure

1. Start the dev server in the **background** (`pnpm dev`, port 3030). Wait until
   it serves (poll `http://localhost:3030` for HTTP 200).
2. Drive a **headless browser** (Playwright, or the agent-browser MCP) to each
   slide and **screenshot every slide** — including each meaningful click state
   (use `?clicks=` / the print/overview route, or step through).
3. Run the checks below on each screenshot. Fix failures, re-render, re-check.

## Checks & thresholds

| Check | Fail when | Fix |
|-------|-----------|-----|
| **Overflow** | content extends beyond the slide canvas frame (cut off bottom/right; scrollbar on the slide) | split the slide; reduce content; use a denser layout; `zoom:` down a touch |
| **Clipped code** | code block has a scrollbar or the last line is cut | fewer lines (≤5–7 visible); split; use magic-move across steps; smaller but still ≥24pt-equivalent |
| **Contrast** | text vs background below WCAG AA 4.5:1 | adjust theme/scoped colors; avoid text over busy images |
| **Empty** | only a title where the storyboard expected content/visual | add the planned evidence, or merge the slide |
| **Under-filled** | content top-anchored with a large dead band (often the lower third); a small element floats in a big empty region; one edge does all the whitespace | center/distribute the content group; size visuals to fill their region or rebalance the split — set it deck-wide (`slidev-cheatsheet.md` "Fill the canvas" recipe), not per slide |
| **Overstuffed** | > ~40 words of body text, OR > 7 code lines at once, OR more than one primary idea | split into multiple slides; move detail to speaker notes; convert to a diagram |
| **Broken render** | Mermaid/magic-move/component didn't render; missing image (404) | fix syntax via the `slidev` skill; fix asset path (must be `/public`-absolute) |

## Auto-fix loop

```
for each slide:
  screenshot → evaluate against the table
  if any failure:
     apply the prescribed fix → re-render → re-screenshot
repeat until all slides pass, or escalate to the user after N rounds (default 3)
```

If a slide can't pass after N rounds, stop and ask the user — don't ship a broken
slide silently, and don't loop forever.

## Done criteria

- Every slide passes every check.
- The dev server is **left running** in the background.
- The deck is **opened in the browser** at `http://localhost:3030`.
- The list of any remaining `ASSET-TODO` placeholders is surfaced to the user.
