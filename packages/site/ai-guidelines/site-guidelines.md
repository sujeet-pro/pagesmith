# `@pagesmith/site` Guidelines

Guide for AI assistants using `@pagesmith/site`.

`@pagesmith/site` is the Pagesmith site toolkit. It is not the headless content layer. Use it together with `@pagesmith/core` when a project needs site rendering, SSG, shared CSS/runtime behavior, or the preset-driven `pagesmith-site` CLI.

## Read This First

- `node_modules/@pagesmith/site/README.md`
- `node_modules/@pagesmith/site/REFERENCE.md`
- `node_modules/@pagesmith/site/ai-guidelines/setup-site.md`
- `node_modules/@pagesmith/site/ai-guidelines/usage.md`
- `node_modules/@pagesmith/core/REFERENCE.md`

## What Lives In `@pagesmith/site`

- `pagesmith-site` CLI
- preset loading and config helpers
- `@pagesmith/site/jsx-runtime`
- `@pagesmith/site/css/*`
- `@pagesmith/site/runtime/*`
- `@pagesmith/site/vite`
- `@pagesmith/site/ssg-utils`

## What Does Not Live Here

Do not treat `@pagesmith/site` as the content store.

Keep these in `@pagesmith/core`:

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
import { pagesmithContent } from '@pagesmith/core/vite'
import { pagesmithSsg, sharedAssetsPlugin } from '@pagesmith/site/vite'
```

### Framework host / existing app

When another app owns routing and build tooling, keep Pagesmith limited to the shared presentation layer:

```ts
import '@pagesmith/site/css/content'
import '@pagesmith/site/runtime/content'
```

In that shape, `createContentLayer()` and `entry.render()` stay on `@pagesmith/core`, and `@pagesmith/site` only provides the shipped markdown CSS/runtime.

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
- Do not tell users to import CSS or runtime JS from `@pagesmith/core`.

## CLI Rules

- `pagesmith-site` is the canonical CLI published by `@pagesmith/site`.
- `pagesmith` remains a compatibility alias, but package docs should prefer `pagesmith-site`.
- The fallback preset is `@pagesmith/site/preset`, which exists to surface a helpful error when no real preset has been selected.
- `--preset`, `PAGESMITH_PRESET`, and top-level `preset` / `presets` can override the active preset.
- Use `pagesmith-docs` instead of `pagesmith-site` when the project wants the built-in docs workflow from `@pagesmith/docs`.

## Behavior Notes

- `pagesmithSsg` owns dev SSR, build-time SSG, preview serving from disk, and Pagefind indexing.
- Theme and text-size preferences persist in `localStorage('pagesmith-theme')`.
- TOC highlighting supports generic `[data-ps-toc]` selectors.
- The preview server serves current files from disk after rebuilds; do not document it as an in-memory snapshot.

## When To Use `@pagesmith/docs` Instead

Use `@pagesmith/docs` when the project wants:

- docs conventions
- docs schemas
- docs navigation
- the default docs theme
- docs MCP support

`@pagesmith/docs` is a preset on top of `@pagesmith/site`, and `pagesmith-docs` is the canonical CLI for that package.
