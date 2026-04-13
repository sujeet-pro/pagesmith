---
title: Installation
description: Setting up a @pagesmith/docs site
publishedDate: 2026-03-20
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
npx pagesmith-docs init
```

This creates a `pagesmith.config.json5` with smart defaults detected from your git repository, including `basePath` and `origin` for GitHub Pages deployment.

If you already follow the default conventions, the config file is optional: `pagesmith-docs dev`, `build`, `preview`, and `mcp --stdio` can run directly from a repo-root `docs/` folder and emit to `gh-pages/`.

## Running Locally

```bash
npx pagesmith-docs dev
```

The dev server starts with hot reload. Content changes rebuild instantly without rebundling CSS or JavaScript.

## Building for Production

```bash
npx pagesmith-docs build
```

Outputs static HTML to `outDir` in `pagesmith.config.json5` (default: `gh-pages/` when you omit the field, or even the entire config file in zero-config mode). When `search.enabled` is true, the build runs Pagefind indexing against that HTML output.

## Preview the last build

```bash
npx pagesmith-docs preview
```

Serves the generated static files locally so you can validate hosting paths, `basePath`, and search without guessing from dev mode alone.

## MCP server (agents & editors)

```bash
npx pagesmith-docs mcp --stdio
```

Runs the docs MCP server on stdio for tools that speak the Model Context Protocol (for example editor integrations that need project-aware docs commands).
