---
title: Layout Overrides
description: Customizing page layouts with JSX components
date: 2026-03-17
tags: [layouts, customization]
series: Customization
seriesOrder: 1
---

## Default Layouts

`@pagesmith/docs` ships with built-in layouts:

- **DocHome** — Landing page with hero section, feature cards, and install command
- **DocPage** — Content page with sidebar, prose area, and TOC aside
- **NotFound** — 404 error page

## Overriding Layouts

Override any layout by adding a JSX file and mapping it in the config:

```json5
{
  theme: {
    layouts: {
      home: './theme/layouts/DocHome.tsx',
      page: './theme/layouts/DocPage.tsx',
    },
  },
}
```

Layout components receive props with the page content, frontmatter, headings, navigation data, and site configuration. They use the `@pagesmith/core` JSX runtime to render HTML:

```tsx title="theme/layouts/DocHome.tsx"
export default function DocHome(props) {
  const { frontmatter, site } = props
  return (
    <main class="doc-home">
      <section class="doc-hero">
        <h1>{frontmatter.hero?.text ?? site.title}</h1>
        <p>{frontmatter.hero?.tagline}</p>
      </section>
    </main>
  )
}
```

Overridden layouts produce output matching the structure built from scratch in the framework examples — the same CSS classes and HTML hierarchy apply.
