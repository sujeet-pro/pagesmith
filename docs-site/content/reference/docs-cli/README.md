---
title: Docs CLI Reference
description: pagesmith-docs CLI for init, dev, build, preview, and mcp — install, flags, and command behavior for docs projects using @pagesmith/docs.
---

# Docs CLI Reference

Docs projects use the package-owned `pagesmith-docs` CLI from `@pagesmith/docs`. It is the canonical command surface for scaffolding, developing, building, previewing, and exposing docs-aware MCP tools.

## Installation

```bash title="Terminal"
npm add @pagesmith/docs
```

Then run commands with `npx pagesmith-docs ...` or through package scripts.

## Command Summary

```bash title="Terminal"
pagesmith-docs init [options]
pagesmith-docs dev [options]
pagesmith-docs build [options]
pagesmith-docs preview [options]
pagesmith-docs validate [options]
pagesmith-docs mcp --stdio [options]
```

## Configuration File

`pagesmith-docs` resolves the config file in this order (first match wins):

1. `--config <path>` (explicit override)
2. `pagesmith.config.ts` (loaded via `jiti`, supports `defineConfig`)
3. `pagesmith.config.mts`
4. `pagesmith.config.mjs`
5. `pagesmith.config.js`
6. `pagesmith.config.json5`
7. `pagesmith.config.json`

```ts title="pagesmith.config.ts"
import { defineConfig } from '@pagesmith/docs'

export default defineConfig({
  name: 'my-docs',
  title: 'My Docs',
  origin: 'https://example.com',
  basePath: '/my-docs',
})
```

`init` writes a JSON5 file. When you already have a `.ts`/`.js` config, init reads it for prompt defaults but does not overwrite the file — the user owns code-shaped configs.

## How The Commands Fit Together

Notice that `init` is a setup step you can rerun safely, `dev`/`build`/`preview` form the main docs workflow, and `mcp --stdio` is a separate path for assistant tooling rather than static-site output.

![Docs CLI lifecycle showing init feeding the dev to build to preview workflow, with mcp as a separate tooling path](./diagrams/command-lifecycle-light.svg "Docs CLI lifecycle showing init feeding the dev to build to preview workflow, with mcp as a separate tooling path")
![Docs CLI lifecycle showing init feeding the dev to build to preview workflow, with mcp as a separate tooling path](./diagrams/command-lifecycle-dark.svg)

## `pagesmith-docs init`

Use `init` when you want Pagesmith to scaffold or backfill a docs project.

What it does:

1. Creates or updates `pagesmith.config.json5`.
2. Adds the `$schema` reference to `node_modules/@pagesmith/docs/schemas/pagesmith-config.schema.json`.
3. Scaffolds starter content when the expected docs pages are missing.
4. Detects GitHub Pages-friendly defaults from the repo name and git remote.
5. Optionally installs AI artifacts with `--ai`.

Common flags:

| Flag | Purpose |
|---|---|
| `-y`, `--yes` | Accept detected defaults without prompting |
| `--non-interactive` | Same as `--yes`, named for CI/CD pipelines |
| `--interactive` | Force prompts even when the environment looks non-TTY |
| `--ai` | Install AI memory files, skills, Markdown guidance, and `llms*.txt` |
| `--no-llms` | Skip `llms.txt` and `llms-full.txt` generation |
| `--config <path>` | Write the config to a non-default path |
| `--content-dir <path>` | Choose a specific docs directory |
| `--base-path <path>` | Override the detected GitHub Pages-style base path |
| `--origin <url>` | Override the detected site origin |

`init` runs as an interactive prompt by default when stdout and stdin are both
TTYs. It auto-falls back to non-interactive mode (using the detected defaults)
when `--yes` / `--non-interactive` is passed, when `CI=1` or
`PAGESMITH_NON_INTERACTIVE=1` is set, or when stdout/stdin are not TTYs. This
keeps CI/CD pipelines from blocking on a prompt.

In non-interactive mode `init` fails fast when `--name`, `--origin`, or
`--base-path` cannot be resolved from flags, the existing
`pagesmith.config.{ts,json5,...}`, or smart defaults (git remote, package.json
name, repo basename). The error message points at the missing flag and config
key so the failure is immediately actionable.

Examples:

```bash title="Terminal"
npx pagesmith-docs init
npx pagesmith-docs init --yes --ai
npx pagesmith-docs init --non-interactive --ai --content-dir docs --base-path /my-repo --origin https://my-user.github.io
CI=1 npx pagesmith-docs init --ai   # non-interactive auto-detected from env
```

