---
title: Page Frontmatter Reference
description: Complete reference for all frontmatter fields available in Pagesmith content files
---

# Page Frontmatter Reference

Frontmatter is YAML metadata at the top of each markdown file, enclosed in `---` delimiters. Pagesmith uses frontmatter for page titles, descriptions, ordering, draft status, and feature-specific fields like hero sections and blog metadata.

> [!TIP]
> **AI quick-start:** Tell your AI agent "add frontmatter to my page" or "set up a blog post with tags and a cover image" and it will generate the correct fields for your content type.

> [!NOTE]
> For version-matched docs-site frontmatter rules, point the agent at `node_modules/@pagesmith/docs/schemas/docs-page-frontmatter.schema.json` for regular pages and `node_modules/@pagesmith/docs/schemas/docs-home-frontmatter.schema.json` for the home page.

## Frontmatter Format

Frontmatter is written in YAML at the very beginning of a markdown file:

```md title="content/guide/getting-started/README.md"
---
title: Getting Started
description: Learn how to set up your first Pagesmith project
order: 1
---

# Getting Started

Your content here...
```

## Field Reference

### Docs Frontmatter (DocsFrontmatterSchema)

These fields are recognized by `@pagesmith/docs` for documentation sites. The schema uses `.passthrough()`, so additional custom fields are preserved and available in layouts.

| Field | Type | Default | Description |
|---|---|---|---|
| `title` | `string` | Auto-generated from slug | Page title used in `<title>`, sidebar, navigation, and the page heading. If omitted, the title is generated from the content slug using title-case conversion. |
| `description` | `string` | `undefined` | Page description used in the `<meta name="description">` tag and OpenGraph metadata. |
| `navLabel` | `string` | Same as `title` | Override the label shown in the top navigation bar. Useful when the full title is too long for the nav. |
| `sidebarLabel` | `string` | Same as `title` | Override the label shown in the sidebar. Useful for shorter sidebar entries while keeping a descriptive page title. |
| `order` | `number` | `undefined` | Manual sort order within a section. Lower numbers appear first. When not set, pages follow the order defined in the section's `meta.json5` `items` array, or fall back to alphabetical order. |
| `draft` | `boolean` | `false` | Mark a page as a draft. Draft pages are excluded from the build output entirely -- they do not appear in navigation, search, or sitemap. |
| `socialImage` | `string` | Config `theme.socialImage` | Path to a custom Open Graph image for this page. Overrides the site-level default set in `pagesmith.config.json5`. |
| `hero` | `object` | `undefined` | Hero section data for the home page layout. Contains `name`, `text`, `tagline`, `badge`, and `actions`. Only used when the page uses the `home` layout. |
| `features` | `array` | `undefined` | Feature cards for the home page layout. Each entry is an object with `title`, `details`, and optional `icon`. Only used when the page uses the `home` layout. |

#### Hero Object Fields

When using the `home` layout, the `hero` object supports:

| Field | Type | Description |
|---|---|---|
| `hero.name` | `string` | Prominent name/brand text above the heading |
| `hero.text` | `string` | Large h1 heading text in the hero section |
| `hero.tagline` | `string` | Subtitle below the heading |
| `hero.badge` | `string` | Badge text shown above the name |
| `hero.actions` | `array` | Array of `{ text: string, link: string, theme?: 'brand' \| 'alt' }` button links |

#### Features Array Fields

Each entry in the `features` array supports:

| Field | Type | Description |
|---|---|---|
| `title` | `string` | Feature card heading |
| `details` | `string` | Feature card body text |
| `icon` | `string` | Optional icon identifier |

### Base Frontmatter (BaseFrontmatterSchema)

These fields are defined in `@pagesmith/core` and are available when using the content layer directly with `defineCollection`. They form the foundation for blog and project schemas.

| Field | Type | Default | Description |
|---|---|---|---|
| `title` | `string` | *required* | Page title. Required in the base schema (unlike the docs schema where it is optional). |
| `description` | `string` | *required* | Page description. Required in the base schema. |
| `publishedDate` | `date` | *required* | Publication date. Accepts any date string that JavaScript's `Date` constructor can parse (e.g. `2026-01-15`, `January 15, 2026`). The schema uses `z.coerce.date()` for flexible parsing. |
| `lastUpdatedOn` | `date` | `undefined` | Last modification date. Same flexible date parsing as `publishedDate`. |
| `tags` | `string[]` | `[]` | Array of tag strings for categorization and filtering. |
| `draft` | `boolean` | `false` | Mark as draft to exclude from output. |

### Blog Frontmatter (BlogFrontmatterSchema)

Extends `BaseFrontmatterSchema` with blog-specific fields. Use this schema when defining a blog collection with `defineCollection`.

| Field | Type | Default | Description |
|---|---|---|---|
| *All base fields* | | | Inherits all fields from `BaseFrontmatterSchema` above. |
| `category` | `string` | `undefined` | Blog post category for grouping and filtering. |
| `featured` | `boolean` | `undefined` | Flag a post as featured for highlighting in listings. |
| `coverImage` | `string` | `undefined` | Path to a cover image displayed at the top of the post or in listing cards. |

### Project Frontmatter (ProjectFrontmatterSchema)

Extends `BaseFrontmatterSchema` with project-specific fields. Use this schema for portfolio or project showcase collections.

