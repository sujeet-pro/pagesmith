---
title: React with Pagesmith
description: Build a content-driven static site using React SSR and Pagesmith's Vite content plugin.
---

# React with Pagesmith

## Overview

This pattern uses `@pagesmith/core` as the content layer and React as the server renderer to produce a fully static site. You define content collections with validated schemas, write React components for your pages, and Pagesmith's Vite plugins handle markdown processing, virtual content modules, static site generation, and Pagefind search indexing.

Use this when you want full control over page layout and rendering while letting Pagesmith manage content loading, markdown processing, and the build pipeline.

Source: [`examples/with-react/`](https://github.com/sujeet-pro/pagesmith/tree/main/examples/with-react) | Output: <a href="/pagesmith/examples/react/" target="_blank" rel="noopener noreferrer">Live Demo</a>

## Prerequisites

- Node.js 20+
- [vite-plus](https://github.com/nicolo-ribaudo/vite-plus) (the `vp` CLI)

## Project Setup

### package.json

```json
{
  "name": "example-with-react",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vp dev",
    "build": "vp build",
    "check": "vp check"
  },
  "dependencies": {
    "@pagesmith/core": "*",
    "pagefind": "^1.3.0",
    "react": "^19.2.4",
    "react-dom": "^19.2.4"
  },
  "devDependencies": {
    "@types/react": "^19.2.14",
    "@types/react-dom": "^19.2.3",
    "typescript": "^5.7.0",
    "vite": "npm:@voidzero-dev/vite-plus-core@^0.1.13",
    "vite-plus": "^0.1.13"
  }
}
```

Install with:

```bash
vp install
```

### Project Structure

```text
with-react/
  content/
    blog/             # Blog posts (markdown with frontmatter)
    guide/            # Guide articles (markdown with frontmatter)
    pages/            # Standalone pages (about, etc.)
  public/
    favicon.svg
  src/
    entry-server.tsx  # SSG entry: getRoutes() + render()
    runtime.ts        # Client-side progressive enhancements
    theme.css         # Full site stylesheet
    pagesmith-content.d.ts  # Generated type declarations for virtual modules
  content.config.ts   # Collection definitions with Zod schemas
  client.js           # Client entry point
  index.html          # Vite HTML entry
  vite.config.ts      # Vite + Pagesmith plugin configuration
  tsconfig.json
```

### content.config.ts

Define your content collections using `defineCollection` and Zod schemas (re-exported as `z` from `@pagesmith/core`). Each collection specifies a `loader`, a `directory` where content files live, and a `schema` that validates frontmatter. The default export passes all collections to `defineCollections`, which the Vite plugin consumes.

```ts
import { defineCollection, defineCollections, z } from '@pagesmith/core'

export const guide = defineCollection({
  loader: 'markdown',
  directory: './content/guide',
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    date: z.coerce.date(),
    tags: z.array(z.string()).default([]),
    order: z.number().optional(),
    series: z.string().optional(),
    seriesOrder: z.number().optional(),
  }),
})

export const blog = defineCollection({
  loader: 'markdown',
  directory: './content/blog',
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    date: z.coerce.date(),
    tags: z.array(z.string()).default([]),
  }),
})

export const pages = defineCollection({
  loader: 'markdown',
  directory: './content/pages',
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
  }),
})

export default defineCollections({ guide, blog, pages })
```

### vite.config.ts

The Vite config wires together three plugins from `@pagesmith/core/vite`:

```ts
import { defineConfig } from 'vite-plus'
import collections from './content.config'
import { pagesmithContent, pagesmithSsg, sharedAssetsPlugin } from '@pagesmith/core/vite'

export default defineConfig({
  base: '/my-site/',
  plugins: [
    sharedAssetsPlugin(),
    pagesmithContent({ collections }),
    ...pagesmithSsg({ entry: './src/entry-server.tsx', contentDirs: ['./content'] }),
  ],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
  oxc: {
    jsx: {
      runtime: 'automatic',
      importSource: 'react',
    },
  },
})
```

- **`sharedAssetsPlugin()`** copies shared assets (bundled web fonts, `fonts.css`) from `@pagesmith/core` into the build output.
- **`pagesmithContent({ collections })`** processes your content directories and exposes them as `virtual:content/*` modules.
- **`pagesmithSsg({ entry, contentDirs })`** handles static site generation by calling `getRoutes()` and `render()` from your entry, then runs Pagefind indexing on the output. The `contentDirs` option tells the plugin which directories to watch for changes during development.
- **`oxc.jsx`** configures the JSX transform for React (automatic runtime with `react` as the import source).

### tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "jsxImportSource": "react",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "types": ["vite/client"]
  },
  "include": ["src", "vite.config.ts"]
}
```

- **`jsx: "react-jsx"`** and **`jsxImportSource: "react"`** enable the automatic JSX transform for React 19.
- **`types: ["vite/client"]`** makes Vite's client types (including `import.meta.env`) available.

## Content Structure

Organize markdown files by collection directory:

```text
content/
  guide/
    installation.md
    collections.md
    rendering.md
  blog/
    building-with-pagesmith.md
    content-modeling.md
  pages/
    about.md
