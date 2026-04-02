---
title: "Organizing Content with Series"
description: "Learn how to use meta.json5 series definitions to group related documentation pages into ordered sequences."
publishedDate: 2026-03-20T00:00:00.000Z
lastUpdatedOn: 2026-03-25T00:00:00.000Z
tags:
  - guide
  - content
  - configuration
---

# Organizing Content with Series

As your documentation grows, readers need a clear path through related topics. Series grouping lets you define ordered sequences of pages within a section, giving readers previous/next navigation and a logical reading order.

## What is a Series?

A series is a named, ordered list of articles within a content section. You define series in a `meta.json5` file at the section root. Each series has a slug, display name, and an ordered list of article slugs.

## Defining a Series

Create a `meta.json5` file in your section directory:

```json5
// content/guide/meta.json5
{
  displayName: 'Guide',
  orderBy: 'manual',
  series: [
    {
      slug: 'basics',
      displayName: 'Basics',
      articles: ['getting-started', 'configuration', 'layouts'],
    },
  ],
}
```

This creates a "Basics" series containing three articles in the specified order. The `orderBy: 'manual'` setting tells the listing page to use the series order rather than sorting by date.

## How Navigation Works

When a page belongs to a series, the layout receives a `seriesNav` prop containing:

- The current series metadata (slug, display name, description)
- An ordered list of all articles in the series
- `prev` and `next` links for sequential navigation

This means readers can step through your guide linearly without hunting for the next page.

## Multiple Series

A section can contain multiple series. Articles not assigned to any series appear in an "unsorted" group on the section listing page:

```json5
{
  displayName: 'Guide',
  orderBy: 'manual',
  series: [
    {
      slug: 'basics',
      displayName: 'Basics',
      articles: ['getting-started', 'configuration'],
    },
    {
      slug: 'advanced',
      displayName: 'Advanced',
      articles: ['custom-plugins', 'deployment'],
    },
  ],
}
```

## Tips

- Keep series focused -- three to six articles is a good range.
- Use descriptive series slugs since they may appear in URLs or breadcrumbs.
- The `orderBy` field on the meta file controls section listing order; individual series always use manual order.
