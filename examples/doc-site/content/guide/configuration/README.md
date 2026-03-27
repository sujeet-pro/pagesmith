---
title: "Configuration"
description: "Configure your Pagesmith site with pagesmith.config.json5"
publishedDate: 2026-03-05T00:00:00.000Z
lastUpdatedOn: 2026-03-20T00:00:00.000Z
tags:
  - configuration
---

# Configuration

Pagesmith uses a `pagesmith.config.json5` file at the root of your project.

## Basic Configuration

```json5
{
  contentDir: "./content",
  layoutsDir: "./layouts",
  publicDir: "./public",
  outDir: "./dist",

  css: {
    entries: ["./styles/main.css"],
    minify: true,
  },

  runtime: {
    entries: ["./runtime/main.ts"],
    target: "browser",
    minify: true,
  },
}
```

## Content Directory

The `contentDir` option specifies where your markdown files live. Defaults to `./content`.

## Layouts

Layouts are JSX components that wrap your content. The `layoutsDir` option tells Pagesmith where to find them.

Each page can specify its layout via frontmatter:

```yaml
---
layout: Article
---
```

## Search

Configure search with the `search` field:

```json5
{
  search: {
    provider: "pagefind",
  },
}
```
