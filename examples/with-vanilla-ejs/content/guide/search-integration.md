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

Pages opt into indexing with the `data-pagefind-body` attribute. In the EJS example, both the home page and article pages include this attribute in the layout template:

```ejs title="templates/layout.ejs (excerpt)"
<%# Home page layout %>
<main class="doc-home">
  <div class="doc-home-content" data-pagefind-body>
    <%- body %>
  </div>
</main>

<%# Article page layout %>
<main class="doc-main" data-pagefind-body>
  <%- body %>
</main>
```

Only content inside elements with `data-pagefind-body` is indexed, keeping navigation chrome and boilerplate out of search results.

## The search dialog

Search is presented in a modal dialog that overlays the page. The HTML structure is defined in the layout template:

```html title="templates/layout.ejs (excerpt)"
<dialog class="doc-search-modal" id="search-modal" aria-label="Search">
  <div class="doc-search-modal-inner">
    <div class="doc-search-modal-header">
      <span class="doc-search-modal-title">Search</span>
      <button type="button" class="doc-search-modal-close" aria-label="Close">...</button>
    </div>
    <div class="doc-search-modal-body" id="search-container"></div>
  </div>
</dialog>
```

The dialog uses the native `<dialog>` element for proper modal behavior including focus trapping and backdrop handling.

## Keyboard shortcut

The layout template includes an inline script that binds the standard search shortcut:

```js title="templates/layout.ejs (inline script excerpt)"
document.addEventListener('keydown', function(e) {
  if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
    e.preventDefault();
    if (modal && modal.open) modal.close();
    else openSearch();
  }
});
```

Pressing **Cmd+K** (macOS) or **Ctrl+K** (Windows/Linux) toggles the search dialog. The trigger button in the header also opens it.

## Lazy initialization

Pagefind UI is initialized lazily -- only when the search dialog is opened for the first time:

```js title="templates/layout.ejs (inline script excerpt)"
var initialized = false;

function openSearch() {
  if (!modal) return;
  modal.showModal();
  if (!initialized && typeof PagefindUI !== 'undefined') {
    new PagefindUI({
      element: '#search-container',
      showImages: false,
      showSubResults: true,
      resetStyles: false,
    });
    initialized = true;
  }
}
```

This avoids loading and parsing the search index until the user actually requests it, keeping the initial page load fast.

## Search trigger button

The header includes a search button with a keyboard shortcut hint:

```ejs title="templates/layout.ejs (excerpt)"
<button type="button" class="doc-search-trigger" data-search-trigger aria-label="Search">
  <span class="doc-search-icon">
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round">
      <circle cx="8.5" cy="8.5" r="5.5" /><path d="m13 13 4 4" />
    </svg>
  </span>
  <kbd class="doc-search-shortcut"><span class="doc-search-shortcut-key">⌘</span>K</kbd>
</button>
```

The button is hidden via CSS when JavaScript is disabled using a `<noscript>` style rule in the layout's `<head>`.

## Development vs. production

During development (`vp dev`), search is not available because Pagefind needs a completed build to create its index. The Pagefind CSS and JS are still referenced in the layout, but the assets do not exist until a production build runs. In production builds, the SSG plugin generates the index after writing all HTML files, and the Pagefind assets become available:

```ejs title="templates/layout.ejs (excerpt)"
<link rel="stylesheet" href="<%= basePath %>pagefind/pagefind-ui.css" />
<script src="<%= basePath %>pagefind/pagefind-ui.js" defer></script>
```

The site remains fully functional without search -- it is a progressive enhancement on top of the static HTML.
