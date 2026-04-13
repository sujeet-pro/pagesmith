---
title: Docs AI Prompt and Schemas
description: Version-matched prompt and schema files for bootstrapping or upgrading @pagesmith/docs integrations with AI agents.
---

# Docs AI Prompt and Schemas

`@pagesmith/docs` now ships dedicated setup and upgrade prompts plus version-matched JSON schemas so an agent can bootstrap or upgrade a docs integration without guessing the expected file layout.

## Setup Prompt

Use this prompt file when you want an agent to set up docs in an existing repository:

| Location | Value |
|---|---|
| Package path | `node_modules/@pagesmith/docs/ai-guidelines/setup-docs.md` |
| Hosted URL | [https://projects.sujeet.pro/pagesmith/prompts/setup-docs.md](https://projects.sujeet.pro/pagesmith/prompts/setup-docs.md) |
| Source in this repo | `packages/docs/ai-guidelines/setup-docs.md` |

The docs site now exposes two ready-to-use agent flows:

- Bootstrap or retrofit docs in a repository that does not already use `@pagesmith/docs`
- Upgrade an existing `@pagesmith/docs` integration and adopt compatible new guidance/features

## Upgrade Prompt

Use this prompt file when the repository already uses `@pagesmith/docs` and you want an agent to upgrade the package, refresh AI artifacts, and adopt compatible new guidance/features:

| Location | Value |
|---|---|
| Package path | `node_modules/@pagesmith/docs/ai-guidelines/migration.md` |
| Source in this repo | `packages/docs/ai-guidelines/migration.md` |

Recommended instruction:

```text
Upgrade the existing @pagesmith/docs integration in this repository. Read node_modules/@pagesmith/docs/ai-guidelines/migration.md first and follow it exactly.
```

## Recommended Agent Instruction

Use a prompt like this:

```text
Set up docs using Pagesmith for this repository. Read https://projects.sujeet.pro/pagesmith/prompts/setup-docs.md first and follow it exactly.
```

If the package is already installed and you want the version-matched local copy instead of the hosted one:

```text
Set up docs using Pagesmith for this repository. Read node_modules/@pagesmith/docs/ai-guidelines/setup-docs.md first and follow it exactly.
```

## Version-Matched Schemas

These schema files are useful when an agent is editing `pagesmith.config.json5`, `meta.json5`, or docs frontmatter:

| Schema | Package path | Hosted URL |
|---|---|---|
| Docs config | `node_modules/@pagesmith/docs/schemas/pagesmith-config.schema.json` | [https://projects.sujeet.pro/pagesmith/schemas/pagesmith-config.schema.json](https://projects.sujeet.pro/pagesmith/schemas/pagesmith-config.schema.json) |
| Root meta | `node_modules/@pagesmith/docs/schemas/docs-root-meta.schema.json` | [https://projects.sujeet.pro/pagesmith/schemas/docs-root-meta.schema.json](https://projects.sujeet.pro/pagesmith/schemas/docs-root-meta.schema.json) |
| Section meta | `node_modules/@pagesmith/docs/schemas/docs-section-meta.schema.json` | [https://projects.sujeet.pro/pagesmith/schemas/docs-section-meta.schema.json](https://projects.sujeet.pro/pagesmith/schemas/docs-section-meta.schema.json) |
| Page frontmatter | `node_modules/@pagesmith/docs/schemas/docs-page-frontmatter.schema.json` | [https://projects.sujeet.pro/pagesmith/schemas/docs-page-frontmatter.schema.json](https://projects.sujeet.pro/pagesmith/schemas/docs-page-frontmatter.schema.json) |
| Home frontmatter | `node_modules/@pagesmith/docs/schemas/docs-home-frontmatter.schema.json` | [https://projects.sujeet.pro/pagesmith/schemas/docs-home-frontmatter.schema.json](https://projects.sujeet.pro/pagesmith/schemas/docs-home-frontmatter.schema.json) |

## What The Prompt Enforces

The setup prompt tells the agent to:

- install `@pagesmith/docs` at the repo root
- prefer `npx pagesmith-docs init` with explicit values after installation when the repo is a good fit for the built-in scaffolder
- treat rerunning `npx pagesmith-docs init` as safe for backfilling missing config fields and refreshing the config `$schema`
- inspect the repo for an existing docs-like directory before creating a new one
- detect a GitHub Pages-style `origin` and `basePath` from the repo owner and repo name
- confirm the chosen docs folder with the user when an existing candidate is found
- create root `pagesmith.config.json5` with `$schema: './node_modules/@pagesmith/docs/schemas/pagesmith-config.schema.json'` and root `package.json` docs scripts
- scaffold a working home page plus `guide/` and `reference/` sections
- update `CLAUDE.md` and `AGENTS.md` so future sessions read the package guidance and schema files
- use `.pagesmith/markdown-guidelines.md` for markdown authoring once AI artifacts are installed

## Related Files

- [AI Assistants](/guide/ai-assistants)
- [Agent Prompts Cookbook](/guide/prompts-cookbook)
- [Docs Configuration Reference](/reference/docs-config)
- [Page Frontmatter Reference](/reference/frontmatter)
