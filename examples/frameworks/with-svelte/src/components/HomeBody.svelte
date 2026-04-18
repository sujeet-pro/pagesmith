<!--
  Landing page: data-pagefind-body marks what Pagefind indexes (hero + lists), excluding
  duplicated chrome that lives outside this subtree.
-->
<script lang="ts">
  import type { NavEntry } from '../site'

  let {
    firstGuideUrl,
    kitchenSinkUrl,
    guideEntries,
  }: {
    firstGuideUrl: string
    kitchenSinkUrl: string
    guideEntries: NavEntry[]
  } = $props()
</script>

<main id="doc-main-content" class="doc-home" tabindex="-1" data-pagefind-body="">
  <section class="doc-home-section doc-hero">
    <h1 class="doc-hero-text">Pagesmith + Svelte</h1>
    <p class="doc-hero-tagline">
      A content-driven static site rendered with Svelte and powered by Pagesmith's Vite content
      plugin.
    </p>
    <div class="doc-hero-actions">
      <a href={firstGuideUrl} class="doc-hero-action doc-hero-action-brand">Read the Guide</a>
      <a href={kitchenSinkUrl} class="doc-hero-action doc-hero-action-alt">Open Kitchen Sink</a>
    </div>
  </section>

  <section class="doc-home-section">
    <h2>Markdown Kitchen Sink</h2>
    <p>
      This example keeps one dedicated regression page for markdown rendering instead of separate
      markdown smoke-test pages.
    </p>
    <p>
      <a href={kitchenSinkUrl}>Open the kitchen sink page</a>
    </p>
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
        <a href="https://github.com/sujeet-pro/pagesmith/tree/main/examples/frameworks/with-svelte">GitHub</a>
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
  </div>
</main>
