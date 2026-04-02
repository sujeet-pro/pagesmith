---
title: How It Works
description: Template rendering and the partial block pattern
date: 2026-03-10
tags:
  - architecture
  - templates
order: 2
---

## The build flow

The `build.mjs` script follows a linear pipeline. Understanding each stage makes it easy to extend or adapt the example for your own needs.

1. **Register partials** — The layout template is loaded from `templates/layout.hbs` and registered as a named partial. This makes it available to every page template via the `{{#> layout}}` syntax.
2. **Register helpers** — Custom helpers like `formatDate` and `eq` are registered globally so all templates can use them.
3. **Create the content layer** — `createContentLayer(defineConfig({ root, collections }))` scans the `content/` directory, parses frontmatter, validates it against the Zod schemas defined in `content.config.mjs`, and returns a queryable layer object.
4. **Compile templates** — Each `.hbs` file in `templates/` is read and compiled with `Handlebars.compile(source)`. The result is a function that accepts a data object and returns an HTML string.
5. **Render each page** — The build script calls `layer.getCollection('posts')` to retrieve all post entries, then iterates over them, calling `entry.render()` to get the markdown HTML and headings, and passing the combined data to the compiled template function.
6. **Write HTML** — Each rendered string is written to the output directory as an `index.html` file inside a slug-based folder (e.g., `posts/getting-started/index.html`).

## The partial block pattern

Handlebars lacks a built-in layout/inheritance system like Nunjucks or Jinja2, but the **partial block pattern** achieves the same result. In `templates/post.hbs`, the entire template is wrapped in a partial block call:

```handlebars
{{#> layout}}
  {{#*inline "body"}}
    <article>
      <h1>{{title}}</h1>
      <div class="prose">{{{content}}}</div>
    </article>
  {{/inline}}
{{/layout}}
```

Here is what happens at render time:

- `{{#> layout}}...{{/layout}}` invokes the `layout` partial, passing the enclosed block as overridable content.
- `{{#*inline "body"}}...{{/inline}}` defines a named inline partial called `body` within that block scope.
- Inside `templates/layout.hbs`, the placeholder `{{> body}}` renders whichever inline partial the calling template defined.

This is fundamentally different from the EJS example, where the build script wraps the rendered body in the layout programmatically with string interpolation. In Handlebars, the template itself declares its layout relationship — the build script just calls the compiled template and gets a complete HTML document back.

## CSS inlining

Both the EJS and Handlebars examples inline their CSS the same way:

```js
const css = buildCss(getContentCSSPath(), { minify: true })
```

The `buildCss` function reads `@pagesmith/core`'s pre-built content stylesheet, minifies it, and returns a CSS string. This string is passed as a template variable and rendered inside a `<style>` tag using triple-stache syntax (`{{{css}}}`) so Handlebars does not escape the CSS.

## Unescaped HTML with triple-stache

Handlebars escapes all output by default — `{{variable}}` converts `<`, `>`, and `&` into HTML entities. Rendered markdown contains raw HTML tags, so it must use triple-stache: `{{{content}}}`. The same applies to the inlined CSS (`{{{css}}}`) and optional JavaScript (`{{{js}}}`).

## Parent scope access

Inside an `{{#each}}` block, the current context changes to the iterated item. To access variables from the parent scope, use the `../` prefix. For example, in `templates/index.hbs`:

```handlebars
{{#each posts}}
  <a href="{{../basePath}}posts/{{this.slug}}/">{{this.title}}</a>
{{/each}}
```

The `{{../basePath}}` reaches up to the parent context to get the base URL path, while `{{this.slug}}` and `{{this.title}}` reference the current post object.

## Output directory structure

After the build completes, the output looks like this:

```text
dist/
  index.html              # Post listing page
  about/
    index.html            # About page
  posts/
    getting-started/
      index.html          # Individual post
    how-it-works/
      index.html
    content-collections/
      index.html
```

Each page gets its own directory with an `index.html` file, producing clean URLs without file extensions.
