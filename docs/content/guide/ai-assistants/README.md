# AI Assistants

Pagesmith exposes installable assistant context through `@pagesmith/core/ai`. This lets AI coding assistants understand the Pagesmith API, conventions, and project structure when helping you write content or code.

## What Gets Installed

The AI installer generates several types of files:

| Artifact | Purpose |
|---|---|
| Memory files (`CLAUDE.md`, `AGENTS.md`, `GEMINI.md`) | Persistent project context for each assistant |
| Skill/command files | Assistant-specific commands (`/pagesmith`, `/update-docs`) |
| Markdown guidelines (`.pagesmith/markdown-guidelines.md`) | Authoring rules so assistants write correct markdown |
| `llms.txt` / `llms-full.txt` | Standardized LLM context files |

## Quick Start

The fastest way to set up AI integrations is via the `pagesmith init` command:

```bash
npx pagesmith init --ai
```

This creates the docs config, content structure, and all AI artifacts in one step. Without `--ai`, the interactive init will ask whether to install AI integrations.

You can also run init interactively and choose AI integrations when prompted:

```bash
npx pagesmith init
```

### Programmatic API

```ts
import { installAiArtifacts } from '@pagesmith/core/ai'

installAiArtifacts({
  assistants: ['claude', 'codex', 'gemini'],
  scope: 'project',
  profile: 'docs', // or 'default' for core-only projects
})
```

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
  profile: 'docs',
})
```

## Markdown Guidelines

The installer automatically creates `.pagesmith/markdown-guidelines.md` in the project root. This file contains:

- The full markdown pipeline order
- All supported markdown features (GFM, alerts, math, smart typography)
- Expressive Code features (titles, line numbers, mark/ins/del, collapse)
- Built-in validator rules (heading hierarchy, link validation, code block checks)
- Key authoring rules that assistants should follow

Future AI sessions that read the project's `CLAUDE.md` or `AGENTS.md` will be directed to this file, ensuring consistent content authoring across all sessions.

## The /update-docs Skill

When Claude is included in a **project-level** install, the installer generates `.claude/skills/update-docs/SKILL.md`. This gives Claude Code an `/update-docs` slash command that:

1. Reads the project's source code to understand the current implementation
2. Reads the existing docs structure (`pagesmith.config.json5`, `meta.json5` files, content pages)
3. Updates existing content pages to reflect implementation changes
4. Creates new pages for undocumented features
5. Adds new page slugs to the appropriate `meta.json5` ordering
6. Follows the markdown guidelines for all authored content

Use it in Claude Code:

```
/update-docs
```

This is useful after making implementation changes — run `/update-docs` and the assistant will scan the code and bring the documentation up to date.

> **Note:** The `/update-docs` skill is only generated for project-level installs (`scope: 'project'`). User-level installs include the `/pagesmith` skill but not `/update-docs`.

## Supported Assistants

### Claude

Files installed:

| Scope | File | Purpose |
|---|---|---|
| Project | `CLAUDE.md` | Project-level memory loaded automatically by Claude Code |
| Project | `.claude/skills/pagesmith/SKILL.md` | `/pagesmith` skill with frontmatter |
| Project | `.claude/skills/update-docs/SKILL.md` | `/update-docs` skill with frontmatter |
| Project | `.pagesmith/markdown-guidelines.md` | Markdown authoring rules for content |
| User | `~/.claude/CLAUDE.md` | User-level memory applied across all projects |
| User | `~/.claude/skills/pagesmith/SKILL.md` | User-level `/pagesmith` skill |

Claude Code reads `CLAUDE.md` automatically when working in the project directory. Skills use the [Claude Code skills format](https://code.claude.com/docs/en/skills) with YAML frontmatter for `name`, `description`, and `allowed-tools`. They are available as `/pagesmith` and `/update-docs` in Claude Code.

### Codex

Files installed:

| Scope | File | Purpose |
|---|---|---|
| Project | `AGENTS.md` | Project instructions for Codex |
| Project | `.codex/skills/pagesmith/SKILL.md` | Reusable Pagesmith skill |
| Project | `.pagesmith/markdown-guidelines.md` | Markdown authoring rules for content |
| User | `~/.codex/AGENTS.md` | User-level instructions |
| User | `~/.codex/skills/pagesmith/SKILL.md` | User-level skill |

### Gemini CLI

Files installed:

| Scope | File | Purpose |
|---|---|---|
| Project | `GEMINI.md` | Project memory for Gemini CLI |
| Project | `.gemini/commands/pagesmith.toml` | Custom TOML command |
| Project | `.pagesmith/markdown-guidelines.md` | Markdown authoring rules for content |
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

- Claude: `CLAUDE.md`, `.claude/skills/pagesmith/SKILL.md`, `.claude/skills/update-docs/SKILL.md`
- Codex: `AGENTS.md` and `.codex/skills/pagesmith/SKILL.md`
- Gemini CLI: `GEMINI.md` and `.gemini/commands/pagesmith.toml`
- Shared: `.pagesmith/markdown-guidelines.md`, `llms.txt`, `llms-full.txt`

## Reference Files

Both `@pagesmith/core` and `@pagesmith/docs` ship a `REFERENCE.md` file in their npm package. This is a comprehensive AI-readable reference that assistants can read on demand.

Link to it from your project's `CLAUDE.md` or `AGENTS.md`:

```markdown
For @pagesmith/core API reference, see: node_modules/@pagesmith/core/REFERENCE.md
For @pagesmith/docs reference, see: node_modules/@pagesmith/docs/REFERENCE.md
```

The installed memory files (`CLAUDE.md`, `AGENTS.md`, `GEMINI.md`) automatically reference these files so assistants know where to find the full API details.

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

- Claude: `~/.claude/CLAUDE.md` and `~/.claude/skills/pagesmith/SKILL.md`
- Codex: `~/.codex/AGENTS.md` and `~/.codex/skills/pagesmith/SKILL.md`
- Gemini CLI: `~/.gemini/GEMINI.md` and `~/.gemini/commands/pagesmith.toml`

Use `skillName: '<name>'` if you want a custom command or skill name instead of `pagesmith`.

## Updating and Regenerating

Memory files are static snapshots. To update them after upgrading Pagesmith:

```ts
installAiArtifacts({
  assistants: ['claude', 'codex', 'gemini'],
  scope: 'project',
  force: true,
})
```

Or via the init command:

```bash
npx pagesmith init --ai
```

The installer merges content into existing files using managed block markers (`<!-- pagesmith-ai:...:start -->` / `<!-- pagesmith-ai:...:end -->`), preserving any custom content you have added outside the managed blocks. Use the `force` option in the programmatic API to replace all existing files instead.

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
