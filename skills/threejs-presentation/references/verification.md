# Gate 3 — Self-verify (Three.js)

Verify the **running talk**, not only the source.

## Procedure

1. Start `npm run dev` in the background. Wait until the local URL returns HTTP 200.
2. Open the talk. Walk every slide with arrow keys. Walk Enter steps on slides
   that have `steps > 1`.
3. Open `?flat=1`. The catalog content must match the glass.
4. Open `?slide=<id>` for a middle slide. The camera must land settled. The
   matching form must be on the glass.
5. If the user wanted a timer: load, confirm it is hidden, press `T` to start,
   press `T` to stop. If they did not want a timer, `T` does nothing.
6. Run `npm run build`. Confirm `dist/` exists. Do not upload.

## Checks

| Check | Fail when | Fix |
|-------|-----------|-----|
| **Keys** | arrows step the glass, or Enter changes slides | restore talk keys |
| **Counter** | `n / N` missing | Hud always mounts the counter |
| **Timer** | visible at load, or `T` ignored when timer is on | hide until first `T`; wire `toggleTimer` |
| **Flat** | `?flat` shows different text than the glass | one painter for both |
| **Deep link** | `?slide=` shows the wrong slide or a moving camera | apply waypoint immediately on load |
| **Punch** | a chart is tiny objects in the room | move data to a catalog form |
| **Yo-yo** | glass and room alternate every slide | group punch beats |
| **Text budget** | > ~25 words of body, or > 7 code lines | cut or split |
| **Build** | `npm run build` fails | fix, then rebuild |

## Done criteria

- Every check passes.
- `npm run dev` is left running.
- The talk is open in the browser.
- `dist/` exists.
- Remaining asset placeholders are listed to the user.
