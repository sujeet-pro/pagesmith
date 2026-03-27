---
title: "CLI Reference"
description: "Command-line interface reference"
publishedDate: 2026-03-01T00:00:00.000Z
lastUpdatedOn: 2026-03-20T00:00:00.000Z
tags:
  - reference
  - cli
---

# CLI Reference

The `pagesmith` CLI provides commands for building, serving, and managing your site.

## Commands

### pagesmith build

Build your site for production.

```bash
pagesmith build [options]
```

| Option | Description |
|--------|-------------|
| `--parallel` | Enable parallel rendering |

### pagesmith dev

Start the development server with hot reload.

```bash
pagesmith dev
```

### pagesmith preview

Preview the production build locally.

```bash
pagesmith preview
```

### pagesmith validate

Run content validation checks.

```bash
pagesmith validate [options]
```

### pagesmith diagrams

Render diagram files (mermaid, excalidraw, drawio).

```bash
pagesmith diagrams [folder] [options]
```

| Option | Description |
|--------|-------------|
| `-f, --force` | Force re-render all |
| `-w, --watch` | Watch for changes |
| `-t, --type` | Filter by type |
