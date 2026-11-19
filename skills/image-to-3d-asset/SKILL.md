---
name: image-to-3d-asset
description: Use when the user wants a 3D model, mesh, or GLB made from one or more images, for example a game prop, a character, or a low-poly asset from concept art. Triggers on "image to 3D", "make a mesh from this image", "turn this into a 3D model", "game asset from this picture", or /image-to-3d-asset. Don't use for 3D work inside Blender scenes, or for text-to-3D with no image.
---

# Image to 3D Asset

Turn images into game-ready GLB meshes with PBR textures. The bundled script sends each image to a fal.ai Meshy model through TanStack AI (`generate3DModel` with `fal3DModel` from `@tanstack/ai-fal`). It waits for the job and saves the files next to the image.

## Before you run

1. **Get the images.** Each image must show one object on a plain background. A front view gives the best mesh. Local `.png`, `.jpg`, and `.jpeg` files and `https://` URLs work. Meshy does not take WebP, so convert a `.webp` file to PNG first.
2. **Get the fal key.** The script reads it from the `FAL_KEY` env var only.
   - If `FAL_KEY` is set, use it.
   - If it is not set, ask the user for the key with the harness secret tool (file delivery) when there is one. Otherwise ask the user to set `FAL_KEY`.
   - Never print the key. Never put it in a file in the repo, in a command argument, or in a URL.
3. **Install the packages.** If `<skill-dir>/scripts/node_modules` does not exist, run `npm install --prefix <skill-dir>/scripts`. The versions are pinned in `scripts/package.json`.
4. **Tell the user the cost.** Each image is one paid fal job. A job takes 5 to 15 minutes.

## Run

```bash
node <skill-dir>/scripts/image-to-3d.mjs <image> [<image> ...] [--model smart|quad] [--polycount 10000] [--out <dir>] [--no-pbr]
```

With a key in a file (from the secret tool):

```bash
FAL_KEY="$(cat <key-file>)" node <skill-dir>/scripts/image-to-3d.mjs orc.png chest.png
```

- Run it in the background. It prints progress to stderr and one JSON line per image to stdout. Wait for the process to end. Do not poll it with sleep.
- All images go to fal at the same time.
- The exit code is 1 when one image or more failed. The other images still save.

## Pick the options

| Option | Default | When to change it |
| --- | --- | --- |
| `--model smart` | yes | Meshy Smart Topology (`meshy/t2.5/image-to-3d`). Clean triangles, and it keeps to the polycount. Use it for game assets. |
| `--model quad` | no | Meshy 7.1 with quad faces (`meshy/v7.1/image-to-3d`). Use it only when the user asks for quads, for example to sculpt or subdivide in Blender. It makes about twice the triangles. |
| `--polycount` | `10000` | Props: 3000 to 10000. Characters: 10000 to 30000. `smart` stops at 30000. |
| `--out` | the image folder | Set it when the images are URLs or the user names a folder. |
| `--no-pbr` | off | Use it when the user wants a base color texture only. |

## Output

For each input image `<name>`, the script writes to the output folder:

- `<name>.glb`: the mesh with its textures.
- `<name>.preview.png`: the fal preview render.
- `<name>.json`: the TanStack AI result. `files` has the links to FBX, OBJ, USDZ, and the texture maps.

Each stdout line is JSON:

```json
{"ok":true,"image":"orc.png","endpoint":"meshy/t2.5/image-to-3d","glb":".../orc.glb","preview":".../orc.preview.png","json":".../orc.json","triangles":10373,"sizeMB":9.8,"seconds":399}
```

A failed image gives `{"ok":false,"image":"...","error":"..."}`.

## After the run

1. Give the user each GLB path, its triangle count, and its size.
2. Show the preview images when the harness can show images.
3. Open the output folder for the user.
4. If an image failed, give the error line. A fal `422` usually means a bad image or a bad option. A timeout after 30 minutes means the fal queue is busy. TanStack AI cancels the job at the timeout, so run that image again.

To check the script: `node --test <skill-dir>/scripts/image-to-3d.test.mjs`.
