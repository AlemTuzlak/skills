# motion-for-3d-asset

Give the agent a humanoid character and a list of moves, and get back skeletal animation clips (FBX and GLB) made on that character. The skill uses Uthana text-to-motion through a small Node script that uses [TanStack AI](https://tanstack.com/ai) (`generateMotion` with the `@tanstack/ai-uthana` adapter), and measures every clip with headless Blender.

## What it does

- **Clips on your character:** it uploads your GLB or FBX once. Uthana rigs it when the file has no skeleton, and every clip comes back on its body. For a file that already has the rig of the project, `--no-auto-rig` makes sure that Uthana uses that rig.
- **Prompts that move:** a prompt recipe and a library of prompts that passed QA. The recipe gives the body a grip, a wind-up, a whole-body action, the result of the weight, and an end state.
- **Measured QA:** Blender scripts measure air time, grip, liveliness, foot slide, and loop seams. They also render a contact sheet for each clip and a side-by-side MP4. Each report starts with the SHA-256 and the take of the file that it measured.
- **Native first:** a clip is judged on the provider file. A converted or hand-fixed copy gets its own report with `--native`. That report shows how far each change moved the clip, and it never replaces the native result.
- **Rig type on purpose:** in Unity, the rig type that the project declares, else Generic. Humanoid only after a check that the native poses stay the same.
- **Honest timing:** impact frames come from the wrist speed or the pelvis height, with the basis written next to each frame.
- **Published packages only:** the script uses the npm releases `@tanstack/ai@1.7.0` and `@tanstack/ai-uthana@0.1.0`. It needs Node 20 or newer. It never prints your key.

## Usage

```
/motion-for-3d-asset
make an idle, a run, and an axe attack for models/orc.glb
these motions look robotic, make them heavier
```

Run the script yourself. Install the packages once:

```bash
npm install --prefix skills/motion-for-3d-asset/scripts
UTHANA_API_KEY=... node skills/motion-for-3d-asset/scripts/uthana.mjs balance
UTHANA_API_KEY=... node skills/motion-for-3d-asset/scripts/uthana.mjs character orc.glb "Orc"
UTHANA_API_KEY=... node skills/motion-for-3d-asset/scripts/uthana.mjs generate clips.json --character <id> --out clips
```

For a character file that already has its rig, add `--no-auto-rig` to the `character` command.

A 4-second clip costs about $0.40 and takes 2 to 3 minutes. Uthana runs 4 jobs at a time per account.

## Output

- `<name>.fbx` and `<name>.glb` for each clip, and `manifest.json` with the prompt, the job id, and the SHA-256 of each file. A new take gets a new clip name, so the earlier take keeps its files.
- A QA report and a contact sheet from `analyze.py`. The report starts with `identity`. A corrected copy adds `identity.native` and `changeFromNative`.
- An MP4 and `<video>.json` from `compare.py`, with the identity of each clip in the video.

In a game repo with `scripts/character-production.ps1`, clips enter the game only through its production gates. [SKILL.md Game project gates](SKILL.md#game-project-gates) has the rules.
