---
title: Agent Prompts Cookbook
description: Copy-paste prompts for common Pagesmith tasks with your AI assistant
order: 3
---

# Agent Prompts Cookbook

Ready-to-use prompts for AI assistants (Claude, Codex, Gemini). Paste these directly into your agent. Each prompt is self-contained and references the installed package docs so the agent has full context.

If you are deciding between docs-first and core-first setup, start with [Choose Your Path](/guide/choose-your-path/).

## Project Setup

### New docs site from scratch

> Install `@pagesmith/docs` and run `npx pagesmith init --ai`. Accept defaults. Start the dev server with `npx pagesmith dev --open`.

### New custom site with React

> Install `@pagesmith/core`. Create `content.config.ts` with a markdown collection for `content/posts`. Set up `vite.config.ts` with `pagesmithContent` and `pagesmithSsg` plugins pointing to `./src/entry-server.tsx`. Create an SSR entry that imports from `virtual:content/posts` and renders with React. Read `node_modules/@pagesmith/core/docs/agents/usage.md` for the complete setup.

### New blog with the built-in JSX runtime

> Install `@pagesmith/core`. Create a blog using `createContentLayer` with the `BlogFrontmatterSchema`. Use `@pagesmith/core/jsx-runtime` for layouts and `@pagesmith/core/css/standalone` for styling. Read `node_modules/@pagesmith/core/docs/agents/usage.md` and look at `examples/blog-site/` for a complete working example.

### Add AI context to an existing project

> Run `npx pagesmith init --ai` to add AI assistant context files, markdown guidelines, and docs maintenance skills. This generates CLAUDE.md, AGENTS.md, GEMINI.md, and installs /update-docs and /ps-update-all-docs skills.

## Content Management

### Add a new docs section

> Add a new "{section-name}" section to the docs. Create `content/{section-name}/` with a `README.md` landing page and `meta.json5` for ordering. Add the section slug to the root `content/meta.json5` header links. Follow the existing section structure.

### Add a page to an existing section

> Add a new page called "{page-name}" to the "{section}" section. Create `content/{section}/{page-name}/README.md` with title and description frontmatter. Add "{page-name}" to the section's `meta.json5` articles array in the appropriate series.

### Scaffold docs from API code

> Read the source code in `src/` and generate documentation pages for each public API. For each exported function/class, create a page under `content/reference/` with: a description, parameters table, return type, and a usage example. Add pages to `content/reference/meta.json5`. Read `node_modules/@pagesmith/core/docs/agents/usage.md` for conventions.

### Write a tutorial from a code example

> Read the code in `examples/{example-name}/` and write a step-by-step tutorial that walks through the implementation. Cover: project setup, collection definition, template/component creation, and build configuration. Place it under `content/guide/` as a new page.

### Update docs after code changes

> Run `/update-docs` to scan the implementation and update documentation to match current code.

### Full docs refresh

> Run `/ps-update-all-docs` to regenerate all documentation, verify navigation ordering, and align AI context files across the repository.

## Schemas and Validation

### Create a custom collection schema

> Add a new "{name}" collection to `content.config.ts` using the `markdown` loader. Define a Zod schema with these fields: {list your fields}. Wire it into the Vite config with `pagesmithContent`. Read `node_modules/@pagesmith/core/docs/agents/usage.md` for collection definition options.

### Add computed fields to a collection

> Add computed fields to the "{collection}" collection that derive {field-name} from {source}. Use the `computed` option in `defineCollection` to add fields that are calculated at load time. Read `node_modules/@pagesmith/core/docs/agents/usage.md` for the computed fields API.

### Add custom content validators

> Create custom content validators for the "{collection}" collection that check for {rules}. Implement the `ContentValidator` interface with a `validate(context)` method that walks the MDAST tree. Add validators to the collection's `validators` array. Read `node_modules/@pagesmith/core/docs/agents/usage.md` for the validator API.

### Fix validation errors

> I'm getting validation errors: {paste error output}. Diagnose the root cause and fix it. Check the collection's Zod schema against the frontmatter in the failing file. Common issues: required fields missing, type mismatches, or extra fields with strict schemas.

## Configuration

### Add layout overrides

> Add custom layout overrides to this @pagesmith/docs site. Create `theme/layouts/DocPage.tsx` using `@pagesmith/core/jsx-runtime`. Register it in `pagesmith.config.json5` under `theme.layouts.page`. Read `node_modules/@pagesmith/docs/REFERENCE.md` for layout props.

### Configure markdown plugins

> Add a custom remark/rehype plugin to the markdown pipeline. Read `node_modules/@pagesmith/core/REFERENCE.md` for `MarkdownConfig` options. Configure it in the collection's `defineConfig` or in `pagesmith.config.json5` under `markdown`.

### Set up search customization

> Customize the Pagefind search settings. Update `pagesmith.config.json5` to configure `search.showImages`, `search.showSubResults`, and `search.pagefindFlags`. The search index is built during `pagesmith build` -- preview with `pagesmith preview`.

## Deployment

### Deploy to GitHub Pages

> Set up GitHub Pages deployment for this Pagesmith docs site. Set `basePath` in `pagesmith.config.json5` to `"/{repo-name}"`. Add a GitHub Actions workflow that installs dependencies, runs `npx pagesmith build`, and deploys the `gh-pages/` directory. Use `fetch-depth: 0` for accurate `lastUpdated` timestamps.

### Set up MCP server

> Configure the Pagesmith MCP server for AI-assisted docs management. Add this to `.claude/settings.json`: `{ "mcpServers": { "pagesmith": { "command": "npx", "args": ["pagesmith", "mcp", "--stdio"] } } }`. This gives tools for validating config, listing pages, and fetching page content.

## Review and Quality

### Review docs for accuracy

> Read every page under `content/` and compare against the current implementation in `packages/`. Flag any outdated information, missing features, or incorrect examples. For each issue, either fix the docs page or note what needs updating.

### Check docs navigation flow

> Read all `meta.json5` files and verify the navigation order makes sense for new users. The onboarding series should come first. Check that all pages referenced in meta.json5 exist and that no orphaned pages are missing from navigation.

### Audit frontmatter consistency

> Scan all markdown files under `content/` and check that frontmatter is consistent: all pages have `title`, descriptions are present where useful, `order` fields don't conflict within series. Report any issues and fix them.

## Troubleshooting

### Debug build failures

> The build is failing with this error: {paste error}. Read the error message, check the relevant config and content files, and diagnose the issue. Common causes: missing collection directory, schema mismatch, invalid frontmatter YAML, or missing Vite plugin.

### Debug dev server issues

> The dev server isn't {describe issue}. Check: is the file inside `contentDir`? Is the frontmatter valid YAML? Are there syntax errors in config files? Run `pagesmith build` to see if the issue is dev-specific or a general build problem.

### Debug missing virtual modules

> I'm getting "Cannot find module 'virtual:content/{name}'". Check that: the collection name in `content.config.ts` matches the import, `pagesmithContent` is registered in `vite.config.ts`, and the content.config exports a `defineCollections` default export.
