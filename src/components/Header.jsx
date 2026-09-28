import { NavLink } from 'react-router-dom'

export default function Header() {
  return (
    <header className="header">
      <NavLink to="/" className="header-logo">PokeAPI 3D</NavLink>
      <nav className="header-nav">
        <NavLink to="/">Explorer</NavLink>
        <NavLink to="/about">À propos</NavLink>
      </nav>
    </header>
  )
}
