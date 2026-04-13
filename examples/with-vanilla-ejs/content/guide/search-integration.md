---
title: Search Integration
description: Pagefind search in the EJS + core stack
date: 2026-03-15
tags:
  - search
  - pagefind
series: Framework Integration
seriesOrder: 3
---

# Search Integration

Search uses [Pagefind](https://pagefind.app/) Component UI. The `pagesmithSsg` plugin runs the indexer after static HTML is written; the browser loads the generated `pagefind/` assets.

## Indexing boundary

Pagefind only indexes subtrees marked with `data-pagefind-body`. In this example:

- **Home** — the wrapper around the home body inside `layout.ejs` (`doc-home-content`).
- **Guide pages** — the `<article>` root in `article.ejs` (not the full layout).
- **About** — the `<article>` root in `about.ejs`.

```ejs title="templates/article.ejs (excerpt)"
<article id="doc-main-content" tabindex="-1" data-pagefind-body>
  …
  <div class="prose">
    <%- content %>
  </div>
</article>
```

## `searchEnabled` from `SsgRenderConfig`

`@pagesmith/core` passes `searchEnabled: false` while the dev server SSRs HTML, and `true` for the production SSG pass (after the index exists). `layout.ejs` gates Pagefind CSS, JS, the modal, and the header trigger on that flag so development does not request missing `pagefind/*` URLs.

## Component UI

When search is enabled, the shell includes the modal and trigger:

```ejs title="templates/layout.ejs (excerpt)"
<% if (searchOn) { %>
  <pagefind-modal-trigger class="doc-search-trigger"></pagefind-modal-trigger>
<% } %>
…
<% if (searchOn) { %>
<pagefind-modal reset-on-close>
  <pagefind-modal-header><pagefind-input></pagefind-input></pagefind-modal-header>
  <pagefind-modal-body>
    <pagefind-summary></pagefind-summary>
    <pagefind-results></pagefind-results>
  </pagefind-modal-body>
  <pagefind-modal-footer><pagefind-keyboard-hints></pagefind-keyboard-hints></pagefind-modal-footer>
</pagefind-modal>
<% } %>
```

Keyboard shortcuts and modal behavior come from those web components.

## Client bundle

`client.js` imports `@pagesmith/site/runtime/content` and tweaks `<pagefind-modal-trigger>` for small screens. It is optional for static reading; search still works without those layout tweaks.

## Development vs production

Run `npm run build` and preview the output (or deploy) to exercise search end-to-end. In `vite dev`, `searchEnabled` stays false by design — there is no index on disk yet.
