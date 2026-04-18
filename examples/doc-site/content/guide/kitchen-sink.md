---
title: "Kitchen Sink"
description: "Single markdown regression page for this docs example."
publishedDate: 2026-03-10
tags: [markdown, regression]
---

# Kitchen Sink

This is the single markdown regression page for the `@pagesmith/docs` example. It exercises alerts, math, GFM, tables, tasks, code fences, typography, and footnotes together so this example has one obvious place to verify markdown rendering.

For how this docs site is wired, use the rest of the [Guide](./installation.md): `pagesmith.config.json5`, `content/`, `meta.json5`, layout overrides, Pagefind, and CLI flows all live there.

> [!NOTE]
> This page intentionally stacks many features. In real docs, prefer focused content and use a page like this only for regression coverage.

## Pipeline snapshot

The `@pagesmith/docs` build uses `@pagesmith/core`'s markdown stack. A simplified mental model:

| Stage     | Role                          |
| --------- | ----------------------------- |
| remark    | Parse Markdown -> mdast       |
| plugins   | GFM, math, alerts, typography |
| rehype    | HTML ast + code chrome, TOC   |
| serialize | HTML string for layouts       |

### Annotated TypeScript (illustrative)

```ts title="pipeline sketch" collapse={1-4} mark={6,10}
// Pseudocode shape - not a file you edit in this example.
import { unified } from "unified";

export function createPipeline(options: Options) {
  return unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkMath)
    .use(...options.remarkPlugins)
    .use(remarkRehype)
    .use(...options.rehypePlugins);
}
```

## Multi-language schema snippets

```ts title="TypeScript"
import { z } from "zod";

const PostSchema = z.object({
  title: z.string(),
  date: z.coerce.date(),
  draft: z.boolean().default(false),
  tags: z.array(z.string()).default([]),
});
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

## Equations

Build-time work for $n$ pages is loosely $O(n \cdot p)$ for plugin count $p$. Display math:

$$
T = t_{\text{init}} + \sum_{i=1}^{n} \left( t_{\text{parse}}^{(i)} + t_{\text{transform}}^{(i)} + t_{\text{render}}^{(i)} \right) + t_{\text{index}}
$$

## GFM mix

| Check         | State |
| ------------- | ----- |
| Tables        | On    |
| MathJax       | On    |
| GitHub alerts | On    |

- [x] remark pipeline
- [x] Built-in code renderer
- [ ] Placeholder unchecked item

Strikethrough: ~~old path~~ current path.

## Code tabs + collapse

```bash title="npm"
npm install @pagesmith/docs
```

```bash title="pnpm"
pnpm add @pagesmith/docs
```

```ts title="widget.ts" collapse={2-4} mark={6}
export type Widget = { id: string };

const cache = new Map<string, Widget>();
const stats = { hits: 0, misses: 0 };

export function getWidget(id: string): Widget | undefined {
  stats.hits++;
  return cache.get(id);
}
```

## Diff fence

```diff
- const port = 3000
+ const port = Number(process.env.PORT) || 3000
```

## Footnotes and links

Bare URL autolink: https://github.com/sujeet-pro/pagesmith

Pagesmith processes Markdown in a unified-style pipeline[^unified].

[^unified]: See https://unifiedjs.com for the broader ecosystem this stack resembles.

## Deployment

Static HTML goes to `outDir` from `pagesmith.config.json5` (this repo points at `../../gh-pages/examples/doc-site` for GitHub Pages). Set `basePath` and `origin` to match where the site is hosted.

> [!IMPORTANT]
> `basePath` must match your host's URL prefix, for example a GitHub Pages project site under `/repo-name`.

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
      - uses: actions/upload-pages-artifact@v5
        with:
          path: gh-pages
      - uses: actions/deploy-pages@v5
```

## Quick reference

| Feature       | Notes                                      |
| ------------- | ------------------------------------------ |
| Bold          | `**text**`                                 |
| Inline math   | `$x$` delimiters                           |
| Display math  | `$$` fences                                |
| Table         | pipe tables                                |
| Task          | `- [ ]` / `- [x]`                          |
| Alert         | `> [!NOTE]` syntax                         |
| Code metadata | `title`, `mark`, `collapse` on fenced code |

---

_This is the only markdown showcase page in this example. The rest of the guide explains the docs workflow itself._
