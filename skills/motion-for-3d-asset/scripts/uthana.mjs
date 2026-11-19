#!/usr/bin/env node
// Uthana text-to-motion runner: upload a character, make clips, check the balance.
// Node 20+, no packages. Reads the key from the UTHANA_API_KEY env var only.
//
//   node uthana.mjs balance
//   node uthana.mjs character <model.glb|.fbx> <name> [--no-auto-rig]
//   node uthana.mjs generate <clips.json> [--out dir] [--only a,b] [--character id] [--model m] [--fps 30]
import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { parseArgs } from 'node:util'
import { pathToFileURL } from 'node:url'

const BASE = 'https://uthana.com'
// The default Uthana character. Its bones have Unreal mannequin names.
export const DEFAULT_CHARACTER = 'cXi2eAP19XwQ'
const POLL_MS = 5_000
const JOB_TIMEOUT_MS = 15 * 60_000
// Uthana refuses a 5th text-to-motion job while 4 are queued or running.
export const MAX_JOBS = 4

export function parseCli(argv) {
  const { values, positionals } = parseArgs({
    args: argv,
    allowPositionals: true,
    options: {
      out: { type: 'string' },
      only: { type: 'string' },
      character: { type: 'string' },
      model: { type: 'string', default: 'text-to-motion-3.0' },
      fps: { type: 'string', default: '30' },
      'no-auto-rig': { type: 'boolean', default: false },
    },
  })
  const [command, ...rest] = positionals
  if (!['balance', 'character', 'generate'].includes(command)) {
    throw new Error('Command must be one of: balance, character, generate.')
  }
  if (command === 'character' && rest.length !== 2) throw new Error('Usage: character <model.glb|.fbx> <name>')
  if (command === 'generate' && rest.length !== 1) throw new Error('Usage: generate <clips.json>')
  const fps = Number(values.fps)
  if (![24, 30, 60].includes(fps)) throw new Error('--fps must be 24, 30, or 60.')
  return {
    command,
    args: rest,
    out: values.out,
    only: values.only ? values.only.split(',') : undefined,
    character: values.character,
    model: values.model,
    fps,
    autoRig: !values['no-auto-rig'],
  }
}

/** Reads and checks clips.json: [{ name, prompt, seconds?, character? }]. */
export function readClips(text) {
  const clips = JSON.parse(text)
  if (!Array.isArray(clips) || clips.length === 0) throw new Error('clips.json must be a non-empty array.')
  const names = new Set()
  for (const c of clips) {
    if (!c || typeof c.name !== 'string' || !/^[\w-]+$/.test(c.name)) throw new Error('Each clip needs a name of letters, digits, _ or -.')
    if (typeof c.prompt !== 'string' || c.prompt.length < 20) throw new Error(`${c.name}: the prompt is missing or too short.`)
    if (names.has(c.name)) throw new Error(`${c.name}: the name is used twice.`)
    names.add(c.name)
  }
  return clips
}

/** Uthana job -> { state: 'waiting' | 'done' | 'failed', motionId?, error? }. */
export function jobOutcome(job) {
  const error = job.result?.exc ?? undefined
  if (job.status === 'FAILED') return { state: 'failed', error: error ?? 'Uthana job failed' }
  if (job.status !== 'FINISHED') return { state: 'waiting' }
  if (error) return { state: 'failed', error }
  const motionId = job.result?.result?.id
  return motionId ? { state: 'done', motionId } : { state: 'failed', error: 'Finished job has no motion id' }
}

export function downloadUrl(characterId, motionId, format, fps) {
  const file = `uthana-${motionId}.${format}`
  return `${BASE}/motion/file/motion_viewer/${encodeURIComponent(characterId)}/${encodeURIComponent(motionId)}/${format}/${file}?fps=${fps}`
}

export const isJobLimit = (error) => /job_limit_exceeded|429/.test(String(error?.message ?? error))

function auth() {
  const key = process.env.UTHANA_API_KEY
  if (!key) throw new Error('Set UTHANA_API_KEY.')
  return `Basic ${Buffer.from(`${key}:`).toString('base64')}`
}

async function readGraphql(response) {
  const text = await response.text()
  let body
  try { body = JSON.parse(text) } catch { body = undefined }
  if (!response.ok || !body) throw new Error(`Uthana ${response.status}: ${text.slice(0, 300)}`)
  if (body.errors?.length) throw new Error(`Uthana: ${body.errors.map((e) => e.message).join('; ')}`)
  return body.data
}

async function gql(query, variables = {}) {
  const response = await fetch(`${BASE}/graphql`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: auth() },
    body: JSON.stringify({ query, variables }),
  })
  return readGraphql(response)
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const log = (...a) => console.error(...a)

async function balance() {
  const data = await gql('{ org { payg_total_usd } }')
  console.log(JSON.stringify({ ok: true, balanceUsd: Number(data.org?.payg_total_usd) }))
}

async function uploadCharacter(file, name, autoRig) {
  // GraphQL multipart request: the file is the `file` variable.
  const form = new FormData()
  form.append('operations', JSON.stringify({
    query: `mutation($file: Upload!, $name: String!, $auto_rig: Boolean) {
      create_character(file: $file, name: $name, auto_rig: $auto_rig) { character { id name } auto_rig_confidence message } }`,
    variables: { file: null, name, auto_rig: autoRig },
  }))
  form.append('map', JSON.stringify({ 0: ['variables.file'] }))
  form.append('0', new Blob([fs.readFileSync(file)]), path.basename(file))
  const response = await fetch(`${BASE}/graphql`, { method: 'POST', headers: { authorization: auth() }, body: form })
  const created = (await readGraphql(response)).create_character
  console.log(JSON.stringify({
    ok: true,
    characterId: created.character.id,
    name: created.character.name,
    autoRigConfidence: created.auto_rig_confidence ?? null,
    message: created.message ?? null,
  }))
}

