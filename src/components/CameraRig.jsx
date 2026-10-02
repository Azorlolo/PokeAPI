import { useEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Box3, Euler, MathUtils, Quaternion, Sphere, Vector3 } from 'three'
import { useFocus } from '../context/focus.js'

// Vue d'ensemble : dans un coin de la pièce, tournée vers le lit
export const HOME_POSITION = new Vector3(-0.5, 1.6, 0)
const HOME_LOOK_AT = new Vector3(0.6, 0.7, -0.8)
const MAX_PITCH = Math.PI / 2 - 0.1

// Angles (lacet, tangage) pour regarder de `from` vers `to`
function anglesTowards(from, to) {
  const dir = to.clone().sub(from)
  return {
    yaw: Math.atan2(-dir.x, -dir.z),
    pitch: Math.atan2(dir.y, Math.hypot(dir.x, dir.z)),
  }
}

const HOME_VIEW = { position: HOME_POSITION, ...anglesTowards(HOME_POSITION, HOME_LOOK_AT) }

// Caméra fixe qui tourne sur elle-même quand on glisse (clic maintenu),
// et qui se place devant l'objet focus.
// sensitivity : radians par pixel ; speed : vitesse de transition
export default function CameraRig({ sensitivity = 0.004, focusDistance = 2.5, speed = 6 }) {
  const { focused } = useFocus()
  const gl = useThree((s) => s.gl)
  const drag = useRef({ yaw: 0, pitch: 0 }) // rotation ajoutée par l'utilisateur
  const euler = useRef(new Euler(0, 0, 0, 'YXZ'))
  const targetQuat = useRef(new Quaternion())

  // Position et orientation par défaut, recalculées quand le focus change.
  // Un objet qui vient lui-même vers la caméra (Pokédex) ne la déplace pas.
  const view = useMemo(() => {
    if (!focused || focused.userData.comesToCamera) return HOME_VIEW
    const sphere = new Box3().setFromObject(focused).getBoundingSphere(new Sphere())
    const position = sphere.center.clone().add(new Vector3(0, 0, sphere.radius * focusDistance))
    return { position, ...anglesTowards(position, sphere.center) }
  }, [focused, focusDistance])

  // Nouvelle vue : on repart de son orientation par défaut
  useEffect(() => {
    drag.current.yaw = 0
    drag.current.pitch = 0
  }, [view])

  // Clic maintenu + déplacement : rotation de la caméra
  useEffect(() => {
    const el = gl.domElement
    let last = null

    const onDown = (e) => {
      last = { x: e.clientX, y: e.clientY }
      el.style.cursor = 'grabbing'
    }
    const onMove = (e) => {
      if (!last) return
      drag.current.yaw += (e.clientX - last.x) * sensitivity
      drag.current.pitch += (e.clientY - last.y) * sensitivity
      last = { x: e.clientX, y: e.clientY }
    }
    const onUp = () => {
      last = null
      el.style.cursor = ''
    }

    el.addEventListener('pointerdown', onDown)
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    return () => {
      el.removeEventListener('pointerdown', onDown)
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }
  }, [gl, sensitivity])

  useFrame(({ camera }, delta) => {
    const t = 1 - Math.exp(-speed * delta)

    // On borne le tangage pour ne pas passer la tête à l'envers
    const pitch = MathUtils.clamp(view.pitch + drag.current.pitch, -MAX_PITCH, MAX_PITCH)
    drag.current.pitch = pitch - view.pitch

    euler.current.set(pitch, view.yaw + drag.current.yaw, 0)
    targetQuat.current.setFromEuler(euler.current)

    camera.position.lerp(view.position, t)
    camera.quaternion.slerp(targetQuat.current, t)
  })

  return null
}
