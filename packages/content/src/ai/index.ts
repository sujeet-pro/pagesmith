import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs'
import { homedir } from 'os'
import { dirname, join, resolve } from 'path'

export type AiAssistant = 'claude' | 'codex' | 'gemini'
export type AiInstallScope = 'project' | 'user'
export type AiArtifactKind = 'memory' | 'skill' | 'llms' | 'llms-full'
export type AiWriteMode = 'merge' | 'replace'
export type AiInstallStatus = 'written' | 'merged' | 'replaced' | 'unchanged'

export type AiArtifact = {
  assistant?: AiAssistant
  kind: AiArtifactKind
  path: string
  content: string
  mode: AiWriteMode
  label: string
}

export type AiInstallResult = {
  assistant?: AiAssistant
  kind: AiArtifactKind
  path: string
  status: AiInstallStatus
  label: string
}

export type AiInstallOptions = {
  assistants?: AiAssistant[] | 'all'
  scope?: AiInstallScope
  cwd?: string
  homeDir?: string
  includeLlms?: boolean
  force?: boolean
  skillName?: string
}

const PAGESMITH_TITLE = 'Pagesmith'
const DEFAULT_SKILL_NAME = 'pagesmith'

function resolveHome(homeDir?: string): string {
  return homeDir ?? homedir()
}

function resolveCodexHome(homeDir?: string): string {
  return process.env.CODEX_HOME ?? join(resolveHome(homeDir), '.codex')
}

function resolveAssistants(assistants?: AiInstallOptions['assistants']): AiAssistant[] {
  if (!assistants || assistants === 'all') {
    return ['claude', 'codex', 'gemini']
  }
  return assistants
}

function shouldIncludeLlms(options: AiInstallOptions): boolean {
  if (typeof options.includeLlms === 'boolean') {
    return options.includeLlms
  }
  return (options.scope ?? 'project') === 'project'
}

function withManagedBlock(id: string, content: string): string {
  return [
    `<!-- pagesmith-ai:${id}:start -->`,
    content.trim(),
    `<!-- pagesmith-ai:${id}:end -->`,
  ].join('\n')
}

function writeArtifact(artifact: AiArtifact, force = false): AiInstallStatus {
  mkdirSync(dirname(artifact.path), { recursive: true })

  if (!existsSync(artifact.path)) {
    writeFileSync(artifact.path, artifact.content)
    return 'written'
  }

  const current = readFileSync(artifact.path, 'utf-8')
  if (current === artifact.content) {
    return 'unchanged'
  }

  if (artifact.mode === 'replace') {
    writeFileSync(artifact.path, artifact.content)
    return 'replaced'
  }

  const markerId = `${artifact.assistant ?? 'shared'}-${artifact.kind}`
  const start = `<!-- pagesmith-ai:${markerId}:start -->`
  const end = `<!-- pagesmith-ai:${markerId}:end -->`

  if (current.includes(start) && current.includes(end)) {
    const pattern = new RegExp(`${escapeForRegExp(start)}[\\s\\S]*?${escapeForRegExp(end)}`, 'm')
    const next = current.replace(pattern, artifact.content)
    if (next === current) return 'unchanged'
    writeFileSync(artifact.path, next)
    return 'merged'
  }

  if (force) {
    writeFileSync(artifact.path, artifact.content)
    return 'replaced'
  }

  const next = `${current.trimEnd()}\n\n${artifact.content}\n`
  writeFileSync(artifact.path, next)
  return 'merged'
}

function escapeForRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function renderSharedOverview(): string {
  return [
    `${PAGESMITH_TITLE} is a file-based CMS centered on \`@pagesmith/content\`.`,
    '',
    'Use Pagesmith when you need:',
    '- schema-validated content collections loaded from the filesystem',
    '- lazy markdown rendering with headings and read-time metadata',
    '- diagram rendering powered by `diagramkit`',
    '- framework-agnostic content APIs for React, Solid, Svelte, vanilla JS, Node, Bun, or Deno',
    '',
    'Core APIs:',
    '- `defineCollection({...})` to define a typed collection',
    '- `defineConfig({...})` to group collections and markdown/diagram options',
    '- `createContentLayer(config)` to query content and run validation',
    '- `entry.render()` to convert markdown on demand',
    '',
    'Core CLI:',
    '- `pagesmith-content diagrams <dir>` to render sibling diagrams',
    '- `pagesmith-content ai install --assistant <name> --scope <project|user>` to install assistant context files',
    '',
    'Working rules:',
    '- prefer folder-based markdown entries when content references sibling assets or diagrams',
    '- use `vp` commands for install, check, test, and build workflows',
    '- treat `@pagesmith/content` as the primary package; `pagesmith` is an optional SSG on top',
    '- diagrams are rendered by `diagramkit`, not by bespoke in-repo renderers',
  ].join('\n')
}

