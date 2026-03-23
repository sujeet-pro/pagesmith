<script lang="ts">
  import Layout from './components/Layout.svelte'
  import Home from './pages/Home.svelte'
  import Post from './pages/Post.svelte'
  import About from './pages/About.svelte'

  let hash = $state(window.location.hash || '#/')

  function onHashChange() {
    hash = window.location.hash || '#/'
  }

  $effect(() => {
    window.addEventListener('hashchange', onHashChange,)
    return () => window.removeEventListener('hashchange', onHashChange,)
  })

  function parseRoute(h: string,): { page: string; slug?: string } {
    const path = h.replace(/^#\/?/, '',)
    if (!path || path === '/') {
      return { page: 'home', }
    }
    if (path === 'about') {
      return { page: 'about', }
    }
    const postMatch = path.match(/^posts\/(.+)$/,)
    if (postMatch) {
      return { page: 'post', slug: postMatch[1], }
    }
    return { page: 'home', }
  }

  let route = $derived(parseRoute(hash,))
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
