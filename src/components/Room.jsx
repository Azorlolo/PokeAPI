import { useGLTF } from '@react-three/drei'

const MODEL_URL = '/models/scene.glb'

// Décor de la chambre, exporté depuis Blender
export default function Room(props) {
  const { scene } = useGLTF(MODEL_URL)
  return <primitive object={scene} {...props} />
}

useGLTF.preload(MODEL_URL)
