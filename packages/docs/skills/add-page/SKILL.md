---
name: add-page
description: Add a new page to a Pagesmith docs site with correct frontmatter and navigation placement. Use when authoring a new guide, reference, or home page.
---

# Add A Docs Page

## File Location

- Home page: `content/home.md` (or `content/home.json5` if you prefer structured content).
- Top-level guides/reference: `content/guide/<slug>.md` or `content/reference/<slug>.md`.
- Series pages: `content/guide/<series>/<slug>.md`. A series is a folder with a `meta.json5`.

## Frontmatter (guide/reference page)

```md
---
title: Add A Page
description: Short summary used for cards, listings, and meta tags.
order: 3
---

# Heading

Body markdown...
```

Required fields: `title`, `description`. Optional: `order`, `draft`, `tags`, `lastUpdatedOn`.

The JSON Schema for this frontmatter is at `node_modules/@pagesmith/docs/schemas/docs-page-frontmatter.schema.json` — point your editor at it via `$schema`.

## Navigation

- Pagesmith derives navigation from the folder structure and `meta.json5` files.
- `meta.json5` in a section controls title, order, and which pages show up in the sidebar:

```json5
{
  title: 'Getting Started',
  order: 1,
  pages: ['install', 'quickstart', 'first-page'],
}
```

If you omit `pages`, Pagesmith falls back to alphabetical + frontmatter `order`.

## Listing Pages

A section without an explicit page for its folder gets an auto-generated listing page that enumerates its children. Override by placing `index.md` (or `README.md`) inside the section folder.

## Verify

1. `npx pagesmith-docs dev` and open the new URL.
2. `npx pagesmith-docs build` to confirm no schema errors block the build.

## Reference

- `node_modules/@pagesmith/docs/REFERENCE.md`
- `node_modules/@pagesmith/docs/schemas/docs-page-frontmatter.schema.json`
- `node_modules/@pagesmith/docs/schemas/docs-section-meta.schema.json`
- `node_modules/@pagesmith/docs/ai-guidelines/docs-guidelines.md`
