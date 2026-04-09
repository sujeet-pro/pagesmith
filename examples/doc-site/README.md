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

## Theme System

This example uses the Pagesmith theme system provided by `@pagesmith/docs`, with layout overrides adding custom theme UI:

- **Header theme dropdown** — Sun icon button with Appearance (Auto/Light/Dark), Theme (Paper/High Contrast), and Text Size (Small/Default/Large) controls, added via the `DocHome.tsx`/`DocPage.tsx` layout overrides
- **Footer theme controls** — Segmented button groups for Appearance, Theme, and Text Size
- **FOUC prevention** — Inline script restores `colorScheme`, `theme`, and `textSize` from `localStorage` before CSS paints, injected by the layout overrides
- **Theme persistence** — All preferences stored in `localStorage` under `pagesmith-theme`

### CSS Theme Features

CSS theme support comes from `@pagesmith/docs` through the docs build pipeline:

- Color scheme classes: `.color-scheme-auto`, `.color-scheme-light`, `.color-scheme-dark`
- Theme variants: `.theme-paper` (warm, low-contrast), `.theme-high-contrast` (WCAG AAA)
- Text size scaling: `html[data-text-size="small|base|large"]`
- All design tokens use `light-dark()` for automatic light/dark mode support

## Deployed

[View live example](https://projects.sujeet.pro/pagesmith/examples/doc-site/)
