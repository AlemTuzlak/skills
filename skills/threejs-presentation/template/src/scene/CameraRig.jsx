import { useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { useTalk } from '../store.js'

const look = new THREE.Vector3()
const pos = new THREE.Vector3()

export function CameraRig() {
  const index = useTalk((s) => s.index)
  const slides = useTalk((s) => s.slides)
  const camera = useThree((s) => s.camera)
  const booted = useRef(false)
  const currentLook = useRef(new THREE.Vector3())
  const waypoint = slides[index].camera

  useFrame((_, delta) => {
    pos.set(...waypoint.position)
    look.set(...waypoint.lookAt)
    if (!booted.current) {
      camera.position.copy(pos)
      currentLook.current.copy(look)
      camera.lookAt(currentLook.current)
      booted.current = true
      return
    }
    const t = 1 - Math.pow(0.0008, delta)
    camera.position.lerp(pos, t)
    currentLook.current.lerp(look, t)
    camera.lookAt(currentLook.current)
  })

  return null
}
