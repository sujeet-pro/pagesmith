---
name: configure-navigation
description: Shape sidebar and top-nav for a Pagesmith docs site using meta.json5 and frontmatter. Use when reorganizing sections, hiding pages, or pinning order.
---

# Configure Navigation

## How Pagesmith Builds Navigation

1. It walks `contentDir`.
2. For each folder, it reads `meta.json5` for `title`, `order`, `collapsed`, `pages`.
3. For each page, it reads `order`, `title`, `description`, `draft` from frontmatter.
4. Folders without `meta.json5` fall back to alphabetical order and derive titles from the folder name.

## `meta.json5` (section)

```json5
{
  $schema: '../../node_modules/@pagesmith/docs/schemas/docs-section-meta.schema.json',
  title: 'Getting Started',
  order: 1,
  collapsed: false,
  pages: [
    'install',
    'quickstart',
    { path: 'first-page', title: 'Your First Page' },
    { label: 'External', href: 'https://example.com' },
  ],
}
```

- String entries are slugs that resolve to files in this folder.
- Objects let you override labels or embed external links.
- Omit `pages` to auto-list everything in the folder.

## Page Frontmatter Knobs

```md
---
title: Your First Page
description: ...
order: 2          # lower appears first
draft: true       # hidden in production builds
---
```

## Top-Level Nav

The root `meta.json5` (at `contentDir/meta.json5`) controls top-level items:

```json5
{
  $schema: './node_modules/@pagesmith/docs/schemas/docs-root-meta.schema.json',
  sections: ['guide', 'reference'],
  header: [
    { label: 'Guides', path: '/guide' },
    { label: 'Reference', path: '/reference' },
    { label: 'GitHub', href: 'https://github.com/...' },
  ],
}
```

## Listing Pages

A section without an `index.md` gets an auto-generated listing page enumerating its children. Override with an explicit `index.md` that renders whatever layout you want.

## Verification

```bash
npx pagesmith-docs dev
```

Changes to `meta.json5` reload the nav live. Run `build` before shipping to catch missing pages or invalid slugs.

## Reference

- `node_modules/@pagesmith/docs/schemas/docs-root-meta.schema.json`
- `node_modules/@pagesmith/docs/schemas/docs-section-meta.schema.json`
- `node_modules/@pagesmith/docs/ai-guidelines/docs-guidelines.md`
