---
title: Layout Overrides
description: Replace home, page, and 404 layouts with custom TSX components via theme.layouts, props, and section meta assignments.
---

# Layout Overrides

`@pagesmith/docs` ships with three built-in layouts: `home`, `page`, and `notFound`. You can replace any of them with your own TSX components, or register entirely new layouts and assign them to specific sections through `meta.json5`.

## Built-in Layouts

| Name | File | Used For |
|---|---|---|
| `home` | `DocHome.tsx` | The root `content/README.md` landing page. Renders hero, features grid, and body content |
| `page` | `DocPage.tsx` | Every documentation page. Three-column grid with sidebar, content, and table of contents |
| `notFound` | `DocNotFound.tsx` | The 404 page shown when a route does not match any content |

When no overrides are configured, these layouts are used automatically. The `page` layout is the default for all section landing pages and individual pages.

## Overriding via theme.layouts

To replace a built-in layout, add a `theme.layouts` mapping in `pagesmith.config.json5`. Each key is a layout name and each value is a file path (relative to the config file) pointing to a TSX component:

```json5
{
  name: 'My Docs',
  title: 'My Docs',
  theme: {
    layouts: {
      // Replace the home page layout
      home: './theme/layouts/MyHome.tsx',

      // Replace the standard page layout
      page: './theme/layouts/MyPage.tsx',

      // Replace the 404 layout
      notFound: './theme/layouts/My404.tsx',
    },
  },
}
```

The override file is resolved relative to the directory containing `pagesmith.config.json5`. At build time, the file is bundled with Rolldown (supporting TypeScript and JSX) and its default export is used as the layout component.

### Export Resolution

The docs system looks for the layout component in this order:

1. The `default` export
2. A named export matching a known alias (e.g. `DocHome`, `Home` for the `home` layout; `DocPage`, `Page` for the `page` layout; `DocNotFound`, `NotFound` for the `notFound` layout)

For custom layout names (beyond the three built-in ones), the system looks for `default` or an export matching the layout name.

## Layout Component Props

Every layout component receives the same base set of props, with the `page` layout receiving additional navigation-related props.

### Base Props (all layouts)

| Prop | Type | Description |
|---|---|---|
| `content` | `string` | The rendered HTML from the markdown file |
| `frontmatter` | `Record<string, any>` | All frontmatter fields from the markdown file |
| `headings` | `Array<{ depth: number; text: string; slug: string }>` | Extracted headings from the markdown, useful for building a table of contents |
| `slug` | `string` | The content slug (URL path segment, e.g. `"guide/getting-started"`) |
| `site` | `object` | Site-wide configuration and navigation data |

### Site Object

The `site` prop contains:

| Field | Type | Description |
|---|---|---|
| `site.origin` | `string` | The production origin URL |
| `site.basePath` | `string` | The URL base path (empty string if root) |
| `site.name` | `string` | Site name for display |
| `site.title` | `string` | Full site title |
| `site.description` | `string` | Site description |
| `site.language` | `string` | HTML lang attribute value |
| `site.navItems` | `Array<{ label: string; path: string }>` | Header navigation items |
| `site.footerLinks` | `Array<{ label: string; path: string }>` | Footer links |
| `site.search` | `{ enabled: boolean; showImages: boolean; showSubResults: boolean }` | Search configuration |
| `site.analytics` | `{ googleAnalytics?: string }` | Analytics config |
| `site.theme` | `{ lightColor?: string; darkColor?: string }` | Theme colors |

### Page Layout Additional Props

The `page` layout (and any layout used for documentation pages) receives these additional props:

| Prop | Type | Description |
|---|---|---|
| `sidebarSections` | `SidebarSection[]` | Sidebar navigation data for the current section |
| `prev` | `{ title: string; path: string } \| undefined` | Previous page in sidebar order |
| `next` | `{ title: string; path: string } \| undefined` | Next page in sidebar order |

A `SidebarSection` has:

```ts
type SidebarSection = {
  title: string
  slug: string
  collapsed?: boolean
  items: SidebarItem[]
}

type SidebarItem = {
  title: string
  path: string
  children?: SidebarItem[]
}
```

## Creating a Custom Layout

Custom layouts are TSX files that use `@pagesmith/core/jsx-runtime` for server-side JSX rendering. Here is a minimal custom page layout:

```tsx
import { h } from '@pagesmith/core/jsx-runtime'

type Props = {
  content: string
  frontmatter: Record<string, any>
  headings: Array<{ depth: number; text: string; slug: string }>
  slug: string
  site: any
  sidebarSections?: any[]
  prev?: { title: string; path: string }
  next?: { title: string; path: string }
}

export default function MyPage(props: Props) {
  const { content, frontmatter, slug, site, prev, next } = props
  const title = frontmatter.title
    ? `${frontmatter.title} - ${site.title}`
    : site.title

  return (
    <html lang={site.language || 'en'}>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>{title}</title>
        <link rel="stylesheet" href={`${site.basePath}/assets/style.css`} />
      </head>
      <body>
        <header>
          <a href={`${site.basePath}/`}>{site.name}</a>
          <nav>
            {site.navItems?.map((item: any) => (
              <a href={item.path}>{item.label}</a>
            ))}
          </nav>
        </header>
        <main data-pagefind-body="">
          {frontmatter.title ? <h1>{frontmatter.title}</h1> : null}
          <div class="prose" innerHTML={content} />
        </main>
        <footer>
          {prev ? <a href={prev.path}>Previous: {prev.title}</a> : null}
          {next ? <a href={next.path}>Next: {next.title}</a> : null}
        </footer>
      </body>
    </html>
  )
}
```

