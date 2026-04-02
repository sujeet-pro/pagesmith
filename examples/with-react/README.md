# Pagesmith + React

A content-driven static site that uses `@pagesmith/core` for markdown content collections and React (`react-dom/server`) for server-side rendering. Demonstrates the Vite content plugin flow with JSX layouts, virtual content imports, Pagefind search, and a custom client-side runtime for progressive enhancements.

## Quick Start

```bash
# From the monorepo root
vp install
vp run dev:eg:react
```

## Project Structure

```
with-react/
  content/
    blog/                 Blog posts (markdown with frontmatter)
    guide/                Guide articles (supports series grouping)
    pages/                Standalone pages (e.g. about)
    posts/                Additional post content
  src/
    entry-server.tsx      SSR entry -- exports getRoutes() and render()
    runtime.ts            Browser runtime (TOC highlight, search, sidebar)
    theme.css             Full site stylesheet (reset, tokens, layout, prose)
    pagesmith-content.d.ts  Type declarations for virtual:content/* modules
  client.js               Client entry -- imports theme.css and runtime.ts
  content.config.ts       Collection definitions (guide, blog, pages)
  content.config.mjs      JS variant of the content config
  index.html              Dev-mode HTML shell
  vite.config.ts          Vite config with Pagesmith plugins
  public/
    favicon.svg           Site favicon
  package.json
  tsconfig.json
```

## How It Works

### Content Configuration (`content.config.ts`)

Collections are defined using `defineCollection` and `defineCollections` from `@pagesmith/core`. Three collections are configured, each using the built-in `markdown` loader and Zod schemas for frontmatter validation:

- **guide** -- articles with `title`, `description`, `date`, `tags`, `series`, and `seriesOrder` fields for ordered series grouping.
- **blog** -- posts with `title`, `description`, `date`, and `tags`.
- **pages** -- standalone pages with `title` and optional `description`.

The config exports a `defineCollections({ guide, blog, pages })` map that is imported by the Vite config.

### Vite Configuration (`vite.config.ts`)

The Vite config registers three Pagesmith plugins from `@pagesmith/core/vite`:

- **`sharedAssetsPlugin()`** -- serves shared fonts and asset files bundled with `@pagesmith/core` (Open Sans, JetBrains Mono, and a `fonts.css` file).
- **`pagesmithContent({ collections })`** -- processes markdown files in each collection directory and exposes them as `virtual:content/{name}` modules (e.g. `virtual:content/blog`).
- **`pagesmithSsg({ entry, contentDirs })`** -- handles static site generation by calling the entry module's `getRoutes()` and `render()` functions, then writing HTML files to the output directory.

JSX is configured with React's automatic runtime via the `oxc.jsx` option:

```ts
oxc: {
  jsx: {
    runtime: 'automatic',
    importSource: 'react',
  },
}
```

### Server-Side Rendering (`src/entry-server.tsx`)

The SSR entry exports two functions consumed by the `pagesmithSsg` plugin:

- **`getRoutes()`** -- returns all URL paths to pre-render: home (`/`), guide articles, blog posts, an about page, and a 404 page.
- **`render(url, config)`** -- renders each route to a full HTML document using `renderToStaticMarkup` from `react-dom/server`.

Content entries are imported from virtual modules:

```ts
import blogCollection from 'virtual:content/blog'
import guideCollection from 'virtual:content/guide'
import pagesCollection from 'virtual:content/pages'
```

The entry file contains several React components defined inline: `SiteHeader`, `SidebarNav`, `HomeBody`, `PageBody`, and `SearchTrigger`. These are composed into full HTML documents with meta tags, Open Graph metadata, stylesheet links, Pagefind scripts, and sidebar/search modals.

Guide entries are sorted by `seriesOrder` then date; blog entries are sorted by date descending. Guide entries are grouped by their `series` frontmatter field for sidebar navigation.

The `render()` function receives an `SsgRenderConfig` object from the plugin that provides `base`, `cssPath`, `jsPath`, and `searchEnabled` -- these are used to construct correct asset URLs and conditionally include Pagefind search assets.

### Client Entry (`client.js`)

A minimal client entry that imports the stylesheet and runtime:

```js
import './src/theme.css'
import './src/runtime.ts'
```

Vite processes `theme.css` into a hashed CSS asset and bundles `runtime.ts` as the client JavaScript.

### Client Runtime (`src/runtime.ts`)

Progressive enhancements that work on top of the static HTML:

- **TOC highlight** -- uses `IntersectionObserver` to highlight the current heading in the table of contents as the user scrolls.
- **Search modal** -- opens a Pagefind search dialog on button click or `Cmd/Ctrl+K`. Lazily initializes `PagefindUI` on first open.
- **Sidebar modal** -- toggles a mobile sidebar navigation dialog.
- **Sidebar scroll** -- scrolls the active sidebar item into view on page load.

The site works without JavaScript -- these are progressive enhancements only.

## Content Structure

Content is organized in the `content/` directory:

| Directory | Collection | Description |
|-----------|-----------|-------------|
| `content/guide/` | `guide` | Guide articles, supports `series` and `seriesOrder` frontmatter for grouping |
| `content/blog/` | `blog` | Blog posts with `date` and `tags` |
| `content/pages/` | `pages` | Standalone pages (about, etc.) |
| `content/posts/` | -- | Additional post content |

Each markdown file uses YAML frontmatter validated against the Zod schema defined in `content.config.ts`.

## CSS and Styling

A single `src/theme.css` file provides the complete stylesheet covering:

- CSS reset and box-sizing defaults
- Design tokens (colors, spacing, typography, radii)
- Layout grid (header, sidebar, main, aside)
- Prose content formatting (headings, lists, code blocks, tables)
- Component styles (search modal, sidebar modal, TOC, hero section)
- Responsive breakpoints for mobile/tablet/desktop

Shared font assets (Open Sans variable, JetBrains Mono variable) are served by `sharedAssetsPlugin()` and referenced via a `fonts.css` file at `/assets/fonts.css`.

## Development

```bash
vp dev
```

Starts the Vite dev server with HMR. The `index.html` file provides a minimal shell that loads `client.js`.

## Building

```bash
vp build
```

Runs static site generation:

1. Processes all markdown in `content/` through the content plugin.
2. Calls `getRoutes()` to discover all pages.
3. Calls `render()` for each route to produce HTML.
4. Runs Pagefind to index the output for full-text search.
5. Writes all files to the configured output directory.

## Key Files

| File | Purpose |
|------|---------|
| `content.config.ts` | Defines guide, blog, and pages collections with Zod schemas |
| `vite.config.ts` | Registers `sharedAssetsPlugin`, `pagesmithContent`, and `pagesmithSsg` plugins |
| `src/entry-server.tsx` | SSR entry with React components, route generation, and rendering |
| `src/runtime.ts` | Browser-side progressive enhancements (search, TOC, sidebar) |
| `src/theme.css` | Complete site stylesheet |
| `client.js` | Client entry point that imports CSS and runtime |
| `index.html` | Dev-mode HTML shell |
| `src/pagesmith-content.d.ts` | TypeScript declarations for `virtual:content/*` modules |
