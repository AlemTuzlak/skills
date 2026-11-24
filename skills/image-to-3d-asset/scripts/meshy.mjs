#!/usr/bin/env node
// Turns concept art into a game-ready 3D character or prop with Meshy:
// mesh, rig, library animations, and text-to-motion clips.
// It calls Meshy through TanStack AI (generate3DModel, generateMotion) and the Meshy adapter.
// Node 20+. Run `npm install` in this folder once. The adapter reads the key from the MESHY_API_KEY env var.
// Each step writes its Meshy task id, its parent task id, and the SHA-256 of each file to <out>/manifest.json,
// so the next step can run later. Meshy deletes task files after 3 days, so each step downloads its files at once.
// One <out> folder holds one mesh and the tasks made from it. A step never writes over a downloaded file or an
// earlier task. Before it spends credits, it stops on a stale parent or on a task of another folder.
import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { parseArgs } from 'node:util'
import { pathToFileURL } from 'node:url'
import { generate3DModel, generateMotion, getMotionJobStatus } from '@tanstack/ai'
import { getMeshyBalance, listMeshyAnimations, meshy3DModel, meshyMotion } from '@tanstack/ai-meshy'

const MIME = { '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp' }
const POLL_MS = 5_000
// At this limit TanStack AI stops the wait. Meshy still finishes (and bills) a running task.
const TIMEOUT_MS = 30 * 60_000
const MOTION_TIMEOUT_MS = 15 * 60_000
const MOTION_JOBS_AT_ONCE = 4
const MAX_ACTIONS = 10
const MANIFEST = 'manifest.json'

const POSES = ['a-pose', 't-pose', 'none']
const SKELETONS = [
  'meshyrig',
  'mixamo',
  'ue5_mannequin',
  'max_biped',
  'unity_humanoid',
  'maya_human_ik',
  'blender_rigify_basic_human',
  'cc5_hd_neutral_base',
  'daz_genesis9',
]

export const USAGE = `Usage: node meshy.mjs <command> [flags]
  balance
  mesh <image> [<image> ...] [--mode character|prop] [--name <name>] [--polycount <n>] [--pose a-pose|t-pose|none] [--out <dir>] [--opt key=value]
  remesh [--polycount <n>] [--topology triangle|quad] [--task <meshTaskId>] [--out <dir>] [--opt key=value]
  rig [--height <m>] [--skeleton <template>] [--no-fingers] [--quadruped] [--task <meshTaskId>] [--out <dir>] [--opt key=value]
  actions [--category <category>]
  animate --actions <id,id,...> [--task <rigTaskId>] [--out <dir>] [--opt key=value]
  motion <clips.json> [--task <rigTaskId>] [--out <dir>] [--opt key=value]`

// The flags of each command. --out and --opt go to every command that calls a paid Meshy step.
const SHARED = {
  out: { type: 'string' },
  opt: { type: 'string', multiple: true },
}
const TASK = { task: { type: 'string' } }
const COMMANDS = {
  balance: {},
  mesh: {
    ...SHARED,
    mode: { type: 'string', default: 'character' },
    name: { type: 'string' },
    polycount: { type: 'string' },
    pose: { type: 'string' },
  },
  remesh: { ...SHARED, ...TASK, polycount: { type: 'string' }, topology: { type: 'string' } },
  rig: {
    ...SHARED,
    ...TASK,
    height: { type: 'string' },
    skeleton: { type: 'string' },
    'no-fingers': { type: 'boolean', default: false },
    quadruped: { type: 'boolean', default: false },
  },
  actions: { category: { type: 'string' } },
  animate: { ...SHARED, ...TASK, actions: { type: 'string' } },
  motion: { ...SHARED, ...TASK },
}

/** Parses one `--opt key=value`. The value is JSON when it parses as JSON, else a string. */
export function parseOpt(text) {
  const at = text.indexOf('=')
  if (at < 1) throw new Error(`--opt ${text}: use the form key=value, for example --opt texture_prompt="red armor".`)
  const value = text.slice(at + 1)
  try {
    return [text.slice(0, at), JSON.parse(value)]
  } catch {
    return [text.slice(0, at), value]
  }
}

function parsePolycount(text) {
  const polycount = Number(text)
  const isValid = Number.isInteger(polycount) && polycount >= 100 && polycount <= 300_000
  if (!isValid) throw new Error('--polycount must be a whole number from 100 to 300000.')
  return polycount
}

function parseHeight(text) {
  const height = Number(text)
  if (!Number.isFinite(height) || height <= 0) throw new Error('--height must be a number of meters above 0, for example 1.8.')
  return height
}

