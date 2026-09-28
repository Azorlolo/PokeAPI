import { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'

// Conteneur 3D : caméra, lumières et contrôles.
// Ajoute tes objets / ta scène importée à la place du commentaire ci-dessous.
export default function Scene() {
  return (
    <Canvas camera={{ position: [0, 2, 6], fov: 50 }} dpr={[1, 2]}>
      <color attach="background" args={['#0f1117']} />
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 5, 5]} intensity={1} />

      <Suspense fallback={null}>
        {/* TODO: scène / objets 3D */}
      </Suspense>

      <OrbitControls makeDefault enableDamping />
    </Canvas>
  )
}
