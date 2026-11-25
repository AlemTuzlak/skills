# Render every frame of every take in one clip file from 3 fixed angles, for
# the check by sight. This script measures nothing and passes nothing.
# Run it in the live Blender through the Blender MCP (see qa_live.py):
#   qa_live.run(r'<qa-dir>/frame-sheets.py', <clip.fbx|clip.glb>, <outDir>[, '--take', <name>][, '--frames', '<first>-<last>'])
# For each angle and each block of 16 frames, it writes one sheet: a 4x4 grid,
# frames left to right, then top to bottom. The sheet name is
# <file stem>.<take>.<angle>.f<first frame>.png.
# <outDir>/<file stem>.sheets.json lists each sheet with its take, angle, and frames.
#
# The angles are fixed in the world. Characters import facing -Y, so at the
# start of a take "front" shows the face:
#   front: from -Y. side: from -X (the right side of the character).
#   threeQuarter: from (-1, -1, 0.6), above the front right.
# The camera follows the body across the ground. Each angle keeps one scale
# for the whole take, so the frames compare, and the body fills the tile. The ground plane stays at the lowest point
# of the take, so a jump or a float shows a gap under the feet.
# --take renders one take. --frames renders a frame range. Use them to keep one
# MCP call inside its time limit.
import bpy, sys, os, re, json, hashlib
import numpy as np
from mathutils import Vector

USAGE = ("usage: qa_live.run(r'<qa-dir>/frame-sheets.py', <clip.fbx|clip.glb>, <outDir>"
         "[, '--take', <name>][, '--frames', '<first>-<last>'])")
TILE = 384
GRID = 4  # 4 x 4 = 16 frames on each sheet
BACKGROUND = (0.1, 0.1, 0.12)
VIEWS = {
    'front': Vector((0, -1, 0)),
    'side': Vector((-1, 0, 0)),
    'threeQuarter': Vector((-1, -1, 0.6)),
}

if not bpy.context.scene.get('qa_live'):
    raise RuntimeError('Run this script with qa_live.run in the live Blender. See SKILL.md.')
args = sys.argv[sys.argv.index('--') + 1:]
if len(args) < 2 or len(args) % 2:
    raise ValueError(USAGE)
clip, out_dir = args[0], args[1]
options = dict(zip(args[2::2], args[3::2]))
if set(options) - {'--take', '--frames'}:
    raise ValueError(USAGE)
frame_window = None
if '--frames' in options:
    match = re.fullmatch(r'(\d+)-(\d+)', options['--frames'])
    if not match:
        raise ValueError('--frames takes <first>-<last>, for example 1-48')
    frame_window = (int(match[1]), int(match[2]))

sc = bpy.context.scene
actions_before = set(bpy.data.actions)
extension = os.path.splitext(clip)[1].lower()
if extension == '.fbx':
    bpy.ops.import_scene.fbx(filepath=clip)
elif extension in ('.glb', '.gltf'):
    bpy.ops.import_scene.gltf(filepath=clip)
else:
    raise ValueError(f'{clip}: give an .fbx, .glb, or .gltf file')
arm = next((o for o in sc.objects if o.type == 'ARMATURE'), None)
if arm is None or arm.animation_data is None:
    raise ValueError(f'{clip} has no animated armature')



def animates_bones(action):
    """True when the action has keys on pose bones."""
    if hasattr(action, 'layers'):  # Blender 4.4 and later: layered actions
        curves = [curve for layer in action.layers for strip in layer.strips
                  for bag in strip.channelbags for curve in bag.fcurves]
    else:
        curves = list(action.fcurves)
    return any(curve.data_path.startswith('pose.bones') for curve in curves)


# The takes: the active action, the actions in the NLA tracks, and the other
# bone actions of the file. The FBX import makes one action for each take of a
# multi-take file, but it plays only the first one. Mute the tracks, so that
# each take plays alone.
anim = arm.animation_data
takes = [anim.action] if anim.action else []
for track in anim.nla_tracks:
    track.mute = True
    takes += [strip.action for strip in track.strips if strip.action and strip.action not in takes]
takes += [action for action in bpy.data.actions
          if action not in actions_before and action not in takes and animates_bones(action)]
