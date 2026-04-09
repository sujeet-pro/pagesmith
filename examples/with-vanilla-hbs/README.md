# Pagesmith + Handlebars

A content-driven static site using `@pagesmith/core` with Handlebars templates for server-side rendering. Demonstrates the content plugin flow with template-based rendering, custom helpers, Pagefind search, and progressive client-side enhancements.

## Quick Start

```bash
# From the monorepo root
vp install
vp run dev:eg:vanilla-hbs
```

## Architecture

Content is defined in `content.config.mjs` using `defineCollection` with Zod schemas. The SSR entry calls `createContentLayer()` with that config and loads collections at render time (no virtual content modules). Handlebars templates (`layout.hbs`, `index.hbs`, `article.hbs`, `about.hbs`) with custom helpers (`eq`, `startsWith`, `concat`) render pages via `Handlebars.compile()`. The `pagesmithSsg` plugin handles route discovery, HTML generation, and Pagefind indexing.

The site works without JavaScript. Inline client-side scripts add progressive enhancements: TOC scroll highlighting, Pagefind search modal (Cmd/Ctrl+K), and mobile sidebar toggle.

## Content

| Directory | Collection | Description |
|-----------|-----------|-------------|
| `content/guide/` | `guide` | How this example works (series-ordered) |
| `content/features/` | `features` | Markdown feature showcase |
| `content/pages/` | `pages` | Standalone pages (about) |

## Theme System

This example implements the full Pagesmith theme system using `@pagesmith/core` with Handlebars templates:

- **Header theme dropdown** — Sun icon button with Appearance (Auto/Light/Dark), Theme (Paper/High Contrast), and Text Size (Small/Default/Large) controls
- **Footer theme controls** — Segmented button groups for Appearance, Theme, and Text Size
- **FOUC prevention** — Inline script restores `colorScheme`, `theme`, and `textSize` from `localStorage` before CSS paints
- **Theme persistence** — All preferences stored in `localStorage` under `pagesmith-theme`

### CSS Theme Features

- Color scheme classes: `.color-scheme-auto`, `.color-scheme-light`, `.color-scheme-dark`
- Theme variants: `.theme-paper` (warm, low-contrast), `.theme-high-contrast` (WCAG AAA)
- Text size scaling: `html[data-text-size="small|base|large"]`
- All design tokens use `light-dark()` for automatic light/dark mode support

## Deployed

[View live example](https://projects.sujeet.pro/pagesmith/examples/vanilla-hbs/)
