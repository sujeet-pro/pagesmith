# AI Assistants

Pagesmith ships installable assistant context through `@pagesmith/content/ai` and the `pagesmith-content ai install` CLI.

That gives you:

- assistant memory files
- assistant-specific skill or command files
- `llms.txt`
- `llms-full.txt`

## Project-Level Install

Install everything into the current project:

```bash
pagesmith-content ai install --assistant all --scope project
```

Tool-specific installs:

```bash
pagesmith-content ai install --assistant claude --scope project
pagesmith-content ai install --assistant codex --scope project
pagesmith-content ai install --assistant gemini --scope project
```

Installed files:

- Claude: `CLAUDE.md` and `.claude/commands/pagesmith.md`
- Codex: `AGENTS.md` and `.codex/skills/pagesmith/SKILL.md`
- Gemini CLI: `GEMINI.md` and `.gemini/commands/pagesmith.toml`
- Shared: `llms.txt` and `llms-full.txt`

## User-Level Install

Install into your user home:

```bash
pagesmith-content ai install --assistant all --scope user
```

Installed locations:

- Claude: `~/.claude/CLAUDE.md` and `~/.claude/commands/pagesmith.md`
- Codex: `~/.codex/AGENTS.md` and `~/.codex/skills/pagesmith/SKILL.md`
- Gemini CLI: `~/.gemini/GEMINI.md` and `~/.gemini/commands/pagesmith.toml`

Use `--skill-name <name>` if you want a custom command or skill name instead of `pagesmith`.

## CLI Flags

```bash
pagesmith-content ai install --assistant all --scope project --skill-name content
pagesmith-content ai install --assistant codex --scope user --no-llms
pagesmith-content ai install --assistant claude --scope project --force
```

## Programmatic API

```ts
import { getAiArtifacts, installAiArtifacts } from '@pagesmith/content/ai'

const plan = getAiArtifacts({
  assistants: ['claude', 'codex', 'gemini'],
  scope: 'project',
})

const results = installAiArtifacts({
  assistants: ['claude', 'codex', 'gemini'],
  scope: 'project',
  force: true,
})
```

## Recommended Tool Flows

### Claude

Use the installed `CLAUDE.md` for persistent Pagesmith context and the custom command file when you want a Pagesmith-focused prompt surface.

### Codex

Use `AGENTS.md` for project instructions and the Pagesmith skill for reusable CMS-specific guidance.

### Gemini CLI

Use `GEMINI.md` for memory and the custom TOML command for Pagesmith-specific assistance.
