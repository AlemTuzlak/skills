# Cut a character turnaround sheet into one square image per view.
# Run it in the live Blender through the Blender MCP (see qa_live.py):
#   qa_live.run(r'<qa-dir>/split-sheet.py', <sheet.png>, <columns>, <outDir>)
# Writes view-1.png ... view-N.png (left to right) into outDir and prints one
# JSON line with the paths and the boxes.
#
# How it works:
# 1. The background color is the median of the four image corners.
# 2. A pixel is part of a character when it differs from the background
#    by more than a tolerance.
# 3. The cut lines go into the widest empty gaps between the characters.
#    An A-pose hand can reach past 1/3 of the sheet width, so plain equal
#    columns can cut a character. When the sheet has too few gaps, the
#    script uses equal columns.
# 4. Each view is cropped to its character, then padded to a square with the
#    background color.
import bpy, sys, os, json
import numpy as np

if not bpy.context.scene.get('qa_live'):
    raise RuntimeError('Run this script with qa_live.run in the live Blender. See SKILL.md.')
args = sys.argv[sys.argv.index('--') + 1:]
if len(args) != 3:
    raise ValueError("usage: qa_live.run(r'<qa-dir>/split-sheet.py', <sheet.png>, <columns>, <outDir>)")
sheet_path, columns, out_dir = args[0], int(args[1]), args[2]
if columns < 1:
    raise ValueError('<columns> must be 1 or more')

# The smallest color difference (0..1, any channel) that counts as character.
MIN_TOLERANCE = 0.08
# A pixel row or column with this many character pixels or fewer is noise.
NOISE_PIXELS = 2
# Empty space around the character, as a part of the longest box side.
MARGIN = 0.05

img = bpy.data.images.load(sheet_path, check_existing=False)
w, h = img.size
px = np.empty(w * h * 4, dtype=np.float32)
img.pixels.foreach_get(px)
bpy.data.images.remove(img)
# Blender stores rows bottom-up: row 0 is the bottom of the image.
px = px.reshape(h, w, 4)

# Background color and tolerance from the four corners.
patch = max(4, min(w, h) // 50)
corners = np.concatenate([
    px[:patch, :patch].reshape(-1, 4), px[:patch, -patch:].reshape(-1, 4),
    px[-patch:, :patch].reshape(-1, 4), px[-patch:, -patch:].reshape(-1, 4),
])
background = np.median(corners, axis=0)
corner_spread = float(np.percentile(np.abs(corners - background).max(axis=1), 99))
tolerance = max(MIN_TOLERANCE, corner_spread * 2)
mask = np.abs(px - background).max(axis=2) > tolerance


def runs(filled):
    """Return (start, end) pairs (end exclusive) of the True runs in a 1D bool array."""
    edges = np.diff(np.concatenate([[0], filled.astype(np.int8), [0]]))
    return [(int(a), int(b)) for a, b in zip(np.flatnonzero(edges == 1), np.flatnonzero(edges == -1))]


# Cut lines: the centers of the widest empty gaps that have a character on both sides.
filled_cols = mask.sum(axis=0) > NOISE_PIXELS
gaps = [(a, b) for a, b in runs(~filled_cols) if a > 0 and b < w]
gaps.sort(key=lambda gap: gap[1] - gap[0], reverse=True)
use_gaps = len(gaps) >= columns - 1
if use_gaps:
    cuts = sorted((a + b) // 2 for a, b in gaps[:columns - 1])
else:
    cuts = [round(w * i / columns) for i in range(1, columns)]
bounds = list(zip([0] + cuts, cuts + [w]))

os.makedirs(out_dir, exist_ok=True)
views = []
for i, (x0, x1) in enumerate(bounds, start=1):
    part = mask[:, x0:x1]
    rows = np.flatnonzero(part.sum(axis=1) > NOISE_PIXELS)
    cols = np.flatnonzero(part.sum(axis=0) > NOISE_PIXELS)
    if rows.size == 0 or cols.size == 0:
        raise ValueError(f'column {i} (x {x0}..{x1}) has no character. Check <columns>.')
    r0, r1 = int(rows[0]), int(rows[-1]) + 1
    c0, c1 = x0 + int(cols[0]), x0 + int(cols[-1]) + 1
    crop = px[r0:r1, c0:c1]
    box_h, box_w = crop.shape[:2]
    side = round(max(box_w, box_h) * (1 + 2 * MARGIN))
    canvas = np.empty((side, side, 4), dtype=np.float32)
    canvas[:] = background
    top, left = (side - box_h) // 2, (side - box_w) // 2
    canvas[top:top + box_h, left:left + box_w] = crop

    path = os.path.join(out_dir, f'view-{i}.png')
    out = bpy.data.images.new(f'view-{i}', side, side, alpha=True)
    out.pixels.foreach_set(canvas.ravel())
    out.filepath_raw = path
    out.file_format = 'PNG'
    out.save()
    bpy.data.images.remove(out)
    # Boxes use the usual image coordinates: y counts down from the top.
    views.append({
        'path': os.path.abspath(path),
        'column': {'x': x0, 'width': x1 - x0},
        'box': {'x': c0, 'y': h - r1, 'width': box_w, 'height': box_h},
        'size': side,
    })

print(json.dumps({
    'sheet': os.path.abspath(sheet_path),
    'sheetSize': [w, h],
    'split': 'gaps' if use_gaps else 'equal',
    'background': [round(float(v), 3) for v in background],
    'tolerance': round(tolerance, 3),
    'views': views,
}))
