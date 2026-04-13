# `@pagesmith/site` Reference

Reference for the Pagesmith site toolkit.

`@pagesmith/site` builds on `@pagesmith/core` and owns the site-facing surface:

- preset-driven `pagesmith-site` CLI
- Vite SSG plugins
- server-side JSX runtime
- CSS bundles and CSS builder
- browser runtime helpers
- shared SSG utilities used by the first-party examples

## Requirements

- Node.js 24+
- ESM environment

## Package Roles

- `@pagesmith/core`: collections, loaders, markdown pipeline, validation, `pagesmithContent`
- `@pagesmith/site`: JSX, CSS, runtime JS, SSG/dev/preview pipeline, preset-driven CLI
- `@pagesmith/docs`: opinionated docs preset built on core + site

## Adoption Paths

- AI-first bootstrap or retrofit: `node_modules/@pagesmith/site/ai-guidelines/setup-site.md`
- Follow-up usage patterns and prompts: `node_modules/@pagesmith/site/ai-guidelines/usage.md`
- Upgrade an existing integration: `node_modules/@pagesmith/site/ai-guidelines/migration.md`
- Use `@pagesmith/docs` instead when you want the opinionated docs preset and the `pagesmith-docs` CLI

## Setup Prompt

For agent-driven setup in an existing repository, start with:

- Package path: `node_modules/@pagesmith/site/ai-guidelines/setup-site.md`
- Hosted URL: [https://projects.sujeet.pro/pagesmith/prompts/setup-site.md](https://projects.sujeet.pro/pagesmith/prompts/setup-site.md)

## Config API

### `defineSiteConfig(config)`

Identity helper for top-level `pagesmith.config.json5`-style config objects when you want typed authoring in TypeScript.

### `loadSiteConfig(configPath?)`

Reads a JSON5 config file from disk and returns:

```ts
type SiteUserConfig = {
  preset?: string
  presets?: string[]
  [key: string]: unknown
}
```

Defaults to `pagesmith.config.json5`.

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
- `pagesmith-site init`
- `pagesmith-site mcp`

Shared flags:

- `--preset <module>`
- `--config <path>`
- `--out-dir <path>`
- `--base-path <path>`
- `-p, --port <number>`
- `--open`
- `--log-level <level>`
- `-h, --help`
- `-v, --version`

Important behavior:

- the fallback preset is `@pagesmith/site/preset`, which exists to surface a helpful error when no real preset was selected
- `--preset`, `PAGESMITH_PRESET`, and top-level `preset` / `presets` choose the active preset
- use `pagesmith-docs` when you want the built-in docs workflow from `@pagesmith/docs`

## Vite

Available from `@pagesmith/site/vite`:

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
}
```

Responsibilities:

- dev SSR middleware
- production static rendering after the Vite build
- preview serving from the built output on disk
- content companion asset copying
- Pagefind indexing after build unless `pagefind: false`

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

- `@pagesmith/site/css/content`
- `@pagesmith/site/css/standalone`
- `@pagesmith/site/css/code-block`
- `@pagesmith/site/css/code-inline`
- `@pagesmith/site/css/tabs`
- `@pagesmith/site/css/viewport`
- `@pagesmith/site/css/fonts`

## Runtime Helpers

### `@pagesmith/site/runtime`

Node-side helpers for reading packaged CSS and JS:

- `getRuntimeCSS`
- `getRuntimeJS`
- `getRuntimeCSSPath`
- `getRuntimeJSPath`
- `getContentCSS`
- `getContentJS`
- `getContentCSSPath`
- `getContentJSPath`
- `getViewportCSS`
- `getViewportCSSPath`

### Browser runtime entry points

- `@pagesmith/site/runtime/content`
- `@pagesmith/site/runtime/standalone`
- `@pagesmith/site/runtime/code-blocks`
- `@pagesmith/site/runtime/code-tabs`
- `@pagesmith/site/runtime/toc-highlight`
- `@pagesmith/site/runtime/theme`

Behavior:

- `runtime/content` wires code-block UI
- `runtime/standalone` adds TOC highlighting and theme/font-size controls
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
- HTML helper: `renderDocumentShell`

## Export Map

| Import Path | Purpose |
| --- | --- |
| `@pagesmith/site` | Config helpers and preset types |
| `@pagesmith/site/config` | Config helpers only |
| `@pagesmith/site/preset` | Preset contract plus the default `sitePreset()` fallback |
| `@pagesmith/site/jsx-runtime` | Server-side JSX runtime |
| `@pagesmith/site/jsx-dev-runtime` | JSX dev runtime |
| `@pagesmith/site/css` | Programmatic CSS builder |
| `@pagesmith/site/css/*` | Static CSS bundles |
| `@pagesmith/site/runtime` | Runtime CSS/JS helpers and asset paths |
| `@pagesmith/site/runtime/*` | Browser runtime entry points |
| `@pagesmith/site/vite` | SSG, prerender, shared asset Vite helpers |
| `@pagesmith/site/ssg-utils` | Shared SSG helpers |
| `@pagesmith/site/ai-guidelines/*` | Package AI guidance |

## Related Docs

- `README.md`
- `ai-guidelines/site-guidelines.md`
- `ai-guidelines/usage.md`
- `../core/REFERENCE.md`
- `../docs/REFERENCE.md`
