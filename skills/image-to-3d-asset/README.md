# image-to-3d-asset

You have concept art of a game character, and you need a model that moves in the engine. This skill turns the art into a textured mesh, adds a Mixamo skeleton, and puts animation clips on it. It uses Meshy through [TanStack AI](https://tanstack.com/ai) (`@tanstack/ai` and `@tanstack/ai-meshy`). Props (chests, barrels, weapons) get a mesh only.

## What you get

- A mesh of about 60,000 triangles with 4k PBR textures (GLB, FBX, USDZ, OBJ, STL).
- A rigged GLB and FBX: 44 Mixamo bones, root `mixamorig:Hips`. It maps to Unity Humanoid.
- Library clips (805 motion capture clips) and text-to-motion clips, as GLB and FBX.
- Blender checks: 4 renders of the mesh, and a contact sheet and numbers for each clip.

## Quick start

Ask the agent: `/image-to-3d-asset make a rigged character from samurai-turnaround.png`. Or run it by hand from the skill folder. You need Node 20 or newer, Blender 5.x, and a Meshy API key in `MESHY_API_KEY`.

1. Install the packages once:

   ```bash
   npm install --prefix scripts
   node scripts/meshy.mjs balance
   ```

2. Split the turnaround sheet into 3 views:

   ```bash
   blender --background --factory-startup --python scripts/qa/split-sheet.py -- C:/art/samurai-sheet.png 3 C:/out/samurai/views
   ```

3. Make the mesh, then check it. Look at `samurai.renders.png` before you rig:

   ```bash
   node scripts/meshy.mjs mesh C:/out/samurai/views/view-1.png C:/out/samurai/views/view-2.png C:/out/samurai/views/view-3.png --name samurai --out C:/out/samurai
   blender --background --factory-startup --python scripts/qa/mesh-check.py -- C:/out/samurai/samurai.glb C:/out/samurai/samurai.check.json C:/out/samurai/samurai.renders.png
   ```

4. Rig it. Give the height in meters:

   ```bash
   node scripts/meshy.mjs rig --height 1.8 --out C:/out/samurai
   ```

5. Add clips. Find ids with `actions`, then add one library clip for each call. Add text clips from a `clips.json` file:

   ```bash
   node scripts/meshy.mjs actions --category Fighting
   node scripts/meshy.mjs animate --actions 0 --out C:/out/samurai
   node scripts/meshy.mjs motion clips.json --out C:/out/samurai
   ```

Use the same `--out` for every step. The script keeps the Meshy task ids in `manifest.json` there, so each step finds the step before it.

For a prop, run `node scripts/meshy.mjs mesh chest.png --mode prop --out C:/out/props`.

## Cost per step

| Step | Credits | Time in the test |
|---|---|---|
| `balance`, `actions` | 0 | under 5 s |
| `mesh` (character, 3 views) | 40 | about 4 min |
| `remesh` (only above 380,000 triangles) | 5 | about 4 min |
| `rig` | 5 | about 1.5 min |
| `animate`, each library clip | 3 | about 30 s |
| `motion`, each text clip | about 11 | about 1 min |

The full test run (mesh, remesh, rig, 6 library clips, 3 text clips) cost 102 credits. Meshy deletes the task files after 3 days. The script downloads every file at once.

## The input rules that matter most

1. **No weapon in the hand.** A sword joins the hand and the leg, and the rig cannot separate them. Make the weapon as a prop, and attach it to the hand bone in the engine.
2. **A-pose or T-pose, with open, empty hands** away from the body.
3. **A turnaround sheet** (front, side, back) of one character on a plain background.

## What worked in the test

| Clip type | Use | Why |
|---|---|---|
| Idle, walk, run, hit | Library clips | The library idle and hit were good. Walk and run are clean loops in place. The text idle was frozen. |
| Signature attack | Text to motion | The katana cleave had a big wind-up and both hands stayed on the handle. |
| Weapon | Prop mode, attached in the engine | A weapon in the concept art breaks the mesh. |

Known limit: the hand has only thumb and middle finger bones. The hand closes like a mitten.
