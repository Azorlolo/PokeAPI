const BASE_URL = 'https://pokeapi.co/api/v2'

async function get(path) {
  const res = await fetch(`${BASE_URL}${path}`)
  if (!res.ok) throw new Error(`PokeAPI ${res.status} on ${path}`)
  return res.json()
}

export function getPokemonList(limit = 151, offset = 0) {
  return get(`/pokemon?limit=${limit}&offset=${offset}`)
}

export function getPokemon(idOrName) {
  return get(`/pokemon/${idOrName}`)
}

export function getTypes() {
  return get('/type')
}
