#!/usr/bin/env node
// Render standalone PNG assets for a Slidev deck:
//   - code snippets via Shiki
//   - Mermaid diagrams via a headless Chromium (Playwright)
//
// Library API:
//   renderCodeToPng({ code | in, lang, theme?, out, padding? }) -> out path
//   renderMermaidToPng({ definition | in, out, theme? }) -> out path
//
// CLI:
//   node render-asset.mjs --type code    --in snippet.ts --lang ts --theme vitesse-dark --out public/snippet.png
//   node render-asset.mjs --type mermaid --in diagram.mmd --out public/diagram.png

import { readFileSync, mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { createRequire } from 'node:module'
import { pathToFileURL } from 'node:url'

const require = createRequire(import.meta.url)

function ensureDir(out) {
  mkdirSync(dirname(resolve(out)), { recursive: true })
}

function readIfNeeded(value, inPath) {
  if (value && value.trim()) return value
  if (inPath) return readFileSync(resolve(inPath), 'utf8')
  return ''
}

async function withChromium(fn) {
  const { chromium } = await import('playwright')
  const browser = await chromium.launch()
  try {
    // deviceScaleFactor only takes effect alongside an explicit viewport — set both
    // so element screenshots come out at 2x (crisp) rather than silently 1x.
    const page = await browser.newPage({ viewport: { width: 1600, height: 900 }, deviceScaleFactor: 2 })
    return await fn(page)
  } finally {
    await browser.close()
  }
}

export async function renderCodeToPng({ code, in: inPath, lang = 'text', theme = 'vitesse-dark', out, padding = 24 }) {
  const source = readIfNeeded(code, inPath)
  if (!source || !source.trim()) throw new Error('renderCodeToPng: code is empty')
  if (!out) throw new Error('renderCodeToPng: out is required')
  ensureDir(out)

  const { codeToHtml } = await import('shiki')
  const highlighted = await codeToHtml(source, { lang, theme })

  const html = `<!doctype html><html><head><meta charset="utf-8"><style>
    *{margin:0;box-sizing:border-box}
    body{display:inline-block;padding:${padding}px}
    pre.shiki{padding:${padding}px;border-radius:10px;font-size:22px;line-height:1.5;
      font-family:'JetBrains Mono','Fira Code',ui-monospace,SFMono-Regular,Menlo,Consolas,monospace}
    code{font-family:inherit}
  </style></head><body>${highlighted}</body></html>`

  return withChromium(async (page) => {
    await page.setContent(html, { waitUntil: 'networkidle' })
    const target = (await page.$('pre.shiki')) ?? page.locator('body')
    await target.screenshot({ path: resolve(out) })
    return resolve(out)
  })
}

function resolveMermaidUmd() {
  // Resolve the package dir via its package.json (always exported), then the UMD bundle.
  const pkgJson = require.resolve('mermaid/package.json')
  return resolve(dirname(pkgJson), 'dist', 'mermaid.min.js')
}

export async function renderMermaidToPng({ definition, in: inPath, out, theme = 'default' }) {
  const def = readIfNeeded(definition, inPath)
  if (!def || !def.trim()) throw new Error('renderMermaidToPng: definition is empty')
  if (!out) throw new Error('renderMermaidToPng: out is required')
  ensureDir(out)

  // Inject the Mermaid bundle inline: Chromium refuses to load a file:// subresource
  // into an about:blank/data origin, so addScriptTag({ url }) fails. Read + inject content.
  const umdSrc = readFileSync(resolveMermaidUmd(), 'utf8')

  const html = `<!doctype html><html><head><meta charset="utf-8"><style>
    *{margin:0;box-sizing:border-box}
    body{display:inline-block;padding:24px;background:#fff}
    #out svg{max-width:none}
  </style></head><body><div id="out"></div></body></html>`

  return withChromium(async (page) => {
    await page.setContent(html, { waitUntil: 'networkidle' })
    await page.addScriptTag({ content: umdSrc })
    await page.evaluate(async ({ def, theme }) => {
      // eslint-disable-next-line no-undef
      mermaid.initialize({ startOnLoad: false, theme })
      // eslint-disable-next-line no-undef
      const { svg } = await mermaid.render('graph-out', def)
      document.getElementById('out').innerHTML = svg
    }, { def, theme })
    const el = await page.$('#out')
    await el.screenshot({ path: resolve(out) })
    return resolve(out)
  })
}

function parseArgs(argv) {
  const args = {}
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (a.startsWith('--')) {
      const key = a.slice(2)
      const next = argv[i + 1]
      if (next === undefined || next.startsWith('--')) { args[key] = true }
      else { args[key] = next; i++ }
    }
  }
  return args
}

async function main() {
  const a = parseArgs(process.argv.slice(2))
  if (!a.type || !a.out) {
    console.error('Usage: render-asset.mjs --type code|mermaid --out <png> [--in <file>] [--lang <lang>] [--theme <theme>]')
    process.exit(1)
  }
  let result
  if (a.type === 'code') {
    result = await renderCodeToPng({ in: a.in, lang: a.lang, theme: a.theme, out: a.out })
  } else if (a.type === 'mermaid') {
    result = await renderMermaidToPng({ in: a.in, theme: a.theme, out: a.out })
  } else {
    console.error(`Unknown --type "${a.type}" (expected code|mermaid)`)
    process.exit(1)
  }
  console.log(result)
}

// Run as CLI only when invoked directly.
if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  main().catch((err) => { console.error(err); process.exit(1) })
}
