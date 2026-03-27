import { render } from 'svelte/server'
import App from './App.svelte'

export function renderPage(url: string): string {
  const result = render(App, { props: { url } })
  return result.body
}

export { renderPage as render }
