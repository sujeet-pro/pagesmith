import { homedir } from 'os'
import { join, resolve } from 'path'

import type {
  AiArtifact,
  AiArtifactKind,
  AiAssistant,
  AiInstallOptions,
  AiInstallProfile,
  AiInstallResult,
  AiInstallStatus,
} from './types'

import { withManagedBlock, writeArtifact } from './writers'
import { renderLlmsFullTxt, renderLlmsTxt, renderMarkdownGuidelines } from './content-shared'
import {
  renderClaudeSkill,
  renderUpdateAllDocsSkill,
  renderUpdateDocsSkill,
} from './content-claude'
import { renderCodexSkill } from './content-codex'
import { renderGeminiCommand } from './content-gemini'
import { renderMemoryFile } from './content-memory'

// Re-export all types
export type {
  AiArtifact,
  AiArtifactKind,
  AiAssistant,
  AiInstallOptions,
  AiInstallProfile,
  AiInstallResult,
  AiInstallScope,
  AiInstallStatus,
  AiWriteMode,
} from './types'

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

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function getAiArtifactContent(
  assistant: AiAssistant | 'shared',
  kind: AiArtifactKind,
  options: { profile?: AiInstallProfile; skillName?: string } = {},
): string {
  const skillName = options.skillName ?? DEFAULT_SKILL_NAME
  const profile = options.profile ?? 'default'

  if (assistant === 'shared') {
    if (kind === 'llms') return renderLlmsTxt()
    if (kind === 'llms-full') return renderLlmsFullTxt()
    if (kind === 'markdown-guidelines') return renderMarkdownGuidelines()
    return renderLlmsFullTxt()
  }

  if (kind === 'memory') {
    return renderMemoryFile(assistant, profile)
  }

  if (kind === 'skill') {
    switch (assistant) {
      case 'claude':
        return renderClaudeSkill(skillName, profile)
      case 'codex':
        return renderCodexSkill(profile)
      case 'gemini':
        return renderGeminiCommand(skillName, profile)
    }
  }

  if (kind === 'markdown-guidelines') {
    return renderMarkdownGuidelines()
  }

  if (kind === 'update-docs') {
    return renderUpdateDocsSkill(profile)
  }
  if (kind === 'update-all-docs') {
    return renderUpdateAllDocsSkill(profile)
  }

  if (kind === 'llms') return renderLlmsTxt()
  return renderLlmsFullTxt()
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
      // Claude skill (uses .claude/skills/ format with SKILL.md + frontmatter)
      const skillDir =
        scope === 'project'
          ? join(cwd, '.claude', 'skills', skillName)
          : join(home, '.claude', 'skills', skillName)
      artifacts.push({
        assistant,
        kind: 'skill',
        path: join(skillDir, 'SKILL.md'),
        content: getAiArtifactContent('claude', 'skill', { profile, skillName }) + '\n',
        mode: 'replace',
        label: `${assistant} skill`,
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

  // Markdown guidelines — always installed for project scope
  if (scope === 'project') {
    artifacts.push({
      kind: 'markdown-guidelines',
      path: join(cwd, '.pagesmith', 'markdown-guidelines.md'),
      content: renderMarkdownGuidelines() + '\n',
      mode: 'replace',
      label: 'markdown guidelines',
    })
  }

  // /update-docs Claude skill — installed when Claude is included and scope is project
  if (scope === 'project' && assistants.includes('claude')) {
    artifacts.push({
      assistant: 'claude',
      kind: 'update-docs',
      path: join(cwd, '.claude', 'skills', 'update-docs', 'SKILL.md'),
      content: renderUpdateDocsSkill(profile) + '\n',
      mode: 'replace',
      label: 'claude update-docs skill',
    })
    artifacts.push({
      assistant: 'claude',
      kind: 'update-all-docs',
      path: join(cwd, '.claude', 'skills', 'ps-update-all-docs', 'SKILL.md'),
      content: renderUpdateAllDocsSkill(profile) + '\n',
      mode: 'replace',
      label: 'claude ps-update-all-docs skill',
    })
  }

  if (shouldIncludeLlms(options)) {
    const llmsDir = scope === 'project' ? cwd : join(home, '.pagesmith')
    artifacts.push({
      kind: 'llms',
      path: join(llmsDir, 'llms.txt'),
      content: withManagedBlock('shared-llms', renderLlmsTxt()) + '\n',
      mode: 'merge',
      label: 'llms.txt',
    })
    artifacts.push({
      kind: 'llms-full',
      path: join(llmsDir, 'llms-full.txt'),
      content: withManagedBlock('shared-llms-full', renderLlmsFullTxt()) + '\n',
      mode: 'merge',
      label: 'llms-full.txt',
    })
  }

  return artifacts
}

export function installAiArtifacts(options: AiInstallOptions = {}): AiInstallResult[] {
  const artifacts = getAiArtifacts(options)
  if (options.dryRun) {
    return artifacts.map((artifact) => ({
      assistant: artifact.assistant,
      kind: artifact.kind,
      path: artifact.path,
      label: artifact.label,
      status: 'unchanged' as AiInstallStatus,
    }))
  }
  return artifacts.map((artifact) => ({
    assistant: artifact.assistant,
    kind: artifact.kind,
    path: artifact.path,
    label: artifact.label,
    status: writeArtifact(artifact, options.force),
  }))
}
