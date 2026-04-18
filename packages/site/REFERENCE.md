# `@pagesmith/site` Reference

Reference for the Pagesmith site toolkit.

`@pagesmith/site` builds on `@pagesmith/core` and owns the site-facing surface:

- preset-driven `pagesmith-site` CLI
- re-exported content-layer APIs for site consumers
- Vite SSG plugins
- server-side JSX runtime
- CSS bundles and CSS builder
- browser runtime helpers
- shared SSG utilities used by the first-party examples

## Requirements

- Node.js 24+
- ESM environment

## Package Roles

- `@pagesmith/core`: headless collections, loaders, markdown pipeline, validation, and the lower-level content package
- `@pagesmith/site`: app-facing content + site package, including core re-exports, JSX, CSS, runtime JS, SSG/dev/preview pipeline, and the preset-driven CLI
- `@pagesmith/docs`: opinionated docs preset built on core + site

## Adoption Paths

- AI-first bootstrap or retrofit: `node_modules/@pagesmith/site/skills/pagesmith-site-setup/references/setup-site.md`
- Follow-up usage patterns and prompts: `node_modules/@pagesmith/site/skills/pagesmith-site-setup/references/usage.md`
- Upgrade an existing integration: `node_modules/@pagesmith/site/skills/pagesmith-site-setup/references/migration.md`
- Use `@pagesmith/docs` instead when you want the opinionated docs preset and the `pagesmith-docs` CLI

## Agent Skills

`@pagesmith/site` ships self-contained Agent Skills inside the npm tarball at `node_modules/@pagesmith/site/skills/`. They are version-matched to the installed package — the bundle in `node_modules` is always the one your agent should read.

| Skill                              | Triggers when the user asks to                                                           |
| ---------------------------------- | ---------------------------------------------------------------------------------------- |
| `pagesmith-site-setup`             | Bootstrap a custom Pagesmith site (`@pagesmith/site`) without the docs preset.           |
| `pagesmith-site-use-preset`        | Consume a preset (`@pagesmith/docs`, a custom preset) through the `pagesmith-site` CLI.  |
| `pagesmith-site-customize-theme`   | Swap CSS bundles, runtime JS, layouts, or components shipped by `@pagesmith/site`.       |

### Installing the skills into a consumer project

After `npm install @pagesmith/site`, pick one of:

1. **Pagesmith's bundled installer** (preferred — no extra tooling required):

   ```bash
   npx pagesmith-core skills --package @pagesmith/site
   ```

   Copies every shipped skill to a canonical `.agents/skills/<name>/SKILL.md` and writes thin wrappers at `.claude/skills/<name>/SKILL.md` and `.cursor/skills/<name>/SKILL.md` that point at the canonical file. Drop `--package` to pull skills from `@pagesmith/core`, `@pagesmith/site`, and `@pagesmith/docs` together. Add `--dry-run` or `--no-overwrite` as needed.

2. **Copy the skill folder** into the agent directory your tool watches (`.agents/skills/`, `.claude/skills/`, or `.cursor/skills/`):

   ```bash
   mkdir -p .agents/skills
   cp -R node_modules/@pagesmith/site/skills/pagesmith-site-* .agents/skills/
   ```

   Cursor / Claude both also read the same skill directly from `node_modules/@pagesmith/site/skills/*/SKILL.md`, so the copy step is optional if you only need the agent to discover a skill on demand.

3. **Point the agent at the installed path** from `CLAUDE.md` / `AGENTS.md`:

   ```markdown
   When the user asks to bootstrap a Pagesmith site, read and follow:
   node_modules/@pagesmith/site/skills/pagesmith-site-setup/SKILL.md
   ```

### Configuring the skills

The skills read configuration from `pagesmith.config.json5` and `content.config.ts` in the consumer project — there is no separate per-skill config. When they need to branch on behavior, they use:

- The installed `node_modules/@pagesmith/site/REFERENCE.md` (this file) — the source of truth for CLI flags, export map, runtime hooks.
- The installed `node_modules/@pagesmith/core/REFERENCE.md` — the source of truth for the content layer and markdown pipeline.
- Each skill's sibling `references/` folder, which ships copies of every guideline the skill needs. The folder is self-contained so the skill still works if the repo has never seen Pagesmith before.

Invoke CLI commands as `npx pagesmith-site <command>` so the agent always uses the project-local binary.

## Setup Prompt

For agent-driven setup in an existing repository, start with:

