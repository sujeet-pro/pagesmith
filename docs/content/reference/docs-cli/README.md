# Docs CLI Reference

The `@pagesmith/docs` package provides a `pagesmith` CLI binary for developing, building, and previewing documentation sites. The CLI is the primary interface for working with `@pagesmith/docs` projects.

## Installation

Install `@pagesmith/docs` as a dev dependency in your project:

```bash title="Terminal"
npm install -D @pagesmith/docs
```

The `pagesmith` binary is then available via `npx`, npm scripts, or direct invocation from `node_modules/.bin/`.

## Commands

### pagesmith init

Initialize a new docs project interactively. Prompts for project name, title, base path, content directory, search, AI integrations, and starter content — with smart defaults detected from your git remote and `package.json`.

```bash title="Terminal"
pagesmith init [options]
```

**Interactive mode** (default):

```text title="Example session"
  Pagesmith v0.2.0

  Project name (my-project):
  Site title (My Project):
  Base path (/my-project):
  Content directory (docs):
  Enable search? (Y/n):
  Install AI integrations? (y/N):
  Create starter content? (Y/n):
```

Press Enter to accept the default shown in parentheses, or type a new value.

The init command creates:

1. **`pagesmith.config.json5`** — site configuration with the values you provided
2. **`docs/README.md`** — home page with frontmatter (if starter content enabled)
3. **`docs/guide/getting-started/README.md`** — starter getting-started page (if starter content enabled)

With AI integrations enabled, it additionally installs:

- `CLAUDE.md`, `AGENTS.md`, `GEMINI.md` — assistant memory files
- `.claude/skills/pagesmith/SKILL.md` — Claude `/pagesmith` skill
- `.claude/skills/update-docs/SKILL.md` — Claude `/update-docs` skill
- `.pagesmith/markdown-guidelines.md` — markdown authoring rules
- `llms.txt` and `llms-full.txt`

**Options:**

| Option | Type | Default | Description |
|---|---|---|---|
| `-y`, `--yes` | boolean | `false` | Skip prompts, accept all detected defaults |
| `--ai` | boolean | `false` | Pre-select AI integrations (works with both interactive and `-y` mode) |
| `--no-llms` | boolean | `false` | Skip `llms.txt` / `llms-full.txt` generation during AI install |
| `--config <path>` | string | `pagesmith.config.json5` | Path for the configuration file |

**Example:**

```bash title="Terminal"
# Interactive init — prompts for all options
pagesmith init

# Skip prompts, accept defaults
pagesmith init -y

# Skip prompts with AI integrations enabled
pagesmith init --ai -y
pagesmith init --ai --no-llms -y

# Init with a custom config path
pagesmith init --config ./docs/pagesmith.config.json5
```

The command is idempotent — it will not overwrite existing files. Run it safely on an existing project to fill in any missing files.

### pagesmith dev

Start a development server with file watching and live reload.

```bash title="Terminal"
pagesmith dev [options]
```

The dev server watches your `content/` directory and any referenced assets for changes. When a markdown file or configuration file changes, the site is rebuilt incrementally and the browser reloads automatically via a WebSocket connection.

**Options:**

| Option | Type | Default | Description |
|---|---|---|---|
| `--port <number>` | number | `3000` | Port number for the development server |
| `--config <path>` | string | `pagesmith.config.json5` | Path to the configuration file (resolved relative to cwd) |
| `--open` | boolean | `false` | Open the default browser when the server starts |
| `--out-dir <path>` | string | Config `outDir` | Override the output directory |
| `--base-path <path>` | string | Config `basePath` | Override the base URL path prefix |

**Example:**

```bash title="Terminal"
# Start dev server on the default port
pagesmith dev

# Start on a custom port and open the browser
pagesmith dev --port 8080 --open

# Use a specific config file
pagesmith dev --config ./docs/pagesmith.config.json5
```

The development server includes:

- A WebSocket-based live reload client injected into every page
- Automatic reconnection when the server restarts (retries after 1 second)
- Serving of static files from the `publicDir` directory
- Proper MIME type handling for common web file formats
- Serving of content companion assets (images referenced from markdown)

