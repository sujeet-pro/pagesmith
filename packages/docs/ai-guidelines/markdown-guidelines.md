# @pagesmith/docs Markdown Guidelines

Supported markdown and HTML authoring rules for `@pagesmith/docs`. This file covers the stock markdown features, docs-specific link and asset transforms, code block syntax, image embedding patterns, and docs frontmatter that work without custom runtime code.

`@pagesmith/docs` inherits the shared markdown pipeline from `@pagesmith/core`, then adds docs-specific link and asset transforms plus docs frontmatter conventions. The `pagesmith.config.json5` markdown field is intentionally JSON-safe; if a syntax or renderer is not documented here, treat it as unsupported unless the project intentionally drops to lower-level `@pagesmith/core` APIs or a custom integration.

## Pipeline Order

```
remark-parse → remark-gfm → remark-frontmatter
  → remark-github-alerts → remark-smartypants
  → remark-math (when `markdown.math` is `true` or `'auto'` detects math markers)
  → [custom remark plugins in lower-level integrations] → lang-alias transform → remark-rehype
  → rehype-mathjax (when math is enabled, before the built-in code renderer)
  → applyPagesmithCodeRenderer (dual themes, line numbers, titles, copy, collapse, mark/ins/del)
  → rehype-code-tabs → rehype-scrollable-tables
  → rehype-slug → rehype-autolink-headings
  → rehype-external-links → rehype-accessible-emojis → rehype-local-images
  → heading extraction → docs link/asset transforms → rehype-stringify
```

## GitHub Flavored Markdown (remark-gfm)

GFM adds tables, strikethrough, task lists, autolinks, and footnotes.

### Tables

```md
| Left | Center | Right |
|:-----|:------:|------:|
| L    |   C    |     R |
| data |  data  |  data |
```

Column alignment is controlled by colons in the separator row: `:---` for left, `:---:` for center, `---:` for right.

Markdown tables are automatically wrapped for horizontal scrolling by `rehype-scrollable-tables`, so wide tables stay usable on small screens.

### Strikethrough

```md
~~deleted text~~
```

### Task Lists

```md
- [x] Completed task
- [ ] Pending task
- [ ] Another pending task
```

### Autolinks

Bare URLs are automatically converted to clickable links:

```md
Visit https://pagesmith.dev for more info.
```

### Footnotes

```md
Content with a footnote[^1] and another[^note].

[^1]: This is the footnote content.
[^note]: Footnotes can use any identifier.
```

## GitHub Alerts (remark-github-alerts)

Five alert types using GitHub's blockquote syntax:

```md
> [!NOTE]
> Informational note.

> [!TIP]
> Helpful tip.

> [!IMPORTANT]
> Important information.

> [!WARNING]
> Warning message.

> [!CAUTION]
> Cautionary message.
```

Alerts render as styled callout boxes with an icon and colored left border. The syntax is compatible with GitHub's own rendering.

## Math (remark-math + rehype-mathjax)

Use `$` for inline math and `$$` for display (block) math. Rendered to SVG via MathJax.

Inline: `$E = mc^2$`

Block:

```md
$$
\int_0^\infty e^{-x^2} dx = \frac{\sqrt{\pi}}{2}
$$
```

Note: The `$` delimiters must not have spaces immediately inside them for inline math. `$x$` works, `$ x $` does not.

## Smart Typography (remark-smartypants)

ASCII typography is automatically converted to proper typographic characters. Code blocks and inline code are not affected.


| Input     | Output            | Description                                   |
| --------- | ----------------- | --------------------------------------------- |
| `"hello"` | \u201chello\u201d | Straight double quotes to curly double quotes |
| `'hello'` | \u2018hello\u2019 | Straight single quotes to curly single quotes |
| `--`      | \u2013            | Two hyphens to en dash                        |
| `---`     | \u2014            | Three hyphens to em dash                      |
| `...`     | \u2026            | Three dots to ellipsis                        |


## External Links (rehype-external-links)

Only absolute URLs starting with `http://` or `https://` get the external link treatment: `target="_blank"` and `rel="noopener noreferrer"` are added automatically.

Relative links (`/guide/getting-started`, `../about`, `#section`) stay in the same tab and are not modified.

```md
[GitHub](https://github.com)           <!-- opens in new tab -->
[Internal page](/guide/getting-started) <!-- stays in same tab -->
[Anchor link](#section)                 <!-- stays in same tab -->
```

## Accessible Emojis (rehype-accessible-emojis)

Unicode emoji characters in prose are automatically wrapped in accessible markup. No special syntax is needed -- just use emoji characters directly.

```md
Great job! 🎉
```

Renders as:

```html
Great job! <span role="img" aria-label="party popper">🎉</span>
```

The `role="img"` and `aria-label` attributes ensure screen readers announce the emoji's meaning.

