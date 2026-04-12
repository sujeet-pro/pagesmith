---
title: Content Collections
description: How @pagesmith/docs organizes content
publishedDate: 2026-03-18
tags: [content]
series: Getting Started
seriesOrder: 3
---

## Automatic Collection Discovery

Unlike Vite-first framework examples that often pair `@pagesmith/core` with a root `content.config.ts`, `@pagesmith/docs` discovers “collections” implicitly from the docs directory tree. There is no separate collection registration file in this workflow — the filesystem layout is the source of truth, and the docs build maps folders to routes and sidebars. The default convention is `docs/` at the repo root, with `content/` as the fallback when you choose a different explicit setup like this example.

Each top-level folder becomes a section with its own header/sidebar navigation:

| Folder | Route | Navigation |
|--------|-------|------------|
| `content/guide/` | `/guide/*` | Guide section |
| `content/guide/kitchen-sink.md` | `/guide/kitchen-sink` | Single markdown regression page inside the Guide |

Nested markdown files stay in the same top-level section even when their URLs are deeper, and the section sidebar stays flat from the reader's perspective. Files or folders starting with `.` or `_` are ignored during discovery.

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

When a section defines `series`, any pages not referenced by a series remain visible under an automatic `Miscellaneous` group instead of disappearing from the sidebar.