```

Each markdown file uses YAML frontmatter matching the collection schema:

```md
---
title: Getting Started
description: How to install and configure Pagesmith
date: 2026-01-15
tags: [setup, guide]
series: Basics
seriesOrder: 1
---

# Getting Started

Your markdown content here...
```

## Virtual Content Imports

The `pagesmithContent` plugin generates virtual modules for each collection defined in `content.config.ts`. Import them by name:

```ts
import blogCollection from 'virtual:content/blog'
import guideCollection from 'virtual:content/guide'
import pagesCollection from 'virtual:content/pages'
```

Each collection is an array of entries. A markdown entry has this shape:

```ts
type MarkdownEntry = {
  contentSlug: string                                     // e.g. "guide/installation"
  html: string                                            // Rendered HTML from markdown
  headings: Array<{ depth: number; slug: string; text: string }>
  frontmatter: { /* validated against your Zod schema */ }
}
```

Type declarations are auto-generated in `src/pagesmith-content.d.ts`:

```ts
// Generated by @pagesmith/core/vite. Do not edit manually.
type __PagesmithCollections = typeof import('../content.config').default

declare module 'virtual:content' {
  const content: import('@pagesmith/core/vite').ContentModuleMap<__PagesmithCollections>
  export default content
}

declare module 'virtual:content/guide' {
  const collection: import('@pagesmith/core/vite').ContentCollectionModule<
    __PagesmithCollections['guide']
  >
  export default collection
}

declare module 'virtual:content/blog' {
  const collection: import('@pagesmith/core/vite').ContentCollectionModule<
    __PagesmithCollections['blog']
  >
  export default collection
}

declare module 'virtual:content/pages' {
  const collection: import('@pagesmith/core/vite').ContentCollectionModule<
    __PagesmithCollections['pages']
  >
  export default collection
}
```

This gives you full type safety on frontmatter fields based on the Zod schema you defined.

## Entry Server

The `src/entry-server.tsx` file exports two functions that the SSG plugin calls during the build.

### Imports

```ts
import { renderToStaticMarkup } from 'react-dom/server'
import type { SsgRenderConfig } from '@pagesmith/core/vite'
import blogCollection from 'virtual:content/blog'
import guideCollection from 'virtual:content/guide'
import pagesCollection from 'virtual:content/pages'
```

### `getRoutes()`

Returns an array of URL paths to pre-render:

```ts
export async function getRoutes(): Promise<string[]> {
  const routes = ['/', '/404']
  routes.push(...guideEntries.map((entry) => routeFor(entry, 'guide')))
  routes.push(...blogEntries.map((entry) => routeFor(entry, 'blog')))

  const aboutPage = pageEntries.find(
    (entry) => leafSlug(entry.contentSlug, 'pages') === 'about'
  )
  if (aboutPage) {
    routes.push(routeFor(aboutPage, 'pages'))
  }

  return routes
}
```

### `render()`

Receives a URL and an `SsgRenderConfig` object, matches the route to a content entry, and returns the full HTML string:

```ts
export async function render(url: string, config: SsgRenderConfig): Promise<string> {
  // Normalize the route path
  const routePath = normalizeRoute(url, config.base)

  // Look up the matching content entry
  const guideEntry = guideEntries.find((e) => routeFor(e, 'guide') === routePath)
  if (guideEntry) {
    const bodyHtml = renderToStaticMarkup(
      <PageBody
        title={guideEntry.frontmatter.title}
        content={guideEntry.html}
        headings={guideEntry.headings}
        currentPath={routePath}
        basePath={config.base}
        searchEnabled={config.searchEnabled}
        // ...other props
      />
    )

    return renderDocument({
      title: `${guideEntry.frontmatter.title} - My Site`,
      basePath: config.base,
      cssPath: config.cssPath,
      jsPath: config.jsPath,
      searchEnabled: config.searchEnabled,
      bodyHtml,
    })
  }

  // ...match blog, pages, home, 404
}
```

The `SsgRenderConfig` provides:

| Property | Description |
|---|---|
| `base` | Base path without trailing slash (e.g., `/my-site`) |
| `root` | Absolute path to the project root |
| `cssPath` | Path to the built CSS asset |
| `jsPath` | Path to the built JS asset (undefined in some dev scenarios) |
| `searchEnabled` | Whether Pagefind search is enabled (false in dev) |
| `isDev` | Whether running in development mode |

React components use `renderToStaticMarkup()` from `react-dom/server` to produce HTML strings, and markdown content is injected via `dangerouslySetInnerHTML`:

```tsx
<div className="prose" dangerouslySetInnerHTML={{ __html: entry.html }} />
```

### Building the HTML Document

The `render()` function returns a complete HTML document string that includes the document head, CSS references, search assets, and the rendered body:

```ts
function renderDocument(props: {
  title: string
  description?: string
  basePath: string
  cssPath: string
  jsPath?: string
  searchEnabled?: boolean
  bodyHtml: string
  sidebarHtml?: string
}) {
  const { title, basePath, cssPath, jsPath, searchEnabled, bodyHtml } = props
  const base = basePath.replace(/\/+$/, '')

  return `<html lang="en" class="no-js">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="color-scheme" content="light dark" />
    <title>${title}</title>
    <link rel="icon" href="${base}/favicon.svg" type="image/svg+xml" />
    <link rel="stylesheet" href="${base}/assets/fonts.css" />
    <link rel="stylesheet" href="${cssPath}" />
    ${searchEnabled ? `<link rel="stylesheet" href="${base}/pagefind/pagefind-ui.css" />` : ''}
    <script>document.documentElement.classList.remove('no-js')</script>
    ${searchEnabled ? `<script src="${base}/pagefind/pagefind-ui.js" defer></script>` : ''}
  </head>
  <body>
    ${bodyHtml}
    ${jsPath ? `<script src="${jsPath}" defer></script>` : ''}
  </body>
</html>`
}
```

## Index HTML and Client Entry

The `index.html` serves as the Vite entry point for development mode:

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Pagesmith + React</title>
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="/client.js"></script>
  </body>
</html>
```

