import React from 'react'
import ReactDOM from 'react-dom/client'
import { HeroBackground } from './components/HeroBackground'
import './index.css'

// Mount WebGL Background
const bgMount = document.getElementById('hero-bg-mount')
if (bgMount) {
  ReactDOM.createRoot(bgMount).render(
    <React.StrictMode>
      <HeroBackground />
    </React.StrictMode>,
  )
}
