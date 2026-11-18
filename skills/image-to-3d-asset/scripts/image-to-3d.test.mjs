// Run: node --test scripts/image-to-3d.test.mjs
import test from 'node:test'
import assert from 'node:assert/strict'
import { countTriangles, parseCli, toImageUrl } from './image-to-3d.mjs'

function glb(json) {
  let text = JSON.stringify(json)
  while (text.length % 4) text += ' '
  const head = Buffer.alloc(20)
  head.writeUInt32LE(0x46546c67, 0)
  head.writeUInt32LE(2, 4)
  head.writeUInt32LE(20 + text.length, 8)
  head.writeUInt32LE(text.length, 12)
  head.writeUInt32LE(0x4e4f534a, 16)
  return Buffer.concat([head, Buffer.from(text)])
}

test('counts triangles from indices, and skips non-triangle primitives', () => {
  const file = glb({
    accessors: [{ count: 30 }, { count: 300 }, { count: 12 }],
    meshes: [
      { primitives: [{ indices: 1, attributes: { POSITION: 0 } }] },
      { primitives: [{ attributes: { POSITION: 2 } }, { mode: 1, indices: 1, attributes: { POSITION: 0 } }] },
    ],
  })
  assert.equal(countTriangles(file), 104)
})

test('rejects a file that is not a GLB', () => {
  assert.throws(() => countTriangles(Buffer.alloc(24)), /Not a GLB/)
})

test('defaults to Smart Topology with 10000 triangles and PBR', () => {
  assert.deepEqual(parseCli(['orc.png']), { images: ['orc.png'], out: undefined, model: 'smart', polycount: 10000, pbr: true })
})

test('rejects an unknown model, a bad polycount, and no images', () => {
  assert.throws(() => parseCli(['a.png', '--model', 'nope']), /--model/)
  assert.throws(() => parseCli(['a.png', '--polycount', '10k']), /--polycount/)
  assert.throws(() => parseCli([]), /at least one image/)
})

test('passes URLs through and rejects unknown image types', () => {
  assert.equal(toImageUrl('https://x/a.png'), 'https://x/a.png')
  assert.throws(() => toImageUrl('a.gif'), /\.png/)
})
