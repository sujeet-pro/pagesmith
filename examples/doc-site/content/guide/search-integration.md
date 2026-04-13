---
title: Search Integration
description: Built-in Pagefind search
publishedDate: 2026-03-15
tags: [search, pagefind]
series: Customization
seriesOrder: 3
---

## Built-In Search

`@pagesmith/docs` includes Pagefind search out of the box. After building your site, Pagefind indexes all pages and provides a fast client-side search experience.

## Configuration

Search is enabled by default. Customize it in your config:

```json5
{
  search: {
    enabled: true,
    showImages: false,
    showSubResults: true,
    pagefindFlags: [],
  },
}
```

## How It Works

1. During `pagesmith-docs build`, Pagefind indexes the HTML output
2. The built-in theme includes a search dialog triggered by a button or `Cmd/Ctrl+K`
3. Search results appear instantly with highlighted matches
4. Sub-results show individual sections within pages

## Search Attributes

Pages are indexed via the `data-pagefind-body` attribute on the content body only. In the built-in theme that means the home page indexes its content wrapper, article pages index the `<article>` body, and layout chrome like headers, sidebars, breadcrumbs, and footers stay out of search. The theme handles this automatically — no manual markup needed.

If search indexing fails (e.g., Pagefind not installed), the build continues with a warning. The site works normally without search.
