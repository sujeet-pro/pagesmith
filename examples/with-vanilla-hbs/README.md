# Pagesmith + Handlebars

A **filesystem-first** static site: `@pagesmith/core` validates and renders markdown, **Vite** (`pagesmithSsg`) drives dev + build, **Handlebars** emits HTML at SSR time, and a small **`client.js`** entry adds progressive enhancements (core runtime, responsive search trigger). No `@pagesmith/docs` shell — the example shows the direct integration path.

## Integration flow (read this first)

1. **`content.config.mjs`** — Collections + Zod schemas.
2. **`src/entry-server.tsx`** — `createContentLayer`, `getRoutes` / `render` for `pagesmithSsg`, Handlebars compile.
3. **`templates/*.hbs`** — Layout shell vs page body (`{{#> layout}}` + inline `body` partial).
4. **`vite.config.ts`** — `sharedAssetsPlugin` + `pagesmithSsg` (watches `content/`).
5. **`client.js`** — Browser-only: theme CSS + `@pagesmith/core/runtime/content`; not used for primary HTML.

Agent-oriented checklist: `llms.txt` in this directory.

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
| `content/guide/` | `guide` | How this example works, including `guide/kitchen-sink.md` for markdown regression |
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

[View live example](https://projects.sujeet.pro/pagesmith/examples/vanilla-hbs)
