---
title: "Markdown Pipeline"
description: "Customize the markdown processing pipeline"
publishedDate: 2026-03-01T00:00:00.000Z
lastUpdatedOn: 2026-03-20T00:00:00.000Z
tags:
  - api
  - markdown
---

# Markdown Pipeline

Pagesmith uses a unified-based markdown pipeline with remark and rehype plugins, powered by Expressive Code for syntax highlighting.

## Processing Chain

```text
remark-parse → remark-gfm → remark-math → remark-frontmatter
→ remark-rehype → rehype-expressive-code → rehype-mathjax
→ rehype-slug → rehype-autolink-headings → rehype-stringify
```

## Syntax Highlighting

Powered by Expressive Code with dual-theme support (light/dark):

```typescript
const config = defineConfig({
  collections: { posts },
  markdown: {
    shiki: {
      themes: {
        light: 'github-light',
        dark: 'github-dark',
      },
    },
  },
})
```

## Code Block Features

Expressive Code provides these features out of the box:

- Syntax highlighting for 100+ languages
- Dual themes with automatic light/dark switching
- File titles and language badges
- Line numbers (shown by default)
- Line highlighting (mark, ins, del)
- Collapsible sections
- Copy button
- Text wrapping
- Terminal and editor frame styles

### Line Highlighting

```js mark={2} ins={3} del={4}
const a = 1
const b = 2  // highlighted
const c = 3  // inserted
const d = 4  // deleted
```

### File Titles

````markdown
```ts title="vite.config.ts"
export default defineConfig({})
```
````
