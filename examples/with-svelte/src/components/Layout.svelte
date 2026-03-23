<script lang="ts">
  import type { Snippet, } from 'svelte'

  let { children, }: { children: Snippet } = $props()
</script>

<div class="layout">
  <header>
    <nav>
      <a href="#/" class="logo">Pagesmith + Svelte</a>
      <ul>
        <li><a href="#/">Home</a></li>
        <li><a href="#/about">About</a></li>
      </ul>
    </nav>
  </header>

  <main>
    {@render children()}
  </main>

  <footer>
    <p>Built with <a href="https://github.com/pagesmiths/pagesmith">Pagesmith</a> &amp; Svelte</p>
  </footer>
</div>

<style>
  .layout {
    max-width: 48rem;
    margin: 0 auto;
    padding: 0 1rem;
    min-height: 100vh;
    display: flex;
    flex-direction: column;
  }

  header {
    padding: 1rem 0;
    border-bottom: 1px solid #e2e8f0;
  }

  nav {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .logo {
    font-weight: 700;
    font-size: 1.125rem;
    color: #1a202c;
    text-decoration: none;
  }

  ul {
    display: flex;
    gap: 1.5rem;
    list-style: none;
    margin: 0;
    padding: 0;
  }

  ul a {
    color: #4a5568;
    text-decoration: none;
  }

  ul a:hover {
    color: #1a202c;
  }

  main {
    flex: 1;
    padding: 2rem 0;
  }

  footer {
    padding: 1.5rem 0;
    border-top: 1px solid #e2e8f0;
    text-align: center;
    color: #718096;
    font-size: 0.875rem;
  }

  footer a {
    color: #4a5568;
  }
</style>
