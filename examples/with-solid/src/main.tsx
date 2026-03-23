import { render } from 'solid-js/web'
import styles from 'virtual:content/styles'
import { App } from './App'

// Inject content styles
const styleEl = document.createElement('style')
styleEl.textContent = styles
document.head.appendChild(styleEl)

const root = document.getElementById('root')
if (root) {
  render(() => <App />, root)
}
