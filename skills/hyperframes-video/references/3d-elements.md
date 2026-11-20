# 3D Elements Reference (HyperFrames)

Patterns for adding Three.js-driven 3D moments to a HyperFrames composition — flying logos, 3D cards, depth-driven motifs. Loaded by the skill when a scene plan calls for a 3D moment.

## When 3D earns its place

Same rules as the 2D-vs-reactbits decision: 3D is high-bandwidth — it pulls the eye instantly. Use it when **one** of these is true:

1. **Establishing-shot hook**: a 3D rendered version of the user's logo flies in, settles, fades to the headline. The logo arrives once, with weight, and the rest of the video is 2D. (Apple-keynote opener register.)
2. **CTA finale**: a 3D card stack lifts off and resolves into the URL pill. A confident close.
3. **Direct metaphor map**: the product literally is a 3D thing (CAD, 3D viewer, game engine, AR/VR). Then 3D is *demonstrating*, not decorating.
4. **Match-cut bridge**: a 2D card extrudes into a 3D rotation that becomes a different 2D card on the next scene.

**Do NOT use 3D for:**
- Code delivery / `LibrarySwap` / `CodeSnippet` scenes — the foreground is dense.
- Bullet lists / evidence cards — 2D layout already communicates structure.
- Decoration without a narrative reason.

The "≥3× foreground motion rate vs. background motion" rule (Layout Rule 6 of the SKILL) extends to 3D: the 3D moment **owns its scene's frame** (no competing 2D motion that frame), or it sits still while the 2D foreground animates.

## Stack (HyperFrames)

HyperFrames is HTML+CSS+JS, no React build step. For 3D, ship Three.js via CDN inside the scene's `<script>`:

```html
<script type="importmap">
  {
    "imports": {
      "three": "https://cdn.jsdelivr.net/npm/three@0.169.0/build/three.module.js",
      "three/addons/": "https://cdn.jsdelivr.net/npm/three@0.169.0/examples/jsm/"
    }
  }
</script>
<script type="module">
  import * as THREE from "three";
  import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
  // ...
</script>
```

Pin the `three` version once and reuse — different 3D scenes in the same composition must agree on the Three version, or `import maps` will fight.

## The frame-driven discipline (read first)

HyperFrames steps frames during render and seeks the GSAP timeline to each frame. Wall-clock-driven animation (`requestAnimationFrame` with `performance.now()`) does NOT capture deterministically — every frame would render the same time.

**Drive every animated value from a GSAP-timeline-bound `time` source.** The simplest pattern: register the 3D scene's render function as a `gsap.ticker` callback so it fires whenever GSAP advances (which is every frame during render).

**Wrong** (animation freezes in the rendered mp4):

```js
function loop(t) {
  mesh.rotation.y = t * 0.001;  // wall-clock — freezes per render frame
  renderer.render(scene, camera);
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
```

**Right** (timeline-driven; deterministic across renders):

```js
gsap.ticker.add((tickTime, deltaTime, frame) => {
  const t = gsap.globalTimeline.totalTime();  // frame-locked under hyperframes render
  mesh.rotation.y = t * 0.6;
  renderer.render(scene, camera);
});
```

## Pattern 1 — Flying logo

Logo enters from off-canvas, rotates and scales as it travels, settles at hero position with a confident overshoot.

```html
<!-- compositions/scenes/custom/Logo3DEntry.html -->
<div data-clip-id="logo-3d-entry" data-duration="3" data-bg="flat">
  <canvas data-3d="logo" style="position:absolute;inset:0;width:100%;height:100%"></canvas>

  <script type="module">
    import * as THREE from "three";

    const canvas = document.querySelector('[data-clip-id="logo-3d-entry"] [data-3d="logo"]');
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, 16 / 9, 0.1, 100);
    camera.position.z = 5;

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setSize(1920, 1080, false);
    renderer.setPixelRatio(2);

    const tex = new THREE.TextureLoader().load("./assets/logo.png");
    const mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(3, 3),
      new THREE.MeshStandardMaterial({ map: tex, transparent: true })
    );
    scene.add(mesh);
    scene.add(new THREE.AmbientLight(0xffffff, 0.5));
    const dir = new THREE.DirectionalLight(0xffffff, 1.0);
    dir.position.set(3, 4, 5);
    scene.add(dir);

    // Frame-locked render via GSAP timeline
    const tl = gsap.timeline({ paused: true, data: { clipId: "logo-3d-entry" } });
    tl.fromTo(mesh.position, { x: -4, z: -12 }, { x: 0, z: 0, duration: 1.2, ease: "power3.out" }, 0);
    tl.fromTo(mesh.rotation, { y: -Math.PI * 1.5 }, { y: 0, duration: 1.2, ease: "power3.out" }, 0);
    tl.fromTo(mesh.scale, { x: 0, y: 0, z: 0 }, { x: 1, y: 1, z: 1, duration: 1.0, ease: "back.out(1.6)" }, 0.1);

    // Render once per timeline tick
    tl.eventCallback("onUpdate", () => renderer.render(scene, camera));
    // Also redraw at frame 0 so the still poster is correct
    renderer.render(scene, camera);
    window.__hyperframes?.registerTimeline?.(tl);
  </script>
</div>
```

