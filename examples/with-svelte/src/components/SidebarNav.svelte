<script lang="ts">
  import type { GuideGroup, NavEntry } from '../site'

  let {
    currentPath,
    basePath,
    firstGuideUrl,
    firstBlogUrl,
    guideGroups,
    blogEntries,
  }: {
    currentPath: string
    basePath: string
    firstGuideUrl: string
    firstBlogUrl: string
    guideGroups: GuideGroup[]
    blogEntries: NavEntry[]
  } = $props()

  const isGuide = $derived(currentPath.startsWith('/guide'))
  const isBlog = $derived(currentPath.startsWith('/blog'))
</script>

<div class="doc-sidebar-section">
  <p class="doc-sidebar-heading">Navigation</p>
  <ul class="doc-sidebar-list">
    <li class:active={currentPath === '/'} class="doc-sidebar-item">
      <a href={`${basePath}/`} class="doc-sidebar-link">Home</a>
    </li>
    <li class:active={isGuide} class="doc-sidebar-item">
      <a href={firstGuideUrl} class="doc-sidebar-link">Guide</a>
    </li>
    <li class:active={isBlog} class="doc-sidebar-item">
      <a href={firstBlogUrl} class="doc-sidebar-link">Blog</a>
    </li>
    <li class:active={currentPath === '/about'} class="doc-sidebar-item">
      <a href={`${basePath}/about`} class="doc-sidebar-link">About</a>
    </li>
  </ul>
</div>

<div class="doc-sidebar-section">
  <p class="doc-sidebar-heading">Guide</p>
  <ul class="doc-sidebar-list">
    {#each guideGroups as group (group.series)}
      <li class="doc-sidebar-item expanded">
        <span class="doc-sidebar-link" style="font-weight:500;color:var(--color-text-secondary)">
          {group.series}
        </span>
        <ul class="doc-sidebar-nested">
          {#each group.items as entry (entry.slug)}
            <li class:active={currentPath === `/guide/${entry.slug}`} class="doc-sidebar-item">
              <a href={entry.url} class="doc-sidebar-link">{entry.title}</a>
            </li>
          {/each}
        </ul>
      </li>
    {/each}
  </ul>
</div>

<div class="doc-sidebar-section">
  <p class="doc-sidebar-heading">Blog</p>
  <ul class="doc-sidebar-list">
    {#each blogEntries as entry (entry.slug)}
      <li class:active={currentPath === `/blog/${entry.slug}`} class="doc-sidebar-item">
        <a href={entry.url} class="doc-sidebar-link">{entry.title}</a>
      </li>
    {/each}
  </ul>
</div>