**How Live Reload Works:**

The dev server injects a small inline script into every page that opens a WebSocket connection to `ws://<host>/__ws`. When a file change is detected by the `chokidar` watcher, the server rebuilds the site model and sends a `{ type: 'reload' }` message over the WebSocket. The client script calls `location.reload()` on receiving this message. If the WebSocket connection closes (e.g., server restart), the client retries after 1 second.

### pagesmith build

Produce a full static build of the documentation site.

```bash title="Terminal"
pagesmith build [options]
```

The build process performs the following steps:

1. **Config resolution** -- Loads `pagesmith.config.json5`, resolves all paths to absolute, applies CLI overrides and environment variables
2. **Content discovery** -- Walks the content directory, reads `meta.json5` files for navigation order and section configuration
3. **Markdown processing** -- Parses each markdown file through the unified pipeline (remark + Expressive Code + rehype chain), extracts frontmatter, headings, and rendered HTML
4. **Site model construction** -- Builds navigation items, sidebar sections (grouped by content directory), page map, and prev/next links
5. **Page rendering** -- Renders each page through JSX theme layouts (DocHome, DocPage, DocNotFound, or custom layouts from `theme.layouts`)
6. **CSS bundling** -- Bundles theme CSS using LightningCSS with minification (targets Chrome 100+, Firefox 100+, Safari 16+)
7. **JS bundling** -- Bundles runtime JavaScript (sidebar toggle, TOC highlight, search)
8. **Static file copying** -- Copies `publicDir` contents and font assets from `@pagesmith/core` to the output
9. **Content asset copying** -- Copies companion assets (images) referenced from markdown to `output/assets/`
10. **Pagefind indexing** -- Runs the Pagefind binary on the output HTML to generate the search index (if `search.enabled` is true)

**Options:**

| Option | Type | Default | Description |
|---|---|---|---|
| `--config <path>` | string | `pagesmith.config.json5` | Path to the configuration file |
| `--out-dir <path>` | string | Config `outDir` | Override the output directory |
| `--base-path <path>` | string | Config `basePath` | Override the base URL path prefix |

**Example:**

```bash title="Terminal"
# Standard build
pagesmith build

# Build to a custom directory
pagesmith build --out-dir ./public

# Build for GitHub Pages deployment
pagesmith build --base-path /my-repo

# Build with BASE_URL environment variable
BASE_URL=/my-repo pagesmith build
```

### pagesmith preview

Serve a pre-built documentation site for local verification before deployment.

```bash title="Terminal"
pagesmith preview [options]
```

The preview server serves the previously built output directory as static files. This is useful for verifying the production build locally, especially when the site uses a `basePath` that changes link and asset resolution behavior.

**Options:**

| Option | Type | Default | Description |
|---|---|---|---|
| `--port <number>` | number | `4173` | Port number for the preview server |
| `--config <path>` | string | `pagesmith.config.json5` | Path to the configuration file (used to determine the output directory) |

**Example:**

```bash title="Terminal"
# Preview the built site
pagesmith preview

# Preview on a custom port
pagesmith preview --port 5000
```

### pagesmith mcp

Start a stdio MCP server backed by `@pagesmith/docs`.

```bash title="Terminal"
pagesmith mcp [options]
```

Use this to expose docs-aware tools to MCP-compatible assistants and editors.

**Options:**

| Option | Type | Default | Description |
|---|---|---|---|
| `--stdio` | boolean | `true` | Use stdio transport |
| `--config <path>` | string | `pagesmith.config.json5` | Config path used by MCP docs tools |
| `--root <path>` | string | current working directory | Project root for resolving config and content |

**Example:**

```bash title="Terminal"
# Start MCP server with default config
pagesmith mcp --stdio

# Start MCP server for another docs workspace
pagesmith mcp --stdio --root ./docs --config ./docs/pagesmith.config.json5
```

Tools exposed by the server include `docs_validate_config`, `docs_resolve_config`, `docs_list_pages`, and `docs_get_page`.

### pagesmith --help

Display the help text with all available commands and options.

```bash title="Terminal"
pagesmith --help
pagesmith -h
```