function parseActions(text) {
  if (text === undefined) throw new Error('animate needs --actions, for example --actions 0,12,30. Run the actions command to see the ids.')
  const ids = text.split(',').map((part) => Number(part.trim()))
  const isValid = ids.every((id) => Number.isInteger(id) && id >= 0)
  if (!isValid) throw new Error('--actions must be whole numbers with commas between them, for example 0,12,30.')
  if (ids.length > MAX_ACTIONS) throw new Error(`--actions takes 1 to ${MAX_ACTIONS} ids. You gave ${ids.length}.`)
  if (new Set(ids).size !== ids.length) throw new Error('--actions has the same id more than one time.')
  return ids
}

function commandFlags(command, values, positionals) {
  switch (command) {
    case 'balance':
    case 'actions':
      if (positionals.length > 0) throw new Error(`${command} takes no file arguments.`)
      return command === 'actions' ? { category: values.category } : {}
    case 'mesh': {
      if (positionals.length === 0) throw new Error('mesh needs at least one image path or URL.')
      if (!['character', 'prop'].includes(values.mode)) throw new Error('--mode must be character or prop.')
      if (values.pose !== undefined && !POSES.includes(values.pose)) throw new Error(`--pose must be one of: ${POSES.join(', ')}.`)
      return {
        images: positionals,
        mode: values.mode,
        name: values.name,
        polycount: values.polycount === undefined ? undefined : parsePolycount(values.polycount),
        pose: values.pose,
      }
    }
    case 'remesh': {
      if (positionals.length > 0) throw new Error('remesh takes no file arguments. It reads the mesh task id from the manifest.')
      const topology = values.topology ?? 'triangle'
      if (!['triangle', 'quad'].includes(topology)) throw new Error('--topology must be triangle or quad.')
      return { task: values.task, polycount: parsePolycount(values.polycount ?? '60000'), topology }
    }
    case 'rig': {
      if (positionals.length > 0) throw new Error('rig takes no file arguments. It reads the mesh task id from the manifest.')
      if (values.skeleton !== undefined && !SKELETONS.includes(values.skeleton)) {
        throw new Error(`--skeleton must be one of: ${SKELETONS.join(', ')}.`)
      }
      if (values.quadruped && values.skeleton !== undefined) throw new Error('--skeleton is for a biped rig only. Remove it, or remove --quadruped.')
      return {
        task: values.task,
        quadruped: values.quadruped,
        height: values.height === undefined ? undefined : parseHeight(values.height),
        skeleton: values.skeleton,
        fingers: !values['no-fingers'],
      }
    }
    case 'animate':
      if (positionals.length > 0) throw new Error('animate takes no file arguments. Give the ids with --actions.')
      return { task: values.task, actions: parseActions(values.actions) }
    case 'motion':
      if (positionals.length !== 1) throw new Error('motion needs one clips JSON file, for example: motion clips.json')
      return { task: values.task, clipsFile: positionals[0] }
    default:
      throw new Error(`Unknown command ${command}.`)
  }
}

/**
 * Reads the command line. Returns `{ command, out, opt, ...flags of the command }`.
 * Throws an Error with a clear message for a bad command or flag.
 */
export function parseCli(argv) {
  const [command, ...rest] = argv
  const options = COMMANDS[command]
  if (!options) throw new Error(command ? `Unknown command "${command}".` : 'Give a command.')
  const { values, positionals } = parseArgs({ args: rest, allowPositionals: true, strict: true, options })
  const opt = Object.fromEntries((values.opt ?? []).map(parseOpt))
  return { command, out: values.out ?? '.', opt, ...commandFlags(command, values, positionals) }
}

const SHARED_QUALITY = { enable_pbr: true, remove_lighting: true }
const CHARACTER = {
  ...SHARED_QUALITY,
  pose_mode: 'a-pose',
  // Triangles, because Meshy cannot add finger bones to a quad mesh.
  topology: 'triangle',
  // 300000 is the highest target_polycount that Meshy accepts. It gives the most detail for close-up screens.
  // It is also below the rig limit of 380000 triangles. Make lower LODs with the remesh command.
  target_polycount: 300_000,
  // Without the remesh step, Meshy ignores target_polycount and returns the raw mesh (2 million triangles at 2k).
  should_remesh: true,
  texture_resolution: '4k',
  save_pre_remeshed_model: true,
  multi_view_thumbnails: true,
}
// Smart Topology (meshy-t2.5) refuses remove_lighting with a 400, so the prop preset leaves it out.
const PROP = { enable_pbr: true, topology: 'triangle', target_polycount: 10_000, texture_resolution: '2k' }

