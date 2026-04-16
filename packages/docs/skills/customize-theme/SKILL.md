---
name: customize-theme
description: Customize the @pagesmith/docs theme — layout overrides, custom components, footer, and search placement — without forking.
---

# Customize The Docs Theme

## What You Can Override

The docs preset layers on top of `@pagesmith/site` and supports overrides at these seams:

- `theme.layouts.*` in `pagesmith.config.json5` — point at your own JSX layout files.
- `theme.components.*` — swap individual components (Header, Footer, Sidebar, TOC, SearchTrigger).
- `footerLinks`, `copyright`, `editLink`, `maintainer` — configured in `pagesmith.config.json5`, no JSX needed for most footers.
- CSS — override `--pagesmith-*` custom properties in your own stylesheet.

## Steps (layout override)

1. Create `theme/DocsLayout.tsx`:

```tsx
import type { DocsLayoutProps } from '@pagesmith/docs'
import { Header, Sidebar, Footer } from '@pagesmith/docs/components'

export default function DocsLayout(props: DocsLayoutProps) {
  return (
    <div class="my-docs">
      <Header {...props.header} />
      <main>
        <Sidebar {...props.sidebar} />
        <article>{props.children}</article>
      </main>
      <Footer {...props.footer} />
    </div>
  )
}
```

2. Point the config at it:

```json5
{
  theme: {
    layouts: {
      docs: './theme/DocsLayout.tsx',
    },
  },
}
```

3. For a custom Footer only, write `theme/Footer.tsx` and set `theme.components.Footer`.

## Rules

- Preserve `data-pagesmith-*` attributes that the runtime scripts hook into (theme toggle, TOC highlight, search trigger).
- Don't reach into `node_modules/@pagesmith/docs/theme/` and edit files there; your overrides live in your project.
- Keep custom layouts minimal — rely on shared components from `@pagesmith/docs/components` and `@pagesmith/site/components` for anything non-trivial.

## Reference

- `node_modules/@pagesmith/docs/REFERENCE.md`
- `node_modules/@pagesmith/docs/ai-guidelines/docs-guidelines.md`
- `node_modules/@pagesmith/docs/ai-guidelines/recipes.md`
