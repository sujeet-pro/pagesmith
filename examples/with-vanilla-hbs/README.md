# Pagesmith + Handlebars

A content-driven static site that uses `@pagesmith/core`'s lower-level `createContentLayer` API with Handlebars templates for rendering. Demonstrates how to use Pagesmith without a JSX framework, relying on `.hbs` template files, inline partials, and custom helpers for all HTML output.

## Quick Start

```bash
# From the monorepo root
vp install
vp run dev:eg:vanilla-hbs
```

## Project Structure

```
with-vanilla-hbs/
  content/
    blog/                 Blog posts (markdown with frontmatter)
    guide/                Guide articles (supports series grouping)
    pages/                Standalone pages (e.g. about)
    posts/                Additional post content
  templates/
    layout.hbs            Base HTML layout with inline partials for sidebar
    index.hbs             Home page template (wraps with layout partial)
    article.hbs           Article/blog post template with TOC and metadata
    about.hbs             About page template
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

Like the EJS example, this config does **not** use `pagesmithContent()`. The Handlebars example uses the lower-level `createContentLayer` API directly in the entry server.

The JSX import source is set to `@pagesmith/core`:

```ts
oxc: {
  jsx: {
    runtime: 'automatic',
    importSource: '@pagesmith/core',
  },
}
```

### Server-Side Rendering (`src/entry-server.tsx`)

The SSR entry exports `getRoutes()` and `render()`. It creates a content layer imperatively, identical to the EJS approach:

1. **Content layer creation** -- `createContentLayer({ collections, root })` creates a cached content layer instance.
2. **Content loading** -- `loadContent(root)` fetches all collections and calls `entry.render()` on each entry.
3. **Sorting and grouping** -- guide entries sorted by `seriesOrder` then date; blog by date descending; guide entries grouped by series.
4. **Template compilation** -- templates are read from disk and compiled with `Handlebars.compile()`.
5. **Layout partial** -- `layout.hbs` is registered as a Handlebars partial so page templates can extend it.
6. **Rendering** -- compiled templates are called with content data and shared variables.

### Custom Handlebars Helpers

Five custom helpers are registered at startup to handle common template operations:

| Helper | Usage | Description |
|--------|-------|-------------|
| `formatDate` | `{{formatDate date}}` | Formats a date as "Month Day, Year" |
| `eq` | `{{#if (eq activePath '/')}}` | Strict equality comparison |
| `startsWith` | `{{#if (startsWith activePath '/guide')}}` | String prefix check |
| `or` | `{{#if (or condA condB)}}` | Boolean OR across arguments |
| `concat` | `{{concat '/guide/' slug}}` | String concatenation |

### Template Architecture

The template system uses four Handlebars files with a partial-based layout pattern:

**`templates/layout.hbs`** -- the base HTML document registered as a partial named `layout`. Page templates extend it using `{{#> layout}}...{{/layout}}`. It contains:

- HTML head with title, meta tags, inline CSS (`{{{css}}}`), and Pagefind assets.
- An inline partial `{{#*inline "sidebarContent"}}` for sidebar navigation, reused in both the desktop sidebar and mobile sidebar modal.
- Site header with navigation links using `eq` and `startsWith` helpers for active state.
- Conditional layout: `{{#if isHome}}` switches between home and three-column layouts.
- Search and sidebar modal dialogs.
- Inline JavaScript for search, sidebar toggle, TOC highlighting, and copy-to-clipboard.

**`templates/index.hbs`** -- extends layout via `{{#> layout}}` and defines an inline `body` partial with the hero section, blog post cards (using `{{#each sortedBlog}}`), and guide links.

**`templates/article.hbs`** -- extends layout with mobile TOC (`{{#if tocHeadings.length}}`), date/read-time metadata, and prose content rendered as raw HTML (`{{{content}}}`).

**`templates/about.hbs`** -- extends layout with a simple prose container for the about page content.

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

A single `src/theme.css` provides the complete stylesheet. Like the EJS example, the layout template reads the CSS file and inlines it into a `<style>` tag via Handlebars triple-stash syntax (`{{{css}}}`).

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
3. Calls `render()` for each route, compiling Handlebars templates with content data.
4. Runs Pagefind to index the output for full-text search.
5. Writes all files to the configured output directory.

## Key Files

| File | Purpose |
|------|---------|
| `content.config.mjs` | Defines guide, blog, and pages collections with Zod schemas |
| `vite.config.ts` | Registers `sharedAssetsPlugin` and `pagesmithSsg` plugins (no `pagesmithContent`) |
| `src/entry-server.tsx` | SSR entry using `createContentLayer` API and `Handlebars.compile()` |
| `templates/layout.hbs` | Base HTML layout partial with sidebar, search modal, and inline JS |
| `templates/index.hbs` | Home page extending layout with hero and content listings |
| `templates/article.hbs` | Article template with mobile TOC, metadata, and prose content |
| `templates/about.hbs` | About page template |
| `src/theme.css` | Complete site stylesheet |
| `client.js` | Client entry point that imports CSS |
