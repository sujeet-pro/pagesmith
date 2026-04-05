---
layout: DocHome
title: Pagesmith
tagline: File-Based CMS for the Filesystem-First Web
description: Typed content collections, convention-based docs, and configurable assistant artifacts — powered by Vite.
install: npm install @pagesmith/docs
actions:
  - text: Start with AI
    link: /guide/choose-your-path
    theme: brand
  - text: Manual Setup
    link: /guide/docs-getting-started
    theme: alt
  - text: Framework Guides
    link: /guide/frameworks
    theme: alt
  - text: API Reference
    link: /reference/api
    theme: alt
features:
  - icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"/></svg>
    title: Filesystem-First CMS
    details: Model markdown, JSON, JSONC, JSON5, YAML, TOML, and custom loaders with Zod-backed schemas and collection APIs.
  - icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M9 12h6m-3-3v6m-7 4h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
    title: Docs With Batteries
    details: Build a docs site from `pagesmith.config.json5` with default layouts, sidebar generation, and bundled Pagefind search.
  - icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zm0 8a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zm10 0a1 1 0 011-1h4a1 1 0 011 1v6a1 1 0 01-1 1h-4a1 1 0 01-1-1v-6z"/></svg>
    title: Any Framework
    details: Use `@pagesmith/core` with React, Solid, Svelte, EJS, Handlebars, or the built-in JSX runtime — all through Vite.
  - icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
    title: Schema Validation
    details: Validate frontmatter with Zod schemas and run AST-level content checks for links, headings, and code blocks at build time.
  - icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"/></svg>
    title: Expressive Code
    details: Syntax highlighting with dual themes, line numbers, file titles, diff markers, collapsible sections, and copy buttons — zero config.
  - icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
    title: AI Assistant Artifacts
    details: Generate memory files, skills, and llms.txt for Claude, Codex, and Gemini from your content collections automatically.
packages:
  - name: "@pagesmith/core"
    description: Content layer, markdown pipeline, JSX runtime, CSS builder, schemas, loaders, and Vite plugin.
    href: /reference/api
    tag: Core
  - name: "@pagesmith/docs"
    description: Convention-based docs with default theme, Pagefind search, sidebar generation, and layout overrides.
    href: /guide/docs-getting-started
    tag: Docs
---

## Philosophy

Pagesmith is built on a few core principles:

**Filesystem first.** Your content directory is the source of truth. Folders define structure, markdown files define pages, and companion assets live next to the content that references them. No database, no CMS admin panel — just files.

**Schema validation at the boundary.** Every piece of content is validated against a Zod schema before it enters your application. Frontmatter, structured data, and even AST-level content checks (links, headings, code blocks) are enforced at build time, not at render time.

**Lazy rendering.** Content entries load their data eagerly but render their markdown lazily. Call `entry.render()` only when you need the HTML. The result is cached — subsequent calls return instantly.

**Framework agnostic.** The content layer does not care about your rendering stack. Define collections once, consume them in React, Solid, Svelte, EJS, Handlebars, or the built-in JSX runtime. The Vite plugin provides virtual module imports; the programmatic API works without Vite.

**Vite native.** Everything runs through Vite — development server, HMR, SSG builds, and asset processing. No custom bundler, no webpack, no intermediate build steps.

**Zero client-side runtime by default.** The default output is static HTML with inline styles for code blocks. Progressive enhancements (TOC highlighting, search, sidebar toggle) are opt-in and tiny.

## Two Packages

| Package | Purpose | Install |
|---|---|---|
| `@pagesmith/core` | Content layer, markdown pipeline, JSX runtime, CSS, Vite plugin | `npm add @pagesmith/core` |
| `@pagesmith/docs` | Convention-based docs site with theme, search, navigation | `npm add @pagesmith/docs` |

Use `@pagesmith/docs` when you want a complete docs site from configuration alone. Use `@pagesmith/core` when you need custom layouts, framework-specific rendering, or a non-documentation site.

## Quick Start

### Docs Site (interactive setup)

```bash
npm add @pagesmith/docs
npx pagesmith init
```

The interactive init prompts for project name, title, base path, content directory, search, and AI integrations — with smart defaults detected from your git remote and `package.json`. Press Enter to accept defaults or type a new value.

To skip prompts and accept all defaults:

```bash
npx pagesmith init -y
```

Then start the dev server:

```bash
npx pagesmith dev
```

### Custom Site (any framework)

```bash
npm add @pagesmith/core
```

Define collections in `content.config.ts`, configure Vite with `pagesmithContent` and `pagesmithSsg`, and write your own layouts. See the [Framework Guides](/guide/frameworks) for complete setup instructions for React, Solid, Svelte, EJS, and Handlebars.

## Next Steps

- [Choose Your Path](/guide/choose-your-path) — pick AI-first or manual setup for docs vs custom sites
- [AI Assistants](/guide/ai-assistants) — install assistant context files and workflows
- [Prompts Cookbook](/guide/prompts-cookbook) — copy-paste prompts for common tasks
- [MCP Setup](/guide/mcp-setup) — connect your assistant to docs-aware tooling
- [Getting Started](/guide/getting-started) — define your first collection and content layer
- [Code Blocks](/guide/code-blocks) — syntax highlighting, line numbers, tabs, and more
- [Framework Guides](/guide/frameworks) — complete setup instructions for every supported framework
- [Layout Overrides](/guide/layout-overrides) — customize the docs theme with your own layouts
- [Deployment](/deployment) — deploy to GitHub Pages, Netlify, Vercel, or Cloudflare
- [Troubleshooting](/guide/troubleshooting) — common issues and solutions
- [API Reference](/reference/api) — the full API surface for `@pagesmith/core`
