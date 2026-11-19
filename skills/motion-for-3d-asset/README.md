# motion-for-3d-asset

Give the agent a humanoid character and a list of moves, and get back skeletal animation clips (FBX and GLB) made on that character. The skill uses Uthana text-to-motion through a small Node script that uses [TanStack AI](https://tanstack.com/ai) (`generateMotion` with the `@tanstack/ai-uthana` adapter), and measures every clip with headless Blender.

## What it does

- **Clips on your character:** it uploads your GLB or FBX once. Uthana rigs it, and every clip comes back on its body.
- **Prompts that move:** a prompt recipe and a library of prompts that passed QA. The recipe gives the body a grip, a wind-up, a whole-body action, the result of the weight, and an end state.
- **Measured QA:** Blender scripts measure air time, grip, liveliness, foot slide, and loop seams. They also render a contact sheet for each clip and a side-by-side MP4.
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

A 4-second clip costs about $0.40 and takes 2 to 3 minutes. Uthana runs 4 jobs at a time per account.
