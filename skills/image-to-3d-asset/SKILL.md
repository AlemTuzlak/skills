---
name: image-to-3d-asset
description: Use when the user wants a 3D model, mesh, or GLB made from one or more images, for example a game character from concept art or a turnaround sheet, or a game prop. It also rigs the character and animates it with Meshy library clips and text-to-motion clips. Triggers on "image to 3D", "make a mesh from this image", "GLB from this picture", "game character from concept art", "rig this character", "animate with Meshy", or /image-to-3d-asset. Don't use for 3D work inside Blender scenes, or for text-to-3D with no image.
---

# Image to 3D Asset

Turn concept art into a game character: a textured mesh, a Mixamo skeleton, and animation clips. A prop gets a mesh only. The script `scripts/meshy.mjs` calls Meshy through TanStack AI (`@tanstack/ai` and `@tanstack/ai-meshy`). Each step writes its Meshy task id to `<out>/manifest.json`, so the next step finds it. Each step downloads its files at once, because Meshy deletes task files after 3 days.

In the commands below:

- `<skill-dir>` is the folder of this skill.
- `<motion-dir>` is the sibling skill folder `<skill-dir>/../motion-for-3d-asset`.
- `<out>` is one output folder for one character. Use the same `<out>` for every step.
- `blender` is Blender 5.x (5.3 is tested), run headless.

## Input rules

The input decides the quality. Check the image before you spend credits. If an image breaks a rule, tell the user and ask for a new image.

- One character, full body, on a plain background.
- A-pose or T-pose. The arms and the hands are away from the body.
- The hands are open and empty. **No weapon in the hand.** A sword in the hand joins with the hand and the leg, and the rig cannot separate them. Make the weapon in prop mode (see Prop mode).
- A turnaround sheet (front, side, back) gives the best mesh. Split it into views (step 1).
- File types: `.png`, `.jpg`, `.jpeg`, `.webp`, or an `https://` URL.

## Before you run

1. **Get the key.** The script reads `MESHY_API_KEY` from the env only.
   - If it is not set, look in the user's vault or secret store first, for example the TanStack Source vault.
   - If it is not there, ask the user with the harness secret tool (file delivery). Then run `MESHY_API_KEY="$(cat <key-file>)" node ...`.
   - Never print the key. Never put it in a repo file, a command argument, or a URL.
2. **Install the packages.** If `<skill-dir>/scripts/node_modules` does not exist, run `npm install --prefix <skill-dir>/scripts`. The versions are pinned in `scripts/package.json`.
3. **Check the balance.** Run `node <skill-dir>/scripts/meshy.mjs balance`. This call is free.
4. **Tell the user the cost** before the first paid step. Use the Costs table. Ask the user for the height of the character in meters (for the rig).

Every paid command prints one JSON line for each result to stdout and progress to stderr. Run it in the background and wait for the process to end. Do not poll with sleep. The exit code is 1 when a result failed.

## Steps (character)

### 1. Split the turnaround sheet

Skip this step when the user gives separate views or one image.

```bash
blender --background --factory-startup --python <skill-dir>/scripts/qa/split-sheet.py -- <sheet.png> 3 <out>/views
```

- `3` is the number of views on the sheet. The script puts the cuts in the widest empty gaps, so an A-pose hand is not cut.
- It writes `view-1.png` to `view-3.png`, left to right. Look at each view. Each view must show one whole character.

### 2. Make the mesh

```bash
node <skill-dir>/scripts/meshy.mjs mesh <out>/views/view-1.png <out>/views/view-2.png <out>/views/view-3.png --name samurai --out <out>
```

- Give the front view first. Meshy takes 1 to 4 images.
- 1 image uses `image-to-3d` with 4k geometry. 2 to 4 images use `multi-image-to-3d` with 2k geometry. Both use `meshy-7.1`.
- The character preset: A-pose, triangles, 300,000 triangles after the Meshy remesh, 4k PBR textures, no baked light. 300,000 is the Meshy maximum. It is below the rig limit of 380,000.
- The JSON line has `glb`, `triangles`, `sizeMB`, and `seconds`.

