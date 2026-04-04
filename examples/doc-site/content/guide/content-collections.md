---
title: Content Collections
description: How @pagesmith/docs organizes content
date: 2026-03-18
tags: [content]
series: Getting Started
seriesOrder: 3
---

## Automatic Collection Discovery

Unlike the framework examples that define collections in `content.config.ts`, `@pagesmith/docs` discovers collections automatically from the `content/` directory structure.

Each top-level folder becomes a section with its own sidebar navigation:

| Folder | Route | Navigation |
|--------|-------|------------|
| `content/guide/` | `/guide/*` | Guide section |
| `content/features/` | `/features/*` | Features section |

## Frontmatter Schema

All pages share a common frontmatter schema:

```yaml
---
title: Page Title
description: Optional description
publishedDate: 2026-03-18T00:00:00.000Z
lastUpdatedOn: 2026-03-18T00:00:00.000Z
tags: [tag1, tag2]
draft: false
layout: DocPage
---
```

The `layout` field is optional — pages use the section's default layout, which can be configured in `meta.json5` or the site config.

## Section Metadata

Each section can include a `meta.json5` file for ordering and series grouping:

```json5
{
  displayName: 'Guide',
  orderBy: 'manual',
  series: [
    { slug: 'getting-started', displayName: 'Getting Started', articles: ['installation', 'project-structure'] },
  ],
}
```
