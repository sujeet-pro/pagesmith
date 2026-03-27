import { Match, Switch } from 'solid-js'
import { Layout } from './components/Layout'
import { Home } from './pages/Home'
import { Post } from './pages/Post'
import { About } from './pages/About'

function parseRoute(path: string): { page: string; slug?: string } {
  if (!path || path === '/') return { page: 'home' }
  if (path === '/about') return { page: 'about' }
  const match = path.match(/^\/posts\/(.+)$/)
  if (match) return { page: 'post', slug: `posts/${match[1]}` }
  return { page: 'home' }
}

export function App(props: { url: string }) {
  const route = () => parseRoute(props.url)

  return (
    <Layout>
      <Switch fallback={<Home />}>
        <Match when={route().page === 'home'}>
          <Home />
        </Match>
        <Match when={route().page === 'post'}>
          <Post slug={route().slug!} />
        </Match>
        <Match when={route().page === 'about'}>
          <About />
        </Match>
      </Switch>
    </Layout>
  )
}
