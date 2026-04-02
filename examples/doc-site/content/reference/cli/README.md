---
title: "CLI Reference"
description: "Command-line interface reference"
publishedDate: 2026-03-01T00:00:00.000Z
lastUpdatedOn: 2026-03-27T00:00:00.000Z
tags:
  - reference
  - cli
---

# CLI Reference

The `pagesmith` CLI in `@pagesmith/docs` provides the docs-site commands.

## Commands

### pagesmith build

Build your docs site for production.

```bash
pagesmith build [options]
```

| Option | Description |
|--------|-------------|
| `--config <path>` | Path to `pagesmith.config.json5` |
| `--out-dir <path>` | Override the output directory |
| `--base-path <path>` | Override the configured base path |

### pagesmith dev

Start the development server with hot reload.

```bash
pagesmith dev [options]
```

| Option | Description |
|--------|-------------|
| `--config <path>` | Path to `pagesmith.config.json5` |
| `--port <number>` | Override the dev server port |
| `--open` | Open the browser on start |

### pagesmith preview

Preview the production build locally.

```bash
pagesmith preview [options]
```

| Option | Description |
|--------|-------------|
| `--config <path>` | Path to `pagesmith.config.json5` |
| `--port <number>` | Override the preview server port |
