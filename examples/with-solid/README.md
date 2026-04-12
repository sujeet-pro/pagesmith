# Pagesmith + Solid

A content-driven static site using `@pagesmith/core` with SolidJS (`solid-js/web`) for server-side rendering. Demonstrates the Vite content plugin flow with Solid components, virtual content imports, Pagefind search, and progressive client-side enhancements.

## Quick Start

```bash
# From the monorepo root
vp install
vp run dev:eg:solid
```

## Architecture

Content is defined in `content.config.ts` using `defineCollection` with Zod schemas. **`pagesmithContent`** validates markdown and exposes **`virtual:content/*`** modules that **`src/entry-server.tsx`** imports at build time. Solid’s **`renderToString`** turns layout JSX into HTML fragments; **`renderDocument()`** wraps them in the full document (meta, assets, optional Pagefind Component UI, deferred **`client.js`**). **`pagesmithSsg`** wires dev SSR middleware and the production pass: **`getRoutes`**, per-URL **`render`**, writing `index.html`, then Pagefind indexing.

The site works without JavaScript. **`client.js`** loads site CSS, **`@pagesmith/core/runtime/content`** for code-block UI, and **`src/runtime.ts`** for TOC highlighting, mobile sidebar, theme controls, and small Pagefind trigger tweaks. Search UI is emitted on **production** builds only (`searchEnabled` is false in dev SSR).

See **`llms.txt`** in this folder for agent-oriented integration notes, and **`content/guide/`** for the same story in prose.

## Content

| Directory | Collection | Description |
|-----------|-----------|-------------|
| `content/guide/` | `guide` | How this example works, including `guide/kitchen-sink.md` for markdown regression |
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

[View live example](https://projects.sujeet.pro/pagesmith/examples/solid)
