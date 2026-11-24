# 3D Elements Reference (Remotion)

Patterns for adding Three.js / `@remotion/three` elements to a video — flying logos, 3D cards, depth-driven motifs. Loaded by the skill when a scene plan calls for a 3D moment.

## When 3D earns its place

3D is high-bandwidth — it pulls the eye instantly. Use it when **one** of these is true:

1. **Establishing-shot hook**: a 3D rendered version of the user's logo flies in, settles, fades to the headline. The logo arrives once, with weight, and the rest of the video is 2D. (Apple-keynote opener register.)
2. **CTA finale**: a 3D card stack of "what's new" lifts off and resolves into the URL pill. A confident close.
3. **Direct metaphor map**: the product literally is a 3D thing (a CAD tool, a 3D viewer, a game engine, an AR/VR product). Then a 3D moment is *demonstrating*, not decorating.
4. **Match-cut bridge**: a 2D motif (e.g., a square card) extrudes into a 3D rotation that becomes a different 2D card on the next scene.

**Do NOT use 3D for:**
- Code delivery / `LibrarySwap` / `CodeSnippet` scenes — the foreground is dense; a rotating 3D card behind it is competing motion.
- Bullet lists / evidence cards — the 2D layout already communicates structure; 3D adds noise.
- "Make it pop" decoration without a narrative reason — that's where this rule fails most.

The "≥3× foreground motion rate vs. background motion" rule (Layout Rule 6 of the SKILL) extends to 3D: if a 3D camera is panning at the same time the 2D headline is animating in, the eye stalls. Either the 3D moment **owns the scene** (no competing 2D motion that frame), or it sits still while the 2D foreground animates.

## Stack

```bash
# Optional installs gated on user opting in to a 3D scene
pnpm add @remotion/three @react-three/fiber three @types/three
# Optional add-ons:
pnpm add @react-three/drei                    # cameras, loaders, RoundedBox
pnpm add @react-three/postprocessing          # bloom, depth of field — use sparingly
```

The skill does not pre-install these — they only appear when the user accepts a 3D scene in the plan.

## The frame-driven discipline (read first)

Same problem as reactbits backgrounds: Remotion freezes wall-clock time per frame. **Never use `useFrame` from R3F** — its callback receives `state.clock.getElapsedTime()`, which is wall-driven and won't capture deterministically. Pass `useCurrentFrame()` from the parent and derive every animated value from `frame`.

**Wrong** (animation freezes in the rendered mp4):

```tsx
function Logo() {
  useFrame((state, delta) => {
    meshRef.current.rotation.y += delta;  // wall-clock — freezes per render frame
  });
  return <mesh ref={meshRef}>...</mesh>;
}
```

**Right** (frame-driven; deterministic across renders):

```tsx
function Logo({ frame, fps }: { frame: number; fps: number }) {
  const t = frame / fps;
  return (
    <mesh rotation={[0, t * 0.6, 0]}>
      <planeGeometry args={[2, 2]} />
      <meshStandardMaterial map={logoTexture} />
    </mesh>
  );
}
```

## Pattern 1 — Flying logo

Logo enters from off-canvas, rotates and scales as it travels, settles at hero position with a confident overshoot.

```tsx
// src/scenes/custom/Logo3DEntry.tsx
import { AbsoluteFill, Img, useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { TextureLoader } from "three";
import { useLoader } from "@react-three/fiber";
import { brand } from "../../brand";

export default function Logo3DEntry() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Travel: start far, off-axis; settle dead-center.
  const z = interpolate(frame, [0, 24, 36], [-12, 0.5, 0], { extrapolateRight: "clamp" });
  const x = interpolate(frame, [0, 30], [-4, 0], { extrapolateRight: "clamp" });
  const rotY = interpolate(frame, [0, 36], [-Math.PI * 1.5, 0], { extrapolateRight: "clamp" });
  const scale = spring({ frame, fps, config: { damping: 14 }, durationInFrames: 30 });

  return (
    <AbsoluteFill style={{ backgroundColor: brand.colors.background }}>
      <ThreeCanvas width={1920} height={1080}>
        <ambientLight intensity={0.5} />
        <directionalLight position={[3, 4, 5]} intensity={1.0} />
        <LogoMesh position={[x, 0, z]} rotation={[0, rotY, 0]} scale={scale} />
      </ThreeCanvas>
    </AbsoluteFill>
  );
}

function LogoMesh(props: { position: [number, number, number]; rotation: [number, number, number]; scale: number }) {
  const tex = useLoader(TextureLoader, "/logo.png"); // public/ in the project
  return (
    <mesh {...props}>
      <planeGeometry args={[3, 3]} />
      <meshStandardMaterial map={tex} transparent />
    </mesh>
  );
}
```

**Story rule:** the logo lands BEFORE the headline animates in. The viewer's eye should already be at the brand mark when the words appear. Don't run them in parallel — the 3D moment owns the first beat.

**The user's "kite flies across the slide" idea** is exactly this pattern, with two differences:

- The travel path is a curve (`x = interpolate(frame, [0, 90], [-8, 8])`, `y = sin(frame * 0.1) * 1.2`) instead of a straight settle.
- The kite stays small (`scale ~0.4`) and crosses the canvas while the headline is the focal element. It supports, doesn't replace.