The `client.js` entry imports the theme CSS and runtime JavaScript:

```js
import './src/theme.css'
import './src/runtime.ts'
```

## CSS and Styling

### Available CSS Imports

Pagesmith ships pre-built CSS you can import in your theme stylesheet:

| Import path | Contents |
|---|---|
| `@pagesmith/core/css/standalone` | Full standalone bundle (reset, tokens, prose, code, layout, TOC) |
| `@pagesmith/core/css/content` | Content-only bundle (reset, prose, code, viewport) |
| `@pagesmith/core/css/fonts` | Bundled web fonts (Open Sans, JetBrains Mono) |
| `@pagesmith/core/css/viewport` | Viewport / responsive base only |

You can use these imports in your `src/theme.css`:

```css
/* Import the full standalone bundle */
@import '@pagesmith/core/css/standalone';

/* Or import individual layers for more control */
@import '@pagesmith/core/css/content';
```

### How CSS Works in the Build

During the SSG build, Vite extracts and bundles the CSS from `client.js` imports. The `SsgRenderConfig.cssPath` provides the hashed URL that you reference in the rendered HTML document's `<link>` tag. The `sharedAssetsPlugin()` copies the bundled font files and `fonts.css` into the output directory -- reference it with `<link rel="stylesheet" href="${base}/assets/fonts.css" />`.

You can either use Pagesmith's built-in styles or write your own theme from scratch. The React example includes a comprehensive custom `src/theme.css` with a CSS reset, design tokens, layout grid, prose styles, sidebar and header components, and search modal styling.

## Runtime JavaScript

The site works without JavaScript. The runtime entry (`src/runtime.ts`) adds progressive enhancements:

### Copy-Code Buttons

Click-to-copy on code blocks:

```ts
document.addEventListener('click', (e) => {
  const btn = (e.target as HTMLElement).closest('[data-copy]')
  if (!btn) return
  const code = btn.closest('pre')?.querySelector('code')
  if (!code) return
  void navigator.clipboard.writeText(code.textContent ?? '')
    .then(() => {
      btn.setAttribute('data-copied', 'true')
      setTimeout(() => btn.removeAttribute('data-copied'), 2000)
    })
})
```

### TOC Highlight on Scroll

Active heading tracking in the table of contents:

