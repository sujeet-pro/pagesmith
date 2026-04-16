---
name: add-loader
description: Implement a custom Pagesmith content loader for a format the built-in loaders do not cover. Use when you need MDX, org-mode, a remote source, or any non-standard loader in your project.
---

# Add a Custom Loader

## When To Use This

`@pagesmith/core` ships loaders for `markdown`, `json`, `json5`, `jsonc`, `yaml`, and `toml`. If your content format is outside that set, implement a loader.

## Steps

1. Implement the `Loader` interface:

```ts
// loaders/mdx-loader.ts
import type { Loader, LoaderResult } from '@pagesmith/core/loaders'
import { readFile } from 'node:fs/promises'

export class MdxLoader implements Loader {
  readonly name = 'mdx'
  readonly extensions = ['.mdx'] as const

  async load(filePath: string): Promise<LoaderResult> {
    const raw = await readFile(filePath, 'utf-8')
    // split frontmatter + body as needed, return plain object + raw body
    return {
      data: { /* ... */ },
      rawContent: raw,
    }
  }
}
```

2. Attach an instance to the collection definition:

```ts
import { defineCollection, z } from '@pagesmith/core'
import { MdxLoader } from './loaders/mdx-loader'

export const pages = defineCollection({
  loader: new MdxLoader(),
  directory: 'content/pages',
  schema: z.object({ title: z.string() }),
})
```

3. If the loader has its own file extensions, you can also pass `include` on the collection to expand the glob:

```ts
defineCollection({
  loader: new MdxLoader(),
  directory: 'content/pages',
  include: ['**/*.mdx'],
  schema,
})
```

4. Add a unit test for the loader under `tests/` or `src/__tests__/` — the `Loader` interface is stable.

## Rules

- Keep loaders pure: no caching, no IO outside the single `load(filePath)` call. Pagesmith already caches in the content store.
- Throw `new LoaderError(...)` with a useful message for parse failures; the store surfaces it with the file path.
- Loaders should return only `{ data, rawContent? }`. Do not run markdown through the loader — `entry.render()` is the right place for that.

## Reference

- `node_modules/@pagesmith/core/REFERENCE.md`
- `node_modules/@pagesmith/core/ai-guidelines/core-guidelines.md`
