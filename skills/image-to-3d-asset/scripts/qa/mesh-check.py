# Headless Blender QA for one generated GLB, before we pay for a rig.
#   blender --background --factory-startup --python mesh-check.py -- <model.glb> <out.json> <renders.png>
# Writes the SHA-256 and size of the file, the triangle and vertex counts, the
# loose parts (mesh islands), the non-manifold edges, the bounding box, the
# materials and texture sizes, the skeleton facts, and the vertices with no
# bone weight. Renders a 2x2 sheet of the textured model:
#   top row: front, right side; bottom row: back, 3/4.
# A rigged model is measured and rendered in its rest pose.
# "vertices" is the count in the file. glTF splits vertices at UV seams, so
# it is larger than the vertex count in a modeling tool.
# The SHA-256 ties the report to the exact bytes. When it equals the hash in
# the Meshy manifest.json, the report measures the native Meshy file.
#
# glTF characters face +Z. Blender imports them facing -Y, so the front
# camera looks from -Y. "Right side" is the character's right side (-X).
import bpy, bmesh, sys, os, json, hashlib
import numpy as np
from mathutils import Vector

args = sys.argv[sys.argv.index('--') + 1:]
if len(args) != 3:
    print('usage: blender --background --factory-startup --python mesh-check.py -- <model.glb> <out.json> <renders.png>')
    sys.exit(2)
glb, out_json, renders_png = args[0], args[1], args[2]

TILE = 512
BACKGROUND = (0.18, 0.18, 0.18)  # linear, a neutral middle gray
FINGER_WORDS = ('index', 'thumb', 'finger')
# At most this many island sizes are listed for each object.
MAX_ISLANDS_LISTED = 20

bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=glb)
sc = bpy.context.scene
armatures = [o for o in sc.objects if o.type == 'ARMATURE']
# The importer adds a mesh to draw the bones. It is not part of the model.
bone_shapes = {pb.custom_shape for arm in armatures for pb in arm.pose.bones if pb.custom_shape}
meshes = [o for o in sc.objects if o.type == 'MESH' and o not in bone_shapes]
if not meshes:
    print(f'ERROR: {glb} has no mesh objects')
    sys.exit(1)

for arm in armatures:
    arm.data.pose_position = 'REST'
bpy.context.view_layer.update()
depsgraph = bpy.context.evaluated_depsgraph_get()


def file_sha256(path):
    """The SHA-256 of a file, read in blocks."""
    digest = hashlib.sha256()
    with open(path, 'rb') as stream:
        for block in iter(lambda: stream.read(1 << 20), b''):
            digest.update(block)
    return digest.hexdigest()


def unweighted_vertices(obj):
    """Vertices with no weight above 0 on a deform bone. None for a mesh with no armature.
    After a weight transfer to a LOD, this must be 0, or those vertices stay behind when the rig moves."""
    armature = obj.find_armature()
    if armature is None:
        return None
    deform = {bone.name for bone in armature.data.bones if bone.use_deform}
    groups = {group.index for group in obj.vertex_groups if group.name in deform}
    return sum(1 for vertex in obj.data.vertices
               if not any(item.group in groups and item.weight > 0 for item in vertex.groups))


def islands(bm):
    """Return the face count of each island, largest first. Faces that share a vertex are in one island."""
    for face in bm.faces:
        face.tag = False
    sizes = []
    for start in bm.faces:
        if start.tag:
            continue
        start.tag = True
        stack, size = [start], 0
        while stack:
            face = stack.pop()
            size += 1
            for vert in face.verts:
                for linked in vert.link_faces:
                    if not linked.tag:
                        linked.tag = True
                        stack.append(linked)
        sizes.append(size)
    return sorted(sizes, reverse=True)


objects = []
world_points = []
for obj in meshes:
    evaluated = obj.evaluated_get(depsgraph)
    mesh = evaluated.to_mesh()
    mesh.calc_loop_triangles()
    coords = np.empty(len(mesh.vertices) * 3, dtype=np.float64)
    mesh.vertices.foreach_get('co', coords)
    coords = coords.reshape(-1, 3)
    matrix = np.array(obj.matrix_world)
    world_points.append(coords @ matrix[:3, :3].T + matrix[:3, 3])

    bm = bmesh.new()
    bm.from_mesh(mesh)
    # glTF splits vertices at UV and normal seams. Weld them first, or each
    # UV island counts as a loose part. Because of the weld, two parts that
    # touch at the same vertex position count as one part.
    size = np.ptp(coords, axis=0).max() if len(coords) else 0.0
    bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=max(float(size) * 1e-6, 1e-8))
    island_sizes = islands(bm)
    boundary = sum(1 for e in bm.edges if len(e.link_faces) == 1)
    non_manifold = sum(1 for e in bm.edges if not e.is_manifold)
    bm.free()

    objects.append({
        'name': obj.name,
        'triangles': len(mesh.loop_triangles),
        'vertices': len(mesh.vertices),
        'looseParts': len(island_sizes),
        'islandFaces': island_sizes[:MAX_ISLANDS_LISTED],
        'nonManifoldEdges': non_manifold,
        'boundaryEdges': boundary,
        'skinned': obj.find_armature() is not None,
        'unweightedVertices': unweighted_vertices(obj),
    })
    evaluated.to_mesh_clear()

