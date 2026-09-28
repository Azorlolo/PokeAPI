import Scene from '../components/Scene.jsx'

export default function Explorer() {
  return (
    <div className="explorer">
      <aside className="explorer-panel">
        {/* TODO: filtres / infos du Pokémon sélectionné */}
      </aside>
      <div className="explorer-canvas">
        <Scene />
      </div>
    </div>
  )
}
