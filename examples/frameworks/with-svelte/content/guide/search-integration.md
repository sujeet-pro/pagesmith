---
title: Search Integration
description: Pagefind indexing, the document shell, and the search trigger in this example
date: 2026-03-15
tags:
  - search
  - pagefind
series: Framework Integration
seriesOrder: 3
---

# Search Integration

Search uses [Pagefind](https://pagefind.app/) with **Component UI**. `pagesmithSsg` runs the indexer after HTML is written; the browser loads scripts/styles from `pagefind/` under your `base` path.

## What gets indexed

Pagefind only indexes subtrees marked with `data-pagefind-body`:

- **Home** — `HomeBody.svelte` sets it on the `<main>` that wraps the hero and listings.
- **Articles** — `PageBody.svelte` sets it on the inner `<article>` (the `.prose` region and in-article nav). The outer `<main class="doc-main">` is **not** marked, so the desktop sidebar and duplicated chrome stay out of the index.

```svelte title="src/components/HomeBody.svelte (excerpt)"
<main id="doc-main-content" class="doc-home" tabindex="-1" data-pagefind-body="">
```

```svelte title="src/components/PageBody.svelte (excerpt)"
<main class="doc-main">
  <article id="doc-main-content" tabindex="-1" data-pagefind-body="">
```

## Where the modal lives

When `render(url, config)` passes `searchEnabled: true` into `renderDocumentShell()`, the shell appends a single `<pagefind-modal>...</pagefind-modal>` **after** `bodyHtml` (alongside the deferred client script). That keeps one modal in the DOM regardless of framework.

Svelte output (`App.svelte` and children) should **not** declare another `<pagefind-modal>` — it would duplicate the shell and confuse Component UI.

## Trigger

`SiteHeader.svelte` renders `<pagefind-modal-trigger>` when `searchEnabled` is true. Keyboard shortcuts (e.g. Cmd/Ctrl+K) come from Pagefind, not from `src/runtime.ts` (that file only tweaks `compact` on the trigger for small viewports).

## Development vs production

Until a production build has produced `pagefind/` assets and an index, search UI may load but return no results. `searchEnabled` still controls whether shell assets and the modal are emitted.