### 3. Check the mesh, and look at it

```bash
blender --background --factory-startup --python <skill-dir>/scripts/qa/mesh-check.py -- <out>/samurai.glb <out>/samurai.check.json <out>/samurai.renders.png
```

- Look at `samurai.renders.png` (front, right side, back, 3/4). Show it to the user.
- **Stop if an arm or a leg joins the body, a hand joins the hip, or a part is missing.** Do not pay for a rig on a bad mesh. Ask for a better image (see Input rules).
- Read the numbers with the QA table below.

### 4. Remesh (only when needed)

Run this step only when `triangles` is more than 380,000 (the rig limit), or when the user wants a different triangle budget.

```bash
node <skill-dir>/scripts/meshy.mjs remesh --out <out>
```

- The default is 60,000 triangles. Set `--polycount` for a different budget.
- It writes `samurai.remesh.glb`. Run step 3 on it.
- The rig step uses the remeshed copy when the manifest has one.
- For game LODs, use step 6, not this step.

### 5. Rig

```bash
node <skill-dir>/scripts/meshy.mjs rig --height 1.8 --out <out>
```

- The defaults: biped, Mixamo skeleton, finger bones.
- It writes `samurai.rig.glb`, `samurai.rig.fbx`, and a basic walk and run clip (`samurai.rig.basic-*`).
- Run step 3 on `samurai.rig.glb`. Check the armature numbers in the QA table.

### 6. LODs for games (optional)

The 300,000-triangle rig is LOD0. Use it for close-up screens. Use lower LODs for battle and far views. In the test, a mesh of 61,890 triangles showed flat facets on the face in a close-up. At full-body distance, it looked the same as the full mesh.

1. Rig LOD0 first (step 5). Then make each LOD in its own folder. Get `<meshTaskId>` from `meshTaskId` in `<out>/manifest.json`:

   ```bash
   node <skill-dir>/scripts/meshy.mjs remesh --polycount 80000 --task <meshTaskId> --out <out>/lod1
   node <skill-dir>/scripts/meshy.mjs remesh --polycount 25000 --task <meshTaskId> --out <out>/lod2
   ```

   - Each LOD costs 5 credits. The files are `model.remesh.glb` and `model.remesh.fbx`, because the manifest of a new folder has no name.
   - Do not run these in `<out>`. There, `remesh` replaces `remeshTaskId`, so a later `rig` uses the LOD mesh. The second LOD also writes over the files of the first LOD.
   - Run step 3 on each LOD.
2. Bind each LOD to the LOD0 skeleton in Blender, so that all LODs share one rig and one set of clips:
   1. Import `<out>/samurai.rig.glb` and `<out>/lod1/model.remesh.glb`. If the LOD mesh does not lie on the LOD0 mesh, scale and move it to match, then apply the transform.
   2. In Object mode, select the LOD0 mesh, then the LOD mesh last.
   3. Run Object > Link/Transfer Data > Transfer Mesh Data. Set Vertex Data, Vertex Group(s), source layers All Layers, and destination By Name.
   4. Add an Armature modifier to the LOD mesh, and set its object to the LOD0 armature. Then parent the LOD mesh to that armature.
   5. Export the LOD mesh with the LOD0 armature. Do the same for `lod2`.
3. In the engine, put LOD0, LOD1, and LOD2 in one LOD group (Unity: `LOD Group`. Unreal: the LOD slots of the Skeletal Mesh). The engine switches the LOD by distance or by a quality setting. The clips play on all LODs, because the skeleton is the same.

### 7. Library clips

1. List the free library. Each line has `id`, `name`, `category`, `rigType`, and a `previewUrl` (GIF).

   ```bash
   node <skill-dir>/scripts/meshy.mjs actions --category Fighting
   ```

   The biped categories are `DailyActions`, `WalkAndRun`, `Fighting`, `BodyMovements`, and `Dancing`. The library has 805 clips, with quadruped animals too.
