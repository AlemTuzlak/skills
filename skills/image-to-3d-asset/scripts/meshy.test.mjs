// Run: node --test scripts/meshy.test.mjs
// No network. No Meshy calls.
import test, { after } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import {
  countTriangles,
  meshOptions,
  parseCli,
  parseOpt,
  planDownloads,
  readManifest,
  readMotionClips,
  rigOptions,
  toImageUrl,
  writeManifest,
} from './meshy.mjs'

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

const tempDirs = []
function tempDir() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'meshy-test-'))
  tempDirs.push(dir)
  return dir
}
after(() => {
  for (const dir of tempDirs) fs.rmSync(dir, { recursive: true, force: true })
})

const CHARACTER = {
  enable_pbr: true,
  remove_lighting: true,
  pose_mode: 'a-pose',
  topology: 'triangle',
  target_polycount: 60000,
  should_remesh: true,
  texture_resolution: '4k',
  save_pre_remeshed_model: true,
  multi_view_thumbnails: true,
}

const clipsText = (clips) => JSON.stringify(clips)
const PROMPT = 'A heavy two-handed sword slash from the right shoulder'

// countTriangles

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

// toImageUrl

test('turns a local PNG and a local WebP into data URLs', () => {
  const dir = tempDir()
  const png = path.join(dir, 'front.png')
  const webp = path.join(dir, 'side.WEBP')
  fs.writeFileSync(png, Buffer.from('abc'))
  fs.writeFileSync(webp, Buffer.from('abc'))
  assert.equal(toImageUrl(png), 'data:image/png;base64,YWJj')
  assert.equal(toImageUrl(webp), 'data:image/webp;base64,YWJj')
})

test('passes URLs through and rejects a GIF', () => {
  assert.equal(toImageUrl('https://x/a.png'), 'https://x/a.png')
  assert.equal(toImageUrl('data:image/png;base64,AA'), 'data:image/png;base64,AA')
  assert.throws(() => toImageUrl('a.gif'), /\.webp/)
})

// parseCli

test('mesh defaults to character mode in the current folder', () => {
  assert.deepEqual(parseCli(['mesh', 'front.png', 'side.png']), {
    command: 'mesh',
    out: '.',
    opt: {},
    images: ['front.png', 'side.png'],
    mode: 'character',
    name: undefined,
    polycount: undefined,
    pose: undefined,
  })
})

test('mesh reads mode, name, polycount, pose, out, and repeated --opt', () => {
  const cli = parseCli([
    'mesh', 'chest.png', '--mode', 'prop', '--name', 'chest', '--polycount', '5000', '--pose', 'none',
    '--out', 'build', '--opt', 'texture_prompt=old oak', '--opt', 'should_remesh=false',
  ])
  assert.equal(cli.mode, 'prop')
  assert.equal(cli.name, 'chest')
  assert.equal(cli.polycount, 5000)
  assert.equal(cli.pose, 'none')
  assert.equal(cli.out, 'build')
  assert.deepEqual(cli.opt, { texture_prompt: 'old oak', should_remesh: false })
})

test('mesh rejects no images, a bad mode, a bad pose, and a bad polycount', () => {
  assert.throws(() => parseCli(['mesh']), /at least one image/)
  assert.throws(() => parseCli(['mesh', 'a.png', '--mode', 'car']), /--mode/)
  assert.throws(() => parseCli(['mesh', 'a.png', '--pose', 'sit']), /--pose/)
  assert.throws(() => parseCli(['mesh', 'a.png', '--polycount', '10k']), /--polycount/)
  assert.throws(() => parseCli(['mesh', 'a.png', '--polycount', '50']), /--polycount/)
})

test('rig keeps the defaults unset, so rigOptions picks them', () => {
  assert.deepEqual(parseCli(['rig']), {
    command: 'rig',
    out: '.',
    opt: {},
    task: undefined,
    quadruped: false,
    height: undefined,
    skeleton: undefined,
    fingers: true,
  })
})

