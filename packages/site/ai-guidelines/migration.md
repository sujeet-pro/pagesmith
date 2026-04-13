# `@pagesmith/site` Migration Notes

Use this file when upgrading a project from the old two-package Pagesmith split to the current `core` + `site` + `docs` architecture.

## What Changed

- `@pagesmith/core` is now the headless content layer.
- `@pagesmith/site` owns the `pagesmith-site` CLI, JSX runtime, CSS bundles, runtime JS, and Vite SSG helpers.
- `@pagesmith/docs` is the opinionated docs preset built on top of both packages.

## Import Moves

Move these imports to `@pagesmith/site`:

- `pagesmithSsg`
- `sharedAssetsPlugin`
- `prerenderRoutes`
- `SsgRenderConfig`
- `@pagesmith/core/jsx-runtime`
- `@pagesmith/core/css/*`
- `@pagesmith/core/runtime/*`
- `@pagesmith/core/ssg-utils`

Keep these on `@pagesmith/core`:

- `defineCollection`
- `defineCollections`
- `defineConfig`
- `createContentLayer`
- `processMarkdown`
- `pagesmithContent`
- schemas, loaders, markdown, assets, MCP

## Typical Before / After

Before:

```ts
import { pagesmithContent, pagesmithSsg, sharedAssetsPlugin } from '@pagesmith/core/vite'
```

After:

```ts
import { pagesmithContent } from '@pagesmith/core/vite'
import { pagesmithSsg, sharedAssetsPlugin } from '@pagesmith/site/vite'
```

Before:

```json
{
  "compilerOptions": {
    "jsx": "react-jsx",
    "jsxImportSource": "@pagesmith/core"
  }
}
```

After:

```json
{
  "compilerOptions": {
    "jsx": "react-jsx",
    "jsxImportSource": "@pagesmith/site"
  }
}
```

## Docs Projects

- Keep using `@pagesmith/docs` for docs builds.
- The canonical site binary is now `pagesmith-site` from `@pagesmith/site`.
- `pagesmith` remains available as a compatibility alias.
- The fallback preset is `@pagesmith/site/preset`; use `pagesmith-docs` when you want the built-in docs workflow.

## Verification

After migrating:

1. Re-run typechecking.
2. Verify Vite imports are split correctly between `core` and `site`.
3. Verify JSX configs point to `@pagesmith/site`.
4. Verify CSS/runtime imports use `@pagesmith/site`.
5. Verify `pagesmith-site dev`, `build`, and `preview` still work with the intended preset.
