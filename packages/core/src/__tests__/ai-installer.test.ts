import { describe, expect, it } from 'vite-plus/test'
import { getAiArtifactContent, getAiArtifacts } from '../ai'

describe('getAiArtifacts', () => {
  it('generates artifacts for all assistants at project scope', () => {
    const artifacts = getAiArtifacts({
      assistants: ['claude', 'codex', 'gemini'],
      scope: 'project',
      cwd: '/tmp/test-project',
    })
    // Should include memory files for all 3 assistants
    const memoryArtifacts = artifacts.filter((a) => a.kind === 'memory')
    expect(memoryArtifacts).toHaveLength(3)
    // Should include skills for all 3
    const skillArtifacts = artifacts.filter((a) => a.kind === 'skill')
    expect(skillArtifacts).toHaveLength(3)
    // Should include markdown guidelines
    const guidelines = artifacts.filter((a) => a.kind === 'markdown-guidelines')
    expect(guidelines).toHaveLength(1)
    // Should include llms files
    const llms = artifacts.filter((a) => a.kind === 'llms' || a.kind === 'llms-full')
    expect(llms).toHaveLength(2)
    // Should include update-docs and update-all-docs for claude
    const updateDocs = artifacts.filter((a) => a.kind === 'update-docs')
    expect(updateDocs).toHaveLength(1)
    expect(updateDocs[0].assistant).toBe('claude')
  })

  it('respects scope: user (no update-docs skills, no guidelines)', () => {
    const artifacts = getAiArtifacts({
      assistants: ['claude'],
      scope: 'user',
      homeDir: '/tmp/test-home',
    })
    const updateDocs = artifacts.filter(
      (a) => a.kind === 'update-docs' || a.kind === 'update-all-docs',
    )
    expect(updateDocs).toHaveLength(0)
    const guidelines = artifacts.filter((a) => a.kind === 'markdown-guidelines')
    expect(guidelines).toHaveLength(0)
  })

  it('includes docs-specific content for docs profile', () => {
    const defaultContent = getAiArtifactContent('claude', 'memory', { profile: 'default' })
    const docsContent = getAiArtifactContent('claude', 'memory', { profile: 'docs' })
    expect(docsContent).toContain('Docs-specific rules')
    expect(defaultContent).not.toContain('Docs-specific rules')
    expect(docsContent).toContain('node_modules/@pagesmith/docs/ai-guidelines/docs-guidelines.md')
    expect(docsContent).toContain('node_modules/@pagesmith/docs/schemas/')
    expect(docsContent).not.toContain('node_modules/@pagesmith/docs/docs/')
  })

  it('generates valid managed block markers', () => {
    const artifacts = getAiArtifacts({
      assistants: ['claude'],
      scope: 'project',
      cwd: '/tmp/test-project',
    })
    const memory = artifacts.find((a) => a.kind === 'memory' && a.assistant === 'claude')
    expect(memory?.content).toContain('<!-- pagesmith-ai:claude-memory:start -->')
    expect(memory?.content).toContain('<!-- pagesmith-ai:claude-memory:end -->')
  })

  it('excludes llms when includeLlms is false', () => {
    const artifacts = getAiArtifacts({
      assistants: ['claude'],
      scope: 'project',
      cwd: '/tmp/test',
      includeLlms: false,
    })
    const llms = artifacts.filter((a) => a.kind === 'llms' || a.kind === 'llms-full')
    expect(llms).toHaveLength(0)
  })

  it('uses custom skill name', () => {
    const content = getAiArtifactContent('claude', 'skill', { skillName: 'my-tool' })
    expect(content).toContain('name: my-tool')
  })

  it('references packaged docs guidance and schemas in docs profile skills', () => {
    const content = getAiArtifactContent('claude', 'skill', { profile: 'docs' })
    expect(content).toContain('node_modules/@pagesmith/docs/ai-guidelines/setup-docs.md')
    expect(content).toContain('node_modules/@pagesmith/docs/ai-guidelines/docs-guidelines.md')
    expect(content).toContain('node_modules/@pagesmith/docs/schemas/*.schema.json')
    expect(content).toContain('./node_modules/@pagesmith/docs/schemas/pagesmith-config.schema.json')
    expect(content).not.toContain('node_modules/@pagesmith/docs/docs/')
  })

  it('keeps docs update skills aligned to root config and packaged guidance paths', () => {
    const content = getAiArtifactContent('claude', 'update-docs', { profile: 'docs' })
    expect(content).toContain('node_modules/@pagesmith/docs/ai-guidelines/setup-docs.md')
    expect(content).toContain('Read `pagesmith.config.json5` to understand the docs configuration')
    expect(content).not.toContain('docs/pagesmith.config.json5')
  })
})
