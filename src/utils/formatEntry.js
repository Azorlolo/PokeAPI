// Langues parcourues par les boutons « Langues » (codes de la PokeAPI)
export const LANGUAGES = ['fr', 'en', 'de', 'es', 'it', 'ja', 'ko', 'zh-hans']

// Couleurs des types dans les jeux, pour les écrans Type 1 et Type 2
export const TYPE_COLORS = {
  normal: '#a8a77a',
  fire: '#ee8130',
  water: '#6390f0',
  electric: '#f7d02c',
  grass: '#7ac74c',
  ice: '#96d9d6',
  fighting: '#c22e28',
  poison: '#a33ea1',
  ground: '#e2bf65',
  flying: '#a98ff3',
  psychic: '#f95587',
  bug: '#a6b91a',
  rock: '#b6a136',
  ghost: '#735797',
  dragon: '#6f35fc',
  dark: '#705746',
  steel: '#b7b7ce',
  fairy: '#d685ad',
}

const decimal = new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })

export const formatNumber = (id) => `N°${String(id).padStart(4, '0')}`

// Texte dans la langue demandée, sinon en anglais, sinon le premier disponible.
// La dernière entrée d'une langue correspond au jeu le plus récent.
function translate(entries, language, key) {
  const inLanguage = (code) => entries.findLast((entry) => entry.language.name === code)
  return (inLanguage(language) ?? inLanguage('en') ?? entries[0])?.[key] ?? ''
}

// Les descriptions des jeux contiennent des retours à la ligne et des césures
function cleanText(text) {
  return text.replace(/­\s*/g, '').replace(/\s+/g, ' ').trim()
}

// Données brutes de l'API → textes et images affichés sur les écrans
export function formatEntry({ pokemon, species, types }, language) {
  const artwork = pokemon.sprites.other?.['official-artwork'] ?? {}
  return {
    name: translate(species.names, language, 'name'),
    genus: translate(species.genera, language, 'genus'),
    description: cleanText(translate(species.flavor_text_entries, language, 'flavor_text')),
    types: types.map((type) => ({ id: type.name, name: translate(type.names, language, 'name') })),
    // L'API donne la taille en décimètres et le poids en hectogrammes
    height: `${decimal.format(pokemon.height / 10)} m`,
    weight: `${decimal.format(pokemon.weight / 10)} kg`,
    sprite: artwork.front_default ?? pokemon.sprites.front_default,
    spriteShiny: artwork.front_shiny ?? pokemon.sprites.front_shiny,
    cry: pokemon.cries?.latest ?? pokemon.cries?.legacy,
  }
}
