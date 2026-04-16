---
title: "Kitchen Sink"
description: "A single page to verify shared markdown and code-block behavior in the Next.js example."
date: 2026-04-12
tags: [markdown, code-blocks, regression]
---

# Kitchen Sink

This page intentionally stacks multiple markdown features in one place so you can verify the rendered output inside a Next.js route.

> [!NOTE]
> The surrounding layout is custom Next.js UI. The `.prose` content area, code-block chrome, and copy/tab behavior all come from Pagesmith.

## GFM mix

| Feature | Example |
| --- | --- |
| Strikethrough | ~~old~~ new |
| Task list | See below |
| Table | This one |

- [x] Task done
- [ ] Task open

## Alerts

> [!TIP]
> Use a root-mounted runtime component when you want copy buttons and tabs to work across every route.

> [!IMPORTANT]
> This app keeps content loading, markdown rendering, and shared presentation/runtime behavior on `@pagesmith/site` while Next.js continues to own routing and layout.

> [!WARNING]
> Keep the Next.js layout and routing logic separate from the Pagesmith content layer so the example stays clear about ownership.

> [!CAUTION]
> If you remove the shared Pagesmith content CSS or runtime mount, the HTML still renders, but code tabs, copy buttons, and markdown presentation will drift from the documented baseline.

## Code blocks

Highlighted line and collapsed boilerplate:

```ts title="server.ts" showLineNumbers mark={3} collapse={1-2}
import { createContentLayer } from '@pagesmith/site'
import collections from '../content.config.js'

const layer = createContentLayer({ collections })
const post = await layer.getEntry('posts', 'hello-pagesmith')
```

Tabs from consecutive titled fences:

```ts title="content-loader.ts"
export async function getAllPosts() {
  return layer.getCollection('posts')
}
```

```tsx title="page.tsx"
export default function Page({ html }) {
  return <div className="prose" dangerouslySetInnerHTML={{ __html: html }} />
}
```

Diff-style rendering:

```diff title="route.patch"
- import { processMarkdown } from '@pagesmith/site'
+ const rendered = await entry.render()
```

## Math

Inline math works too: $E = mc^2$.

$$
\sum_{i=1}^{n} i = \frac{n(n+1)}{2}
$$

## Quotes and prose

> Outer quote
>
> > Nested quote

"Smart quotes" and ellipses... show up in prose, but not inside `code`.

## Quick reference

| Feature | Syntax hint |
| --- | --- |
| Alert | `> [!NOTE]` |
| Code title | fenced block with `title="..."` meta |
| Collapse | fenced block with `collapse={...}` meta |
| Tabs | consecutive titled fenced code blocks |

## Footnotes

Pagesmith keeps footnotes working across the framework-hosted example too[^next-kitchen-sink].

[^next-kitchen-sink]: This is a lightweight regression check for the shared markdown pipeline inside a custom Next.js shell.
