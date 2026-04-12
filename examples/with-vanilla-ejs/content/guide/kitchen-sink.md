---
title: "Kitchen Sink"
description: "Single markdown regression page for this example build."
date: 2026-03-10
tags: [markdown, regression]
series: Markdown Showcase
seriesOrder: 7
---

# Kitchen Sink

This is the single markdown regression page for the EJS example. It gives you one obvious place to verify alerts, math, GFM, code block chrome, and prose styling in the rendered output.

For how this example is wired, use the rest of the guide: content collections, SSG entry, layouts, Vite config, and search integration are documented there.

> [!NOTE]
> This page intentionally stacks many features. In real docs, prefer focused content and use a page like this only for regression coverage.

## GFM mix

| Feature       | Example     |
| ------------- | ----------- |
| Strikethrough | ~~old~~ new |
| Task list     | See below   |

- [x] Task done
- [ ] Task open

## Alerts

> [!TIP]
> Short tip callout.

> [!IMPORTANT]
> Important callout.

> [!WARNING]
> Warning callout.

> [!CAUTION]
> Caution callout.

## Code blocks

Titled frame + line highlight:

```ts title="sample.ts" mark={2}
export function one() {
  return 2
}
```

Collapsed boilerplate:

```ts title="collapsed.ts" collapse={1-3}
keep()
hidden()
hidden()
tail()
```

Tabs (consecutive titled fences):

```ts title="TypeScript"
export type Box = { v: number }
```

```py title="Python"
Box = {"v": 0}
```

Diff-style fence:

```diff
- const port = 3000
+ const port = Number(process.env.PORT) || 3000
```

## Math

Inline $E = mc^2$ and display:

$$
\sum_{i=1}^{n} i = \frac{n(n+1)}{2}
$$

Big-O line in prose: sorting is often $O(n \log n)$ for $n$ keys.

## Quotes and prose

> Outer quote
>
> > Nested level

"It's fine" to rely on smart typography---within prose, not inside `code`.

## Quick reference

| Feature       | Syntax hint |
| ------------- | ----------- |
| Bold          | `**x**` |
| Inline math   | `$x$` |
| Alert         | `> [!NOTE]` |
| Code title    | fenced block with `title="..."` meta |
| Collapse      | fenced block with `collapse={...}` meta |

---

*This is the only markdown showcase page in this example. The rest of the guide explains the implementation.*
