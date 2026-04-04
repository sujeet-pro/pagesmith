<script lang="ts">
  import type { GuideGroup, NavEntry } from '../site'

  let {
    currentPath,
    basePath,
    firstGuideUrl,
    firstFeaturesUrl,
    guideGroups,
    featuresEntries,
  }: {
    currentPath: string
    basePath: string
    firstGuideUrl: string
    firstFeaturesUrl: string
    guideGroups: GuideGroup[]
    featuresEntries: NavEntry[]
  } = $props()

  const isGuide = $derived(currentPath.startsWith('/guide'))
  const isFeatures = $derived(currentPath.startsWith('/features'))
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
    <li class:active={isFeatures} class="doc-sidebar-item">
      <a href={firstFeaturesUrl} class="doc-sidebar-link">Features</a>
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
  <p class="doc-sidebar-heading">Features</p>
  <ul class="doc-sidebar-list">
    {#each featuresEntries as entry (entry.slug)}
      <li class:active={currentPath === `/features/${entry.slug}`} class="doc-sidebar-item">
        <a href={entry.url} class="doc-sidebar-link">{entry.title}</a>
      </li>
    {/each}
  </ul>
</div>
