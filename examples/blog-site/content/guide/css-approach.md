---
title: CSS Approach
description: Building styles from site CSS imports
date: 2026-03-16
tags:
  - css
  - styling
series: Core Concepts
seriesOrder: 2
---

# CSS Approach

The blog-site example builds its stylesheet from `@pagesmith/site/css/content` plus custom layout CSS. This gives you prose typography and inline code styling from the shared site package, while the layout (header, sidebar, grid, TOC) is defined in the example itself.

## What the shared site package provides

The `@pagesmith/site/css/content` import bundles:

- **Reset** -- A minimal CSS reset (box-sizing, margin removal)
- **Viewport** -- Responsive viewport base styles
- **Prose** -- Typography for rendered markdown (headings, lists, links, blockquotes, tables, images)
- **Inline code** -- Styling for inline `code` elements (the built-in Pagesmith renderer handles fenced code blocks)

## What the example adds

The `theme.css` file in `src/` adds layout and component styles that match the framework examples:

- **Design tokens** -- CSS custom properties for colors, typography, spacing, shadows
- **Layout grid** -- Responsive 3-column layout (sidebar, main, aside) with `ch`-based breakpoints
- **Header** -- Fixed top bar with logo, navigation, search trigger
- **Sidebar** -- Left navigation with collapsible groups, mobile modal overlay
- **TOC** -- Right-side table of contents with scroll highlighting
- **Home page** -- Hero section, feature cards, guide listing
- **Search** -- Modal dialog with Pagefind UI integration
- **Footer** -- Copyright and external links

## CSS imports

The `@pagesmith/site/css/content` import is a real CSS file that Vite resolves and bundles. The theme CSS imports it at the top:

```css title="src/theme.css"
@import '@pagesmith/site/css/content';

/* Custom layout styles follow... */
```

Vite's CSS pipeline handles the import resolution, deduplication, and minification in the production build.

## Font loading

Shared fonts (Open Sans and JetBrains Mono) are copied to the output by the `sharedAssetsPlugin()` Vite plugin. The entry server references them via a `fonts.css` link in the document `<head>`.
