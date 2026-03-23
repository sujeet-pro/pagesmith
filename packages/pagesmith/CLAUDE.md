# packages/pagesmith

Full SSG framework built on `@pagesmith/content`. Transforms content collections + TSX layouts into static HTML pages with zero client-side JS runtime. This is one consumer of the content CMS — the content layer is framework-agnostic.

## Directory map

```
cli/bin.ts              CLI entry point (build, dev, preview, diagrams, validate)
schemas/                Zod schemas — config, frontmatter, build-types, layout-props, etc.
src/
  index.ts              Barrel export
  assets/               Asset hashing (SHA-256) and public file copying
  build/
    pipeline.ts         3-phase build orchestrator (the main build() function)
    indexer.ts           Builds GlobalIndex from processed pages
    renderer.ts          Renders a single page through its layout function
    layout-loader.ts     Dynamic layout module import + caching
    pool.ts / worker.ts  Bun Worker pool for parallel rendering
  config/
    defaults.ts          Default config values (contentDir, outDir, css, runtime, etc.)
    loader.ts            Reads site.json5, meta.json5, redirects.json5
    resolver.ts          Merges user config with defaults, resolves absolute paths
  content/
    collector.ts         Walks content dir for README.md/index.md files
    frontmatter.ts       YAML frontmatter extraction
  css/builder.ts         LightningCSS bundling (bundle() with browser targets)
  diagrams/              Mermaid + Excalidraw -> SVG rendering
  generators/            Sitemap, RSS, tag pages, redirects, 404, robots.txt, manifest
  jsx-runtime/index.ts   Custom h() + Fragment + HtmlString (server-side JSX -> HTML)
  markdown/
    pipeline.ts          unified processor: remark-parse -> remark-gfm -> remark-math ->
                         remark-rehype -> rehype-mathjax -> rehype-slug -> rehype-shiki ->
                         custom plugins -> rehype-stringify
    plugins/             rehype-asset-transform, rehype-code-tabs, rehype-link-transform,
                         shiki-transformers (line numbers, highlights, titles, diffs)
  server/
    dev.ts               WebSocket dev server with incremental rebuilds
    preview.ts           Static file server for built output
    ws-client.ts         Client-side WS script injected into HTML
  validators/            Content validation (links, assets, frontmatter, headings, etc.)
theme/
  layouts/               Default TSX layout components (Article, Blog, Home, Page, etc.)
  layouts/components/    Shared components (Html, Header, Footer, TOC, etc.)
  runtime/               Client-side JS (theme toggle, TOC highlight, copy-code, sidebar)
  styles/                CSS organized: foundations/, layout/, content/, code/, components/
```

## Key types

```typescript
// schemas/config.ts
SiteConfig // Full site configuration (site.json5)
MarkdownConfig // Remark/rehype plugin config + shiki themes

// schemas/build-types.ts
GlobalIndex // { config, pageList, pageTypeData, tagIndex, pageTypeMetas }
ProcessedPage // { slug, html, headings, frontmatter, layoutName }

// schemas/layout-props.ts
BaseLayoutProps // Props every layout receives
ArticleLayoutProps // Extended with seriesNav, pageType
HomeLayoutProps // Extended with featuredArticles, featuredSeries, stats

// schemas/frontmatter.ts
BaseFrontmatter // { title, description, publishedDate, tags, draft?, ... }
ProjectFrontmatter // extends with gitRepo?, links?

// src/config/resolver.ts
ResolvedConfig // Fully resolved config with absolute paths
PagesmithConfig // User-provided config (all optional)
```

## Build vs Dev mode differences

| Aspect           | Build (`dist/`)      | Dev (`dev/`)                                   |
| ---------------- | -------------------- | ---------------------------------------------- |
| Asset names      | `style.a1b2c3d4.css` | `style.css`                                    |
| JS minification  | Yes (rolldown)       | No                                             |
| CSS minification | Yes (lightningcss)   | No                                             |
| Page generation  | All pages upfront    | All on initial, then on-demand per active page |
| Asset hashing    | SHA-256 content hash | None                                           |
| Output cleaned   | `rm -rf dist/` first | `rm -rf dev/` first                            |
| WS injection     | No                   | Yes (every HTML response)                      |

