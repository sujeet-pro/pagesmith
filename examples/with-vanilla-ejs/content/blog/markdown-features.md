---
title: "Markdown Features in Pagesmith"
description: "Explore the full markdown pipeline — syntax highlighting, code tabs, math, and more."
date: 2026-03-10
tags: [markdown, shiki, code]
---

# Markdown Features in Pagesmith

Pagesmith's markdown pipeline is built on unified (remark + rehype) with carefully chosen plugins for technical documentation.

## Syntax highlighting

Code blocks are highlighted with Shiki using dual themes (light and dark). The theme switches automatically with your OS preference.

```js
function greet(name) {
  return `Hello, ${name}!`
}
```

## GFM support

GitHub Flavored Markdown is enabled by default: tables, task lists, strikethrough, and autolinks.

| Feature | Status |
|---------|--------|
| Tables | Supported |
| Task lists | Supported |
| Strikethrough | Supported |

## Heading anchors

Every heading gets an auto-generated ID and an anchor link, making it easy to share deep links to specific sections.