2. Put the clips on the rig. Run one `animate` for each clip, one after the other, with the same `--out`:

   ```bash
   node <skill-dir>/scripts/meshy.mjs animate --actions 0 --out <out>
   ```

   - It writes `samurai.actions-0.glb` and `samurai.actions-0.fbx`.
   - One call with several ids (`--actions 0,21,14`, up to 10) gives one file with all the clips in that order. `analyze.py` measures one clip for each file, so use one id for each call when you want QA numbers.

Use library clips for idle, walk, run, and hit reactions. In the test, the library idle was better than the text-to-motion idle.

### 8. Text-to-motion clips

Use these for signature attacks that the library does not have. Text-to-motion needs a biped rig.

1. Write `clips.json`. Use the prompt recipe in [motion-for-3d-asset SKILL.md](../motion-for-3d-asset/SKILL.md#the-prompt-recipe): grip, start pose, wind-up, action driven by the whole body, weight, end state, guard rails.

   ```json
   [
     { "name": "katana_cleave", "seconds": 4, "prompt": "A sturdy armored samurai, right hand on a katana handle near the guard, left hand below it, sinks low, lifts the sword high over the right shoulder, ... Both hands stay on the handle the whole time." }
   ]
   ```

   - `name`: letters, digits, `_`, and `-` only.
   - `prompt`: 20 to 400 characters.
   - `seconds`: 2 to 10, in steps of 0.5. The default is 4. A 4 s clip comes back as 120 frames at 30 fps (3.97 s).
2. Run it:

   ```bash
   node <skill-dir>/scripts/meshy.mjs motion clips.json --out <out>
   ```

   - The script runs 4 clips at a time in one process.
   - Each clip gives `<clip>.glb`, `<clip>.fbx` (on the rig), and `<clip>.motion.fbx` (the raw motion).

### 9. Check the clips

```bash
blender --background --factory-startup --python <motion-dir>/scripts/qa/analyze.py -- <out>/katana_cleave.fbx <out>/katana_cleave.qa.json <out>/katana_cleave.qa.png
blender --background --factory-startup --python <motion-dir>/scripts/qa/compare.py -- <out>/clips.mp4 <out>/katana_cleave.fbx <out>/samurai.actions-0.fbx
```

- Look at every contact sheet (`.qa.png`). Read the numbers with the QA table.
- For loop windows and impact frames, use the QA section of [motion-for-3d-asset SKILL.md](../motion-for-3d-asset/SKILL.md#qa-with-blender).
- If a text clip fails, write a new prompt. Put only that clip in a new clips file, and run `motion` on it.

### 10. Deliver

1. Give the user the path, the triangle count, and the size of the rigged GLB and of each LOD.
2. Give each clip path with its length and its QA result.
3. Give the credits spent and the balance left (`balance`).
4. Show the renders, the contact sheets, and the MP4 when the harness can show them.
5. Open `<out>` for the user.

## Prop mode

Use prop mode for a chest, a barrel, or the weapon of a character.

```bash
node <skill-dir>/scripts/meshy.mjs mesh katana.png --mode prop --out <out>/props
```

- One image only. `meshy-t2.5` (Smart Topology), 10,000 triangles, 2k PBR textures, no rig.
- Run step 3 on the result.
- For a weapon: in the engine, attach the prop to the hand bone (`mixamorig:RightHand`).

## Options

`--out` (default: the current folder) and `--opt key=value` work on `mesh`, `remesh`, `rig`, `animate`, and `motion`. `--opt` sends any Meshy option and wins over the preset. The value is JSON when it parses as JSON, else a string. Repeat it for more options.

| Command | Flag | Default | When to change it |
|---|---|---|---|
| `mesh` | `--mode character\|prop` | `character` | `prop` for an object with no rig. |
| `mesh` | `--name <name>` | the file name of the first image | Set it when the first image is `view-1.png` or a URL. |
| `mesh` | `--polycount <n>` | 300,000 (character), 10,000 (prop) | 100 to 300,000. 300,000 is the Meshy maximum. |
| `mesh` | `--pose a-pose\|t-pose\|none` | `a-pose` (character) | `t-pose` when the image is a T-pose. |
| `remesh` | `--polycount <n>` | 60,000 | A different triangle budget. 80,000 and 25,000 for LODs (step 6). |
| `remesh` | `--topology triangle\|quad` | `triangle` | `quad` only with `rig --no-fingers`. Meshy takes a quad `--polycount` of 150,000 or less. |
| `rig` | `--height <m>` | 1.8 (biped) | Always give the height of the character. |
| `rig` | `--skeleton <template>` | `mixamo` | `ue5_mannequin`, `unity_humanoid`, `meshyrig`, `max_biped`, `maya_human_ik`, `blender_rigify_basic_human`, `cc5_hd_neutral_base`, `daz_genesis9`. |
| `rig` | `--no-fingers` | fingers on | Needed for a quad mesh. |
| `rig` | `--quadruped` | biped | A four-legged animal. No skeleton template, no fingers, no text-to-motion. |
| `actions` | `--category <category>` | all 805 | Filter the free list. |
| `animate` | `--actions <id,id,...>` | (required) | 1 to 10 library ids. |
| `remesh`, `rig`, `animate`, `motion` | `--task <id>` | the id in the manifest | Only when the manifest does not have the id. |

Quads: Meshy refuses finger bones on a quad mesh. For quads, run `mesh --opt topology=quad` (or `remesh --topology quad`), then `rig --no-fingers`.

## QA

Mesh (`mesh-check.py` JSON):

| Field | Pass | Fail |
|---|---|---|
| The renders | Arms, legs, and hands are apart from the body. Nothing is missing. No shadows painted in the texture. | A limb joins the body. Stop. |
| `triangles` | 380,000 or less | More: run `remesh` before `rig`. |
| `textures` | 4096 px for a character | A smaller texture: tell the user. |
| `looseParts` | 1 in the test | Many large islands: a part is cut off. Look at the renders. |
| `nonManifoldEdges` | Information only | The rigged test mesh had 219 and rigged with no problem. |

Rig (`mesh-check.py` on `<name>.rig.glb`):

| Field | Pass |
|---|---|
| `armature.present` | `true` |
| `armature.rootBones` | `["mixamorig:Hips"]` for the Mixamo skeleton |
| `armature.hasFingers` | `true` when you asked for fingers |
| `height` | the `--height` you gave |

Clips (`analyze.py` JSON):

| Measure | Pass | Fail |
|---|---|---|
| `liveliness.meanJointSpeedDegPerSec` | 30 or more for an action | Under 10: a held pose, not a motion. About 14: a frozen idle. |
| Grip, two-hand weapon: `wristGapM.median` / `figureHeightM` | Under 0.2 | More: a hand left the handle. |
| `pelvis.horizontalTravelM` for a clip in place | About 1 m or less (one step) | 2.3 m in the test: the clip drifts. |
| Contact sheet | Upright on every tile | A fall or a flip that you did not ask for. |

## Costs

| Step | Credits | Time in the test |
|---|---|---|
| `balance`, `actions` | 0 | under 5 s |
| `mesh`, character, 3 views | 40 | about 4 min |
| `mesh`, prop | not measured | not measured |
| `remesh`, each LOD | 5 | 228 s |
| `rig` | 5 | 99 s |
| `animate`, each library clip | 3 | about 31 s |
| `motion`, each text clip | about 11 (3 clips cost 34) | about 1 min |

The Meshy docs give no USD price for a credit. Example: mesh, rig, 6 library clips, and 3 text clips cost about 97 credits. Two LODs add 10 credits.

## Measured results (samurai, 2026-11-20)

- Input: one turnaround sheet (front, side, back, A-pose, empty hands), split into 3 views.
- Mesh: 1 loose part, 4096 px textures. A run with no Meshy remesh gave 2,162,596 triangles (85 MB). The test `remesh` to 60,000 gave 61,890 triangles (56.5 MB). At full-body distance, it looked the same as the full mesh, because of the normal map. In a close-up, the face showed flat facets. So the preset uses 300,000 for LOD0, and a 60,000 to 80,000 mesh is a LOD.
- Rig (`--height 1.8`): 44 bones, root `mixamorig:Hips`. The finger bones are only `Thumb1-4` and `Middle1-4` on each hand, so the hand closes like a mitten. There are no separate index, ring, or pinky bones.
- Each clip GLB has the full skinned mesh and textures (about 58 MB).

| Clip | Source | Liveliness | Grip | Result |
|---|---|---|---|---|
| katana_cleave | text | 50.2 | 0.15 | Good. Big wind-up, whole-body swing, hands stay on the handle. |
| heavy_hit | text | 44.3 | 0.30 | Strong, but the hands come apart and it drifts 2.3 m. |
| combat_idle | text | 14.1 | 0.21 | Frozen. Use a library idle. |
| 242 Charged Slash | library | 40.0 | 0.72 | Good. One-hand swing. |
| 147 Sword Parry | library | 5.3 | - | A held pose, not a motion. |
| 178 Hit Reaction | library | 48.6 | - | Good. |
| 0 Idle | library | 15.0 | - | Calm, a little stiff. Usable. |
| 21 Walk Fight Forward | library | 22.9 | - | Good loop, 1.7 s, in place. |
| 14 Run 2 | library | 138.6 | - | Good loop, 0.7 s, in place. |

## Output files

All files go to `<out>`. `<name>` is the `--name` of the mesh.

- `manifest.json`: the task ids and options of each step.
- `<name>.glb`, `.fbx`, `.usdz`, `.obj`, `.stl`: the mesh. `<name>.tex-*`: textures. `<name>.thumb-preview.png`: the Meshy preview. `<name>.pre-remesh.glb`: the full-detail mesh, when Meshy returns it.
- `<name>.remesh.glb`, `.fbx`: the remeshed copy.
- `lod1/model.remesh.glb`, `lod2/model.remesh.glb` (and `.fbx`): the LOD meshes of step 6.
- `<name>.rig.glb`, `.fbx`: the rigged mesh. `<name>.rig.basic-*`: the basic walk and run clips.
- `<name>.actions-<ids>.glb`, `.fbx`: library clips.
- `<clip>.glb`, `<clip>.fbx`: text clips on the rig. `<clip>.motion.fbx`: the raw motion.

Run `animate` and `motion` with the same `--out` as `rig`. In a new `--out`, the manifest has no name, so the files are named `model.*`. Run one process at a time for each `<out>`, because two processes that write one manifest can lose a write.

## Blender

- Give Blender absolute Windows paths. In Git Bash, `pwd -W` gives the Windows path.
- Run at most 3 Blender processes at a time.

## Errors

| Error | Cause | Fix |
|---|---|---|
| `Meshy cannot add finger bones to a mesh with quad topology` | Quad mesh with fingers. The script stops before it spends credits. | `rig --no-fingers`, or make the mesh again with `--opt topology=triangle`. |
| Meshy 400 | A bad option, finger bones on a quad mesh, or a mesh above 380,000 triangles for the rig | Read the message. Fix the option, or run `remesh` first. |
| Meshy 422 | Meshy cannot use the image or the option value | Use a clear image that obeys the Input rules. Check `--opt` values. |
| Not enough credits | The account balance is too low | Run `balance`. Tell the user to add credits. |
| Timeout (30 min for a 3D task, 15 min for a motion) | The Meshy queue is slow | Meshy still finishes and bills the task. Do not run it again at once. Get the task id from the Meshy web app, and give it to the next step with `--task <id>`. |
| A step fails on a task that is more than 3 days old | Meshy deleted the task files | Run the earlier step again. |
| `No meshTaskId in <out>/manifest.json` (or `rigTaskId`) | A different `--out`, or the earlier step did not run | Use the same `--out`, or give `--task <id>`. |
| `Set the MESHY_API_KEY env var` | No key | See Before you run, item 1. |

To test the script: `node --test <skill-dir>/scripts/meshy.test.mjs`.
