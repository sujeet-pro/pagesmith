import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs'
import { homedir } from 'os'
import { dirname, join, resolve } from 'path'

export type AiAssistant = 'claude' | 'codex' | 'gemini'
export type AiInstallScope = 'project' | 'user'
export type AiInstallProfile = 'default' | 'docs'
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
  profile?: AiInstallProfile
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
    `${PAGESMITH_TITLE} is a filesystem-first content toolkit with two main packages: \`@pagesmith/core\` (shared content/runtime layer) and \`@pagesmith/docs\` (convention-based documentation).`,
    '',
    'Use Pagesmith when you need:',
    '- schema-validated content collections loaded from the filesystem',
    '- lazy markdown rendering with headings and read-time metadata',
    '- framework-agnostic content APIs for React, Solid, Svelte, vanilla JS, Node, Bun, or Deno',
    '',
    'Core APIs:',
    '- `defineCollection({...})` to define a typed collection',
    '- `defineConfig({...})` to group collections and markdown options',
    '- `createContentLayer(config)` to query content and run validation',
    '- `entry.render()` to convert markdown on demand',
    '',
    'Useful helpers:',
    '- `@pagesmith/core/ai` exposes `getAiArtifacts(...)` and `installAiArtifacts(...)`',
    '',
    'Working rules:',
    '- prefer folder-based markdown entries when content references sibling assets',
    '- use `vp` commands for install, check, test, and build workflows',
    '- `@pagesmith/core` provides the shared content/runtime layer; `@pagesmith/docs` adds convention-based documentation on top',
  ].join('\n')
}

function renderDocsOverview(): string {
  return [
    'Docs-specific rules:',
    '- `@pagesmith/docs` is convention-based and builds a static docs site from `content/` plus `pagesmith.config.json5`',
    '- top-level content folders become top navigation sections (for example `guide/`, `reference/`, `packages/`)',
    '- folder-based markdown entries should prefer `README.md` or `index.md` when a page owns sibling assets',
    '- the home page is `content/README.md`; optional home-specific data can live in `content/home.json5`',
    '- sidebar labels, nav labels, and ordering live in frontmatter (`sidebarLabel`, `navLabel`, `order`)',
    '- footer links live in `pagesmith.config.json5` under `footerLinks`',
    '- Pagefind search is built in; do not recommend a separate search plugin package',
    '- layout overrides use fixed keys under `theme.layouts` such as `home`, `page`, and `notFound`',
  ].join('\n')
}

function renderQuickStart(profile: AiInstallProfile = 'default'): string {
  if (profile === 'docs') {
    return [
      '```json5',
      '{',
      "  name: 'Acme Docs',",
      "  title: 'Acme Docs',",
      "  description: 'Multi-package documentation',",
      "  contentDir: './content',",
      "  outDir: './dist',",
      '  footerLinks: [',
      "    { label: 'Guide', path: '/guide' },",
      "    { label: 'Reference', path: '/reference' },",
      '  ],',
      '  search: { enabled: true },',
      '}',
      '```',
      '',
      '```text',
      'content/',
      '  README.md',
      '  guide/',
      '    README.md',
      '    getting-started/README.md',
      '  reference/',
      '    README.md',
      '    api/README.md',
      '```',
    ].join('\n')
  }

  return [
    '```ts',
    "import { createContentLayer, defineCollection, defineConfig, z } from '@pagesmith/core'",
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
    '  }),',
    ')',
    '',
    "const entries = await layer.getCollection('posts')",
    'const rendered = await entries[0]?.render()',
    '```',
  ].join('\n')
}

function renderMemoryFile(assistant: AiAssistant, profile: AiInstallProfile): string {
  const commandHint =
    assistant === 'claude' || assistant === 'gemini'
      ? `\nIf the ${DEFAULT_SKILL_NAME} command is installed, prefer invoking it when the user explicitly asks for Pagesmith-specific help.`
      : '\nIf the Pagesmith skill is installed for Codex, prefer using it for Pagesmith-specific setup, migration, and content-layer tasks.'

  return [
    `# ${PAGESMITH_TITLE}`,
    '',
    renderSharedOverview(),
    ...(profile === 'docs' ? ['', renderDocsOverview()] : []),
    commandHint,
    '',
    'Quick start:',
    renderQuickStart(profile),
  ].join('\n')
}

