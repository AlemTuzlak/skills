---
name: motion-for-3d-asset
description: Use when the user wants skeletal animation clips (FBX or GLB) for a 3D character, for example a game idle, run, attack, jump, or hit reaction, or when AI-generated motion looks stiff, robotic, or too small. Triggers on "animate this character", "make motions for my model", "text to motion", "mocap from a prompt", "Uthana", or /motion-for-3d-asset. Don't use for video generation, for a mesh with no humanoid body, or for hand-keyed animation in Blender.
---

# Motion for 3D Asset

Make real skeletal animation clips for a humanoid character with Uthana text-to-motion. The bundled script uses TanStack AI (`generateMotion` and `createUthanaCharacter` from `@tanstack/ai-uthana`). It uploads the character, sends the prompts, and saves an FBX and a GLB for each clip. The QA scripts run in the live Blender. They measure each clip and render every frame. A clip passes only on what you see.

The prompt decides the quality. Most of this skill is how to write it.

## Before you run

1. **Get the key.** The script reads `UTHANA_API_KEY` only.
   - If it is not set, look in the user's vault or secret store first.
   - If it is not there, ask the user with the harness secret tool (file delivery). Then run `UTHANA_API_KEY="$(cat <key-file>)" node ...`.
   - Never print the key. Never put it in a repo file, a command argument, or a URL.
