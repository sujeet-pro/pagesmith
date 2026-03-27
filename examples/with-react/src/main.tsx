import { StrictMode } from 'react'
import { hydrateRoot, createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router'
import '@pagesmith/core/css/content'
import { App } from './App'

const root = document.getElementById('root')!
const app = (
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>
)

if (root.childNodes.length > 0) {
  hydrateRoot(root, app)
} else {
  createRoot(root).render(app)
}
