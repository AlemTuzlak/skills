# Skeleton

Copy `template/` into the talk folder. Do not generate a Vite app from scratch.

## Always present

- Vite + React Three Fiber + drei + zustand
- Camera rig that lerps to the current slide's waypoint
- Hero surface + catalog painter
- Slide list in `src/talk.js`
- Slide counter (`n / N`)
- Optional timer (`T` start, `T` stop)
- `?flat` (same painter, no WebGL)
- `?slide=id`
- Zurich keys: arrows = slide, Enter / Backspace = step, `f` = fullscreen,
  Space unbound
- `src/scene/World.jsx` as the world slot (blockout, later GLB)
- Offline, seeded, deterministic

## Commands

```bash
npm install
npm run dev      # preview
npm run build    # static dist/
```

Do not add a deploy script. The user uploads `dist` if they want.

## Files you edit per talk

| File | Job |
|------|-----|
| `src/talk.js` | slides, timer flag, duration, theme |
| `src/scene/World.jsx` | the unique world |
| `public/` | images, later GLBs |

Do not fork the nav, painter, or timer unless the user asks.

## Helper skills

If a Three.js or R3F skill is installed, load it when you write `World.jsx`.
This skeleton already owns camera, nav, and the surface.
