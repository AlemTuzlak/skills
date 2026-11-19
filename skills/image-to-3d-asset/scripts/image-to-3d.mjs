#!/usr/bin/env node
// Turns images into game-ready 3D meshes (GLB) with fal.ai Meshy models,
// through TanStack AI (generate3DModel + the fal 3D adapter).
// Node 20+. Run `npm install` in this folder once. Reads the fal key from the FAL_KEY env var.
import fs from 'node:fs'
import path from 'node:path'
import { parseArgs } from 'node:util'
import { pathToFileURL } from 'node:url'
import { generate3DModel } from '@tanstack/ai'
import { fal3DModel } from '@tanstack/ai-fal'

export const MODELS = {
  // Meshy Smart Topology: clean triangles, keeps to the polycount budget.
  smart: { endpoint: 'meshy/t2.5/image-to-3d', input: {} },
  // Meshy 7.1 with quad faces: about twice the triangles for the same budget.
  quad: { endpoint: 'meshy/v7.1/image-to-3d', input: { topology: 'quad' } },
}

const MIME = { '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg' }
const POLL_MS = 5_000
// At this limit TanStack AI stops the wait and cancels the fal job.
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

async function download(url, file) {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Download failed (${res.status}): ${url}`)
  const buf = Buffer.from(await res.arrayBuffer())
  fs.writeFileSync(file, buf)
  return buf
}

async function run(image, index, opts) {
  const { endpoint, input } = MODELS[opts.model]
  const name = /^(https?|data):/.test(image) ? `mesh-${index + 1}` : path.parse(image).name
  const outDir = opts.out ?? (/^(https?|data):/.test(image) ? process.cwd() : path.dirname(path.resolve(image)))
  fs.mkdirSync(outDir, { recursive: true })
  const started = Date.now()

  console.error(`${name}: sent to ${endpoint}`)
  const result = await generate3DModel({
    adapter: fal3DModel(endpoint),
    threadId: `image-to-3d-${name}`,
    prompt: [{ type: 'image', source: { type: 'url', value: toImageUrl(image) } }],
    modelOptions: { target_polycount: opts.polycount, enable_pbr: opts.pbr, ...input },
    wait: true,
    pollInterval: POLL_MS,
    timeout: TIMEOUT_MS,
  })
  if (result.format !== 'glb') throw new Error(`${name}: fal returned no GLB (main file is ${result.format}).`)

  const glbFile = path.join(outDir, `${name}.glb`)
  const glb = await download(result.url, glbFile)
  const previewFile = result.previewImageUrl ? path.join(outDir, `${name}.preview.png`) : null
  if (previewFile) await download(result.previewImageUrl, previewFile)
  const jsonFile = path.join(outDir, `${name}.json`)
  fs.writeFileSync(jsonFile, JSON.stringify({ endpoint, ...result }, null, 2))

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
  if (!process.env.FAL_KEY) throw new Error('Set the FAL_KEY env var to a fal.ai API key.')
  // All jobs go to the fal queue at the same time.
  const results = await Promise.allSettled(opts.images.map((image, i) => run(image, i, opts)))
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
