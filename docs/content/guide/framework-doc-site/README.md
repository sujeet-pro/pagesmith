---
title: Doc Site with @pagesmith/docs
description: Build a documentation site from configuration alone using @pagesmith/docs with optional layout overrides.
---

# Doc Site with @pagesmith/docs

## Overview

The Doc Site pattern uses `@pagesmith/docs` to build a full documentation site from configuration alone. Unlike the other examples that wire `@pagesmith/core` and `@pagesmith/site` directly, this relies on the higher-level `@pagesmith/docs` preset, which provides the docs theme, convention-based navigation generated from the `content/` directory, Pagefind search, listing pages, and layout override support. You write markdown in a content tree, configure the site in `pagesmith.config.json5`, and optionally override the default layouts with custom JSX files using `@pagesmith/site/jsx-runtime`.

Source: [`examples/doc-site/`](https://github.com/sujeet-pro/pagesmith/tree/main/examples/doc-site) | Output: <a href="/pagesmith/examples/doc-site" target="_blank" rel="noopener noreferrer">Live Demo</a>

## Prerequisites

- Node.js 20+

## Project Setup

### package.json

The main dependency is `@pagesmith/docs`, which pulls in the matching `@pagesmith/core` and `@pagesmith/site` runtime pieces for the default preset. There is no need to wire Vite plugins or low-level build tooling yourself:

```json
{
  "name": "@pagesmith/example-doc-site",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "pagesmith-docs dev --config ./pagesmith.config.json5",
    "build": "pagesmith-docs build --config ./pagesmith.config.json5"
  },
  "dependencies": {
    "@pagesmith/docs": "*"
  }
}
```

### Project Structure

```text
doc-site/
  content/
    README.md           # Home page content (with hero frontmatter)
    guide/
      meta.json5        # Section ordering and metadata
      getting-started/
        README.md
      configuration/
        README.md
    blog/
      meta.json5
      building-a-doc-site/
        README.md
      organizing-content-with-series/
        README.md
    reference/
      cli/
        README.md
  theme/
    layouts/
      DocHome.tsx    # Custom home page layout override
      DocPage.tsx    # Custom page layout override
  pagesmith.config.json5    # Site configuration
  package.json
```

### pagesmith.config.json5

The site is configured entirely through this file:

```json5
{
  name: 'Pagesmith',
  title: 'Example Docs',
  description: 'Documentation site built with @pagesmith/docs',
  origin: 'https://projects.sujeet.com',
  contentDir: './content',
  outDir: './dist',
  basePath: '/my-docs',
  homeLink: '/',
  sidebar: {
    collapsible: true,
  },
  copyright: {
    projectName: 'Example Docs',
    startYear: 2024,
    endYear: null,
  },
  footerLinks: [
    {
      header: 'Docs',
      links: [
        { label: 'Guide', path: '/guide' },
        { label: 'API', path: '/api' },
        { label: 'Reference', path: '/reference' },
      ],
    },
    {
      header: 'More',
      links: [{ label: 'Blog', path: '/blog' }],
    },
  ],
  search: {
    enabled: true,
    showImages: false,
  },
}
```

Key configuration options:

| Option | Description |
|---|---|
| `name` | Displayed in the site header as the logo text |
| `title` | Default page title and meta title |
| `contentDir` | Path to the content directory; top-level folders become navigation sections |
| `outDir` | Build output directory |
| `basePath` | URL base path for the site |
| `homeLink` | Where the logo links to (useful when nested under a parent site) |
| `sidebar.collapsible` | When `true`, sidebar sections use collapsible `<details>` elements |
| `search.enabled` | Enables Pagefind search with Cmd+K keyboard shortcut |
| `footerLinks` | Links displayed in the page footer as a flat wrapped row or grouped columns |
| `copyright` | Footer copyright config for the legal line at the bottom |

## Content Structure

Top-level folders under `content/` automatically generate navigation sections. Within each section, `meta.json5` files control page ordering and display names:

```json5
// content/guide/meta.json5
{
  displayName: 'Guide',
  orderBy: 'manual',
  items: ['getting-started', 'configuration', 'layouts'],
}
```

Each content entry is a folder containing a `README.md` file. This convention supports co-located assets (images, code samples) alongside the markdown content:

```text
content/
  README.md                           # Home page
  guide/
    meta.json5                        # Section ordering
    getting-started/
      README.md                       # Guide page
      screenshot.png                  # Co-located asset
    configuration/
      README.md
  blog/
    meta.json5
    building-a-doc-site/
      README.md
  reference/
    cli/
      README.md
```

### Home Page Frontmatter

The home page (`content/README.md`) supports hero and features frontmatter:

```md
---
title: My Documentation
hero:
  name: Pagesmith
  text: Content Toolkit
  tagline: Build documentation sites from markdown
  actions:
    - text: Get Started
      link: /guide/getting-started
      theme: brand
    - text: API Reference
      link: /reference
      theme: alt
features:
  - title: Markdown-First
    details: Write content in markdown with validated frontmatter schemas
  - title: Convention-Based
    details: Folder structure drives navigation automatically
  - title: Pagefind Search
    details: Full-text search indexed at build time
---
```

## Layout Overrides

The default `@pagesmith/docs` theme provides `DocHome` and `DocPage` layouts. You can override them by placing custom JSX files under `theme/layouts/`.

### Using @pagesmith/site/jsx-runtime

Layout overrides use `@pagesmith/site/jsx-runtime` for server-side JSX rendering. This is a lightweight runtime that produces HTML strings without any framework runtime:

```tsx
import { h } from '@pagesmith/site/jsx-runtime'
```

The `h` function creates `HtmlString` objects. Use `class` (not `className`), and inject raw HTML with the `innerHTML` prop:

```tsx
<div class="prose" innerHTML={content} />
```

### DocHome Override

The custom `DocHome.tsx` renders the home page with a hero section, feature cards, and optional prose content:

```tsx
import { h } from '@pagesmith/site/jsx-runtime'

type Props = {
  content: string
  frontmatter: Record<string, any>
  slug: string
  site: {
    name: string
    title: string
    description: string
    basePath?: string
    origin: string
    navItems?: Array<{ label: string; path: string }>
    search?: { enabled?: boolean; showImages?: boolean; showSubResults?: boolean }
    theme?: { lightColor?: string; darkColor?: string }
  }
}

export default function DocHome({ content, frontmatter, slug, site }: Props) {
  const hero = frontmatter.hero ?? {}
  const features = frontmatter.features ?? []
  const actions = hero.actions ?? frontmatter.actions ?? []
  const searchEnabled = site.search?.enabled !== false

  return (
    <html lang={site.language || 'en'} class="no-js">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="color-scheme" content="light dark" />
        <title>{frontmatter.title || site.title}</title>
        <link rel="stylesheet" href={assetPath(site, '/assets/style.css')} />
        {searchEnabled ? (
          <link rel="stylesheet" href={assetPath(site, '/pagefind/pagefind-component-ui.css')} />
        ) : null}
        <script innerHTML="document.documentElement.classList.remove('no-js')" />
        {searchEnabled ? (
          <script src={assetPath(site, '/pagefind/pagefind-component-ui.js')} type="module" />
        ) : null}
      </head>
      <body>
        <header class="doc-header">
          <div class="doc-header-inner">
            <div class="doc-header-left">
              <a href={site.basePath ? `${site.basePath}/` : '/'} class="doc-logo">
                {site.name}
              </a>
            </div>
            {site.navItems && site.navItems.length > 0 ? (
              <nav class="doc-nav">
                {site.navItems.map((item) => (
                  <a href={item.path}>{item.label}</a>
                ))}
              </nav>
            ) : null}
            {searchEnabled ? <pagefind-modal-trigger class="doc-search-trigger" /> : null}
          </div>
        </header>
        <main class="doc-home">
          <article class="doc-home-body" data-pagefind-body="">
            <section class="doc-hero">
              {hero.name ? <p class="doc-hero-name">{hero.name}</p> : null}
              <h1 class="doc-hero-text">{hero.text ?? frontmatter.title}</h1>
              {hero.tagline ? <p class="doc-hero-tagline">{hero.tagline}</p> : null}
              {actions.length > 0 ? (
                <div class="doc-hero-actions">
                  {actions.map((action: any) => (
                    <a
                      href={action.link}
                      class={`doc-hero-action ${action.theme === 'brand' ? 'doc-hero-action-brand' : 'doc-hero-action-alt'}`}
                    >
                      {action.text}
                    </a>
                  ))}
                </div>
              ) : null}
            </section>
            {features.length > 0 ? (
              <section class="doc-features">
                {features.map((feature: any) => (
                  <div class="doc-feature-card">
                    {feature.icon ? <span class="doc-feature-icon">{feature.icon}</span> : null}
                    <h3 class="doc-feature-title">{feature.title}</h3>
                    <p class="doc-feature-details">{feature.details}</p>
                  </div>
                ))}
              </section>
            ) : null}
            {content ? <div class="prose" innerHTML={content} /> : null}
          </article>
        </main>
        {searchEnabled ? (
          <pagefind-modal reset-on-close="">
            <pagefind-modal-header>
              <pagefind-input />
            </pagefind-modal-header>
            <pagefind-modal-body>
              <pagefind-summary />
              <pagefind-results
                show-images={site.search?.showImages ? '' : undefined}
                hide-sub-results={site.search?.showSubResults === false ? '' : undefined}
              />
            </pagefind-modal-body>
            <pagefind-modal-footer>
              <pagefind-keyboard-hints />
            </pagefind-modal-footer>
          </pagefind-modal>
        ) : null}
        <script src={assetPath(site, '/assets/main.js')} defer />
      </body>
    </html>
  )
}
```

### DocPage Override

The custom `DocPage.tsx` renders content pages with a three-column layout. It receives additional props:

```tsx
type Props = {
  content: string
  frontmatter: Record<string, any>
  headings?: Array<{ depth: number; text: string; slug: string }>
  slug: string
  site: { /* ... */ }
  sidebarSections?: Array<{
    title: string
    slug: string
    items: Array<{
      title: string
      path: string
      children?: Array<{ title: string; path: string }>
    }>
  }>
  prev?: { title: string; path: string }
  next?: { title: string; path: string }
}
```

The sidebar sections are generated automatically by `@pagesmith/docs` from the content directory structure. The `prev` and `next` props enable sequential navigation between pages.

Key features of the DocPage override:

- **Collapsible sidebar** -- `<details>` elements when `sidebar.collapsible` is enabled, with auto-expansion of the active section
- **Active link detection** -- highlights the current page in sidebar and top navigation
- **Table of contents** -- both mobile collapsible and desktop aside, filtered to h2-h3
- **Prev/next navigation** -- footer links to adjacent pages
- **Pagefind search** -- Pagefind Component UI (`<pagefind-modal>`, `<pagefind-modal-trigger>`) with Cmd+K shortcut

## CSS and Styling

Layout overrides use the default `@pagesmith/docs` theme styles, bundled automatically at `/assets/style.css`. The theme includes:

- CSS custom properties for colors, spacing, typography, and border radii
- Light and dark mode support via `prefers-color-scheme`
- Responsive three-column grid layout (sidebar, main, TOC aside)
- Prose styles for rendered markdown content
- Search modal and sidebar modal styles
- Hero and feature card styles for the home page

Custom layouts reference these styles through the standard `doc-*` CSS class names. You do not need to provide your own stylesheet unless you want to extend or override the theme.

The runtime JavaScript (`/assets/main.js`) provides progressive enhancements: TOC highlighting and sidebar toggle. Search is handled by Pagefind Component UI in the static HTML (`<pagefind-modal>`, `<pagefind-input>`, etc.).

## Pagefind Search

Search is configured in `pagesmith.config.json5`:

```json5
{
  search: {
    enabled: true,
    showImages: false,
  },
}
```

When enabled, `@pagesmith/docs` automatically:

1. Adds `data-pagefind-body` to the content body only so search indexes article/home content instead of header, sidebar, breadcrumbs, or footer chrome
2. Includes Pagefind Component UI CSS and JS assets (`pagefind-component-ui.css`, `pagefind-component-ui.js` as a module)
3. Renders `<pagefind-modal-trigger>` and a `<pagefind-modal>` tree (with `<pagefind-input>` for the query field instead of Default UI `.pagefind-ui__search-input`)
4. Wires Cmd+K and modal behavior through Component UI web components (no `new PagefindUI({ ... })`)
5. Runs Pagefind indexing after the build

No manual configuration is needed beyond setting `search.enabled: true`.

## Development and Building

```bash
# Start the dev server with live reload
pagesmith-docs dev --config ./pagesmith.config.json5

# Build the static site (SSG + Pagefind indexing)
pagesmith-docs build --config ./pagesmith.config.json5

# Preview the built site
pagesmith-docs preview --config ./pagesmith.config.json5
```

## Key Concepts

- **`@pagesmith/docs`** provides a complete documentation site from configuration alone -- no Vite config or entry server needed.
- **`pagesmith.config.json5`** drives the entire site: name, navigation, sidebar, search, output paths.
- **Convention-based navigation** -- top-level content folders become sections; `meta.json5` controls ordering.
- **Layout overrides** -- place `DocHome.tsx` and `DocPage.tsx` in `theme/layouts/` to customize rendering.
- **`@pagesmith/site/jsx-runtime`** -- lightweight server-side JSX runtime for layout overrides; use `h()` and `innerHTML` for raw HTML.
- **Pagefind search** is built in -- just set `search.enabled: true` in the config.
- **No Vite configuration** -- `@pagesmith/docs` handles the build pipeline internally.
- **Sidebar sections** are auto-generated from the content tree and passed to layout overrides as props.
