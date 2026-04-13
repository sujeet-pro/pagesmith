# `@pagesmith/site`

Site toolkit for Pagesmith.

`@pagesmith/site` sits on top of `@pagesmith/core` and provides the pieces you need once you move from "content layer" to "site": the preset-driven `pagesmith-site` CLI, the Vite SSG plugin, the JSX-to-HTML runtime, shared CSS bundles, browser runtime helpers, and small SSG utilities used by the first-party examples.

Use `@pagesmith/core` for collections, loaders, markdown rendering, validation, and `virtual:content/*`. Use `@pagesmith/site` for the site shell, build pipeline, and presentation/runtime layer.

## Requirements

- Node.js 24+
- ESM projects (`@pagesmith/site` is published as ESM)

## Install

```bash
npm add @pagesmith/core @pagesmith/site
```

If you are building a docs site with the default Pagesmith docs preset, install `@pagesmith/docs` instead; it depends on both `@pagesmith/core` and `@pagesmith/site`.

## Choose The Package

- Use `@pagesmith/core` when you only need a headless content layer.
- Use `@pagesmith/core` + `@pagesmith/site` when you are building a custom site, blog, portfolio, framework-based static site, or an existing app that wants Pagesmith's shared CSS/runtime layer.
- Use `@pagesmith/docs` when you want the opinionated docs preset and default docs theme.

## Adoption Paths

- AI-first bootstrap or retrofit: start with `node_modules/@pagesmith/site/ai-guidelines/setup-site.md`
- Follow-up usage patterns and prompts: `node_modules/@pagesmith/site/ai-guidelines/usage.md`
- Upgrade an existing integration: start with `node_modules/@pagesmith/site/ai-guidelines/migration.md`
- Manual setup: follow the Vite, JSX, CSS/runtime, and CLI sections below

## Setup Prompt

For agent-driven setup in an existing repository, start with the dedicated prompt file:

- Package path: `node_modules/@pagesmith/site/ai-guidelines/setup-site.md`
- Hosted URL: [https://projects.sujeet.pro/pagesmith/prompts/setup-site.md](https://projects.sujeet.pro/pagesmith/prompts/setup-site.md)

## Quick Start

### Vite site

Define collections with `@pagesmith/core`, then add the site-building plugins from `@pagesmith/site`:

```ts
import { defineConfig } from 'vite'
import { pagesmithContent } from '@pagesmith/core/vite'
import { pagesmithSsg, sharedAssetsPlugin } from '@pagesmith/site/vite'
import collections from './content.config'

export default defineConfig({
  plugins: [
    sharedAssetsPlugin(),
    pagesmithContent({ collections }),
    ...pagesmithSsg({
      entry: './src/entry-server.tsx',
      contentDirs: ['./content'],
    }),
  ],
})
```

Your SSR entry should export:

```ts
import type { SsgRenderConfig } from '@pagesmith/site/vite'

export function getRoutes(config: SsgRenderConfig): string[] {
  return ['/']
}

export function render(url: string, config: SsgRenderConfig): string | Promise<string> {
  return '<!DOCTYPE html><html><body>Hello</body></html>'
}
```

### JSX runtime

For Pagesmith's server-side JSX runtime:

```json
{
  "compilerOptions": {
    "jsx": "react-jsx",
    "jsxImportSource": "@pagesmith/site"
  }
}
```

```tsx
import { Fragment } from '@pagesmith/site/jsx-runtime'

export function Page({ title, content }: { title: string; content: string }) {
  return (
    <html>
      <head>
        <title>{title}</title>
      </head>
      <body>
        <Fragment innerHTML={content} />
      </body>
    </html>
  )
}
```

### CSS and runtime

Import static CSS bundles from the `css/*` subpaths:

```css
@import '@pagesmith/site/css/content';
@import '@pagesmith/site/css/fonts';
```

Use the browser runtime entry points when you want built-in code-block behavior, TOC highlighting, or theme/font-size persistence:

```ts
import '@pagesmith/site/runtime/content'
import { initTheme } from '@pagesmith/site/runtime/theme'

initTheme()
```

For framework-hosted apps such as Next.js, this CSS/runtime pairing is often all you need from `@pagesmith/site`: the host app keeps routing and layout, while Pagesmith provides the shared markdown presentation layer.

## CLI

`@pagesmith/site` publishes the `pagesmith-site` binary. The package also keeps `pagesmith` as a compatibility alias, but `pagesmith-site` is the canonical package-owned command.

Commands:

- `pagesmith-site dev`
- `pagesmith-site build`
- `pagesmith-site preview`
- `pagesmith-site init`
- `pagesmith-site mcp`

Important behavior:

- The CLI is preset-driven.
- The package-owned fallback preset is `@pagesmith/site/preset`, which exists to surface a helpful error when no real preset has been selected.
- Override the active preset with `--preset`, `PAGESMITH_PRESET`, or top-level `preset` / `presets` in `pagesmith.config.json5`.
- Use `pagesmith-docs` when you want the built-in docs workflow from `@pagesmith/docs`.

## Config Helpers

Available from `@pagesmith/site`:

- `defineSiteConfig(config)`
- `loadSiteConfig(configPath?)`
- `normalizePresetSpecifier(value)`
- `resolveSitePresetSpecifier(configPath?, fallback?)`

Scoped Pagesmith package names are normalized to `/preset`, for example `preset: '@pagesmith/docs'` becomes `@pagesmith/docs/preset`.

## Public Exports

### Main entry

- `@pagesmith/site`
- `@pagesmith/site/config`
- `@pagesmith/site/preset`

### JSX

- `@pagesmith/site/jsx-runtime`
- `@pagesmith/site/jsx-dev-runtime`

### CSS

- `@pagesmith/site/css`
- `@pagesmith/site/css/content`
- `@pagesmith/site/css/standalone`
- `@pagesmith/site/css/code-block`
- `@pagesmith/site/css/code-inline`
- `@pagesmith/site/css/tabs`
- `@pagesmith/site/css/viewport`
- `@pagesmith/site/css/fonts`

### Runtime

- `@pagesmith/site/runtime`
- `@pagesmith/site/runtime/content`
- `@pagesmith/site/runtime/standalone`
- `@pagesmith/site/runtime/code-blocks`
- `@pagesmith/site/runtime/code-tabs`
- `@pagesmith/site/runtime/toc-highlight`
- `@pagesmith/site/runtime/theme`

### Vite / SSG

- `@pagesmith/site/vite`
- `@pagesmith/site/ssg-utils`

## Further Reading

- `REFERENCE.md`
- `ai-guidelines/setup-site.md`
- `ai-guidelines/site-guidelines.md`
- `ai-guidelines/usage.md`
- `../core/README.md`
- `../docs/README.md`

## License

MIT
