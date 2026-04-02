# AI Assistants

Pagesmith exposes installable assistant context through `@pagesmith/core/ai`.

That gives you:

- assistant memory files
- assistant-specific skill or command files
- `llms.txt`
- `llms-full.txt`

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

## Useful Options

```ts
installAiArtifacts({
  assistants: ['claude', 'codex', 'gemini'],
  scope: 'project',
  profile: 'docs',
  skillName: 'content',
  force: true,
})
```

## Programmatic API

```ts
import { getAiArtifacts, installAiArtifacts } from '@pagesmith/core/ai'

const plan = getAiArtifacts({
  assistants: ['claude', 'codex', 'gemini'],
  scope: 'project',
})

const results = installAiArtifacts({
  assistants: ['claude', 'codex', 'gemini'],
  scope: 'project',
  profile: 'docs',
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
