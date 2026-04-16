<!--
  Header chrome only. When search is on, <pagefind-modal-trigger> opens the shell-injected
  modal (see renderDocumentShell); Cmd/Ctrl+K comes from Pagefind Component UI, not this file.
-->
<script lang="ts">
  const menuIcon =
    '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M3 5h14M3 10h14M3 15h14"/></svg>'
  const searchIcon =
    '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><circle cx="8.5" cy="8.5" r="5.5"/><path d="m13 13 4 4"/></svg>'
  const themeIcon =
    '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><circle cx="10" cy="10" r="4"/><path d="M10 2v2M10 16v2M2 10h2M16 10h2M4.93 4.93l1.41 1.41M13.66 13.66l1.41 1.41M4.93 15.07l1.41-1.41M13.66 6.34l1.41-1.41"/></svg>'

  let {
    basePath,
    currentPath,
    firstGuideUrl,
    searchEnabled = false,
  }: {
    basePath: string
    currentPath: string
    firstGuideUrl: string
    searchEnabled?: boolean
  } = $props()

  const isGuide = $derived(currentPath.startsWith('/guide'))
</script>

<header class="doc-header">
  <a
    href="#doc-main-content"
    class="doc-skip-link"
  >
    Skip to main content
  </a>
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
    </nav>
    <div class="doc-header-right">
      {#if searchEnabled}
        <pagefind-modal-trigger class="doc-search-trigger"></pagefind-modal-trigger>
      {/if}
      <div class="doc-theme-toggle no-js-hidden" data-theme-toggle="">
        <button
          type="button"
          class="doc-theme-toggle-btn"
          aria-label="Change theme"
          aria-expanded="false"
          aria-haspopup="true"
          aria-controls="doc-theme-dropdown"
          data-theme-toggle-btn=""
        >
          {@html themeIcon}
        </button>
        <div id="doc-theme-dropdown" class="doc-theme-dropdown" data-theme-dropdown="" hidden>
          <fieldset class="doc-theme-group">
            <legend>Appearance</legend>
            <label class="doc-theme-option" data-scheme="auto">
              <input type="radio" name="colorScheme" value="auto" checked />
              Auto
            </label>
            <label class="doc-theme-option" data-scheme="light">
              <input type="radio" name="colorScheme" value="light" />
              Light
            </label>
            <label class="doc-theme-option" data-scheme="dark">
              <input type="radio" name="colorScheme" value="dark" />
              Dark
            </label>
          </fieldset>
          <fieldset class="doc-theme-group">
            <legend>Theme</legend>
            <label class="doc-theme-option" data-theme="paper">
              <input type="radio" name="theme" value="paper" checked />
              Paper
            </label>
            <label class="doc-theme-option" data-theme="high-contrast">
              <input type="radio" name="theme" value="high-contrast" />
              High Contrast
            </label>
          </fieldset>
          <fieldset class="doc-theme-group">
            <legend>Text Size</legend>
            <div class="doc-text-size-options">
              <label class="doc-text-size-option" title="Small">
                <input class="sr-only" type="radio" name="textSize" value="small" />
                <span class="doc-text-size-label" data-size="small" aria-hidden="true">A</span>
                <span class="sr-only">Small text size</span>
              </label>
              <label class="doc-text-size-option" title="Default">
                <input class="sr-only" type="radio" name="textSize" value="base" checked />
                <span class="doc-text-size-label" data-size="base" aria-hidden="true">A</span>
                <span class="sr-only">Default text size</span>
              </label>
              <label class="doc-text-size-option" title="Large">
                <input class="sr-only" type="radio" name="textSize" value="large" />
                <span class="doc-text-size-label" data-size="large" aria-hidden="true">A</span>
                <span class="sr-only">Large text size</span>
              </label>
            </div>
          </fieldset>
        </div>
      </div>
    </div>
  </div>
</header>
