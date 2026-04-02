# Pagesmith + SolidJS

A content-driven static site that uses `@pagesmith/core` for markdown content collections and SolidJS for server-side rendering. Demonstrates the same Vite content plugin flow as the React example but with Solid's `renderToString` and its reactive primitives (`For`, `Show`).

## Quick Start

```bash
# From the monorepo root
vp install
vp run dev:eg:solid
```

## Project Structure

```
with-solid/
  content/
    blog/                 Blog posts (markdown with frontmatter)
    guide/                Guide articles (supports series grouping)
    pages/                Standalone pages (e.g. about)
    posts/                Additional post content
  src/
    entry-server.tsx      SSR entry -- exports getRoutes() and render()
    theme.css             Full site stylesheet
    pagesmith-content.d.ts  Type declarations for virtual:content/* modules
  client.js               Client entry -- imports theme.css
  content.config.ts       Collection definitions (guide, blog, pages)
  content.config.mjs      JS variant of the content config
  index.html              Dev-mode HTML shell
  vite.config.ts          Vite config with Pagesmith + vite-plugin-solid
  public/
    favicon.svg           Site favicon
  package.json
  tsconfig.json
```

## How It Works

### Content Configuration (`content.config.ts`)

Collections are defined using `defineCollection` and `defineCollections` from `@pagesmith/core`. Three collections are configured, each with the built-in `markdown` loader and Zod schema validation:

- **guide** -- articles with `title`, `description`, `date`, `tags`, `series`, and `seriesOrder` fields.
- **blog** -- posts with `title`, `description`, `date`, and `tags`.
- **pages** -- standalone pages with `title` and optional `description`.

The schema definitions are identical to the React example -- only the rendering layer differs.

### Vite Configuration (`vite.config.ts`)

The Vite config registers four plugins:

- **`sharedAssetsPlugin()`** -- serves shared fonts from `@pagesmith/core`.
- **`solid({ ssr: true })`** -- the `vite-plugin-solid` plugin with SSR mode enabled, which handles Solid's JSX compilation.
- **`pagesmithContent({ collections })`** -- processes markdown collections into `virtual:content/*` modules.
- **`pagesmithSsg({ entry, contentDirs })`** -- drives static site generation.

Note that unlike the React example, no `oxc.jsx` configuration is needed -- the Solid plugin handles JSX transformation.

### Server-Side Rendering (`src/entry-server.tsx`)

The SSR entry exports `getRoutes()` and `render()`. It uses `renderToString` from `solid-js/web` instead of React's `renderToStaticMarkup`:

```ts
import { For, Show } from 'solid-js'
import { renderToString } from 'solid-js/web'
```

The key difference from the React example is in the component code: Solid uses `For` for list iteration and `Show` for conditional rendering instead of `Array.map` and ternary operators:

```tsx
// Solid style
<For each={entries}>{(entry) => <li>{entry.title}</li>}</For>
<Show when={condition}><p>Visible</p></Show>

// vs React style
{entries.map((entry) => <li>{entry.title}</li>)}
{condition ? <p>Visible</p> : null}
```

Content entries are imported from `virtual:content/*` modules and sorted (guide by series order, blog by date descending). The render function produces full HTML documents with meta tags, stylesheets, Pagefind search assets, and sidebar/search modals.

### Client Entry (`client.js`)

A minimal file that imports the stylesheet:

```js
import './src/theme.css'
```

Unlike the React example, this example does not include a separate runtime module -- all interactive behavior (search, sidebar, TOC highlight) is embedded in the rendered HTML via inline scripts.

## Content Structure

Content is organized in the `content/` directory:

| Directory | Collection | Description |
|-----------|-----------|-------------|
| `content/guide/` | `guide` | Guide articles with `series` and `seriesOrder` for grouping |
| `content/blog/` | `blog` | Blog posts with `date` and `tags` |
| `content/pages/` | `pages` | Standalone pages (about, etc.) |
| `content/posts/` | -- | Additional post content |

Each markdown file uses YAML frontmatter validated against the Zod schema defined in `content.config.ts`.

## CSS and Styling

A single `src/theme.css` file provides the complete stylesheet covering reset, design tokens, layout grid, prose content formatting, and component styles. Shared font assets (Open Sans, JetBrains Mono) are served by `sharedAssetsPlugin()` at `/assets/fonts.css`.

## Development

```bash
vp dev
```

Starts the Vite dev server with HMR. The Solid plugin enables hot module replacement for `.tsx` components.

## Building

```bash
vp build
```

Runs static site generation:

1. Processes all markdown through the content plugin.
2. Calls `getRoutes()` to discover all pages.
3. Calls `render()` for each route to produce HTML using `renderToString`.
4. Runs Pagefind to index the output for full-text search.
5. Writes all files to the configured output directory.

## Key Files

| File | Purpose |
|------|---------|
| `content.config.ts` | Defines guide, blog, and pages collections with Zod schemas |
| `vite.config.ts` | Registers Pagesmith plugins alongside `vite-plugin-solid` (SSR mode) |
| `src/entry-server.tsx` | SSR entry with Solid components using `renderToString`, `For`, and `Show` |
| `src/theme.css` | Complete site stylesheet |
| `client.js` | Client entry point that imports CSS |
| `index.html` | Dev-mode HTML shell |
| `src/pagesmith-content.d.ts` | TypeScript declarations for `virtual:content/*` modules |
