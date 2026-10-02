import { useState } from 'react'
import { IsFocusedContext, useFocus } from '../context/focus.js'

// Enveloppe un objet 3D : un clic le met au premier plan
export default function Focusable({ children, ...props }) {
  const [object, setObject] = useState(null)
  const { focused, setFocused } = useFocus()
  const isFocused = object !== null && focused === object

  return (
    <group
      ref={setObject}
      {...props}
      onClick={(e) => {
        e.stopPropagation()
        // Un glisser pour tourner la caméra n'est pas un clic
        if (e.delta > 4) return
        setFocused(object)
      }}
      onPointerOver={(e) => {
        e.stopPropagation()
        if (!isFocused) document.body.style.cursor = 'pointer'
      }}
      onPointerOut={() => (document.body.style.cursor = 'auto')}
    >
      <IsFocusedContext.Provider value={isFocused}>{children}</IsFocusedContext.Provider>
    </group>
  )
}
