---
title: Styling and Runtime
description: How Pagesmith CSS and runtime are integrated without the Vite SSG pipeline
date: 2026-03-20
tags:
  - styling
---

# Styling and Runtime

This example reuses Pagesmith's shared presentation layer for markdown content without adopting the full Vite-based build pipeline.

## Shared Content CSS

The root layout imports Pagesmith's content CSS bundle, which provides styling for prose typography, code blocks, alerts, and tables:

```js title="app/layout.js"
import '@pagesmith/site/css/content'
```

This single import gives you the same code-block frames, syntax highlighting styles, alert callouts, and scrollable tables that the Vite-based examples get.

## Content Runtime

The content runtime wires browser-side behavior for copy buttons, code tabs, and collapsible code sections. It is imported once in the root layout so it runs on every page:

```js title="app/layout.js"
import '@pagesmith/site/runtime/content'
```

## No Chrome Layer

Unlike the blog-site or Vite framework examples, this project does not import Pagesmith's chrome CSS or standalone runtime. The header, footer, sidebar, and theme toggle are all handled by Next.js and custom CSS in `globals.css`. This is the minimal integration surface: just the content presentation layer.
