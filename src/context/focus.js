import { createContext, useContext } from 'react'

// Objet 3D actuellement mis au premier plan (null = vue d'ensemble)
export const FocusContext = createContext(null)
export const useFocus = () => useContext(FocusContext)

// true si le <Focusable> parent est au premier plan
export const IsFocusedContext = createContext(false)
export const useIsFocused = () => useContext(IsFocusedContext)
