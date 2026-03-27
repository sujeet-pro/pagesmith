import '@pagesmith/core/css/content'
import { mount, hydrate } from 'svelte'
import App from './App.svelte'

const target = document.getElementById('app')!

if (target.childNodes.length > 0) {
  hydrate(App, { target, props: { url: window.location.pathname } })
} else {
  mount(App, { target, props: { url: window.location.pathname } })
}