The help output shows:

```text title="Help Output"
pagesmith

Commands:
  init [options]                       Initialize a docs project (interactive)
  dev [options]                        Start a docs dev server
  build [options]                      Build a docs site
  preview [options]                    Preview the built docs site
  mcp [options]                        Start stdio MCP server for docs tooling

Init options:
  -y, --yes                           Skip prompts, use defaults
  --ai                                Install AI integrations (skills, guidelines)
  --no-llms                           Skip llms.txt / llms-full.txt generation during AI install
  --config <path>                     Config file path

Server options:
  --port <number>                     Server port (dev: 3000, preview: 4173)
  --open                              Open browser on server start
  --out-dir <path>                    Output directory (overrides config)
  --base-path <path>                  Base URL path prefix (overrides config)
  --config <path>                     Config file path

MCP options:
  --stdio                             Use stdio transport (default)
  --config <path>                     Config file path used by docs_* tools
  --root <path>                       Project root to resolve config/content paths
```

## Option Parsing

The CLI uses a custom argument parser (no external dependency). All options use `--long-name` format with short aliases for `-h` (`--help`), `-v` (`--version`), and `-y` (`--yes`).

Options that take a value require the value as the next argument (space-separated):

```bash title="Terminal"
# Correct
pagesmith dev --port 8080

# Incorrect (will error)
pagesmith dev --port=8080
```

Boolean options like `--open` do not take a value -- their presence sets the flag to `true`.

Unknown options (any flag starting with `-` that is not recognized) cause an immediate error:

```text
Unknown option: --unknown-flag
```

## Environment Variables

### BASE_URL

The `BASE_URL` environment variable sets the base URL path prefix for the built site. This is particularly useful in CI/CD environments where the deployment path is determined at build time.

```bash title="Terminal"
# GitHub Pages with repository-name prefix
BASE_URL=/pagesmith pagesmith build

# Subdirectory deployment
BASE_URL=/docs/v2 pagesmith build
```

The priority order for base path resolution is:

1. `--base-path` CLI flag (highest priority)
2. `BASE_URL` environment variable
3. `basePath` in `pagesmith.config.json5`
4. Default `"/"`

## Running via npm Scripts

The recommended way to use the CLI is through npm scripts in your `package.json`:

```json title="package.json"
{
  "scripts": {
    "dev": "pagesmith dev",
    "build": "pagesmith build",
    "preview": "pagesmith preview"
  }
}
```

Then run with:

```bash title="Terminal"
npm run dev
npm run build
npm run preview
```

## Running via npx

For quick usage without installing as a dependency:

```bash title="Terminal"
npx @pagesmith/docs dev
npx @pagesmith/docs build
npx @pagesmith/docs preview
```

## Configuration File Resolution

All commands look for `pagesmith.config.json5` in the current working directory by default. If the file is not found at the resolved path, the CLI exits with an error:

```text
No pagesmith.config.json5 file found at /path/to/pagesmith.config.json5
```

The resolution logic uses `path.resolve()` against the current working directory, so relative paths in `--config` are resolved from where you run the command.

Use the `--config` flag to point to a config file in a different location:

```bash title="Terminal"
pagesmith dev --config ./docs/pagesmith.config.json5
```

## Exit Codes

| Code | Meaning |
|---|---|
| `0` | Success |
| `1` | Error: unknown command, missing config file, invalid option value, or build failure |

The CLI wraps the top-level `main()` function in a `.catch()` handler that logs the error message and calls `process.exit(1)`. This means:

- Missing config files produce a clear error message before exiting
- Unknown commands produce `Unknown command: <name>`
- Unknown options produce `Unknown option: <flag>`
- Build failures (markdown errors, missing files, Pagefind errors) propagate their error messages

## Typical Workflow

```bash title="Terminal"
# 0. Initialize interactively (first time only)
pagesmith init

# 1. Start development
pagesmith dev --open

# 2. Edit content/ files -- browser auto-reloads

# 3. Build for production
pagesmith build

# 4. Verify the production build locally
pagesmith preview

# 5. Deploy the dist/ directory to your hosting provider
```
