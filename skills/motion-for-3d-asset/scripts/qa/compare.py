# Render several motion FBX files side by side into one MP4, from an
# elevated 3/4 game camera.
#   blender --background --factory-startup --python compare.py -- <out.mp4> <a.fbx> <b.fbx> ...
# Writes <out.mp4>.json with the identity of each clip, left to right: the
# SHA-256, size, take (action name, frame rate, frames), and display scale.
# The scale is for this render only. The input files stay unchanged.
# All clips need the same frame rate, so that each clip plays at its real speed.
import bpy, sys, json, hashlib, os
from mathutils import Vector

args = sys.argv[sys.argv.index('--') + 1:]
out, files = args[0], args[1:]


def file_identity(path):
    """The path, SHA-256, and size of a file."""
    digest = hashlib.sha256()
    with open(path, 'rb') as stream:
        for block in iter(lambda: stream.read(1 << 20), b''):
            digest.update(block)
    return {'file': os.path.abspath(path), 'sha256': digest.hexdigest(), 'bytes': os.path.getsize(path)}


bpy.ops.wm.read_factory_settings(use_empty=True)
sc = bpy.context.scene
gap = 2.6
# Lay clips out along the camera's screen-horizontal axis on the ground.
view = Vector((0.55, -1.0, 0.75)).normalized()
side = Vector((-view.y, view.x, 0)).normalized()
end = 1
clips = []
for i, path in enumerate(files):
    before = set(bpy.data.objects)
    bpy.ops.import_scene.fbx(filepath=path)
    # The FBX importer sets the scene frame rate to the rate of the file.
    fps = sc.render.fps / sc.render.fps_base
    new = set(bpy.data.objects) - before
    arm = next(o for o in new if o.type == 'ARMATURE')
    for o in new:
        # The provider mesh carries a few loose spheres; keep the skinned body.
        if o.type != 'ARMATURE' and o.parent is not arm:
            o.hide_render = True
        if o.type == 'MESH' and o.name.startswith('qiu'):
            o.hide_render = True
    # Scale every character to the same standing height, so a small mesh
    # (like an imported orc) is as readable as the provider mannequin.
    sc.frame_set(1)
    bpy.context.view_layer.update()
    heads = [(arm.matrix_world @ pb.head).z for pb in arm.pose.bones if pb.name.endswith('Head')]
    feet = [(arm.matrix_world @ pb.head).z for pb in arm.pose.bones if pb.name.endswith(('Foot', 'ToeBase', 'Ankle'))]
    scale = 1.0
    if heads and feet and max(heads) - min(feet) > 0.05:
        scale = 1.6 / (max(heads) - min(feet))
        arm.scale *= scale
    arm.location += side * (i * gap)
    action = arm.animation_data.action
    f0, f1 = (int(round(v)) for v in action.frame_range)
    end = max(end, f1)
    clips.append({**file_identity(path), 'position': i + 1, 'displayScale': round(scale, 4),
                  'take': {'takeName': action.name, 'sourceFps': fps, 'startFrame': f0, 'endFrame': f1}})
# A clip with another frame rate plays too fast or too slow next to the others.
rates = sorted({round(clip['take']['sourceFps'], 3) for clip in clips})
if len(rates) > 1:
    print(f'ERROR: the clips have different frame rates {rates}. Compare clips of one frame rate.')
    sys.exit(2)
sc.frame_start, sc.frame_end = 1, end
sc.render.engine = 'BLENDER_WORKBENCH'
sc.display.shading.light = 'STUDIO'
sc.display.shading.color_type = 'TEXTURE'
sc.display.shading.single_color = (0.62, 0.66, 0.52)
sc.display.shading.show_cavity = True
sc.display.shading.show_shadows = True
world = bpy.data.worlds.new('w'); sc.world = world; world.color = (0.1, 0.1, 0.12)
mid = side * ((len(files) - 1) * gap / 2)
bpy.ops.mesh.primitive_plane_add(size=60, location=(mid.x, mid.y, 0))
mat = bpy.data.materials.new('g'); mat.diffuse_color = (0.28, 0.3, 0.33, 1)
bpy.context.object.data.materials.append(mat)
cam_data = bpy.data.cameras.new('cam'); cam_data.type = 'ORTHO'
cam_data.ortho_scale = max(5.0, len(files) * gap + 1.6)
cam = bpy.data.objects.new('cam', cam_data); sc.collection.objects.link(cam); sc.camera = cam
center = Vector((mid.x, mid.y + 0.4, 0.8))
cam.location = center + view * 20
cam.rotation_euler = (center - cam.location).to_track_quat('-Z', 'Y').to_euler()
sc.render.resolution_x = 360 * len(files)
sc.render.resolution_y = 520
sc.render.image_settings.media_type = 'VIDEO' if hasattr(sc.render.image_settings, 'media_type') else sc.render.image_settings.file_format
sc.render.image_settings.file_format = 'FFMPEG'
sc.render.ffmpeg.format = 'MPEG4'
sc.render.ffmpeg.codec = 'H264'
sc.render.ffmpeg.constant_rate_factor = 'HIGH'
sc.render.filepath = out
bpy.ops.render.render(animation=True)
with open(out + '.json', 'w') as fh:
    json.dump({'video': os.path.abspath(out), 'fps': rates[0], 'frames': [1, end], 'clips': clips}, fh, indent=2)
print('VIDEO_OK', out, 'frames', end)
