import { Text } from '@react-three/drei'
import { MeshBasicMaterial } from 'three'
import { useRemoteTexture } from '../hooks/useRemoteTexture.js'
import { TYPE_COLORS } from '../utils/formatEntry.js'

// Le contenu des écrans n'est pas éclairé ni retouché par le rendu : il « émet » sa couleur
const TEXT_MATERIAL = new MeshBasicMaterial({ toneMapped: false })

const COLORS = {
  screen: '#13191e', // fond des écrans sombres
  text: '#eaf6ff',
  muted: '#8fb6cf',
  shiny: '#ffd54a',
  lcd: '#a9d6a0', // fond de l'écran vert
  lcdText: '#123d16',
}

// Dimensions en mètres (l'écran principal fait environ 7 × 5 cm)
const PADDING = 0.003
const SMALL = 0.0036
const NAME = 0.0055
const TYPE = 0.005
const DESCRIPTION_MAX = 0.0042
const LINE_HEIGHT = 1.2
const FRONT = 0.0001 // le texte passe devant les images

// Place son contenu sur un écran : origine au centre, X vers la droite, Y vers le haut.
// Le fond opaque, non éclairé, imite un écran rétroéclairé et masque les reflets.
function Screen({ frame, background = COLORS.screen, children }) {
  return (
    <group position={frame.position} quaternion={frame.quaternion}>
      <mesh position={[0, 0, -FRONT]}>
        <planeGeometry args={[frame.width, frame.height]} />
        <meshBasicMaterial color={background} toneMapped={false} />
      </mesh>
      {children}
    </group>
  )
}

function Label(props) {
  return <Text material={TEXT_MATERIAL} anchorX="left" anchorY="top" lineHeight={LINE_HEIGHT} {...props} />
}

// Taille de police qui remplit au mieux la zone. Estimation : un caractère latin
// fait environ 0,55 fois sa hauteur de large, un idéogramme autant que sa hauteur.
function fitFontSize(text, width, height) {
  const charWidth = /[　-鿿가-힯]/.test(text) ? 1 : 0.55
  const size = Math.sqrt((width * height * 0.8) / (text.length * charWidth * LINE_HEIGHT))
  return Math.min(size, DESCRIPTION_MAX)
}

function SpriteScreen({ frame, number, entry, shiny }) {
  const texture = useRemoteTexture(shiny ? entry?.spriteShiny : entry?.sprite)
  const { width, height } = frame
  const left = -width / 2 + PADDING
  const top = height / 2 - PADDING
  const bottom = -height / 2 + PADDING

  // L'image occupe la place libre entre le numéro (en haut) et le nom (en bas)
  const imageTop = top - SMALL * LINE_HEIGHT
  const imageBottom = bottom + NAME * LINE_HEIGHT
  const aspect = texture ? texture.image.width / texture.image.height : 1
  const imageWidth = Math.min(width - 2 * PADDING, (imageTop - imageBottom) * aspect)

  return (
    <Screen frame={frame}>
      {texture && (
        <mesh position={[0, (imageTop + imageBottom) / 2, 0]}>
          <planeGeometry args={[imageWidth, imageWidth / aspect]} />
          <meshBasicMaterial map={texture} transparent toneMapped={false} />
        </mesh>
      )}
      <Label position={[left, top, FRONT]} fontSize={SMALL} color={COLORS.muted}>
        {number}
      </Label>
      {shiny && (
        <Label position={[-left, top, FRONT]} anchorX="right" fontSize={SMALL} color={COLORS.shiny}>
          Chromatique
        </Label>
      )}
      <Label position={[0, bottom, FRONT]} anchorX="center" anchorY="bottom" fontSize={NAME} color={COLORS.text}>
        {entry?.name ?? ''}
      </Label>
    </Screen>
  )
}

function InfoScreen({ frame, entry }) {
  const { width, height } = frame
  const left = -width / 2 + PADDING
  const rows = [
    ['Taille', entry?.height],
    ['Poids', entry?.weight],
  ]

  return (
    <Screen frame={frame} background={COLORS.lcd}>
      {rows.map(([label, value], i) => (
        // Une ligne centrée dans chaque moitié de l'écran
        <group key={label} position={[0, height / 4 - (i * height) / 2, 0]}>
          <Label position={[left, 0, 0]} anchorY="middle" fontSize={SMALL} color={COLORS.lcdText}>
            {label}
          </Label>
          <Label position={[-left, 0, 0]} anchorX="right" anchorY="middle" fontSize={SMALL} color={COLORS.lcdText}>
            {value ?? '–'}
          </Label>
        </group>
      ))}
    </Screen>
  )
}

function DescriptionScreen({ frame, entry, language, error }) {
  const { width, height } = frame
  const left = -width / 2 + PADDING
  const top = height / 2 - PADDING

  let text = entry?.description || 'Aucune description.'
  if (!entry) text = 'Chargement…'
  if (error) text = 'Impossible de joindre la PokeAPI. Vérifie ta connexion.'

  // Le texte remplit la zone sous la ligne de titre
  const bodyTop = top - SMALL * 1.6
  const bodyWidth = width - 2 * PADDING
  const bodyHeight = bodyTop + height / 2 - PADDING

  return (
    <Screen frame={frame}>
      <Label position={[left, top, FRONT]} fontSize={SMALL} color={COLORS.muted}>
        {entry?.genus ?? ''}
      </Label>
      <Label position={[-left, top, FRONT]} anchorX="right" fontSize={SMALL} color={COLORS.muted}>
        {language.toUpperCase()}
      </Label>
      <Label
        position={[left, bodyTop, FRONT]}
        fontSize={fitFontSize(text, bodyWidth, bodyHeight)}
        maxWidth={bodyWidth}
        overflowWrap="break-word"
        clipRect={[0, -bodyHeight, bodyWidth, 0]}
        color={COLORS.text}
      >
        {text}
      </Label>
    </Screen>
  )
}

// Badge à la couleur du type ; écran vide si le Pokémon n'a qu'un type
function TypeScreen({ frame, type }) {
  const { width, height } = frame

  return (
    <Screen frame={frame}>
      {type && (
        <>
          <mesh>
            <planeGeometry args={[width - 2 * PADDING, height - 2 * PADDING]} />
            <meshBasicMaterial color={TYPE_COLORS[type.id] ?? '#68a090'} toneMapped={false} />
          </mesh>
          <Label
            position={[0, 0, FRONT]}
            anchorX="center"
            anchorY="middle"
            fontSize={TYPE}
            color="#ffffff"
            outlineWidth={TYPE * 0.08}
            outlineColor="#000000"
            outlineOpacity={0.5}
          >
            {type.name}
          </Label>
        </>
      )}
    </Screen>
  )
}

// Contenu des écrans du Pokédex. `screens` contient le repère de chaque écran
// trouvé dans le modèle ; un écran absent n'est simplement pas affiché.
export default function PokedexScreens({ screens, number, entry, shiny, language, error }) {
  return (
    <>
      {screens.sprite && <SpriteScreen frame={screens.sprite} number={number} entry={entry} shiny={shiny} />}
      {screens.infos && <InfoScreen frame={screens.infos} entry={entry} />}
      {screens.description && (
        <DescriptionScreen frame={screens.description} entry={entry} language={language} error={error} />
      )}
      {screens.type1 && <TypeScreen frame={screens.type1} type={entry?.types[0]} />}
      {screens.type2 && <TypeScreen frame={screens.type2} type={entry?.types[1]} />}
    </>
  )
}
