# image-to-3d-asset

You have concept art of a game character, and you need a model that moves in the engine. This skill turns the art into a textured mesh, adds a Mixamo skeleton, and puts animation clips on it. It uses Meshy through [TanStack AI](https://tanstack.com/ai) (`@tanstack/ai` and `@tanstack/ai-meshy`). Props (chests, barrels, weapons) get a mesh only.

## What you get

- A mesh of about 300,000 triangles (the Meshy maximum) with 4k PBR textures (GLB, FBX, USDZ, OBJ, STL).
- A rigged GLB and FBX: 44 Mixamo bones, root `mixamorig:Hips`. In Unity, use the rig type that the project declares. With no declaration, use Generic. Humanoid needs the checks in [motion-for-3d-asset Bones](../motion-for-3d-asset/SKILL.md#bones).
- Library clips (805 motion capture clips) and text-to-motion clips, as GLB and FBX.
- Blender checks: 4 renders of the mesh, and a contact sheet and numbers for each clip. Each report starts with the SHA-256 of the file that it measured.
- Optional LODs of 80,000 and 25,000 triangles for battle views.
- A `manifest.json` that keeps the source history: each Meshy task id, its parent task, and the SHA-256 of each file.

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

## One folder for each mesh

An output folder holds one mesh and the tasks made from it. The script keeps that history safe:

1. **No overwrite.** A download never writes over a file. A name that is taken gets `-2`.
2. **No replaced task.** A second mesh, remesh, or rig in one folder stops before it spends credits. A new mesh needs a new `--out`.
3. **No stale parent.** A rig of an earlier mesh, or a clip of another rig, stops the step. Such a folder comes from an older version of the script.
4. **One take for each name.** A new take of a clip needs a new clip name, so the earlier take keeps its files.

Do not edit a Meshy file. Save each changed file (a LOD export, a converted clip) in another folder. To measure a changed clip, give `analyze.py` the native report with `--native`. The corrected report then shows how far each change moved the clip.

## LODs for games

The 300,000-triangle rig is for close-up screens. In battle, the engine can show a lighter LOD. In the test, a 61,890-triangle mesh had flat facets on the face in a close-up, but looked the same at full-body distance.

1. Rig the full mesh first. Then make each LOD in its own folder. Get the id from `meshTaskId` in `C:/out/samurai/manifest.json`:

   ```bash
   node scripts/meshy.mjs remesh --polycount 80000 --task <meshTaskId> --out C:/out/samurai/lod1
   node scripts/meshy.mjs remesh --polycount 25000 --task <meshTaskId> --out C:/out/samurai/lod2
   ```

2. In Blender, transfer the weights from the rigged mesh to each LOD, and bind each LOD to the same armature. Then all LODs share one rig and one set of clips. The rigged mesh is the source, so select it last: Blender copies from the active object to the other selected objects. [SKILL.md step 6](SKILL.md#6-lods-for-games-optional) has the steps.
3. Check each LOD export: no vertex without weights, the same bones as the rig, and the same bends in one clip.
4. In the engine, put the three meshes in one LOD group. The engine switches them by distance or by a quality setting.

## Use the files in a game

If the game repo has `scripts/character-production.ps1`, the files enter the game only through its production gates: `Plan`, `Build`, `Check`, `Capture`, and `Promote`. The production record copies the task ids, the file hashes, and the take of each clip from `manifest.json` and the native QA reports. `Promote` runs only after the owner accepts the review receipt. [SKILL.md Game project gates](SKILL.md#game-project-gates) has the commands.

## Cost per step

| Step | Credits | Time in the test |
|---|---|---|
| `balance`, `actions` | 0 | under 5 s |
| `mesh` (character, 3 views) | 40 | about 4 min |
| `remesh`, each LOD | 5 | about 4 min |
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

Known limits:

- The hand has only thumb and middle finger bones. The hand closes like a mitten.
- A one-hand clip (for example the library Charged Slash) does not fit a two-hand weapon. A hand correction cannot make it fit.
