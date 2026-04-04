# Pagesmith Doc Site Example

A documentation site built entirely with `@pagesmith/docs` and configured through `pagesmith.config.json5`. Demonstrates zero-config docs with convention-based navigation, built-in Pagefind search, and optional layout overrides.

## Quick Start

```bash
# From the monorepo root
vp install
vp run dev:eg:doc-site
```

## Architecture

Content lives in `content/` — top-level folders (`guide/`, `features/`) automatically become navigation sections with sidebar generation. No `vite.config.ts` or `content.config.ts` needed. The `pagesmith.config.json5` controls everything: site metadata, basePath, search, sidebar behavior, edit links, and layout overrides.

Custom layout overrides in `theme/layouts/` (DocHome.tsx, DocPage.tsx) use `@pagesmith/core` JSX runtime to produce the same HTML structure as the from-scratch framework examples.

## Content

| Directory | Section | Description |
|-----------|---------|-------------|
| `content/guide/` | Guide | How @pagesmith/docs works |
| `content/features/` | Features | Markdown feature showcase |
| `content/pages/` | — | Standalone pages (about) |

## Deployed

[View live example](https://projects.sujeet.pro/pagesmith/examples/doc-site/)
