---
name: motion-for-3d-asset
description: Use when the user wants skeletal animation clips (FBX or GLB) for a 3D character, for example a game idle, run, attack, jump, or hit reaction, or when AI-generated motion looks stiff, robotic, or too small. Triggers on "animate this character", "make motions for my model", "text to motion", "mocap from a prompt", "Uthana", or /motion-for-3d-asset. Don't use for video generation, for a mesh with no humanoid body, or for hand-keyed animation in Blender.
---

# Motion for 3D Asset

Make real skeletal animation clips for a humanoid character with Uthana text-to-motion. The bundled script uploads the character, sends the prompts, and saves an FBX and a GLB for each clip. The Blender scripts measure each clip, so you report facts, not guesses.

The prompt decides the quality. Most of this skill is how to write it.

## Before you run

1. **Get the key.** The script reads `UTHANA_API_KEY` only.
   - If it is not set, look in the user's vault or secret store first.
   - If it is not there, ask the user with the harness secret tool (file delivery). Then run `UTHANA_API_KEY="$(cat <key-file>)" node ...`.
   - Never print the key. Never put it in a repo file, a command argument, or a URL.
2. **Check the balance.** Run `node <skill-dir>/scripts/uthana.mjs balance`. A 4-second clip costs about $0.40. Tell the user the total cost before you start.
3. **Get the character.** A humanoid `.glb` or `.fbx` gives clips on the real body and proportions. Without one, the clips use the default Uthana character.

## Workflow

1. **Upload the character** (once per model):

   ```bash
   node <skill-dir>/scripts/uthana.mjs character orc.glb "Orc chieftain"
   ```

   Keep the `characterId`. Uploading the same file again gives the same character. If `autoRigConfidence` is under 0.5, tell the user that the rig can be poor.

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
   - Each clip gives `<name>.fbx`, `<name>.glb`, and an entry in `<dir>/manifest.json` with the prompt and the job id. Stdout has one JSON line for each clip.
   - To make some clips again, add `--only name1,name2`. The manifest keeps the other entries.

4. **Measure each clip** with Blender (see QA below).
5. **Make a second take only of the clips that fail QA.** Change the words, because Uthana has no seed. Do not order several takes of every clip.
6. **Deliver** (see Deliver below).

## The prompt recipe

Uthana 3.0 first makes a video of a person who does the action, then takes the motion from that video. Describe what a camera sees: a real body that does a real physical action.

Write each prompt in this order:

1. **Body and grip.** "a heavy warrior with both hands together on the handle of a heavy two-handed axe". The prop is not part of the motion. A clear grip keeps the hands in the correct place. For a one-hand prop, give each hand its job: "left hand holds the bow out in front, right hand pulls the string".
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

## QA with Blender

The scripts run in headless Blender (tested on 5.3) and need no add-ons.

```bash
blender --background --factory-startup --python <skill-dir>/scripts/qa/analyze.py -- <clip.fbx> <clip.qa.json> <clip.preview.png>
blender --background --factory-startup --python <skill-dir>/scripts/qa/loopfind.py -- <clip.fbx> <min-frames>
blender --background --factory-startup --python <skill-dir>/scripts/qa/compare.py -- <out.mp4> <a.fbx> <b.fbx> ...
```

- Give Blender absolute paths. On Git Bash, `pwd -W` gives a Windows path.
- Run up to 6 Blender processes at a time.
- `analyze.py` writes the measurements and a contact sheet: 8 frames from a game camera on top and a side view below. Look at every contact sheet.
- `loopfind.py` prints the best loop window. Set `<min-frames>` to about one cycle: 15 for a run, 30 for a walk, 45 for an idle.
- The clips are 30 fps. Give `--fps 24` or `--fps 60` to `generate` for a different rate.
- `compare.py` renders clips side by side into one MP4, all scaled to the same height.

Read the measurements against `figureHeightM`, because the distances are in the units of the character:

| Clip | Pass | Fail |
|---|---|---|
| Jump | `airborne.frames` 15 or more, `maxFootClearanceM` near half of the height | under 10 frames: a hop |
| Two-hand weapon | `wristGapM.median` under 0.2 of the height | larger: a hand left the handle. For a one-hand prop, use the contact sheet. |
| Idle | `liveliness.meanJointSpeedDegPerSec` 30 or more | about 14: frozen |
| Loop | `loopfind.py` seam under 4 degrees | more: choose a different window |
| Any | upright on every contact sheet tile, except during a flip that you asked for | a flip that you did not ask for |

Do not compare joint speeds across different rigs. A rig with finger bones gives higher numbers. Ignore `torsoTwistRangeDeg`, because it has an Euler wrap artifact.

**Impact frames are measured, never guessed.** The weapon is not in the motion, so nothing shows where the axe hits. Report:

- For a strike: the frame of the wrist speed peak. `peakSpeed` gives `[speed, frame, seconds]` for each wrist (`R_Wrist`, `L_Wrist`). For a jump, use the peak after the landing (`airborne.last` + 1).
- For a release, for example an arrow: the speed peak of the hand that lets go.
- For a fall: `pelvis.lowestFrame`.
- Write the basis next to each frame, for example "frame 52 (1.73 s), measured: wrist speed peak".

## Bones

- An uploaded character that Uthana rigged gets Mixamo bone names (`mixamorig:Hips`).
- The default character has Unreal mannequin bone names (`pelvis`, `thigh_l`, `hand_l`).
- `analyze.py` reads both. In Unity, set the rig to Humanoid. Both name sets map without edits.

## Deliver

1. Give each FBX and GLB path, with its length, loop window, and impact frame.
2. Give the cost and the balance that is left.
3. Show the contact sheets and the comparison MP4 when the harness can show images or video.
4. Open the output folder for the user.
5. For Unity: import the FBX, set the rig to Humanoid, and set Loop Time on the loop window. Add animation events at the measured impact frames. A run clip moves the root forward, so use root motion or bake it into the pose.

## Errors

| Error | Cause | Fix |
|---|---|---|
| `job_limit_exceeded` (429) | 4 jobs are queued or running on the account | The script waits and sends the job again. |
| `failed during stage 1` | An error on the Uthana side | The script tries again once. If it fails again, run it with `--only`. |
| `Insufficient balance` | No money left | Tell the user to add money to the Uthana account. |
| A download returns 401 or 403 | The key is wrong | Ask the user for the key again. |

To test the script: `node --test <skill-dir>/scripts/uthana.test.mjs`.
