---
title: AI Assistants
description: Install AI assistant context files for Claude, Codex, and Gemini CLI
order: 2
---

# AI Assistants

Pagesmith ships installable assistant context via the CLI. This lets AI coding assistants understand the Pagesmith API, conventions, and project structure when helping you write content or code.

## What Gets Installed

The AI installer generates several types of files:

| Artifact | Purpose |
|---|---|
| Memory files (`CLAUDE.md`, `AGENTS.md`, `GEMINI.md`) | Persistent project context for each assistant |
| Skill/command files | Assistant-specific commands (`/pagesmith`, `/update-docs`, `/ps-update-all-docs`) |
| Markdown guidelines (`.pagesmith/markdown-guidelines.md`) | Authoring rules so assistants write correct markdown |
| `llms.txt` / `llms-full.txt` | Standardized LLM context files |

## Quick Start

The fastest way to set up AI integrations is via the `pagesmith init` command:

```bash
npx pagesmith init --ai
```

This creates the docs config, content structure, and all AI artifacts in one step. Without `--ai`, the interactive init will ask whether to install AI integrations.
If your project already maintains custom root `llms.txt` files, run `npx pagesmith init --ai --no-llms` to skip regenerating them.

You can also run init interactively and choose AI integrations when prompted:

```bash
npx pagesmith init
```

## Context Window Management

When working with Pagesmith, your AI agent should read the right file for the task:

| Task | Read This | Size |
|------|-----------|------|
| Quick API lookup | `node_modules/@pagesmith/core/docs/llms.txt` | ~200 lines |
| Full reference | `node_modules/@pagesmith/core/docs/llms-full.txt` | ~1000 lines |
| Usage patterns & recipes | `node_modules/@pagesmith/core/docs/agents/usage.md` | ~500 lines |
| Docs package reference | `node_modules/@pagesmith/docs/docs/llms-full.txt` | ~800 lines |
| Error troubleshooting | `node_modules/@pagesmith/core/docs/agents/errors.md` | ~200 lines |

**Tip:** For routine tasks (add a page, update frontmatter), `llms.txt` alone is sufficient. Load `llms-full.txt` only when you need complete type signatures or configuration details.

## Profiles

The installer supports two profiles that control what content is generated:

| Profile | Description | Memory content |
|---|---|---|
| `default` | For projects using `@pagesmith/core` directly | Core API reference, content layer usage, Vite plugin config, collection definitions, markdown pipeline, JSX runtime, CSS exports |
| `docs` | For projects using `@pagesmith/docs` | Everything in `default` plus docs CLI, `pagesmith.config.json5` format, `meta.json5` navigation, layout overrides, search configuration, theme customization |

The profile is auto-detected based on your dependencies. If `@pagesmith/docs` is installed, the `docs` profile is used. Otherwise, `default` is used.

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

Use it in Claude Code for focused docs updates:

```
/update-docs
```

This is useful after making implementation changes — run `/update-docs` and the assistant will scan the code and bring the documentation up to date.

## The /ps-update-all-docs Skill

When Claude is included in a project-level install, the installer also generates `.claude/skills/ps-update-all-docs/SKILL.md`.

Use this when you want a full docs refresh across a repository:

1. Scans code, docs pages, and docs-related skills together
2. Aligns docs output to `@pagesmith/docs` structure (`content/`, folder-based `README.md`, `meta.json5`)
3. Ensures onboarding-first ordering in manual nav (for example, keep onboarding pages like `choose-your-path` and `ai-assistants` before manual setup pages in `guide/meta.json5`)
4. Refreshes AI context files (`llms.txt`, `llms-full.txt`, memory pointers) when needed

Run it in Claude Code:

```
/ps-update-all-docs
```

> **Note:** Both `/update-docs` and `/ps-update-all-docs` are generated only for project-level installs (`scope: 'project'`). User-level installs include the `/pagesmith` skill but not docs-maintenance skills.

### Which Skill to Use

| Scenario | Skill | Why |
|----------|-------|-----|
| Changed implementation code | `/update-docs` | Updates docs for the current package based on code changes |
| Full docs refresh | `/ps-update-all-docs` | Regenerates all AI artifacts and docs across packages |
| First-time setup | `npx pagesmith init --ai` | Initial scaffolding of all AI context files |
| Added a new package | `/ps-update-all-docs` | Picks up new package and generates its docs |

