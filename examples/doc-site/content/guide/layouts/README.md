---
title: "Layouts"
description: "Create and customize page layouts"
publishedDate: 2026-03-10T00:00:00.000Z
lastUpdatedOn: 2026-03-20T00:00:00.000Z
tags:
  - layouts
  - customization
---

# Layouts

Layouts are JSX components that define the HTML structure of your pages. Pagesmith uses server-side JSX rendering — no client-side React required.

## Built-in Layouts

The `@pagesmith/docs` package provides these layouts:

| Layout | Purpose |
|--------|---------|
| `Article` | Full article with TOC sidebar |
| `Blog` | Blog post layout |
| `Home` | Landing page |
| `Listing` | Section index with grouped items |
| `Page` | Generic page |

## Custom Layouts

Create a `.tsx` file in your layouts directory:

```tsx
import { Fragment, h } from '@pagesmith/core/jsx-runtime'

export default function CustomLayout(props) {
  const { content, frontmatter, headings } = props
  return (
    <html lang="en">
      <head>
        <title>{frontmatter.title}</title>
      </head>
      <body>
        <main>
          <Fragment innerHTML={content} />
        </main>
      </body>
    </html>
  )
}
```

## Layout Resolution

Layouts are resolved in this order:

1. Frontmatter `layout` field
2. Folder `meta.json5` default layout
3. Site config default layout
