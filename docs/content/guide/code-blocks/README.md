---
title: Code Blocks
description: Syntax highlighting, line numbers, titles, tabs, and more with Expressive Code.
---

# Code Blocks

Pagesmith uses [Expressive Code](https://expressive-code.com/) for code block rendering. All features are configured by default in `@pagesmith/core` and require no additional setup. Code block styles are injected inline during markdown processing, so you do not need to include any additional CSS for code blocks.

## Basic Syntax Highlighting

Use standard fenced code blocks with a language identifier:

````markdown
```js
const greeting = 'Hello, world!'
console.log(greeting)
```
````

Expressive Code supports 100+ languages through Shiki (the same syntax highlighting engine used by VS Code).

## Dual Themes

Code blocks automatically support light and dark themes based on the user's system preference (`prefers-color-scheme`). The default themes are `github-light` and `github-dark`.

Configure custom themes in your markdown config:

```ts
const config = defineConfig({
  collections: { posts },
  markdown: {
    shiki: {
      themes: {
        light: 'github-light',
        dark: 'github-dark',
      },
    },
  },
})
```

Or in `pagesmith.config.json5` for `@pagesmith/docs`:

```json5
{
  markdown: {
    shiki: {
      themes: {
        light: 'catppuccin-latte',
        dark: 'catppuccin-mocha',
      },
    },
  },
}
```

## File Titles

Add a title to show a filename or label above the code block:

````markdown
```ts title="vite.config.ts"
import { defineConfig } from 'vite'
export default defineConfig({})
```
````

## Line Numbers

Line numbers are shown by default. Hide them for a specific block:

````markdown
```bash showLineNumbers=false
npm install @pagesmith/core
```
````

Or start line numbers from a specific number:

````markdown
```ts startLineNumber=42
const answer = getAnswer()
```
````

To change the default for your entire site, set `defaultShowLineNumbers` in the markdown config:

```ts
const config = defineConfig({
  collections: { posts },
  markdown: {
    shiki: {
      defaultShowLineNumbers: false,
    },
  },
})
```

## Line Highlighting

Mark specific lines to draw attention:

````markdown
```ts mark={3}
const name = 'Pagesmith'
const version = '0.1.0'
const highlighted = true  // this line is highlighted
```
````

### Diff-Style Highlighting

Show inserted and deleted lines:

````markdown
```ts ins={2} del={1}
const old = 'before'
const updated = 'after'
```
````

### Range Syntax

Highlight multiple lines or ranges:

````markdown
```ts mark={1, 3-5}
const a = 1
const b = 2
const c = 3
const d = 4
const e = 5
```
````

## Collapsible Sections

Collapse long sections of code that are not the focus:

````markdown
```ts collapse={1-5}
// These lines are collapsed by default
import { defineConfig } from 'vite'
import { pagesmithContent } from '@pagesmith/core/vite'
import { pagesmithSsg } from '@pagesmith/core/vite'
import collections from './content.config'
// This line is visible
export default defineConfig({
  plugins: [pagesmithContent(collections), pagesmithSsg()],
})
```
````

Users can click to expand the collapsed section.

## Text Wrapping

Enable word wrapping for long lines:

````markdown
```json wrap
{"name": "@pagesmith/core", "description": "File-based CMS — schema-validated collections, lazy markdown rendering, and runtime CSS/JS exports", "version": "0.1.0"}
```
````

## Frame Styles

Expressive Code automatically detects terminal languages (bash, sh, zsh, shell, powershell) and renders them with a terminal-style frame. All other languages use an editor-style frame.

Override the frame style explicitly:

````markdown
```bash frame="none"
npm install @pagesmith/core
```
````

Available frame values: `"code"` (editor), `"terminal"`, `"none"`, `"auto"` (default).

## Copy Button

Every code block includes a copy button by default. Users can click it to copy the code to their clipboard. The button is rendered by Expressive Code and requires no additional runtime JavaScript.

## Code Tabs

Consecutive titled code blocks are automatically grouped into a tabbed interface. This is useful for showing the same concept across package managers, languages, or configurations. Just write titled fenced blocks one after another with no other content between them:

````markdown
```bash title="npm"
npm install @pagesmith/core
```

```bash title="pnpm"
pnpm add @pagesmith/core
```

```bash title="yarn"
yarn add @pagesmith/core
```
````

The `title` value becomes the tab label. The first tab is active by default and readers can click to switch between them. Without JavaScript, all blocks stack vertically as a fallback.

You can also use code tabs to show the same logic in different languages:

````markdown
```ts title="TypeScript"
interface Config {
  host: string
  port: number
}
```

```python title="Python"
@dataclass
class Config:
    host: str = "localhost"
    port: int = 3000
```

```rust title="Rust"
struct Config {
    host: String,
    port: u16,
}
```
````

Any non-code content (a paragraph, heading, or untitled code block) between titled blocks breaks the group — each group is independent.

## How It Works

Expressive Code runs as a rehype plugin in the unified markdown pipeline. During markdown processing, it:

1. Finds all fenced code blocks in the HTML AST
2. Applies syntax highlighting using Shiki
3. Adds code frames, line numbers, titles, and other decorations
4. Generates CSS custom properties for theme support
5. Injects a `<style>` element with all necessary styles
6. Injects a `<script>` element for interactive features (copy button)

The styles and scripts are injected inline into the rendered HTML, so there is no external CSS or JavaScript file to include for code blocks. This means code block styling works automatically in any layout or framework.

## Meta String Reference

All meta properties are added after the language identifier in the opening fence:

| Property | Syntax | Description |
|---|---|---|
| `title` | `title="filename.ts"` | Show a file name or label |
| `showLineNumbers` | `showLineNumbers` / `showLineNumbers=false` | Show or hide line numbers |
| `startLineNumber` | `startLineNumber=42` | Start line numbers from a specific number |
| `mark` | `mark={3}` or `mark={1,3-5}` | Highlight lines |
| `ins` | `ins={2-3}` | Mark lines as inserted (green) |
| `del` | `del={1}` | Mark lines as deleted (red) |
| `collapse` | `collapse={1-5}` | Collapse a range of lines |
| `wrap` | `wrap` | Enable word wrapping |
| `frame` | `frame="terminal"` | Override the frame style |

Multiple properties can be combined:

````markdown
```ts title="example.ts" mark={3} ins={5} collapse={1-2}
import { z } from 'zod'
import { defineCollection } from '@pagesmith/core'
const posts = defineCollection({
  loader: 'markdown',
  directory: 'content/posts',
  schema: z.object({ title: z.string() }),
})
```
````
