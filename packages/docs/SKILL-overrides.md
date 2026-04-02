# @pagesmith/docs Layout Overrides

Customize the default theme by providing your own layout components. Layouts are TSX files that use `@pagesmith/core/jsx-runtime` and export a default function.

## Enabling Layout Overrides

Add `theme.layouts` to `pagesmith.config.json5`. Each key maps a layout name to a file path relative to the project root:

```json5
{
  name: 'My Docs',
  title: 'My Docs',
  description: 'My documentation site',
  origin: 'https://example.com',
  theme: {
    layouts: {
      home: './theme/layouts/DocHome.tsx',
      page: './theme/layouts/DocPage.tsx',
      notFound: './theme/layouts/NotFound.tsx',
    },
  },
}
```

Only override the layouts you need. Unspecified layouts fall back to the built-in defaults.

## Available Layouts

| Key | Purpose | Default component |
|---|---|---|
| `home` | Root `content/README.md` landing page | `DocHome` |
| `page` | All content pages (guide, reference, etc.) | `DocPage` |
| `notFound` | 404 page | `DocNotFound` |

Section `meta.json5` files can also reference layout names via `layout` (section index) and `itemLayout` (section items). These names are resolved from the same `theme.layouts` registry.

## Layout Props

Every layout receives a props object. The base fields shared by all layouts:

```ts
type BaseLayoutProps = {
  content: string                          // Rendered HTML from markdown
  frontmatter: Record<string, any>         // Parsed YAML frontmatter
  headings: Array<{                        // Extracted headings for TOC
    depth: number                          //   heading level (1-6)
    text: string                           //   heading text
    slug: string                           //   anchor id
  }>
  slug: string                             // Current page URL path
  site: {                                  // Resolved site config
    name: string
    title: string
    description: string
    basePath?: string
    origin: string
    language?: string
    navItems?: Array<{ label: string; path: string }>
    footerLinks?: Array<{ label: string; path: string }>
    search?: { enabled?: boolean; showImages?: boolean; showSubResults?: boolean }
    theme?: { lightColor?: string; darkColor?: string }
    copyright?: { holder: string; startYear: number }
  }
}
```

### DocPage additional props

```ts
type DocPageProps = BaseLayoutProps & {
  sidebarSections?: Array<{                // Sidebar navigation tree
    title: string
    slug: string
    items: Array<{
      title: string
      path: string
      children?: Array<{ title: string; path: string }>
    }>
  }>
  prev?: { title: string; path: string }   // Previous page link
  next?: { title: string; path: string }   // Next page link
  pages?: Array<any>                       // All pages in current section
}
```

### DocHome additional props

The home layout receives `BaseLayoutProps`. Hero, features, install, and packages data come from `frontmatter` (see SKILL.md for home page frontmatter fields).

## Creating a Layout

Layout files are TSX modules using the Pagesmith JSX runtime. Export a default function:

```tsx
// theme/layouts/DocPage.tsx
import { h } from '@pagesmith/core/jsx-runtime'

type Props = {
  content: string
  frontmatter: Record<string, any>
  headings: Array<{ depth: number; text: string; slug: string }>
  slug: string
  site: any
  sidebarSections?: Array<any>
  prev?: { title: string; path: string }
  next?: { title: string; path: string }
}

function assetPath(site: Props['site'], path: string): string {
  const base = site.basePath && site.basePath !== '/' ? site.basePath.replace(/\/+$/, '') : ''
  return base ? `${base}${path}` : path
}

export default function DocPage({ content, frontmatter, headings, slug, site, prev, next }: Props) {
  const title = frontmatter.title ? `${frontmatter.title} - ${site.title}` : site.title
  const lightColor = site.theme?.lightColor || '#f8fafc'
  const darkColor = site.theme?.darkColor || '#020617'

  return (
    <html lang={site.language || 'en'}>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="color-scheme" content="light dark" />
        <title>{title}</title>
        <meta name="description" content={frontmatter.description || site.description} />
        <meta name="theme-color" content={lightColor} media="(prefers-color-scheme: light)" />
        <meta name="theme-color" content={darkColor} media="(prefers-color-scheme: dark)" />
        <link rel="stylesheet" href={assetPath(site, '/assets/style.css')} />
      </head>
      <body>
        <header>
          <a href={site.basePath ? `${site.basePath}/` : '/'}>{site.name}</a>
          {site.navItems?.map((item: any) => (
            <a href={item.path}>{item.label}</a>
          ))}
        </header>
        <main data-pagefind-body="">
          {frontmatter.title ? <h1>{frontmatter.title}</h1> : null}
          <div class="prose" innerHTML={content} />
          {prev || next ? (
            <nav>
              {prev ? <a href={prev.path}>Previous: {prev.title}</a> : null}
              {next ? <a href={next.path}>Next: {next.title}</a> : null}
            </nav>
          ) : null}
        </main>
        <script src={assetPath(site, '/assets/main.js')} defer />
      </body>
    </html>
  )
}
```

### Key points

- Import `h` from `@pagesmith/core/jsx-runtime` -- this is the JSX factory.
- Use `innerHTML={content}` to inject rendered markdown HTML.
- Include the bundled stylesheet at `/assets/style.css` and runtime at `/assets/main.js` to keep default styling and behavior (sidebar toggle, search modal, TOC tracking).
- Add `data-pagefind-body=""` to the main content element for search indexing.
- The `class="prose"` wrapper applies default content typography styles.
- Export names are resolved in order: `default`, then the layout-specific name (`DocPage`, `DocHome`, `DocNotFound`).

## CSS Custom Properties

The default theme uses CSS custom properties you can override in your own stylesheet or inline styles. Key tokens:

```css
:root {
  /* Colors */
  --color-bg: #ffffff;
  --color-text: #1e293b;
  --color-brand: #3b82f6;
  --color-border: #e2e8f0;

  /* Fonts */
  --font-family: 'Open Sans', sans-serif;
  --font-mono: 'JetBrains Mono', monospace;

  /* Layout */
  --sidebar-width: 260px;
  --header-height: 56px;
  --content-max-width: 768px;
}
```

Dark mode tokens are applied via `@media (prefers-color-scheme: dark)`.

## Theme Colors

Set `theme.lightColor` and `theme.darkColor` in config to control the `<meta name="theme-color">` tag (affects browser chrome on mobile):

```json5
{
  theme: {
    lightColor: '#ffffff',
    darkColor: '#0f172a',
  },
}
```

These values are passed to layouts via `site.theme.lightColor` and `site.theme.darkColor`. The defaults are `#f8fafc` (light) and `#020617` (dark).

## Search in Custom Layouts

If you override a layout and want search to work:

1. Include the Pagefind CSS and JS in `<head>`:
   ```tsx
   <link rel="stylesheet" href={assetPath(site, '/pagefind/pagefind-ui.css')} />
   <script src={assetPath(site, '/pagefind/pagefind-ui.js')} defer />
   ```

2. Add a search trigger button with `data-search-trigger=""`:
   ```tsx
   <button type="button" data-search-trigger="" aria-label="Search">Search</button>
   ```

3. Add the search modal dialog:
   ```tsx
   <dialog class="doc-search-modal" id="search-modal" aria-label="Search documentation">
     <div class="doc-search-modal-inner">
       <div class="doc-search-modal-header">
         <span class="doc-search-modal-title">Search</span>
         <button type="button" data-search-close="" aria-label="Close search">X</button>
       </div>
       <div class="doc-search-modal-body" data-pagefind-search="" />
     </div>
   </dialog>
   ```

4. Include the bundled runtime script (`/assets/main.js`) which handles search modal open/close and keyboard shortcuts.
