# `@pagesmith/site` Recipes

Step-by-step recipes for common `@pagesmith/site` tasks.

For first-time setup or retrofit work, start with `node_modules/@pagesmith/site/ai-guidelines/setup-site.md` before applying these targeted recipes.

## Recipe: Vite SSG on top of core collections

1. Define collections with `@pagesmith/site`.
2. Add `pagesmithContent` from `@pagesmith/site/vite`.
3. Add `sharedAssetsPlugin()` and `...pagesmithSsg(...)` from `@pagesmith/site/vite`.
4. Export `getRoutes()` and `render()` from the SSR entry.
5. Import runtime CSS/JS from `@pagesmith/site`.

Minimal Vite config:

```ts
import { defineConfig } from 'vite'
import { pagesmithContent, pagesmithSsg, sharedAssetsPlugin } from '@pagesmith/site/vite'
import collections from './content.config'

export default defineConfig({
  plugins: [
    sharedAssetsPlugin(),
    pagesmithContent({ collections }),
    ...pagesmithSsg({ entry: './src/entry-server.tsx', contentDirs: ['./content'] }),
  ],
})
```

## Recipe: Use the Pagesmith JSX runtime

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
```

## Recipe: Add built-in theme and font-size controls

1. Ensure your HTML root keeps the Pagesmith theme classes.
2. Load `@pagesmith/site/runtime/theme` or `@pagesmith/site/runtime/standalone`.
3. Use `[data-ps-*]` hooks for controls when possible.
4. Do not add a parallel localStorage key; reuse `pagesmith-theme`.

## Recipe: Add TOC highlighting

1. Render a TOC container using `[data-ps-toc]`.
2. Ensure the page content has heading `id` attributes.
3. Load `@pagesmith/site/runtime/toc-highlight` or `@pagesmith/site/runtime/standalone`.
4. Keep TOC links pointing to heading anchors.

## Recipe: Select a preset explicitly

Use one of:

- `pagesmith-site dev --preset @pagesmith/docs`
- `PAGESMITH_PRESET=@pagesmith/docs pagesmith-site build`
- `preset: '@pagesmith/docs'` in `pagesmith.config.json5`

Remember that scoped Pagesmith package names are normalized to `/preset`.
