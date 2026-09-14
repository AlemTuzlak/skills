import { useEffect } from 'react'
import { Canvas } from '@react-three/fiber'
import { useTalk } from './store.js'
import { bindNav } from './nav.js'
import { World } from './scene/World.jsx'
import { CameraRig } from './scene/CameraRig.jsx'
import { Hud } from './hud/Hud.jsx'
import { FlatView } from './flat/FlatView.jsx'

export function App() {
  const bootFromUrl = useTalk((s) => s.bootFromUrl)
  const flat = useTalk.getState().isFlat()

  useEffect(() => {
    bootFromUrl()
    return bindNav(useTalk)
  }, [bootFromUrl])

  if (flat) {
    return (
      <>
        <FlatView />
        <Hud />
      </>
    )
  }

  return (
    <>
      <Canvas camera={{ fov: 42, near: 0.1, far: 80 }} dpr={[1, 2]}>
        <color attach="background" args={['#0b0b0c']} />
        <CameraRig />
        <World />
      </Canvas>
      <Hud />
    </>
  )
}
