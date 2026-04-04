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

Pages opt into indexing with the `data-pagefind-body` attribute. In the React example, both the home page and article pages include this attribute on their main content area:

```tsx title="src/entry-server.tsx (excerpt)"
// Home page
<main className="doc-home" data-pagefind-body="">

// Article pages
<main className="doc-main" data-pagefind-body>
```

Only content inside elements with `data-pagefind-body` is indexed, keeping navigation chrome and boilerplate out of search results.

## The search dialog

Search is presented in a modal dialog that overlays the page. The HTML structure is generated in the `renderDocument` function when `searchEnabled` is true:

```html
<dialog class="doc-search-modal" id="search-modal" aria-label="Search">
  <div class="doc-search-modal-inner">
    <div class="doc-search-modal-header">
      <span class="doc-search-modal-title">Search</span>
      <button type="button" class="doc-search-modal-close" aria-label="Close">...</button>
    </div>
    <div class="doc-search-modal-body" id="search-container" data-pagefind-search=""></div>
  </div>
</dialog>
```

The dialog uses the native `<dialog>` element for proper modal behavior including focus trapping and backdrop handling.

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

Pagefind UI is initialized lazily -- only when the search dialog is opened for the first time:

```ts title="src/runtime.ts (excerpt)"
let initialized = false

function openSearch() {
  modal!.showModal()
  if (!initialized && typeof (window as any).PagefindUI !== 'undefined') {
    new (window as any).PagefindUI({
      element: '#search-container',
      showImages: false,
      showSubResults: true,
      resetStyles: false,
    })
    initialized = true
  }
}
```

This avoids loading and parsing the search index until the user actually requests it, keeping the initial page load fast.

## Search trigger button

The header includes a search button that is only rendered when search is enabled:

```tsx title="src/entry-server.tsx (excerpt)"
function SearchTrigger() {
  return (
    <button type="button" className="doc-search-trigger" data-search-trigger="" aria-label="Search">
      <span className="doc-search-icon" dangerouslySetInnerHTML={{ __html: searchIcon }} />
      <kbd className="doc-search-shortcut">
        <span className="doc-search-shortcut-key">⌘</span>K
      </kbd>
    </button>
  )
}
```

The button displays a search icon alongside the keyboard shortcut hint, giving users a visual affordance and teaching them the shortcut.

## Development vs. production

During development (`vp dev`), search is not available because Pagefind needs a completed build to create its index. The `searchEnabled` flag in `SsgRenderConfig` controls whether search UI elements are rendered. In production builds, the SSG plugin sets this to `true` after indexing completes, and the Pagefind CSS and JS are included in the document `<head>`:

```html
<link rel="stylesheet" href="/pagefind/pagefind-ui.css" />
<script src="/pagefind/pagefind-ui.js" defer></script>
```

The site remains fully functional without search -- it is a progressive enhancement on top of the static HTML.
