# Pagesmith

Pagesmith is a file-based CMS and documentation tool, organized as a multi-package workspace under the `@pagesmith/` npm scope.

Two main user-facing packages: `@pagesmith/core` for typed content collections plus a first-class Vite content plugin, and `@pagesmith/docs` for convention-based static documentation with built-in Pagefind search.

It gives you typed collections, lazy markdown rendering, AST-level validation, diagram rendering through `diagramkit`, optional runtime CSS, Vite virtual content modules, and installable AI companion files for Claude, Codex, Gemini CLI, and `llms.txt`.

## Install

Published package flow:

```bash
npm add @pagesmith/core diagramkit
```

Local monorepo development flow:

```bash
vp add diagramkit@file:../diagramkit
```

## Quick Start

```ts
import { defineCollection, defineCollections, z } from '@pagesmith/core'
import { pagesmithContent } from '@pagesmith/core/vite'
import { defineConfig } from 'vite-plus'

const content = defineCollections({
  posts: defineCollection({
    loader: 'markdown',
    directory: 'content/posts',
    schema: z.object({
      title: z.string(),
      date: z.coerce.date(),
      tags: z.array(z.string()).default([]),
    }),
  }),
})

export default defineConfig({
  plugins: [pagesmithContent({ collections: content })],
})
```

## Diagram Management

Pagesmith delegates diagram discovery, rendering, manifests, and watch mode to `diagramkit`.

```bash
pagesmith diagrams content/
pagesmith diagrams content/ --watch
pagesmith diagrams content/ --type drawio
```

## AI Companion Files

Install Pagesmith context for Claude, Codex, Gemini CLI, and `llms.txt`:

```bash
pagesmith ai install --assistant all --scope project
pagesmith ai install --assistant codex --scope project --docs
```

Examples:

```bash
pagesmith ai install --assistant claude --scope project
pagesmith ai install --assistant codex --scope user
pagesmith ai install --assistant gemini --scope project --skill-name content
```

Project installs create:

- `CLAUDE.md`
- `AGENTS.md`
- `GEMINI.md`
- `.claude/commands/pagesmith.md`
- `.codex/skills/pagesmith/SKILL.md`
- `.gemini/commands/pagesmith.toml`
- `llms.txt`
- `llms-full.txt`

## Docs

The docs site lives in `docs/` and is built with `@pagesmith/docs`.

- `pagesmith.config.json5` holds site metadata, footer links, and search settings
- `content/README.md` is the home page
- top-level folders under `content/` become top-level navigation sections
- Pagefind search is built in

- Build: `npm run build:docs`

## Repo Development

Use Vite+ commands in this repo:

```bash
vp install
vp check
vp test
```
