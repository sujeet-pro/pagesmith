---
title: Layout Overrides
description: Customizing page layouts with JSX components
publishedDate: 2026-03-17
tags: [layouts, customization]
series: Customization
seriesOrder: 1
---

## Default Layouts

`@pagesmith/docs` ships with built-in layouts:

- **DocHome** — Landing page with hero section, feature cards, and install command
- **DocPage** — Content page with sidebar, prose area, and TOC aside
- **DocListing** — Auto-generated listing pages for grouped sections
- **DocNotFound** — 404 error page

## Overriding Layouts

Override any layout by adding a JSX file and mapping it in the config (this example’s real paths):

```json5
{
  theme: {
    layouts: {
      home: './theme/layouts/DocHome.tsx',
      page: './theme/layouts/DocPage.tsx',
    },
  },
}
```

Layout components receive props such as rendered `content`, `frontmatter`, `headings`, `slug`, `site`, plus docs-only navigation props (`sidebarSections`, `breadcrumbs`, `prev`/`next`, `editUrl`, …). They render HTML with `@pagesmith/site/jsx-runtime` (`h`, `Fragment`) and should import the document shell from `@pagesmith/docs/theme` (`Html`) so head tags, theme script bootstrapping, and assets stay consistent with the package.

This repository’s `theme/layouts/DocHome.tsx` and `DocPage.tsx` mirror the default docs structure on purpose: same landmark classes, `data-pagefind-body` on the indexed regions, and shared header/footer/sidebar helpers from `theme/layouts/shared.tsx`. Start from those files when customizing rather than inventing new DOM shapes.
