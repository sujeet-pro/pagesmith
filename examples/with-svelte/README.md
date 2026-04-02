# Pagesmith + Svelte

A content-driven static site that uses `@pagesmith/core` for markdown content collections and Svelte 5 for server-side rendering. Demonstrates the Vite content plugin flow with Svelte components rendered via `svelte/server`, using Svelte's `$props()` rune, `{#if}` / `{#each}` blocks, and a component-based architecture.

## Quick Start

```bash
# From the monorepo root
vp install
vp run dev:eg:svelte
```

## Project Structure

```
with-svelte/
  content/
    blog/                 Blog posts (markdown with frontmatter)
    guide/                Guide articles (supports series grouping)
    pages/                Standalone pages (e.g. about)
  src/
    App.svelte            Root Svelte component -- switches between page layouts
    site.ts               Shared content helpers (sorting, grouping, navigation)
    entry-server.ts       SSR entry -- exports getRoutes() and render()
    theme.css             Full site stylesheet
    pagesmith-content.d.ts  Type declarations for virtual:content/* modules
    components/
      HomeBody.svelte     Home page body component
      NotFoundBody.svelte 404 page component
      PageBody.svelte     Article/page body with sidebar, TOC, and content
      SiteHeader.svelte   Site header with navigation and search trigger
      SidebarNav.svelte   Sidebar navigation component
  client.js               Client entry -- imports theme.css
  content.config.ts       Collection definitions (guide, blog, pages)
  content.config.mjs      JS variant of the content config
  svelte.config.js        Svelte compiler configuration (vitePreprocess)
  index.html              Dev-mode HTML shell
  vite.config.ts          Vite config with Pagesmith + @sveltejs/vite-plugin-svelte
  public/
    favicon.svg           Site favicon
  package.json
  tsconfig.json
```

## How It Works

### Content Configuration (`content.config.ts`)

Collections are defined using `defineCollection` and `defineCollections` from `@pagesmith/core`. Three collections are configured with the `markdown` loader and Zod schema validation:

- **guide** -- articles with `title`, `description`, `date`, `tags`, `series`, and `seriesOrder` fields.
- **blog** -- posts with `title`, `description`, `date`, and `tags`.
- **pages** -- standalone pages with `title` and optional `description`.

Note that the `directory` paths in this example omit the `./` prefix (e.g. `'content/guide'` instead of `'./content/guide'`).

### Vite Configuration (`vite.config.ts`)

The Vite config registers four plugins:

- **`sharedAssetsPlugin()`** -- serves shared fonts from `@pagesmith/core`.
- **`svelte()`** -- the official `@sveltejs/vite-plugin-svelte` for compiling `.svelte` files.
- **`pagesmithContent({ collections })`** -- processes markdown collections into `virtual:content/*` modules.
- **`pagesmithSsg({ entry, contentDirs })`** -- drives static site generation.

Note the SSG entry is `./src/entry-server.ts` (`.ts`, not `.tsx`) because Svelte components are compiled by the Svelte plugin, not via JSX.

### Svelte Configuration (`svelte.config.js`)

A minimal Svelte config that enables `vitePreprocess()` for TypeScript support in `.svelte` files:

```js
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte'

export default {
  preprocess: vitePreprocess(),
}
```

### Shared Content Helpers (`src/site.ts`)

Content loading and data preparation is extracted into `src/site.ts`, which:

- Imports entries from `virtual:content/guide`, `virtual:content/blog`, and `virtual:content/pages`.
- Sorts guide entries by `seriesOrder` then date, and blog entries by date descending.
- Exports helper functions: `normalizeRoute`, `leafSlug`, `routeFor`, `formatDate`, `estimateReadTime`, `buildNavEntries`, `groupBySeries`.
- Exports TypeScript types: `MarkdownEntry`, `NavEntry`, `GuideGroup`, `Heading`.

This separation keeps the Svelte components focused on presentation while the data logic lives in plain TypeScript.

### Server-Side Rendering (`src/entry-server.ts`)

The SSR entry uses `render` from `svelte/server` to render the root `App.svelte` component:

```ts
import { render as renderSvelte } from 'svelte/server'
import App from './App.svelte'

const rendered = renderSvelte(App, { props: appProps })
```

The Svelte server render returns an object with `body` and `head` properties, which are assembled into the final HTML document. The entry determines the page kind (`home`, `page`, or `not-found`) based on the route and passes appropriate props to the App component.

### Component Architecture

The root `App.svelte` component uses Svelte 5's `$props()` rune and conditional blocks to switch between layouts:

```svelte
{#if pageKind === 'home'}
  <HomeBody ... />
{:else if pageKind === 'page'}
  <PageBody ... />
{:else}
  <NotFoundBody />
{/if}
```

Five Svelte components handle different parts of the UI:

| Component | Purpose |
|-----------|---------|
| `App.svelte` | Root component, layout switching, sidebar/search modals |
| `HomeBody.svelte` | Home page with hero, blog listing, and guide links |
| `PageBody.svelte` | Article page with sidebar, TOC, and prose content |
| `SiteHeader.svelte` | Header with navigation links and search trigger |
| `SidebarNav.svelte` | Sidebar navigation with guide groups and blog entries |
| `NotFoundBody.svelte` | 404 error page |

### Client Entry (`client.js`)

A minimal file that imports the stylesheet:

```js
import './src/theme.css'
```

## Content Structure

Content is organized in the `content/` directory:

| Directory | Collection | Description |
|-----------|-----------|-------------|
| `content/guide/` | `guide` | Guide articles with `series` and `seriesOrder` for grouping |
| `content/blog/` | `blog` | Blog posts with `date` and `tags` |
| `content/pages/` | `pages` | Standalone pages (about, etc.) |

Each markdown file uses YAML frontmatter validated against the Zod schema defined in `content.config.ts`.

## CSS and Styling

A single `src/theme.css` file provides the complete stylesheet covering reset, design tokens, layout grid, prose content formatting, and component styles. Shared font assets (Open Sans, JetBrains Mono) are served by `sharedAssetsPlugin()` at `/assets/fonts.css`.

## Development

```bash
vp dev
```

Starts the Vite dev server with HMR. The Svelte plugin enables hot module replacement for `.svelte` components.

## Building

```bash
vp build
```

Runs static site generation:

1. Processes all markdown through the content plugin.
2. Calls `getRoutes()` to discover all pages.
3. Calls `render()` for each route, rendering `App.svelte` via `svelte/server`.
4. Runs Pagefind to index the output for full-text search.
5. Writes all files to the configured output directory.

## Key Files

| File | Purpose |
|------|---------|
| `content.config.ts` | Defines guide, blog, and pages collections with Zod schemas |
| `vite.config.ts` | Registers Pagesmith plugins alongside `@sveltejs/vite-plugin-svelte` |
| `src/entry-server.ts` | SSR entry that renders `App.svelte` via `svelte/server` |
| `src/App.svelte` | Root component that switches layouts based on `pageKind` prop |
| `src/site.ts` | Shared content loading, sorting, and navigation helpers |
| `src/components/` | Svelte UI components (HomeBody, PageBody, SiteHeader, SidebarNav, NotFoundBody) |
| `svelte.config.js` | Svelte compiler configuration with `vitePreprocess` |
| `src/theme.css` | Complete site stylesheet |
| `client.js` | Client entry point |
| `index.html` | Dev-mode HTML shell |
