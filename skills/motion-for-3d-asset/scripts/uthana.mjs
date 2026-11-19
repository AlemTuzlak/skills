#!/usr/bin/env node
// Uthana text-to-motion runner: upload a character, make clips, check the balance.
// Uses TanStack AI (generateMotion + the Uthana adapter) for the jobs and the upload.
// Node 20+. Run `npm install` in this folder once. Reads the key from the UTHANA_API_KEY env var only.
//
//   node uthana.mjs balance
//   node uthana.mjs character <model.glb|.fbx> <name> [--no-auto-rig]
//   node uthana.mjs generate <clips.json> [--out dir] [--only a,b] [--character id] [--model m] [--fps 30]
import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { parseArgs } from 'node:util'
import { pathToFileURL } from 'node:url'
import { generateMotion, getMotionJobStatus } from '@tanstack/ai'
import { createUthanaCharacter, uthanaMotion, UTHANA_DEFAULT_CHARACTER_ID } from '@tanstack/ai-uthana'

const BASE = 'https://uthana.com'
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

// The adapter has no balance query, so the balance is one direct GraphQL call.
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
  const created = await createUthanaCharacter({
    file: new Blob([fs.readFileSync(file)]),
    fileName: path.basename(file),
    name,
    autoRig,
  })
  console.log(JSON.stringify({
    ok: true,
    characterId: created.characterId,
    name: created.name,
    autoRigConfidence: created.autoRigConfidence ?? null,
    message: created.message ?? null,
  }))
}

async function submit(clip, adapter, characterId, fps) {
  for (;;) {
    try {
      const { jobId } = await generateMotion({
        adapter,
        threadId: `motion-${clip.name}`,
        prompt: clip.prompt,
        duration: clip.seconds ?? 4,
        modelOptions: { character_id: characterId, formats: ['fbx', 'glb'], fps },
      })
      return jobId
    } catch (error) {
      // Another process may hold job slots. Wait for one to free up.
      if (!isJobLimit(error)) throw error
      log(`[${clip.name}] job limit reached, waiting`)
      await sleep(15_000)
    }
  }
}

/** Polls until the job ends. Returns { status: 'completed', motion } or { status: 'failed', error }. */
async function waitForJob(clip, adapter, jobId) {
  const start = Date.now()
  let last
  while (Date.now() - start < JOB_TIMEOUT_MS) {
    const status = await getMotionJobStatus({ adapter, jobId })
    if (status.status !== last) log(`[${clip.name}] ${status.status}`)
    last = status.status
    if (status.status === 'completed' || status.status === 'failed') return status
    await sleep(POLL_MS)
  }
  return { status: 'failed', error: `timed out after ${JOB_TIMEOUT_MS / 60_000} min` }
}

/** Writes a `data:` URL asset from the adapter to a file. */
export function saveAsset(asset, file) {
  const bytes = Buffer.from(asset.url.slice(asset.url.indexOf(',') + 1), 'base64')
  fs.writeFileSync(file, bytes)
  return { path: file, bytes: bytes.length, sha256: crypto.createHash('sha256').update(bytes).digest('hex') }
}

async function runClip(clip, opts) {
  const characterId = clip.character ?? opts.character ?? UTHANA_DEFAULT_CHARACTER_ID
  const adapter = uthanaMotion(opts.model)
  const started = Date.now()
  // Uthana sometimes fails a job on its side ("failed during stage 1").
  // A second try usually works, so each clip gets one retry.
  let jobId, outcome
  for (let attempt = 1; attempt <= 2; attempt++) {
    jobId = await submit(clip, adapter, characterId, opts.fps)
    log(`[${clip.name}] job ${jobId}`)
    outcome = await waitForJob(clip, adapter, jobId)
    if (outcome.status === 'completed') break
    log(`[${clip.name}] failed: ${outcome.error}`)
  }
  if (outcome.status !== 'completed') return { ok: false, name: clip.name, jobId, error: outcome.error }
  const files = {}
  for (const asset of outcome.motion.assets) {
    files[asset.format] = saveAsset(asset, path.join(opts.out, `${clip.name}.${asset.format}`))
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
