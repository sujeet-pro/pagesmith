# Pagesmith Doc Site Example

A documentation site built entirely with `@pagesmith/docs` and configured through `pagesmith.config.json5`. Demonstrates zero-config docs with convention-based navigation, built-in Pagefind search, and optional layout overrides.

## Quick Start

```bash
# From the monorepo root
vp install
vp run dev:eg:doc-site
```

## Architecture

Content lives in `content/` with a single top-level `guide/` section. The markdown regression surface also lives there as `guide/kitchen-sink.md`, so there is one obvious page to check rendered markdown output. No `vite.config.ts` or `content.config.ts` needed. The `pagesmith.config.json5` controls everything: site metadata, grouped footer links, copyright, search, sidebar behavior, edit links, and layout overrides.

Custom layout overrides in `theme/layouts/` use the same docs HTML shell and component structure as the package defaults, so the example stays aligned with current `@pagesmith/docs` behavior while still showing how to own the layout files locally.

## Content

| Directory | Section | Description |
|-----------|---------|-------------|
| `content/README.md` | Home | Landing page frontmatter for hero, install, package cards, and code example |
| `content/guide/` | Guide | How @pagesmith/docs works |
| `content/guide/kitchen-sink.md` | Guide | Single markdown regression page for this example |

## Theme System

This example uses the Pagesmith theme system provided by `@pagesmith/docs`, with layout overrides keeping the package theme behavior intact:

- **Header theme dropdown** — Sun icon button with Appearance (Auto/Light/Dark), Theme (Paper/High Contrast), and Text Size (Small/Default/Large) controls
- **Footer theme controls** — Segmented button groups for Appearance, Theme, and Text Size
- **FOUC prevention** — The shared docs HTML shell restores `colorScheme`, `theme`, and `textSize` from `localStorage` before CSS paints
- **Theme persistence** — All preferences stored in `localStorage` under `pagesmith-theme`

### CSS Theme Features

CSS theme support comes from `@pagesmith/docs` through the docs build pipeline:

- Color scheme classes: `.color-scheme-auto`, `.color-scheme-light`, `.color-scheme-dark`
- Theme variants: `.theme-paper` (warm, low-contrast), `.theme-high-contrast` (WCAG AAA)
- Text size scaling: `html[data-text-size="small|base|large"]`
- All design tokens use `light-dark()` for automatic light/dark mode support

## Agent-oriented notes

`llms.txt` in this folder summarizes the docs-package layout, commands, and boundaries for assistants (for example: JSON5 config on disk rather than a TypeScript `defineDocsConfig` indirection).

## Deployed

[View live example](https://projects.sujeet.pro/pagesmith/examples/doc-site)