if '--take' in options:
    names = [take.name for take in takes]
    takes = [take for take in takes if take.name == options['--take']]
    if not takes:
        raise ValueError(f'{clip} has no take {options["--take"]}. Takes: {names}')
if not takes:
    raise ValueError(f'{clip} has no take')

# The body: the meshes that the armature moves. The provider files can carry
# loose helper spheres (names that start with "qiu"). Hide them and other meshes.
body = [o for o in sc.objects if o.type == 'MESH' and not o.name.startswith('qiu')
        and (o.parent is arm or o.find_armature() is arm)]
if not body:
    raise ValueError(f'{clip} has no mesh on the armature')
for obj in sc.objects:
    if obj.type == 'MESH' and obj not in body:
        obj.hide_render = True


def use_take(action):
    # Start each take from the rest pose, so that bones that the take does
    # not key do not keep the pose of the take before.
    for bone in arm.pose.bones:
        bone.location = (0, 0, 0)
        bone.rotation_quaternion = (1, 0, 0, 0)
        bone.rotation_euler = (0, 0, 0)
        bone.rotation_axis_angle = (0, 0, 1, 0)
        bone.scale = (1, 1, 1)
    anim.action = action
    # Blender 4.4 and later play an action through a slot.
    slots = getattr(action, 'slots', None)
    if slots and getattr(anim, 'action_slot', None) is None:
        anim.action_slot = slots[0]


def body_bounds():
    """The world bounding box of the deformed body at the current frame."""
    depsgraph = bpy.context.evaluated_depsgraph_get()
    corners = []
    for obj in body:
        evaluated = obj.evaluated_get(depsgraph)
        corners += [evaluated.matrix_world @ Vector(corner) for corner in evaluated.bound_box]
    points = np.array(corners)
    return points.min(axis=0), points.max(axis=0)


def file_sha256(path):
    digest = hashlib.sha256()
    with open(path, 'rb') as stream:
        for block in iter(lambda: stream.read(1 << 20), b''):
            digest.update(block)
    return digest.hexdigest()


# ---- render settings, the same for every take ----
sc.render.engine = 'BLENDER_WORKBENCH'
sc.display.shading.light = 'STUDIO'
sc.display.shading.color_type = 'TEXTURE'
sc.display.shading.show_cavity = True
sc.display.shading.show_shadows = True
try:
    # Standard keeps the texture colors as they are in the file.
    sc.view_settings.view_transform = 'Standard'
except TypeError:
    pass
sc.render.resolution_x = sc.render.resolution_y = TILE
sc.render.resolution_percentage = 100
world = bpy.data.worlds.new('qa-world')
world.color = BACKGROUND
sc.world = world
cam_data = bpy.data.cameras.new('qa-camera')
cam_data.type = 'ORTHO'
cam = bpy.data.objects.new('qa-camera', cam_data)
sc.collection.objects.link(cam)
sc.camera = cam
bpy.ops.mesh.primitive_plane_add(size=1)
ground_plane = bpy.context.object
ground_material = bpy.data.materials.new('qa-ground')
ground_material.diffuse_color = (0.28, 0.3, 0.33, 1)
ground_plane.data.materials.append(ground_material)

os.makedirs(out_dir, exist_ok=True)
stem = os.path.splitext(os.path.basename(clip))[0]
tile_path = os.path.join(out_dir, f'{stem}.tile.png')
blank = np.empty((TILE, TILE, 4), dtype=np.float32)
blank[:] = (*BACKGROUND, 1.0)


def render_tile():
    sc.render.filepath = tile_path
    bpy.ops.render.render(write_still=True)
    image = bpy.data.images.load(tile_path, check_existing=False)
    pixels = np.empty(TILE * TILE * 4, dtype=np.float32)
    image.pixels.foreach_get(pixels)
    bpy.data.images.remove(image)
    return pixels.reshape(TILE, TILE, 4)


