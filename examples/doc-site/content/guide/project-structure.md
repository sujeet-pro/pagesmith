---
title: Project Structure
description: Understanding the convention-based file layout
publishedDate: 2026-03-19
tags: [architecture]
series: Getting Started
seriesOrder: 2
---

## How `@pagesmith/docs` uses `@pagesmith/core`

`@pagesmith/docs` is the opinionated docs app: package-owned `pagesmith-docs` CLI, default theme, navigation, Pagefind, and validation rules for this style of site. The package builds on the shared Pagesmith content/site stack internally, and it re-exports the supported layout-override surface so docs consumers can stay on `@pagesmith/docs`. You see that in this example's overrides — components import `h` from `@pagesmith/docs/jsx-runtime` and reuse the shared shell through `@pagesmith/docs/components`.

## Convention-Based Layout

A `@pagesmith/docs` site can run zero-config with a repo-root `docs/` folder, or with an explicit config file plus a content directory like this example:

```
doc-site/
  pagesmith.config.json5   # Site configuration
  content/
    README.md              # Home page (uses DocHome layout)
    guide/                 # Guide section (auto-generates sidebar)
      meta.json5           # Section metadata (display name, ordering)
      installation.md
      project-structure.md
      kitchen-sink.md      # Single markdown regression page
  theme/
    layouts/               # Optional layout overrides
      DocHome.tsx
      DocPage.tsx
  public/
    favicon.svg
```

## How Navigation Works

Top-level folders under `content/` automatically become navigation sections. This example keeps a single `guide/` section, and the `meta.json5` file controls display names and article ordering within it. Nested markdown files still belong to that same top-level section, and the reader-facing sidebar stays flat unless you explicitly group pages with `series`.

## Layout Overrides

The `theme.layouts` config key maps layout names to JSX files. This example overrides `DocHome` and `DocPage` to customize the home page hero and content page structure while keeping the same HTML landmarks (`data-pagefind-body`, skip link, sidebar regions) the default theme expects.

## Commands in one place

Typical published-CLI entry points (often via `npx pagesmith-docs …` after installing `@pagesmith/docs`):

- `pagesmith-docs dev` — local development with fast content rebuilds.
- `pagesmith-docs build` — emit static HTML to `outDir` and index with Pagefind when search is enabled.
- `pagesmith-docs preview` — serve the last build output locally.
- `pagesmith-docs mcp --stdio` — run the docs MCP server for agent/editor integrations.

This monorepo wires the same flags through `package.json` scripts pointing at the workspace CLI with `--config ./pagesmith.config.json5`.
