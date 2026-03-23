# Pagesmith

Pagesmith is a file-based CMS centered on `@pagesmith/content`.

It gives you typed collections, lazy markdown rendering, AST-level validation, diagram rendering through `diagramkit`, optional runtime CSS, and installable AI companion files for Claude, Codex, Gemini CLI, and `llms.txt`.

## Packages

- `@pagesmith/content`: the primary FS-CMS package
- `@pagesmith/core`: markdown pipeline, JSX runtime, and runtime CSS helpers
- `pagesmith`: optional SSG that consumes the content layer

## Install

Published package flow:

```bash
npm add @pagesmith/content diagramkit
```

Local monorepo development flow:

```bash
vp add diagramkit@file:../diagramkit
```

## Quick Start

```ts
import { createContentLayer, defineCollection, defineConfig, z } from '@pagesmith/content'

const posts = defineCollection({
  loader: 'markdown',
  directory: 'content/posts',
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    tags: z.array(z.string()).default([]),
  }),
})

const layer = createContentLayer(
  defineConfig({
    collections: { posts },
    diagrams: {
      enabled: true,
      displayMode: 'picture',
    },
  }),
)

const entries = await layer.getCollection('posts')
const rendered = await entries[0]?.render()
```

## Diagram Management

Pagesmith now delegates diagram discovery, rendering, manifests, and watch mode to `diagramkit`.

```bash
pagesmith-content diagrams content/
pagesmith-content diagrams content/ --watch
pagesmith-content diagrams content/ --type drawio
```

## AI Companion Files

Install Pagesmith context for Claude, Codex, Gemini CLI, and `llms.txt`:

```bash
pagesmith-content ai install --assistant all --scope project
```

Examples:

```bash
pagesmith-content ai install --assistant claude --scope project
pagesmith-content ai install --assistant codex --scope user
pagesmith-content ai install --assistant gemini --scope project --skill-name content
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

The docs site lives in `docs/` and is built with VitePress.

- Local dev: `vp exec vitepress dev docs`
- Build: `vp exec vitepress build docs`

## Repo Development

Use Vite+ commands in this repo:

```bash
vp install
vp check
vp test
```
