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

Search uses [Pagefind](https://pagefind.app/) on the **generated HTML** after the SSG pass. **`pagesmithSsg`** runs the indexer and, when enabled, **`renderDocumentShell`** injects Pagefind **Component UI** assets and the modal tree.

## What gets indexed

Only subtrees marked with **`data-pagefind-body`** are indexed. Navigation, headers, and sidebars stay out of the index.

In this example the attribute matches the actual DOM from `renderToStaticMarkup`:

```tsx title="src/entry-server.tsx (excerpt)"
// Home — searchable marketing + lists live in <main>
<main id="doc-main-content" className="doc-home" tabIndex={-1} data-pagefind-body="">

// Guide / pages — article body is the <article>, not the outer layout wrapper
<article id="doc-main-content" tabIndex={-1} data-pagefind-body="">
```

So Pagefind indexes home main content and each article’s inner HTML (including the `.prose` markdown output), not the full `<main className="doc-main">` wrapper used for layout.

## Component UI in the shell

When **`config.searchEnabled`** is true, **`renderDocumentShell`** includes Component UI CSS/JS and mounts **`<pagefind-modal>`** / **`<pagefind-modal-trigger>`** (see **`SearchTrigger`** in the entry). There is no `new PagefindUI(...)` in **`runtime.ts`** — search is declarative in the static shell.

## Keyboard shortcut and trigger

**Cmd+K** / **Ctrl+K** and the header trigger come from Pagefind’s web components. **`runtime.ts`** only adjusts **`compact`** / **`hide-shortcut`** on the trigger for small viewports.

## Development vs production

During **`npm run dev`**, there is no finished static tree for Pagefind to index, so **`searchEnabled`** is false and search chrome is omitted. After **`npm run build`**, the SSG plugin enables search in emitted HTML once indexing succeeds. The site remains usable without JS; search is a progressive enhancement.