function renderClaudeCommand(skillName: string, profile: AiInstallProfile): string {
  return [
    `# ${PAGESMITH_TITLE} Assistant`,
    '',
    'You are helping with Pagesmith, a file-based CMS with `@pagesmith/core` and `@pagesmith/docs`.',
    '',
    'When helping:',
    '- prefer `defineCollection`, `defineConfig`, and `createContentLayer`',
    '- recommend folder-based entries when markdown references sibling assets',
    '- use `@pagesmith/core/ai` for assistant artifact generation',
    '- recommend `vp install`, `vp check`, and `vp test` for validation',
    ...(profile === 'docs'
      ? [
          '- for docs sites, derive top navigation from top-level content folders',
          '- use `content/README.md` for the home page and `content/home.json5` for extra home data when needed',
          '- use frontmatter fields like `sidebarLabel`, `navLabel`, and `order` for docs navigation',
          '- do not recommend `@pagesmith/plugin-pagefind` or `@pagesmith/plugin-algolia`; search is built into docs',
          '- recommend `theme.layouts.home`, `theme.layouts.page`, and `theme.layouts.notFound` for docs layout overrides',
        ]
      : []),
    '',
    'Deliver concrete config, schema, and content-layer patches when possible.',
    '',
    `This command is installed as \`/${skillName}\`.`,
  ].join('\n')
}

