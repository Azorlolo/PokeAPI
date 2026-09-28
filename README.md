# PokeAPI 3D

Application web d'exploration interactive 3D des données de la [PokeAPI](https://pokeapi.co).

## Stack

- [React](https://react.dev) + [Vite](https://vite.dev)
- [Three.js](https://threejs.org) via [@react-three/fiber](https://r3f.docs.pmnd.rs) et [@react-three/drei](https://drei.docs.pmnd.rs)
- [React Router](https://reactrouter.com)
- Déploiement : [Netlify](https://www.netlify.com)

## Démarrage

```bash
npm install
npm run dev      # serveur de dev
npm run build    # build de production dans dist/
npm run preview  # prévisualiser le build
```

## Structure

```
docs/               Documents de préparation (wireframes, planning, schémas)
public/models/      Modèles 3D (.glb / .gltf)
src/
  components/       Composants UI et 3D (Header, Scene…)
  pages/            Pages routées (Explorer, About)
  services/         Appels API (pokeapi.js)
```

## Liens

- GitHub : _à compléter_
- Netlify : _à compléter_