When the brand asset *is* a literal physical metaphor (kite for "soaring", rocket for "deploy", lock for "secure"), the 3D treatment maps the asset to its narrative motion — the rocket actually launches, the lock actually clicks shut.

## Pattern 2 — 3D card stack

Cards fly in sequentially, settle into a small stack with parallax, then dissolve to the headline. Good CTA finale move.

```tsx
// src/scenes/custom/CardStack3D.tsx
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { RoundedBox } from "@react-three/drei";

export default function CardStack3D({ cards }: { cards: { label: string; color: string }[] }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <AbsoluteFill>
      <ThreeCanvas width={1920} height={1080}>
        <ambientLight intensity={0.6} />
        <directionalLight position={[2, 3, 4]} intensity={0.9} />
        {cards.map((c, i) => {
          const enterFrame = i * 8;
          const z = interpolate(frame - enterFrame, [0, 24], [-6, -i * 0.3], { extrapolateRight: "clamp" });
          const y = interpolate(frame - enterFrame, [0, 24], [-3, i * 0.15], { extrapolateRight: "clamp" });
          return (
            <group key={i} position={[0, y, z]} rotation={[-0.05, 0.08 * (i - cards.length / 2), 0]}>
              <RoundedBox args={[3.6, 2.0, 0.12]} radius={0.1} smoothness={4}>
                <meshStandardMaterial color={c.color} />
              </RoundedBox>
            </group>
          );
        })}
      </ThreeCanvas>
    </AbsoluteFill>
  );
}
```

The label text on each card is *not* drawn inside the 3D scene — it's overlaid as 2D text in `<AbsoluteFill style={{ zIndex: 2 }}>` above the canvas. Reasons:

1. 2D text renders crisp at any resolution; 3D-rendered text needs a high-poly font and antialiasing tricks.
2. The overlay text can use the project's `<Highlight>` and `**word**` emphasis system; in-3D text can't.
3. Match-cut transitions to the next 2D scene preserve the text position; 3D-text-to-2D-text is a hard cut.

## Pattern 3 — Match-cut: 2D card extrudes into 3D rotation

Bridge two scenes with a card that's flat in scene N, then extrudes and rotates 90° in the last 8 frames, landing on its edge to become the start of scene N+1. The skill's match-cut rule (Phase 3.4) is satisfied: position and core geometry continuous, only state changes.

Pseudocode:

```tsx
// Last 8 frames of scene N
const t = (frame - (sceneEnd - 8)) / 8;
const depth = interpolate(t, [0, 1], [0.02, 1.5]);
const rotY = interpolate(t, [0, 1], [0, Math.PI / 2]);
return (
  <ThreeCanvas width={1920} height={1080}>
    <RoundedBox args={[3.6, 2.0, depth]} rotation={[0, rotY, 0]}>
      ...
    </RoundedBox>
  </ThreeCanvas>
);
```

Then scene N+1 opens with the same RoundedBox starting from `rotation=[0, Math.PI/2, 0]` and continuing to its target pose.

## Render config

When any scene uses `<ThreeCanvas>`, the render command needs WebGL:

```bash
pnpm exec remotion render src/index.ts Main out/video.mp4 \
  --codec h264 --crf 14 --image-format png --pixel-format yuv420p \
  --scale 2 \
  --gl=angle
```

For long renders (≥60s) with 3D scenes, split into chunks to avoid ANGLE memory accumulation:

```bash
pnpm exec remotion render src/index.ts Main out/part-1.mp4 --gl=angle --frames=0-450
pnpm exec remotion render src/index.ts Main out/part-2.mp4 --gl=angle --frames=451-900
# Then concat with ffmpeg
```

## Asset loading

Logo PNGs and other textures must be loaded with `useLoader(TextureLoader, ...)`. Wrap the load in `delayRender` / `continueRender` only if the texture is critical to frame 0 — usually `<Suspense fallback={null}>` is enough.

```tsx
import { Suspense } from "react";
// ...
<ThreeCanvas>
  <Suspense fallback={null}>
    <LogoMesh />
  </Suspense>
</ThreeCanvas>
```

## Pre-render checks (3D-specific)

Add to the existing Phase 6.1 audit when any scene is 3D:

- [ ] `--gl=angle` (or `--gl=swangle`) is in the render command.
- [ ] No `useFrame` callback exists in any 3D scene component (grep for `useFrame` — should match zero).
- [ ] Every animated 3D value derives from `useCurrentFrame()` somewhere up the tree.
- [ ] Texture assets (`.png`, `.jpg`, `.glb`, `.gltf`) referenced in 3D scenes exist on disk under `public/` or the configured assets dir.
- [ ] The 3D scene either *owns* its frame (no competing 2D motion) or sits still while 2D foreground animates. Concurrent 3D-camera + 2D-text-entry fails the figure/ground check.

## What 3D does NOT replace

- The signature motif rule still applies. A 3D logo entry doesn't exempt the video from a recurring 2D motif across the other scenes.
- The pacing variance rule still applies. A 4-second 3D hook plus three uniform 6-second 2D scenes still flunks variance.
- The first-10-seconds value-prop rule still applies. A 5-second 3D logo flythrough that doesn't communicate what the product *does* steals time from the value-prop. Either the 3D logo entry is ≤3 seconds, or the headline appears within it (overlay) so the value lands by t=8s.
