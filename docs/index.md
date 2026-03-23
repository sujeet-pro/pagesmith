---
layout: home

hero:
  name: Pagesmith
  text: File-Based CMS for the Filesystem-First Web
  tagline: Typed content collections, lazy markdown rendering, diagramkit-powered diagrams, and installable AI companion files.
  actions:
    - theme: brand
      text: Get Started
      link: /guide/getting-started
    - theme: alt
      text: AI Assistants
      link: /guide/ai-assistants
    - theme: alt
      text: API Reference
      link: /reference/api

features:
  - title: Proper FS-CMS
    details: Model markdown, JSON, JSONC, JSON5, YAML, TOML, and custom loaders with Zod-backed schemas and collection APIs.
  - title: Diagramkit by Default
    details: Render Mermaid, Excalidraw, and Draw.io files through diagramkit instead of maintaining a second diagram pipeline inside Pagesmith.
  - title: AI-Ready Installs
    details: Install project-level or user-level context for Claude, Codex, Gemini CLI, plus llms.txt and llms-full.txt from a single CLI/API surface.
  - title: Runtime Agnostic
    details: Use the content layer from React, Solid, Svelte, vanilla builds, Node, Bun, Deno, or the optional pagesmith SSG.
---

## Why Pagesmith

Pagesmith is a filesystem-first content management system built around `@pagesmith/content`. It treats your content tree as the source of truth, validates it with schemas and AST-level checks, and renders markdown only when you ask for it.

The repo also ships `@pagesmith/core` for the markdown/runtime primitives and `pagesmith` as an optional static-site generator. If you are adopting Pagesmith for an app, start with `@pagesmith/content`.

## Install

```bash
npm add @pagesmith/content diagramkit
```

If you are developing against the unpublished local `diagramkit` checkout used by this repo, install it as a file dependency instead:

```bash
vp add diagramkit@file:../diagramkit
```

## Next Stops

- [/guide/getting-started](/guide/getting-started) for your first collection and content layer
- [/guide/diagramkit](/guide/diagramkit) for diagram rendering
- [/guide/ai-assistants](/guide/ai-assistants) for Claude, Codex, Gemini CLI, and `llms.txt`
- [/reference/api](/reference/api) for the full API surface