## Local Images (rehype-local-images)

Stock `@pagesmith/docs` automatically provides the source path that `rehype-local-images` needs, so relative local images inherit intrinsic dimensions during render. Relative JPEG images can also render as a `<picture>` with AVIF and WebP fallbacks before the docs asset pass rewrites the published URLs under `/assets/...`. Resolution stays inside the configured docs `contentDir`.

```md
![Hero](./hero.jpg)
```

## Heading Links (rehype-slug + rehype-autolink-headings)

All headings automatically receive:

1. A URL-safe `id` attribute generated by `rehype-slug`
2. The heading text wrapped in an anchor link (behavior: `wrap`) by `rehype-autolink-headings`

Slug generation algorithm:

- Convert to lowercase
- Replace spaces with hyphens
- Strip special characters (punctuation, symbols)
- Collapse multiple hyphens

Examples:


| Heading                 | Generated slug     |
| ----------------------- | ------------------ |
| `## Getting Started`    | `getting-started`  |
| `## What's New in v2?`  | `whats-new-in-v2`  |
| `## API Reference (v3)` | `api-reference-v3` |
| `## CSS & JavaScript`   | `css--javascript`  |


Rendered HTML:

```html
<h2 id="getting-started"><a href="#getting-started">Getting Started</a></h2>
```

## Docs Link And Asset Transforms

Stock `@pagesmith/docs` adds a docs-specific rewrite pass after heading extraction:

- Relative markdown links between pages are rewritten to site-relative routes under `basePath`.
- Relative image refs in markdown or raw HTML keep the intrinsic dimensions from the shared local-image pass, then publish under `/assets/<content-relative-path>`, so sibling assets keep their folder structure instead of flattening to basenames.
- Relative HTML asset refs for `<img>`, `<source srcset>`, and `<a href="./image.svg">` follow the same published asset path rules.
- Markdown images ending in `.inline.svg` inline the SVG into the HTML only when the file stays inside the current page directory subtree. Otherwise they fall back to a normal published asset URL.
- Image file names containing `.invert.` receive an `invert-on-dark` class for dark-theme inversion.

Examples:

```md
[Architecture](../reference/architecture/README.md)
![Flow](./diagrams/request-flow.svg)
![Inline logo](./diagrams/logo.inline.svg)
```

## Built-in Code Renderer Features

Syntax highlighting is handled by the built-in Pagesmith renderer on top of Shiki with dual themes. Shared code block chrome ships in the CSS bundles, while syntax token colors and copy/collapse behavior are injected inline per rendered document.

### Dual Themes

Automatic light/dark switching via `prefers-color-scheme`. Defaults: `github-light` / `github-dark`.

Configure:

```ts
markdown: {
  shiki: {
    themes: { light: 'github-light', dark: 'github-dark' },
  },
}
```

### Code Block Meta Syntax

All features are enabled via meta strings after the language identifier:


| Meta                | Example                                   | Description                                      |
| ------------------- | ----------------------------------------- | ------------------------------------------------ |
| `title="..."`       | ````js title="app.js"`                    | File title above the code block                  |
| `showLineNumbers`   | ````js showLineNumbers`                   | Show line numbers                                |
| `startLineNumber=N` | ````js showLineNumbers startLineNumber=5` | Start line numbering at N                        |
| `mark={lines}`      | ````js mark={3,5-7}`                      | Highlight lines                                  |
| `ins={lines}`       | ````js ins={4}`                           | Mark lines as inserted (green)                   |
| `del={lines}`       | ````js del={5}`                           | Mark lines as deleted (red)                      |
| `collapse={lines}`  | ````js collapse={1-5}`                    | Collapse lines by default                        |
| `wrap`              | ````js wrap`                              | Enable text wrapping                             |
| `frame="..."`       | ````js frame="none"`                      | Frame style: `none`, `code`, `terminal`, `lines` |


### Combined Example

```md
```ts title="server.ts" showLineNumbers mark={3} ins={7-8} collapse={1-2}
import express from 'express'
import cors from 'cors'
const app = express()  // highlighted
app.use(cors())

// New routes added
app.get('/api', handler)
app.post('/api', handler)
```

