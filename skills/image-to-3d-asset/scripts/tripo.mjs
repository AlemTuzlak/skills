#!/usr/bin/env node
// Turns concept art into a 3D character or prop with Tripo: mesh, rig and preset animations.
// It calls the Tripo v3 API (https://openapi.tripo3d.ai/v3, or TRIPO_API_BASE) with fetch. Node 20+. No packages.
// The key comes from the TRIPO_API_KEY env var (a secret key that starts with tsk_).
// `mesh --via fal` makes the mesh through fal.ai (FAL_KEY) instead. The rig and the animations always need TRIPO_API_KEY.
// Each step writes its task id, its parent task id and the SHA-256 of each file to <out>/manifest.json, the same way as
// meshy.mjs. A step never writes over a downloaded file or an earlier task.
import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { parseArgs } from 'node:util'
import { pathToFileURL } from 'node:url'

// International keys (developers.tripo3d.ai) use the .ai host. A China-site key (developers.tripo3d.com) gets a 401 there:
// set TRIPO_API_BASE=https://openapi.tripo3d.com/v3 for it.
const API = process.env.TRIPO_API_BASE ?? 'https://openapi.tripo3d.ai/v3'
const FAL_QUEUE = 'https://queue.fal.run'
const FAL_MULTIVIEW = 'tripo3d/h3.1/multiview-to-3d'
const FAL_SINGLE = 'tripo3d/h3.1/image-to-3d'
const MESH_MODEL = 'v3.5-20261108'
// v1.0 is the rig model with the 90+ biped presets (cast_a_spell, slash, idle, ...). v3.0 has 11 presets only.
const RIG_MODEL = 'v1.0-20240301'
const POLL_MS = 3_000
const TIMEOUT_MS = 30 * 60_000
const MAX_ANIMATIONS = 5
const MANIFEST = 'manifest.json'
const MIME = { '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp' }
// The order of the views. Tripo reads front, left, back, right. A side view of a turnaround sheet is often the right side.
const VIEW_KEYS = ['front', 'left', 'back', 'right']

export const USAGE = `Usage: node tripo.mjs <command> [flags]
  balance
  mesh <front> [<view> ...] [--views front,right,back] [--name <name>] [--polycount <n>] [--via tripo|fal] [--out <dir>] [--opt key=value]
  rig [--spec mixamo|tripo] [--task <meshTaskId>] [--out <dir>] [--opt key=value]
  animate --presets <name,name,...> [--task <rigTaskId>] [--out <dir>] [--opt key=value]`

const SHARED = { out: { type: 'string' }, opt: { type: 'string', multiple: true }, task: { type: 'string' } }
const COMMANDS = {
  balance: {},
  mesh: { out: SHARED.out, opt: SHARED.opt, views: { type: 'string' }, name: { type: 'string' }, polycount: { type: 'string' }, via: { type: 'string', default: 'tripo' } },
  rig: { ...SHARED, spec: { type: 'string', default: 'mixamo' } },
  animate: { ...SHARED, presets: { type: 'string' } },
}

/** Parses one `--opt key=value`. The value is JSON when it parses as JSON, else a string. */
export function parseOpt(text) {
  const at = text.indexOf('=')
  if (at < 1) throw new Error(`--opt ${text}: use the form key=value.`)
  const value = text.slice(at + 1)
  try {
    return [text.slice(0, at), JSON.parse(value)]
  } catch {
    return [text.slice(0, at), value]
  }
}

/** The view key of each image. The first image is always the front. */
export function viewKeys(count, text) {
  const keys = text === undefined ? ['front', 'right', 'back', 'left'].slice(0, count) : text.split(',').map((key) => key.trim())
  if (keys.length !== count) throw new Error(`--views names ${keys.length} views, but you gave ${count} images.`)
  if (keys[0] !== 'front') throw new Error('The first image must be the front view.')
  if (!keys.every((key) => VIEW_KEYS.includes(key))) throw new Error(`--views takes only ${VIEW_KEYS.join(', ')}.`)
  if (new Set(keys).size !== keys.length) throw new Error('--views has the same view two times.')
  return keys
}

/** A preset name as Tripo wants it. `cast_a_spell` becomes `preset:biped:cast_a_spell`. */
export function presetName(name) {
  const trimmed = name.trim()
  if (!/^[a-z0-9_:-]+$/.test(trimmed)) throw new Error(`Preset "${name}": use the names of the Tripo preset list, for example idle or cast_a_spell.`)
  return trimmed.startsWith('preset:') ? trimmed : `preset:biped:${trimmed}`
}

