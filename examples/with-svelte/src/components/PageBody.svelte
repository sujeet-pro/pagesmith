<script lang="ts">
  import SidebarNav from './SidebarNav.svelte'
  import { formatDate } from '../site'
  import type { GuideGroup, Heading, NavEntry } from '../site'

  let {
    title,
    description = undefined,
    content,
    headings,
    currentPath,
    basePath,
    firstGuideUrl,
    firstFeaturesUrl,
    guideGroups,
    featuresEntries,
    date = undefined,
    readTime = undefined,
    prev = undefined,
    next = undefined,
    editUrl = undefined,
  }: {
    title: string
    description?: string
    content: string
    headings: Heading[]
    currentPath: string
    basePath: string
    firstGuideUrl: string
    firstFeaturesUrl: string
    guideGroups: GuideGroup[]
    featuresEntries: NavEntry[]
    date?: string
    readTime?: number
    prev?: { title: string; url: string }
    next?: { title: string; url: string }
    editUrl?: string
  } = $props()

  const filteredHeadings = $derived(headings.filter((heading) => heading.depth === 2 || heading.depth === 3))
</script>

<div class="doc-layout">
  <aside class="doc-sidebar">
    <nav class="doc-sidebar-nav" aria-label="Documentation navigation">
      <SidebarNav {currentPath} {basePath} {firstGuideUrl} {firstFeaturesUrl} {guideGroups} {featuresEntries} />
    </nav>
  </aside>

  <main class="doc-main" data-pagefind-body="">
    <article>
      {#if filteredHeadings.length > 0}
        <details class="doc-toc-mobile">
          <summary>On this page</summary>
          <nav class="doc-toc">
            <ul class="doc-toc-list">
              {#each filteredHeadings as heading (heading.slug)}
                <li class={`doc-toc-item depth-${heading.depth}`}>
                  <a href={`#${heading.slug}`}>{heading.text}</a>
                </li>
              {/each}
            </ul>
          </nav>
        </details>
      {/if}

      {#if date}
        <p class="doc-page-meta" style="color:var(--color-text-muted);font-size:var(--font-size-sm);margin-bottom:1rem">
          <time datetime={date}>{formatDate(date)}</time>
          {#if readTime}
            {' · '}{readTime} min read
          {/if}
        </p>
      {/if}

      <div class="prose">
        {@html content}
      </div>

      {#if prev || next}
        <nav class="doc-article-nav" aria-label="Page navigation">
          {#if prev}
            <a href={prev.url} class="doc-article-link doc-article-prev">
              <span class="doc-article-label">Previous</span>
              <span class="doc-article-title">{prev.title}</span>
            </a>
          {:else}
            <span></span>
          {/if}
          {#if next}
            <a href={next.url} class="doc-article-link doc-article-next">
              <span class="doc-article-label">Next</span>
              <span class="doc-article-title">{next.title}</span>
            </a>
          {/if}
        </nav>
      {/if}
    </article>

    <footer class="doc-footer">
      {#if editUrl || date}
        <div class="doc-page-footer-meta">
          {#if editUrl}
            <a href={editUrl} class="doc-edit-link" target="_blank" rel="noopener noreferrer">
              Edit this page
            </a>
          {/if}
          {#if date}
            <span class="doc-last-updated">
              Last updated: <time datetime={date}>{formatDate(date)}</time>
            </span>
          {/if}
        </div>
      {/if}
      <div class="doc-footer-links">
        <a href="https://github.com/sujeet-pro/pagesmith/tree/main/examples/with-svelte">GitHub</a>
        <a href="https://github.com/sujeet-pro/pagesmith">Pagesmith</a>
      </div>
      <div class="doc-footer-theme no-js-hidden" data-footer-theme>
        <div class="doc-footer-theme-group">
          <span class="doc-footer-theme-label">Appearance</span>
          <div class="doc-footer-theme-options" data-footer-scheme>
            <button type="button" data-scheme="auto" class="active" aria-pressed="true">Auto</button>
            <button type="button" data-scheme="light" aria-pressed="false">Light</button>
            <button type="button" data-scheme="dark" aria-pressed="false">Dark</button>
          </div>
        </div>
        <div class="doc-footer-theme-group">
          <span class="doc-footer-theme-label">Theme</span>
          <div class="doc-footer-theme-options" data-footer-theme-type>
            <button type="button" data-theme="paper" class="active" aria-pressed="true">Paper</button>
            <button type="button" data-theme="high-contrast" aria-pressed="false">High Contrast</button>
          </div>
        </div>
        <div class="doc-footer-theme-group">
          <span class="doc-footer-theme-label">Text Size</span>
          <div class="doc-footer-theme-options" data-footer-text-size>
            <button type="button" data-size="small" aria-pressed="false" aria-label="Small text"><span class="doc-text-size-label" data-size="small">A</span></button>
            <button type="button" data-size="base" class="active" aria-pressed="true" aria-label="Default text"><span class="doc-text-size-label" data-size="base">A</span></button>
            <button type="button" data-size="large" aria-pressed="false" aria-label="Large text"><span class="doc-text-size-label" data-size="large">A</span></button>
          </div>
        </div>
      </div>
      <p class="doc-footer-copyright">
        &copy; 2026 Pagesmith {' · '} Made with <a href="https://github.com/sujeet-pro/pagesmith">Pagesmith</a>
      </p>
    </footer>
  </main>

  <aside class="doc-aside">
    {#if filteredHeadings.length > 0}
      <nav class="doc-toc">
        <p class="doc-toc-title">On this page</p>
        <ul class="doc-toc-list">
          {#each filteredHeadings as heading (heading.slug)}
            <li class={`doc-toc-item depth-${heading.depth}`}>
              <a href={`#${heading.slug}`}>{heading.text}</a>
            </li>
          {/each}
        </ul>
      </nav>
    {/if}
  </aside>
</div>