async function submit(clip, model, characterId) {
  for (;;) {
    try {
      const data = await gql(
        `mutation($prompt: String!, $model: String!, $length: Float, $character_id: String) {
          create_text_to_motion_job(prompt: $prompt, model: $model, length: $length, character_id: $character_id) { job { id } } }`,
        { prompt: clip.prompt, model, length: clip.seconds ?? 4, character_id: characterId },
      )
      return data.create_text_to_motion_job.job.id
    } catch (error) {
      // Another process may hold job slots. Wait for one to free up.
      if (!isJobLimit(error)) throw error
      log(`[${clip.name}] job limit reached, waiting`)
      await sleep(15_000)
    }
  }
}

async function waitForJob(clip, jobId) {
  const start = Date.now()
  let last
  while (Date.now() - start < JOB_TIMEOUT_MS) {
    const { job } = await gql('query($id: String) { job(job_id: $id) { id status result } }', { id: jobId })
    if (!job) throw new Error(`job ${jobId} not found`)
    if (job.status !== last) log(`[${clip.name}] ${job.status}`)
    last = job.status
    const outcome = jobOutcome(job)
    if (outcome.state !== 'waiting') return outcome
    await sleep(POLL_MS)
  }
  return { state: 'failed', error: `timed out after ${JOB_TIMEOUT_MS / 60_000} min` }
}

async function download(url, file) {
  const response = await fetch(url, { headers: { authorization: auth() } })
  if (!response.ok) throw new Error(`download failed (${response.status}) for ${path.basename(file)}`)
  const bytes = Buffer.from(await response.arrayBuffer())
  fs.writeFileSync(file, bytes)
  return { path: file, bytes: bytes.length, sha256: crypto.createHash('sha256').update(bytes).digest('hex') }
}

async function runClip(clip, opts) {
  const characterId = clip.character ?? opts.character ?? DEFAULT_CHARACTER
  const started = Date.now()
  // Uthana sometimes fails a job on its side ("failed during stage 1").
  // A second try usually works, so each clip gets one retry.
  let jobId, outcome
  for (let attempt = 1; attempt <= 2; attempt++) {
    jobId = await submit(clip, opts.model, characterId)
    log(`[${clip.name}] job ${jobId}`)
    outcome = await waitForJob(clip, jobId)
    if (outcome.state === 'done') break
    log(`[${clip.name}] failed: ${outcome.error}`)
  }
  if (outcome.state !== 'done') return { ok: false, name: clip.name, jobId, error: outcome.error }
  const files = {}
  for (const format of ['fbx', 'glb']) {
    files[format] = await download(
      downloadUrl(characterId, outcome.motionId, format, opts.fps),
      path.join(opts.out, `${clip.name}.${format}`),
    )
  }
  return {
    ok: true,
    name: clip.name,
    prompt: clip.prompt,
    requestedSeconds: clip.seconds ?? 4,
    model: opts.model,
    characterId,
    fps: opts.fps,
    jobId,
    motionId: outcome.motionId,
    files,
    elapsedSeconds: Math.round((Date.now() - started) / 1000),
  }
}

async function generate(clipsFile, opts) {
  const all = readClips(fs.readFileSync(clipsFile, 'utf8'))
  const clips = opts.only ? all.filter((c) => opts.only.includes(c.name)) : all
  if (clips.length === 0) throw new Error('--only matched no clip.')
  const out = path.resolve(opts.out ?? path.dirname(clipsFile))
  fs.mkdirSync(out, { recursive: true })
  const manifestPath = path.join(out, 'manifest.json')
  const manifest = fs.existsSync(manifestPath) ? JSON.parse(fs.readFileSync(manifestPath, 'utf8')) : {}
  const queue = [...clips]
  let failed = 0
  // Run at most MAX_JOBS clips at a time.
  const worker = async () => {
    for (let clip = queue.shift(); clip; clip = queue.shift()) {
      let record
      try {
        record = await runClip(clip, { ...opts, out })
      } catch (error) {
        record = { ok: false, name: clip.name, error: error.message }
      }
      if (!record.ok) failed++
      manifest[clip.name] = record
      // Write after each clip, so finished clips survive a crash.
      fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2))
      console.log(JSON.stringify(record.ok ? { ok: true, name: record.name, fbx: record.files.fbx.path, glb: record.files.glb.path, seconds: record.elapsedSeconds } : record))
    }
  }
  await Promise.all(Array.from({ length: Math.min(MAX_JOBS, clips.length) }, worker))
  log(`manifest: ${manifestPath}`)
  if (failed) process.exitCode = 1
}

async function main() {
  const opts = parseCli(process.argv.slice(2))
  if (opts.command === 'balance') return balance()
  if (opts.command === 'character') return uploadCharacter(opts.args[0], opts.args[1], opts.autoRig)
  return generate(opts.args[0], opts)
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  main().catch((error) => {
    console.log(JSON.stringify({ ok: false, error: error.message }))
    process.exitCode = 1
  })
}
