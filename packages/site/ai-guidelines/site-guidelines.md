# `@pagesmith/site` Guidelines

Guide for AI assistants using `@pagesmith/site`.

`@pagesmith/site` is the Pagesmith site toolkit and the app-facing package for site consumers. It is not the headless content layer, but it does re-export the core content APIs that site-based apps typically need.

## Read This First

- `node_modules/@pagesmith/site/README.md`
- `node_modules/@pagesmith/site/REFERENCE.md`
- `node_modules/@pagesmith/site/ai-guidelines/setup-site.md`
- `node_modules/@pagesmith/site/ai-guidelines/usage.md`
- `node_modules/@pagesmith/core/REFERENCE.md`

## What Lives In `@pagesmith/site`

- `pagesmith-site` CLI
- preset loading and config helpers
- site config schemas (`SiteUserConfigSchema` and related helpers)
- `@pagesmith/site/jsx-runtime`
- `@pagesmith/site/components`
- `@pagesmith/site/layouts`
- `@pagesmith/site/theme`
- `@pagesmith/site/css/*`
- `@pagesmith/site/runtime/*`
- `@pagesmith/site/vite`
- `@pagesmith/site/ssg-utils`

## What Does Not Live Here

Do not treat `@pagesmith/site` as a separate content store. It re-exports core content APIs, but the underlying content-layer implementation still lives in `@pagesmith/core`.

These responsibilities originate in `@pagesmith/core` and are re-exported through `@pagesmith/site` for site consumers:

- `defineCollection`
- `defineCollections`
- `defineConfig`
- `createContentLayer`
- `processMarkdown`
- `pagesmithContent`
- collection schemas and loaders

## Integration Rules

### Vite

Split imports by responsibility:

```ts
import { pagesmithContent, pagesmithSsg, sharedAssetsPlugin } from '@pagesmith/site/vite'
```

### Framework host / existing app

When another app owns routing and build tooling, keep Pagesmith limited to the shared presentation layer:

```ts
import '@pagesmith/site/css/content'
import '@pagesmith/site/runtime/content'
```

In that shape, `createContentLayer()` and `entry.render()` can come from `@pagesmith/site`, while `@pagesmith/site` also provides the shipped markdown CSS/runtime.

When the project wants the shared Pagesmith chrome itself, use the exported components/layouts instead of copying the docs theme:

```tsx
import { SiteDocument, SiteHeader, SiteFooter } from '@pagesmith/site/components'
import { PageShell } from '@pagesmith/site/layouts'
```

### JSX

For Pagesmith's server-side JSX runtime:

```json
{
  "compilerOptions": {
    "jsx": "react-jsx",
    "jsxImportSource": "@pagesmith/site"
  }
}
```

### CSS / Runtime

- Use `@pagesmith/site/css/*` for shipped styles.
- Use `@pagesmith/site/runtime/*` for shipped browser behavior.
- Pair `css/chrome` with `runtime/chrome` for reusable site chrome.
- Pair `css/standalone` with `runtime/standalone` for full Pagesmith pages.
- Do not tell users to import CSS or runtime JS from `@pagesmith/core`.

## CLI Rules

- `pagesmith-site` is the canonical CLI published by `@pagesmith/site`.
- `pagesmith` remains a compatibility alias, but package docs should prefer `pagesmith-site`.
- The fallback preset is `@pagesmith/site/preset`, which exists to surface a helpful error when no real preset has been selected.
- `--preset`, `PAGESMITH_PRESET`, and top-level `preset` / `presets` can override the active preset.
- Use `pagesmith-docs` instead of `pagesmith-site` when the project wants the built-in docs workflow from `@pagesmith/docs`.

## Behavior Notes

- `pagesmithSsg` owns dev SSR, build-time SSG, preview serving from disk, and Pagefind indexing.
- The default docs chrome is now implemented in `@pagesmith/site/components` and `@pagesmith/site/layouts`; `@pagesmith/docs` consumes those exports.
- Theme and text-size preferences persist in `localStorage('pagesmith-theme')`.
- TOC highlighting supports generic `[data-ps-toc]` selectors.
- The preview server serves current files from disk after rebuilds; do not document it as an in-memory snapshot.

## When To Use `@pagesmith/docs` Instead

Use `@pagesmith/docs` when the project wants:

- docs conventions
- docs schemas
- docs navigation
- the docs preset and docs-specific data shaping
- docs MCP support

`@pagesmith/docs` is a preset on top of `@pagesmith/site`, and `pagesmith-docs` is the canonical CLI for that package.
