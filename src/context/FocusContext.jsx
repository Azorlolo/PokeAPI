import { useEffect, useState } from 'react'
import { FocusContext } from './focus.js'

export function FocusProvider({ children }) {
  const [focused, setFocused] = useState(null)

  // Échap : retour à la vue d'ensemble
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && setFocused(null)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <FocusContext.Provider value={{ focused, setFocused }}>
      {children}
    </FocusContext.Provider>
  )
}