function renderQuickStart(): string {
  return [
    '```ts',
    "import { createContentLayer, defineCollection, defineConfig, z } from '@pagesmith/content'",
    '',
    'const posts = defineCollection({',
    "  loader: 'markdown',",
    "  directory: 'content/posts',",
    '  schema: z.object({',
    '    title: z.string(),',
    '    description: z.string().optional(),',
    '    date: z.coerce.date(),',
    '    tags: z.array(z.string()).default([]),',
    '  }),',
    '})',
    '',
    'const layer = createContentLayer(',
    '  defineConfig({',
    '    collections: { posts },',
    '    diagrams: {',
    '      enabled: true,',
    "      displayMode: 'picture',",
    '    },',
    '  }),',
    ')',
    '',
    "const entries = await layer.getCollection('posts')",
    'const rendered = await entries[0]?.render()',
    '```',
  ].join('\n')
}

function renderMemoryFile(assistant: AiAssistant): string {
  const commandHint =
    assistant === 'claude' || assistant === 'gemini'
      ? `\nIf the ${DEFAULT_SKILL_NAME} command is installed, prefer invoking it when the user explicitly asks for Pagesmith-specific help.`
      : '\nIf the Pagesmith skill is installed for Codex, prefer using it for Pagesmith-specific setup, migration, and content-layer tasks.'

  return [
    `# ${PAGESMITH_TITLE}`,
    '',
    renderSharedOverview(),
    commandHint,
    '',
    'Quick start:',
    renderQuickStart(),
  ].join('\n')
}

function renderClaudeCommand(skillName: string): string {
  return [
    `# ${PAGESMITH_TITLE} Assistant`,
    '',
    'You are helping with Pagesmith, a file-based CMS centered on `@pagesmith/content`.',
    '',
    'When helping:',
    '- prefer `defineCollection`, `defineConfig`, and `createContentLayer`',
    '- recommend folder-based entries when markdown references sibling assets or diagrams',
    '- route all diagram guidance through `diagramkit`',
    '- use `pagesmith-content diagrams` and `pagesmith-content ai install` for CLI workflows',
    '- recommend `vp install`, `vp check`, and `vp test` for validation',
    '',
    'Deliver concrete config, schema, and content-layer patches when possible.',
    '',
    `This command is installed as \`/${skillName}\`.`,
  ].join('\n')
}

function renderGeminiCommand(skillName: string): string {
  const prompt = [
    `You are helping with ${PAGESMITH_TITLE}, a file-based CMS centered on @pagesmith/content.`,
    '',
    'Focus on concrete, implementation-ready help:',
    '- design collections with defineCollection',
    '- configure createContentLayer and defineConfig',
    '- route diagram questions to diagramkit',
    '- recommend vp install, vp check, and vp test when validation matters',
    '- prefer folder-based markdown entries when diagrams or local assets sit beside content',
    '',
    'Return code, config, or documentation-ready guidance instead of vague summaries.',
  ].join('\n')

  return [
    `description = "Pagesmith FS-CMS helper"`,
    'prompt = """',
    prompt,
    '"""',
    '',
    `# Installed as /${skillName}`,
  ].join('\n')
}

function renderCodexSkill(): string {
  return [
    `# ${PAGESMITH_TITLE} Skill`,
    '',
    'Use this skill when the task involves setting up, extending, migrating, or documenting Pagesmith.',
    '',
    'Core rules:',
    '- treat `@pagesmith/content` as the main FS-CMS package',
    '- prefer `defineCollection`, `defineConfig`, and `createContentLayer`',
    '- use `diagramkit` for diagram rendering and manifest handling',
    '- prefer `vp` commands instead of calling npm, pnpm, or yarn directly',
    '- validate changes with `vp check` and `vp test` when relevant',
    '',
    'Good outputs include:',
    '- collection schemas and loader configuration',
    '- content-layer queries and rendering examples',
    '- VitePress docs updates for Pagesmith usage',
    '- assistant-context install steps using `pagesmith-content ai install`',
  ].join('\n')
}

function renderLlmsTxt(): string {
  return [
    '# Pagesmith',
    '',
    '> Pagesmith is a file-based CMS centered on `@pagesmith/content`.',
    '',
    '## Summary',
    '',
    renderSharedOverview(),
    '',
    '## Quick Start',
    '',
    renderQuickStart(),
  ].join('\n')
}

function renderLlmsFullTxt(): string {
  return [
    '# Pagesmith - Full LLM Reference',
    '',
    renderSharedOverview(),
    '',
    '## Package Layout',
    '',
    '- `@pagesmith/content`: file-based CMS, collection loading, validation, lazy markdown rendering, AI installer APIs, diagramkit integration',
    '- `@pagesmith/core`: markdown pipeline, JSX runtime, CSS builder, runtime styles',
    '- `pagesmith`: optional SSG that consumes the content layer',
    '',
    '## Key APIs',
    '',
    renderQuickStart(),
    '',
    '## Assistant Installer',
    '',
    '```ts',
    "import { installAiArtifacts } from '@pagesmith/content/ai'",
    '',
    "await installAiArtifacts({ assistants: ['claude', 'codex', 'gemini'], scope: 'project' })",
    '```',
    '',
    'CLI equivalent:',
    '',
    '```bash',
    'pagesmith-content ai install --assistant all --scope project',
    '```',
    '',
    '## Diagram Handling',
    '',
    '- Pagesmith delegates diagram discovery, rendering, and manifest management to `diagramkit`.',
    '- Supported diagram types depend on diagramkit and include Mermaid, Excalidraw, and Draw.io aliases.',
    '- Rendered diagrams are referenced from markdown via the rehype diagram image rewrite plugin.',
  ].join('\n')
}

