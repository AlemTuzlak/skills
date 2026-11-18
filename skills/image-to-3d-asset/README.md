# image-to-3d-asset

Give the agent an image of an object, and get back a game-ready 3D mesh (GLB) with PBR textures. The skill runs fal.ai Meshy models from a small Node script.

## What it does

- **One image or many:** each image becomes one GLB. All images go to fal at the same time.
- **Low-poly by default:** Meshy Smart Topology (`meshy/t2.5/image-to-3d`) makes clean triangles and keeps to the triangle budget (10,000 by default).
- **Quads when you ask:** `--model quad` uses Meshy 7.1 with quad faces, for sculpting or subdivision in Blender.
- **Checks the result:** the script counts the triangles in each GLB and reports the file size and the time.
- **No packages:** the script uses only Node built-ins. It needs Node 20 or newer.

## Usage

Ask in plain words:

```
/image-to-3d-asset
turn concept/orc.png into a 3D model
make low-poly meshes from these 3 images
```

The agent asks for your fal key if `FAL_KEY` is not set. You can also run the script yourself:

```bash
FAL_KEY=... node skills/image-to-3d-asset/scripts/image-to-3d.mjs orc.png chest.png --polycount 8000
```

Each image is one paid fal job, and a job takes 5 to 15 minutes.

For the best mesh, use an image of one object on a plain background, seen from the front.

## Output

Next to each image (or in `--out <dir>`):

- `<name>.glb`: the mesh with its textures.
- `<name>.preview.png`: the fal preview render.
- `<name>.json`: the full fal result, with links to FBX, OBJ, USDZ, and the texture maps.

The script prints one JSON line for each image with the GLB path, the triangle count, the size, and the time.