- Package path: `node_modules/@pagesmith/site/skills/pagesmith-site-setup/references/setup-site.md`
- Hosted URL: <https://projects.sujeet.pro/pagesmith/prompts/setup-site.md>

The same prompt is exposed as a subpath export for agents that prefer to resolve it through Node:

```ts
import setupSite from '@pagesmith/site/agents/setup-site'
```

## Config API

### `defineSiteConfig(config)`

Identity helper for top-level `pagesmith.config.json5`-style config objects when you want typed authoring in TypeScript.

### `loadSiteConfig(configPath?)`

Reads a JSON5 config file from disk without schema validation. Defaults to `pagesmith.config.json5`.

### `parseSiteConfig(config)`

Validates a custom-site config object with the shared site schema:

```ts
type SiteUserConfig = {
  preset?: string
  presets?: string[]
  name?: string
  title?: string
  description?: string
  origin?: string
  language?: string
  contentDir?: string
  outDir?: string
  publicDir?: string
  basePath?: string
  homeLink?: string
  maintainer?: { name: string; link?: string }
  footerLinks?: Array<{ label: string; path: string }> | Array<{ header?: string; links: Array<{ label: string; path: string }> }>
  footerText?: string
  copyright?: { projectName: string; startYear: number; endYear?: number | null }
  sidebar?: { collapsible?: boolean }
  search?: { enabled?: boolean; showImages?: boolean; showSubResults?: boolean }
  theme?: {
    lightColor?: string
    darkColor?: string
    defaultColorScheme?: 'auto' | 'light' | 'dark'
    defaultTheme?: string
    defaultTextSize?: string
    layouts?: Record<string, string>
    socialImage?: string
  }
  seo?: { locale?: string; twitterHandle?: string; defaultOgType?: string }
  analytics?: { googleAnalytics?: string }
  socialImage?: string
  favicon?: string | false
  faviconFallback?: string | false
  appleTouchIcon?: string | false
  server?: { host?: string; devPort?: number; previewPort?: number; strictPort?: boolean }
  [key: string]: unknown
}
```

The schema is also exported from `@pagesmith/site/schemas` as `SiteUserConfigSchema`.

### `normalizeBasePath(basePath)`

Normalizes `''`, `'/'`, and slash-wrapped values to the package-standard base-path form (`''` or `'/docs'`).

### `withBasePath(basePath, path)`

Prefixes site-local absolute paths with `basePath` while leaving already-prefixed, relative, and external URLs untouched.

### `stripBasePath(url, basePath)`

Removes `basePath` from a request URL and returns the site-local path.

### `formatPath(path, trailingSlash?)`

Formats an internal path based on the trailing-slash preference. When `trailingSlash` is `true`, appends `/`; when `false` (default), strips trailing `/`. External URLs, anchors, and paths with file extensions are returned as-is. This is the preferred utility for link output in components.

### `withTrailingSlash(path)`

Adds a trailing slash to route-style paths (`/guide` -> `/guide/`, `/` stays `/`). Prefer `formatPath()` for config-aware formatting.

### `withoutTrailingSlash(path)`

Removes a trailing slash from route-style paths (`/guide/` -> `/guide`, `/` stays `/`). Prefer `formatPath()` for config-aware formatting.

### `normalizePresetSpecifier(value)`

Rules:

- `undefined` stays `undefined`
- values already ending in `/preset` are returned unchanged
- package specifiers starting with `@pagesmith/` get `/preset` appended

Examples:

- `@pagesmith/docs` -> `@pagesmith/docs/preset`
- `@pagesmith/docs/preset` -> `@pagesmith/docs/preset`

### `resolveSitePresetSpecifier(configPath?, fallback?)`

Preset resolution order:

1. top-level `preset`
2. first item in top-level `presets`
3. `fallback`

Default fallback:

```ts
process.env.PAGESMITH_PRESET ?? '@pagesmith/site/preset'
```

## Content Helpers

Shared utilities for building navigation structures from content entry lists. Imported from the main `@pagesmith/site` barrel.

### `sortByManualOrder(entries, orderedSlugs, getSlug, fallbackCompare?)`

Sort entries by manual order. Items matching `orderedSlugs` come first (in that order); remaining items are appended, sorted by the optional `fallbackCompare` (defaults to stable order).

