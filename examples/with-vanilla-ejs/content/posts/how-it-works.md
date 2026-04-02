---
title: How It Works
description: The build pipeline and template rendering
date: 2026-03-10
tags:
  - architecture
  - templates
order: 2
---

# How the Build Pipeline Works

The `build.mjs` script in this example is a self-contained static site generator in about 120 lines. Understanding its flow explains why you might choose this approach over a framework-based setup.

## The build flow

The script follows a linear pipeline:

1. **Create the content layer** — `createContentLayer(defineConfig({ collections, root }))` initializes the content system with your collection definitions and tells it where to find the markdown files.
2. **Load collections** — `layer.getCollection('posts')` reads every markdown file in `content/posts/`, parses frontmatter, validates it against the Zod schema, and returns an array of `ContentEntry` objects.
3. **Render markdown** — For each entry, `post.render()` processes the markdown through @pagesmith/core's pipeline and returns `{ html, headings }`. The `html` is the fully processed markdown content. The `headings` array contains extracted heading elements — useful for generating a table of contents.
4. **Render templates** — The rendered HTML and entry metadata are passed into EJS templates. A `renderWithLayout` helper renders the page body first, then wraps it in the shared layout template.
5. **Write HTML** — The final HTML string is written to the output directory as static files.

## No SSR, no hydration

This is pure build-time rendering. There is no server-side rendering step at request time, no client-side framework to hydrate, and no JavaScript bundle to ship (beyond the optional copy-to-clipboard script for code blocks). The browser receives plain HTML and CSS.

This contrasts with the `with-react` or `with-solid` examples, which use Vite's SSR capabilities to render components on the server and can optionally hydrate them on the client. Here, EJS runs once at build time and produces final HTML — there is nothing to hydrate.

## The layout wrapping pattern

The `renderWithLayout` function in `build.mjs` implements a two-pass rendering approach:

```js
function renderWithLayout(body, vars) {
  const layout = loadTemplate('layout')
  return ejs.render(layout, { ...vars, body })
}
```

First, the page-specific template (post, index, or about) is rendered to produce the page body. Then that body string is injected into the layout template, which provides the `<html>`, `<head>`, and navigation wrapper. This gives every page a consistent shell without duplicating markup.

## CSS and JS inlining

The build script inlines both CSS and JavaScript directly into each HTML page:

- **CSS** — `buildCss(getContentCSSPath(), { minify: true })` reads @pagesmith/core's content stylesheet and minifies it with LightningCSS. The result is placed in a `<style>` tag in the layout template.
- **JS** — `getContentJS()` returns a small script that enables copy-to-clipboard on fenced code blocks. It is placed in a `<script>` tag.

Inlining eliminates extra network requests and simplifies deployment — each HTML file is fully self-contained.

## Output structure

The build produces a flat directory tree:

```
dist/
  index.html              # Post listing page
  about/index.html        # About page (from content/pages/about.md)
  posts/getting-started/index.html
  posts/how-it-works/index.html
  posts/content-collections/index.html
```

Each post gets a clean URL path derived from its filename slug. This structure works with any static file server — GitHub Pages, Netlify, Cloudflare Pages, or a simple `npx serve dist`.

## Why choose this approach

Use the vanilla EJS pattern when you want full control over every aspect of the build, need no client-side interactivity, and prefer to keep dependencies minimal. The trade-off is that you write more build script code yourself — but that code is simple, explicit, and easy to debug.
