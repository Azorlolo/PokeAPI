import { useEffect, useState } from 'react'
import { SRGBColorSpace, TextureLoader } from 'three'

const loader = new TextureLoader()

// Texture chargée depuis une URL. L'ancienne reste affichée
// jusqu'à ce que la nouvelle soit prête.
export function useRemoteTexture(url) {
  const [texture, setTexture] = useState(null)

  useEffect(() => {
    if (!url) return
    let cancelled = false
    loader.load(url, (loaded) => {
      if (cancelled) return loaded.dispose()
      loaded.colorSpace = SRGBColorSpace
      setTexture(loaded)
    })
    return () => {
      cancelled = true
    }
  }, [url])

  // Libère la mémoire de la texture remplacée
  useEffect(() => () => texture?.dispose(), [texture])

  return texture
}