function preset(mode, imageCount) {
  if (imageCount < 1) throw new Error('mesh needs at least one image.')
  if (imageCount > 4) throw new Error(`Meshy takes 1 to 4 images. You gave ${imageCount}.`)
  if (mode === 'prop') {
    if (imageCount > 1) throw new Error(`Prop mode takes 1 image. You gave ${imageCount}. Use --mode character for 2 to 4 views.`)
    return { endpoint: 'image-to-3d', aiModel: 'meshy-t2.5', modelOptions: PROP }
  }
  if (imageCount === 1) {
    return { endpoint: 'image-to-3d', aiModel: 'meshy-7.1', modelOptions: { ...CHARACTER, geometry_resolution: '4k' } }
  }
  return { endpoint: 'multi-image-to-3d', aiModel: 'meshy-7.1', modelOptions: { ...CHARACTER, geometry_resolution: '2k' } }
}

/**
 * The Meshy endpoint, AI model, and options for a mesh.
 * `overrides.polycount` and `overrides.pose` change the preset. `overrides.opt` wins over all.
 * `pose: 'none'` removes `pose_mode`.
 */
export function meshOptions(mode, imageCount, overrides = {}) {
  const { endpoint, aiModel, modelOptions: base } = preset(mode, imageCount)
  const modelOptions = { ...base }
  if (overrides.polycount !== undefined) modelOptions.target_polycount = overrides.polycount
  if (overrides.pose === 'none') delete modelOptions.pose_mode
  else if (overrides.pose !== undefined) modelOptions.pose_mode = overrides.pose
  return { endpoint, aiModel, modelOptions: { ...modelOptions, ...overrides.opt } }
}

/**
 * The Meshy rigging options. `meshTopology` is the topology of the mesh task, when the manifest has it.
 * Throws when Meshy would reject the options, so no credits are spent on a request that fails.
 */
export function rigOptions(flags, meshTopology) {
  const modelOptions = flags.quadruped
    ? { animation_type: 'quadruped', ...(flags.height === undefined ? {} : { height_meters: flags.height }) }
    : {
        animation_type: 'biped',
        height_meters: flags.height ?? 1.8,
        skeleton_template: flags.skeleton ?? 'mixamo',
        include_fingers: flags.fingers,
      }
  const merged = { ...modelOptions, ...flags.opt }
  const isQuadWithFingers = merged.include_fingers === true && meshTopology === 'quad'
  if (isQuadWithFingers) {
    throw new Error(
      'Meshy cannot add finger bones to a mesh with quad topology. Run rig with --no-fingers, or make the mesh again with --opt topology=triangle.',
    )
  }
  return merged
}

const CLIP_NAME = /^[A-Za-z0-9_-]+$/

/**
 * Reads and checks a clips JSON file: `[{ name, prompt, seconds }]`.
 * `seconds` is 2 to 10 in steps of 0.5, default 4. Returns the clips with `seconds` set.
 */
export function readMotionClips(text) {
  let clips
  try {
    clips = JSON.parse(text)
  } catch (error) {
    throw new Error(`The clips file is not valid JSON: ${error.message}`)
  }
  if (!Array.isArray(clips) || clips.length === 0) throw new Error('The clips file must be a JSON array with at least one clip.')
  const names = new Set()
  return clips.map((clip, index) => {
    const label = `Clip ${index + 1}`
    if (typeof clip !== 'object' || clip === null) throw new Error(`${label} must be an object with name, prompt, and seconds.`)
    const { name, prompt, seconds = 4 } = clip
    if (typeof name !== 'string' || !CLIP_NAME.test(name)) {
      throw new Error(`${label}: name must use only letters, digits, _ and -.`)
    }
    if (names.has(name)) throw new Error(`${label}: the name "${name}" is used two times. Each clip needs its own name.`)
    names.add(name)
    const hasPromptLength = typeof prompt === 'string' && prompt.trim().length >= 20 && prompt.trim().length <= 400
    if (!hasPromptLength) throw new Error(`${label} (${name}): prompt must be 20 to 400 characters.`)
    const isHalfStep = Number.isInteger(seconds * 2)
    const isValidSeconds = typeof seconds === 'number' && seconds >= 2 && seconds <= 10 && isHalfStep
    if (!isValidSeconds) throw new Error(`${label} (${name}): seconds must be 2 to 10, in steps of 0.5.`)
    return { name, prompt: prompt.trim(), seconds }
  })
}

