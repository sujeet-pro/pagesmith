---
title: "Adding Search"
description: "Integrate Pagefind search into your Pagesmith site with a modal UI."
date: 2026-03-12
tags: [search, pagefind]
series: framework-integration
seriesOrder: 3
---

# Adding Search

Pagesmith examples use Pagefind for full-text search. It indexes your pre-rendered HTML at build time and provides a lightweight client-side search UI.

## Build-time indexing

After pre-rendering, run the Pagefind binary:

```js
import { execFileSync } from 'child_process'

const pagefindMain = fileURLToPath(import.meta.resolve('pagefind'))
const pagefindBin = join(dirname(pagefindMain), '..', 'lib', 'runner', 'bin.cjs')
execFileSync(process.execPath, [pagefindBin, '--site', outDir])
```

## Search modal

The search UI opens as a modal dialog, triggered by a button click or `Ctrl+K` / `Cmd+K`:

```html
<dialog id="search-modal">
  <div data-pagefind-search></div>
</dialog>
```

```js
const modal = document.getElementById('search-modal')
const trigger = document.querySelector('[data-search-trigger]')

trigger.addEventListener('click', () => modal.showModal())

document.addEventListener('keydown', (e) => {
  if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
    e.preventDefault()
    modal.open ? modal.close() : modal.showModal()
  }
})
```

## Disabling images

By default, Pagesmith configures `showImages: false` in the PagefindUI to keep results clean:

```js
new PagefindUI({
  element: container,
  showImages: false,
  showSubResults: true,
  resetStyles: false,
})
```

## Controlling what gets indexed

Add `data-pagefind-body` to your main content element so Pagefind only indexes article content, not navigation or footers.