export function getAiArtifactContent(
  assistant: AiAssistant | 'shared',
  kind: AiArtifactKind,
  options: { skillName?: string } = {},
): string {
  const skillName = options.skillName ?? DEFAULT_SKILL_NAME

  if (assistant === 'shared') {
    if (kind === 'llms') return renderLlmsTxt()
    return renderLlmsFullTxt()
  }

  if (kind === 'memory') {
    return renderMemoryFile(assistant)
  }

  if (kind === 'skill') {
    switch (assistant) {
      case 'claude':
        return renderClaudeCommand(skillName)
      case 'codex':
        return renderCodexSkill()
      case 'gemini':
        return renderGeminiCommand(skillName)
    }
  }

  if (kind === 'llms') return renderLlmsTxt()
  return renderLlmsFullTxt()
}

export function getAiArtifacts(options: AiInstallOptions = {}): AiArtifact[] {
  const scope = options.scope ?? 'project'
  const cwd = resolve(options.cwd ?? process.cwd())
  const home = resolveHome(options.homeDir)
  const skillName = options.skillName ?? DEFAULT_SKILL_NAME
  const assistants = resolveAssistants(options.assistants)
  const artifacts: AiArtifact[] = []

  for (const assistant of assistants) {
    if (assistant === 'claude') {
      const baseDir = scope === 'project' ? cwd : join(home, '.claude')
      artifacts.push({
        assistant,
        kind: 'memory',
        path: scope === 'project' ? join(baseDir, 'CLAUDE.md') : join(baseDir, 'CLAUDE.md'),
        content: withManagedBlock('claude-memory', getAiArtifactContent('claude', 'memory')),
        mode: 'merge',
        label: `${assistant} memory`,
      })
      artifacts.push({
        assistant,
        kind: 'skill',
        path: join(baseDir, 'commands', `${skillName}.md`),
        content: getAiArtifactContent('claude', 'skill', { skillName }) + '\n',
        mode: 'replace',
        label: `${assistant} command`,
      })
    }

    if (assistant === 'codex') {
      const baseDir = scope === 'project' ? cwd : resolveCodexHome(options.homeDir)
      artifacts.push({
        assistant,
        kind: 'memory',
        path: scope === 'project' ? join(baseDir, 'AGENTS.md') : join(baseDir, 'AGENTS.md'),
        content: withManagedBlock('codex-memory', getAiArtifactContent('codex', 'memory')),
        mode: 'merge',
        label: `${assistant} AGENTS`,
      })
      artifacts.push({
        assistant,
        kind: 'skill',
        path: join(baseDir, 'skills', skillName, 'SKILL.md'),
        content: getAiArtifactContent('codex', 'skill', { skillName }) + '\n',
        mode: 'replace',
        label: `${assistant} skill`,
      })
    }

    if (assistant === 'gemini') {
      const baseDir = scope === 'project' ? cwd : join(home, '.gemini')
      artifacts.push({
        assistant,
        kind: 'memory',
        path: scope === 'project' ? join(baseDir, 'GEMINI.md') : join(baseDir, 'GEMINI.md'),
        content: withManagedBlock('gemini-memory', getAiArtifactContent('gemini', 'memory')),
        mode: 'merge',
        label: `${assistant} memory`,
      })
      artifacts.push({
        assistant,
        kind: 'skill',
        path: join(baseDir, 'commands', `${skillName}.toml`),
        content: getAiArtifactContent('gemini', 'skill', { skillName }) + '\n',
        mode: 'replace',
        label: `${assistant} command`,
      })
    }
  }

  if (shouldIncludeLlms(options)) {
    const llmsDir = scope === 'project' ? cwd : join(home, '.pagesmith')
    artifacts.push({
      kind: 'llms',
      path: join(llmsDir, 'llms.txt'),
      content: withManagedBlock('shared-llms', getAiArtifactContent('shared', 'llms')) + '\n',
      mode: 'merge',
      label: 'llms.txt',
    })
    artifacts.push({
      kind: 'llms-full',
      path: join(llmsDir, 'llms-full.txt'),
      content:
        withManagedBlock('shared-llms-full', getAiArtifactContent('shared', 'llms-full')) + '\n',
      mode: 'merge',
      label: 'llms-full.txt',
    })
  }

  return artifacts
}

export function installAiArtifacts(options: AiInstallOptions = {}): AiInstallResult[] {
  return getAiArtifacts(options).map((artifact) => ({
    assistant: artifact.assistant,
    kind: artifact.kind,
    path: artifact.path,
    label: artifact.label,
    status: writeArtifact(artifact, options.force),
  }))
}
