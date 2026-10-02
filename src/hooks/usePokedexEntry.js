import { useEffect, useState } from 'react'
import { getPokedexEntry } from '../services/pokeapi.js'

// Charge la fiche d'un Pokémon. La fiche précédente reste affichée
// pendant le chargement, et en cas d'erreur réseau.
export function usePokedexEntry(id) {
  const [state, setState] = useState({ data: null, error: null })

  useEffect(() => {
    // Ignore la réponse si on est passé à un autre Pokémon entre-temps
    let cancelled = false
    getPokedexEntry(id)
      .then((data) => !cancelled && setState({ data, error: null }))
      .catch((error) => !cancelled && setState((previous) => ({ ...previous, error })))
    return () => {
      cancelled = true
    }
  }, [id])

  return state
}