/** Image path or URL to a URL that Meshy accepts. A local file becomes a data: URL. */
export function toImageUrl(image) {
  if (/^(https?|data):/.test(image)) return image
  const mime = MIME[path.extname(image).toLowerCase()]
  if (!mime) throw new Error(`${image}: use a .png, .jpg, .jpeg, or .webp image.`)
  return `data:${mime};base64,${fs.readFileSync(image).toString('base64')}`
}

/** Triangle count of a GLB (triangle-list primitives only). */
export function countTriangles(glb) {
  if (glb.readUInt32LE(0) !== 0x46546c67) throw new Error('Not a GLB file.')
  const json = JSON.parse(glb.subarray(20, 20 + glb.readUInt32LE(12)).toString('utf8'))
  let tris = 0
  for (const mesh of json.meshes ?? []) {
    for (const p of mesh.primitives) {
      if ((p.mode ?? 4) !== 4) continue
      tris += json.accessors[p.indices ?? p.attributes.POSITION].count / 3
    }
  }
  return tris
}

// The file name part of a URL, safe for a file system. Meshy URLs have a signed query, so the query is dropped.
function urlFileName(url, format) {
  const last = decodeURIComponent(new URL(url).pathname.split('/').pop() ?? '')
  const safe = last.replace(/[^A-Za-z0-9._-]/g, '_') || 'file'
  return path.extname(safe) ? safe : `${safe}.${format ?? 'bin'}`
}

// The wanted local name of one result file. `primaryRole` is the role of the main model file.
function wantedName(file, base, primaryRole, taken) {
  const urlName = urlFileName(file.url, file.format)
  const isFirstOfFormat = file.role === primaryRole && file.format !== undefined && !taken.has(`${base}.${file.format}`)
  if (isFirstOfFormat) return `${base}.${file.format}`
  switch (file.role) {
    case 'base':
      return file.format === 'glb' ? `${base}.pre-remesh.glb` : `${base}.${file.format ?? urlName}`
    case 'rigged':
      return `${base}.rigged.${file.format}`
    case 'animation':
      // On a rigging task, the animations are the basic walk and run clips.
      return `${base}.${primaryRole === 'rigged' ? 'basic' : 'anim'}-${urlName}`
    default:
      return `${base}.tex-${urlName}`
  }
}

/**
 * The local file name for each file of a Meshy result. Returns `[{ url, file, role, main }]`.
 * The main model comes first.
 *
 * - The first file of each format with the role of the main model is `<base>.<format>`.
 *   So a mesh is `<base>.glb`, a rig is `<base>.glb` + `<base>.fbx`, and a clip is `<base>.glb` + `<base>.fbx`.
 * - Another GLB of a mesh task is the model before the remesh: `<base>.pre-remesh.glb`.
 * - The walk and run clips of a rigging task are `<base>.basic-<url file name>`.
 * - A texture is `<base>.tex-<url file name>`. The preview image is `<base>.thumb-preview.<ext>`.
 * - A name that is already taken gets `-2`, `-3`, and so on. `existing` holds the lowercase names of the files
 *   that are already in the folder, so a new file never replaces an earlier file.
 */
export function planDownloads(result, base, existing = new Set()) {
  const files = result.files ?? []
  const mainFile = files.find((file) => file.url === result.url) ?? { url: result.url, format: result.format, role: 'base' }
  const others = files.filter((file) => file.url !== result.url)
  const taken = new Set()
  const plan = []
  const add = (file, wanted, role) => {
    const ext = path.extname(wanted)
    const stem = wanted.slice(0, wanted.length - ext.length)
    let unique = wanted
    for (let n = 2; taken.has(unique) || existing.has(unique.toLowerCase()); n++) unique = `${stem}-${n}${ext}`
    taken.add(unique)
    plan.push({ url: file.url, file: unique, role, main: file === mainFile })
  }

  const ordered = [mainFile, ...others]
  for (const file of ordered) add(file, wantedName(file, base, mainFile.role, taken), file.role ?? 'texture')
  if (result.previewImageUrl) {
    const ext = path.extname(urlFileName(result.previewImageUrl, 'png'))
    add({ url: result.previewImageUrl }, `${base}.thumb-preview${ext}`, 'thumbnail')
  }
  return plan
}

