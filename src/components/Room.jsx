import { useMemo } from 'react'
import { useGLTF } from '@react-three/drei'
import Pokedex from './Pokedex.jsx'

const MODEL_URL = '/models/scene.glb'

// Décor de la chambre, exporté depuis Blender.
// Le Pokédex fonctionnel en est extrait pour être interactif.
export default function Room(props) {
  const { scene } = useGLTF(MODEL_URL)
  const pokedex = useMemo(() => {
    const object = scene.getObjectByName('Pokedex')
    // Lu par CameraRig : la caméra reste en place quand on le consulte
    if (object) object.userData.comesToCamera = true
    return object
  }, [scene])

  return (
    <>
      <primitive object={scene} {...props} />
      {pokedex && <Pokedex object={pokedex} />}
    </>
  )
}

useGLTF.preload(MODEL_URL)