```ts
const tocLinks = document.querySelectorAll<HTMLAnchorElement>('.doc-toc a[href^="#"]')
if (tocLinks.length > 0) {
  const headingIds = [...tocLinks].map((a) => a.getAttribute('href')!.slice(1))
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          for (const link of tocLinks) {
            const li = link.closest('.doc-toc-item')
            li?.classList.toggle('active', link.getAttribute('href') === `#${entry.target.id}`)
          }
        }
      }
    },
    { rootMargin: '-80px 0px -60% 0px', threshold: 0 },
  )
  for (const id of headingIds) {
    const el = document.getElementById(id)
    if (el) observer.observe(el)
  }
}
```

### Search Modal

Keyboard shortcut (Cmd+K / Ctrl+K) to open Pagefind search:

```ts
const modal = document.getElementById('search-modal') as HTMLDialogElement | null
const trigger = document.querySelector('[data-search-trigger]')

if (modal && trigger) {
  let initialized = false

  function openSearch() {
    modal!.showModal()
    if (!initialized && typeof (window as any).PagefindUI !== 'undefined') {
      new (window as any).PagefindUI({
        element: '#search-container',
        showImages: false,
        showSubResults: true,
        resetStyles: false,
      })
      initialized = true
    }
    requestAnimationFrame(() => {
      modal!.querySelector<HTMLInputElement>('.pagefind-ui__search-input')?.focus()
    })
  }

  trigger.addEventListener('click', openSearch)
  document.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault()
      modal!.open ? modal!.close() : openSearch()
    }
  })
}
```

### Sidebar Modal

Mobile navigation toggle for responsive layouts:

```ts
const sidebarModal = document.getElementById('sidebar-modal') as HTMLDialogElement | null
const sidebarToggle = document.querySelector('[data-sidebar-toggle]')

if (sidebarModal && sidebarToggle) {
  sidebarToggle.addEventListener('click', () => {
    sidebarModal.showModal()
    document.body.style.overflow = 'hidden'
  })

  sidebarModal.querySelectorAll('[data-sidebar-close]').forEach((el) => {
    el.addEventListener('click', () => {
      sidebarModal.close()
      document.body.style.overflow = ''
    })
  })
}
```

## Pagefind Search

The `pagesmithSsg` plugin automatically runs [Pagefind](https://pagefind.app/) after the production build. Search is disabled during development (`config.searchEnabled` is `false`).

To enable search in your rendered pages:

1. Mark searchable content with `data-pagefind-body`:

```tsx
<main data-pagefind-body>
  <article>
    <div className="prose" dangerouslySetInnerHTML={{ __html: content }} />
  </article>
</main>
```

2. Include Pagefind CSS and JS in the document head (conditionally based on `config.searchEnabled`):

```ts
${searchEnabled ? `<link rel="stylesheet" href="${base}/pagefind/pagefind-ui.css" />` : ''}
${searchEnabled ? `<script src="${base}/pagefind/pagefind-ui.js" defer></script>` : ''}
```

3. Add a search trigger button and a dialog container in your HTML:

```tsx
<button type="button" className="doc-search-trigger" data-search-trigger="" aria-label="Search">
  <kbd className="doc-search-shortcut"><span className="doc-search-shortcut-key">Cmd</span>K</kbd>
</button>

<dialog className="doc-search-modal" id="search-modal" aria-label="Search">
  <div id="search-container" data-pagefind-search=""></div>
</dialog>
```

4. Initialize `PagefindUI` in your runtime JavaScript when the search modal opens (see the Search Modal section above).

## Development and Building

```bash
# Start the dev server with HMR -- content changes are picked up automatically
vp dev

# Type-check the project
vp check

# Build for production (SSG + Pagefind indexing)
vp build
```

During development, the `pagesmithSsg` plugin watches the `content/` directory and serves pages through middleware that calls your `render()` function on each request. In production, it pre-renders every route returned by `getRoutes()`, writes HTML files, copies content assets, and runs Pagefind.

## Key Concepts

- **Collections** are defined in `content.config.ts` with Zod schemas for frontmatter validation.
- **Virtual modules** (`virtual:content/<name>`) provide pre-rendered HTML and metadata at build time.
- **`pagesmithSsg`** handles the full SSG lifecycle: dev middleware, route discovery, pre-rendering, asset copying, and Pagefind indexing.
- **`sharedAssetsPlugin`** copies bundled fonts and shared CSS into the output directory.
- **React's `renderToStaticMarkup`** produces static HTML with no hydration overhead -- the output is pure HTML.
- **Runtime JS** is optional and adds progressive enhancements (copy-code, TOC highlight, search, mobile sidebar).
- **CSS imports** from `@pagesmith/core` provide a ready-made design system with tokens, prose styles, and code highlighting.
- **`dangerouslySetInnerHTML`** is how you inject raw HTML (rendered markdown) into React components.
