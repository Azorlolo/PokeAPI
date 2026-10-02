import { Box3, Matrix3, Matrix4, Quaternion, Vector3 } from 'three'

// Écart entre la surface d'un écran et son contenu, pour éviter le scintillement
const SURFACE_OFFSET = 0.0003

// Nom de l'objet dans Blender, sans suffixe de doublon (« Up.001 » → « Up »)
export function blenderName(object) {
  return (object.userData.name ?? object.name).replace(/\.\d+$/, '')
}

// Boîte englobante de `root` dans son propre repère (indépendante de sa pose)
export function getLocalBounds(root) {
  root.updateWorldMatrix(true, true)
  const toRoot = root.matrixWorld.clone().invert()
  const bounds = new Box3()
  root.traverse((child) => {
    if (!child.isMesh) return
    if (!child.geometry.boundingBox) child.geometry.computeBoundingBox()
    const matrix = toRoot.clone().multiply(child.matrixWorld)
    bounds.union(child.geometry.boundingBox.clone().applyMatrix4(matrix))
  })
  return bounds
}

// Repère d'un écran plat dans le repère de `root` : centre (juste devant la surface),
// orientation (X vers la droite, Y vers le haut, Z sortant de l'écran) et dimensions
export function getScreenFrame(root, screen) {
  root.updateWorldMatrix(true, true)
  const toRoot = root.matrixWorld.clone().invert().multiply(screen.matrixWorld)
  const { position: positions, normal: normals } = screen.geometry.attributes

  const normal = new Vector3()
    .fromBufferAttribute(normals, 0)
    .applyNormalMatrix(new Matrix3().getNormalMatrix(toRoot))
  // Le haut de l'appareil, ramené dans le plan de l'écran
  const up = new Vector3(0, 1, 0).projectOnPlane(normal).normalize()
  const right = new Vector3().crossVectors(up, normal)

  // Étendue de l'écran le long de ces axes
  const min = new Vector3(Infinity, Infinity, 0)
  const max = new Vector3(-Infinity, -Infinity, 0)
  const vertex = new Vector3()
  let depth = 0
  for (let i = 0; i < positions.count; i++) {
    vertex.fromBufferAttribute(positions, i).applyMatrix4(toRoot)
    const x = vertex.dot(right)
    const y = vertex.dot(up)
    min.set(Math.min(min.x, x), Math.min(min.y, y), 0)
    max.set(Math.max(max.x, x), Math.max(max.y, y), 0)
    depth += vertex.dot(normal) / positions.count
  }

  return {
    position: new Vector3()
      .addScaledVector(right, (min.x + max.x) / 2)
      .addScaledVector(up, (min.y + max.y) / 2)
      .addScaledVector(normal, depth + SURFACE_OFFSET),
    quaternion: new Quaternion().setFromRotationMatrix(new Matrix4().makeBasis(right, up, normal)),
    width: max.x - min.x,
    height: max.y - min.y,
  }
}