export function parseCli(argv) {
  const [command, ...rest] = argv
  const options = COMMANDS[command]
  if (!options) throw new Error(command ? `Unknown command "${command}".` : 'Give a command.')
  const { values, positionals } = parseArgs({ args: rest, allowPositionals: true, strict: true, options })
  const opt = Object.fromEntries((values.opt ?? []).map(parseOpt))
  const base = { command, out: values.out ?? '.', opt, task: values.task }
  switch (command) {
    case 'balance':
      return base
    case 'mesh': {
      if (positionals.length < 1 || positionals.length > 4) throw new Error('mesh needs 1 to 4 images, front view first.')
      if (!['tripo', 'fal'].includes(values.via)) throw new Error('--via must be tripo or fal.')
      const polycount = values.polycount === undefined ? undefined : Number(values.polycount)
      if (polycount !== undefined && !(Number.isInteger(polycount) && polycount >= 1000)) throw new Error('--polycount must be a whole number of 1000 or more.')
      return { ...base, images: positionals, keys: viewKeys(positionals.length, values.views), name: values.name, polycount, via: values.via }
    }
    case 'rig':
      if (!['mixamo', 'tripo'].includes(values.spec)) throw new Error('--spec must be mixamo or tripo for the v1.0 rig.')
      return { ...base, spec: values.spec }
    case 'animate': {
      if (!values.presets) throw new Error('animate needs --presets, for example --presets idle,cast_a_spell.')
      const presets = values.presets.split(',').map(presetName)
      if (presets.length > MAX_ANIMATIONS) throw new Error(`Tripo takes 1 to ${MAX_ANIMATIONS} presets in one call. You gave ${presets.length}.`)
      return { ...base, presets }
    }
  }
  throw new Error(`Unknown command ${command}.`)
}

function key(name) {
  const value = process.env[name]?.trim()
  if (!value) throw new Error(`Set the ${name} env var.`)
  if (name === 'TRIPO_API_KEY' && !value.startsWith('tsk_')) {
    throw new Error('TRIPO_API_KEY must be the secret key that starts with tsk_ (not the client id tcli_...).')
  }
  return value
}

async function tripo(method, route, body) {
  const headers = { Authorization: `Bearer ${key('TRIPO_API_KEY')}` }
  const isForm = body instanceof FormData
  if (body !== undefined && !isForm) headers['Content-Type'] = 'application/json'
  const response = await fetch(`${API}${route}`, { method, headers, body: body === undefined || isForm ? body : JSON.stringify(body) })
  const json = await response.json().catch(() => ({}))
  if (!response.ok || json.code !== 0) {
    throw new Error(`Tripo ${method} ${route}: HTTP ${response.status} code ${json.code}: ${json.message ?? ''} ${json.suggestion ?? ''}`.trim())
  }
  return json.data
}

async function upload(image) {
  if (/^https?:/.test(image)) return image
  const mime = MIME[path.extname(image).toLowerCase()]
  if (!mime) throw new Error(`${image}: use a .png, .jpg, .jpeg or .webp image.`)
  const form = new FormData()
  form.append('file', new Blob([fs.readFileSync(image)], { type: mime }), path.basename(image))
  return (await tripo('POST', '/files', form)).file_token
}

async function waitTask(taskId) {
  const end = Date.now() + TIMEOUT_MS
  for (;;) {
    const task = await tripo('GET', `/tasks/${taskId}`)
    process.stderr.write(`  ${taskId}: ${task.status} ${task.progress ?? ''}\n`)
    if (task.status === 'success') return task
    if (['failed', 'cancelled', 'banned', 'expired'].includes(task.status)) {
      throw new Error(`Tripo task ${taskId} ${task.status}: ${task.error_code ?? ''} ${task.error_message ?? ''}`.trim())
    }
    if (Date.now() > end) throw new Error(`Tripo task ${taskId} is still ${task.status} after 30 min. It may still finish: give it with --task.`)
    await new Promise((resolve) => setTimeout(resolve, POLL_MS))
  }
}

function dataUrl(image) {
  if (/^(https?|data):/.test(image)) return image
  const mime = MIME[path.extname(image).toLowerCase()]
  if (!mime) throw new Error(`${image}: use a .png, .jpg, .jpeg or .webp image.`)
  return `data:${mime};base64,${fs.readFileSync(image).toString('base64')}`
}