test('rig reads height, skeleton, no-fingers, and task', () => {
  const cli = parseCli(['rig', '--height', '2.1', '--skeleton', 'ue5_mannequin', '--no-fingers', '--task', 't-1'])
  assert.equal(cli.height, 2.1)
  assert.equal(cli.skeleton, 'ue5_mannequin')
  assert.equal(cli.fingers, false)
  assert.equal(cli.task, 't-1')
})

test('rig rejects a bad height, an unknown skeleton, and a skeleton on a quadruped', () => {
  assert.throws(() => parseCli(['rig', '--height', '-1']), /--height/)
  assert.throws(() => parseCli(['rig', '--skeleton', 'bones']), /--skeleton/)
  assert.throws(() => parseCli(['rig', '--quadruped', '--skeleton', 'mixamo']), /biped rig only/)
})

test('actions reads an optional category', () => {
  assert.deepEqual(parseCli(['actions', '--category', 'WalkAndRun']), { command: 'actions', out: '.', opt: {}, category: 'WalkAndRun' })
  assert.equal(parseCli(['actions']).category, undefined)
})

test('animate reads 1 to 10 action ids', () => {
  assert.deepEqual(parseCli(['animate', '--actions', '0, 12,30']).actions, [0, 12, 30])
})

test('animate rejects no ids, bad ids, repeated ids, and more than 10 ids', () => {
  assert.throws(() => parseCli(['animate']), /needs --actions/)
  assert.throws(() => parseCli(['animate', '--actions', '1,walk']), /whole numbers/)
  assert.throws(() => parseCli(['animate', '--actions', '1,1']), /same id/)
  assert.throws(() => parseCli(['animate', '--actions', '0,1,2,3,4,5,6,7,8,9,10']), /1 to 10/)
})

test('motion needs exactly one clips file', () => {
  assert.equal(parseCli(['motion', 'clips.json']).clipsFile, 'clips.json')
  assert.throws(() => parseCli(['motion']), /one clips JSON file/)
  assert.throws(() => parseCli(['motion', 'a.json', 'b.json']), /one clips JSON file/)
})

test('balance takes no flags', () => {
  assert.deepEqual(parseCli(['balance']), { command: 'balance', out: '.', opt: {} })
  assert.throws(() => parseCli(['balance', '--out', 'x']), /Unknown option/)
})

test('rejects a missing command, an unknown command, and a flag of another command', () => {
  assert.throws(() => parseCli([]), /Give a command/)
  assert.throws(() => parseCli(['paint']), /Unknown command "paint"/)
  assert.throws(() => parseCli(['rig', '--mode', 'prop']), /Unknown option/)
})

test('--opt parses JSON values and keeps other text as a string', () => {
  assert.deepEqual(parseOpt('target_polycount=5000'), ['target_polycount', 5000])
  assert.deepEqual(parseOpt('target_formats=["glb","fbx"]'), ['target_formats', ['glb', 'fbx']])
  assert.deepEqual(parseOpt('texture_prompt=a=b'), ['texture_prompt', 'a=b'])
  assert.throws(() => parseOpt('novalue'), /key=value/)
  assert.throws(() => parseOpt('=1'), /key=value/)
})

// meshOptions

test('character with 1 image uses image-to-3d, meshy-7.1, and 4k geometry', () => {
  assert.deepEqual(meshOptions('character', 1), {
    endpoint: 'image-to-3d',
    aiModel: 'meshy-7.1',
    modelOptions: { ...CHARACTER, geometry_resolution: '4k' },
  })
})

test('character with 2 to 4 images uses multi-image-to-3d and 2k geometry', () => {
  for (const count of [2, 4]) {
    assert.deepEqual(meshOptions('character', count), {
      endpoint: 'multi-image-to-3d',
      aiModel: 'meshy-7.1',
      modelOptions: { ...CHARACTER, geometry_resolution: '2k' },
    })
  }
})

test('prop uses Smart Topology with 10000 triangles and 2k textures', () => {
  assert.deepEqual(meshOptions('prop', 1), {
    endpoint: 'image-to-3d',
    aiModel: 'meshy-t2.5',
    modelOptions: { enable_pbr: true, remove_lighting: true, topology: 'triangle', target_polycount: 10000, texture_resolution: '2k' },
  })
})

