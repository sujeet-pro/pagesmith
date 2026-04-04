---
title: "Kitchen Sink"
description: "Everything combined -- a comprehensive showcase of all Markdown features working together."
date: 2026-03-10
tags: [markdown, complete]
---

# Kitchen Sink

This page brings together every Markdown feature supported by Pagesmith into a single cohesive document. It serves as both a visual regression test and a practical reference for content authors.

## Project Overview

Pagesmith is a filesystem-first content toolkit for building static sites with **Vite**. It provides a content layer (`@pagesmith/core`) and a documentation framework (`@pagesmith/docs`) that handle everything from Markdown processing to search indexing.

> [!NOTE]
> This page intentionally exercises every feature. In real documentation, you would use these features selectively based on what best serves your readers.

The toolkit supports $n$ content collections, each with its own Zod schema, where $n$ is limited only by your filesystem. Collections are defined in a `content.config.ts` file and exposed as virtual modules during development.

## Getting Started

Install the package using your preferred package manager:

```bash title="npm"
npm install @pagesmith/core
```

```bash title="pnpm"
pnpm add @pagesmith/core
```

```bash title="bun"
bun add @pagesmith/core
```

Then create a configuration file:

```ts title="content.config.ts" mark={4-5}
import { defineCollection, defineCollections, z } from '@pagesmith/core'

export const blog = defineCollection({
  loader: 'markdown',
  directory: './content/blog',
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    date: z.coerce.date(),
    tags: z.array(z.string()).default([]),
  }),
})

export default defineCollections({ blog })
```

> [!TIP]
> Use `z.coerce.date()` instead of `z.date()` for date fields. This lets you write dates as strings in frontmatter (`date: 2026-03-10`) and have them automatically parsed into JavaScript `Date` objects.

## Architecture

The build pipeline processes content through several stages. Given an input of $m$ Markdown files, the total processing time scales as $O(m \cdot p)$, where $p$ is the number of active plugins.

| Stage | Tool | Purpose |
|-------|------|---------|
| Parse | remark | Markdown to AST |
| Transform | remark plugins | GFM, math, alerts |
| Convert | remark-rehype | AST to HTML AST |
| Enhance | rehype plugins | Syntax highlighting, links |
| Serialize | rehype-stringify | HTML AST to string |

### Plugin Pipeline

The full pipeline includes built-in plugins and extension points for custom ones:

```ts title="pipeline.ts" collapse={1-4} mark={12,17}
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'

export function createPipeline(options) {
  const processor = unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkMath)

    // User remark plugins injected here
    .use(...options.remarkPlugins)

    .use(remarkRehype)

    // User rehype plugins injected here
    .use(...options.rehypePlugins)

    .use(rehypeStringify)

  return processor
}
```

## Content Modeling

Define collections with ~~plain JavaScript~~ **Zod schemas** for full type safety. Here is a comparison of schema definitions across languages:

```ts title="TypeScript"
import { z } from '@pagesmith/core'

const PostSchema = z.object({
  title: z.string(),
  date: z.coerce.date(),
  draft: z.boolean().default(false),
  tags: z.array(z.string()).default([]),
})
```

```python title="Python (Pydantic)"
from pydantic import BaseModel
from datetime import date
from typing import List

class Post(BaseModel):
    title: str
    date: date
    draft: bool = False
    tags: List[str] = []
```

```rust title="Rust (serde)"
use serde::Deserialize;
use chrono::NaiveDate;

#[derive(Deserialize)]
struct Post {
    title: String,
    date: NaiveDate,
    #[serde(default)]
    draft: bool,
    #[serde(default)]
    tags: Vec<String>,
}
```

### Validation

Schema validation runs at build time. When a field fails validation, you get a clear error message:

```
Error: Validation failed for content/blog/my-post.md
  - title: Required
  - date: Expected date, received string "not-a-date"
```

> [!WARNING]
> Validation errors halt the build. Fix all schema errors before deploying. Use `draft: true` in frontmatter to exclude work-in-progress pages from the build without deleting them.

## Equations in Practice

Pagesmith's math support handles everything from simple inline expressions to complex display equations.

The **time complexity** of the build is $O(n \log n)$ for $n$ content entries, dominated by the sorting step. Each entry is processed in $O(p)$ time where $p$ is the plugin count, giving a total of $O(np)$ for the processing phase.

The build time $T$ can be modeled as:

$$
T = t_{\text{init}} + \sum_{i=1}^{n} \left( t_{\text{parse}}^{(i)} + t_{\text{transform}}^{(i)} + t_{\text{render}}^{(i)} \right) + t_{\text{index}}
$$

where $t_{\text{init}}$ is the initialization overhead and $t_{\text{index}}$ is the time spent building the search index.

## Checklist

Track the feature status of the content pipeline:

- [x] Markdown parsing with remark
- [x] GFM extensions (tables, tasks, strikethrough)
- [x] Math rendering with MathJax
- [x] GitHub-style alerts
- [x] Syntax highlighting with Expressive Code
- [x] Heading anchors and auto-linking
- [x] Smart typography
- [ ] Mermaid diagram support
- [ ] Custom directive syntax

## Deployment

The build output is a static site that can be hosted anywhere. The default output directory is `gh-pages/`, optimized for GitHub Pages deployment.

> [!IMPORTANT]
> Set the `base` path in your configuration if your site is not served from the root. For a GitHub Pages project site at `username.github.io/my-project`, set `base: '/my-project/'`.

Here is a minimal deployment workflow:

```yaml title=".github/workflows/deploy.yml" collapse={1-8}
name: Deploy
on:
  push:
    branches: [main]
permissions:
  contents: read
  pages: write
  id-token: write
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
      - run: npm run build
      - uses: actions/upload-pages-artifact@v3
        with:
          path: gh-pages
      - uses: actions/deploy-pages@v4
```

## Quick Reference

A summary of the formatting features demonstrated on this page, along with their sources:

| Feature | Syntax | Plugin |
|---------|--------|--------|
| Bold | `**bold**` | built-in |
| Italic | `*italic*` | built-in |
| Strikethrough | `~~text~~` | remark-gfm |
| Inline math | `$E = mc^2$` | remark-math |
| Display math | `$$...$$` | remark-math |
| Table | pipe syntax | remark-gfm |
| Task list | `- [x]` / `- [ ]` | remark-gfm |
| Alert | `> [!TYPE]` | remark-github-alerts |
| Code title | `` ```lang title="..." `` | rehype-expressive-code |
| Line highlight | `` ```lang mark={1-3} `` | rehype-expressive-code |
| Collapse | `` ```lang collapse={1-5} `` | rehype-expressive-code |
| Smart quotes | `"text"` | remark-smartypants |
| Em dash | `---` | remark-smartypants |

---

*That covers every Markdown feature in the Pagesmith pipeline. For details on any specific feature, see the individual feature pages in this section.*