| Field | Type | Default | Description |
|---|---|---|---|
| *All base fields* | | | Inherits all fields from `BaseFrontmatterSchema` above. |
| `gitRepo` | `string` | `undefined` | URL to the project's git repository. Validated as a URL. |
| `links` | `array` | `undefined` | Array of `{ url: string, text: string }` objects for related links (docs, demo, etc.). Both `url` and `text` are required per entry. |

## Common Patterns

### Minimal Docs Page

The simplest frontmatter for a documentation page -- just a title:

```yaml title="Minimal frontmatter"
---
title: Installation
---
```

When even the title is omitted, Pagesmith generates one from the file's directory name using title-case conversion (e.g. `getting-started` becomes "Getting Started").

### Docs Page with Navigation Labels

Override sidebar and nav labels independently from the page title:

```yaml title="Custom navigation labels"
---
title: Configuration Reference for pagesmith.config.json5
navLabel: Configuration
sidebarLabel: Config Reference
description: Complete guide to all configuration options
---
```

### Draft Page

Keep a page in your content directory without publishing it:

```yaml title="Draft page"
---
title: Upcoming Feature
description: Documentation for a feature still in development
draft: true
---
```

### Home Page with Hero and Features

The home page layout reads `hero` and `features` from frontmatter (or from `home.json5` if not present in frontmatter):

```yaml title="Home page frontmatter"
---
title: My Project
description: A modern toolkit for building content sites
hero:
  name: My Project
  text: Build content-driven sites
  tagline: Zero configuration, maximum output
  actions:
    - text: Get Started
      link: /guide/getting-started
      theme: brand
    - text: View on GitHub
      link: https://github.com/my-org/my-project
      theme: alt
features:
  - title: Fast Builds
    details: Parallel page processing and incremental dev server
  - title: Full-Text Search
    details: Built-in Pagefind integration with zero configuration
  - title: Type-Safe Content
    details: Zod schema validation for all frontmatter and data
---
```

### Blog Post

Using `BlogFrontmatterSchema` in a custom collection:

```yaml title="Blog post frontmatter"
---
title: Announcing v1.0
description: Our first stable release is here
publishedDate: 2026-03-01
tags:
  - release
  - announcement
category: releases
featured: true
coverImage: ./cover.png
---
```

### Project Entry

Using `ProjectFrontmatterSchema` in a portfolio collection:

```yaml title="Project frontmatter"
---
title: Pagesmith
description: A filesystem-first content toolkit
publishedDate: 2025-06-01
tags:
  - tooling
  - static-site
gitRepo: https://github.com/user/pagesmith
links:
  - url: https://pagesmith.dev
    text: Documentation
  - url: https://pagesmith.dev/guide/getting-started
    text: Quick Start
---
```

## Schema Usage in Collections

The base, blog, and project schemas are exported from `@pagesmith/core` for use with `defineCollection`:

```ts title="content.config.ts"
import {
  defineCollection,
  defineConfig,
  BaseFrontmatterSchema,
  BlogFrontmatterSchema,
  ProjectFrontmatterSchema,
} from '@pagesmith/core'

const posts = defineCollection({
  loader: 'markdown',
  directory: 'content/posts',
  schema: BlogFrontmatterSchema,
})

const projects = defineCollection({
  loader: 'markdown',
  directory: 'content/projects',
  schema: ProjectFrontmatterSchema,
})

export default defineConfig({
  collections: { posts, projects },
})
```

For docs sites using `@pagesmith/docs`, the `DocsFrontmatterSchema` is applied automatically to all content pages. You do not need to configure it manually.

## Validation Rules

Frontmatter validation happens at different stages depending on the package:

### @pagesmith/docs validation

The docs package applies `DocsFrontmatterSchema` automatically to all content pages. Key rules:

- **All fields are optional.** If `title` is omitted, it is auto-generated from the content slug using title-case conversion.
- **Unknown fields are preserved** via `.passthrough()`.
- **`order` must be a number** if present. String values like `"first"` will fail validation.
- **`draft: true` pages are excluded** from build, navigation, search, and sitemap.

### @pagesmith/core validation

When using `defineCollection` with a custom Zod schema, validation rules depend on your schema:

- **Required fields cause build errors** if missing from frontmatter.
- **Type coercion** works for `z.coerce.date()` (accepts date strings) and `z.coerce.number()`.
- **Default values** from `z.default()` are applied when the field is missing.
- **Strict schemas** (without `.passthrough()`) reject unknown frontmatter fields.

### Content validators (additional checks)

After schema validation, content validators run on the parsed MDAST:

| Validator | Rule |
|---|---|
| Heading validator | Single h1, sequential depth, non-empty text |
| Link validator | No bare URLs, no empty link text, no suspicious protocols |
| Code block validator | Language specified, no unknown aliases |

Disable built-in validators per collection with `disableBuiltinValidators: true`.

## Custom Fields

Both `DocsFrontmatterSchema` and `BaseFrontmatterSchema` use `.passthrough()`, which means any additional YAML fields you add to frontmatter are preserved in the page's `frontmatter` object. Custom layouts can access these fields:

```yaml title="Page with custom fields"
---
title: API Reference
description: Full API documentation
customBadge: beta
showToc: false
---
```

These custom fields are available as `page.frontmatter.customBadge` and `page.frontmatter.showToc` in layout components. No schema changes are needed.
