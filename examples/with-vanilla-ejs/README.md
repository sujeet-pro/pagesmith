# Pagesmith + EJS

A content-driven static site that uses `@pagesmith/core`'s lower-level `createContentLayer` API with EJS templates for rendering. Demonstrates how to use Pagesmith without a JSX framework or virtual content modules, relying on plain EJS template files for all HTML output.

## Quick Start

```bash
# From the monorepo root
vp install
vp run dev:eg:vanilla-ejs
```

## Project Structure

```
with-vanilla-ejs/
  content/
    blog/                 Blog posts (markdown with frontmatter)
    guide/                Guide articles (supports series grouping)
    pages/                Standalone pages (e.g. about)
    posts/                Additional post content
  templates/
    layout.ejs            Base HTML layout (head, header, sidebar, search, footer)
    index.ejs             Home page template (hero, blog listing, guide links)
    article.ejs           Article/blog post template with mobile TOC and metadata
    about.ejs             About page template
  src/
    entry-server.tsx      SSR entry -- exports getRoutes() and render()
    theme.css             Full site stylesheet
  content.config.mjs      Collection definitions (guide, blog, pages)
  client.js               Client entry -- imports theme.css
  index.html              Dev-mode HTML shell
  vite.config.ts          Vite config with Pagesmith SSG plugin
  public/
    favicon.svg           Site favicon
  package.json
  tsconfig.json
```

## How It Works

### Content Configuration (`content.config.mjs`)

Collections are defined using `defineCollection` and `defineCollections` from `@pagesmith/core`. Three collections are configured with the `markdown` loader and Zod schema validation:

- **guide** -- articles with `title`, `description`, `date`, `tags`, `series`, and `seriesOrder` fields.
- **blog** -- posts with `title`, `description`, `date`, and `tags`.
- **pages** -- standalone pages with `title` and optional `description`.

### Vite Configuration (`vite.config.ts`)

The Vite config registers only two Pagesmith plugins:

- **`sharedAssetsPlugin()`** -- serves shared fonts from `@pagesmith/core`.
- **`pagesmithSsg({ entry, contentDirs })`** -- drives static site generation.

Unlike the React/Solid/Svelte examples, this config does **not** use `pagesmithContent()`. The EJS example uses the lower-level `createContentLayer` API directly in the entry server, loading and rendering content imperatively rather than through virtual modules.

The JSX import source is set to `@pagesmith/core` (used only for the entry-server file extension convention, not for rendering):

```ts
oxc: {
  jsx: {
    runtime: 'automatic',
    importSource: '@pagesmith/core',
  },
}
```

### Server-Side Rendering (`src/entry-server.tsx`)

The SSR entry exports `getRoutes()` and `render()`. Instead of importing from `virtual:content/*` modules, it creates a content layer imperatively:

1. **Content layer creation** -- `createContentLayer({ collections, root })` creates a reusable content layer instance that is cached across renders.
2. **Content loading** -- `loadContent(root)` calls `layer.getCollection('guide')`, `layer.getCollection('blog')`, and `layer.getCollection('pages')` to fetch all entries, then calls `entry.render()` on each to get HTML output.
3. **Sorting** -- guide entries are sorted by `seriesOrder` then date; blog entries by date descending.
4. **Series grouping** -- guide entries are grouped by their `series` frontmatter field for sidebar navigation.
5. **Template loading** -- templates are read from disk with `fs.readFileSync()` from the `templates/` directory.
6. **Rendering** -- `ejs.render()` processes each template with content data and shared variables.
7. **Layout wrapping** -- the `layout.ejs` template wraps all page bodies with the common HTML shell.

Route matching uses regex patterns to map URLs to guide pages, blog posts, or the about page.

### Template Architecture

The template system uses four EJS files:

**`templates/layout.ejs`** -- the base HTML document that wraps all pages. It contains:

- HTML head with title, meta tags, inline CSS, and Pagefind assets.
- Site header with navigation links and search trigger.
- Conditional layout: home pages get a single-column layout; other pages get a three-column layout with sidebar and table-of-contents aside.
- Sidebar navigation rendered via an inline function `renderSidebarContent()` that is reused in both the main sidebar and the mobile sidebar modal.
- Search modal dialog with Pagefind UI initialization.
- Sidebar modal dialog for mobile navigation.
- Inline JavaScript for search, sidebar toggle, TOC highlighting, and copy-to-clipboard.

**`templates/index.ejs`** -- home page content with hero section, blog post cards, and guide links.

**`templates/article.ejs`** -- article/blog page with mobile TOC, date/read-time metadata, and prose content.

**`templates/about.ejs`** -- simple about page that renders markdown content in a prose container.

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
| `content/posts/` | -- | Additional post content |

Each markdown file uses YAML frontmatter validated against the Zod schema defined in `content.config.mjs`.

## CSS and Styling

A single `src/theme.css` provides the complete stylesheet. Unlike the React/Solid/Svelte examples where CSS is processed through Vite's asset pipeline, the EJS layout reads the CSS file and inlines it into a `<style>` tag in the HTML head.

Shared font assets (Open Sans, JetBrains Mono) are served by `sharedAssetsPlugin()` at `/assets/fonts.css`.

## Development

```bash
vp dev
```

Starts the Vite dev server with HMR.

## Building

```bash
vp build
```

Runs static site generation:

1. Creates a content layer and loads all collections.
2. Calls `getRoutes()` to discover all pages.
3. Calls `render()` for each route, loading templates and rendering them with EJS.
4. Runs Pagefind to index the output for full-text search.
5. Writes all files to the configured output directory.

## Key Files

| File | Purpose |
|------|---------|
| `content.config.mjs` | Defines guide, blog, and pages collections with Zod schemas |
| `vite.config.ts` | Registers `sharedAssetsPlugin` and `pagesmithSsg` plugins (no `pagesmithContent`) |
| `src/entry-server.tsx` | SSR entry using `createContentLayer` API and `ejs.render()` |
| `templates/layout.ejs` | Base HTML layout with header, sidebar, search modal, and inline JS |
| `templates/index.ejs` | Home page with hero, blog listing, and guide links |
| `templates/article.ejs` | Article template with mobile TOC, metadata, and prose content |
| `templates/about.ejs` | About page template |
| `src/theme.css` | Complete site stylesheet |
| `client.js` | Client entry point that imports CSS |