`init` is safe to rerun. It backfills missing config fields instead of blindly replacing the whole file.

## `pagesmith-docs dev`

Starts the docs development server with live reload.

```bash title="Terminal"
npx pagesmith-docs dev
```

Common flags:

| Flag | Purpose |
|---|---|
| `--port <number>` | Change the dev port |
| `--open` | Open the browser automatically |
| `--config <path>` | Use a non-default config file |
| `--out-dir <path>` | Override the output directory |
| `--base-path <path>` | Override the configured base path |
| `--log-level <level>` | Set `silent`, `error`, `warn`, `info`, or `verbose` |

Use `dev` for content editing, layout work, navigation checks, and local theme iteration.

## `pagesmith-docs build`

Builds the full static docs site.

```bash title="Terminal"
npx pagesmith-docs build
```

The build resolves config, loads content and `meta.json5`, renders markdown through the shared Pagesmith pipeline, renders docs layouts, copies static assets, publishes markdown companion assets under preserved content-relative `/assets/...` paths, and runs Pagefind when search is enabled.

Examples:

```bash title="Terminal"
npx pagesmith-docs build
npx pagesmith-docs build --base-path /my-repo
BASE_URL=/my-repo npx pagesmith-docs build
```

Base-path precedence:

1. `--base-path`
2. `BASE_URL`
3. `basePath` in config
4. Git remote detection
5. `/`

## `pagesmith-docs preview`

Serves the built output directly from disk.

```bash title="Terminal"
npx pagesmith-docs preview
```

Use preview to verify production behavior such as built search assets, slashless routing, and `basePath` handling.

## `pagesmith-docs validate`

Runs the docs validator against your content and (optionally) the build output.

```bash title="Terminal"
npx pagesmith-docs validate
npx pagesmith-docs validate --content       # only content
npx pagesmith-docs validate --build         # only build output (after a build)
npx pagesmith-docs validate --full          # enable every opt-in offline check
```

Common flags:

| Flag | Purpose |
|---|---|
| `--content` | Only run content validation |
| `--build` | Only run build-output validation |
| `--full` | Enable every opt-in offline check (raster fallbacks, both trailing-slash forms, internal-links-must-be-markdown) |
| `--check-external` | Fetch external URLs and report non-2xx as warnings |
| `--require-theme-variants` | Enforce light + dark `<picture>` sources (default: on) |
| `--no-theme-variants` | Opt out of theme-variant checks |
| `--required-file <name>` | Require `<name>` in the build output (repeatable) |
| `--show-clean` | Also list files that pass content validation |

Validate exits non-zero on the first error so it works as a CI gate.

## `pagesmith-docs mcp --stdio`

Starts the docs-aware MCP server from `@pagesmith/docs`.

```bash title="Terminal"
npx pagesmith-docs mcp --stdio
```

Common flags:

| Flag | Purpose |
|---|---|
| `--config <path>` | Config used by the docs MCP tools |
| `--root <path>` | Project root for resolving config and content |

The server exposes tools such as:

- `docs_validate_config`
- `docs_resolve_config`
- `docs_list_pages`
- `docs_get_page`
- `docs_search_pages`

Version-matched resources exposed by the docs MCP server:

- `pagesmith://docs/agents/usage`
- `pagesmith://docs/llms-full`
- `pagesmith://docs/reference`
- `pagesmith://core/reference`

## Zero-Config Behavior

`pagesmith-docs dev`, `build`, `preview`, and `mcp --stdio` can run without `pagesmith.config.json5` when the project already follows the default conventions:

- `<repo-root>/docs` if it exists, otherwise `<repo-root>/content`
- standard docs pages like `README.md`
- optional `meta.json5` files for navigation
- default output under `gh-pages`

`init` is still the preferred way to make the contract explicit, add schema validation, and install AI artifacts.

## Recommended Scripts

```json title="package.json"
{
  "scripts": {
    "docs:dev": "pagesmith-docs dev",
    "docs:build": "pagesmith-docs build",
    "docs:preview": "pagesmith-docs preview"
  }
}
```

## Typical Workflow

```bash title="Terminal"
npx pagesmith-docs init --yes --ai
npx pagesmith-docs dev --open
npx pagesmith-docs build
npx pagesmith-docs preview
```

## Related References

- [Docs Getting Started](/guide/docs-getting-started)
- [AI Assistants](/guide/ai-assistants)
- [Prompts Cookbook](/guide/prompts-cookbook)
