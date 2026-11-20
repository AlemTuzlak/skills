# Reactbits Background Catalog

Reference for choosing a [reactbits.dev](https://www.reactbits.dev/backgrounds/) animated background. Loaded by the skill in **Phase 3.0b — Background selection**, after the signature motif is derived in Phase 3.0.

## When to reach for reactbits vs. the default `data-bg` variants

The default `data-bg` variants in `styles.css` (`primary-glow`, `vignette`, `diagonal`, `flat`) are still the right choice for many scenes — especially **hooks and CTAs that need clean focus on text** and **code-dense delivery scenes** where any busy backdrop fights the foreground.

Reach for richer backdrops when the story earns them:

1. The motif's mood needs more atmosphere than a CSS radial gradient can carry (calm, atmospheric, hype, tension).
2. The story has an **establishing-shot** beat (opening hook, transitional intro, CTA close) that earns a cinematic backdrop.
3. The product's metaphor maps directly to a reactbits effect (audio → `LineWaves` / `Waves`; sync → `LiquidEther` / `Threads`; deploy → `Hyperspeed` / `LightRays`).

**Stay on `data-bg` gradients when:**
- The scene is code-dense (delivery / `LibrarySwap` / `CodeSnippet`) — a busy background fights the code.
- The hook or CTA is text-only and benefits from a clean focus surface.
- Render budget is tight (multi-format renders).

Reactbits is **opt-in atmosphere, not a default**. Mixing one reactbits-backed scene against three gradient scenes is fine and often best — the contrast itself reads as deliberate.

## Install

Reactbits ships via the shadcn registry. The components are **copied into the project** (not a runtime npm dep). License: **MIT + Commons Clause** — using them inside a user marketing video is permitted; reselling them as a kit is not.

```bash
# from the scaffolded HyperFrames project root
npx shadcn@latest add @react-bits/<Name>-JS-CSS
```

Use the **JS-CSS** variant — HyperFrames projects are HTML+JS+CSS, no TypeScript and no Tailwind. The component lands at `src/components/<Name>/<Name>.jsx` (or wherever `components.json` resolves).

Because HyperFrames is HTML-driven and reactbits ships React components, the skill **wraps the React component in a tiny mount-shim** that mounts it into a host `<canvas>` slot at scene-load. See `templates/project/reactbits-adapter.js.template` and Phase 4.5 of the main SKILL.md.

## The 41 backgrounds

Columns:

- **Tech** — render path. **OGL-shader** = OGL renderer + custom GLSL fragment shader (rAF-driven; needs adapter). **R3F** = `@react-three/fiber` + `useFrame` (needs adapter). **Three** = raw `three.js` with custom render loop. **Canvas2D** = HTML canvas, no WebGL. **CSS** = pure CSS keyframes (works as-is).
- **Mood** — primary narrative register: `calm`, `technical`, `hype`, `tension`, `playful`, `atmospheric`, `premium`.
- **Mouse default** — `on` means cursor-reactive by default (must be disabled for video). `off` means it doesn't read cursor.
- **Adapter** — `trivial` (≤10 lines: replace rAF with frame-driven update), `moderate` (thread frame through R3F or canvas2D), `hard` (custom physics or postprocessing — use sparingly).
- **Verbs / story-fit** — which signature motif verbs (from `references/visual-motifs.md`) this background reinforces.

| Background | Tech | Mood | Mouse | Adapter | Verbs / story-fit |
|---|---|---|---|---|---|
| **Aurora** | OGL-shader | calm, atmospheric | off | trivial | deploy, ship, sync, scale — slow flowing light reads as "scope" |
| **Balatro** | OGL-shader | playful, hype | on | moderate | generate, transform — strong personality; pair with playful brands only |
| **Ballpit** | Three (physics) | playful | on (followCursor) | hard | ingest, collect — chaotic-into-order; high render cost |
| **Beams** | R3F | atmospheric, technical | off | moderate | route, transmit, broadcast — crossing ribbons read as "channels" |
| **ColorBends** | OGL-shader | hype | unknown | trivial | transform, morph — bold; stays out of code-heavy scenes |
| **DarkVeil** | OGL-shader | tension, atmospheric | off | trivial | reveal, audit, secure — subtle dark with motion under the surface |
| **Dither** | R3F + postprocessing | technical, tension | off | moderate | retro, terminal, technical-trust — strong dev-tool register |
| **DotField** | Canvas2D | technical | on (bulge/glow) | moderate | data, observe, monitor — dot grid with cursor falloff (disable for video) |
| **DotGrid** | Canvas2D | technical | on | moderate | structure, schema, grid — minimal Linear-register backdrop |
| **EvilEye** | OGL-shader | tension | off | trivial | observe, watch, audit — single-eye motif, niche but striking |
| **FaultyTerminal** | OGL-shader | tension, technical | off | moderate | error, debug, terminal — CRT scanlines + flicker; readability-risk behind text |
| **FloatingLines** | OGL-shader / 3D | atmospheric | on | moderate | flow, route, weave — 3D lines responding to motion |
| **Galaxy** | OGL-shader | atmospheric, calm | on | trivial | scale, scope, breadth — parallax stars; epic establishing-shot register |
| **GradientBlinds** | OGL-shader | technical, premium | off | trivial | reveal, segment, slice — layered blinds with spotlight; great hook |
| **Grainient** | OGL-shader (CSS-feel) | calm, premium | off | trivial | premium, polish, calm — grainy gradient swirls; close cousin of `Aurora` |
| **GridDistortion** | OGL-shader | technical, tension | on | moderate | distort, glitch, debug — warped grid; pairs with bug-fix or migration stories |
| **GridMotion** | Canvas2D | technical | on | moderate | flow, route, traverse — perspective grid lines; cyberpunk register |
| **GridScan** | OGL-shader | technical | on | moderate | scan, search, find, audit — 3D scan effect; visualizes the act of looking |
| **Hyperspeed** | Three (postprocessing) | hype | on (mousedown) | hard | accelerate, deploy, ship, faster — strong CTA finale; high render cost |
| **Iridescence** | OGL-shader | calm, premium | on | trivial | shimmer, polish, brand-luxury — Apple/Vercel register; non-narrative atmosphere |
| **LetterGlitch** | Canvas2D | tension, technical | off | trivial | type, parse, decode — Matrix register; cap intensity for WCAG 2.3.1 |
| **Lightning** | OGL-shader | hype, tension | off | trivial | strike, alert, fire — accent only; cap flash rate ≤3/sec for WCAG 2.3.1 |
| **LightPillar** | OGL-shader | atmospheric | off | trivial | spotlight, focus, reveal — vertical pillar; great at frame center for hooks |
| **LightRays** | OGL-shader | atmospheric, calm | off | trivial | reveal, illuminate, deploy — volumetric beams; cinematic establishing register |
| **LineWaves** | OGL-shader | calm | off | trivial | flow, audio, waves — for audio/music products this is a near-direct motif map |
| **LiquidChrome** | OGL-shader | premium, technical | off | trivial | morph, transform, polish — flowing chrome; "premium-tool" register |
| **LiquidEther** | OGL-shader | calm, atmospheric | on | trivial | sync, stream, replicate — flowing liquid reads as "data flowing"; ideal for sync/replication products |
| **Orb** | OGL-shader | atmospheric | on | trivial | focus, center, single-source — single floating orb; pairs with one-product-one-orb framing |
| **Particles** | OGL-shader | atmospheric | optional | trivial | scatter, distribute, ambient — versatile dust/snow/spark register |
| **PixelBlast** | OGL-shader | hype, playful | off | moderate | generate, explode, branch — pixel particle bursts; great for "one → many" beats |
| **PixelSnow** | Canvas2D | calm, playful | off | trivial | falling, gentle, ambient — softer than `Particles`; consumer register |
| **Plasma** | OGL-shader | hype | on | trivial | energy, transform, generate — bold organic; pair with high-energy stories |
| **PlasmaWave** | OGL-shader | hype, tension | off | trivial | wave, propagate, broadcast — raymarched plasma; abstract enough for any story |
| **Prism** | OGL-shader | premium | off | trivial | refract, separate, spectrum — rotating prism; pairs with "split-into-parts" stories |
| **PrismaticBurst** | OGL-shader | hype | off | trivial | burst, launch, release — wide rays from center; great CTA finale; cap flash rate |
| **Radar** | OGL-shader / Canvas2D | technical | on | trivial | search, find, scan, monitor — radar sweep is a near-direct motif map for search products |
| **RippleGrid** | OGL-shader | technical, playful | off | trivial | ripple, propagate, animate-grid — rhythmic; great supporting backdrop |
| **ShapeGrid** | Canvas2D | playful, technical | off | trivial | variety, customize, configure — grid of shape variants; pairs with config products |
| **Silk** | OGL-shader | calm, premium | off | trivial | smooth, polish, brand-luxury — alternative to `Iridescence`; warmer |
| **SoftAurora** | OGL-shader | calm | off | trivial | atmospheric, premium, calm — softer than `Aurora`; cosine-gradient palettes |
| **Threads** | OGL-shader | atmospheric, technical | optional | trivial | weave, connect, integrate — fabric-like motion; pairs with integration/migration stories |
| **Waves** | OGL-shader | calm | off | trivial | flow, oscillate, audio — close cousin of `LineWaves`; layered lines |

## Quick-pick by mood

| Mood | First-pick | Alternates |
|---|---|---|
| **calm** | `SoftAurora` | `Aurora`, `Silk`, `LineWaves`, `Waves`, `Grainient` |
| **technical / dev-tool** | `DotGrid` | `Threads`, `RippleGrid`, `GridScan`, `Dither` |
| **hype / launch** | `PrismaticBurst` | `Hyperspeed`, `Plasma`, `Lightning`, `PixelBlast` |
| **tension / problem-beat** | `DarkVeil` | `LetterGlitch` (low intensity), `GridDistortion`, `FaultyTerminal` |
| **playful / consumer** | `Balatro` | `Ballpit`, `ShapeGrid`, `ColorBends`, `PixelSnow` |
| **atmospheric / cinematic establishing** | `LightRays` | `Galaxy`, `Aurora`, `LightPillar`, `Beams` |
| **premium / brand-luxury** | `Iridescence` | `Silk`, `LiquidChrome`, `Prism`, `Grainient` |

## Quick-pick by motif verb

If you've already derived the signature motif (Phase 3.0), this is faster than browsing by mood.

| Verb (from `visual-motifs.md`) | Reactbits first-pick | Note |
|---|---|---|
| Compose / generate audio | `LineWaves` or `Waves` | Direct motif map — picture-book level fit |
| Sync / replicate / stream | `LiquidEther` | Liquid reads as data flowing |
| Type-check / validate | `DotGrid` or `Dither` | Schema/grid register |
| Generate / synthesize | `PixelBlast` | One → many bursts |
| Compress / optimize | `LiquidChrome` | Morphing surface |
| Transform / migrate | `ColorBends` or `LiquidChrome` | Visible state-shift in the bg |
| Ingest / collect | `Particles` (inward) | Ambient incoming feel |
| Search / retrieve | `Radar` | Direct motif map |
| Sign / secure / authenticate | `DarkVeil` | Calm-but-watchful |
| Deploy / ship | `Hyperspeed` (CTA only) or `LightRays` | Speed feel |
| Query / filter | `GridScan` | Scanning register |
| Cache / memoize | `Iridescence` | Warm-up shimmer |
| Route / match | `Beams` | Crossing channels |
| Format / lint / refactor | `RippleGrid` | Aligning ripple |
| Schedule / orchestrate | `Threads` | Sequencing |
| Monitor / observe | `Radar` or `DotField` | Surveillance register |
| Render / draw | `GradientBlinds` | Reveal register |
| Train / fine-tune (ML) | `Galaxy` | Convergence-of-points feel |
| Chat / respond | `Particles` | Light ambient |
| Test / benchmark | `Hyperspeed` (CTA only) | Speed |

## State-change axis support

The skill's signature motif must visibly **change state** between adjacent scenes (Phase 3.4). Reactbits backgrounds support this in two ways:

1. **Single-component, two prop snapshots.** Render the same component in two states — calm/desaturated in the problem scene, saturated/intense in the solution. Example: `Aurora` with `colorStops={brand.muted}` in problem → `colorStops={brand.primary}` in solution. The HyperFrames mount-shim accepts a `props` object per scene.
2. **Two complementary backgrounds across the arc.** When a single component can't carry the state-change, pair two from the same mood column. Example: `DarkVeil` (problem) → `LightRays` (solution).

A reactbits background that holds the same props across the whole video is not pulling its weight.

## Frame-locking — the must-do adapter

**This is the load-bearing piece.** Reactbits backgrounds animate via `requestAnimationFrame` + `performance.now()`. HyperFrames renders by stepping a headless Chromium frame-by-frame, freezing wall-clock time. Dropped in naively, every captured frame would show the same `uTime` — the background is **frozen** in the rendered mp4 even though it animates fine in preview.

The HyperFrames adapter (in `templates/project/reactbits-adapter.js.template`) hooks every reactbits mount to the GSAP timeline so its time advances when GSAP advances. Since HyperFrames seeks the GSAP timeline frame-by-frame during render, the reactbits canvas redraws per seek with the correct `uTime`.

The short version (per OGL-shader component, after `npx shadcn add`):

```js
// In the copied <Aurora>.jsx, locate the rAF loop. Replace:
//   const update = (t) => { program.uniforms.uTime.value = t * 0.001; ... requestAnimationFrame(update); };
//   requestAnimationFrame(update);
// With:
//   window.__reactbitsRegistry.register((time) => {
//     program.uniforms.uTime.value = time;
//     renderer.render({ scene: mesh });
//   });
// And: any `mouseInteraction` / `mouseReact` prop → false.
```

The registry is set up by `reactbits-adapter.js`, which runs a GSAP `gsap.ticker.add(...)` listener that computes `time = gsap.globalTimeline.totalTime()` and dispatches it to every registered background.

For R3F components (`Beams`, `Dither`): React mount inside a HyperFrames `<div data-reactbits-mount>` slot via the adapter. The adapter overrides R3F's `useFrame` shim with a frame-driven equivalent.

For `hard` adapter components (`Ballpit`, `Hyperspeed`): consider whether a simpler component reaches the same mood. Their physics integration tends to drift under frame-stepping; if you must use them, accept slight non-determinism between renders.

## Render config

HyperFrames render passes WebGL through to headless Chrome by default for compositions that use `<canvas>`. Verify with:

```bash
npx hyperframes doctor
```

If reactbits backgrounds render as black frames in the output mp4, run with the explicit GL flag (check the `hyperframes-cli` skill for the current flag — versions vary):

```bash
npx hyperframes render --gl=angle
```

## Safety: WCAG 2.3.1 photosensitive-seizure

Backgrounds with strobe/flash characteristics must respect the **three-flashes-per-second** ceiling (WCAG 2.3.1). Specifically:

- `Lightning` — cap intensity to ≤0.6 and frequency to ≤2 strikes/sec.
- `LetterGlitch` — cap glitch speed so visible character cycling stays ≤3/sec on any fixed glyph cell.
- `PrismaticBurst` — cap flash rate ≤2/sec.
- `FaultyTerminal` — cap scanline jump rate.

If the user requests "make it more intense" on any of the four above, the skill must respond once with the WCAG ceiling and only escalate if the user explicitly accepts the risk.

## What this catalog does NOT replace

- The **signature motif** rule (Phase 3.0) is still load-bearing.
- The **state-change** rule (Phase 3.4) still applies.
- The **figure/ground** rule (Layout Rule 6) still applies — effective bg opacity behind hero text stays ≤0.22, or a scrim layer is added.
- The **`data-bg` gradient variants are still the default**. This catalog is opt-in atmosphere, used per scene where it serves the story.