async function falRun(endpoint, input) {
  const headers = { Authorization: `Key ${key('FAL_KEY')}`, 'Content-Type': 'application/json' }
  const submit = await fetch(`${FAL_QUEUE}/${endpoint}`, { method: 'POST', headers, body: JSON.stringify(input) })
  const job = await submit.json()
  if (!submit.ok) throw new Error(`fal ${endpoint}: HTTP ${submit.status}: ${JSON.stringify(job).slice(0, 500)}`)
  const end = Date.now() + TIMEOUT_MS
  for (;;) {
    const status = await (await fetch(job.status_url, { headers })).json()
    process.stderr.write(`  fal ${job.request_id}: ${status.status}\n`)
    if (status.status === 'COMPLETED') break
    if (Date.now() > end) throw new Error(`fal request ${job.request_id} is still ${status.status} after 30 min.`)
    await new Promise((resolve) => setTimeout(resolve, POLL_MS))
  }
  const result = await fetch(job.response_url, { headers })
  const json = await result.json()
  if (!result.ok) throw new Error(`fal ${endpoint} failed: HTTP ${result.status}: ${JSON.stringify(json).slice(0, 500)}`)
  return { requestId: job.request_id, output: json }
}

const sha256 = (buffer) => crypto.createHash('sha256').update(buffer).digest('hex')

function readManifest(out) {
  const file = path.join(out, MANIFEST)
  return fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : null
}

function writeManifest(out, manifest) {
  fs.writeFileSync(path.join(out, MANIFEST), `${JSON.stringify(manifest, null, 2)}\n`)
}

// Downloads one URL to <out>/<name>. A taken name gets -2, -3, ... so no file is written over.
async function download(url, out, name) {
  const response = await fetch(url)
  if (!response.ok) throw new Error(`Download ${name}: HTTP ${response.status}`)
  const buffer = Buffer.from(await response.arrayBuffer())
  const ext = path.extname(name)
  let file = name
  for (let n = 2; fs.existsSync(path.join(out, file)); n++) file = `${path.basename(name, ext)}-${n}${ext}`
  fs.writeFileSync(path.join(out, file), buffer, { flag: 'wx' })
  return { path: file, sha256: sha256(buffer), bytes: buffer.length }
}

function modelExt(url) {
  const ext = path.extname(new URL(url).pathname).toLowerCase()
  return ['.glb', '.fbx', '.zip', '.gltf'].includes(ext) ? ext : '.glb'
}

async function mesh(flags) {
  fs.mkdirSync(flags.out, { recursive: true })
  if (readManifest(flags.out)) throw new Error(`${flags.out}/${MANIFEST} already exists. A new mesh needs a new --out.`)
  const name = flags.name ?? path.basename(flags.images[0], path.extname(flags.images[0]))
  const manifest = { provider: 'tripo', name, files: [] }
  const started = Date.now()
  let modelUrl
  let previewUrl
  if (flags.via === 'fal') {
    // fal takes [front, left, back, right] by position. An empty string skips a view.
    const ordered = VIEW_KEYS.map((view) => {
      const at = flags.keys.indexOf(view)
      return at === -1 ? '' : dataUrl(flags.images[at])
    })
    while (ordered.at(-1) === '') ordered.pop()
    // fal downloads each slot, so it refuses an empty slot with a 422. Stop before the request instead.
    if (ordered.includes('')) {
      throw new Error(`fal takes the views in the order ${VIEW_KEYS.join(', ')} with no gap. You gave ${flags.keys.join(', ')}. Add the missing view (for a near-symmetric character, a mirrored copy of the other side view), or drop the later views.`)
    }
    const single = flags.images.length === 1
    const input = single
      ? { image_url: ordered[0], pbr: false, texture: true, ...(flags.polycount ? { face_limit: flags.polycount } : {}), ...flags.opt }
      : { image_urls: ordered, pbr: false, texture: true, ...(flags.polycount ? { face_limit: flags.polycount } : {}), ...flags.opt }
    const { requestId, output } = await falRun(single ? FAL_SINGLE : FAL_MULTIVIEW, input)
    modelUrl = output.model_mesh?.url
    previewUrl = output.rendered_image?.url
    manifest.mesh = { via: 'fal', endpoint: single ? FAL_SINGLE : FAL_MULTIVIEW, falRequestId: requestId, tripoTaskId: output.task_id ?? null, modelUrl, options: { ...input, image_url: undefined, image_urls: flags.keys } }
  } else {
    const tokens = []
    for (const image of flags.images) tokens.push(await upload(image))
    const options = { model: MESH_MODEL, texture: true, pbr: false, ...(flags.polycount ? { face_limit: flags.polycount } : {}), ...flags.opt }
    const route = tokens.length === 1 ? '/generation/image-to-model' : '/generation/multiview-to-model'
    const body = tokens.length === 1 ? { input: tokens[0], ...options } : { inputs: tokens.map((token, at) => ({ [flags.keys[at]]: token })), ...options }
    const { task_id: taskId } = await tripo('POST', route, body)
    const task = await waitTask(taskId)
    modelUrl = task.output.model_url
    previewUrl = task.output.rendered_image_url
    manifest.mesh = { via: 'tripo', route, taskId, credits: task.credits_consumed, options: { ...options, views: flags.keys } }
  }
  if (!modelUrl) throw new Error('The mesh result has no model URL.')
  const model = await download(modelUrl, flags.out, `${name}${modelExt(modelUrl)}`)
  manifest.files.push({ ...model, role: 'mesh' })
  if (previewUrl) manifest.files.push({ ...(await download(previewUrl, flags.out, `${name}.preview${path.extname(new URL(previewUrl).pathname) || '.webp'}`)), role: 'preview' })
  writeManifest(flags.out, manifest)
  return { ok: true, glb: path.join(flags.out, model.path), sizeMB: +(model.bytes / 1e6).toFixed(1), seconds: Math.round((Date.now() - started) / 1000), credits: manifest.mesh.credits ?? null }
}

