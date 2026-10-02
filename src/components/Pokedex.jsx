import { Suspense, useEffect, useEffectEvent, useMemo, useRef, useState } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Euler, MathUtils, Quaternion, Vector3 } from 'three'
import { useFocus } from '../context/focus.js'
import { usePokedexEntry } from '../hooks/usePokedexEntry.js'
import { getGenerationStart, getSpeciesCount } from '../services/pokeapi.js'
import { LANGUAGES, formatEntry, formatNumber } from '../utils/formatEntry.js'
import { blenderName, getLocalBounds, getScreenFrame } from '../utils/screenFrame.js'
import PokedexScreens from './PokedexScreens.jsx'

// Boutons du modèle (nom Blender sans suffixe « .001 ») → commande
const BUTTONS = {
  Left: { browse: -1 },
  Right: { browse: 1 },
  Up: { browse: 10 },
  Down: { browse: -10 },
  Center: { toggleShiny: true },
  Gauche: { language: -1 },
  Droit: { language: 1 },
  '001': { generation: 1 },
  '002': { generation: 2 },
  '003': { generation: 3 },
  '004': { generation: 4 },
  '005': { generation: 5 },
  '006': { generation: 6 },
  '007': { generation: 7 },
  '008': { generation: 8 },
  '009': { generation: 9 },
  '010': { cry: true },
}

// Flèches du clavier → bouton de la croix directionnelle
const KEYS = { ArrowLeft: 'Left', ArrowRight: 'Right', ArrowUp: 'Up', ArrowDown: 'Down' }

// Écrans du modèle (nom Blender) → écran affiché par PokedexScreens
const SCREENS = {
  Sprite: 'sprite',
  Informations: 'infos',
  Description: 'description',
  'Type 1': 'type1',
  'Type 2': 'type2',
}

// Orientation face caméra : l'écran (axe local X) vers la caméra,
// le haut de l'appareil (axe local Y) vers le haut de l'écran
const INSPECT_ROTATION = new Quaternion().setFromEuler(new Euler(0, -Math.PI / 2, 0))
// Part de la hauteur ou de la largeur de l'écran occupée par le Pokédex consulté
const INSPECT_FILL = 0.85
// Nombre de Pokémon tant que l'API n'a pas répondu
const DEFAULT_COUNT = 1025
// Enfoncement d'un bouton pressé (m) et durée (s)
const PRESS_DEPTH = 0.0015
const PRESS_TIME = 0.12

// Reste dans [1, count] en bouclant : après le dernier, on revient au premier
const wrap = (id, count) => ((((id - 1) % count) + count) % count) + 1

// Pose au repos, encombrement, écrans et boutons du modèle
function readModel(object) {
  const bounds = getLocalBounds(object)
  const screens = {}
  const buttons = {}
  object.traverse((child) => {
    const name = blenderName(child)
    if (BUTTONS[name]) buttons[name] = child
    if (SCREENS[name] && child.isMesh) screens[SCREENS[name]] = getScreenFrame(object, child)
  })

  // Encombrement une fois tourné vers la caméra : x = largeur, y = hauteur, z = profondeur
  const size = bounds.getSize(new Vector3()).applyQuaternion(INSPECT_ROTATION)
  size.set(Math.abs(size.x), Math.abs(size.y), Math.abs(size.z))

  return {
    position: object.position.clone(),
    quaternion: object.quaternion.clone(),
    center: bounds.getCenter(new Vector3()),
    size,
    screens,
    buttons,
  }
}

// Distance à laquelle le Pokédex tient entièrement à l'écran, quel que soit son format
function fitDistance(size, camera) {
  const tan = Math.tan(MathUtils.degToRad(camera.fov) / 2)
  const byHeight = size.y / (2 * tan * INSPECT_FILL)
  const byWidth = size.x / (2 * tan * camera.aspect * INSPECT_FILL)
  return Math.max(byHeight, byWidth) + size.z / 2
}

