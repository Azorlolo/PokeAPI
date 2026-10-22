import { useEffect, useState } from 'react'

// Touche qui affiche / masque le tutoriel
const TOGGLE_KEY = 'i'

// icon : tracé d'une icône 24×24
const STEPS = [
  {
    title: 'Regarder autour',
    text: 'Maintenez le clic et glissez pour tourner la caméra.',
    // Flèches dans les quatre directions
    icon: 'M5 9l-3 3 3 3M9 5l3-3 3 3M15 19l-3 3-3-3M19 9l3 3-3 3M2 12h20M12 2v20',
  },
  {
    title: 'Prendre le Pokédex',
    text: 'Cliquez sur le Pokédex posé sur le bureau. Échap pour le reposer.',
    // Curseur et éclats de clic
    icon: 'M8 8l12 5-5.5 1.5L12 20zM8 2v2.5M2 8h2.5M3.8 3.8l1.7 1.7',
  },
  {
    title: 'Utiliser le Pokédex',
    text: 'Appuyez sur ses touches, ou sur les flèches du clavier.',
    // Croix directionnelle
    icon: 'M9 3h6v6h6v6h-6v6H9v-6H3V9h6z',
  },
]

function Pokeball() {
  return (
    <svg className="tutorial__ball" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M2 12a10 10 0 0 1 20 0z" fill="#cc2e0a" />
      <path d="M2 12a10 10 0 0 0 20 0z" fill="#f0f0f0" />
      <g fill="none" stroke="#111" strokeWidth="1.5">
        <circle cx="12" cy="12" r="10" />
        <path d="M2 12h20" />
        <circle cx="12" cy="12" r="3" fill="#f0f0f0" />
      </g>
    </svg>
  )
}

// Overlay affiché au démarrage : un clic ou une touche le ferme.
// La touche I ou le bouton en bas à droite l'affichent / le masquent.
export default function Tutorial() {
  const [open, setOpen] = useState(true)

  useEffect(() => {
    const onKey = (e) => {
      // Touche maintenue, raccourci du navigateur ou navigation au clavier : on ne fait rien
      if (e.repeat || e.ctrlKey || e.metaKey || e.altKey || e.key === 'Tab' || e.key === 'Shift') return
      // Entrée / Espace sur un bouton : c'est le bouton qui réagit
      if (e.target.closest?.('button') && (e.key === 'Enter' || e.key === ' ')) return
      if (e.key.toLowerCase() === TOGGLE_KEY) setOpen((o) => !o)
      else setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const keycap = <kbd className="keycap">{TOGGLE_KEY.toUpperCase()}</kbd>

  return (
    <>
      {/* Toujours présent dans le DOM pour le fondu à l'ouverture comme à la fermeture */}
      <div
        className={open ? 'tutorial' : 'tutorial tutorial--hidden'}
        inert={!open}
        onClick={() => setOpen(false)}
      >
        <div className="tutorial__card" role="dialog" aria-labelledby="tutorial-title">
          <Pokeball />
          <h1 id="tutorial-title" className="tutorial__title">Bienvenue, dresseur !</h1>
          <p className="tutorial__subtitle">Explore la chambre et consulte le Pokédex.</p>

          <ol className="tutorial__steps">
            {STEPS.map(({ title, text, icon }) => (
              <li key={title} className="tutorial__step">
                <svg className="tutorial__icon" viewBox="0 0 24 24" aria-hidden="true">
                  <path d={icon} />
                </svg>
                <div>
                  <h2>{title}</h2>
                  <p>{text}</p>
                </div>
              </li>
            ))}
          </ol>

          {/* Le clic remonte jusqu'à l'overlay, qui se ferme */}
          <button type="button" className="tutorial__start">
            Commencer
          </button>
          <p className="tutorial__hint">Touche {keycap} pour revoir l'aide</p>
        </div>
      </div>

      <button type="button" className="help-toggle" onClick={() => setOpen((o) => !o)}>
        {keycap}
        {open ? "Masquer l'aide" : "Afficher l'aide"}
      </button>
    </>
  )
}