async function rig(flags) {
  const manifest = readManifest(flags.out)
  if (!manifest?.mesh) throw new Error(`No mesh in ${flags.out}/${MANIFEST}. Run mesh first, with the same --out.`)
  if (manifest.rig) throw new Error(`${flags.out} already has a rig (task ${manifest.rig.taskId}). A folder takes one rig.`)
  // A native mesh passes its task id. A fal mesh passes the Tripo task id when fal returns it, else its public URL.
  const input = flags.task ?? manifest.mesh.taskId ?? manifest.mesh.tripoTaskId ?? manifest.mesh.modelUrl
  const check = await tripo('POST', '/animations/rig-check', { input })
  const checked = await waitTask(check.task_id)
  if (checked.output?.riggable === false) throw new Error(`Tripo says the mesh cannot be rigged (rig_type ${checked.output.rig_type}).`)
  const options = { model: RIG_MODEL, rig_type: 'biped', spec: flags.spec, out_format: 'glb', ...flags.opt }
  const { task_id: taskId } = await tripo('POST', '/animations/rig', { input, ...options })
  const task = await waitTask(taskId)
  const file = await download(task.output.model_url, flags.out, `${manifest.name}.rig${modelExt(task.output.model_url)}`)
  manifest.rig = { taskId, parent: input, credits: task.credits_consumed, checkTaskId: check.task_id, checkCredits: checked.credits_consumed, options }
  manifest.files.push({ ...file, role: 'rig' })
  writeManifest(flags.out, manifest)
  return { ok: true, rig: path.join(flags.out, file.path), credits: task.credits_consumed }
}

async function animate(flags) {
  const manifest = readManifest(flags.out)
  if (!manifest) throw new Error(`No ${MANIFEST} in ${flags.out}. Use the --out of the mesh and the rig.`)
  const rigTaskId = flags.task ?? manifest.rig?.taskId
  if (!rigTaskId) throw new Error(`No rig in ${flags.out}/${MANIFEST}. Run rig first, or give --task <rigTaskId>.`)
  manifest.animations ??= []
  const label = flags.presets.map((preset) => preset.split(':').pop()).join('+')
  if (manifest.animations.some((take) => take.label === label)) throw new Error(`The presets ${label} are already on this rig.`)
  const options = { animate_in_place: true, out_format: 'glb', export_with_geometry: true, ...flags.opt }
  const body = flags.presets.length === 1 ? { input: rigTaskId, animation: flags.presets[0], ...options } : { input: rigTaskId, animations: flags.presets, ...options }
  const { task_id: taskId } = await tripo('POST', '/animations/retarget', body)
  const task = await waitTask(taskId)
  const file = await download(task.output.model_url, flags.out, `${manifest.name}.anim-${label}${modelExt(task.output.model_url)}`)
  manifest.animations.push({ label, presets: flags.presets, taskId, rigTaskId, credits: task.credits_consumed, options })
  manifest.files.push({ ...file, role: 'animation' })
  writeManifest(flags.out, manifest)
  return { ok: true, clip: path.join(flags.out, file.path), presets: flags.presets, credits: task.credits_consumed }
}

async function main() {
  const flags = parseCli(process.argv.slice(2))
  const run = { balance: () => tripo('GET', '/account/balance'), mesh, rig, animate }[flags.command]
  console.log(JSON.stringify(await run(flags)))
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  main().catch((error) => {
    console.error(error.message)
    console.error(USAGE)
    process.exit(1)
  })
}
