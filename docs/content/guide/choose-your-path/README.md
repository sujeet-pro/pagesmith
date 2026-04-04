---
title: Choose Your Path
description: Pick the right Pagesmith package for your project
order: 1
---

# Choose Your Path

Need ready-to-run prompt templates for setup and maintenance? See the [Prompts Cookbook](/guide/prompts-cookbook/).

## Quick Start with AI (Recommended)

Paste one of these prompts into your AI assistant (Claude, Codex, Gemini) and you'll have a working site in under 2 minutes:

**Documentation site:**

> Install `@pagesmith/docs` and run `npx pagesmith init --ai`. Accept defaults. Start the dev server with `npx pagesmith dev --open`.

**Custom site with a framework (React, Solid, Svelte, etc.):**

> Install `@pagesmith/core` and set up a content layer with Vite plugins. Read `node_modules/@pagesmith/core/docs/agents/usage.md` for the full setup guide, then scaffold a blog with a markdown collection.

That's it. The AI assistant will create the config, content structure, collections, and AI context files. Read on if you want to understand the details or decide manually.

---

## Understanding the Two Packages

Pagesmith offers two packages for different needs.

### @pagesmith/docs — Convention-based docs

Use this for documentation sites where configuration replaces custom code.

**You get:** Navigation from folder structure, Pagefind search, dark mode, responsive layout, and a polished default theme -- all from a single `pagesmith.config.json5` file.

**Best for:** API docs, project documentation, knowledge bases, guides.

**AI setup:** `npx pagesmith init --ai` generates everything including Claude/Codex/Gemini context files and docs maintenance skills.

-> [Manual setup guide](/guide/docs-getting-started/)

### @pagesmith/core — Full control with any framework

Use this for custom sites with schema-validated collections, a rich markdown pipeline, and Vite plugins.

**You get:** Full control over layout, styling, and rendering. Use React, Solid, Svelte, EJS, Handlebars, or the built-in JSX runtime.

**Best for:** Blogs, portfolios, marketing sites, custom documentation.

**AI setup:** Ask your agent to read `node_modules/@pagesmith/core/docs/agents/usage.md` for step-by-step scaffolding.

-> [Manual setup guide](/guide/getting-started/)

## Decision Matrix

| Question | @pagesmith/docs | @pagesmith/core |
|----------|----------------|-----------------|
| Do I need custom layouts? | Optional overrides | Full control |
| Do I need a specific framework? | Not needed | React, Solid, Svelte, etc. |
| How fast to get started? | 1 command | ~30 minutes manual, ~2 min with AI |
| Search built in? | Yes (Pagefind) | Add it yourself |
| Navigation from folders? | Automatic | Build your own |
| MCP server included? | Yes | Yes |

**Start with `@pagesmith/docs`** if you're unsure -- you can always drop down to `@pagesmith/core` later for more control.

## What to Read Next

- [AI Assistants](/guide/ai-assistants/) -- install AI context files and skills
- [Prompts Cookbook](/guide/prompts-cookbook/) -- ready-to-use prompts for common tasks
- [MCP Setup](/guide/mcp-setup/) -- connect AI assistants to your docs via MCP
