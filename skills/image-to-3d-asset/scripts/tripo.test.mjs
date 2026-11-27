import assert from 'node:assert/strict'
import test from 'node:test'
import { parseCli, presetName, viewKeys } from './tripo.mjs'

test('view keys default to front, right, back for a turnaround sheet', () => {
  assert.deepEqual(viewKeys(3), ['front', 'right', 'back'])
  assert.deepEqual(viewKeys(2, 'front,back'), ['front', 'back'])
  assert.throws(() => viewKeys(2, 'back,front'), /first image must be the front/)
  assert.throws(() => viewKeys(2, 'front,front'), /same view two times/)
})

test('preset names get the biped prefix', () => {
  assert.equal(presetName('cast_a_spell'), 'preset:biped:cast_a_spell')
  assert.equal(presetName('preset:idle'), 'preset:idle')
  assert.throws(() => presetName('Cast A Spell'), /preset list/)
})

test('parseCli checks the commands', () => {
  const mesh = parseCli(['mesh', 'a.png', 'b.png', '--via', 'fal', '--out', 'x'])
  assert.deepEqual(mesh.keys, ['front', 'right'])
  assert.equal(mesh.via, 'fal')
  assert.throws(() => parseCli(['animate', '--presets', 'a,b,c,d,e,f']), /1 to 5 presets/)
  assert.throws(() => parseCli(['rig', '--spec', 'unreal']), /mixamo, tripo for the v1 rig/)
  assert.equal(parseCli(['rig', '--model', 'v3', '--spec', 'unity']).model, 'v3.0-20260909')
  assert.throws(() => parseCli(['rig', '--model', 'v2']), /v1 or v3/)
})