```ts
import { sortByManualOrder } from '@pagesmith/site'

const sorted = sortByManualOrder(
  projects,
  meta.items ?? [],
  (p) => p.slug,
  (a, b) => a.title.localeCompare(b.title),
)
```

### `sortByDate(entries, getDate, fallbackCompare?)`

Sort entries newest-first by a date accessor. Entries without dates sort last.

```ts
import { sortByDate } from '@pagesmith/site'

const sorted = sortByDate(articles, (a) => a.publishedDate)
```

### `buildBreadcrumbs(basePath, crumbs)`

Build a `SiteBreadcrumb[]` from a list of label/path pairs. Paths are prefixed with `basePath`.

```ts
import { buildBreadcrumbs } from '@pagesmith/site'

const crumbs = buildBreadcrumbs(basePath, [
  { label: 'Articles', path: '/articles' },
  { label: article.title },
])
```

### `buildSidebarFromEntries(title, entries, options?)`

Build a `SiteSidebarSection[]` from an array of `{ title, path }` entries. Pass `options.overviewPath` to prepend an "Overview" link.

```ts
import { buildSidebarFromEntries } from '@pagesmith/site'

const sidebar = buildSidebarFromEntries('Projects', projects.map((p) => ({ title: p.title, path: p.path })), {
  overviewPath: withBasePath(basePath, '/projects'),
})
```

### `buildPrevNext(entries, currentIndex, getTitle, getPath)`

Build prev/next `SitePageLink` objects from an ordered entry list and the current entry's index.

```ts
import { buildPrevNext } from '@pagesmith/site'

const index = articles.findIndex((a) => a.slug === currentSlug)
const { prev, next } = buildPrevNext(articles, index, (a) => a.title, (a) => a.path)
```

## Preset Contract

Available from `@pagesmith/site/preset`:

```ts
type SiteLogLevel = 'silent' | 'error' | 'warn' | 'info' | 'verbose'

type SiteBuildOptions = {
  configPath?: string
  outDir?: string
  basePath?: string
}

type SiteDevOptions = SiteBuildOptions & {
  port?: number
  open?: boolean
  logLevel?: SiteLogLevel
}

interface SitePreset {
  build?(options?: SiteBuildOptions): Promise<void>
  dev?(options?: SiteDevOptions): Promise<void>
  preview?(options?: SiteDevOptions): Promise<void>
  init?(argv: string[]): Promise<void>
  mcp?(argv: string[]): Promise<void>
}
```

Preset modules are dynamically imported. The module must export one of:

- `default`
- `docsPreset`
- `sitePreset`
- `preset`

That export must be a function that returns a preset object.

## CLI

`@pagesmith/site` publishes the `pagesmith-site` binary. The package also keeps `pagesmith` as a compatibility alias, but `pagesmith-site` is the canonical package-owned command.

Commands:

- `pagesmith-site dev`
- `pagesmith-site build`
- `pagesmith-site preview`
- `pagesmith-site validate`
- `pagesmith-site init`
- `pagesmith-site mcp`

Shared flags:

