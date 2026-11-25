# Run a QA script inside the live Blender (the Blender window with a UI),
# through the Blender MCP tool execute_blender_code:
#
#   import sys; sys.path.insert(0, r'<qa-dir>'); import qa_live
#   qa_live.run(r'<qa-dir>/analyze.py', r'C:/out/orc_idle.fbx', r'C:/out/orc_idle.qa.json', r'C:/out/orc_idle.qa.png')
#
# Save the open file before the first run.
# run() gives the script a new empty scene. After the script, it removes that
# scene and every data-block that the run made, also when the script fails.
# The open file, its scenes, and the Blender settings stay as they were.
# run() never opens a file, resets Blender, or quits Blender.
# The image-to-3d-asset and motion-for-3d-asset skills have the same copy of
# this file. Python imports only one of them, so give run() the full path of
# the script.
import os
import runpy
import sys

import bpy

# The kinds of data that an import or a render can add.
DATA = ('scenes', 'objects', 'meshes', 'armatures', 'materials', 'images', 'actions',
        'cameras', 'lights', 'worlds', 'collections', 'node_groups', 'textures', 'curves')


def run(script, *args):
    """Run script with sys.argv = ['blender', '--', *args] in a new empty scene, then remove what the run made."""
    if bpy.app.background:
        raise RuntimeError('This Blender has no UI. Run the QA in the live Blender through the Blender MCP.')
    window = bpy.context.window or next(iter(bpy.context.window_manager.windows), None)
    if window is None:
        raise RuntimeError('Blender has no window. Start Blender with a UI, then run the QA again.')
    active = window.view_layer.objects.active
    if active is not None and active.mode != 'OBJECT':
        raise RuntimeError(f'{active.name} is in {active.mode} mode. Switch to Object mode, then run the QA again.')
    before = {name: set(getattr(bpy.data, name)) for name in DATA}
    saved_argv, saved_scene = sys.argv, window.scene
    scene = bpy.data.scenes.new('qa')
    # The QA scripts refuse to run in a scene without this mark.
    scene['qa_live'] = True
    window.scene = scene
    sys.argv = ['blender', '--', *(str(arg) for arg in args)]
    try:
        with bpy.context.temp_override(window=window):
            runpy.run_path(os.path.abspath(script), run_name='__main__')
    finally:
        sys.argv = saved_argv
        window.scene = saved_scene
        made = [block for name in DATA for block in getattr(bpy.data, name) if block not in before[name]]
        bpy.data.batch_remove(made)