```

### Automatic Features (no meta needed)

- **Copy button** -- on every code block, progressively enhanced by the shared Pagesmith content runtime
- **Language badge** -- automatic language indicator
- **Syntax highlighting** -- dual theme support

### Code Tabs

Consecutive titled code blocks are grouped into tabs automatically.

````md
```ts title="TypeScript"
const greeting: string = 'hello'
```

```js title="JavaScript"
const greeting = 'hello'
```
````

Tabs are created by `rehype-code-tabs` after the built-in code renderer, so each block keeps its own highlighting and chrome while rendering as a single tabbed group.

### Language Aliases

Pagesmith includes these default aliases before any user overrides:

| Alias | Highlighted As |
| ----- | -------------- |
| `dot` | `text` |
| `mermaid` | `text` |
| `plantuml` | `text` |
| `excalidraw` | `json` |
| `drawio` | `xml` |
| `proto` | `protobuf` |
| `ejs` | `html` |
| `hbs` | `handlebars` |

Configure custom language aliases:

```ts
markdown: {
  shiki: {
    langAlias: { 'my-lang': 'typescript' },
  },
}
```

### Global Line Numbers

Enable line numbers on all code blocks:

```ts
markdown: {
  shiki: {
    defaultShowLineNumbers: true,
  },
}
```

## Diagram Assets In Docs Projects

Stock `@pagesmith/docs` does not ship an inline Mermaid, Graphviz, Excalidraw, or draw.io renderer.

- Fences using languages like `mermaid`, `dot`, `excalidraw`, and `drawio` render as code blocks unless the project explicitly adds a custom renderer plugin.
- Use those language identifiers when you want to show diagram source in the docs.
- Use generated image assets when you want a visible diagram in the page.
- Prefer page-local `diagrams/` folders and keep the editable source file beside the rendered output.

Choose the source format by job:

| Need | Best choice | Why |
| ---- | ----------- | --- |
| Flowcharts, sequence diagrams, state diagrams, ER diagrams, timelines | Mermaid | Text-first and diff-friendly |
| Architecture overviews and conceptual sketches | Excalidraw | Flexible layout and presentation-friendly look |
| Network topology, cloud/vendor icons, BPMN, precise layouts | draw.io | Rich libraries and manual control |
| Dependency graphs, call graphs, existing `.dot` assets | Graphviz | Strong algorithmic layout |

For a single rendered asset, standard markdown image syntax is enough:

```md
![Request flow from CLI to API to storage](./diagrams/request-flow.svg)
```

Rendered assets keep their content-relative paths under `/assets/`, so `guide/setup/diagrams/request-flow.svg` and `reference/setup/diagrams/request-flow.svg` do not collide in the final build.

When light and dark renders differ, wrap the pair in a `<figure>` and embed both variants with the built-in theme classes:

```html
<figure>
  <img src="./diagrams/request-flow-light.svg" class="only-light" alt="Request flow from CLI to API to storage">
  <img src="./diagrams/request-flow-dark.svg" class="only-dark" alt="Request flow from CLI to API to storage">
