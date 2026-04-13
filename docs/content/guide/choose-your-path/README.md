---
title: Choose Your Path
description: Pick the right Pagesmith package for your project
order: 1
---

# Choose Your Path

Need ready-to-run prompt templates for setup and maintenance? See the [Prompts Cookbook](/guide/prompts-cookbook/).

Use this diagram as the fast filter: docs-first projects go to `@pagesmith/docs`, host-owned apps start with `@pagesmith/core`, and `@pagesmith/site` is the extra site layer when that core-based app also wants shared JSX, CSS/runtime, and Vite SSG helpers.

<figure>
  <img src="./diagrams/package-decision-path-light.svg" class="only-light" alt="Package decision paths: docs-first to @pagesmith/docs, host-owned shell to @pagesmith/core, optional @pagesmith/site for shared JSX, CSS, runtime, and Vite SSG helpers">
  <img src="./diagrams/package-decision-path-dark.svg" class="only-dark" alt="Package decision paths: docs-first to @pagesmith/docs, host-owned shell to @pagesmith/core, optional @pagesmith/site for shared JSX, CSS, runtime, and Vite SSG helpers">
  <figcaption>Match the branch to your goal: notice who owns the site shell versus when you want the full docs preset and navigation.</figcaption>
</figure>

## AI-First Starting Point

Pick the package that matches your goal, then give your agent the package-owned setup prompt instead of a vague install request.

### `@pagesmith/docs`

Use this when you want a docs site with config, conventions, navigation, search, and the default docs theme.

Copy-paste prompt:

> Install `@pagesmith/docs`, then read `node_modules/@pagesmith/docs/ai-guidelines/setup-docs.md` and follow it exactly. Use `npx pagesmith-docs init --yes --ai` for bootstrap work, keep `pagesmith.config.json5` at the repo root, and explain any GitHub Pages `origin` or `basePath` decisions before finishing.

### `@pagesmith/site`

Use this when you want a custom site on top of `@pagesmith/core` and also want the shared Pagesmith site layer: JSX runtime, CSS/runtime bundles, Vite SSG helpers, or a preset-driven `pagesmith-site` workflow.

Copy-paste prompt:

> Install `@pagesmith/core` and `@pagesmith/site`, then read `node_modules/@pagesmith/site/ai-guidelines/setup-site.md` and follow it exactly. Keep content collections on `@pagesmith/core`, use `@pagesmith/site` for the site layer only, and choose between a Vite SSG setup or a framework-hosted setup based on the repo.

### `@pagesmith/core`

Use this when the host app already owns routing, layout, or build tooling and only needs Pagesmith as a typed content layer plus markdown pipeline.

Copy-paste prompt:

> Install `@pagesmith/core`, then read `node_modules/@pagesmith/core/ai-guidelines/setup-core.md` and follow it exactly. Keep the work focused on collections, schemas, `createContentLayer()`, and either `entry.render()` or `pagesmithContent` for Vite.

## Package Roles

### `@pagesmith/core` — Content Layer

Owns:

- collection definitions and schemas
- filesystem loading
- markdown rendering and validators
- `pagesmithContent` for Vite

Best for:

- Next.js or framework-hosted markdown
- custom SSR apps
- projects that want typed content data without a Pagesmith-owned site shell

Manual guide: [Getting Started](/guide/getting-started/)

### `@pagesmith/site` — Site Toolkit

Owns:

- `pagesmith-site`
- `@pagesmith/site/jsx-runtime`
- `@pagesmith/site/css/*`
- `@pagesmith/site/runtime/*`
- `@pagesmith/site/vite`

Best for:

- custom static sites on top of core
- projects that want the shared Pagesmith presentation layer
- preset-driven site workflows

### `@pagesmith/docs` — Docs Preset

Owns:

- `pagesmith-docs`
- `pagesmith.config.json5`
- docs navigation from folders and `meta.json5`
- built-in Pagefind search
- docs layouts, schema files, and docs MCP

Best for:

- documentation sites
- product guides
- API references
- knowledge bases

Manual guide: [Docs Getting Started](/guide/docs-getting-started/)

## Decision Matrix


| Question                                        | `@pagesmith/core` | `@pagesmith/site` | `@pagesmith/docs` |
| ----------------------------------------------- | ----------------- | ----------------- | ----------------- |
| Do I already have my own router/build?          | Yes               | Maybe             | Usually no        |
| Do I want Pagesmith to own the site shell?      | No                | Partly            | Yes               |
| Do I need built-in docs navigation and search?  | No                | No                | Yes               |
| Do I want shared Pagesmith CSS/runtime and JSX? | Optional via site | Yes               | Included          |
| Canonical CLI                                   | `pagesmith-core`  | `pagesmith-site`  | `pagesmith-docs`  |
| Fastest AI entrypoint                           | `setup-core.md`   | `setup-site.md`   | `setup-docs.md`   |


Start with `@pagesmith/docs` when the project is truly docs-first. Start with `@pagesmith/core` when the host app already owns the shell. Add `@pagesmith/site` only when that core-based app also wants the shared Pagesmith site layer.

## What To Read Next

- [AI Assistants](/guide/ai-assistants/) for package-owned AI setup flows
- [Prompts Cookbook](/guide/prompts-cookbook/) for copy-paste prompts
- [Getting Started](/guide/getting-started/) for core-first integrations
- [Docs Getting Started](/guide/docs-getting-started/) for docs-first integrations
- [Next.js (App Router)](/guide/framework-nextjs/) for a framework-hosted core example