- `--preset <module>`
- `--config <path>` (auto-discovers `pagesmith.config.{ts,mts,js,mjs,json5,json}` when omitted)
- `--out-dir <path>`
- `--base-path <path>`
- `-p, --port <number>`
- `--open`
- `--log-level <level>`
- `--yes` / `--non-interactive` / `--interactive` (passed to the preset's init flow)
- `-h, --help`
- `-v, --version`

### `pagesmith-site validate`

The preset implements validation when available; when absent, the CLI runs generic content + build-output checks. Flags:

| Flag | Purpose |
|---|---|
| `--content-dir <path>` | Content directory override |
| `--out-dir <path>` | Build output directory override |
| `--base-path <path>` | Site base path override |
| `--content` | Only run content validation |
| `--build` | Only run build-output validation |
| `--check-external` | Fetch external URLs and report non-2xx |
| `--require-raster-modern-formats` | Enforce webp+avif siblings for `<picture>` raster fallbacks |
| `--require-theme-variants` | Enforce light+dark `<picture>` sources |
| `--require-canonical-internal-links` / `--no-require-canonical-internal-links` | Require `./relative/path.md` authoring form |
| `--trailing-slash` / `--no-trailing-slash` | Override trailing-slash routing mode |
| `--timeout-ms <number>` | External fetch timeout (default: 10000) |
| `--concurrency <number>` | External fetch concurrency (default: 8) |
| `--show-clean` | Also list files that pass content validation |

Important behavior:

- arg parsing is built on `cac`; help (`--help`) and version (`--version`) are auto-generated per command.
- the fallback preset is `@pagesmith/site/preset`, which exists to surface a helpful error when no real preset was selected.
- `--preset`, `PAGESMITH_PRESET`, and top-level `preset` / `presets` choose the active preset.
- `init` and `mcp` pass their argv through to the active preset; the docs preset is the canonical implementer for both.
- use `pagesmith-docs` when you want the built-in docs workflow from `@pagesmith/docs`.

## Vite

Available from `@pagesmith/site/vite`:

- `pagesmithContent`
- `pagesmithSsg`
- `sharedAssetsPlugin`
- `prerenderRoutes`

### `pagesmithSsg(options)`

```ts
type SsgPluginOptions = {
  entry: string
  pagefind?: boolean
  contentDirs?: string[]
  cssEntry?: string
  trailingSlash?: boolean
}
```

Responsibilities:

- dev SSR middleware
- production static rendering after the Vite build
- preview serving from the built output on disk (supports both `path.html` and `path/index.html`)
- content companion asset copying
- Pagefind indexing after build unless `pagefind: false`

The `trailingSlash` option controls the output file format: `false` (default) emits `path.html` for direct resolution on GitHub Pages without 301 redirects; `true` emits `path/index.html` for trailing-slash URLs.

The SSR entry module must export:

```ts
import type { SsgRenderConfig } from '@pagesmith/site/vite'

export function getRoutes(config: SsgRenderConfig): string[] | Promise<string[]>
export function render(url: string, config: SsgRenderConfig): string | Promise<string>
```

`SsgRenderConfig`:

```ts
type SsgRenderConfig = {
  base: string
  root: string
  cssPath: string
  jsPath?: string
  searchEnabled: boolean
  isDev: boolean
}
```

Behavior notes:

- dev mode uses on-the-fly SSR middleware
- preview serves clean URLs from the built filesystem output, so rebuilds are reflected without restarting preview
- production renders `/404` to `404.html`
- Pagefind runs after build when enabled

### `sharedAssetsPlugin()`

Dev-only helper that serves packaged font assets from `@pagesmith/site/assets`.

### `prerenderRoutes(options)`

Lower-level prerender helper for custom pipelines. Use this when you want explicit route-driven prerendering outside the main `pagesmithSsg` flow.

## JSX Runtime

Available from:

- `@pagesmith/site/jsx-runtime`
- `@pagesmith/site/jsx-dev-runtime`

Primary exports:

- `h`
- `Fragment`
- `HtmlString`
- `jsx`
- `jsxs`
- `jsxDEV`

Use:

```json
{
  "compilerOptions": {
    "jsx": "react-jsx",
    "jsxImportSource": "@pagesmith/site"
  }
}
```

## CSS

### `@pagesmith/site/css`

Programmatic CSS builder:

```ts
import { buildCss } from '@pagesmith/site/css'
```

### Static CSS subpaths

- `@pagesmith/site/css/chrome`
- `@pagesmith/site/css/content`
- `@pagesmith/site/css/standalone`
- `@pagesmith/site/css/code-block`
- `@pagesmith/site/css/code-inline`
- `@pagesmith/site/css/tabs`
- `@pagesmith/site/css/viewport`
- `@pagesmith/site/css/fonts`

Recommended pairing:

- `css/chrome` for shared site chrome only
- `css/standalone` for chrome + prose + code UI
- `css/content` for prose + code UI without the site shell

## Components / Layouts / Theme

### `@pagesmith/site/components`

Reusable server-rendered chrome used by `@pagesmith/docs` and the first-party examples.

Primary exports include:

- `SiteDocument` / `Html`
- `SiteHeader` / `DocHeader`
- `SiteSidebar` / `DocSidebar`
- `SiteSidebarModal`
- `TableOfContents` / `DocTOC`
- `AccordionTableOfContents`
- `SiteFooter` / `DocFooter`
- `ListingCards`
- `Breadcrumbs`
- shared prop types such as `SiteNavItem`, `SiteSidebarSection`, `SiteFooterLinks`, `SiteListingCard`, and `SiteDocumentData`
- component asset bundle metadata via `SITE_CHROME_ASSETS`, `SITE_CONTENT_ASSETS`, and `SITE_STANDALONE_ASSETS`

### `@pagesmith/site/layouts`

Reusable layout wrappers:

- `PageShell` / `DocPageShell` — 3-column docs/page shell that composes the shared header, sidebar, TOC, and footer

### `@pagesmith/site/theme`

Theme-control defaults:

- `DEFAULT_COLOR_SCHEME_OPTIONS`
- `DEFAULT_THEME_OPTIONS`
- `DEFAULT_TEXT_SIZE_OPTIONS`
- `resolveThemeControls()`

## Runtime Helpers

### `@pagesmith/site/runtime`

Node-side helpers for reading packaged CSS and JS:

- `getRuntimeCSS`
- `getRuntimeJS`
- `getRuntimeCSSPath`
- `getRuntimeJSPath`
- `getChromeCSS`
- `getChromeJS`
- `getChromeCSSPath`
- `getChromeJSPath`
- `getContentCSS`
- `getContentJS`
- `getContentCSSPath`
- `getContentJSPath`
- `getViewportCSS`
- `getViewportCSSPath`

### Browser runtime entry points

- `@pagesmith/site/runtime/chrome`
- `@pagesmith/site/runtime/content`
- `@pagesmith/site/runtime/standalone`
- `@pagesmith/site/runtime/code-blocks`
- `@pagesmith/site/runtime/code-tabs`
- `@pagesmith/site/runtime/footer-year`
- `@pagesmith/site/runtime/search-trigger`
- `@pagesmith/site/runtime/sidebar`
- `@pagesmith/site/runtime/skip-link`
- `@pagesmith/site/runtime/toc-highlight`
- `@pagesmith/site/runtime/theme`

Behavior:

- `runtime/content` wires code-block UI
- `runtime/chrome` wires the shared header/sidebar/footer/TOC/theme controls
- `runtime/standalone` adds the chrome runtime plus the content/code-block behavior
- theme preferences persist in `localStorage('pagesmith-theme')`
- TOC highlighting supports generic `[data-ps-toc]` selectors in addition to docs-theme selectors

## `ssg-utils`

Available from `@pagesmith/site/ssg-utils`.

Includes:

- shared types: `Heading`, `MarkdownEntry`, `NavEntry`, `NavGroup`, `DocumentShellOptions`
- helper icons: `menuIcon`, `closeIcon`, `searchIcon`
- route helpers: `normalizeRoute`, `leafSlug`, `routeFor`
- date helpers: `getTime`, `toIso`, `formatDate`
- content helpers: `estimateReadTime`, `escapeHtml`, `buildNavEntries`, `groupByField`
- search helper: `runPagefindIndexing(outDir, options?)`
- HTML helper: `renderDocumentShell`

## Export Map

| Import Path | Purpose |
| --- | --- |
| `@pagesmith/site` | Core content-layer re-exports plus site config helpers and preset types |
| `@pagesmith/site/markdown` | Pass-through markdown helpers from core |
| `@pagesmith/site/schemas` | Core schemas plus site config schemas such as `SiteUserConfigSchema` |
| `@pagesmith/site/loaders` | Pass-through loader registry and loader classes from core |
| `@pagesmith/site/assets` | Pass-through asset helpers from core |
| `@pagesmith/site/config` | Config helpers, schema-backed parsing, and base-path utilities |
| `@pagesmith/site/preset` | Preset contract plus the default `sitePreset()` fallback |
| `@pagesmith/site/jsx-runtime` | Server-side JSX runtime |
| `@pagesmith/site/jsx-dev-runtime` | JSX dev runtime |
| `@pagesmith/site/components` | Reusable site/document chrome components |
| `@pagesmith/site/layouts` | Reusable site layout wrappers |
| `@pagesmith/site/theme` | Theme-control defaults and helpers |
| `@pagesmith/site/css` | Programmatic CSS builder |
| `@pagesmith/site/css/*` | Static CSS bundles |
| `@pagesmith/site/runtime` | Runtime CSS/JS helpers and asset paths |
| `@pagesmith/site/runtime/*` | Browser runtime entry points |
| `@pagesmith/site/vite` | SSG, prerender, shared asset Vite helpers |
| `@pagesmith/site/ssg-utils` | Shared SSG helpers |
| `@pagesmith/site/skills/pagesmith-site-setup/references/*` | Package AI guidance |

## Related Docs

- `README.md`
- `skills/pagesmith-site-setup/references/site-guidelines.md`
- `skills/pagesmith-site-setup/references/usage.md`
- `../core/REFERENCE.md`
- `../docs/REFERENCE.md`
