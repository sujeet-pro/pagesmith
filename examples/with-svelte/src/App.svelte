<script lang="ts">
  import Layout from './components/Layout.svelte'
  import Home from './pages/Home.svelte'
  import Post from './pages/Post.svelte'
  import About from './pages/About.svelte'

  let { url = typeof window !== 'undefined' ? window.location.pathname : '/' }: { url?: string } =
    $props()

  function parseRoute(path: string): { page: string; slug?: string } {
    if (!path || path === '/') return { page: 'home' }
    if (path === '/about') return { page: 'about' }
    const match = path.match(/^\/posts\/(.+)$/)
    if (match) return { page: 'post', slug: `posts/${match[1]}` }
    return { page: 'home' }
  }

  let route = $derived(parseRoute(url))
</script>

<Layout>
  {#if route.page === 'home'}
    <Home />
  {:else if route.page === 'post' && route.slug}
    <Post slug={route.slug} />
  {:else if route.page === 'about'}
    <About />
  {:else}
    <Home />
  {/if}
</Layout>
