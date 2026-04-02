# @pagesmith/core -- Customization & Advanced Usage

## Custom Markdown Plugins

Add remark/rehype plugins via `MarkdownConfig`:

```ts
type MarkdownConfig = {
  remarkPlugins?: any[]
  rehypePlugins?: any[]
  shiki?: {
    themes: { light: string; dark: string }
    langAlias?: Record<string, string>
    defaultShowLineNumbers?: boolean
  }
}
```

```ts
import remarkToc from 'remark-toc'
import rehypeExternalLinks from 'rehype-external-links'

const config = defineConfig({
  collections: { posts },
  markdown: {
    remarkPlugins: [remarkToc],
    rehypePlugins: [[rehypeExternalLinks, { target: '_blank' }]],
  },
})
```

Plugins are inserted into the unified pipeline after the built-in plugins but before rehype-stringify. The pipeline order is:

```
remark-parse -> remark-gfm -> remark-math -> remark-frontmatter
  -> remark-github-alerts -> remark-smartypants
  -> [your remark plugins]
  -> remark-rehype -> rehype-expressive-code -> rehype-mathjax
  -> rehype-slug -> rehype-autolink-headings
  -> rehype-external-links -> rehype-accessible-emojis
  -> heading extraction
  -> [your rehype plugins]
  -> rehype-stringify
```

## Custom Code Block Themes

```ts
const config = defineConfig({
  collections: { posts },
  markdown: {
    shiki: {
      themes: { light: 'vitesse-light', dark: 'vitesse-dark' },
      langAlias: { 'c++': 'cpp', 'c#': 'csharp' },
      defaultShowLineNumbers: true,
    },
  },
})
```

Themes are passed to Expressive Code. Supports 60+ bundled themes including github-light, github-dark, catppuccin-latte, catppuccin-mocha, dracula, solarized-light, etc.

Code block meta syntax for per-block control (Expressive Code):

````
```js title="app.js" showLineNumbers=false collapse={1-5,12-14} mark={3} ins={4} del={5}
````

## Custom Loaders

Built-in loaders: `'markdown'`, `'json'`, `'json5'`, `'jsonc'`, `'yaml'`, `'toml'`.

To create a custom loader, implement the `Loader` interface:

```ts
interface Loader {
  name: string
  kind: 'markdown' | 'data'
  extensions: string[]
  load(filePath: string): LoaderResult | Promise<LoaderResult>
}

type LoaderResult = {
  data: Record<string, any>
  content?: string  // only for kind: 'markdown'
}
```

Example -- CSV loader:

```ts
import { readFileSync } from 'fs'
import { parse } from 'csv-parse/sync'
import type { Loader } from '@pagesmith/core'

const csvLoader: Loader = {
  name: 'csv',
  kind: 'data',
  extensions: ['.csv'],
  load(filePath) {
    const raw = readFileSync(filePath, 'utf-8')
    const [header, ...rows] = parse(raw)
    return { data: { header, rows } }
  },
}

const data = defineCollection({
  loader: csvLoader,
  directory: 'content/data',
  schema: z.object({
    header: z.array(z.string()),
    rows: z.array(z.array(z.string())),
  }),
})
```

## Custom Validators

Validators run on the raw MDAST (parsed once, shared across validators):

```ts
type ContentValidator = {
  name: string
  validate(ctx: ValidatorContext): ValidationIssue[] | Promise<ValidationIssue[]>
}

type ValidatorContext = {
  filePath: string
  slug: string
  collection: string
  rawContent?: string
  data: Record<string, any>
  mdast?: Root  // from mdast
}

type ValidationIssue = {
  field?: string
  message: string
  severity: 'error' | 'warn'
}
```

Example -- require description length:

```ts
const descriptionValidator: ContentValidator = {
  name: 'description-length',
  validate(ctx) {
    const desc = ctx.data.description
    if (desc && desc.length < 50) {
      return [{ message: 'Description should be at least 50 characters', severity: 'warn' }]
    }
    return []
  },
}

const posts = defineCollection({
  loader: 'markdown',
  directory: 'content/posts',
  schema: BaseFrontmatterSchema,
  validators: [descriptionValidator],
})
```

Built-in validators (link, heading, code-block) run by default on markdown collections. Disable them:

```ts
const posts = defineCollection({
  loader: 'markdown',
  directory: 'content/posts',
  schema: BaseFrontmatterSchema,
  disableBuiltinValidators: true,
  validators: [descriptionValidator],
})
```

## Content Plugins

Plugins add cross-collection remark/rehype transforms and validation:

```ts
type ContentPlugin = {
  name: string
  remarkPlugin?: () => (tree: any) => void
  rehypePlugin?: () => (tree: any) => void
  validate?: (entry: { data: Record<string, any>; content?: string }) => string[]
}
```

```ts
const wordCountPlugin: ContentPlugin = {
  name: 'word-count',
  validate(entry) {
    if (entry.content && entry.content.split(/\s+/).length < 100) {
      return ['Content should be at least 100 words']
    }
    return []
  },
}

const config = defineConfig({
  collections: { posts },
  plugins: [wordCountPlugin],
})
```

## Design Token Overrides

Pagesmith styles use CSS custom properties defined in `tokens.css`. Override them in your own CSS:

```css
:root {
  /* Colors */
  --color-bg: #ffffff;
  --color-text: #1a1a1a;
  --color-accent: #0066cc;
  --color-accent-hover: #0052a3;
  --color-border: #e0e0e0;
  --color-bg-code: #f5f5f5;
  --color-code-text: #333;

  /* Typography */
  --font-sans: 'Inter', system-ui, sans-serif;
  --font-mono: 'Fira Code', monospace;
  --font-size-base: 1.0625rem;

  /* Layout */
  --header-height: 64px;
  --radius-md: 8px;
}
```

Key token groups: `--color-bg*`, `--color-text*`, `--color-accent*`, `--color-border*`, `--color-code-*`, `--font-sans`, `--font-mono`, `--font-size-*`, `--radius-*`, `--shadow-*`, `--transition-*`, `--header-height`.

All color tokens use `light-dark()` by default. To override for light/dark independently:

```css
:root {
  --color-bg: light-dark(#fff, #0a0a0a);
  --color-text: light-dark(#111, #eee);
}
```

## Custom Layouts

Build layouts with the JSX runtime (configure `jsxImportSource: '@pagesmith/core'` in tsconfig):

```tsx
// layouts/Article.tsx
import { HtmlString } from '@pagesmith/core/jsx-runtime'
import type { Heading } from '@pagesmith/core'

type Props = {
  content: string
  headings: Heading[]
  frontmatter: { title: string; date: string }
  cssPath: string
}

export function Article({ content, headings, frontmatter, cssPath }: Props) {
  return (
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>{frontmatter.title}</title>
        <link rel="stylesheet" href={cssPath} />
      </head>
      <body>
        <header>
          <h1>{frontmatter.title}</h1>
          <time>{frontmatter.date}</time>
        </header>
        <nav>
          <ul>
            {headings
              .filter((h) => h.depth === 2)
              .map((h) => (
                <li><a href={`#${h.slug}`}>{h.text}</a></li>
              ))}
          </ul>
        </nav>
        <article innerHTML={new HtmlString(content)} />
      </body>
    </html>
  )
}
```

Key points:
- `h()` returns `HtmlString` -- use `String(result)` or `.value` for the raw HTML
- Use `innerHTML` prop to inject pre-rendered HTML without escaping
- `Fragment` renders children or raw `innerHTML` without a wrapper element
- Function components receive a single props object

