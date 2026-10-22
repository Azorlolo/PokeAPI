import { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { Loader } from '@react-three/drei'
import { useFocus } from '../context/focus.js'
import CameraRig, { HOME_POSITION } from './CameraRig.jsx'
import Room from './Room.jsx'
import Tutorial from './Tutorial.jsx'

export default function Scene() {
  const { setFocused } = useFocus()

  return (
    <>
      <Canvas
        camera={{ position: HOME_POSITION.toArray(), fov: 60, near: 0.01, far: 100 }}
        dpr={[1, 2]}
        onPointerMissed={() => setFocused(null)}
      >
        <color attach="background" args={['#0f1117']} />
        <hemisphereLight args={['#ffffff', '#8a6f55', 1]} />
        <pointLight position={[0, 1.8, 0]} intensity={4} decay={1} />
        <directionalLight position={[2, 3, 1]} intensity={1} />

        <CameraRig />

        <Suspense fallback={null}>
          <Room />
        </Suspense>
      </Canvas>
      <Tutorial />
      <Loader />
    </>
  )
}