Key points:

- Import `h` from `@pagesmith/core/jsx-runtime` for JSX support.
- Use `innerHTML={content}` to render the processed markdown HTML. This is a special prop that sets the element's inner HTML without escaping.
- Include `data-pagefind-body=""` on the main content wrapper so Pagefind indexes the page.
- Reference theme assets at `${site.basePath}/assets/style.css` for the bundled theme CSS and `${site.basePath}/assets/main.js` for the theme runtime.
- If search is enabled, include the Pagefind CSS and JS assets from `${site.basePath}/pagefind/`.

## Using meta.json5 for Per-Section Layouts

You can assign different layouts to different sections using the `layout` and `itemLayout` fields in a section's `meta.json5`.

### Section Landing Page Layout

The `layout` field controls which layout is used for the section's `README.md`:

```json5
// content/blog/meta.json5
{
  displayName: 'Blog',
  layout: 'blogHome',
  itemLayout: 'blogPost',
}
```

### Item Layout

The `itemLayout` field controls which layout is used for all non-landing pages in the section.

In the example above, `content/blog/README.md` uses the `blogHome` layout, while all other pages like `content/blog/my-post/README.md` use the `blogPost` layout.

Both `layout` and `itemLayout` default to `"page"` when not specified.

## Registering Additional Layouts

When you reference a layout name in `meta.json5` that is not one of the three built-in names, you must register it in `theme.layouts`:

```json5
// pagesmith.config.json5
{
  theme: {
    layouts: {
      blogHome: './theme/layouts/BlogHome.tsx',
      blogPost: './theme/layouts/BlogPost.tsx',
      changelog: './theme/layouts/Changelog.tsx',
    },
  },
}
```

```json5
// content/blog/meta.json5
{
  displayName: 'Blog',
  layout: 'blogHome',
  itemLayout: 'blogPost',
}
```

```json5
// content/changelog/meta.json5
{
  displayName: 'Changelog',
  layout: 'changelog',
  itemLayout: 'changelog',
}
```

The docs system collects all unique layout names from section metas and resolves them at build time. If a layout name is referenced in a `meta.json5` but not registered in `theme.layouts`, the build will fail with an error.

You do not need to register the built-in layout names (`home`, `page`, `notFound`) unless you want to override them. They always have default implementations.

## Layout Resolution Order

When rendering a page, the layout is chosen as follows:

1. **Home page** (`content/README.md`): always uses the `home` layout.
2. **Section landing page** (e.g. `content/guide/README.md`): uses `layout` from the section `meta.json5`, falling back to `"page"`.
3. **Item page** (e.g. `content/guide/getting-started/README.md`): uses `itemLayout` from the section `meta.json5`, falling back to `"page"`.

For each layout name, the system looks for:

1. A registered override in `theme.layouts`
2. The built-in default (only for `home`, `page`, and `notFound`)

## Example: Custom Home Page

Replace the default landing page with a minimal custom design:

```json5
// pagesmith.config.json5
{
  theme: {
    layouts: {
      home: './theme/MyHome.tsx',
    },
  },
}
```

```tsx
// theme/MyHome.tsx
import { h } from '@pagesmith/core/jsx-runtime'

export default function MyHome({ content, frontmatter, site }: any) {
  return (
    <html lang={site.language || 'en'}>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>{site.title}</title>
        <link rel="stylesheet" href={`${site.basePath}/assets/style.css`} />
      </head>
      <body>
        <main data-pagefind-body="">
          <h1>{frontmatter.title || site.name}</h1>
          <p>{frontmatter.description || site.description}</p>
          {frontmatter.actions?.map((action: any) => (
            <a href={action.link}>{action.text}</a>
          ))}
          {content ? <div class="prose" innerHTML={content} /> : null}
        </main>
      </body>
    </html>
  )
}
```

## Example: Custom Article Layout

Create a specialized layout for blog-style content in a specific section:

```json5
// pagesmith.config.json5
{
  theme: {
    layouts: {
      article: './theme/Article.tsx',
    },
  },
}
```

```json5
// content/blog/meta.json5
{
  displayName: 'Blog',
  itemLayout: 'article',
  orderBy: 'publishedDate',
}
```

```tsx
// theme/Article.tsx
import { h } from '@pagesmith/core/jsx-runtime'

export default function Article({ content, frontmatter, site, prev, next }: any) {
  const title = frontmatter.title
    ? `${frontmatter.title} - ${site.title}`
    : site.title

  return (
    <html lang={site.language || 'en'}>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>{title}</title>
        <link rel="stylesheet" href={`${site.basePath}/assets/style.css`} />
      </head>
      <body>
        <header>
          <a href={`${site.basePath}/`}>{site.name}</a>
        </header>
        <article data-pagefind-body="">
          <h1>{frontmatter.title}</h1>
          {frontmatter.publishedDate ? (
            <time>{frontmatter.publishedDate}</time>
          ) : null}
          {frontmatter.description ? (
            <p class="lead">{frontmatter.description}</p>
          ) : null}
          <div class="prose" innerHTML={content} />
        </article>
        <nav>
          {prev ? <a href={prev.path}>Previous: {prev.title}</a> : null}
          {next ? <a href={next.path}>Next: {next.title}</a> : null}
        </nav>
      </body>
    </html>
  )
}
```

This layout renders blog-style pages with a published date, description lead, and prev/next navigation, while the section landing page continues to use the default `page` layout.
