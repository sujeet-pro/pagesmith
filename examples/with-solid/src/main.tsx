import { render, hydrate } from 'solid-js/web'
import '@pagesmith/core/css/content'
import { App } from './App'

const root = document.getElementById('root')!

if (root.childNodes.length > 0) {
  hydrate(() => <App url={window.location.pathname} />, root)
} else {
  render(() => <App url={window.location.pathname} />, root)
}
