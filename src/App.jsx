import { FocusProvider } from './context/FocusContext.jsx'
import Scene from './components/Scene.jsx'

export default function App() {
  return (
    <FocusProvider>
      <Scene />
    </FocusProvider>
  )
}
