# @pagesmith/core Migration Notes

Use this file when upgrading an existing Pagesmith integration to the current three-package architecture.

## Core Boundary

`@pagesmith/core` is now the headless content layer.

Keep these in core:

- collections
- schemas
- loaders
- validation
- markdown rendering
- `pagesmithContent`

Move these to `@pagesmith/site`:

- `pagesmithSsg`
- `sharedAssetsPlugin`
- `prerenderRoutes`
- `SsgRenderConfig`
- JSX runtime imports
- CSS bundle imports
- runtime JS imports
- `ssg-utils`

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

```tsx
import { Fragment } from '@pagesmith/core/jsx-runtime'
```

After:

```tsx
import { Fragment } from '@pagesmith/site/jsx-runtime'
```

## Verification

1. Re-run typechecking.
2. Verify core imports only cover the content layer.
3. Verify site imports cover JSX, CSS/runtime, and SSG.
4. Verify `pagesmithContent` still comes from `@pagesmith/core/vite`.
