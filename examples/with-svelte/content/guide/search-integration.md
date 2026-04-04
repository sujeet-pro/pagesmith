---
title: Search Integration
description: Adding Pagefind search to your site
date: 2026-03-15
tags:
  - search
  - pagefind
series: Framework Integration
seriesOrder: 3
---

# Search Integration

Search is powered by [Pagefind](https://pagefind.app/), a static search library that indexes the generated HTML at build time and runs entirely in the browser -- no server required.

## How indexing works

The `pagesmithSsg` plugin handles Pagefind integration automatically. After all HTML pages are written to the output directory, the plugin runs Pagefind's indexer over the generated files. This produces a search index in the `pagefind/` directory alongside the site output, including the Pagefind UI CSS and JavaScript.

Pages opt into indexing with the `data-pagefind-body` attribute. In the Svelte example, both the home page and article pages include this attribute on their main content area. The `HomeBody.svelte` and `PageBody.svelte` components set it on their `<main>` elements:

```svelte title="src/components/HomeBody.svelte (excerpt)"
<main class="doc-home" data-pagefind-body="">
```

```svelte title="src/components/PageBody.svelte (excerpt)"
<main class="doc-main" data-pagefind-body="">
```

Only content inside elements with `data-pagefind-body` is indexed, keeping navigation chrome and boilerplate out of search results.

## The search dialog

Search is presented in a modal dialog rendered by `App.svelte` when `searchEnabled` is true:

```svelte title="src/App.svelte (excerpt)"
{#if searchEnabled && pageKind !== 'not-found'}
  <dialog class="doc-search-modal" id="search-modal" aria-label="Search">
    <div class="doc-search-modal-inner">
      <div class="doc-search-modal-header">
        <span class="doc-search-modal-title">Search</span>
        <button type="button" class="doc-search-modal-close" aria-label="Close" data-search-close="">
          {@html closeIcon}
        </button>
      </div>
      <div class="doc-search-modal-body" id="search-container" data-pagefind-search=""></div>
    </div>
  </dialog>
{/if}
```

The dialog uses the native `<dialog>` element for proper modal behavior including focus trapping and backdrop handling. The `{@html closeIcon}` directive injects the SVG icon as raw HTML.

## Keyboard shortcut

The runtime script in `src/runtime.ts` binds the standard search shortcut:

```ts title="src/runtime.ts (excerpt)"
document.addEventListener('keydown', (e) => {
  if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
    e.preventDefault()
    if (modal.open) {
      modal.close()
    } else {
      openSearch()
    }
  }
})
```

Pressing **Cmd+K** (macOS) or **Ctrl+K** (Windows/Linux) toggles the search dialog. The trigger button in the header also opens it.

## Lazy initialization

Pagefind UI is initialized lazily -- only when the search dialog is opened for the first time. This avoids loading and parsing the search index until the user actually requests it, keeping the initial page load fast.

## Development vs. production

During development (`vp dev`), search is not available because Pagefind needs a completed build to create its index. The `searchEnabled` flag in `SsgRenderConfig` controls whether search UI elements are rendered. In production builds, the SSG plugin sets this to `true` after indexing completes, and the Pagefind CSS and JS are included in the document `<head>`.

The site remains fully functional without search -- it is a progressive enhancement on top of the static HTML.
