# Blender pass (optional)

Only if the user asks, after the blockout talk already runs.

## Goal

Rebuild hero sets in Blender. Export GLB. Load them in `World.jsx`. Keep the
same `talk.js` slide list and cameras.

## Rules

- If Blender is missing, stop. Keep the blockout. Do not invent a GLB.
- If a Blender skill or Blender MCP is installed, load it. Do not copy its API
  into this file.
- Export **glTF 2.0 binary (`.glb`)**. Apply modifiers. Apply scale. Y-up.
- Compress with `gltf-transform` if it is already on the machine. Do not add a
  new dependency without asking.
- One world unit in the talk ≈ one meter. Match the blockout scale so cameras
  still work.
- After swap: walk the talk, then `npm run build`.

## Do not

- Delay the first runnable talk for this pass.
- Put catalog text into Blender. Text stays on the hero surface painter.
- Change nav, timer, or `talk.js` ids unless a camera must move with the new set.
