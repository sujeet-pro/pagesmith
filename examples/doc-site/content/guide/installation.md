---
title: Installation
description: Setting up a @pagesmith/docs site
date: 2026-03-20
tags: [setup]
series: Getting Started
seriesOrder: 1
---

## Getting Started with @pagesmith/docs

Install the docs package:

```bash
npm install @pagesmith/docs
```

Initialize a new docs site:

```bash
npx pagesmith init
```

This creates a `pagesmith.config.json5` with smart defaults detected from your git repository — including `basePath` and `origin` for GitHub Pages deployment.

## Running Locally

```bash
npx pagesmith dev
```

The dev server starts with hot reload. Content changes rebuild instantly without rebundling CSS or JavaScript.

## Building for Production

```bash
npx pagesmith build
```

Outputs static HTML to `gh-pages/` (configurable via `outDir`). Pagefind search indexing runs automatically.
