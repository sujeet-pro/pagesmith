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

Pages opt into indexing with the `data-pagefind-body` attribute. In the React example, both the home page and article pages include this attribute on their main content area:

```tsx title="src/entry-server.tsx (excerpt)"
// Home page
<main className="doc-home" data-pagefind-body="">

// Article pages
<main className="doc-main" data-pagefind-body>
```

Only content inside elements with `data-pagefind-body` is indexed, keeping navigation chrome and boilerplate out of search results.

## Pagefind Component UI in the document shell

Search uses Pagefind **Component UI** web components (`<pagefind-modal>`, `<pagefind-input>`, etc.) instead of the legacy Default UI (`new PagefindUI({ ... })`). The React example builds the HTML document with `renderDocumentShell` from `@pagesmith/core/ssg-utils`. When `searchEnabled` is true, the shell includes the Component UI assets and appends a modal tree after the page body (same pattern as other framework examples):

```html
<pagefind-modal reset-on-close>
  <pagefind-modal-header><pagefind-input></pagefind-input></pagefind-modal-header>
  <pagefind-modal-body>
    <pagefind-summary></pagefind-summary>
    <pagefind-results></pagefind-results>
  </pagefind-modal-body>
  <pagefind-modal-footer><pagefind-keyboard-hints></pagefind-keyboard-hints></pagefind-modal-footer>
</pagefind-modal>
```

The search query is handled by the `<pagefind-input>` web component inside `<pagefind-modal-header>`. There is no `.pagefind-ui__search-input` selector or manual `PagefindUI` constructor.

## Keyboard shortcut

Pressing **Cmd+K** (macOS) or **Ctrl+K** (Windows/Linux) opens search, and the header trigger is wired through `<pagefind-modal-trigger>`. That behavior is handled natively by Pagefind Component UI web components (`<pagefind-modal>`, `<pagefind-modal-trigger>`). Client code in `src/runtime.ts` only covers the table of contents and sidebar; it does not initialize search.

## Search trigger

When search is enabled, the header renders the trigger component:

```tsx title="src/entry-server.tsx (excerpt)"
function SearchTrigger() {
  return <pagefind-modal-trigger className="doc-search-trigger" />
}
```

The trigger displays the search affordance and keyboard hint via Component UI and theme CSS.

## Development vs. production

During development (`vp dev`), search is not available because Pagefind needs a completed build to create its index. The `searchEnabled` flag in `SsgRenderConfig` controls whether search UI elements are rendered. In production builds, the SSG plugin sets this to `true` after indexing completes, and the Pagefind Component UI CSS and JS are included in the document `<head>`:

```html
<link rel="stylesheet" href="/pagefind/pagefind-component-ui.css" />
<script src="/pagefind/pagefind-component-ui.js" type="module"></script>
```

The site remains fully functional without search -- it is a progressive enhancement on top of the static HTML.
