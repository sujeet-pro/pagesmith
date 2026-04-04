---
title: "Code Blocks"
description: "Syntax highlighting, line numbers, diffs, collapsible sections, and tabbed code blocks powered by Expressive Code."
date: 2026-03-15
tags: [markdown, code]
---

# Code Blocks

Pagesmith uses [Expressive Code](https://expressive-code.com/) for syntax highlighting with dual light/dark theme support. Every code block gets a copy button, language badge, and automatic theme switching -- no extra CSS or JS required.

## Basic Syntax Highlighting

Specify the language identifier after the opening fence to enable highlighting.

### JavaScript

```js
function greet(name) {
  return `Hello, ${name}!`
}

const result = greet('world')
console.log(result)
```

### TypeScript

```ts
interface User {
  id: number
  name: string
  email: string
}

function getUser(id: number): Promise<User> {
  return fetch(`/api/users/${id}`).then((res) => res.json())
}
```

### Python

```python
from dataclasses import dataclass
from typing import Optional

@dataclass
class Config:
    host: str = "localhost"
    port: int = 8080
    debug: bool = False

def create_app(config: Optional[Config] = None) -> None:
    config = config or Config()
    print(f"Starting server on {config.host}:{config.port}")
```

### Rust

```rust
use std::collections::HashMap;

fn word_count(text: &str) -> HashMap<&str, usize> {
    let mut counts = HashMap::new();
    for word in text.split_whitespace() {
        *counts.entry(word).or_insert(0) += 1;
    }
    counts
}
```

### Go

```go
package main

import (
    "fmt"
    "net/http"
)

func handler(w http.ResponseWriter, r *http.Request) {
    fmt.Fprintf(w, "Hello, %s!", r.URL.Path[1:])
}

func main() {
    http.HandleFunc("/", handler)
    http.ListenAndServe(":8080", nil)
}
```

### CSS

```css
:root {
  --color-primary: #3b82f6;
  --color-surface: #ffffff;
  --radius: 0.5rem;
}

.card {
  background: var(--color-surface);
  border-radius: var(--radius);
  box-shadow: 0 1px 3px rgb(0 0 0 / 0.1);
  padding: 1.5rem;
}
```

### HTML

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>Pagesmith Example</title>
    <link rel="stylesheet" href="/styles/main.css" />
  </head>
  <body>
    <main id="app"></main>
    <script type="module" src="/src/main.ts"></script>
  </body>
</html>
```

### Bash

```bash
#!/usr/bin/env bash
set -euo pipefail

echo "Installing dependencies..."
npm install

echo "Building project..."
npm run build

echo "Done. Output in dist/"
```

### JSON

```json
{
  "name": "@example/app",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  }
}
```

### YAML

```yaml
name: CI
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
      - run: npm test
```

## Titled Code Blocks

Add a `title` to display a filename or label above the block.

```ts title="app.ts"
import express from 'express'

const app = express()
app.get('/', (req, res) => {
  res.send('Hello from Pagesmith!')
})

app.listen(3000)
```

```css title="styles/theme.css"
.container {
  max-width: 72rem;
  margin-inline: auto;
  padding-inline: 1.5rem;
}
```

## Line Numbers

Line numbers are shown by default. You can explicitly enable them with `showLineNumbers` or set a custom starting number with `startLineNumber`.

### Default (line numbers shown)

```ts
const server = Bun.serve({
  port: 3000,
  fetch(request) {
    return new Response('Welcome to Pagesmith')
  },
})

console.log(`Listening on localhost:${server.port}`)
```

### Hidden line numbers

Use `showLineNumbers=false` to hide line numbers when they are not useful.

```bash showLineNumbers=false
npm create pagesmith@latest my-site
cd my-site
npm install
npm run dev
```

### Custom starting line number

Use `startLineNumber` to set where numbering begins -- useful when showing a snippet from a larger file.

```ts showLineNumbers startLineNumber=42
// ...continuing from line 42
export function resolveConfig(options: Options): ResolvedConfig {
  const defaults = getDefaults()
  return mergeConfig(defaults, options)
}
```

## Line Highlighting

Use `mark`, `ins`, and `del` to draw attention to specific lines.

### Marked lines

The `mark` meta highlights lines with a neutral background color, useful for drawing attention without implying addition or removal.

```ts mark={2-3}
function createPlugin(options) {
  const name = options.name ?? 'default'
  const version = options.version ?? '1.0.0'
  return { name, version }
}
```

### Inserted lines

The `ins` meta highlights lines in green, indicating additions.

```ts ins={5}
function createPlugin(options) {
  const name = options.name ?? 'default'
  const version = options.version ?? '1.0.0'
  return { name, version }
  // Plugin registered successfully
}
```

### Deleted lines

The `del` meta highlights lines in red, indicating removals.

```ts del={3}
function createPlugin(options) {
  const name = options.name ?? 'default'
  console.log('DEBUG:', options) // remove before shipping
  const version = options.version ?? '1.0.0'
  return { name, version }
}
```

### Combined highlighting

You can combine `mark`, `ins`, and `del` on the same block to show a complete change in context.

```ts title="config.ts" mark={2} ins={5-6} del={4}
export function defineConfig(input: UserConfig): ResolvedConfig {
  const config = normalizeConfig(input)

  validateSync(config)
  const errors = await validateAsync(config)
  if (errors.length) throw new AggregateError(errors)

  return config
}
```

## Diff Highlighting

Use the `diff` language for traditional unified diff format.

```diff
- const port = 3000
+ const port = process.env.PORT || 3000

  const server = createServer(app)
- server.listen(port)
+ server.listen(port, () => {
+   console.log(`Server running on port ${port}`)
+ })
```

## Collapsible Sections

Use `collapse` to hide boilerplate lines by default. Readers can expand them with a click.

```ts title="server.ts" collapse={1-5,15-19}
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import compression from 'compression'
import morgan from 'morgan'

const app = express()
app.use(cors())
app.use(helmet())

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() })
})

app.get('/api/version', (req, res) => {
  res.json({ version: '1.0.0' })
})

app.listen(3000, () => {
  console.log('Server ready')
})
```

This is especially useful when showing configuration files where only a few lines are relevant.

```json title="tsconfig.json" collapse={3-14}
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"]
}
```

## Code Tabs

Consecutive titled code blocks automatically group into a tabbed interface. This is useful for showing the same concept across languages or configurations.

```ts title="TypeScript"
interface Config {
  host: string
  port: number
}

function loadConfig(): Config {
  return {
    host: process.env.HOST ?? 'localhost',
    port: Number(process.env.PORT) ?? 3000,
  }
}
```

```python title="Python"
from dataclasses import dataclass
import os

@dataclass
class Config:
    host: str = "localhost"
    port: int = 3000

def load_config() -> Config:
    return Config(
        host=os.getenv("HOST", "localhost"),
        port=int(os.getenv("PORT", "3000")),
    )
```

```rust title="Rust"
use std::env;

struct Config {
    host: String,
    port: u16,
}

fn load_config() -> Config {
    Config {
        host: env::var("HOST").unwrap_or_else(|_| "localhost".into()),
        port: env::var("PORT")
            .ok()
            .and_then(|p| p.parse().ok())
            .unwrap_or(3000),
    }
}
```

Here is another tab group showing package manager commands:

```bash title="npm"
npm install @pagesmith/core
```

```bash title="pnpm"
pnpm add @pagesmith/core
```

```bash title="yarn"
yarn add @pagesmith/core
```

```bash title="bun"
bun add @pagesmith/core
```
