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

The `pagesmithSsg` plugin handles Pagefind integration automatically. After all HTML pages are written to the output directory, the plugin runs Pagefind's indexer over the generated files. This produces a search index in the `pagefind/` directory alongside the site output, including the Pagefind Component UI CSS and JavaScript.

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

## The search modal (Pagefind Component UI)

Search uses Pagefind **Component UI** web components instead of the legacy Default UI (`PagefindUI`). The query field is provided by the `<pagefind-input>` custom element in the modal header. The modal structure is defined at the end of the layout template:

```html title="templates/layout.ejs (excerpt)"
<pagefind-modal reset-on-close>
  <pagefind-modal-header><pagefind-input></pagefind-input></pagefind-modal-header>
  <pagefind-modal-body>
    <pagefind-summary></pagefind-summary>
    <pagefind-results></pagefind-results>
  </pagefind-modal-body>
  <pagefind-modal-footer><pagefind-keyboard-hints></pagefind-keyboard-hints></pagefind-modal-footer>
</pagefind-modal>
```

The components load and query the index when the user opens the modal, keeping the initial page load fast.

## Keyboard shortcut

Pressing **Cmd+K** (macOS) or **Ctrl+K** (Windows/Linux) opens search, and the header control is wired through `<pagefind-modal-trigger>`. That behavior is handled natively by Pagefind Component UI web components (`<pagefind-modal>`, `<pagefind-modal-trigger>`).

## Search trigger

The header includes the trigger component (styled with `doc-search-trigger` to match the theme):

```ejs title="templates/layout.ejs (excerpt)"
<pagefind-modal-trigger class="doc-search-trigger"></pagefind-modal-trigger>
```

The trigger is hidden when JavaScript is disabled using a `<noscript>` style rule in the layout's `<head>`.

## Development vs. production

During development (`vp dev`), search is not available because Pagefind needs a completed build to create its index. The Pagefind Component UI CSS and JS are still referenced in the layout, but the assets do not exist until a production build runs. In production builds, the SSG plugin generates the index after writing all HTML files, and the Pagefind assets become available:

```ejs title="templates/layout.ejs (excerpt)"
<link rel="stylesheet" href="<%= basePath %>pagefind/pagefind-component-ui.css" />
<script src="<%= basePath %>pagefind/pagefind-component-ui.js" type="module"></script>
```

The site remains fully functional without search -- it is a progressive enhancement on top of the static HTML.