### Example Workflows

**After refactoring an API:**

1. Make your code changes
2. Run `/update-docs` in Claude Code
3. Claude reads the updated source, finds affected docs pages, and updates them
4. Review the diff and commit

**After adding a new feature:**

1. Implement the feature in code
2. Run `/update-docs` -- Claude creates a new docs page, adds it to the appropriate `meta.json5`, and writes examples
3. Review, adjust tone/examples if needed, commit

**Before a release:**

1. Run `/ps-update-all-docs` for a full refresh
2. Claude checks every doc page against current code, fixes stale content, updates navigation order, and regenerates AI context files (`llms.txt`, `llms-full.txt`)
3. Review the comprehensive diff, commit as part of the release

**Keeping AI context current after upgrading Pagesmith:**

1. Run `npx pagesmith init --ai` to regenerate memory files with the new version's context
2. Run `/ps-update-all-docs` to ensure docs reflect any API changes from the upgrade

## Supported Assistants

### Claude

Files installed:

| Scope | File | Purpose |
|---|---|---|
| Project | `CLAUDE.md` | Project-level memory loaded automatically by Claude Code |
| Project | `.claude/skills/pagesmith/SKILL.md` | `/pagesmith` skill with frontmatter |
| Project | `.claude/skills/update-docs/SKILL.md` | `/update-docs` skill with frontmatter |
| Project | `.claude/skills/ps-update-all-docs/SKILL.md` | `/ps-update-all-docs` full-repo docs regeneration skill |
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

## Install All AI Artifacts

```bash
npx pagesmith init --ai
```

This generates:

- Claude: `CLAUDE.md`, `.claude/skills/pagesmith/SKILL.md`, `.claude/skills/update-docs/SKILL.md`, `.claude/skills/ps-update-all-docs/SKILL.md`
- Codex: `AGENTS.md` and `.codex/skills/pagesmith/SKILL.md`
- Gemini CLI: `GEMINI.md` and `.gemini/commands/pagesmith.toml`
- Shared: `.pagesmith/markdown-guidelines.md`, `llms.txt`, `llms-full.txt`

## Reference Files

Both `@pagesmith/core` and `@pagesmith/docs` ship versioned AI files in their npm packages. Use these as the primary context source.

### Version behavior

- Package files in `node_modules` are tied to the installed package version.
- The docs site content in this repository is maintained for the latest implementation.
- If they differ, prefer `node_modules` for project-specific AI guidance.

Link to it from your project's `CLAUDE.md` or `AGENTS.md`:

```markdown
For @pagesmith/core usage, see: node_modules/@pagesmith/core/docs/agents/usage.md
For @pagesmith/core API reference, see: node_modules/@pagesmith/core/REFERENCE.md
For @pagesmith/docs usage, see: node_modules/@pagesmith/docs/docs/agents/usage.md
For @pagesmith/docs reference, see: node_modules/@pagesmith/docs/REFERENCE.md
```

The installed memory files (`CLAUDE.md`, `AGENTS.md`, `GEMINI.md`) reference these package files so assistants use version-matched guidance.

## MCP Server (Docs)

`@pagesmith/docs` also exposes a stdio MCP server:

```bash
pagesmith mcp --stdio
```

This enables docs-aware MCP tools (`docs_validate_config`, `docs_resolve_config`, `docs_list_pages`, `docs_get_page`) and versioned resources from the installed package.

## MCP Server (Core)

`@pagesmith/core` also ships an MCP server for collection introspection:

| Tool | Description |
|---|---|
| `core_list_collections` | List all collections with loader type and directory |
| `core_get_entry` | Fetch a single entry with rendered HTML |
| `core_validate` | Run validation on collections |

See the [MCP Setup](/guide/mcp-setup) page for configuration details.

## Updating and Regenerating

Memory files are static snapshots. To update them after upgrading Pagesmith:

```bash
npx pagesmith init --ai
```

The installer merges content into existing files using managed block markers (`<!-- pagesmith-ai:...:start -->` / `<!-- pagesmith-ai:...:end -->`), preserving any custom content you have added outside the managed blocks.