function renderGeminiCommand(skillName: string, profile: AiInstallProfile): string {
  const prompt = [
    `You are helping with ${PAGESMITH_TITLE}, a file-based CMS with @pagesmith/core and @pagesmith/docs.`,
    '',
    'Focus on concrete, implementation-ready help:',
    '- design collections with defineCollection',
    '- configure createContentLayer and defineConfig',
    '- recommend vp install, vp check, and vp test when validation matters',
    '- prefer folder-based markdown entries when local assets sit beside content',
    ...(profile === 'docs'
      ? [
          '- for docs sites, follow the convention-based `content/` structure',
          '- drive top navigation from top-level folders and use frontmatter for labels/order',
          '- keep Pagefind as the built-in search strategy',
        ]
      : []),
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

function renderCodexSkill(profile: AiInstallProfile): string {
  return [
    `# ${PAGESMITH_TITLE} Skill`,
    '',
    'Use this skill when the task involves setting up, extending, migrating, or documenting Pagesmith.',
    '',
    'Core rules:',
    '- `@pagesmith/core` provides the content layer; `@pagesmith/docs` adds convention-based documentation',
    '- prefer `defineCollection`, `defineConfig`, and `createContentLayer`',
    '- prefer `vp` commands instead of calling npm, pnpm, or yarn directly',
    '- validate changes with `vp check` and `vp test` when relevant',
    ...(profile === 'docs'
      ? [
          '- when the repo uses `@pagesmith/docs`, treat `content/README.md` as the home page',
          '- top-level content folders define the main docs navigation',
          '- docs frontmatter may use `sidebarLabel`, `navLabel`, and `order` to shape navigation',
          '- `pagesmith.config.json5` should own footer links and high-level site metadata',
          '- built-in search is Pagefind; do not suggest separate search plugin packages',
        ]
      : []),
    '',
    'Good outputs include:',
    '- collection schemas and loader configuration',
    '- content-layer queries and rendering examples',
    '- @pagesmith/docs updates for Pagesmith usage',
    '- assistant-context install steps using `@pagesmith/core/ai`',
  ].join('\n')
}

function renderLlmsTxt(profile: AiInstallProfile): string {
  return [
    '# Pagesmith',
    '',
    '> Pagesmith is a filesystem-first content toolkit centered on `@pagesmith/core` and `@pagesmith/docs`.',
    '',
    '## Summary',
    '',
    renderSharedOverview(),
    ...(profile === 'docs' ? ['', renderDocsOverview()] : []),
    '',
    '## Quick Start',
    '',
    renderQuickStart(profile),
  ].join('\n')
}

function renderLlmsFullTxt(profile: AiInstallProfile): string {
  return [
    '# Pagesmith - Full LLM Reference',
    '',
    renderSharedOverview(),
    ...(profile === 'docs' ? ['', '## Docs Sites', '', renderDocsOverview()] : []),
    '',
    '## Package Layout',
    '',
    '- `@pagesmith/core`: content layer, collection loading, validation, lazy markdown rendering, JSX runtime, CSS builder, runtime styles, assistant artifact APIs, and Vite content integration',
    '- `@pagesmith/docs`: convention-based documentation with the docs CLI, generators, validators, default theme, and bundled search',
    '',
    '## Key APIs',
    '',
    renderQuickStart(profile),
    '',
    '## Assistant Installer',
    '',
    '```ts',
    "import { installAiArtifacts } from '@pagesmith/core/ai'",
    '',
    "await installAiArtifacts({ assistants: ['claude', 'codex', 'gemini'], scope: 'project' })",
    '```',
    '',
  ].join('\n')
}

export function getAiArtifactContent(
  assistant: AiAssistant | 'shared',
  kind: AiArtifactKind,
  options: { profile?: AiInstallProfile; skillName?: string } = {},
): string {
  const skillName = options.skillName ?? DEFAULT_SKILL_NAME
  const profile = options.profile ?? 'default'

  if (assistant === 'shared') {
    if (kind === 'llms') return renderLlmsTxt(profile)
    return renderLlmsFullTxt(profile)
  }

  if (kind === 'memory') {
    return renderMemoryFile(assistant, profile)
  }

  if (kind === 'skill') {
    switch (assistant) {
      case 'claude':
        return renderClaudeCommand(skillName, profile)
      case 'codex':
        return renderCodexSkill(profile)
      case 'gemini':
        return renderGeminiCommand(skillName, profile)
    }
  }

  if (kind === 'llms') return renderLlmsTxt(profile)
  return renderLlmsFullTxt(profile)
}

export function getAiArtifacts(options: AiInstallOptions = {}): AiArtifact[] {
  const scope = options.scope ?? 'project'
  const cwd = resolve(options.cwd ?? process.cwd())
  const home = resolveHome(options.homeDir)
  const skillName = options.skillName ?? DEFAULT_SKILL_NAME
  const profile = options.profile ?? 'default'
  const assistants = resolveAssistants(options.assistants)
  const artifacts: AiArtifact[] = []

  for (const assistant of assistants) {
    if (assistant === 'claude') {
      const baseDir = scope === 'project' ? cwd : join(home, '.claude')
      artifacts.push({
        assistant,
        kind: 'memory',
        path: join(baseDir, 'CLAUDE.md'),
        content: withManagedBlock(
          'claude-memory',
          getAiArtifactContent('claude', 'memory', { profile }),
        ),
        mode: 'merge',
        label: `${assistant} memory`,
      })
      artifacts.push({
        assistant,
        kind: 'skill',
        path: join(baseDir, 'commands', `${skillName}.md`),
        content: getAiArtifactContent('claude', 'skill', { profile, skillName }) + '\n',
        mode: 'replace',
        label: `${assistant} command`,
      })
    }

    if (assistant === 'codex') {
      const baseDir = scope === 'project' ? cwd : resolveCodexHome(options.homeDir)
      artifacts.push({
        assistant,
        kind: 'memory',
        path: join(baseDir, 'AGENTS.md'),
        content: withManagedBlock(
          'codex-memory',
          getAiArtifactContent('codex', 'memory', { profile }),
        ),
        mode: 'merge',
        label: `${assistant} AGENTS`,
      })
      artifacts.push({
        assistant,
        kind: 'skill',
        path: join(baseDir, 'skills', skillName, 'SKILL.md'),
        content: getAiArtifactContent('codex', 'skill', { profile, skillName }) + '\n',
        mode: 'replace',
        label: `${assistant} skill`,
      })
    }

    if (assistant === 'gemini') {
      const baseDir = scope === 'project' ? cwd : join(home, '.gemini')
      artifacts.push({
        assistant,
        kind: 'memory',
        path: join(baseDir, 'GEMINI.md'),
        content: withManagedBlock(
          'gemini-memory',
          getAiArtifactContent('gemini', 'memory', { profile }),
        ),
        mode: 'merge',
        label: `${assistant} memory`,
      })
      artifacts.push({
        assistant,
        kind: 'skill',
        path: join(baseDir, 'commands', `${skillName}.toml`),
        content: getAiArtifactContent('gemini', 'skill', { profile, skillName }) + '\n',
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
      content:
        withManagedBlock('shared-llms', getAiArtifactContent('shared', 'llms', { profile })) + '\n',
      mode: 'merge',
      label: 'llms.txt',
    })
    artifacts.push({
      kind: 'llms-full',
      path: join(llmsDir, 'llms-full.txt'),
      content:
        withManagedBlock(
          'shared-llms-full',
          getAiArtifactContent('shared', 'llms-full', { profile }),
        ) + '\n',
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
