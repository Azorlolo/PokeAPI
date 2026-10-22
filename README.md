# PokeAPI 3D

Scène 3D plein écran : une chambre de dresseur où un Pokédex 3D affiche les données de la [PokeAPI](https://pokeapi.co).

## Stack

- [React](https://react.dev) + [Vite](https://vite.dev)
- [Three.js](https://threejs.org) via [@react-three/fiber](https://r3f.docs.pmnd.rs) et [@react-three/drei](https://drei.docs.pmnd.rs)
- Déploiement : [Netlify](https://www.netlify.com)

## Démarrage

```bash
npm install
npm run dev      # serveur de dev
npm run build    # build de production dans dist/
npm run preview  # prévisualiser le build
```

## Interactions

Au démarrage, un tutoriel rappelle les commandes ; un clic ou une touche le ferme, la touche `I` (ou le bouton en bas à droite) l'affiche ou le masque.

- Clic maintenu + glisser : la caméra tourne sur elle-même
- Clic sur le Pokédex (sur le bureau) : il vient devant la caméra
- Clic dans le vide ou `Échap` : il retourne sur le bureau

### Pokédex

| Commande | Action |
|---|---|
| Croix ← → (ou flèches ← → du clavier) | Pokémon précédent / suivant |
| Croix ↑ ↓ (ou flèches ↑ ↓ du clavier) | +10 / −10 |
| Centre de la croix | Version normale / chromatique |
| Boutons bleus 001 à 009 | Premier Pokémon de la génération 1 à 9 |
| Bouton bleu 010 | Cri du Pokémon |
| Boutons blancs gauche / droite | Langue précédente / suivante |

Écrans : image, n° et nom (`Sprite`), taille et poids (`Informations`), catégorie et description (`Description`), types (`Type 1`, `Type 2`).

## Données

Endpoints de la PokeAPI utilisés (sans clé, réponses mises en cache) :

- `/pokemon/{id}` : taille, poids, types, images, cri
- `/pokemon-species/{id}` : noms, catégorie et descriptions traduits
- `/type/{nom}` : noms des types traduits
- `/generation/{n}` : premier Pokémon de chaque génération
- `/pokemon-species?limit=1` : nombre total de Pokémon

## Structure

```
docs/                   Documents de préparation (wireframes, planning, schémas)
public/models/          Modèle 3D de la scène (scene.glb)
src/
  components/
    Scene.jsx           Canvas, lumières
    CameraRig.jsx       Caméra (rotation au glisser + focus)
    Room.jsx            Chambre, et extraction du Pokédex fonctionnel
    Pokedex.jsx         Déplacement, boutons et clavier du Pokédex
    PokedexScreens.jsx  Contenu des écrans
    Tutorial.jsx        Overlay d'aide affiché au démarrage
    Focusable.jsx       Enveloppe rendant un objet cliquable / focusable
  context/              État du focus partagé
  hooks/                Chargement d'une fiche, d'une texture distante
  services/pokeapi.js   Appels à la PokeAPI (avec cache)
  utils/                Mise en forme des données, repères des écrans
```

## Liens

- Netlify : _à compléter_

## Recharger les textures après changements du modèle 3D

Faire la commande dans le terminal a la racine du projet :
```Bash
& "C:\Program Files\Blender Foundation\Blender 5.2\blender.exe" -b "C:\Users\IUT\Documents\3D\Untitled.blend" --python scripts/export_glb.py
```