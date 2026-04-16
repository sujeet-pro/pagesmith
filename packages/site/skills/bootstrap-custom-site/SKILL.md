---
name: bootstrap-custom-site
description: Set up a custom Pagesmith site in a Vite project using @pagesmith/site. Use when you want full control over layouts and rendering but still want Pagesmith's content layer, JSX runtime, CSS bundles, and SSG helpers.
---

# Bootstrap A Custom Pagesmith Site

## When To Use This

Use this when:

- You do **not** want the opinionated docs preset (`@pagesmith/docs`).
- You do want Pagesmith's content layer, JSX server runtime, shared CSS bundles, TOC highlighting, search, and SSG.
- You may bring your own routing, layouts, or framework integration (React, Solid, Svelte, Next.js, vanilla template engine).

If you want docs-out-of-the-box, use `@pagesmith/docs` instead.

## Steps

1. Install:

```bash
npm add @pagesmith/site pagefind
```

2. Add a `pagesmith.config.json5`:

```json5
{
  $schema: './node_modules/@pagesmith/site/schemas/pagesmith-site.schema.json',
  name: 'My Site',
  title: 'My Site',
  description: 'A custom Pagesmith site',
  origin: 'https://example.com',
  contentDir: './content',
  outDir: './dist',
}
```

3. Add a `content.config.ts` with your collections (see the `add-collection` skill).

4. Wire Vite. Prefer the convenience plugin:

```ts
// vite.config.ts
import { defineConfig } from 'vite'
import { pagesmithSite } from '@pagesmith/site/vite'
import collections from './content.config'

export default defineConfig({
  plugins: [pagesmithSite({ collections })],
})
```

`pagesmithSite()` wires `pagesmithContent`, `pagesmithSsg`, and `sharedAssetsPlugin` with sensible defaults. For full control, compose them manually — see the "Compose manually" section below.

5. Add entry + server bundles following one of the `examples/with-*` templates that ships with this repo.

6. Scripts:

```json
{
  "scripts": {
    "dev": "pagesmith-site dev",
    "build": "pagesmith-site build",
    "preview": "pagesmith-site preview"
  }
}
```

## Compose manually

If you need edge cases the convenience plugin doesn't cover:

```ts
import { defineConfig } from 'vite'
import { pagesmithContent } from '@pagesmith/core/vite'
import { pagesmithSsg, sharedAssetsPlugin } from '@pagesmith/site/vite'
import collections from './content.config'

export default defineConfig({
  plugins: [
    pagesmithContent({ collections }),
    pagesmithSsg({ routes: ['/', '/about'] }),
    sharedAssetsPlugin(),
  ],
})
```

## Reference

- `node_modules/@pagesmith/site/REFERENCE.md`
- `node_modules/@pagesmith/site/ai-guidelines/setup-site.md`
- `node_modules/@pagesmith/site/ai-guidelines/usage.md`
- `node_modules/@pagesmith/site/ai-guidelines/recipes.md`
