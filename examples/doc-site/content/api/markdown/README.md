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

Pagesmith uses a unified-based markdown pipeline with remark and rehype plugins.

## Processing Chain

```text
remark-parse → remark-gfm → remark-math → remark-frontmatter
→ remark-rehype → rehype-mathjax → rehype-slug
→ rehype-autolink-headings → @shikijs/rehype
→ rehype-code-tabs → rehype-stringify
```

## Syntax Highlighting

Powered by Shiki with dual-theme support (light/dark):

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

### Tabbed Code Blocks

Consecutive fenced blocks are merged into tabs:

~~~markdown
```js
console.log('JavaScript')
```

```python
print('Python')
```
~~~

### Line Highlighting

```js mark={2} ins={3} del={4}
const a = 1
const b = 2  // highlighted
const c = 3  // inserted
const d = 4  // deleted
```
