---
layout: DocHome
title: Example Docs
badge: Layout Overrides + Search
tagline: Documentation powered by Pagesmith
description: A fully featured documentation site with search, series navigation, and custom layout overrides -- built entirely from configuration and markdown.
install: npm install @pagesmith/docs
actions:
  - text: Get Started
    link: /guide/installation
    theme: brand
  - text: View on GitHub
    link: https://github.com/sujeet-pro/pagesmith
    theme: alt
features:
  - icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"/></svg>
    title: Filesystem-First
    details: Your content directory structure becomes your site navigation. Drop markdown files in folders and Pagesmith does the rest.
  - icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
    title: Schema-Validated
    details: Frontmatter is validated with Zod schemas at build time. Catch errors before they reach production.
  - icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
    title: Built-In Search
    details: Pagefind integration provides instant client-side search with zero backend configuration.
  - icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zm0 8a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zm10 0a1 1 0 011-1h4a1 1 0 011 1v6a1 1 0 01-1 1h-4a1 1 0 01-1-1v-6z"/></svg>
    title: Layout Overrides
    details: Customize any layout by providing your own JSX components in a theme directory.
  - icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
    title: Series Navigation
    details: Group related pages into ordered series with previous/next navigation for guided reading.
  - icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M5 12h14M5 12l4-4m-4 4l4 4"/></svg>
    title: Static Output
    details: Produces plain HTML files deployable to any static host -- GitHub Pages, Netlify, Vercel, or a file server.
packages:
  - name: "@pagesmith/docs"
    description: Convention-based docs with search, navigation, frontmatter validation, and layout overrides.
    href: /guide/configuration
    tag: Docs
  - name: "@pagesmith/core"
    description: Shared content layer, markdown pipeline, JSX runtime, and Vite integrations that power the docs package.
    href: /guide/content-collections
    tag: Core
codeExample:
  label: Quick Start
  title: pagesmith.config.json5 (excerpt)
  code: |
    {
      name: 'Pagesmith',
      title: 'Example Docs',
      contentDir: './content',
      outDir: '../../gh-pages/examples/doc-site',
      basePath: '/pagesmith/examples/doc-site',
      theme: {
        layouts: {
          home: './theme/layouts/DocHome.tsx',
          page: './theme/layouts/DocPage.tsx',
        },
      },
      search: { enabled: true, showSubResults: true },
    }
---

## Welcome to Example Docs

This site is the `@pagesmith/docs` package example: config-first (`pagesmith.config.json5`), markdown in `content/`, section `meta.json5` for sidebars and series, optional JSX layout overrides, and Pagefind search wired by the docs build.

## Explore

- **[Guide](/guide/installation)** — install, dev/build/preview/MCP, project layout, `meta.json5`, layouts, search, and how `@pagesmith/core` backs the markdown pipeline.
- **[Configuration](/guide/configuration)** — the same options as this repo’s `pagesmith.config.json5`, explained field-by-field.
- **[Kitchen sink](/guide/kitchen-sink)** — single markdown regression page for this example's rendered output.
