// Run: node --test scripts/meshy.test.mjs
// No network. No Meshy calls.
import test, { after } from 'node:test'
import assert from 'node:assert/strict'
import crypto from 'node:crypto'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import {
  checkNewTakes,
  countTriangles,
  download,
  isQueueFull,
  meshOptions,
  parseCli,
  parseOpt,
  planDownloads,
  readManifest,
  readMotionClips,
  rigOptions,
  saveResult,
  stepParent,
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
  target_polycount: 300000,
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
    modelOptions: { enable_pbr: true, topology: 'triangle', target_polycount: 10000, texture_resolution: '2k' },
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

test('the prop preset leaves out remove_lighting, which Smart Topology refuses', () => {
  assert.equal('remove_lighting' in meshOptions('prop', 1).modelOptions, false)
})

test('isQueueFull matches the Meshy 429 queue error and nothing else', () => {
  assert.equal(isQueueFull(new Error('Meshy request failed (429): NoMorePendingTasks: Upgrade your plan')), true)
  assert.equal(isQueueFull(new Error('Meshy request failed (400): remove_lighting is not supported')), false)
})

// provider files: a download never replaces an earlier file, and each file keeps its hash

const sha = (text) => crypto.createHash('sha256').update(text).digest('hex')
const dataUrl = (text) => `data:application/octet-stream;base64,${Buffer.from(text).toString('base64')}`

test('download writes a new file and never writes over a file that exists', async () => {
  const file = path.join(tempDir(), 'orc.glb')
  assert.equal((await download(dataUrl('first'), file)).toString(), 'first')
  await assert.rejects(download(dataUrl('second'), file), /EEXIST/)
  assert.equal(fs.readFileSync(file, 'utf8'), 'first')
})

test('planDownloads gives a free name when the folder already has a file of that name', () => {
  const result = { url: url('model.glb'), format: 'glb', files: [{ url: url('model.glb'), role: 'base', format: 'glb' }] }
  assert.deepEqual(planDownloads(result, 'orc', new Set(['orc.glb', 'orc-2.glb'])).map((item) => item.file), ['orc-3.glb'])
})

test('saveResult keeps an earlier file in any letter case, and records the path, role, hash, and size', async () => {
  const dir = tempDir()
  fs.writeFileSync(path.join(dir, 'Orc.GLB'), 'earlier')
  const mesh = dataUrl('new mesh')
  const { saved, main } = await saveResult({ url: mesh, format: 'glb', files: [{ url: mesh, role: 'base', format: 'glb' }] }, 'orc', dir)
  assert.equal(main.toString(), 'new mesh')
  assert.deepEqual(saved, [{ path: 'orc-2.glb', role: 'base', sha256: sha('new mesh'), bytes: 8 }])
  assert.equal(fs.readFileSync(path.join(dir, 'Orc.GLB'), 'utf8'), 'earlier')
})

// lineage: one folder holds one mesh and the tasks made from it

const MESH = { name: 'orc', meshTaskId: 'm-1', mesh: { taskId: 'm-1' } }
const REMESH = { remeshTaskId: 'r-1', remesh: { taskId: 'r-1', meshTaskId: 'm-1' } }
const RIG = { rigTaskId: 'g-1', rig: { taskId: 'g-1', meshTaskId: 'r-1' } }
const FOLDER = { ...MESH, ...REMESH, ...RIG }
const parent = (argv, manifest) => stepParent(manifest, parseCli([...argv, '--out', 'orc']))

test('each step takes its parent from the folder: the rig prefers the remesh, and clips use the rig', () => {
  assert.equal(parent(['remesh'], MESH), 'm-1')
  assert.equal(parent(['rig'], MESH), 'm-1')
  assert.equal(parent(['rig'], { ...MESH, ...REMESH }), 'r-1')
  assert.equal(parent(['animate', '--actions', '0'], FOLDER), 'g-1')
  assert.equal(parent(['motion', 'clips.json'], FOLDER), 'g-1')
})

test('a new folder takes the parent from --task, and asks for it when it is missing', () => {
  assert.equal(parent(['mesh', 'a.png'], {}), undefined)
  assert.equal(parent(['remesh', '--task', 'm-9'], {}), 'm-9')
  assert.throws(() => parent(['rig'], {}), /No meshTaskId in orc.manifest\.json/)
  assert.throws(() => parent(['animate', '--actions', '0'], {}), /No rigTaskId/)
})

test('a step never replaces an earlier task of its folder', () => {
  assert.throws(() => parent(['mesh', 'a.png'], MESH), /already exists\. A new mesh starts a new generation/)
  assert.throws(() => parent(['remesh'], { ...MESH, ...REMESH }), /already has remesh task r-1/)
  assert.throws(() => parent(['remesh'], { ...MESH, rigTaskId: 'g-1', rig: { taskId: 'g-1', meshTaskId: 'm-1' } }), /cannot be the parent of that rig/)
  assert.throws(() => parent(['rig'], FOLDER), /already has rig task g-1/)
})

test('rejects a stale remesh, a stale rig, and clips of another rig, before any credit is spent', () => {
  // An older script let a second mesh replace meshTaskId and kept the tasks of the first mesh.
  const newMesh = { ...MESH, meshTaskId: 'm-2', mesh: { taskId: 'm-2' } }
  assert.throws(() => parent(['rig'], { ...newMesh, ...REMESH }), /Stale remesh: remesh task r-1 comes from mesh task m-1, but this folder holds mesh task m-2/)
  assert.throws(() => parent(['motion', 'clips.json'], { ...newMesh, rigTaskId: 'g-1', rig: { taskId: 'g-1', meshTaskId: 'm-1' } }), /Stale rig: rig task g-1/)
  const mixed = { ...FOLDER, clips: { slash: { motionTaskId: 't-0', rigTaskId: 'g-0' } } }
  assert.throws(() => parent(['animate', '--actions', '0'], mixed), /Mixed takes: clip slash uses rig task g-0/)
})

test('--task must name a task of the folder, so one folder never mixes two generations', () => {
  assert.equal(parent(['rig', '--task', 'm-1'], { ...MESH, ...REMESH }), 'm-1')
  assert.throws(() => parent(['rig', '--task', 'm-7'], { ...MESH, ...REMESH }), /--task m-7 is not a mesh task of orc/)
  assert.throws(() => parent(['motion', 'clips.json', '--task', 'g-7'], FOLDER), /--task g-7 is not a rig task of orc/)
  const clipsOnly = { clips: { slash: { motionTaskId: 't-1', rigTaskId: 'g-5' } } }
  assert.equal(parent(['motion', 'clips.json'], clipsOnly), 'g-5')
  assert.throws(() => parent(['animate', '--actions', '0', '--task', 'g-6'], clipsOnly), /--task g-6/)
})

test('a take keeps its name: a clip name or a library id list that is in the folder is refused', () => {
  const folder = {
    ...FOLDER,
    animations: [{ taskId: 'a-1', rigTaskId: 'g-1', clips: [{ id: 0, name: 'Idle' }, { id: 21, name: 'Walk' }] }],
    clips: { slash: { motionTaskId: 't-1', rigTaskId: 'g-1' } },
  }
  assert.throws(() => checkNewTakes(folder, { names: ['slash'] }), /Clip slash already has a take \(motion task t-1\).*slash_2/)
  assert.throws(() => checkNewTakes(folder, { actions: [0, 21] }), /animation task a-1/)
  assert.doesNotThrow(() => checkNewTakes(folder, { names: ['slash_2'], actions: [0] }))
})
