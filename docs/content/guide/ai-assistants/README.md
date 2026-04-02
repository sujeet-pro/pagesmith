# AI Assistants

Pagesmith exposes installable assistant context through `@pagesmith/core/ai`. This lets AI coding assistants understand the Pagesmith API, conventions, and project structure when helping you write content or code.

That gives you:

- assistant memory files
- assistant-specific skill or command files
- `llms.txt`
- `llms-full.txt`

## Profiles

The installer supports two profiles that control what content is generated:

| Profile | Description | Memory content |
|---|---|---|
| `default` | For projects using `@pagesmith/core` directly | Core API reference, content layer usage, Vite plugin config, collection definitions, markdown pipeline, JSX runtime, CSS exports |
| `docs` | For projects using `@pagesmith/docs` | Everything in `default` plus docs CLI, `pagesmith.config.json5` format, `meta.json5` navigation, layout overrides, search configuration, theme customization |

Set the profile with the `profile` option:

```ts
installAiArtifacts({
  assistants: ['claude'],
  scope: 'project',
  profile: 'docs', // or 'default'
})
```

## What the Memory Files Contain

Memory files give assistants persistent context about Pagesmith. They include:

- **Project structure** -- package layout, entry points, export map, directory conventions
- **API reference** -- `createContentLayer`, `defineCollection`, `defineConfig`, `processMarkdown`, content entry types, validation types
- **Coding conventions** -- ESM-only, trailing commas, Zod schemas, CSS custom properties, named exports
- **Markdown pipeline** -- the full plugin chain order, Expressive Code features, code block meta syntax
- **Configuration formats** -- `content.config.ts` for core, `pagesmith.config.json5` for docs

## Supported Assistants

### Claude

Files installed:

| Scope | File | Purpose |
|---|---|---|
| Project | `CLAUDE.md` | Project-level memory loaded automatically by Claude Code |
| Project | `.claude/commands/pagesmith.md` | Custom slash command for Pagesmith-specific prompts |
| User | `~/.claude/CLAUDE.md` | User-level memory applied across all projects |
| User | `~/.claude/commands/pagesmith.md` | User-level custom command |

Claude Code reads `CLAUDE.md` automatically when working in the project directory. The custom command is available as `/pagesmith` in Claude Code.

### Codex

Files installed:

| Scope | File | Purpose |
|---|---|---|
| Project | `AGENTS.md` | Project instructions for Codex |
| Project | `.codex/skills/pagesmith/SKILL.md` | Reusable Pagesmith skill |
| User | `~/.codex/AGENTS.md` | User-level instructions |
| User | `~/.codex/skills/pagesmith/SKILL.md` | User-level skill |

### Gemini CLI

Files installed:

| Scope | File | Purpose |
|---|---|---|
| Project | `GEMINI.md` | Project memory for Gemini CLI |
| Project | `.gemini/commands/pagesmith.toml` | Custom TOML command |
| User | `~/.gemini/GEMINI.md` | User-level memory |
| User | `~/.gemini/commands/pagesmith.toml` | User-level command |

## Project-Level Install

Install everything into the current project:

```ts
import { installAiArtifacts } from '@pagesmith/core/ai'

installAiArtifacts({
  assistants: ['claude', 'codex', 'gemini'],
  scope: 'project',
})
```

Installed files:

- Claude: `CLAUDE.md` and `.claude/commands/pagesmith.md`
- Codex: `AGENTS.md` and `.codex/skills/pagesmith/SKILL.md`
- Gemini CLI: `GEMINI.md` and `.gemini/commands/pagesmith.toml`
- Shared: `llms.txt` and `llms-full.txt`

## User-Level Install

Install into your user home:

```ts
installAiArtifacts({
  assistants: ['claude', 'codex', 'gemini'],
  scope: 'user',
  includeLlms: false,
})
```

Installed locations:

- Claude: `~/.claude/CLAUDE.md` and `~/.claude/commands/pagesmith.md`
- Codex: `~/.codex/AGENTS.md` and `~/.codex/skills/pagesmith/SKILL.md`
- Gemini CLI: `~/.gemini/GEMINI.md` and `~/.gemini/commands/pagesmith.toml`

Use `skillName: '<name>'` if you want a custom command or skill name instead of `pagesmith`.

## CLI Usage

The `pagesmith ai install` command provides a CLI interface to the same installer:

```bash
# Install for all assistants
pagesmith ai install

# Install for Claude only
pagesmith ai install --assistant claude

# Install with docs profile
pagesmith ai install --assistant claude --scope project

# Install to user home
pagesmith ai install --scope user

# Custom skill name
pagesmith ai install --skill-name content

# Force overwrite existing files
pagesmith ai install --force

# Skip llms.txt generation
pagesmith ai install --no-llms
```

## Updating and Regenerating

Memory files are static snapshots. To update them after upgrading Pagesmith:

```ts
installAiArtifacts({
  assistants: ['claude', 'codex', 'gemini'],
  scope: 'project',
  force: true, // overwrite existing files
})
```

Or via CLI:

```bash
pagesmith ai install --force
```

The `force` option replaces all existing files. Without it, the installer merges content into existing files using managed block markers (`<!-- pagesmith-ai:...:start -->` / `<!-- pagesmith-ai:...:end -->`), preserving any custom content you have added outside the managed blocks.

## Programmatic API

```ts
import { getAiArtifacts, installAiArtifacts } from '@pagesmith/core/ai'

// Preview what would be installed (dry run)
const plan = getAiArtifacts({
  assistants: ['claude', 'codex', 'gemini'],
  scope: 'project',
})

// Install with full options
const results = installAiArtifacts({
  assistants: ['claude', 'codex', 'gemini'],
  scope: 'project',
  profile: 'docs',
  force: true,
})
```

Each result includes the file path, the assistant it belongs to, and the write status (`written`, `merged`, `replaced`, or `unchanged`).

## Recommended Tool Flows

### Claude

Use the installed `CLAUDE.md` for persistent Pagesmith context and the custom command file when you want a Pagesmith-focused prompt surface.

### Codex

Use `AGENTS.md` for project instructions and the Pagesmith skill for reusable CMS-specific guidance.

### Gemini CLI

Use `GEMINI.md` for memory and the custom TOML command for Pagesmith-specific assistance.
