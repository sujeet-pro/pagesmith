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
    firstBlogUrl,
    guideGroups,
    blogEntries,
    date = undefined,
    readTime = undefined,
  }: {
    title: string
    description?: string
    content: string
    headings: Heading[]
    currentPath: string
    basePath: string
    firstGuideUrl: string
    firstBlogUrl: string
    guideGroups: GuideGroup[]
    blogEntries: NavEntry[]
    date?: string
    readTime?: number
  } = $props()

  const filteredHeadings = $derived(headings.filter((heading) => heading.depth === 2 || heading.depth === 3))
</script>

<div class="doc-layout">
  <aside class="doc-sidebar">
    <nav class="doc-sidebar-nav" aria-label="Documentation navigation">
      <SidebarNav {currentPath} {basePath} {firstGuideUrl} {firstBlogUrl} {guideGroups} {blogEntries} />
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
    </article>

    <footer class="doc-footer">
      <div class="doc-footer-links">
        <a href="https://github.com/sujeet-pro/pagesmith/tree/main/examples/with-svelte">GitHub</a>
        <a href="https://github.com/sujeet-pro/pagesmith">Pagesmith</a>
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