def write_sheet(tiles, path):
    """Put up to 16 tiles in a 4x4 grid, first tile at the top left."""
    tiles = tiles + [blank] * (GRID * GRID - len(tiles))
    rows = [np.concatenate(tiles[row * GRID:(row + 1) * GRID], axis=1) for row in range(GRID)]
    # Blender image rows run bottom-up, so the first row of tiles goes last.
    sheet = np.concatenate(rows[::-1], axis=0)
    image = bpy.data.images.new('qa-sheet', TILE * GRID, TILE * GRID, alpha=True)
    image.pixels.foreach_set(sheet.ravel())
    image.filepath_raw = path
    image.file_format = 'PNG'
    image.save()
    bpy.data.images.remove(image)


sheets = []
for take in takes:
    use_take(take)
    first, last = (int(round(v)) for v in take.frame_range)
    if frame_window:
        first, last = max(first, frame_window[0]), min(last, frame_window[1])
        if first > last:
            raise ValueError(f'take {take.name} has no frames in {options["--frames"]}')
    frames = list(range(first, last + 1))

    # First pass: where the body is in each frame, and the size of the whole take.
    bounds = []
    for frame in frames:
        sc.frame_set(frame)
        bounds.append(body_bounds())
    centers = [(low + high) / 2 for low, high in bounds]
    ground = float(min(low[2] for low, _ in bounds))
    top = float(max(high[2] for _, high in bounds))
    span = max(float(np.linalg.norm([high[0] - low[0], high[1] - low[1], top - ground])) for low, high in bounds)
    targets = [np.array((center[0], center[1], (ground + top) / 2)) for center in centers]
    # The size of each view: the largest extent of the body on the image
    # plane of that view, over the whole take, plus a small margin. Then the
    # body fills the tile in each view, and keeps one scale for the take.
    view_scale = {}
    for view, direction in VIEWS.items():
        rotation = (-direction.normalized()).to_track_quat('-Z', 'Y').to_matrix()
        axes = np.array([rotation.col[0], rotation.col[1]])  # image right and up
        extent = 0.0
        for (low, high), target in zip(bounds, targets):
            corners = np.array([[x, y, z] for x in (low[0], high[0]) for y in (low[1], high[1])
                                for z in (low[2], high[2])]) - target
            extent = max(extent, float(np.abs(corners @ axes.T).max()) * 2)
        view_scale[view] = extent * 1.08
    cam_data.clip_start = span * 0.01
    cam_data.clip_end = span * 100
    middle = np.mean(centers, axis=0)
    ground_plane.location = (float(middle[0]), float(middle[1]), ground)
    ground_plane.scale = (span * 40, span * 40, 1)

    # Second pass: render each frame from each angle, 16 frames to a sheet.
    take_name = re.sub(r'[^A-Za-z0-9_-]+', '_', take.name)
    for block_start in range(0, len(frames), GRID * GRID):
        block = frames[block_start:block_start + GRID * GRID]
        tiles = {view: [] for view in VIEWS}
        for frame in block:
            sc.frame_set(frame)
            target = Vector(targets[frame - first])
            for view, direction in VIEWS.items():
                direction = direction.normalized()
                cam_data.ortho_scale = view_scale[view]
                cam.location = target + direction * span * 10
                cam.rotation_euler = (-direction).to_track_quat('-Z', 'Y').to_euler()
                tiles[view].append(render_tile())
        for view in VIEWS:
            path = os.path.abspath(os.path.join(out_dir, f'{stem}.{take_name}.{view}.f{block[0]:04d}.png'))
            write_sheet(tiles[view], path)
            sheets.append({'take': take.name, 'angle': view, 'frames': [block[0], block[-1]], 'path': path})
if os.path.exists(tile_path):
    os.remove(tile_path)

# Keep the sheets of earlier runs on the same file (other takes or frame ranges).
index_path = os.path.join(out_dir, f'{stem}.sheets.json')
sha256 = file_sha256(clip)
earlier = []
if os.path.exists(index_path):
    with open(index_path) as fh:
        index = json.load(fh)
    if index.get('sha256') == sha256:
        new_paths = {sheet['path'] for sheet in sheets}
        earlier = [sheet for sheet in index['sheets'] if sheet['path'] not in new_paths]
with open(index_path, 'w') as fh:
    json.dump({'file': os.path.abspath(clip), 'sha256': sha256, 'tile': TILE, 'grid': [GRID, GRID],
               'sheets': earlier + sheets}, fh, indent=2)
print('SHEETS_OK', os.path.abspath(index_path), len(sheets))
