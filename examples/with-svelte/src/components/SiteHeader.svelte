<script lang="ts">
  const menuIcon =
    '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M3 5h14M3 10h14M3 15h14"/></svg>'
  const searchIcon =
    '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><circle cx="8.5" cy="8.5" r="5.5"/><path d="m13 13 4 4"/></svg>'

  let {
    basePath,
    currentPath,
    firstGuideUrl,
    firstFeaturesUrl,
    searchEnabled = false,
  }: {
    basePath: string
    currentPath: string
    firstGuideUrl: string
    firstFeaturesUrl: string
    searchEnabled?: boolean
  } = $props()

  const isGuide = $derived(currentPath.startsWith('/guide'))
  const isFeatures = $derived(currentPath.startsWith('/features'))
</script>

<header class="doc-header">
  <div class="doc-header-inner">
    <div class="doc-header-left">
      <button type="button" class="doc-sidebar-toggle" aria-label="Toggle navigation" data-sidebar-toggle="">
        {@html menuIcon}
      </button>
      <a href="/pagesmith/" class="doc-logo">Pagesmith</a>
    </div>
    <nav class="doc-nav">
      <a href={`${basePath}/`} class:active={currentPath === '/'}>Home</a>
      <a href={firstGuideUrl} class:active={isGuide}>Guide</a>
      <a href={firstFeaturesUrl} class:active={isFeatures}>Features</a>
    </nav>
    {#if searchEnabled}
      <button type="button" class="doc-search-trigger" data-search-trigger="" aria-label="Search">
        <span class="doc-search-icon">
          {@html searchIcon}
        </span>
        <kbd class="doc-search-shortcut">
          <span class="doc-search-shortcut-key">⌘</span>K
        </kbd>
      </button>
    {/if}
  </div>
</header>
