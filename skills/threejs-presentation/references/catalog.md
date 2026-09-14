# Catalog

Content on the hero surface is a **closed list of forms**. The agent fills a
form. It does not invent a renderer.

Paint onto a canvas texture on the surface mesh. No HTML in the projected
picture. `?flat` uses the same painter on a 2D canvas.

## Forms

| Form | Use | Fields |
|------|-----|--------|
| `title` | Open / section | `kicker`, `title` |
| `statement` | One claim | `title` |
| `quote` | Someone else's words | `quote`, `attribution` |
| `chart` | One comparison | `title`, `bars: [{label, value}]` |
| `code` | ≤5–7 lines | `title`, `lang`, `lines`, `highlight` |
| `image` | Real asset or placeholder | `title`, `src`, `caption` |
| `punch` | World is the slide | optional `title` on a dim glass |

## `src/talk.js` shape

```js
export const talk = {
  timer: false,
  durationMinutes: 20,
  theme: { bg: '#0b0b0c', ink: '#f4f1ea', accent: '#c8ff00' },
}

export const slides = [
  {
    id: 'hook',
    camera: { position: [0, 1.6, 4], lookAt: [0, 1.4, 0] },
    form: 'title',
    kicker: 'Conference',
    title: 'The assertion goes here',
    steps: 1,
    notes: 'Say this. Not on the glass.',
  },
]
```

- `id` is the `?slide=` value. Stable, kebab-case.
- `camera.position` and `camera.lookAt` are world units.
- `steps` defaults to 1. Enter advances `step` from 0 to `steps - 1`.
- Chart and code forms can reveal with `step` (one more bar, one more highlight).
- `punch` slides still have a camera. The painter leaves the glass empty or dim.

## Text budget

Same as `presentation` craft. Title ≤ ~10 words. Body ≤ ~20 words. Code ≤5–7
lines. Detail in `notes`.

## Punch vs glass

Most slides: a catalog form that **fills the surface**.

Punch slides: the camera shows the world or a 3D mechanism. Do not put a chart
as tiny objects in the room. Data in the room is not readable from the hall. Data fills the glass.
