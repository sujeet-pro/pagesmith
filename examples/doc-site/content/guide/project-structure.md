---
title: Project Structure
description: Understanding the convention-based file layout
date: 2026-03-19
tags: [architecture]
series: Getting Started
seriesOrder: 2
---

## Convention-Based Layout

A `@pagesmith/docs` site requires only a config file and a content directory:

```
doc-site/
  pagesmith.config.json5   # Site configuration
  content/
    README.md              # Home page (uses DocHome layout)
    guide/                 # Guide section (auto-generates sidebar)
      meta.json5           # Section metadata (display name, ordering)
      installation.md
      project-structure.md
    features/              # Features section
      code-blocks.md
      gfm-extensions.md
  theme/
    layouts/               # Optional layout overrides
      DocHome.tsx
      DocPage.tsx
  public/
    favicon.svg
```

## How Navigation Works

Top-level folders under `content/` automatically become navigation sections. Each section generates its own sidebar. The `meta.json5` file controls display names and article ordering within a section.

## Layout Overrides

The `theme.layouts` config key maps layout names to JSX files. This example overrides `DocHome` and `DocPage` to customize the home page hero and content page structure.
