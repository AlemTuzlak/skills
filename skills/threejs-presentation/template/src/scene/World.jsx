import { Surface } from './Surface.jsx'

export function World() {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[20, 20]} />
        <meshStandardMaterial color="#161618" />
      </mesh>
      <mesh position={[0, 2, -1.2]}>
        <boxGeometry args={[8, 4, 0.2]} />
        <meshStandardMaterial color="#1c1c20" />
      </mesh>
      <mesh position={[-4, 2, 1.5]}>
        <boxGeometry args={[0.2, 4, 6]} />
        <meshStandardMaterial color="#141416" />
      </mesh>
      <mesh position={[4, 2, 1.5]}>
        <boxGeometry args={[0.2, 4, 6]} />
        <meshStandardMaterial color="#141416" />
      </mesh>
      <mesh position={[0, 0.4, 1.1]}>
        <boxGeometry args={[1.8, 0.8, 0.8]} />
        <meshStandardMaterial color="#2a2a2e" />
      </mesh>
      <mesh position={[0, 1.4, -0.04]}>
        <boxGeometry args={[1.72, 1.02, 0.08]} />
        <meshStandardMaterial color="#101012" />
      </mesh>
      <Surface />
      <ambientLight intensity={0.35} />
      <directionalLight position={[4, 6, 3]} intensity={1.1} />
      <pointLight position={[0, 2.2, 1.4]} intensity={0.6} color="#c8ff00" />
    </group>
  )
}
