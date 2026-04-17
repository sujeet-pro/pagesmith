---
title: Agent Prompts Cookbook
description: Copy-paste prompts for common Pagesmith tasks with your AI assistant
order: 3
---

# Agent Prompts Cookbook

Ready-to-use prompts for AI assistants. Paste these directly into your agent. Each prompt points to the installed package docs so the agent can use version-matched guidance.

If you are still deciding which package to adopt, start with [Choose Your Path](/guide/choose-your-path).

## Project Setup

### Core-first content layer

| Source | Value |
|---|---|
| Package path | `node_modules/@pagesmith/core/skills/pagesmith-core-setup/references/setup-core.md` |
| Hosted URL | [https://projects.sujeet.pro/pagesmith/prompts/setup-core.md](https://projects.sujeet.pro/pagesmith/prompts/setup-core.md) |

```text
Set up `@pagesmith/core` in this repository. Read `node_modules/@pagesmith/core/skills/pagesmith-core-setup/references/setup-core.md` first and follow it exactly. Keep the work focused on collections, schemas, `createContentLayer()`, and either `entry.render()` or `pagesmithContent` for Vite. If the repo also needs the shared Pagesmith site layer, tell me before adding `@pagesmith/site`.
```

### Custom site on top of core

| Source | Value |
|---|---|
| Package path | `node_modules/@pagesmith/site/skills/pagesmith-site-setup/references/setup-site.md` |
| Hosted URL | [https://projects.sujeet.pro/pagesmith/prompts/setup-site.md](https://projects.sujeet.pro/pagesmith/prompts/setup-site.md) |

```text
Set up `@pagesmith/site` in this repository. Read `node_modules/@pagesmith/site/skills/pagesmith-site-setup/references/setup-site.md` first and follow it exactly. Keep the app-facing integration on `@pagesmith/site` for content collections, markdown rendering, Vite wiring, and the JSX/runtime layer unless this repo explicitly wants the lower-level headless-only `@pagesmith/core` package instead.
```

### Docs site for a repo

| Source | Value |
|---|---|
| Package path | `node_modules/@pagesmith/docs/skills/pagesmith-docs-setup/references/setup-docs.md` |
| Hosted URL | [https://projects.sujeet.pro/pagesmith/prompts/setup-docs.md](https://projects.sujeet.pro/pagesmith/prompts/setup-docs.md) |

```text
Set up docs for this repository using `@pagesmith/docs`. Read `node_modules/@pagesmith/docs/skills/pagesmith-docs-setup/references/setup-docs.md` first and follow it exactly. Prefer `npx pagesmith-docs init --yes --ai` with explicit values when that fits the repo. Keep `pagesmith.config.json5` at the repo root, preserve useful existing docs content, and verify the docs build before finishing.
```

### Upgrade an existing docs integration

```text
Upgrade the existing `@pagesmith/docs` integration in this repository. Read `node_modules/@pagesmith/docs/skills/pagesmith-docs-setup/references/migration.md` first and follow it exactly. Keep the existing `pagesmith.config.json5` location and docs tree unless a schema or config issue requires a change. Revalidate `origin`, `basePath`, docs scripts, AI pointers, and schema usage before finishing.
```

## AI Context Installation

### Add AI files to a core or site project

```text
Install Pagesmith AI context in this repository. Use `npx pagesmith-core ai --profile default` so the project gets memory files, Markdown guidelines, and `llms.txt` / `llms-full.txt` without scaffolding a docs site. Then update `CLAUDE.md` / `AGENTS.md` pointers to the installed package guidance.
```

### Add AI files to a docs project

```text
Install or refresh Pagesmith AI context for this docs project. Use `npx pagesmith-docs init --ai --no-llms` if the repo already maintains custom root `llms.txt` files, otherwise use `npx pagesmith-docs init --ai`. Preserve existing unmanaged content in memory files.
```

## Content And Docs Maintenance

### Refresh docs after implementation changes

```text
Update the Pagesmith-managed documentation for this repository to match the current implementation. Read the package setup prompt first, then update only the pages that are now stale. Preserve the existing docs structure unless a move is clearly necessary.
```

### Full docs refresh

```text
Run a full Pagesmith docs refresh for this repository. Read the package setup prompt, package usage docs, package references, and any schema files first. Then update navigation, docs pages, and AI context files together so the repo stays aligned for both humans and agents.
```

## Debugging Prompts

### Fix docs build failures

```text
The docs build is failing. Read `node_modules/@pagesmith/docs/skills/pagesmith-docs-setup/references/errors.md`, then run `npx pagesmith-docs build`, diagnose the root cause, fix it, and explain whether the problem came from config, content structure, frontmatter, schema validation, or layout files.
```

### Fix missing virtual content modules

```text
I am getting `Cannot find module 'virtual:content/...'`. Read `node_modules/@pagesmith/core/skills/pagesmith-core-setup/references/setup-core.md` and `node_modules/@pagesmith/core/REFERENCE.md`, then verify the collection name, `pagesmithContent` wiring, and the exported content config shape.
```

### Configure MCP for docs tools

```text
Configure the Pagesmith docs MCP server for this project. Use `pagesmith-docs mcp --stdio`, wire it into the editor or assistant configuration I am using, and explain which docs-aware MCP tools that enables.
```

## Related Pages

- [Choose Your Path](/guide/choose-your-path)
- [AI Assistants](/guide/ai-assistants)
- [Docs CLI Reference](/reference/docs-cli)
