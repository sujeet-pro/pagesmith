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

The blog-site example builds its stylesheet from `@pagesmith/site/css/standalone` plus example-specific overrides. That gives you the shared shell, prose, code-block chrome, TOC, sidebar, and search styling from the site package, while the example can still tune the layout and theme details locally.

## What the shared site package provides

The `@pagesmith/site/css/standalone` import bundles:

- **Reset + tokens** -- Shared site foundations and theme variables
- **Prose + code chrome** -- Typography, inline code, fenced code blocks, tabs, and alerts
- **Chrome/layout** -- Header, sidebar, TOC, footer, grid, and search styles
- **Viewport** -- Responsive viewport base styles

## What the example adds

The `theme.css` file in `src/` keeps the same shared shell, then adjusts it for this example:

- **Design tokens** -- CSS custom properties for colors, typography, spacing, shadows
- **Layout grid** -- Responsive 3-column layout (sidebar, main, aside) with `ch`-based breakpoints
- **Header** -- Fixed top bar with logo, navigation, search trigger
- **Sidebar** -- Left navigation with collapsible groups, mobile modal overlay
- **TOC** -- Right-side table of contents with scroll highlighting
- **Home page** -- Hero section, feature cards, guide listing
- **Search** -- Modal dialog with Pagefind UI integration
- **Footer** -- Copyright and external links

## CSS imports

The `@pagesmith/site/css/standalone` import is a real CSS file that Vite resolves and bundles. The theme CSS imports it at the top:

```css title="src/theme.css"
@import '@pagesmith/site/css/standalone';

/* Custom layout styles follow... */
```

Vite's CSS pipeline handles the import resolution, deduplication, and minification in the production build.

## Font loading

Shared fonts (Open Sans and JetBrains Mono) are copied to the output by the `sharedAssetsPlugin()` Vite plugin. The entry server references them via a `fonts.css` link in the document `<head>`.

For the canonical local-image and JPEG `<picture>` examples, use the root docs page at `/guide/markdown-features`; this example keeps its content assets lightweight and focused on site structure.
