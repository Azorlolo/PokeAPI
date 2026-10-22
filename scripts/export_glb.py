"""
Exporte la chambre Blender en .glb lisible par Three.js, sans toucher au .blend.

L'exportateur glTF ne comprend que le Principled BSDF : les matériaux faits
de Mix Shader / Glossy / Diffuse sortent vides (blancs dans le navigateur).
Ce script les convertit en Principled BSDF dans la scène chargée en mémoire,
puis exporte avec les réglages enregistrés dans le .blend. Le .blend n'est
jamais sauvegardé.

Usage, depuis la racine du projet :
  "C:/Program Files/Blender Foundation/Blender 5.2/blender.exe" -b "C:/Users/IUT/Documents/3D/Untitled.blend" --python scripts/export_glb.py
  (ajouter `-- chemin/sortie.glb` pour changer la destination)
"""
import os
import sys

import bpy

DEFAULT_OUTPUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'public', 'models', 'scene.glb')
# Sans environnement dans la scène web, un métal à 1 paraît noir
GLOSSY_METALLIC = 0.3
BASE_COLOR_HINTS = ('diffuse', 'albedo', 'basecolor', 'base_color', 'color')


def linked_node(socket):
    return socket.links[0].from_node if socket.is_linked else None


def active_output(tree):
    outputs = [n for n in tree.nodes if n.type == 'OUTPUT_MATERIAL']
    return next((n for n in outputs if n.is_active_output), outputs[0] if outputs else None)


def color_of(socket):
    """Couleur constante d'une entrée (directe, nœud RGB ou ColorRamp), sinon None."""
    node = linked_node(socket)
    if node is None:
        return tuple(socket.default_value)
    if node.type == 'RGB':
        return tuple(node.outputs[0].default_value)
    if node.type == 'VALTORGB':
        return tuple(node.color_ramp.evaluate(0.5))
    return None


def image_of(socket):
    node = linked_node(socket)
    return node if node is not None and node.type == 'TEX_IMAGE' else None


def value_of(socket, default):
    return default if socket.is_linked else socket.default_value


def lerp(a, b, t):
    if a is None or b is None:
        return a if b is None else b
    if isinstance(a, float):
        return a + (b - a) * t
    return tuple(x + (y - x) * t for x, y in zip(a, b))


def analyse(node):
    """Résume un arbre de shaders en propriétés PBR simples."""
    if node is None:
        return None
    if node.type == 'BSDF_PRINCIPLED':
        return {'color': color_of(node.inputs['Base Color']), 'image': image_of(node.inputs['Base Color']),
                'roughness': value_of(node.inputs['Roughness'], 0.5), 'metallic': value_of(node.inputs['Metallic'], 0.0)}
    if node.type == 'BSDF_DIFFUSE':
        return {'color': color_of(node.inputs['Color']), 'image': image_of(node.inputs['Color']),
                'roughness': 0.8, 'metallic': 0.0}
    if node.type == 'BSDF_GLOSSY':
        return {'color': color_of(node.inputs['Color']), 'image': image_of(node.inputs['Color']),
                'roughness': value_of(node.inputs['Roughness'], 0.3), 'metallic': GLOSSY_METALLIC, 'glossy': True}
    if node.type == 'BSDF_TRANSPARENT':
        return {'transparent': True}
    if node.type == 'EMISSION':
        return {'color': (0, 0, 0, 1), 'emission': color_of(node.inputs['Color']),
                'strength': value_of(node.inputs['Strength'], 1.0)}
    if node.type in ('MIX_SHADER', 'ADD_SHADER'):
        offset = 1 if node.type == 'MIX_SHADER' else 0
        fac = value_of(node.inputs[0], 0.5) if offset else 0.5
        return mix(analyse(linked_node(node.inputs[offset])), analyse(linked_node(node.inputs[offset + 1])), fac)
    if node.type == 'GROUP':
        color = next((color_of(i) for i in node.inputs if i.type == 'RGBA'), None)
        return {'color': color} if color else None
    return None


def mix(a, b, fac):
    if not a or not b:
        return a or b
    if a.get('transparent'):
        return {**b, 'alpha': b.get('alpha', 1.0) * fac}
    if b.get('transparent'):
        return {**a, 'alpha': a.get('alpha', 1.0) * (1 - fac)}
    # Un reflet Glossy posé sur un Diffuse : la couleur vient du Diffuse
    if a.get('glossy') != b.get('glossy'):
        base, gloss = (b, a) if a.get('glossy') else (a, b)
        return {**base, 'roughness': gloss['roughness'], 'metallic': 0.0}
    result = dict(a)
    for key in ('color', 'roughness', 'metallic'):
        result[key] = lerp(a.get(key), b.get(key), fac)
    result['alpha'] = lerp(a.get('alpha', 1.0), b.get('alpha', 1.0), fac)
    result['image'] = a.get('image') or b.get('image')
    return result


