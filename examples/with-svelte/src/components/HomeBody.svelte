<script lang="ts">
  import { formatDate } from '../site'
  import type { NavEntry } from '../site'

  let {
    firstGuideUrl,
    firstBlogUrl,
    guideEntries,
    blogEntries,
  }: {
    firstGuideUrl: string
    firstBlogUrl: string
    guideEntries: NavEntry[]
    blogEntries: NavEntry[]
  } = $props()
</script>

<main class="doc-home" data-pagefind-body="">
  <section class="doc-home-section doc-hero">
    <h1 class="doc-hero-text">Pagesmith + Svelte</h1>
    <p class="doc-hero-tagline">
      A content-driven static site rendered with Svelte and powered by Pagesmith's Vite content
      plugin.
    </p>
    <div class="doc-hero-actions">
      <a href={firstGuideUrl} class="doc-hero-action doc-hero-action-brand">Read the Guide</a>
      <a href={firstBlogUrl} class="doc-hero-action doc-hero-action-alt">Browse the Blog</a>
    </div>
  </section>

  <section class="doc-home-section">
    <h2>Recent Blog Posts</h2>
    <ul style="display:flex;flex-direction:column;gap:1rem">
      {#each blogEntries as post (post.slug)}
        <li
          style="padding:1rem 1.25rem;border:1px solid var(--color-border-subtle);border-radius:var(--radius-lg)"
        >
          <a href={post.url}>
            <h3 style="margin:0;font-size:var(--font-size-lg)">{post.title}</h3>
          </a>
          {#if post.description}
            <p style="margin:0.5rem 0 0;color:var(--color-text-muted);font-size:var(--font-size-sm)">
              {post.description}
            </p>
          {/if}
          {#if post.date}
            <p style="margin:0.375rem 0 0;font-size:var(--font-size-xs);color:var(--color-text-muted)">
              <time datetime={post.date}>{formatDate(post.date)}</time>
              {#if post.tags && post.tags.length > 0}
                {' · '}{post.tags.join(', ')}
              {/if}
            </p>
          {/if}
        </li>
      {/each}
    </ul>
  </section>

  <section class="doc-home-section">
    <h2>Guide</h2>
    <ul style="display:flex;flex-direction:column;gap:0.75rem">
      {#each guideEntries as entry (entry.slug)}
        <li>
          <a href={entry.url} style="font-weight:500">{entry.title}</a>
          {#if entry.description}
            <span style="color:var(--color-text-muted);font-size:var(--font-size-sm)">
              {' — '}{entry.description}
            </span>
          {/if}
        </li>
      {/each}
    </ul>
  </section>

  <div class="doc-home-footer">
    <footer class="doc-footer">
      <div class="doc-footer-links">
        <a href="https://github.com/sujeet-pro/pagesmith/tree/main/examples/with-svelte">GitHub</a>
        <a href="https://github.com/sujeet-pro/pagesmith">Pagesmith</a>
      </div>
      <p class="doc-footer-copyright">
        &copy; 2026 Pagesmith {' · '} Made with <a href="https://github.com/sujeet-pro/pagesmith">Pagesmith</a>
      </p>
    </footer>
  </div>
</main>
