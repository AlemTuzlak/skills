import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { isJobLimit, parseCli, readClips, saveAsset } from './uthana.mjs'

test('parseCli reads generate options', () => {
  assert.deepEqual(parseCli(['generate', 'clips.json', '--only', 'a,b', '--character', 'c1', '--fps', '60']), {
    command: 'generate',
    args: ['clips.json'],
    out: undefined,
    only: ['a', 'b'],
    character: 'c1',
    model: 'text-to-motion-3.0',
    fps: 60,
    autoRig: true,
  })
})

test('parseCli refuses an fps Uthana does not export', () => {
  assert.throws(() => parseCli(['generate', 'clips.json', '--fps', '25']), /--fps must be 24, 30, or 60/)
})

test('readClips refuses a duplicate name', () => {
  const clip = { name: 'idle', prompt: 'a heavy warrior stands low and breathes' }
  assert.throws(() => readClips(JSON.stringify([clip, clip])), /used twice/)
})

test('saveAsset writes the bytes of a data: URL asset', () => {
  const file = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'uthana-')), 'clip.fbx')
  const saved = saveAsset({ url: `data:application/fbx;base64,${Buffer.from('FBX').toString('base64')}`, format: 'fbx' }, file)
  assert.equal(fs.readFileSync(file, 'utf8'), 'FBX')
  assert.equal(saved.bytes, 3)
  fs.rmSync(path.dirname(file), { recursive: true })
})

test('isJobLimit spots the concurrent job limit', () => {
  assert.equal(isJobLimit(new Error('Uthana 429: {"code": "job_limit_exceeded"}')), true)
  assert.equal(isJobLimit(new Error('Uthana: Insufficient balance')), false)
})
