import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.scss'
import ChatInterface from './ChatInterface'

function App() {
  const [count, setCount] = useState(0)

  return (
    <div id="app-main-container" className="app-main-container">
      <div id="content-container" className="content-container">
        <main id="main-content-container" className="main-content-container"><ChatInterface /></main>
      </div>
    </div>
  )
}

export default App