test('polycount and pose override the preset', () => {
  const { modelOptions } = meshOptions('character', 3, { polycount: 50000, pose: 't-pose' })
  assert.equal(modelOptions.target_polycount, 50000)
  assert.equal(modelOptions.pose_mode, 't-pose')
})

test('pose none removes pose_mode', () => {
  assert.equal('pose_mode' in meshOptions('character', 1, { pose: 'none' }).modelOptions, false)
})

test('--opt wins over the preset and over --polycount', () => {
  const { modelOptions } = meshOptions('prop', 1, { polycount: 5000, opt: { target_polycount: 8000, topology: 'quad' } })
  assert.equal(modelOptions.target_polycount, 8000)
  assert.equal(modelOptions.topology, 'quad')
})

test('rejects 0 images, more than 4 images, and a prop with 2 images', () => {
  assert.throws(() => meshOptions('character', 0), /at least one image/)
  assert.throws(() => meshOptions('character', 5), /1 to 4 images/)
  assert.throws(() => meshOptions('prop', 2), /Prop mode takes 1 image/)
})

// rigOptions

test('a biped rig defaults to 1.8 m, the Mixamo skeleton, and fingers', () => {
  assert.deepEqual(rigOptions(parseCli(['rig']), 'triangle'), {
    animation_type: 'biped',
    height_meters: 1.8,
    skeleton_template: 'mixamo',
    include_fingers: true,
  })
})

test('a quadruped rig sends no skeleton and no fingers, and a height only when given', () => {
  assert.deepEqual(rigOptions(parseCli(['rig', '--quadruped']), 'quad'), { animation_type: 'quadruped' })
  assert.deepEqual(rigOptions(parseCli(['rig', '--quadruped', '--height', '0.9']), 'quad'), { animation_type: 'quadruped', height_meters: 0.9 })
})

test('rejects finger bones on a quad mesh, before any credit is spent', () => {
  assert.throws(() => rigOptions(parseCli(['rig']), 'quad'), /--no-fingers/)
  assert.equal(rigOptions(parseCli(['rig', '--no-fingers']), 'quad').include_fingers, false)
  assert.equal(rigOptions(parseCli(['rig']), undefined).include_fingers, true)
})

// readMotionClips

test('reads clips and sets 4 seconds when seconds is missing', () => {
  const clips = readMotionClips(clipsText([{ name: 'slash_1', prompt: `  ${PROMPT}  ` }, { name: 'hit-heavy', prompt: PROMPT, seconds: 2.5 }]))
  assert.deepEqual(clips, [
    { name: 'slash_1', prompt: PROMPT, seconds: 4 },
    { name: 'hit-heavy', prompt: PROMPT, seconds: 2.5 },
  ])
})

test('rejects text that is not JSON, and an empty list', () => {
  assert.throws(() => readMotionClips('[{'), /not valid JSON/)
  assert.throws(() => readMotionClips('[]'), /at least one clip/)
  assert.throws(() => readMotionClips('{}'), /at least one clip/)
})

test('rejects a clip name with spaces, and a name used two times', () => {
  assert.throws(() => readMotionClips(clipsText([{ name: 'big slash', prompt: PROMPT }])), /letters, digits/)
  assert.throws(() => readMotionClips(clipsText([{ name: 'a', prompt: PROMPT }, { name: 'a', prompt: PROMPT }])), /used two times/)
})

test('rejects a prompt under 20 or over 400 characters', () => {
  assert.throws(() => readMotionClips(clipsText([{ name: 'a', prompt: 'swing' }])), /20 to 400/)
  assert.throws(() => readMotionClips(clipsText([{ name: 'a', prompt: 'x'.repeat(401) }])), /20 to 400/)
})

test('rejects seconds outside 2 to 10 and seconds that are not a 0.5 step', () => {
  for (const seconds of [1.5, 10.5, 3.2, '4']) {
    assert.throws(() => readMotionClips(clipsText([{ name: 'a', prompt: PROMPT, seconds }])), /steps of 0\.5/)
  }
})

