import { useEffect, useState } from 'react'
import { Layout } from './components/Layout'
import { About } from './pages/About'
import { Home } from './pages/Home'
import { Post } from './pages/Post'

type Route = { page: 'home' } | { page: 'post'; slug: string } | { page: 'about' }

function parseHash(hash: string): Route {
  const path = hash.replace(/^#\/?/, '')

  if (path === '' || path === '/') {
    return { page: 'home' }
  }

  if (path === 'about') {
    return { page: 'about' }
  }

  const postMatch = path.match(/^posts\/(.+)$/)
  if (postMatch) {
    return { page: 'post', slug: postMatch[1] }
  }

  return { page: 'home' }
}

function CurrentPage({ route }: { route: Route }) {
  switch (route.page) {
    case 'home':
      return <Home />
    case 'post':
      return <Post slug={route.slug} />
    case 'about':
      return <About />
  }
}

export function App() {
  const [route, setRoute] = useState<Route>(() => parseHash(window.location.hash))

  useEffect(() => {
    function onHashChange() {
      setRoute(parseHash(window.location.hash))
    }
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  return (
    <Layout>
      <CurrentPage route={route} />
    </Layout>
  )
}