def upstream_images(socket):
    found, stack, seen = [], [linked_node(socket)], set()
    while stack:
        node = stack.pop()
        if node is None or node.name in seen:
            continue
        seen.add(node.name)
        if node.type == 'TEX_IMAGE' and node.image:
            found.append(node)
        stack.extend(linked_node(i) for i in node.inputs)
    return found


def fix_base_color(mat, bsdf):
    """Base Color passant par des nœuds intermédiaires : on rebranche l'image de couleur, ou on fige la couleur."""
    socket = bsdf.inputs['Base Color']
    node = linked_node(socket)
    # Les groupes de nœuds sont suivis par l'exportateur
    if node is None or node.type in ('TEX_IMAGE', 'GROUP'):
        return
    images = upstream_images(socket)
    pick = next((n for n in images if any(h in n.image.name.lower() for h in BASE_COLOR_HINTS)), None)
    if pick:
        mat.node_tree.links.new(pick.outputs['Color'], socket)
        print(f"  {mat.name}: Base Color <- image {pick.image.name}")
        return
    color = color_of(socket)
    if color:
        mat.node_tree.links.remove(socket.links[0])
        socket.default_value = color
        print(f"  {mat.name}: Base Color figée à {tuple(round(c, 3) for c in color)}")
    else:
        print(f"  {mat.name}: Base Color procédurale non convertible, à « cuire » (Bake) dans une image")


def convert_material(mat):
    tree = mat.node_tree
    out = active_output(tree) if tree else None
    if out is None:
        return
    shader = linked_node(out.inputs['Surface'])
    if shader is None or shader.type == 'EMISSION':
        return
    if shader.type == 'BSDF_PRINCIPLED':
        fix_base_color(mat, shader)
        return

    props = analyse(shader) or {}
    bsdf = tree.nodes.new('ShaderNodeBsdfPrincipled')
    color = props.get('color') or tuple(mat.diffuse_color)
    bsdf.inputs['Base Color'].default_value = color
    if props.get('image'):
        tree.links.new(props['image'].outputs['Color'], bsdf.inputs['Base Color'])
    bsdf.inputs['Roughness'].default_value = props.get('roughness', 0.5)
    bsdf.inputs['Metallic'].default_value = props.get('metallic', 0.0)
    if props.get('emission'):
        bsdf.inputs['Emission Color'].default_value = props['emission']
        bsdf.inputs['Emission Strength'].default_value = props['strength']
    alpha = props.get('alpha', 1.0)
    if alpha < 1.0:
        bsdf.inputs['Alpha'].default_value = alpha
        mat.surface_render_method = 'BLENDED'
    tree.links.new(bsdf.outputs['BSDF'], out.inputs['Surface'])
    print(f"  {mat.name}: {shader.type} -> Principled, couleur {tuple(round(c, 3) for c in color)}"
          + (f", alpha {alpha:.2f}" if alpha < 1.0 else ''))


def warn_non_uniform_parents(scene):
    """Un parent à échelle non uniforme déforme ses enfants tournés (cisaillement perdu à l'export)."""
    for obj in scene.objects:
        scale = obj.scale
        if not obj.children or max(scale) - min(scale) < 1e-3 * max(scale):
            continue
        rotated = [c.name for c in obj.children if c.matrix_basis.to_quaternion().angle > 1e-3]
        if rotated:
            print(f"  ATTENTION {obj.name}: échelle non uniforme, enfants déformés {rotated} -> Ctrl+A > Scale sur {obj.name}")


def export(scene, output):
    stored = dict(scene.get('glTF2ExportSettings', {}))
    allowed = bpy.ops.export_scene.gltf.get_rna_type().properties.keys()
    settings = {k: v for k, v in stored.items() if k in allowed}
    settings.update(filepath=output, export_format='GLB')
    bpy.ops.export_scene.gltf(**settings)


def main():
    if not bpy.app.background:
        raise RuntimeError("À lancer en ligne de commande avec -b : ce script modifie les matériaux de la scène ouverte.")
    argv = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
    output = os.path.abspath(argv[0] if argv else DEFAULT_OUTPUT)
    scene = bpy.context.scene

    print('\nMatériaux :')
    for mat in bpy.data.materials:
        if mat.users:
            convert_material(mat)
    print('\nÉchelles :')
    warn_non_uniform_parents(scene)

    export(scene, output)
    print(f'\nExporté : {output}')


main()
