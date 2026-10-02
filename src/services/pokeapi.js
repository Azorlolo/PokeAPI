const BASE_URL = 'https://pokeapi.co/api/v2'

// Chaque ressource n'est téléchargée qu'une fois (la PokeAPI demande de mettre en cache)
const cache = new Map()

function get(path) {
  if (!cache.has(path)) {
    const request = fetch(`${BASE_URL}${path}`).then((res) => {
      if (!res.ok) throw new Error(`PokeAPI ${res.status} sur ${path}`)
      return res.json()
    })
    // Une requête échouée est oubliée pour pouvoir être retentée
    request.catch(() => cache.delete(path))
    cache.set(path, request)
  }
  return cache.get(path)
}

export const getPokemon = (id) => get(`/pokemon/${id}`)
export const getSpecies = (id) => get(`/pokemon-species/${id}`)
export const getType = (name) => get(`/type/${name}`)
export const getGeneration = (id) => get(`/generation/${id}`)

// Nombre total d'espèces (1025 à la 9e génération)
export const getSpeciesCount = () => get('/pokemon-species?limit=1').then((data) => data.count)

// N° du premier Pokémon d'une génération (la liste de l'API n'est pas triée)
export const getGenerationStart = (id) =>
  getGeneration(id).then((generation) =>
    Math.min(...generation.pokemon_species.map((species) => Number(species.url.split('/').at(-2)))),
  )

// Tout ce qu'affiche une fiche du Pokédex : le Pokémon, son espèce et ses types
export async function getPokedexEntry(id) {
  const [pokemon, species] = await Promise.all([getPokemon(id), getSpecies(id)])
  const types = await Promise.all(pokemon.types.map(({ type }) => getType(type.name)))
  return { pokemon, species, types }
}