// Pokédex fonctionnel de la scène. Un clic l'amène devant la caméra ;
// une fois consulté, ses boutons (et les flèches du clavier) le pilotent.
export default function Pokedex({ object, speed = 6 }) {
  const { focused, setFocused } = useFocus()
  const isOpen = focused === object
  const camera = useThree((state) => state.camera)

  // Analysé une seule fois, sur le modèle au repos (mémorisé sur l'objet pour
  // survivre aux rechargements à chaud, où le Pokédex peut être déplacé)
  const model = useMemo(() => {
    object.userData.model ??= readModel(object)
    return object.userData.model
  }, [object])

  const [id, setId] = useState(1)
  const [count, setCount] = useState(DEFAULT_COUNT)
  const [language, setLanguage] = useState(0)
  const [shiny, setShiny] = useState(false)
  const { data, error } = usePokedexEntry(id)
  const entry = useMemo(() => data && formatEntry(data, LANGUAGES[language]), [data, language])

  useEffect(() => {
    // Hors ligne, on garde la valeur par défaut
    getSpeciesCount()
      .then(setCount)
      .catch(() => {})
  }, [])

  const audio = useRef(null)
  const press = useRef(null)

  function run(command) {
    if (command.browse) setId((current) => wrap(current + command.browse, count))
    if (command.language) {
      setLanguage((current) => (current + command.language + LANGUAGES.length) % LANGUAGES.length)
    }
    if (command.toggleShiny) setShiny((current) => !current)
    if (command.generation) {
      getGenerationStart(command.generation)
        .then(setId)
        .catch(() => {})
    }
    if (command.cry && entry?.cry) {
      audio.current?.pause()
      audio.current = new Audio(entry.cry)
      audio.current.volume = 0.4
      audio.current.play().catch(() => {}) // format non pris en charge par le navigateur
    }
  }

  // Enfonce le bouton le long du regard, vers l'intérieur de l'appareil
  function animatePress(button) {
    if (!button) return
    if (press.current) press.current.button.position.copy(press.current.rest)
    const toParent = button.parent.matrixWorld.clone().invert()
    const offset = camera
      .getWorldDirection(new Vector3())
      .transformDirection(toParent)
      .multiplyScalar(PRESS_DEPTH)
    press.current = { button, rest: button.position.clone(), offset, time: 0 }
  }

  function pressButton(name) {
    run(BUTTONS[name])
    animatePress(model.buttons[name])
  }

  // Les flèches du clavier agissent comme la croix, quand le Pokédex est consulté
  const onKeyDown = useEffectEvent((e) => {
    const name = KEYS[e.key]
    if (!name) return
    e.preventDefault()
    pressButton(name)
  })
  useEffect(() => {
    if (!isOpen) return
    const listener = (e) => onKeyDown(e)
    window.addEventListener('keydown', listener)
    return () => window.removeEventListener('keydown', listener)
  }, [isOpen])

  const target = useRef({ position: new Vector3(), quaternion: new Quaternion(), offset: new Vector3() })

  useFrame((state, delta) => {
    const t = 1 - Math.exp(-speed * delta)
    const { position, quaternion, offset } = target.current

    if (isOpen) {
      quaternion.copy(camera.quaternion).multiply(INSPECT_ROTATION)
      // Point devant la caméra, corrigé pour que le centre du modèle y tombe
      offset.copy(model.center).applyQuaternion(quaternion)
      position
        .set(0, 0, -fitDistance(model.size, camera))
        .applyQuaternion(camera.quaternion)
        .add(camera.position)
        .sub(offset)
    } else {
      position.copy(model.position)
      quaternion.copy(model.quaternion)
    }

    object.position.lerp(position, t)
    object.quaternion.slerp(quaternion, t)

    // Bouton pressé : reste enfoncé un court instant
    const pressed = press.current
    if (pressed) {
      pressed.time += delta
      pressed.button.position.copy(pressed.rest)
      if (pressed.time < PRESS_TIME) pressed.button.position.add(pressed.offset)
      else press.current = null
    }
  })

  const handleClick = (e) => {
    e.stopPropagation()
    // Un glisser pour tourner la caméra n'est pas un clic
    if (e.delta > 4) return
    if (!isOpen) {
      setFocused(object)
      return
    }

    const name = blenderName(e.object)
    if (BUTTONS[name]) pressButton(name)
  }

  // Main sur tout le Pokédex quand il est sur le bureau, seulement sur les boutons ensuite
  const updateCursor = (e) => {
    e.stopPropagation()
    const clickable = !isOpen || BUTTONS[blenderName(e.object)]
    document.body.style.cursor = clickable ? 'pointer' : 'auto'
  }

  return (
    <primitive
      object={object}
      onClick={handleClick}
      onPointerMove={updateCursor}
      onPointerOut={() => (document.body.style.cursor = 'auto')}
    >
      <Suspense fallback={null}>
        <PokedexScreens
          screens={model.screens}
          number={formatNumber(id)}
          entry={entry}
          shiny={shiny}
          language={LANGUAGES[language]}
          error={error}
        />
      </Suspense>
    </primitive>
  )
}
