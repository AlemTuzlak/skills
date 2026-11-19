#!/usr/bin/env node
// Turns images into game-ready 3D meshes (GLB) with fal.ai Meshy models.
// Node 20+, no packages. Reads the fal key from the FAL_KEY env var.
import fs from 'node:fs'
import path from 'node:path'
import { parseArgs } from 'node:util'
import { pathToFileURL } from 'node:url'

export const MODELS = {
  // Meshy Smart Topology: clean triangles, keeps to the polycount budget.
  smart: { endpoint: 'meshy/t2.5/image-to-3d', input: {} },
  // Meshy 7.1 with quad faces: about twice the triangles for the same budget.
  quad: { endpoint: 'meshy/v7.1/image-to-3d', input: { topology: 'quad' } },
}

const MIME = { '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg' }
const POLL_MS = 5_000
const TIMEOUT_MS = 30 * 60_000

export function parseCli(argv) {
  const { values, positionals } = parseArgs({
    args: argv,
    allowPositionals: true,
    options: {
      out: { type: 'string' },
      model: { type: 'string', default: 'smart' },
      polycount: { type: 'string', default: '10000' },
      'no-pbr': { type: 'boolean', default: false },
    },
  })
  if (positionals.length === 0) throw new Error('Give at least one image path or URL.')
  if (!MODELS[values.model]) throw new Error(`--model must be one of: ${Object.keys(MODELS).join(', ')}`)
  const polycount = Number(values.polycount)
  if (!Number.isInteger(polycount) || polycount < 100 || polycount > 300_000) {
    throw new Error('--polycount must be a whole number from 100 to 300000.')
  }
  return { images: positionals, out: values.out, model: values.model, polycount, pbr: !values['no-pbr'] }
}

/** Image path or URL to a URL that fal accepts. A local file becomes a data: URL. */
export function toImageUrl(image) {
  if (/^(https?|data):/.test(image)) return image
  const mime = MIME[path.extname(image).toLowerCase()]
  if (!mime) throw new Error(`${image}: use a .png, .jpg, or .jpeg image. Meshy does not take WebP.`)
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

async function fal(url, key, init = {}) {
  const res = await fetch(url, { ...init, headers: { Authorization: `Key ${key}`, 'Content-Type': 'application/json' } })
  const body = await res.text()
  if (!res.ok) throw new Error(`fal ${res.status} for ${url}: ${body.slice(0, 500)}`)
  return JSON.parse(body)
}

async function download(url, file) {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Download failed (${res.status}): ${url}`)
  const buf = Buffer.from(await res.arrayBuffer())
  fs.writeFileSync(file, buf)
  return buf
}

async function run(image, index, opts, key) {
  const { endpoint, input } = MODELS[opts.model]
  const name = /^(https?|data):/.test(image) ? `mesh-${index + 1}` : path.parse(image).name
  const outDir = opts.out ?? (/^(https?|data):/.test(image) ? process.cwd() : path.dirname(path.resolve(image)))
  fs.mkdirSync(outDir, { recursive: true })
  const started = Date.now()

  const job = await fal(`https://queue.fal.run/${endpoint}`, key, {
    method: 'POST',
    body: JSON.stringify({ image_url: toImageUrl(image), target_polycount: opts.polycount, enable_pbr: opts.pbr, ...input }),
  })
  console.error(`${name}: submitted to ${endpoint} (${job.request_id})`)
  for (let last = ''; ; ) {
    if (Date.now() - started > TIMEOUT_MS) throw new Error(`${name}: no result after 30 minutes (${job.request_id}).`)
    await new Promise((r) => setTimeout(r, POLL_MS))
    const { status } = await fal(job.status_url, key)
    if (status !== last) console.error(`${name}: ${(last = status)}`)
    if (status === 'COMPLETED') break
  }
  const output = await fal(job.response_url, key)
  if (!output.model_glb?.url) throw new Error(`${name}: fal returned no model_glb: ${JSON.stringify(output).slice(0, 500)}`)

  const glbFile = path.join(outDir, `${name}.glb`)
  const glb = await download(output.model_glb.url, glbFile)
  const previewFile = output.thumbnail?.url ? path.join(outDir, `${name}.preview.png`) : null
  if (previewFile) await download(output.thumbnail.url, previewFile)
  const jsonFile = path.join(outDir, `${name}.json`)
  fs.writeFileSync(jsonFile, JSON.stringify({ endpoint, requestId: job.request_id, output }, null, 2))

  return {
    ok: true,
    image,
    endpoint,
    glb: glbFile,
    preview: previewFile,
    json: jsonFile,
    triangles: countTriangles(glb),
    sizeMB: +(glb.length / 1e6).toFixed(1),
    seconds: Math.round((Date.now() - started) / 1000),
  }
}

async function main() {
  const opts = parseCli(process.argv.slice(2))
  const key = process.env.FAL_KEY
  if (!key) throw new Error('Set the FAL_KEY env var to a fal.ai API key.')
  // All jobs go to the fal queue at the same time.
  const results = await Promise.allSettled(opts.images.map((image, i) => run(image, i, opts, key)))
  let failed = 0
  for (const [i, r] of results.entries()) {
    if (r.status === 'fulfilled') console.log(JSON.stringify(r.value))
    else {
      failed++
      console.log(JSON.stringify({ ok: false, image: opts.images[i], error: r.reason.message }))
    }
  }
  process.exitCode = failed ? 1 : 0
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((err) => {
    console.error(err.message)
    process.exitCode = 1
  })
}
