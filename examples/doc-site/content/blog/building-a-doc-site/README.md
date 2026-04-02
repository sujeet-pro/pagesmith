---
title: "Building a Documentation Site with Pagesmith"
description: "A step-by-step walkthrough of setting up a documentation site using @pagesmith/docs, from initial scaffolding to deployment."
publishedDate: 2026-03-10T00:00:00.000Z
lastUpdatedOn: 2026-03-20T00:00:00.000Z
tags:
  - guide
  - getting-started
---

# Building a Documentation Site with Pagesmith

Setting up a documentation site should be fast and painless. With `@pagesmith/docs`, you get a convention-based docs framework that turns a folder of markdown files into a fully navigable, searchable static site.

## Why Pagesmith for Docs?

Most documentation tools require you to learn a custom templating language or maintain a complex configuration file. Pagesmith takes a different approach:

- **Filesystem-first**: Your content directory structure becomes your navigation.
- **Schema-validated**: Frontmatter is validated with Zod schemas, catching errors at build time.
- **Zero-config defaults**: A `pagesmith.config.json5` file and a `content/` directory are all you need.
- **Search built-in**: Pagefind integration provides instant client-side search with no backend.

## Getting Started

Install `@pagesmith/docs` and create your content directory:

```bash
npm install @pagesmith/docs
mkdir -p content/guide
```

Add a home page at `content/README.md` and section pages under `content/guide/`. Each top-level folder in `content/` becomes a navigation section automatically.

## Customizing Layouts

The default theme provides `DocHome` and `DocPage` layouts. You can override them by adding a `theme/layouts/` directory to your project and specifying overrides in `pagesmith.config.json5`:

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

## Deploying

Run `npx pagesmith build` to produce static HTML in your output directory. The result can be deployed to any static host -- GitHub Pages, Netlify, Vercel, or a simple file server.

## What is Next

In the next post, we will look at how to use series grouping and meta files to organize large documentation sets.