**Story rule:** the logo lands BEFORE the headline animates in. The viewer's eye should already be at the brand mark when the words appear. Don't run them in parallel — the 3D moment owns the first beat.

**The user's "kite flies across the slide" idea** is exactly this pattern, with two differences:

- The travel path is a curve (`tl.to(mesh.position, { x: 8, duration: 3, ease: "none" })` plus `tl.to(mesh.position, { y: "+=1.2", repeat: -1, yoyo: true })`).
- The kite stays small (`mesh.scale.setScalar(0.4)`) and crosses the canvas while the headline is the focal element. It supports, doesn't replace.

When the brand asset *is* a literal physical metaphor (kite for "soaring", rocket for "deploy", lock for "secure"), the 3D treatment maps the asset to its narrative motion — the rocket actually launches, the lock actually clicks shut.

## Pattern 2 — 3D card stack

Cards fly in sequentially, settle into a small stack with parallax, then dissolve to the headline. Good CTA finale.

```js
// Inside a scene's <script type="module">
import * as THREE from "three";

const cards = [
  { label: "Streaming", color: 0x8b5cf6 },
  { label: "Type-safe", color: 0x3b82f6 },
  { label: "Open source", color: 0x22c55e },
];

cards.forEach((c, i) => {
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(3.6, 2.0, 0.12),
    new THREE.MeshStandardMaterial({ color: c.color })
  );
  scene.add(mesh);
  tl.fromTo(
    mesh.position,
    { z: -6, y: -3 },
    { z: -i * 0.3, y: i * 0.15, duration: 0.8, ease: "back.out(1.4)" },
    i * 0.27
  );
});
```

The label text on each card is **not** drawn inside the 3D scene — it's overlaid as 2D HTML text in a sibling `<div>` with `position: absolute`. Reasons:

1. 2D text renders crisp at any resolution; 3D-rendered text needs a high-poly font.
2. The overlay text uses the project's `<Highlight>` / `**word**` emphasis system; in-3D text can't.
3. Match-cut transitions to the next 2D scene preserve the text position.

## Pattern 3 — Match-cut: 2D card extrudes into 3D rotation

Bridge two scenes with a card flat in scene N, then extruded/rotated 90° in the last 8 frames. Phase 3.4 (match-cut) is satisfied: position and core geometry continuous, only state changes.

In scene N's last 8 frames:

```js
tl.to(mesh.scale, { z: 75, duration: 0.27, ease: "power2.in" }, "<");  // extrude on z
tl.to(mesh.rotation, { y: Math.PI / 2, duration: 0.27, ease: "power2.in" }, "<");
```

Scene N+1 opens with the box already at `rotation.y = Math.PI / 2` and continues to its target pose.

## Render config

`npx hyperframes render` should preserve WebGL by default. If the rendered output shows black frames where the 3D scene runs:

1. Run `npx hyperframes doctor` to verify Chromium and GL setup.
2. If the CLI version supports it, pass `--gl=angle`. Check the `hyperframes-cli` skill for the current flag — versions vary.
3. As a fallback, render the 3D scene to mp4 separately and embed via `<video>` in the composition (loses match-cut but always works).

## Asset loading

Logo PNGs and other textures must be loaded with `THREE.TextureLoader`. Wait for the texture to load before the timeline starts:

```js
const tex = await new Promise((resolve, reject) => {
  new THREE.TextureLoader().load("./assets/logo.png", resolve, undefined, reject);
});
```

If you skip the await, the first frames render with an undefined texture (often pink/black).

## Pre-render checks (3D-specific)

Add to the existing Phase 6.1 audit when any scene is 3D:

- [ ] Every animated 3D property is set inside a GSAP timeline tween (not a `requestAnimationFrame` recursive loop).
- [ ] `renderer.render(scene, camera)` is called from `tl.eventCallback("onUpdate", ...)` or `gsap.ticker.add(...)`, not from a wall-clock rAF.
- [ ] Texture assets referenced in 3D scenes exist on disk under the project's `assets/` dir and are awaited before timeline play.
- [ ] The 3D scene either *owns* its frame (no competing 2D motion) or sits still while 2D foreground animates.
- [ ] `npx hyperframes inspect` runs cleanly — the 3D `<canvas>` doesn't overlap or clip the foreground text.

## What 3D does NOT replace

- The signature motif rule still applies.
- The pacing variance rule still applies.
- The first-10-seconds value-prop rule still applies — a 5-second 3D logo flythrough that doesn't communicate what the product *does* steals time from the value-prop. Either the 3D logo entry is ≤3 seconds, or the headline appears within it (overlay) so the value lands by t=8s.