## Layout system

Layouts are TSX functions that receive props and return `HtmlString` (via JSX `h()`). They are dynamically imported from the layouts directory at render time.

```tsx
// Example layout
import { h, } from '../../src/jsx-runtime'
import { Html, } from './components/Html'

export default function Page(props: PageLayoutProps,) {
  const { content, frontmatter, headings, slug, site, } = props
  return (
    <Html title={frontmatter.title} site={site}>
      <main>
        <div class='prose' innerHTML={content} />
      </main>
    </Html>
  )
}
```

Key patterns:

- Use `innerHTML={content}` to inject processed markdown HTML
- Use `class` not `className` (the JSX runtime maps `className` -> `class`, but convention is to use `class` directly in TSX since output is HTML)
- Layout resolution: frontmatter `layout` field > page type's `defaultLayout` > site's `defaultLayout`
- Layouts dirs supports array (theme layouts as fallback)

## Markdown pipeline

`processMarkdown(raw, config, options)` in `src/markdown/pipeline.ts`:

1. `gray-matter` extracts YAML frontmatter
2. `remark-parse` -> `remark-gfm` -> `remark-math` -> `remark-frontmatter`
3. User-provided `remarkPlugins` from config
4. `remark-rehype` (allowDangerousHtml)
5. `rehype-mathjax/svg` -> `rehype-slug` -> `rehype-autolink-headings`
6. `@shikijs/rehype` with dual themes (light/dark), custom transformers for:
   - Line numbers (default on)
   - Line highlighting (`{1,3-5}`)
   - Word highlighting
   - Diff markers (`// [!code ++]` / `// [!code --]`)
   - Title/filename display
7. `rehype-code-tabs` — groups consecutive titled code blocks into CSS-only tabs
8. `rehype-link-transform` — converts relative `.md` links to site URLs
9. `rehype-asset-transform` — rewrites `./diagrams/x.svg` to `/assets/x.svg`, handles `.inline.svg` (inlines SVG content), `.invert.` class for dark mode
10. Heading extraction (builds TOC data)
11. User-provided `rehypePlugins`
12. `rehype-stringify` (allowDangerousHtml)

## Asset pipeline detail

**Build mode** (`hashAssets` in `src/assets/hasher.ts`):

1. CSS + JS already in `dist/assets/` from bundling phase
2. Hash all pre-existing `dist/assets/` files (rename `style.css` -> `style.a1b2c3d4.css`)
3. Scan all output HTML for `/assets/*` references
4. For each reference, find source in content dir, copy with hash to dist
5. Rewrite all HTML `src`/`href`/`srcset` attributes to hashed paths
6. Only content assets actually referenced in HTML are copied (demand-driven)

**Dev mode**: Assets bundled to `dev/assets/` without hashing. Same filenames always.

## Dev server internals

`startDev(config, options)` in `src/server/dev.ts`:

- Initial: render diagrams, then full build
- HTTP: serves from `dev/` output dir, directory -> index.html resolution, 404 fallback
- WS: client sends `{ type: 'page', path: '/articles/foo/' }` on connect
- Watchers:
  - **Content watcher**: `content/`, `layouts/`, `styles/` (ignores `.mermaid`, `.excalidraw`, `manifest.json`)
    - Content file change -> rebuild + notify only matching page clients + listing + home
    - Layout/style change -> full rebuild + broadcast all
  - **Diagram watcher**: `content/**/*.mermaid`, `content/**/*.excalidraw`
    - Re-render single diagram -> rebuild -> notify affected page
- Debounce: `building` flag + `pendingRebuild` queue

## Plugin interface

Search plugins implement:

```typescript
interface SearchPlugin {
  name: string
  css?: string[]
  runtime?: string[]
  afterBuild?(ctx: { outDir; config; pages },): Promise<void>
  headHtml?: string
  searchHtml?: string
}
```

## Config resolution order

1. `defineConfig()` in user project (type-safe helper)
2. `resolveConfig()` merges with `DEFAULTS`
3. All paths resolved to absolute from `rootDir` (defaults to `cwd()`)
4. `loadSiteConfig()` reads `content/site.json5` (JSON5 format)
5. `loadAllPageTypeMetas()` reads each `content/<type>/meta.json5`
