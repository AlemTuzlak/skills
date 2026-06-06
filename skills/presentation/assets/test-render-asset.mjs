// Smoke test for render-asset.mjs. Run: node test-render-asset.mjs
import assert from 'node:assert/strict'
import { existsSync, statSync, rmSync, mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { renderCodeToPng, renderMermaidToPng } from './render-asset.mjs'

const dir = mkdtempSync(join(tmpdir(), 'render-asset-'))
try {
  // code -> png
  const code = await renderCodeToPng({
    code: 'const x = 1\nconsole.log(x)',
    lang: 'ts',
    theme: 'vitesse-dark',
    out: join(dir, 'code.png'),
  })
  assert.ok(existsSync(code), 'code png exists')
  assert.ok(statSync(code).size > 0, 'code png non-empty')

  // mermaid -> png
  const dia = await renderMermaidToPng({
    definition: 'graph TD; A-->B; B-->C',
    out: join(dir, 'dia.png'),
  })
  assert.ok(existsSync(dia), 'mermaid png exists')
  assert.ok(statSync(dia).size > 0, 'mermaid png non-empty')

  // empty input rejects
  await assert.rejects(
    () => renderCodeToPng({ code: '', lang: 'ts', out: join(dir, 'x.png') }),
    /empty/i,
    'empty code rejects',
  )

  console.log('PASS')
} finally {
  rmSync(dir, { recursive: true, force: true })
}
