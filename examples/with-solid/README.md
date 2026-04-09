# Pagesmith + Solid

A content-driven static site using `@pagesmith/core` with SolidJS (`solid-js/web`) for server-side rendering. Demonstrates the Vite content plugin flow with Solid components, virtual content imports, Pagefind search, and progressive client-side enhancements.

## Quick Start

```bash
# From the monorepo root
vp install
vp run dev:eg:solid
```

## Architecture

Content is defined in `content.config.ts` using `defineCollection` with Zod schemas. The `pagesmithContent` Vite plugin generates virtual modules that the SSR entry imports. Solid components using `For`, `Show`, and `renderToString` render each page to static HTML. The `pagesmithSsg` plugin handles route discovery, HTML generation, and Pagefind indexing.

The site works without JavaScript. Client-side `runtime.ts` adds progressive enhancements: TOC scroll highlighting, Pagefind search modal (Cmd/Ctrl+K), and mobile sidebar toggle.

## Content

| Directory | Collection | Description |
|-----------|-----------|-------------|
| `content/guide/` | `guide` | How this example works (series-ordered) |
| `content/features/` | `features` | Markdown feature showcase |
| `content/pages/` | `pages` | Standalone pages (about) |

## Theme System

This example implements the full Pagesmith theme system using `@pagesmith/core` with Solid components:

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

[View live example](https://projects.sujeet.pro/pagesmith/examples/solid/)
