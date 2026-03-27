---
layout: DocHome
title: Pagesmith
tagline: File-Based CMS for the Filesystem-First Web
description: Typed content collections, lazy markdown rendering, diagramkit-powered diagrams, and installable AI companion files.
actions:
  - text: Get Started
    link: /guide/getting-started
    theme: brand
  - text: AI Assistants
    link: /guide/ai-assistants
    theme: alt
  - text: API Reference
    link: /reference/api
    theme: alt
features:
  - title: Proper FS-CMS
    details: Model markdown, JSON, JSONC, JSON5, YAML, TOML, and custom loaders with Zod-backed schemas and collection APIs.
  - title: Diagramkit by Default
    details: Render Mermaid, Excalidraw, and Draw.io files through diagramkit instead of maintaining a second diagram pipeline inside Pagesmith.
  - title: AI-Ready Installs
    details: Install project-level or user-level context for Claude, Codex, Gemini CLI, plus llms.txt and llms-full.txt from a single CLI/API surface.
  - title: Runtime Agnostic
    details: Use the content layer from React, Solid, Svelte, vanilla builds, Node, Bun, or Deno.
---

## Why Pagesmith

Pagesmith is a filesystem-first content management system organized as a multi-package workspace under the `@pagesmith/` npm scope. Two main packages: `@pagesmith/core` for custom layout sites and `@pagesmith/docs` for convention-based documentation. It treats your content tree as the source of truth, validates it with schemas and AST-level checks, and renders markdown only when you ask for it.

## Install

```bash
npm add @pagesmith/core diagramkit
```

If you are developing against a local `diagramkit` checkout, link it instead:

```bash
npm run link:diagramkit
```

## Next Stops

- [/guide/getting-started](/guide/getting-started) for your first collection and content layer
- [/guide/diagramkit](/guide/diagramkit) for diagram rendering
- [/guide/ai-assistants](/guide/ai-assistants) for Claude, Codex, Gemini CLI, and `llms.txt`
- [/reference/api](/reference/api) for the full API surface