// planDownloads

const url = (name) => `https://assets.meshy.ai/task/${name}?Expires=1`

test('names the mesh, the pre-remesh model, the FBX, the textures, and the preview', () => {
  const plan = planDownloads(
    {
      url: url('model.glb'),
      format: 'glb',
      previewImageUrl: url('preview.png'),
      files: [
        { url: url('model.glb'), role: 'base', format: 'glb' },
        { url: url('model.fbx'), role: 'base', format: 'fbx' },
        { url: url('pre.glb'), role: 'base', format: 'glb' },
        { url: url('texture_0.png'), role: 'texture' },
        { url: url('texture_0_normal.png'), role: 'texture' },
      ],
    },
    'samurai',
  )
  assert.deepEqual(
    plan.map((item) => [item.file, item.main]),
    [
      ['samurai.glb', true],
      ['samurai.fbx', false],
      ['samurai.pre-remesh.glb', false],
      ['samurai.tex-texture_0.png', false],
      ['samurai.tex-texture_0_normal.png', false],
      ['samurai.thumb-preview.png', false],
    ],
  )
})

test('names the rigged GLB and FBX, and the basic walk and run clips', () => {
  const plan = planDownloads(
    {
      url: url('rigged.glb'),
      format: 'glb',
      files: [
        { url: url('rigged.glb'), role: 'rigged', format: 'glb' },
        { url: url('rigged.fbx'), role: 'rigged', format: 'fbx' },
        { url: url('Walking.glb'), role: 'animation', format: 'glb' },
        { url: url('Running.fbx'), role: 'animation', format: 'fbx' },
      ],
    },
    'samurai.rig',
  )
  assert.deepEqual(plan.map((item) => item.file), [
    'samurai.rig.glb',
    'samurai.rig.fbx',
    'samurai.rig.basic-Walking.glb',
    'samurai.rig.basic-Running.fbx',
  ])
})

test('names an animation clip GLB and FBX after the clip, and keeps extra files apart', () => {
  const plan = planDownloads(
    {
      url: url('anim.glb'),
      format: 'glb',
      files: [
        { url: url('anim.glb'), role: 'animation', format: 'glb' },
        { url: url('anim.fbx'), role: 'animation', format: 'fbx' },
        { url: url('fps.fbx'), role: 'animation', format: 'fbx' },
      ],
    },
    'slash',
  )
  assert.deepEqual(plan.map((item) => item.file), ['slash.glb', 'slash.fbx', 'slash.anim-fps.fbx'])
})

test('adds -2 when two files want the same name', () => {
  const plan = planDownloads(
    {
      url: url('a/model.glb'),
      format: 'glb',
      files: [
        { url: url('a/model.glb'), role: 'base', format: 'glb' },
        { url: url('a/texture.png'), role: 'texture' },
        { url: url('b/texture.png'), role: 'texture' },
      ],
    },
    'orc',
  )
  assert.deepEqual(plan.map((item) => item.file), ['orc.glb', 'orc.tex-texture.png', 'orc.tex-texture-2.png'])
})

// manifest

test('the manifest starts empty and merges each write', () => {
  const dir = tempDir()
  assert.deepEqual(readManifest(dir), {})
  writeManifest(dir, { name: 'orc', meshTaskId: 'm-1' })
  writeManifest(dir, { rigTaskId: 'r-1' })
  assert.deepEqual(readManifest(dir), { name: 'orc', meshTaskId: 'm-1', rigTaskId: 'r-1' })
})

test('remesh defaults to 60000 triangles, and checks its flags', () => {
  const cli = parseCli(['remesh'])
  assert.equal(cli.polycount, 60000)
  assert.equal(cli.topology, 'triangle')
  assert.equal(parseCli(['remesh', '--polycount', '20000', '--topology', 'quad']).topology, 'quad')
  assert.throws(() => parseCli(['remesh', '--topology', 'ngon']), /--topology/)
  assert.throws(() => parseCli(['remesh', '--polycount', '50']), /--polycount/)
  assert.throws(() => parseCli(['remesh', 'a.glb']), /no file arguments/)
})