</figure>
```

Only tell an agent to rely on inline Mermaid-style rendering when the project explicitly configured that renderer through custom markdown plugins or custom runtime behavior.

## JSON-Safe Markdown Config

`pagesmith.config.json5` only exposes the JSON-safe markdown settings that `@pagesmith/docs` can serialize directly:

```json5
{
  markdown: {
    allowDangerousHtml: true,
    math: 'auto',
    shiki: {
      themes: { light: 'github-light', dark: 'github-dark' },
      langAlias: { shell: 'bash' },
      defaultShowLineNumbers: true,
    },
  },
}
```

Function-valued `remarkPlugins` and `rehypePlugins` are not supported through `pagesmith.config.json5`. If you need custom plugin functions or additional pipeline stages, drop to lower-level `@pagesmith/core` APIs or a custom site integration instead of expecting the docs config file to execute code.

Raw HTML is preserved by default (`allowDangerousHtml: true`). Disable it when rendering untrusted markdown. Math processing defaults to `math: 'auto'`, which enables `remark-math` and `rehype-mathjax` only for pages that contain math markers.

## Frontmatter -- @pagesmith/core

Core provides base schemas. Use them or define your own with Zod:


| Schema                     | Fields                                                        |
| -------------------------- | ------------------------------------------------------------- |
| `BaseFrontmatterSchema`    | title, description, publishedDate, lastUpdatedOn, tags, draft |
| `BlogFrontmatterSchema`    | extends base + category, featured, coverImage                 |
| `ProjectFrontmatterSchema` | extends base + gitRepo, links                                 |


## Frontmatter -- @pagesmith/docs (additional)

Docs pages support these additional frontmatter fields beyond what your schema defines:


| Field          | Type      | Description                        |
| -------------- | --------- | ---------------------------------- |
| `title`        | `string`  | Page title (sidebar + browser tab) |
| `description`  | `string`  | Meta description for SEO           |
| `navLabel`     | `string`  | Override top navigation label      |
| `sidebarLabel` | `string`  | Override sidebar label             |
| `order`        | `number`  | Manual sort order within section   |
| `draft`        | `boolean` | Exclude from build                 |


### Home Page Frontmatter (docs only)


| Field         | Type     | Description                                        |
| ------------- | -------- | -------------------------------------------------- |
| `layout`      | `string` | `DocHome` for the home layout                      |
| `tagline`     | `string` | Short description below title                      |
| `install`     | `string` | Install command snippet                            |
| `actions`     | `array`  | CTA buttons (`{ text, link, theme: 'brand'         |
| `features`    | `array`  | Feature cards (`{ icon, title, details }`)         |
| `packages`    | `array`  | Package cards (`{ name, description, href, tag }`) |
| `codeExample` | `object` | Code example (`{ label, title, code }`)            |


## Built-in Content Validators

For markdown collections, three validators run automatically:

- **linkValidator** -- warns on bare URLs, empty link text, suspicious protocols
- **headingValidator** -- enforces single h1, sequential heading depth
- **codeBlockValidator** -- warns on missing language, unknown meta properties

Known valid meta properties: `title`, `showLineNumbers`, `startLineNumber`, `wrap`, `frame`, `collapse`, `mark`, `ins`, `del`.

## Key Rules for Content Authors

- Use fenced code blocks with a language identifier (validator warns otherwise)
- Do NOT add manual copy-button JS -- the built-in renderer handles it
- Do include the shipped Pagesmith markdown CSS so code block chrome and tabs render correctly
- One `# h1` per page (validator enforces)
- Sequential heading depth (no skipping from h2 to h4)
- Prefer relative links for internal content; absolute URLs get external link treatment
- Keep page-local images and diagrams beside the page; stock docs publishes them under preserved content-relative `/assets/` paths
- Do not expect `pagesmith.config.json5` to accept function-valued remark or rehype plugins
- Raw `mermaid`, `dot`, `excalidraw`, and `drawio` fences are source examples, not rendered diagrams, unless the project adds a custom renderer

## Quick Reference Card


| Feature          | Syntax                                                                        | Plugin                                 |
| ---------------- | ----------------------------------------------------------------------------- | -------------------------------------- |
| Bold             | `**bold`**                                                                    | built-in                               |
| Italic           | `*italic*`                                                                    | built-in                               |
| Inline code      | `code`                                                                        | built-in                               |
| Link             | `[text](url)`                                                                 | built-in                               |
| Image            | `![alt](src)`                                                                 | built-in                               |
| Inline SVG image | `![Logo](./diagrams/logo.inline.svg)`                                         | docs link/asset transforms             |
| Theme-aware image pair | `<figure><img class="only-light"> + <img class="only-dark"></figure>`     | built-in HTML + theme CSS              |
| Blockquote       | `> quote`                                                                     | built-in                               |
| Ordered list     | `1. item`                                                                     | built-in                               |
| Unordered list   | `- item`                                                                      | built-in                               |
| Horizontal rule  | `---`                                                                         | built-in                               |
| Table            | `| col | col |` with `| --- | --- |` separator                                | remark-gfm                             |
| Strikethrough    | `~~text~~`                                                                    | remark-gfm                             |
| Task list        | `- [x] done` / `- [ ] todo`                                                   | remark-gfm                             |
| Autolink         | bare URL                                                                      | remark-gfm                             |
| Footnote         | `[^id]` + `[^id]: text`                                                       | remark-gfm                             |
| Inline math      | `$E = mc^2$`                                                                  | remark-math                            |
| Block math       | `$$...$$`                                                                     | remark-math                            |
| Alert            | `> [!NOTE]` / `> [!TIP]` / `> [!IMPORTANT]` / `> [!WARNING]` / `> [!CAUTION]` | remark-github-alerts                   |
| Smart quotes     | `"text"` becomes curly                                                        | remark-smartypants                     |
| Em dash          | `---`                                                                         | remark-smartypants                     |
| En dash          | `--`                                                                          | remark-smartypants                     |
| Ellipsis         | `...`                                                                         | remark-smartypants                     |
| Code title       | ````js title="file.js"`                                                       | applyPagesmithCodeRenderer             |
| Line numbers     | ````js showLineNumbers`                                                       | applyPagesmithCodeRenderer             |
| Line highlight   | ````js mark={1-3}`                                                            | applyPagesmithCodeRenderer             |
| Line insert      | ````js ins={4}`                                                               | applyPagesmithCodeRenderer             |
| Line delete      | ````js del={5}`                                                               | applyPagesmithCodeRenderer             |
| Collapse lines   | ````js collapse={1-5}`                                                        | applyPagesmithCodeRenderer             |
| Word wrap        | ````js wrap`                                                                  | applyPagesmithCodeRenderer             |
| Frame style      | ````js frame="terminal"`                                                      | applyPagesmithCodeRenderer             |
| Code tabs        | consecutive titled fenced code blocks                                         | rehype-code-tabs                       |
| External link    | `[text](https://...)` auto new-tab                                            | rehype-external-links                  |
| Heading anchor   | auto `id` + wrap link                                                         | rehype-slug + rehype-autolink-headings |
| Accessible emoji | Unicode emoji auto-wrapped                                                    | rehype-accessible-emojis               |


