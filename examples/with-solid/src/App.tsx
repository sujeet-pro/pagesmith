import { createMemo, createSignal, onCleanup } from 'solid-js'
import { Layout } from './components/Layout'
import { About } from './pages/About'
import { Home } from './pages/Home'
import { Post } from './pages/Post'

function getHash(): string {
  return window.location.hash.slice(1) || '/'
}

export function App() {
  const [hash, setHash] = createSignal(getHash())

  const onHashChange = () => setHash(getHash())
  window.addEventListener('hashchange', onHashChange)
  onCleanup(() => window.removeEventListener('hashchange', onHashChange))

  const route = createMemo(() => {
    const h = hash()
    if (h === '/' || h === '') return { page: 'home' as const }
    if (h === '/about') return { page: 'about' as const }
    const postMatch = h.match(/^\/posts\/(.+)$/)
    if (postMatch) return { page: 'post' as const, slug: postMatch[1] }
    return { page: 'home' as const }
  })

  return (
    <Layout>
      {(() => {
        const r = route()
        switch (r.page) {
          case 'home':
            return <Home />
          case 'post':
            return <Post slug={r.slug!} />
          case 'about':
            return <About />
        }
      })()}
    </Layout>
  )
}
