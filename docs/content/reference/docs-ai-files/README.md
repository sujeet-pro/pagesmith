---
title: Docs AI Prompt and Schemas
description: Version-matched prompt and schema files for bootstrapping or upgrading @pagesmith/docs integrations with AI agents.
---

# Docs AI Prompt and Schemas

`@pagesmith/docs` now ships dedicated setup and upgrade prompts plus version-matched JSON schemas so an agent can bootstrap or upgrade a docs integration without guessing the expected file layout.

## Setup Prompt

Use this prompt file when you want an agent to set up docs in an existing repository:

| Location            | Value                                                                                                                      |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| Package path        | `node_modules/@pagesmith/docs/skills/pagesmith-docs-setup/references/setup-docs.md`                                        |
| Hosted URL          | [https://projects.sujeet.pro/pagesmith/prompts/setup-docs.md](https://projects.sujeet.pro/pagesmith/prompts/setup-docs.md) |
| Source in this repo | `packages/docs/skills/pagesmith-docs-setup/references/setup-docs.md`                                                       |

The docs site now exposes two ready-to-use agent flows:

- Bootstrap or retrofit docs in a repository that does not already use `@pagesmith/docs`
- Upgrade an existing `@pagesmith/docs` integration and adopt compatible new guidance/features

## Upgrade Prompt

Use this prompt file when the repository already uses `@pagesmith/docs` and you want an agent to upgrade the package, refresh AI artifacts, and adopt compatible new guidance/features:

| Location            | Value                                                                              |
| ------------------- | ---------------------------------------------------------------------------------- |
| Package path        | `node_modules/@pagesmith/docs/skills/pagesmith-docs-setup/references/migration.md` |
| Source in this repo | `packages/docs/skills/pagesmith-docs-setup/references/migration.md`                |

Recommended instruction:

```text
Upgrade the existing @pagesmith/docs integration in this repository. Read node_modules/@pagesmith/docs/skills/pagesmith-docs-setup/references/migration.md first and follow it exactly.
```

## Recommended Agent Instruction

Use a prompt like this:

```text
Set up docs using Pagesmith for this repository. Read https://projects.sujeet.pro/pagesmith/prompts/setup-docs.md first and follow it exactly.
```

If the package is already installed and you want the version-matched local copy instead of the hosted one:

```text
Set up docs using Pagesmith for this repository. Read node_modules/@pagesmith/docs/skills/pagesmith-docs-setup/references/setup-docs.md first and follow it exactly.
```

## Version-Matched Schemas

These schema files are useful when an agent is editing `pagesmith.config.json5`, `meta.json5`, or docs frontmatter:

| Schema           | Package path                                                             | Hosted URL                                                                                                                                                         |
| ---------------- | ------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Docs config      | `node_modules/@pagesmith/docs/schemas/pagesmith-config.schema.json`      | [https://projects.sujeet.pro/pagesmith/schemas/pagesmith-config.schema.json](https://projects.sujeet.pro/pagesmith/schemas/pagesmith-config.schema.json)           |
| Root meta        | `node_modules/@pagesmith/docs/schemas/docs-root-meta.schema.json`        | [https://projects.sujeet.pro/pagesmith/schemas/docs-root-meta.schema.json](https://projects.sujeet.pro/pagesmith/schemas/docs-root-meta.schema.json)               |
| Section meta     | `node_modules/@pagesmith/docs/schemas/docs-section-meta.schema.json`     | [https://projects.sujeet.pro/pagesmith/schemas/docs-section-meta.schema.json](https://projects.sujeet.pro/pagesmith/schemas/docs-section-meta.schema.json)         |
| Page frontmatter | `node_modules/@pagesmith/docs/schemas/docs-page-frontmatter.schema.json` | [https://projects.sujeet.pro/pagesmith/schemas/docs-page-frontmatter.schema.json](https://projects.sujeet.pro/pagesmith/schemas/docs-page-frontmatter.schema.json) |
| Home frontmatter | `node_modules/@pagesmith/docs/schemas/docs-home-frontmatter.schema.json` | [https://projects.sujeet.pro/pagesmith/schemas/docs-home-frontmatter.schema.json](https://projects.sujeet.pro/pagesmith/schemas/docs-home-frontmatter.schema.json) |

## Bundled Agent Indexes

Every release ships a compact AI index (`llms.txt`) and a full-context bundle (`llms-full.txt`) both at the site root and per package. Agents can fetch whichever surface they need without installing the package:

| URL                                                                    | What it exposes                                                 |
| ---------------------------------------------------------------------- | --------------------------------------------------------------- |
| [/pagesmith/llms.txt](/llms.txt)                                       | Compact repo-wide AI index (home, guide, reference, deployment) |
| [/pagesmith/llms-full.txt](/llms-full.txt)                             | Full repo-wide AI context, concatenated pages                   |
| [/pagesmith/packages/core/llms.txt](/packages/core/llms.txt)           | Compact `@pagesmith/core` index                                 |
| [/pagesmith/packages/core/llms-full.txt](/packages/core/llms-full.txt) | Full `@pagesmith/core` AI context                               |
| [/pagesmith/packages/site/llms.txt](/packages/site/llms.txt)           | Compact `@pagesmith/site` index                                 |
| [/pagesmith/packages/site/llms-full.txt](/packages/site/llms-full.txt) | Full `@pagesmith/site` AI context                               |
| [/pagesmith/packages/docs/llms.txt](/packages/docs/llms.txt)           | Compact `@pagesmith/docs` index                                 |
| [/pagesmith/packages/docs/llms-full.txt](/packages/docs/llms-full.txt) | Full `@pagesmith/docs` AI context                               |

These are emitted by the [`assets` passthrough](../docs-config/README.md) in `pagesmith.config.json5` and covered by the repo's `validate:pagesmith` script so every bundled URL stays referenced from documentation.

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

- [AI Assistants](../../guide/ai-assistants/README.md)
- [Agent Prompts Cookbook](../../guide/prompts-cookbook/README.md)
- [Docs Configuration Reference](../docs-config/README.md)
- [Page Frontmatter Reference](../frontmatter/README.md)