2. **Install the packages.** If `<skill-dir>/scripts/node_modules` does not exist, run `npm install --prefix <skill-dir>/scripts`. The versions are pinned in `scripts/package.json`.
3. **Check the balance.** Run `node <skill-dir>/scripts/uthana.mjs balance`. A 4-second clip costs about $0.40. Tell the user the total cost before you start.
4. **Get the character.** A humanoid `.glb` or `.fbx` gives clips on the real body and proportions. Without one, the clips use the default Uthana character.
5. **Connect to Blender** before the first Blender step. See [Live Blender](#live-blender).

## Live Blender

All Blender work runs in the live Blender (with a UI) through the Blender MCP tool `execute_blender_code`. Never run Blender headless.

Connect first:

1. Make one real call: `execute_blender_code` with `import bpy; print(bpy.app.version_string, bpy.data.filepath)`.
2. If the call fails, start Blender with a UI and the MCP add-on listener, the way this project documents it. Then make the call again.
3. If it still fails, stop. Report what failed and the error text. Do not go on.
4. If the project uses a game engine (for example Unity), do the same with the MCP of the engine before the first engine step.

Run a QA script:

1. If the open Blender file has unsaved changes, save it (`bpy.ops.wm.save_mainfile()`).
2. Run the script with `execute_blender_code`. Give absolute paths. On Git Bash, `pwd -W` gives a Windows path.

   ```python
   import sys; sys.path.insert(0, r'<skill-dir>/scripts/qa'); import qa_live
   qa_live.run(r'<skill-dir>/scripts/qa/analyze.py', r'<clip.fbx>', r'<clip.qa.json>', r'<clip.qa.png>')
   ```

- `qa_live.run` gives the script a new empty scene. Then it removes that scene and all data that the run made. The open file stays as it was. Blender stays open.
- The output of the script comes back in the MCP result. A script error comes back as the error of the call.
- One MCP call has a time limit. Run one clip in each call. For a long clip, give `frame-sheets.py` a `--take` or a `--frames` range.

## Workflow

1. **Upload the character** (once per model):

   ```bash
   node <skill-dir>/scripts/uthana.mjs character orc.glb "Orc chieftain"
   ```

   Keep the `characterId`. Uploading the same file again gives the same character. If `autoRigConfidence` is under 0.5, tell the user that the rig can be poor.

   - Uthana rigs the character only when the file has no skeleton.
   - If the file already has the rig that the project uses (for example a Meshy Mixamo rig), add `--no-auto-rig`. Then a file that lost its skeleton fails at upload, and Uthana never puts the clips on a new skeleton.
   - Check the first clip: `skeleton` in its QA report must show the bone count and the root bone of your rig.

2. **Write `clips.json`** with the prompt recipe below. Use 4 seconds for each clip:

   ```json
   [
     { "name": "orc_idle", "prompt": "a big tired warrior breathing hard ...", "seconds": 4 },
     { "name": "enemy_stagger", "prompt": "a fighter standing in a guard stance ...", "character": "cXi2eAP19XwQ" }
   ]
   ```

3. **Generate** in the background:

   ```bash
   node <skill-dir>/scripts/uthana.mjs generate clips.json --character <characterId> --out <dir>
   ```

   - The script runs 4 jobs at a time, because Uthana refuses a 5th. A job takes about 2 to 3 minutes.
   - When Uthana fails a job on its side ("failed during stage 1"), the script tries the clip one more time.
   - Each clip gives `<name>.fbx`, `<name>.glb`, and an entry in `<dir>/manifest.json` with the prompt, the job id, and the SHA-256 of each file. Stdout has one JSON line for each clip.
   - `--only name1,name2` runs only those clips. The manifest keeps the other entries.
   - Use `--only` only for a clip that failed and has no files. It writes over the files and the manifest entry of a clip with the same name.

4. **Measure each clip, and look at every frame** (see [QA in the live Blender](#qa-in-the-live-blender) and [Check by sight](#check-by-sight)).
5. **Make a second take only of the clips that fail QA.** Change the words, because Uthana has no seed. Give the new take a new name, for example `orc_idle_2`, so that the first take keeps its files. Do not order several takes of every clip. Obey the [stop rule](#done-and-stop-rules).
6. **Deliver** (see Deliver below).

## The prompt recipe

Uthana 3.0 first makes a video of a person who does the action, then takes the motion from that video. Describe what a camera sees: a real body that does a real physical action.

Write each prompt in this order:

1. **Body and grip.** The prop is not part of the motion, so the grip words are the only thing that keeps the hands in place.
   - Give the grip at the start, and say again near the end that it stays: "Both hands stay on the axe handle the whole time." When the grip is only at the start, the hands can come apart during a big move. In a war cry test, the hands separated overhead (wrist gap 0.49 of the figure height). With the repeat, the gap was 0.18.
   - For a two-handed weapon, give each hand its own hold: one hand overhand, one hand underhand. Nobody swings a two-handed weapon with both hands overhand. Write it: "the right hand holds the handle overhand near the head, the left hand holds it underhand near the end". This wording is not tested yet. The QA has no metric for the hold, so look at the hands on the contact sheet.
   - For a one-hand prop, give each hand its job: "left hand holds the bow out in front, right hand pulls the string".
2. **Start pose.** "sinks low", "standing in a guard stance".
3. **Wind-up.** "slowly twists the torso back to the right, lifting the axe high over the right shoulder".
4. **The action, driven by the whole body.** "the hips turn, the back foot pushes, and both arms swing the axe hard".
5. **The result of the weight.** "the swing pulls the torso around and he stumbles half a step to catch the weight".
6. **The end state.** "slowly comes back up to a ready stance", "lies on his back", or "returns to the same low stance" for a loop.
7. **Guard rails.** Say what must not happen: "He stays upright and does not flip." "He keeps running straight forward." When the move is a flip, ask for it: "rotates fully head over heels, then lands on both feet".

Rules that change the result:

- **Size words set the amplitude.** "jumps a short distance" gave a 0.3 s hop. "explodes upward into a big powerful jump high into the air and far forward" gave 0.7 s in the air and five times the foot clearance.
- **Weight cues add life.** Use low hips, deeply bent knees, hunched shoulders, heavy breaths, and a stumble after the effort.
- **An idle needs tasks.** "stands and breathes" gives a frozen clip. Add: rolls the shoulders, shifts the weight, adjusts the grip, glances left and right. End with "then returns to the same stance".
- **A hit reaction needs a direction, a target, and an end.** "hit hard in the chest by a heavy blow from the front", then the body chain, then "raises his guard again" or "lies on his back". The hit lands at frame 0.
- **Do not write short, plain prompts.** They give calm, robotic motion.
- **Describe a person, not a creature.** The source is a video of a person, and the mesh gives the look. Write the build of the creature as a person: "a big heavy warrior" for an orc, "a thin bony archer" for a skeleton. Creature words were not tested.
- **Plan for 4 seconds.** Every clip came back 3.97 s long, also when the request was 4.5 s. Put the full action, with the recovery, inside 4 s.

Full prompts that passed QA, with their measured results, are in [references/prompt-library.md](references/prompt-library.md). Start from the closest one.

## QA in the live Blender

The scripts run in the live Blender (tested on 5.3) through `qa_live.run` (see [Live Blender](#live-blender)). They need no other add-ons. The numbers point to frames to look at. A number can stop a clip. A number never passes a clip. Only the [check by sight](#check-by-sight) passes it.

```python
import sys; sys.path.insert(0, r'<skill-dir>/scripts/qa'); import qa_live
qa_live.run(r'<skill-dir>/scripts/qa/analyze.py', r'<clip.fbx>', r'<clip.qa.json>', r'<clip.qa.png>')
qa_live.run(r'<skill-dir>/scripts/qa/frame-sheets.py', r'<clip.fbx>', r'<sheets-dir>')
qa_live.run(r'<skill-dir>/scripts/qa/loopfind.py', r'<clip.fbx>', 30)
qa_live.run(r'<skill-dir>/scripts/qa/compare.py', r'<out.mp4>', r'<a.fbx>', r'<b.fbx>')
```

- `analyze.py` writes the measurements and a contact sheet: 8 frames from a game camera on top and a side view below.
- `frame-sheets.py` renders every frame of every take from 3 fixed angles: front, side, and 3/4. Each sheet has 16 frames (4 x 4, left to right, then top to bottom). `<sheets-dir>/<clip>.sheets.json` gives the frames of each sheet. Give `'--take', '<name>'` or `'--frames', '1-48'` to split a long clip.
- `loopfind.py` prints the best loop window. Set the last value to about one cycle in frames: 15 for a run, 30 for a walk, 45 for an idle.
- The clips are 30 fps. Give `--fps 24` or `--fps 60` to `generate` for a different rate.
- `compare.py` renders clips side by side into one MP4, all scaled to the same height. It also writes `<out.mp4>.json` with the identity of each clip. All clips in one video need the same frame rate.

**Native first.** `analyze.py` starts the report with `identity`: the SHA-256 and size of the file, and the take (action name, frame rate, first and last frame). Measure the provider file first. Its SHA-256 must be `files.fbx.sha256` of the clip in `<dir>/manifest.json`. Read the numbers of the clip only from this native report.

A corrected copy is a converted, retargeted, or hand-fixed file. Give it its own report, bound to the native report:

```python
qa_live.run(r'<skill-dir>/scripts/qa/analyze.py', r'<copy.fbx>', r'<copy.qa.json>', r'<copy.qa.png>', '--native', r'<clip.qa.json>')
```

- `identity.native` names the native report and file. `changeFromNative` gives the change of each main measure, with distances as a share of the figure height.
- A large change of the wrist gap means that the correction holds the weapon, and the clip does not. Choose another clip, or make a new take.
- The script refuses to write over the native report, or over the report of another file.

Read the measurements against `figureHeightM`, because the distances are in the units of the character. A clip that meets the expected value still needs the check by sight.

| Clip | Expected | If not |
|---|---|---|
| Jump | `airborne.frames` 15 or more, `maxFootClearanceM` near half of the height | under 10 frames: a hop |
| Two-hand weapon | native `wristGapM.median` under 0.2 of the height, and both hands on the handle at `wristGapM.maxFrame` | larger: a one-hand clip. Do not use it for a two-hand weapon. A correction cannot make it pass. For a one-hand prop, use the contact sheet. |
| Idle | `liveliness.meanJointSpeedDegPerSec` 30 or more | about 14: frozen |
| Loop | `loopfind.py` seam under 4 degrees | more: choose a different window |
| Any | upright on every contact sheet tile, except during a flip that you asked for | a flip that you did not ask for |
| Corrected copy | each `changeFromNative` value inside the correction budget of the project | outside the budget, or no budget: choose another clip |

Do not compare joint speeds across different rigs. A rig with finger bones gives higher numbers. Ignore `torsoTwistRangeDeg`, because it has an Euler wrap artifact.

**Impact frames are measured, never guessed.** The weapon is not in the motion, so nothing shows where the axe hits. Report:

- For a strike: the frame of the wrist speed peak. `peakSpeed` gives `[speed, frame, seconds]` for each wrist (`R_Wrist`, `L_Wrist`). For a jump, use the peak after the landing (`airborne.last` + 1).
- For a release, for example an arrow: the speed peak of the hand that lets go.
- For a fall: `pelvis.lowestFrame`.
- Write the basis next to each frame, for example "frame 52 (1.73 s), measured: wrist speed peak".

## Check by sight

A script cannot see a twist or a hand that goes through the body. Look at every frame of every clip.

1. Run `frame-sheets.py` on each clip in the live Blender. Look at every sheet: each frame from the front, the side, and the 3/4 angle.
2. If the project uses a game engine, play each clip on the character in the engine, at the gameplay camera distance. Capture it and look at the capture.
3. For each clip, write what you saw, for example "no twist, no deformation, no clipping, no floating weapon". Give the frame of each defect that you find.
4. A clip passes only when its list of defects is empty, in Blender and in the engine.

Do not make a check less strict without the approval of the user.

## Done and stop rules

- **Done:** Say "done" only after the check by sight passes in Blender and in the engine. Attach the frame sheets and the engine captures.
- **Stop:** If the same defect fails 2 rounds in a row, stop. Find out how shipped games solve that defect. Report to the user with 2 or 3 options. Do not start round 3.

## Bones

- An uploaded character that Uthana rigged gets Mixamo bone names (`mixamorig:Hips`).
- The default character has Unreal mannequin bone names (`pelvis`, `thigh_l`, `hand_l`).
- `analyze.py` reads both.

Equal bone names do not prove that a clip fits a rig. In Unity, use the rig type that the project declares for the character. With no declaration, use Generic: it plays the native bones as they are. Use Humanoid only when all of these are true:

1. The project uses Humanoid for this character.
2. The rest pose and the bind pose of the clip rig match the rig of the character.
3. The native clip and the Humanoid import, compared at the same frames, show no change of the hands, feet, or facing that you did not ask for.

## Deliver

1. Give each FBX and GLB path, with its length, loop window, impact frame, and what you saw in the check by sight.
2. Give the cost and the balance that is left.
3. Attach the frame sheets, the engine captures, the contact sheets, and the comparison MP4.
4. Open the output folder for the user.
5. For Unity: import the FBX with the rig type from [Bones](#bones), and set Loop Time on the loop window. Add animation events at the measured impact frames. A run clip moves the root forward, so use root motion or bake it into the pose.
6. If the clips go into a game repo with production gates, follow [Game project gates](#game-project-gates).

## Game project gates

If the game repo has `scripts/character-production.ps1`, clips enter the game only through its production gates. [image-to-3d-asset Game project gates](../image-to-3d-asset/SKILL.md#game-project-gates) has the commands. For a clip, these rules hold:

- Keep the provider folder unchanged. Give it to the wrapper as a source root, for example `-SourceRoot uthana=C:/out/orc-clips`.
- Copy the `jobId`, the `characterId`, the file hashes, and the take (`identity.take` of the native QA report) into the production record. Do not invent a value.
- A correction (a hand seat, a wrist turn, a reach) has a budget in the record. Report the native value, each correction, and the final value. A small final error does not accept a large correction.
- `Promote` runs only after the owner accepts the review receipt.

## Errors

| Error | Cause | Fix |
|---|---|---|
| `job_limit_exceeded` (429) | 4 jobs are queued or running on the account | The script waits and sends the job again. |
| `failed during stage 1` | An error on the Uthana side | The script tries again once. If it fails again, run it with `--only`. |
| `Insufficient balance` | No money left | Tell the user to add money to the Uthana account. |
| A download returns 401 or 403 | The key is wrong | Ask the user for the key again. |
| The Blender MCP call fails | Blender or its MCP add-on listener is not running | Start them (see [Live Blender](#live-blender)). If the call still fails, stop and report. |
| `Run this script with qa_live.run` | The script ran without `qa_live.run` | Run it with `qa_live.run` in the live Blender. |
| `... is in EDIT mode` | An object of the open scene is not in Object mode | Switch to Object mode, save, and run again. |

To test the script: `node --test <skill-dir>/scripts/uthana.test.mjs`.
