---
title: "Markdown Feature Reference"
description: "A comprehensive guide to every markdown feature supported by the rendering pipeline — from basic formatting to code tabs, math, and diagrams."
date: 2026-03-20
tags: [reference, markdown, guide, features]
author: jane-doe
draft: false
---

# Markdown Feature Reference

This document demonstrates every feature supported by the markdown processing pipeline. Use it as a reference when authoring content, or as a visual test to verify that rendering works correctly across all output targets.

## Text Formatting

Markdown supports several inline formatting options that can be combined freely within a paragraph.

Use **bold text** for strong emphasis and _italic text_ for lighter emphasis. Combine them for _**bold italic**_ when needed. Use ~~strikethrough~~ to indicate removed or deprecated content. Inline `code spans` render in a monospace font and are useful for referencing variable names like `processMarkdown` or file paths like `src/index.ts`.

Links come in two forms: [inline links](https://example.com) with a URL directly in the text, and [reference-style links][ref-link] defined elsewhere in the document. You can also link to email addresses: <contact@example.com>.

[ref-link]: https://example.com/reference "Reference Link Title"

## Headings

Headings form the document outline and drive automatic table-of-contents generation. The pipeline extracts all headings with their depth, text, and auto-generated slug IDs.

### Third-Level Heading

Use h3 for subsections within a major topic.

#### Fourth-Level Heading

Use h4 for detailed breakdowns within a subsection.

##### Fifth-Level Heading

Rarely needed, but supported for deeply nested documentation.

###### Sixth-Level Heading

The deepest heading level. Consider restructuring your content if you reach this depth often.

## Lists

### Unordered Lists

Use unordered lists for items where sequence does not matter:

- Parse markdown source files from the content directory
- Extract YAML frontmatter and validate against Zod schemas
- Process the markdown body through the unified pipeline
  - Apply remark plugins (GFM, math, custom transforms)
  - Convert to rehype (HTML AST)
  - Apply rehype plugins (syntax highlighting, slug generation, code tabs)
- Render the final HTML string

### Ordered Lists

Use ordered lists when the sequence of steps matters:

1. Install the package from npm
2. Create a `content.config.ts` defining your collections
3. Add markdown files with YAML frontmatter to your content directory
4. Run the build command to generate static HTML
5. Deploy the output directory to any static hosting provider

### Nested Mixed Lists

Lists can be nested and mixed:

1. **Content phase** — collect and process source files
   - Walk the content directory for `README.md` files
   - Extract frontmatter with `gray-matter`
   - Validate against collection schemas
2. **Render phase** — generate HTML output
   - Bundle CSS with LightningCSS
   - Bundle runtime JS with rolldown
   - Render each page through its layout function
3. **Finalize phase** — post-processing
   - Hash asset filenames for cache busting
   - Generate sitemap, RSS feed, and robots.txt
   - Copy public directory assets to output

### Task Lists

GFM task lists render as checkboxes, useful for tracking progress:

- [x] Set up the project structure
- [x] Configure the markdown pipeline
- [x] Add syntax highlighting with Shiki
- [ ] Implement search integration
- [ ] Write end-to-end tests
- [ ] Publish version 1.0

## Blockquotes

Blockquotes are useful for callouts, notes, and attributions.

> The best way to predict the future is to invent it.
> — Alan Kay

Blockquotes can contain other markdown elements:

> **Note:** When configuring the build pipeline, remember that:
>
> - CSS is bundled with LightningCSS for minimal output
> - JavaScript is bundled with rolldown
> - All assets are content-hashed in production builds
>
> See the [configuration docs](#) for details.

Nested blockquotes indicate layered quoting:

> The documentation states:
>
>> All page layouts receive the full site configuration, the processed content HTML, extracted headings for TOC generation, and the page's validated frontmatter.
>
> This means layouts have access to everything they need without additional data fetching.

## Horizontal Rules

Use horizontal rules to create visual breaks between major sections.

---

Content continues after the rule. These render as a styled `<hr>` element.

## Tables

GFM tables support column alignment and inline formatting within cells.

| Feature       | Syntax        | Rendered As |
| ------------- | ------------- | ----------- |
| Bold          | `**text**`    | **text**    |
| Italic        | `*text*`      | _text_      |
| Code          | `` `code` ``  | `code`      |
| Strikethrough | `~~text~~`    | ~~text~~    |
| Link          | `[text](url)` | [text](#)   |

Tables with alignment:

| Tool         |        Purpose         |   Phase |
| :----------- | :--------------------: | ------: |
| gray-matter  | Frontmatter extraction | Collect |
| unified      |  Markdown processing   | Collect |
| Shiki        |  Syntax highlighting   | Collect |
| LightningCSS |      CSS bundling      |  Render |
| rolldown     |      JS bundling       |  Render |

## Code Blocks

### Basic Syntax Highlighting

The pipeline uses Shiki for syntax highlighting with dual-theme support (light and dark). Code blocks display line numbers by default and include a language badge and copy button.

```typescript
import rehypeStringify from 'rehype-stringify'
import remarkGfm from 'remark-gfm'
import remarkParse from 'remark-parse'
import remarkRehype from 'remark-rehype'
import { unified, } from 'unified'

async function processMarkdown(source: string,): Promise<string> {
  const result = await unified()
    .use(remarkParse,)
    .use(remarkGfm,)
    .use(remarkRehype, { allowDangerousHtml: true, },)
    .use(rehypeStringify,)
    .process(source,)

  return String(result,)
}
```

### Multiple Languages

The pipeline supports syntax highlighting for a wide range of languages.

```python
from dataclasses import dataclass, field
from pathlib import Path
from typing import Optional

@dataclass
class ContentEntry:
    """Represents a single content item in a collection."""
    slug: str
    title: str
    body: str
    tags: list[str] = field(default_factory=list)
    draft: bool = False
    source_path: Optional[Path] = None

    @property
    def word_count(self) -> int:
        return len(self.body.split())

    @property
    def read_time_minutes(self) -> int:
        return max(1, self.word_count // 200)
```

```rust
use std::collections::HashMap;
use std::path::PathBuf;

#[derive(Debug, Clone)]
struct SiteConfig {
    title: String,
    base_url: String,
    content_dir: PathBuf,
    output_dir: PathBuf,
    tags: HashMap<String, Vec<String>>,
}

impl SiteConfig {
    fn new(title: &str, base_url: &str) -> Self {
        Self {
            title: title.to_string(),
            base_url: base_url.to_string(),
            content_dir: PathBuf::from("content"),
            output_dir: PathBuf::from("dist"),
            tags: HashMap::new(),
        }
    }

    fn content_path(&self, slug: &str) -> PathBuf {
        self.content_dir.join(slug).join("README.md")
    }
}
```

```go
package main

import (
	"fmt"
	"os"
	"path/filepath"
	"strings"
)

// WalkContent discovers all markdown files in a content directory.
func WalkContent(root string) ([]string, error) {
	var pages []string

	err := filepath.Walk(root, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return err
		}
		name := strings.ToLower(info.Name())
		if name == "readme.md" || name == "index.md" {
			pages = append(pages, path)
		}
		return nil
	})

	return pages, err
}

func main() {
	pages, err := WalkContent("content")
	if err != nil {
		fmt.Fprintf(os.Stderr, "error: %v\n", err)
		os.Exit(1)
	}
	for _, p := range pages {
		fmt.Println(p)
	}
}
```

```css
/* Code block styling with dual-theme support */
.code-figure {
  --code-bg: var(--surface-code);
  --code-border: var(--border-subtle);

  position: relative;
  border: 1px solid var(--code-border);
  border-radius: 0.5rem;
  overflow: hidden;
  margin-block: 1.5rem;
}

.code-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: var(--code-bg);
  border-bottom: 1px solid var(--code-border);
  font-size: 0.8125rem;
}

.code-copy-btn {
  margin-inline-start: auto;
  opacity: 0;
  transition: opacity 150ms ease;
}

.code-figure:hover .code-copy-btn {
  opacity: 1;
}
```

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Static Site</title>
  <link rel="stylesheet" href="/assets/style.css">
</head>
<body>
  <header>
    <nav aria-label="Main navigation">
      <a href="/">Home</a>
      <a href="/blog/">Blog</a>
      <a href="/about/">About</a>
    </nav>
  </header>
  <main>
    <article class="prose">
      <!-- Rendered markdown content injected here -->
    </article>
  </main>
  <script src="/assets/main.js" type="module"></script>
</body>
</html>
```

```bash
# Build the site for production
npm run build -- --parallel --validate

# Start the development server with file watching
npm run dev -- --port 3000

# Preview the production build locally
npm run preview -- --port 4000

# Render all diagrams (Mermaid + Excalidraw)
npm run diagrams -- --force
```

```json
{
  "name": "@pagesmith/core",
  "version": "1.0.0",
  "type": "module",
  "exports": {
    ".": {
      "bun": "./src/index.ts",
      "deno": "./src/index.ts",
      "default": "./dist/index.js"
    }
  },
  "scripts": {
    "build": "tsup src/index.ts --format esm --dts",
    "dev": "tsx cli/bin.ts dev",
    "test": "vitest run"
  }
}
```

```yaml
# Site configuration (site.json5 equivalent in YAML)
site:
  title: "My Documentation Site"
  description: "Built with Pagesmith"
  baseUrl: "https://docs.example.com"
  language: "en"

build:
  outDir: "dist"
  parallel: true
  validate: true

markdown:
  shiki:
    themes:
      light: "github-light"
      dark: "github-dark"
    defaultShowLineNumbers: true
```

### Titled Code Blocks

Adding a `title` to a code block displays a filename header. This is especially useful for showing which file the code belongs to.

```typescript title="src/config/resolver.ts"
import type { SiteConfig, } from '../schemas/config'
import { DEFAULTS, } from './defaults'

export function resolveConfig(
  userConfig: Partial<SiteConfig>,
  rootDir: string,
): SiteConfig {
  return {
    ...DEFAULTS,
    ...userConfig,
    rootDir,
    contentDir: resolve(rootDir, userConfig.contentDir ?? DEFAULTS.contentDir,),
    outDir: resolve(rootDir, userConfig.outDir ?? DEFAULTS.outDir,),
  }
}
```

### Hiding Line Numbers

Add `hideLineNumbers` to the meta string to opt out of the default line numbering:

```bash hideLineNumbers
npm install @pagesmith/content
cd my-project
npx pagesmith build
```

### Line Highlighting

Use `mark` to draw attention to specific lines with a yellow highlight:

```typescript mark={4,8-10}
import { defineCollection, z, } from '@pagesmith/content'

const posts = defineCollection({
  loader: 'markdown',
  directory: 'content/posts',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    date: z.coerce.date(),
    tags: z.array(z.string(),).default([],),
  },),
},)
```

### Diff Highlighting

Use `ins` and `del` to show additions and removals, useful for migration guides and changelogs:

```typescript title="config.ts" del={2,3} ins={4,5}
export default {
  bundler: 'webpack',
  minifier: 'terser',
  bundler: 'rolldown',
  minifier: 'lightningcss',
  outDir: 'dist',
}
```

### Collapsible Sections

Long code blocks can have regions collapsed by default. Readers click to expand them. This keeps focus on the important parts while preserving the full context.

```typescript title="src/build/pipeline.ts" collapse={1-6,18-24}
import { mkdirSync, readFileSync, writeFileSync, } from 'node:fs'
import { resolve, } from 'node:path'
import { hashAssets, } from '../assets/hasher'
import { bundleCSS, } from '../css/builder'
import { bundleJS, } from '../js/bundler'
import { processMarkdown, } from '../markdown/pipeline'

export async function build(config: BuildConfig,): Promise<void> {
  console.log('Phase 1: Collecting content...',)
  const pages = await collectPages(config.contentDir,)

  console.log('Phase 2: Rendering pages...',)
  const rendered = await renderAll(pages, config,)

  console.log('Phase 3: Finalizing output...',)
  await writeOutput(rendered, config.outDir,)
  await hashAssets(config.outDir,)

  console.log(`Build complete: ${pages.length} pages generated`,)
}

async function collectPages(contentDir: string,) {
  // Walk content directory for README.md / index.md files
  // Extract frontmatter, process markdown, build index
}
```

## Code Tabs

When consecutive code blocks all have a `title`, they are automatically grouped into a tabbed interface. This is perfect for showing the same concept across different languages or configuration formats.

### Cross-Language Comparison

```typescript title="TypeScript"
interface ContentEntry {
  slug: string
  title: string
  tags: string[]
  draft: boolean
}

function filterPublished(entries: ContentEntry[],): ContentEntry[] {
  return entries.filter((entry,) => !entry.draft)
}
```

```python title="Python"
from dataclasses import dataclass

@dataclass
class ContentEntry:
    slug: str
    title: str
    tags: list[str]
    draft: bool = False

def filter_published(entries: list[ContentEntry]) -> list[ContentEntry]:
    return [e for e in entries if not e.draft]
```

```rust title="Rust"
struct ContentEntry {
    slug: String,
    title: String,
    tags: Vec<String>,
    draft: bool,
}

fn filter_published(entries: &[ContentEntry]) -> Vec<&ContentEntry> {
    entries.iter().filter(|e| !e.draft).collect()
}
```

### Configuration Formats

```json title="package.json"
{
  "scripts": {
    "build": "pagesmith build --parallel",
    "dev": "pagesmith dev --port 3000",
    "preview": "pagesmith preview"
  }
}
```

```yaml title="config.yaml"
scripts:
  build: "pagesmith build --parallel"
  dev: "pagesmith dev --port 3000"
  preview: "pagesmith preview"
```

```toml title="config.toml"
[scripts]
build = "pagesmith build --parallel"
dev = "pagesmith dev --port 3000"
preview = "pagesmith preview"
```

### Framework Integration

```typescript title="with-react/app.tsx"
import { createContentLayer, } from '@pagesmith/content'
import config from '../shared-content/content.config'

export async function generateStaticParams() {
  const layer = await createContentLayer(config,)
  const posts = await layer.getCollection('posts',)
  return posts.map((post,) => ({ slug: post.slug, }))
}
```

```typescript title="with-solid/app.tsx"
import { createContentLayer, } from '@pagesmith/content'
import config from '../shared-content/content.config'

export async function getPosts() {
  const layer = await createContentLayer(config,)
  return layer.getCollection('posts',)
}
```

```typescript title="with-svelte/+page.server.ts"
import { createContentLayer, } from '@pagesmith/content'
import config from '../shared-content/content.config'

export async function load() {
  const layer = await createContentLayer(config,)
  const posts = await layer.getCollection('posts',)
  return { posts, }
}
```

## Mathematics

The pipeline supports LaTeX math via `remark-math` and `rehype-mathjax`, rendering equations as SVG for crisp display at any zoom level.

### Inline Math

Inline math expressions sit within a line of text. The quadratic formula $x = \frac{-b \pm \sqrt{b^2 - 4ac}}{2a}$ solves any equation of the form $ax^2 + bx + c = 0$. Einstein's famous equation $E = mc^2$ relates energy and mass.

### Block Math

Display math renders as a centered block, suitable for important equations:

$$
\mathcal{L}(\theta) = \sum_{i=1}^{n} \log P(x_i \mid \theta) - \frac{\lambda}{2} \|\theta\|^2
$$

The Shannon entropy of a discrete random variable:

$$
H(X) = -\sum_{i=1}^{n} P(x_i) \log_2 P(x_i)
$$

Matrix notation for a linear transformation:

$$
\begin{bmatrix} y_1 \\ y_2 \\ y_3 \end{bmatrix} = \begin{bmatrix} w_{11} & w_{12} & w_{13} \\ w_{21} & w_{22} & w_{23} \\ w_{31} & w_{32} & w_{33} \end{bmatrix} \begin{bmatrix} x_1 \\ x_2 \\ x_3 \end{bmatrix} + \begin{bmatrix} b_1 \\ b_2 \\ b_3 \end{bmatrix}
$$

## Images

Images use standard markdown syntax with alt text for accessibility. The alt text is required and should meaningfully describe the image content.

![A sample placeholder image](https://placehold.co/800x400/e2e8f0/475569?text=Content+Pipeline+Overview)

## Diagrams

The build pipeline renders `.mermaid` and `.excalidraw` files to SVG before page generation. Reference them from markdown just like images — the asset pipeline handles the rest.

### Mermaid Diagrams

Mermaid diagrams are defined in `.mermaid` files and rendered to SVG through `diagramkit`:

![Architecture diagram showing the content processing pipeline](./architecture.mermaid)

### Excalidraw Diagrams

Excalidraw diagrams provide a hand-drawn visual style. They are stored as `.excalidraw` JSON files and rendered to SVG through `diagramkit`:

![Build flow diagram showing the three-phase pipeline](./flow.excalidraw)

## Links

### Internal Links

Internal links between content pages use relative paths. The pipeline's link transform plugin rewrites these to proper site URLs:

- [Getting Started guide](../getting-started/)
- [Hello World post](../hello-world/)
- [Advanced Features](../advanced-features/)

### External Links

External links open in the same tab by default. Always include descriptive link text rather than raw URLs:

- [unified ecosystem](https://unifiedjs.com/) — the markdown processing framework
- [Shiki syntax highlighter](https://shiki.matsu.io/) — accurate, VS Code-quality highlighting
- [Zod schema validation](https://zod.dev/) — TypeScript-first schema library
- [LightningCSS](https://lightningcss.dev/) — fast CSS bundling and minification

### Autolinks

GFM autolinks automatically convert URLs and email addresses into clickable links:

Visit https://github.com/example/pagesmith for the source code.

## Blockquotes

### Simple Blockquote

> Static site generators transform source content into deployable HTML at build time, eliminating the need for server-side rendering or client-side JavaScript frameworks for content-heavy sites.

### Multi-Paragraph Blockquote

> The key insight behind the zero-runtime approach is that content pages are inherently static. They do not change in response to user interaction.
>
> By rendering at build time, we can serve pure HTML with optimal performance characteristics: instant first contentful paint, zero JavaScript parsing overhead, and full accessibility without progressive enhancement.

### Nested Blockquotes

> A reviewer commented:
>
>> The parallel build implementation using worker pools shows significant improvement. On a 500-page site, build time dropped from 12 seconds to 3.2 seconds on an 8-core machine.
>
> This validates the design decision to keep pages independent and stateless.

## Footnotes

Footnotes provide supplementary information without interrupting the main text flow. The unified pipeline processes footnotes into linked references at the bottom of the page.

The build pipeline processes markdown through a chain of remark and rehype plugins[^1]. Syntax highlighting uses Shiki with dual-theme support[^2], which means the correct theme is applied based on the user's color scheme preference without any runtime JavaScript.

Asset hashing uses SHA-256 to generate 8-character content hashes[^3], ensuring that browsers always fetch the latest version after a deploy while still caching aggressively.

[^1]: The full chain is: remark-parse, remark-gfm, remark-math, remark-rehype, rehype-mathjax, rehype-slug, rehype-autolink-headings, rehype-shiki (with custom transformers), rehype-code-tabs, and rehype-stringify.

[^2]: Shiki loads TextMate grammars for accurate tokenization. The dual-theme feature generates CSS custom properties so both light and dark themes are embedded in a single code block, with the active theme controlled by a CSS class on the root element.

[^3]: Content hashing appends a hash like `style.a1b2c3d4.css` to filenames. Only the 8-character prefix of the full SHA-256 hash is used, providing sufficient uniqueness while keeping URLs readable.

## GFM Extensions

### Strikethrough

Use double tildes for ~~deleted text~~ inline. This is commonly used in changelogs to show what was removed:

- ~~webpack~~ rolldown for JavaScript bundling
- ~~PostCSS~~ LightningCSS for CSS processing
- ~~Jest~~ vitest for testing

### Autolinks

GFM automatically converts bare URLs into links. For example, the repository lives at https://github.com/example/pagesmith and documentation is at https://docs.example.com.

### Tables with Alignment

| Metric                 | Before | After | Improvement |
| :--------------------- | -----: | ----: | :---------: |
| Build time (500 pages) |  12.4s |  3.2s |   **74%**   |
| CSS bundle size        |  48 KB | 12 KB |   **75%**   |
| JS bundle size         | 156 KB |  0 KB |  **100%**   |
| Lighthouse score       |     72 |   100 |   **+28**   |

## Combining Features

Real-world documents combine multiple features. Here is a realistic example of a configuration section that uses headings, prose, code tabs, and callouts together.

### Configuring the Build Pipeline

The build pipeline accepts configuration through `site.json5` in your content directory. Here is the same configuration in multiple formats:

```json title="site.json5"
{
  // Site metadata
  "title": "My Documentation",
  "baseUrl": "https://docs.example.com",
  "language": "en",

  // Build options
  "outDir": "dist",
  "parallel": true,

  // Markdown processing
  "markdown": {
    "shiki": {
      "themes": {
        "light": "github-light",
        "dark": "github-dark"
      }
    }
  }
}
```

```yaml title="site.yaml"
# Site metadata
title: "My Documentation"
baseUrl: "https://docs.example.com"
language: "en"

# Build options
outDir: "dist"
parallel: true

# Markdown processing
markdown:
  shiki:
    themes:
      light: "github-light"
      dark: "github-dark"
```

```toml title="site.toml"
# Site metadata
title = "My Documentation"
baseUrl = "https://docs.example.com"
language = "en"

# Build options
outDir = "dist"
parallel = true

# Markdown processing
[markdown.shiki.themes]
light = "github-light"
dark = "github-dark"
```

> **Tip:** JSON5 is the default configuration format because it supports comments and trailing commas, making it more forgiving than strict JSON while remaining familiar to JavaScript developers.

After configuring, run the build:

```bash hideLineNumbers
npx pagesmith build --parallel --validate
```

The `--parallel` flag enables the worker pool for multi-core page rendering, and `--validate` runs content validation checks (broken links, missing assets, schema violations) before generating output.

---

_This reference document covers every feature supported by the markdown processing pipeline. For questions or to report rendering issues, see the project repository._