/** Downloads a URL to a new file and returns the bytes. It never writes over a file that exists. */
export async function download(url, file) {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Download failed (${res.status}): ${url}`)
  const buf = Buffer.from(await res.arrayBuffer())
  fs.writeFileSync(file, buf, { flag: 'wx' })
  return buf
}

const sha256 = (bytes) => crypto.createHash('sha256').update(bytes).digest('hex')

/**
 * Downloads every planned file into the folder `out`, which must exist. Returns the main file bytes, and `saved`:
 * `[{ path, role, sha256, bytes }]`, with each path relative to `out`. An earlier file in `out` stays unchanged.
 */
export async function saveResult(result, base, out) {
  const existing = new Set(fs.readdirSync(out).map((name) => name.toLowerCase()))
  const saved = []
  let main
  for (const item of planDownloads(result, base, existing)) {
    const bytes = await download(item.url, path.join(out, item.file))
    if (item.main) main = bytes
    saved.push({ path: item.file, role: item.role, sha256: sha256(bytes), bytes: bytes.length })
  }
  return { saved, main }
}

// The paths of saved files, for the JSON line on stdout.
const outPaths = (out, saved) => saved.map((file) => path.join(out, file.path))

/** Reads `<out>/manifest.json`. Returns `{}` when there is no manifest yet. */
export function readManifest(out) {
  const file = path.join(out, MANIFEST)
  if (!fs.existsSync(file)) return {}
  return JSON.parse(fs.readFileSync(file, 'utf8'))
}

/**
 * Merges `patch` into `<out>/manifest.json` and returns the new manifest.
 * It reads and writes with no await between them, so parallel clips do not lose each other's writes.
 */
export function writeManifest(out, patch) {
  const manifest = { ...readManifest(out), ...patch }
  fs.mkdirSync(out, { recursive: true })
  fs.writeFileSync(path.join(out, MANIFEST), JSON.stringify(manifest, null, 2))
  return manifest
}

// The rig of the clips in a folder. A folder of clips made with --task has no rig step, so its first clip names it.
function folderRig(manifest) {
  const takes = [...(manifest.animations ?? []), ...Object.values(manifest.clips ?? {})]
  return manifest.rigTaskId ?? takes[0]?.rigTaskId
}

/**
 * Checks that each task in a manifest descends from the mesh of the folder, and that all clips use one rig.
 * Throws for a stale descendant (a remesh or a rig of an earlier mesh) and for a clip of another rig.
 * An older version of this script let a new mesh or rig replace the old one, so an old folder can fail here.
 */
export function checkLineage(manifest) {
  const { meshTaskId, remesh, rig } = manifest
  if (remesh && meshTaskId && remesh.meshTaskId !== meshTaskId) {
    throw new Error(
      `Stale remesh: remesh task ${remesh.taskId} comes from mesh task ${remesh.meshTaskId}, but this folder holds mesh task ${meshTaskId}. Make the tasks of the new mesh in a new --out.`,
    )
  }
  const parents = [meshTaskId, remesh?.taskId].filter(Boolean)
  if (rig && parents.length > 0 && !parents.includes(rig.meshTaskId)) {
    throw new Error(
      `Stale rig: rig task ${rig.taskId} comes from task ${rig.meshTaskId}, but this folder holds task ${parents.join(' and task ')}. Make the tasks of the new mesh in a new --out.`,
    )
  }
  const rigTaskId = folderRig(manifest)
  const takes = [
    ...(manifest.animations ?? []).map((entry) => [entry.clips.map((clip) => clip.name ?? clip.id).join(', '), entry]),
    ...Object.entries(manifest.clips ?? {}),
  ]
  for (const [name, take] of takes) {
    if (take.rigTaskId !== rigTaskId) {
      throw new Error(
        `Mixed takes: clip ${name} uses rig task ${take.rigTaskId}, but this folder holds rig task ${rigTaskId}. Keep the clips of each rig in their own --out.`,
      )
    }
  }
}

// The parent of a step: --task, or else the first id that the folder holds. When the folder holds a parent,
// --task must name it, so one folder never mixes two generations.
function parentFrom(cli, ids, key, step) {
  const held = ids.filter(Boolean)
  if (cli.task === undefined) {
    if (held.length === 0) throw new Error(`No ${key} in ${path.join(cli.out, MANIFEST)}. Run ${step} first with the same --out, or give --task <id>.`)
    return held[0]
  }
  if (held.length > 0 && !held.includes(cli.task)) {
    throw new Error(`--task ${cli.task} is not a ${step} task of ${cli.out} (${held.join(', ')}). Use a new --out for a task of another generation.`)
  }
  return cli.task
}

/**
 * Checks that the paid step `cli.command` can run in the folder of `manifest`. Returns the id of its parent task
 * (none for mesh). Before any credit is spent, it throws for a step that replaces an earlier task of the folder,
 * uses a stale parent, or brings in a task of another folder.
 */
export function stepParent(manifest, cli) {
  checkLineage(manifest)
  switch (cli.command) {
    case 'mesh':
      if (Object.keys(manifest).length > 0) {
        throw new Error(`${path.join(cli.out, MANIFEST)} already exists. A new mesh starts a new generation: use a new --out. The earlier files stay unchanged.`)
      }
      return undefined
    case 'remesh':
      if (manifest.remesh) throw new Error(`${cli.out} already has remesh task ${manifest.remesh.taskId}. Make each new remesh in its own --out, with --task <meshTaskId>.`)
      if (manifest.rig) {
        throw new Error(`${cli.out} already has rig task ${manifest.rig.taskId}. A remesh here cannot be the parent of that rig. Make the remesh in its own --out, with --task <meshTaskId>.`)
      }
      return parentFrom(cli, [manifest.meshTaskId], 'meshTaskId', 'mesh')
    case 'rig':
      if (manifest.rig) throw new Error(`${cli.out} already has rig task ${manifest.rig.taskId}. Make a new rig in its own --out, with --task <meshTaskId>.`)
      // A remeshed copy wins over the first mesh, because it has the triangle budget.
      return parentFrom(cli, [manifest.remeshTaskId, manifest.meshTaskId], 'meshTaskId', 'mesh')
    case 'animate':
    case 'motion':
      return parentFrom(cli, [folderRig(manifest)], 'rigTaskId', 'rig')
    default:
      throw new Error(`${cli.command} is not a paid step.`)
  }
}

/**
 * Throws when a take is already in the folder: a text clip name (`names`) or a library id list (`actions`).
 * A take keeps its name, its files, and its task ids for good. A new take needs a new clip name.
 */
export function checkNewTakes(manifest, { names = [], actions } = {}) {
  for (const name of names) {
    const earlier = manifest.clips?.[name]
    if (earlier) throw new Error(`Clip ${name} already has a take (motion task ${earlier.motionTaskId}). Give the new take a new name, for example ${name}_2.`)
  }
  if (actions === undefined) return
  const ids = actions.join(',')
  const earlier = (manifest.animations ?? []).find((entry) => entry.clips.map((clip) => clip.id).join(',') === ids)
  if (earlier) throw new Error(`Library clips ${ids} are already on this rig (animation task ${earlier.taskId}). The earlier files stay unchanged.`)
}

const meshyFile = (taskId) => ({ type: 'model3d', source: { type: 'file', value: taskId, provider: 'meshy' } })
const seconds = (started) => Math.round((Date.now() - started) / 1000)
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
const log = (...parts) => console.error(...parts)

/** True for the Meshy 429 that says the account has too many tasks in the queue. */
export const isQueueFull = (error) => /429|NoMorePendingTasks/.test(String(error?.message ?? error))

const QUEUE_WAIT_MS = 30_000
const QUEUE_TRIES = 20

/**
 * Runs a Meshy step. When the queue of the account is full (429), it waits and sends the task again.
 * The 429 comes before Meshy makes the task, so a new try never pays twice.
 */
async function whenQueueFrees(name, send) {
  for (let attempt = 1; ; attempt++) {
    try {
      return await send()
    } catch (error) {
      if (!isQueueFull(error) || attempt === QUEUE_TRIES) throw error
      log(`${name}: the Meshy queue is full, trying again in ${QUEUE_WAIT_MS / 1000} s (${attempt}/${QUEUE_TRIES - 1})`)
      await sleep(QUEUE_WAIT_MS)
    }
  }
}

function generate(adapter, prompt, modelOptions, threadId) {
  return whenQueueFrees(threadId, () =>
    generate3DModel({ adapter, prompt, modelOptions, threadId, wait: true, pollInterval: POLL_MS, timeout: TIMEOUT_MS }),
  )
}

async function balance() {
  const result = await getMeshyBalance()
  return { ok: true, ...result }
}

async function mesh(cli) {
  // One folder holds one mesh. A new mesh needs a new folder, so earlier tasks keep their files.
  stepParent(readManifest(cli.out), cli)
  const { endpoint, aiModel, modelOptions } = meshOptions(cli.mode, cli.images.length, cli)
  const [first] = cli.images
  const name = cli.name ?? (/^(https?|data):/.test(first) ? 'mesh' : path.parse(first).name)
  const prompt = cli.images.map((image) => ({ type: 'image', source: { type: 'url', value: toImageUrl(image) } }))
  const started = Date.now()

  log(`${name}: sent to ${endpoint} (${aiModel})`)
  const result = await generate(meshy3DModel(endpoint, aiModel), prompt, modelOptions, `meshy-${name}`)
  if (result.format !== 'glb') throw new Error(`${name}: Meshy returned no GLB (main file is ${result.format}).`)
  fs.mkdirSync(cli.out, { recursive: true })
  const { saved, main } = await saveResult(result, name, cli.out)
  writeManifest(cli.out, {
    name,
    meshTaskId: result.jobId,
    mesh: { taskId: result.jobId, mode: cli.mode, endpoint, aiModel, modelOptions, images: cli.images.length, files: saved },
  })
  const files = outPaths(cli.out, saved)
  return {
    ok: true,
    endpoint,
    aiModel,
    taskId: result.jobId,
    glb: files[0],
    triangles: countTriangles(main),
    sizeMB: +(main.length / 1e6).toFixed(1),
    seconds: seconds(started),
    files,
  }
}

/** Makes a copy of the mesh with a new triangle budget. The rig step then uses this copy. */
async function remesh(cli) {
  const manifest = readManifest(cli.out)
  const meshTaskId = stepParent(manifest, cli)
  const name = manifest.name ?? 'model'
  const modelOptions = { target_polycount: cli.polycount, topology: cli.topology, target_formats: ['glb', 'fbx'], ...cli.opt }
  const started = Date.now()

  log(`${name}: remeshing task ${meshTaskId} to ${cli.polycount} (${cli.topology})`)
  const result = await generate(meshy3DModel('remesh'), [meshyFile(meshTaskId)], modelOptions, `meshy-${name}`)
  fs.mkdirSync(cli.out, { recursive: true })
  const { saved, main } = await saveResult(result, `${name}.remesh`, cli.out)
  writeManifest(cli.out, { remeshTaskId: result.jobId, remesh: { taskId: result.jobId, meshTaskId, modelOptions, files: saved } })
  const files = outPaths(cli.out, saved)
  return { ok: true, taskId: result.jobId, glb: files[0], triangles: countTriangles(main), sizeMB: +(main.length / 1e6).toFixed(1), seconds: seconds(started), files }
}

async function rig(cli) {
  const manifest = readManifest(cli.out)
  const meshTaskId = stepParent(manifest, cli)
  // The topology is known when the parent is a task of this folder.
  const parent = meshTaskId === manifest.remeshTaskId ? manifest.remesh : meshTaskId === manifest.meshTaskId ? manifest.mesh : undefined
  const modelOptions = rigOptions(cli, parent?.modelOptions?.topology)
  const name = manifest.name ?? 'model'
  const started = Date.now()

  log(`${name}: rigging task ${meshTaskId}`)
  const result = await generate(meshy3DModel('rigging'), [meshyFile(meshTaskId)], modelOptions, `meshy-${name}`)
  fs.mkdirSync(cli.out, { recursive: true })
  // The base name `<name>.rig` keeps the rigged files apart from the mesh `<name>.glb`.
  const { saved } = await saveResult(result, `${name}.rig`, cli.out)
  writeManifest(cli.out, { rigTaskId: result.jobId, rig: { taskId: result.jobId, meshTaskId, modelOptions, files: saved } })
  return { ok: true, taskId: result.jobId, modelOptions, seconds: seconds(started), files: outPaths(cli.out, saved) }
}

async function actions(cli) {
  const list = await listMeshyAnimations(cli.category ? { category: cli.category } : {})
  return list.map((item) => ({
    id: item.actionId,
    name: item.name,
    category: item.category,
    subCategory: item.subCategory,
    rigType: item.rigType,
    previewUrl: item.previewUrl,
  }))
}

async function animate(cli) {
  const manifest = readManifest(cli.out)
  const rigTaskId = stepParent(manifest, cli)
  checkNewTakes(manifest, { actions: cli.actions })
  // The library list is free. Check the ids here, so a wrong id costs no credits.
  const library = await listMeshyAnimations({ actionIds: cli.actions })
  const missing = cli.actions.filter((id) => !library.some((item) => item.actionId === id))
  if (missing.length > 0) throw new Error(`These action ids are not in the Meshy library: ${missing.join(', ')}.`)
  const clips = cli.actions.map((id) => {
    const item = library.find((entry) => entry.actionId === id)
    return { id, name: item.name, rigType: item.rigType }
  })
  const name = manifest.name ?? 'model'
  const base = `${name}.actions-${cli.actions.join('-')}`
  const started = Date.now()

  log(`${name}: animating rig ${rigTaskId} with ${clips.map((clip) => clip.name).join(', ')}`)
  const modelOptions = { action_ids: cli.actions, ...cli.opt }
  const result = await generate(meshy3DModel('animation'), [meshyFile(rigTaskId)], modelOptions, `meshy-${name}`)
  fs.mkdirSync(cli.out, { recursive: true })
  const { saved } = await saveResult(result, base, cli.out)
  const entry = { taskId: result.jobId, rigTaskId, clips, files: saved }
  writeManifest(cli.out, { animations: [...(readManifest(cli.out).animations ?? []), entry] })
  return { ok: true, taskId: result.jobId, clips, seconds: seconds(started), files: outPaths(cli.out, saved) }
}

/** Polls a motion job until it ends. Returns the finished motion, or throws with the Meshy error. */
async function waitForMotion(adapter, jobId, name) {
  const started = Date.now()
  let last
  while (Date.now() - started < MOTION_TIMEOUT_MS) {
    const status = await getMotionJobStatus({ adapter, jobId })
    if (status.status !== last) log(`[${name}] ${status.status}`)
    last = status.status
    if (status.status === 'completed') return status.motion
    if (status.status === 'failed') throw new Error(status.error ?? 'Meshy text to motion failed.')
    await sleep(POLL_MS)
  }
  throw new Error(`text to motion timed out after ${MOTION_TIMEOUT_MS / 60_000} min (job ${jobId}).`)
}

async function runClip(clip, rigTaskId, cli) {
  const started = Date.now()
  const adapter = meshyMotion('prime')
  const threadId = `meshy-motion-${clip.name}`
  const { jobId } = await whenQueueFrees(threadId, () =>
    generateMotion({ adapter, prompt: clip.prompt, duration: clip.seconds, threadId }),
  )
  log(`[${clip.name}] motion job ${jobId}`)
  const motion = await waitForMotion(adapter, jobId, clip.name)
  const [asset] = motion.assets
  // The raw motion is `<clip>.motion.<format>`. It keeps its own hash, apart from the clip on the rig.
  const raw = { url: asset.url, format: asset.format, files: [{ url: asset.url, role: 'motion', format: asset.format }] }
  const { saved: motionFiles } = await saveResult(raw, `${clip.name}.motion`, cli.out)

  log(`[${clip.name}] putting the motion on rig ${rigTaskId}`)
  const modelOptions = { motion_task_id: jobId, ...cli.opt }
  const result = await generate(meshy3DModel('animation'), [meshyFile(rigTaskId)], modelOptions, threadId)
  const { saved } = await saveResult(result, clip.name, cli.out)
  const entry = { motionTaskId: jobId, animationTaskId: result.jobId, rigTaskId, prompt: clip.prompt, seconds: clip.seconds, files: [...motionFiles, ...saved] }
  writeManifest(cli.out, { clips: { ...readManifest(cli.out).clips, [clip.name]: entry } })
  return { ok: true, name: clip.name, ...entry, files: outPaths(cli.out, entry.files), elapsedSeconds: seconds(started) }
}

// Runs `run` on each item, at most `limit` at a time. Returns one settled result per item, in order.
async function runPool(items, limit, run) {
  const results = new Array(items.length)
  let next = 0
  const worker = async () => {
    while (next < items.length) {
      const index = next++
      try {
        results[index] = { status: 'fulfilled', value: await run(items[index]) }
      } catch (reason) {
        results[index] = { status: 'rejected', reason }
      }
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker))
  return results
}

async function motion(cli) {
  const clips = readMotionClips(fs.readFileSync(cli.clipsFile, 'utf8'))
  const manifest = readManifest(cli.out)
  const rigTaskId = stepParent(manifest, cli)
  checkNewTakes(manifest, { names: clips.map((clip) => clip.name) })
  const isQuadruped = rigTaskId === manifest.rigTaskId && manifest.rig?.modelOptions?.animation_type === 'quadruped'
  if (isQuadruped) throw new Error('Meshy text to motion needs a biped rig. This rig is a quadruped.')
  fs.mkdirSync(cli.out, { recursive: true })
  const results = await runPool(clips, MOTION_JOBS_AT_ONCE, (clip) => runClip(clip, rigTaskId, cli))
  return results.map((result, index) =>
    result.status === 'fulfilled' ? result.value : { ok: false, name: clips[index].name, error: result.reason.message },
  )
}

const RUN = { balance, mesh, remesh, rig, actions, animate, motion }

async function main() {
  let cli
  try {
    cli = parseCli(process.argv.slice(2))
  } catch (error) {
    console.error(`${error.message}\n\n${USAGE}`)
    process.exitCode = 1
    return
  }
  if (!process.env.MESHY_API_KEY) throw new Error('Set the MESHY_API_KEY env var to a Meshy API key.')
  const output = await RUN[cli.command](cli)
  const lines = Array.isArray(output) ? output : [output]
  for (const line of lines) console.log(JSON.stringify(line))
  const hasFailure = lines.some((line) => line.ok === false)
  process.exitCode = hasFailure ? 1 : 0
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(error.message)
    process.exitCode = 1
  })
}
