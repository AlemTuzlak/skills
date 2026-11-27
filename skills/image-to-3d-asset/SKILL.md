---
name: image-to-3d-asset
description: Use when the user wants a 3D model, mesh, or GLB made from one or more images, for example a game character from concept art or a turnaround sheet, or a game prop. It makes the mesh with Meshy or Tripo, rigs the character, and animates it with Meshy library and text-to-motion clips or Tripo preset clips. Triggers on "image to 3D", "make a mesh from this image", "GLB from this picture", "game character from concept art", "rig this character", "animate with Meshy", "make it with Tripo", "Tripo vs Meshy", or /image-to-3d-asset. Don't use for 3D work inside Blender scenes, or for text-to-3D with no image.
---

# Image to 3D Asset

Turn concept art into a game character: a textured mesh, a Mixamo skeleton, and animation clips. A prop gets a mesh only.

## Choose the provider

Read the request of the user:

- The request names **Tripo**: use `scripts/tripo.mjs`. Follow [Tripo](#tripo).
- The request names **both**, or asks to compare them: run the same views through both, each in its own `<out>`. Give both the same options where they exist (no PBR, the same triangle budget, the same rig height). Show the results side by side, with the cost of each.
- Else, or the request names **Meshy**: use `scripts/meshy.mjs` and the steps below.

| | Meshy (`meshy.mjs`) | Tripo (`tripo.mjs`) |
|---|---|---|
| Key | `MESHY_API_KEY` | `TRIPO_API_KEY`: the secret key `tsk_...` from [developers.tripo3d.ai/en/keys](https://developers.tripo3d.ai/en/keys) > **API Keys** > **Create Key** (shown once). Not the client id `tcli_...`. `FAL_KEY` for `mesh --via fal` only. |
| Mesh | 1 to 4 views, `meshy-7.1` | 1 to 4 views (`front`, `left`, `back`, `right`), `v3.5`, or `h3.1` through fal |
| Rig | Mixamo, fingers (thumb and middle only) | `v1.0` rig, Mixamo naming. Finger bones are not documented. |
| Clips | 805 library clips and text-to-motion | Preset clips only, up to 5 in one call. No text-to-motion. |

The Meshy script calls Meshy through TanStack AI (`@tanstack/ai` and `@tanstack/ai-meshy`). Each step writes its Meshy task id, the id of its parent task, and the SHA-256 of each file to `<out>/manifest.json`. The next step finds them there. Each step downloads its files at once, because Meshy deletes task files after 3 days.

The Meshy files are the source of the character. The script never writes over a downloaded file or an earlier task. Before it spends credits, it stops a step that replaces a task, uses a stale parent, or mixes in a task of another folder.

In the commands below:

- `<skill-dir>` is the folder of this skill.
- `<motion-dir>` is the sibling skill folder `<skill-dir>/../motion-for-3d-asset`.
- `<out>` is one output folder for one mesh and the tasks made from it. Use the same `<out>` for every step of that mesh. A new mesh needs a new `<out>`.
- `<qa-dir>` is `<skill-dir>/scripts/qa`, and `<motion-qa-dir>` is `<motion-dir>/scripts/qa`.
- Blender is Blender 5.x (5.3 is tested), open with a UI and the Blender MCP add-on. See [Live Blender](#live-blender).

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
5. **Connect to Blender** before the first Blender step. See [Live Blender](#live-blender).

Every paid command prints one JSON line for each result to stdout and progress to stderr. Run it in the background and wait for the process to end. Do not poll with sleep. The exit code is 1 when a result failed.

## Live Blender

All Blender work runs in the live Blender (with a UI) through the Blender MCP tool `execute_blender_code`. Never run Blender headless.

Connect first:

1. Make one real call: `execute_blender_code` with `import bpy; print(bpy.app.version_string, bpy.data.filepath)`.
2. If the call fails, start Blender with a UI and the MCP add-on listener, the way this project documents it. Then make the call again.
3. If it still fails, stop. Report what failed and the error text. Do not go on.
4. If the project uses a game engine (for example Unity), do the same with the MCP of the engine before the first engine step.

Run a QA script:

1. If the open Blender file has unsaved changes, save it (`bpy.ops.wm.save_mainfile()`).
2. Run the script with `execute_blender_code`. Give absolute Windows paths. In Git Bash, `pwd -W` gives the Windows path.

   ```python
   import sys; sys.path.insert(0, r'<qa-dir>'); import qa_live
   qa_live.run(r'<qa-dir>/mesh-check.py', r'<out>/samurai.glb', r'<out>/samurai.check.json', r'<out>/samurai.renders.png')
   ```

- Start each call with the `import` line. The commands below show only the `qa_live.run` line.
- `qa_live.run` gives the script a new empty scene. Then it removes that scene and all data that the run made. The open file stays as it was. Blender stays open.
- The output of the script comes back in the MCP result. A script error comes back as the error of the call.
- One MCP call has a time limit. Run one file in each call.

## Steps (character)

### 1. Split the turnaround sheet

Skip this step when the user gives separate views or one image.

```python
qa_live.run(r'<qa-dir>/split-sheet.py', r'<sheet.png>', 3, r'<out>/views')
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
- The script refuses an `<out>` that already has a `manifest.json`. A new mesh starts a new folder, so the earlier mesh, rig, and clips stay together and unchanged.

### 3. Check the mesh, and look at it

```python
qa_live.run(r'<qa-dir>/mesh-check.py', r'<out>/samurai.glb', r'<out>/samurai.check.json', r'<out>/samurai.renders.png')
```

- Look at `samurai.renders.png` (front, right side, back, 3/4). Show it to the user.
- Also look at a close-up and at the gameplay camera distance: import the GLB in the live Blender and take viewport screenshots through the Blender MCP. If the project uses a game engine, look at the model there too.
- **Stop if an arm or a leg joins the body, a hand joins the hip, or a part is missing.** Do not pay for a rig on a bad mesh. Ask for a better image (see Input rules).
- Read the numbers with the QA table below. The numbers point to parts to look at. Only what you see passes the mesh.

### 4. Remesh (only when needed)

Run this step only when `triangles` is more than 380,000 (the rig limit), or when the user wants a different triangle budget.

```bash
node <skill-dir>/scripts/meshy.mjs remesh --out <out>
```

- The default is 60,000 triangles. Set `--polycount` for a different budget.
- It writes `samurai.remesh.glb`. Run step 3 on it.
- The rig step uses the remeshed copy when the manifest has one.
- A folder takes one remesh, before the rig. The script refuses a second remesh, and a remesh after the rig.
- For game LODs, use step 6, not this step.

### 5. Rig

```bash
node <skill-dir>/scripts/meshy.mjs rig --height 1.8 --out <out>
```

- The defaults: biped, Mixamo skeleton, finger bones.
- It writes `samurai.rig.glb`, `samurai.rig.fbx`, and a basic walk and run clip (`samurai.rig.basic-*`).
- Run step 3 on `samurai.rig.glb`. Check the armature numbers in the QA table.
- A folder takes one rig. The script refuses a second rig. It also refuses a stale parent: a remesh of an earlier mesh.
- In Unity, use the rig type that the project declares for this character. With no declaration, use Generic. Use Humanoid only when the conditions in [motion-for-3d-asset Bones](../motion-for-3d-asset/SKILL.md#bones) are true. Equal bone names do not prove that a clip fits.

### 6. LODs for games (optional)

The 300,000-triangle rig is LOD0. Use it for close-up screens. Use lower LODs for battle and far views. In the test, a mesh of 61,890 triangles showed flat facets on the face in a close-up. At full-body distance, it looked the same as the full mesh.

1. Rig LOD0 first (step 5). Then make each LOD in its own folder. Get `<meshTaskId>` from `meshTaskId` in `<out>/manifest.json`:

   ```bash
   node <skill-dir>/scripts/meshy.mjs remesh --polycount 80000 --task <meshTaskId> --out <out>/lod1
   node <skill-dir>/scripts/meshy.mjs remesh --polycount 25000 --task <meshTaskId> --out <out>/lod2
   ```

   - Each LOD costs 5 credits. The files are `model.remesh.glb` and `model.remesh.fbx`, because the manifest of a new folder has no name.
   - Run each LOD in its own folder. In `<out>`, the script refuses a remesh after the rig, and a second remesh.
   - Run step 3 on each LOD.
2. Bind each LOD to the LOD0 skeleton in Blender, so that all LODs share one rig and one set of clips:
   1. Import `<out>/samurai.rig.glb` and `<out>/lod1/model.remesh.glb`. If the LOD mesh does not lie on the LOD0 mesh, scale and move it to match, then apply the transform.
   2. In Object mode, click the LOD mesh first. Then Shift-click the LOD0 mesh last, so that the LOD0 mesh is the active object. Blender copies data from the active object to the other selected objects. The LOD0 mesh has the weights, so it must be the active object.
   3. Run Object > Link/Transfer Data > Transfer Mesh Data. Set Vertex Data, Vertex Group(s), source layers All Layers, and destination By Name.
   4. Add an Armature modifier to the LOD mesh, and set its object to the LOD0 armature. Then parent the LOD mesh to that armature.
   5. Export the LOD mesh with the LOD0 armature to a GLB. Save it outside the Meshy folders, for example `C:/work/samurai/samurai.lod1.glb`.
   6. Run step 3 on that GLB. `unweightedVertices` must be 0. `armature.bones` and `armature.rootBones` must be the same as in the check of `samurai.rig.glb`.
   7. Play one clip on LOD0 and on the LOD. Compare the same frames, close up and at battle distance. The LOD must bend at the same joints as LOD0, with no part left behind.
   8. Do the same for `lod2`.
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
   - An id list runs one time on a rig. The script refuses a list that is already on the rig, so the earlier files stay unchanged.

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
   - A clip name has one take in a folder. For a new take, use a new name, for example `katana_cleave_2`. The script refuses a name that is in the manifest, so an earlier take keeps its files and its task ids.

### 9. Check the clips

Measure the native Meshy file first, and render every frame. Run one script in each MCP call:

```python
qa_live.run(r'<motion-qa-dir>/analyze.py', r'<out>/katana_cleave.fbx', r'<out>/katana_cleave.qa.json', r'<out>/katana_cleave.qa.png')
qa_live.run(r'<motion-qa-dir>/frame-sheets.py', r'<out>/katana_cleave.fbx', r'<out>/sheets')
qa_live.run(r'<motion-qa-dir>/compare.py', r'<out>/clips.mp4', r'<out>/katana_cleave.fbx', r'<out>/samurai.actions-0.fbx')
```

- Look at every frame sheet and every contact sheet (`.qa.png`). Then do the [check by sight](../motion-for-3d-asset/SKILL.md#check-by-sight) for each clip, in Blender and in the engine.
- Read the numbers with the QA table. The numbers point to frames to look at. They never pass a clip.
- The report starts with `identity`: the SHA-256 and size of the file, and the take (action name, frame rate, first and last frame). The SHA-256 must be the hash of the file in `manifest.json`.
- `compare.py` also writes `clips.mp4.json` with the identity of each clip. All clips in one video need the same frame rate.
- For loop windows and impact frames, use the QA section of [motion-for-3d-asset SKILL.md](../motion-for-3d-asset/SKILL.md#qa-with-blender).
- If a text clip fails, write a new prompt. Put only that clip, with a new name, in a new clips file, and run `motion` on it.

Read the numbers of a clip only from its native report. A corrected copy is a converted, retargeted, or hand-fixed file. Give it its own report, bound to the native report:

```python
qa_live.run(r'<motion-qa-dir>/analyze.py', r'C:/work/samurai/katana_cleave.game.fbx', r'C:/work/samurai/katana_cleave.game.qa.json', r'C:/work/samurai/katana_cleave.game.qa.png', '--native', r'<out>/katana_cleave.qa.json')
```

- The corrected report names the native report and file in `identity.native`. `changeFromNative` gives the change of each main measure, with distances as a share of the figure height.
- A large change of the wrist gap means that the correction holds the weapon, and the clip does not. Choose another clip, or make a new take.
- The script refuses to write over the native report, or over the report of another file.

### 10. Deliver

Say "done" only after the check by sight passes in Blender and in the engine (see [Done and stop rules](#done-and-stop-rules)).

1. Give the user the path, the triangle count, and the size of the rigged GLB and of each LOD.
2. Give each clip path with its length, its QA numbers, and what you saw in the check by sight.
3. Give the credits spent and the balance left (`balance`).
4. Attach the renders, the frame sheets, the engine captures, the contact sheets, and the MP4.
5. Open `<out>` for the user.
6. If the files go into a game repo with production gates, follow [Game project gates](#game-project-gates).

## Done and stop rules

- **Done:** Say "done" only after the check by sight passes in Blender and in the engine. For each mesh and each clip, write what you saw, for example "no twist, no deformation, no clipping, no floating weapon". Attach the renders, the sheets, and the captures.
- **No looser checks:** Do not make a check less strict without the approval of the user.
- **Stop:** If the same defect fails 2 rounds in a row, stop. Find out how shipped games solve that defect. Report to the user with 2 or 3 options. Do not start round 3.

## Game project gates

If the game repo has `scripts/character-production.ps1`, Meshy files enter the game only through its production gates. Never copy a Meshy file into `client/Assets` by hand. The repo has these tools:

| Tool | Job |
|---|---|
| `scripts/character-production.ps1` | The wrapper for the operations `Plan`, `Build`, `Check`, `Capture`, and `Promote`. It starts no engine. |
| `art/appearance-baseline/characters/production_manifest.py` | The schema of a production record, and the metadata and source checks. |
| `art/appearance-baseline/characters/check_production.py` | The stage measurements, `record-unavailable`, and `validate-samples`. |
| `Game.Client.Appearance.ActorProduction` (Unity editor) | The Unity part of the five operations. `Promote` needs a review receipt that the owner accepted. |
| `Game.Client.Appearance.Validation.AppearanceAcceptance.CheckProduction(<report path>)` and `.CheckAuthoring(<report path>)` | Selected Unity checks of the measurement and authoring cases. |

1. Keep `<out>` unchanged. Give it to the wrapper as a source root, for example `-SourceRoot meshy=C:/out/samurai`.
2. Write the record `art/appearance-baseline/characters/manifests/<recordId>.json`. Give each source stage its Meshy `taskId` and `rigTaskId` from `<out>/manifest.json`.
3. Link each stage to its parent stages (`parentIds`) as the parent task ids in `manifest.json` show, for example `rig.meshTaskId`.
4. Copy the `path`, `sha256`, and `bytes` of each source file from `manifest.json` too.
5. For each motion, copy the take from `identity.take` of its native QA report.
6. Do not invent a task id, a hash, a take, or a license. If a value is missing, the record says that it is missing.
7. Run the wrapper from the repo root. Use a new scratch folder outside the workspace and outside each source root:

   ```powershell
   scripts/character-production.ps1 -Operation Plan -Manifest <record.json> -OutputDirectory <scratch> -SourceRoot meshy=<out>
   ```

8. Then run the phases of the plan in order: `Build`, `Check` with its `-Stage`, and `Capture`. Keep the same `-Manifest`, `-OutputDirectory`, and `-SourceRoot`.
9. Exit code 4 means that the run waits for an engine step or for evidence. Read the message. Run that engine step through the Unity MCP or the Blender MCP. Then run the same wrapper command again.
10. If an engine is not available, close its attempt with `check_production.py record-unavailable`. Unavailable is never passed.
11. Run `-Operation Promote` with no `-ReviewReceipt`. It writes a draft receipt and stops.
12. The owner reviews the evidence and accepts the receipt. Then run `Promote` again with `-ReviewReceipt <receipt.json>`. Never write the acceptance yourself.

Rules for the gates:

- Exit code 3 is a failure, for example a changed source hash, a stale descendant, or a wrong take. Correct the input. Never widen a budget to pass.
- A correction (a hand seat, a wrist turn, a reach) has a budget in the record. Report the native value, each correction, and the final value. A small final error does not accept a large correction.
- A Blender step that turns a joint is a correction too. Measure the joint before and after that step.
- The wrapper never starts Blender or Unity. The gates run Blender only through the Blender MCP. The QA scripts of this skill only read files.

## Tripo

`scripts/tripo.mjs` calls the Tripo v3 API with `fetch`. The host is `https://openapi.tripo3d.ai/v3` for a key of the international console. For a key of the China console (`developers.tripo3d.com`), set `TRIPO_API_BASE=https://openapi.tripo3d.com/v3`. A key on the wrong host gets a 401 `Invalid API key`. It needs no packages. It keeps `<out>/manifest.json` with the same rules as `meshy.mjs`: one mesh for each `<out>`, a SHA-256 for each file, no file written over, and one rig for each folder.

Do the steps of [Before you run](#before-you-run) with `TRIPO_API_KEY`. Then:

1. **Split the sheet** (step 1). Name the views with `--views` in the order of the images. A sheet with front, right side, and back is `--views front,right,back` (the default for 3 images).
2. **Mesh.**

   ```bash
   node <skill-dir>/scripts/tripo.mjs mesh <out>/views/view-1.png <out>/views/view-2.png <out>/views/view-3.png --views front,right,back --name druid --polycount 300000 --out <out>
   ```

   - `pbr` is `false` and `texture` is `true` by default. `--opt key=value` sends any Tripo field, for example `--opt texture_quality=detailed`.
   - `--via fal` makes the mesh with `tripo3d/h3.1/multiview-to-3d` on fal.ai, with `FAL_KEY`. Use it when there is no Tripo key. The rig still needs `TRIPO_API_KEY`. It takes the public URL of the fal mesh.
3. **Check the mesh** (step 3). The same stop rules apply.
4. **Rig.** `node <skill-dir>/scripts/tripo.mjs rig --out <out>`. It runs the free `rig-check` first. Then it rigs with `v1.0-20240301` (the rig model with the 90+ biped presets) and `--spec mixamo`.
5. **Clips.** `node <skill-dir>/scripts/tripo.mjs animate --presets idle,cast_a_spell,slash --out <out>`.
   - Up to 5 presets in one call. They come back in one GLB, in place.
   - The biped presets of the v1.0 rig include `idle`, `walk`, `run`, `slash`, `cast_a_spell`, `chop`, `hurt`, `fall`, `bow`, `cheer`, `standing_relax`, `victory_celebration`, and `wait`. The full list is in the [Tripo retarget docs](https://developers.tripo3d.com/en/docs/animations-retarget.md).
   - Tripo has no text-to-motion. When no preset fits (for example a kneeling revive), say so. Offer the closest preset, or a Meshy text clip on the Tripo mesh.
6. **Check the clips** (step 9) and **deliver** (step 10). Give the credits from the manifest (`credits` of each step) and `node <skill-dir>/scripts/tripo.mjs balance`.

To test the script: `node --test <skill-dir>/scripts/tripo.test.mjs`.

## Prop mode

Use prop mode for a chest, a barrel, or the weapon of a character.

```bash
node <skill-dir>/scripts/meshy.mjs mesh katana.png --mode prop --out <out>/props
```

- One image only. `meshy-t2.5` (Smart Topology), 10,000 triangles, 2k PBR textures, no rig. Smart Topology takes at most 30,000 triangles (`--polycount 30000`).
- Prop mode does not send `remove_lighting`, because Smart Topology refuses it with a 400.
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
| `remesh`, `rig`, `animate`, `motion` | `--task <id>` | the id in the manifest | In a new folder, to name the parent task. In a folder that has the parent, `--task` must name that same task. |

Quads: Meshy refuses finger bones on a quad mesh. For quads, run `mesh --opt topology=quad` (or `remesh --topology quad`), then `rig --no-fingers`.

## QA

The numbers point to parts and frames to look at. A number can stop a step. A number never passes a mesh or a clip. Only the check by sight passes it (see [Done and stop rules](#done-and-stop-rules)).

Mesh (`mesh-check.py` JSON):

| Field | Expected | If not |
|---|---|---|
| The renders | Arms, legs, and hands are apart from the body. Nothing is missing. No shadows painted in the texture. | A limb joins the body. Stop. |
| `triangles` | 380,000 or less | More: run `remesh` before `rig`. |
| `textures` | 4096 px for a character | A smaller texture: tell the user. |
| `looseParts` | 1 in the test | Many large islands: a part is cut off. Look at the renders. |
| `nonManifoldEdges` | Information only | The rigged test mesh had 219 and rigged with no problem. |
| `sha256` | The hash of the file in `manifest.json` | Another hash: the file is not the Meshy file. |

Rig (`mesh-check.py` on `<name>.rig.glb`, and on each LOD export of step 6):

| Field | Expected |
|---|---|
| `armature.present` | `true` |
| `armature.rootBones` | `["mixamorig:Hips"]` for the Mixamo skeleton |
| `armature.hasFingers` | `true` when you asked for fingers |
| `height` | the `--height` you gave |
| `unweightedVertices` | 0. More: those vertices stay behind when the rig moves. |

Clips (`analyze.py` JSON). Read the numbers from the native report:

| Measure | Expected | If not |
|---|---|---|
| `liveliness.meanJointSpeedDegPerSec` | 30 or more for an action | Under 10: a held pose, not a motion. About 14: a frozen idle. |
| Grip, two-hand weapon: native `wristGapM.median` / `figureHeightM` | Under 0.2 | More: a one-hand clip. Do not use it for a two-hand weapon. A correction cannot make it pass. |
| Worst grip frame: `wristGapM.maxFrame` | Both hands stay on the handle at this frame (look in Blender or the engine) | A hand leaves the handle. |
| `pelvis.horizontalTravelM` for a clip in place | About 1 m or less (one step) | 2.3 m in the test: the clip drifts. |
| Contact sheet | Upright on every tile | A fall or a flip that you did not ask for. |
| `changeFromNative` (corrected report only) | Each change is inside the correction budget of the project | A change outside the budget, or no budget. Choose another clip. |

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

Tripo (from the Tripo docs, 2026-11). Failed tasks are not billed.

| Step | Credits |
|---|---|
| `mesh`, `v3.5`, standard texture | 40 (50 detailed, 60 8K). `geometry_quality=detailed` adds 15. |
| `mesh --via fal` | billed by fal in USD. fal lists Tripo at $0.01 per Tripo credit. |
| `rig-check` | 0 |
| `rig` | about 25 |
| `animate`, each call (1 to 5 presets) | about 10 |

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
| 242 Charged Slash | library | 40.0 | 0.72 | Good one-hand swing. Not for a two-hand weapon. |
| 147 Sword Parry | library | 5.3 | - | A held pose, not a motion. |
| 178 Hit Reaction | library | 48.6 | - | Good. |
| 0 Idle | library | 15.0 | - | Calm, a little stiff. Usable. |
| 21 Walk Fight Forward | library | 22.9 | - | Good loop, 1.7 s, in place. |
| 14 Run 2 | library | 138.6 | - | Good loop, 0.7 s, in place. |

## Output files

All files go to `<out>`. `<name>` is the `--name` of the mesh.

- `manifest.json`: the task id, the parent task id, and the options of each step. Each file has `path` (relative to `<out>`), `role`, `sha256`, and `bytes`. A text clip also has `motionTaskId`, `animationTaskId`, and `rigTaskId`.
- `<name>.glb`, `.fbx`, `.usdz`, `.obj`, `.stl`: the mesh. `<name>.tex-*`: textures. `<name>.thumb-preview.png`: the Meshy preview. `<name>.pre-remesh.glb`: the full-detail mesh, when Meshy returns it.
- `<name>.remesh.glb`, `.fbx`: the remeshed copy.
- `lod1/model.remesh.glb`, `lod2/model.remesh.glb` (and `.fbx`): the LOD meshes of step 6.
- `<name>.rig.glb`, `.fbx`: the rigged mesh. `<name>.rig.basic-*`: the basic walk and run clips.
- `<name>.actions-<ids>.glb`, `.fbx`: library clips.
- `<clip>.glb`, `<clip>.fbx`: text clips on the rig. `<clip>.motion.fbx`: the raw motion.

Run `animate` and `motion` with the same `--out` as `rig`. In a new `--out`, the manifest has no name, so the files are named `model.*`. Run one process at a time for each `<out>`, because two processes that write one manifest can lose a write.

Rules for these files:

- Do not edit, rename, re-export, or save over a Meshy file. Save each changed file (a LOD export, a converted clip, a Blender file) outside the Meshy folders. QA reports can stay next to the file that they measure.
- When a download has the name of a file that is already in `<out>`, the new file gets `-2`, `-3`, and so on. The manifest has the real name.

## Errors

| Error | Cause | Fix |
|---|---|---|
| `Meshy cannot add finger bones to a mesh with quad topology` | Quad mesh with fingers. The script stops before it spends credits. | `rig --no-fingers`, or make the mesh again with `--opt topology=triangle`. |
| Meshy 400 | A bad option, finger bones on a quad mesh, or a mesh above 380,000 triangles for the rig | Read the message. Fix the option, or run `remesh` first. |
| Meshy 422 | Meshy cannot use the image or the option value | Use a clear image that obeys the Input rules. Check `--opt` values. |
| Meshy 429 `NoMorePendingTasks` | The plan of the account allows only a few tasks in the queue | The script waits 30 s and sends the task again, up to 19 times. Meshy makes no task on a 429, so a new try costs nothing. Do not start more than about 4 Meshy commands at the same time. |
| Not enough credits | The account balance is too low | Run `balance`. Tell the user to add credits. |
| Timeout (30 min for a 3D task, 15 min for a motion) | The Meshy queue is slow | Meshy still finishes and bills the task. Do not run it again at once. Get the task id from the Meshy web app, and give it to the next step with `--task <id>`. |
| A step fails on a task that is more than 3 days old | Meshy deleted the task files | Run the earlier step again. |
| `No meshTaskId in <out>/manifest.json` (or `rigTaskId`) | A different `--out`, or the earlier step did not run | Use the same `--out`, or give `--task <id>`. |
| `<out>/manifest.json already exists`, or `<out> already has ... task` | The step already ran in this folder. A step never replaces a task. | Use a new `--out`. Give the parent with `--task <id>`. |
| `Clip <name> already has a take`, or `Library clips <ids> are already on this rig` | The take is in the manifest | Give a new text take a new name. For a library clip, use the files that you have. |
| `Stale remesh` or `Stale rig` | The folder has a task of an earlier mesh. An older version of the script let a new mesh or rig replace the old one. | Use a new `--out`. Run the steps again from the current mesh with `--task <meshTaskId>`. |
| `Mixed takes` | The folder has clips of two rigs | Keep the clips of each rig in their own `--out`. |
| `--task <id> is not a ... task of <out>` | The task belongs to another generation | Use a new `--out` for that task. |
| `Set the MESHY_API_KEY env var` | No key | See Before you run, item 1. |
| The Blender MCP call fails | Blender or its MCP add-on listener is not running | Start them (see [Live Blender](#live-blender)). If the call still fails, stop and report. |
| `Run this script with qa_live.run` | The script ran without `qa_live.run` | Run it with `qa_live.run` in the live Blender. |
| `... is in EDIT mode` | An object of the open scene is not in Object mode | Switch to Object mode, save, and run again. |

To test the script: `node --test <skill-dir>/scripts/meshy.test.mjs`.
