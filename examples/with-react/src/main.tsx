import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import css from 'virtual:content/styles'
import { App } from './App'

// Inject content runtime styles
const style = document.createElement('style')
style.textContent = css
document.head.appendChild(style)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
