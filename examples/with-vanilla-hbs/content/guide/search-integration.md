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

Search uses [Pagefind](https://pagefind.app/) on the static HTML produced by `pagesmithSsg`. The indexer runs after all pages are written; the [Pagefind Component UI](https://pagefind.app/docs/component-ui/) scripts in `templates/layout.hbs` load in the browser.

## What gets indexed (`data-pagefind-body`)

Pagefind weights content inside elements marked `data-pagefind-body`. When at least one page defines this attribute, Pagefind scopes indexing to those subtrees (see Pagefind CLI output while building). In **this** example the marker sits on the authored body wrapper, not on the outer `<main>` that also holds chrome:

- **Home** — On the inner wrapper around the home body in `templates/layout.hbs` (class `doc-home-content`), so the hero and listings are indexed while the global header stays peripheral.

- **Guide and feature articles** — On the root `<article>` in `templates/article.hbs` (the same element exposes `id="doc-main-content"` for the skip link). The mobile TOC and date line sit inside that article; the layout shell, sidebar, and footer stay outside.

- **About** — Same pattern as articles: `<article id="doc-main-content" ... data-pagefind-body>` in `templates/about.hbs`.

If you add new templates, add `data-pagefind-body` on the narrowest element that should represent “page content” for search snippets.

## Component UI

The modal, trigger, and keyboard shortcut are declared at the bottom of `templates/layout.hbs` (`<pagefind-modal>`, `<pagefind-modal-trigger>`, etc.). Styling comes from `pagefind/pagefind-component-ui.css`; behavior from `pagefind/pagefind-component-ui.js`, both under the Vite `base` path.

## Development vs production

During `vite dev`, Pagefind has not written an index yet, so search assets may 404 until you run a production `npm run build`. The site still works; search is a progressive enhancement.

```hbs title="templates/layout.hbs (excerpt)"
<link rel="stylesheet" href="{{basePath}}pagefind/pagefind-component-ui.css" />
```

```hbs title="templates/layout.hbs (excerpt)"
<script src="{{basePath}}pagefind/pagefind-component-ui.js" type="module"></script>
```

## Client entry

`client.js` adjusts `<pagefind-modal-trigger>` attributes at small breakpoints (compact layout). That is optional polish; the modal works without it.
