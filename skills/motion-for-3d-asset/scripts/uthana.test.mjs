import { test } from 'node:test'
import assert from 'node:assert/strict'
import { downloadUrl, isJobLimit, jobOutcome, parseCli, readClips } from './uthana.mjs'

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

test('jobOutcome maps Uthana job states', () => {
  assert.deepEqual(jobOutcome({ status: 'RESERVED' }), { state: 'waiting' })
  assert.deepEqual(jobOutcome({ status: 'FINISHED', result: { exc: null, result: { id: 'm1' } } }), { state: 'done', motionId: 'm1' })
  assert.deepEqual(jobOutcome({ status: 'FINISHED', result: { exc: 'boom' } }), { state: 'failed', error: 'boom' })
  assert.deepEqual(jobOutcome({ status: 'FAILED', result: { exc: 'RuntimeError: stage 1' } }), { state: 'failed', error: 'RuntimeError: stage 1' })
})

test('downloadUrl builds the motion file path', () => {
  assert.equal(
    downloadUrl('cQqy57L59QaH', 'm9', 'glb', 30),
    'https://uthana.com/motion/file/motion_viewer/cQqy57L59QaH/m9/glb/uthana-m9.glb?fps=30',
  )
})

test('isJobLimit spots the concurrent job limit', () => {
  assert.equal(isJobLimit(new Error('Uthana 429: {"code": "job_limit_exceeded"}')), true)
  assert.equal(isJobLimit(new Error('Uthana: Insufficient balance')), false)
})