points = np.concatenate(world_points)
low, high = points.min(axis=0), points.max(axis=0)
box_size = high - low

materials = {slot.material for obj in meshes for slot in obj.material_slots if slot.material}
textures = {}
for material in materials:
    if not material.node_tree:
        continue
    for node in material.node_tree.nodes:
        if node.type == 'TEX_IMAGE' and node.image:
            textures[node.image.name] = list(node.image.size)

bones = [bone for arm in armatures for bone in arm.data.bones]
finger_bones = [b.name for b in bones if any(word in b.name.lower() for word in FINGER_WORDS)]


def rounded(values):
    return [round(float(v), 4) for v in values]


skinned = [o for o in objects if o['unweightedVertices'] is not None]
report = {
    'file': os.path.abspath(glb),
    'sha256': file_sha256(glb),
    'bytes': os.path.getsize(glb),
    'triangles': sum(o['triangles'] for o in objects),
    'vertices': sum(o['vertices'] for o in objects),
    'meshObjects': len(objects),
    'looseParts': sum(o['looseParts'] for o in objects),
    'nonManifoldEdges': sum(o['nonManifoldEdges'] for o in objects),
    'boundaryEdges': sum(o['boundaryEdges'] for o in objects),
    'boundingBox': {'min': rounded(low), 'max': rounded(high), 'size': rounded(box_size)},
    'height': round(float(box_size[2]), 4),
    'materials': len(materials),
    'textures': [{'name': name, 'size': size} for name, size in sorted(textures.items())],
    'armature': {
        'present': bool(armatures),
        'bones': len(bones),
        'hasFingers': bool(finger_bones),
        'fingerBones': len(finger_bones),
        'rootBones': [b.name for b in bones if b.parent is None],
    },
    # Summed over the skinned meshes. None when no mesh has an armature.
    'unweightedVertices': sum(o['unweightedVertices'] for o in skinned) if skinned else None,
    'objects': objects,
    'renders': {'path': os.path.abspath(renders_png), 'layout': [['front', 'right'], ['back', 'threeQuarter']]},
}
with open(out_json, 'w') as fh:
    json.dump(report, fh, indent=2)

# ---- 2x2 render sheet ----
# Workbench is fast and shows the base color textures. Engine names change
# between Blender versions, so try each name until one is accepted.
for engine in ('BLENDER_WORKBENCH', 'BLENDER_EEVEE_NEXT', 'BLENDER_EEVEE'):
    try:
        sc.render.engine = engine
        break
    except TypeError:
        continue
sc.display.shading.light = 'STUDIO'
sc.display.shading.color_type = 'TEXTURE'
sc.display.shading.show_cavity = True
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
center = Vector(((low + high) / 2).tolist())
corners = [Vector((x, y, z)) for x in (low[0], high[0]) for y in (low[1], high[1]) for z in (low[2], high[2])]
diagonal = float(np.linalg.norm(box_size))
cam_data.clip_start = diagonal * 0.01
cam_data.clip_end = diagonal * 10

# Direction from the model center to the camera, in render order.
views = {
    'front': Vector((0, -1, 0)),
    'right': Vector((-1, 0, 0)),
    'back': Vector((0, 1, 0)),
    'threeQuarter': Vector((-1, -1, 0.6)),
}
tile_path = renders_png + '.tile.png'
tiles = {}
for name, direction in views.items():
    direction = direction.normalized()
    cam.location = center + direction * diagonal * 2
    cam.rotation_euler = (-direction).to_track_quat('-Z', 'Y').to_euler()
    # Fit the ortho frame to the bounding box as the camera sees it.
    right = direction.cross(Vector((0, 0, 1))).normalized() if abs(direction.z) < 0.999 else Vector((1, 0, 0))
    up = right.cross(direction).normalized()
    across = max(abs((c - center).dot(right)) for c in corners) * 2
    tall = max(abs((c - center).dot(up)) for c in corners) * 2
    cam_data.ortho_scale = max(across, tall) * 1.1
    sc.render.filepath = tile_path
    bpy.ops.render.render(write_still=True)
    tile = bpy.data.images.load(tile_path, check_existing=False)
    pixels = np.empty(TILE * TILE * 4, dtype=np.float32)
    tile.pixels.foreach_get(pixels)
    tiles[name] = pixels.reshape(TILE, TILE, 4)
    bpy.data.images.remove(tile)
os.remove(tile_path)

# Blender image rows run bottom-up, so the top row of the sheet goes last.
top = np.concatenate([tiles['front'], tiles['right']], axis=1)
bottom = np.concatenate([tiles['back'], tiles['threeQuarter']], axis=1)
sheet = np.concatenate([bottom, top], axis=0)
out = bpy.data.images.new('qa-sheet', TILE * 2, TILE * 2, alpha=True)
out.pixels.foreach_set(sheet.ravel())
out.filepath_raw = renders_png
out.file_format = 'PNG'
out.save()
print('REPORT_OK', os.path.abspath(out_json))
