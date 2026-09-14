import { useLayoutEffect, useMemo } from 'react'
import * as THREE from 'three'
import { useTalk } from '../store.js'
import { paint, CANVAS_SIZE } from '../catalog/paint.js'

export function Surface() {
  const slide = useTalk((s) => s.slides[s.index])
  const step = useTalk((s) => s.step)
  const theme = useTalk((s) => s.talk.theme)

  const texture = useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = CANVAS_SIZE.w
    canvas.height = CANVAS_SIZE.h
    const map = new THREE.CanvasTexture(canvas)
    map.colorSpace = THREE.SRGBColorSpace
    return map
  }, [])

  useLayoutEffect(() => {
    paint(texture.image, slide, step, theme)
    texture.needsUpdate = true
  }, [slide, step, theme, texture])

  return (
    <mesh position={[0, 1.4, 0.02]}>
      <planeGeometry args={[1.6, 0.9]} />
      <meshBasicMaterial map={texture} toneMapped={false} />
    </mesh>
  )
}
