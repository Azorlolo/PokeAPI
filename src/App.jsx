import { Routes, Route } from 'react-router-dom'
import Header from './components/Header.jsx'
import Explorer from './pages/Explorer.jsx'
import About from './pages/About.jsx'

export default function App() {
  return (
    <div className="app">
      <Header />
      <main className="app-main">
        <Routes>
          <Route path="/" element={<Explorer />} />
          <Route path="/about" element={<About />} />
        </Routes>
      </main>
    </div>
  )
}
