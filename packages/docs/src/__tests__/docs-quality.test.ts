import { describe, expect, it } from 'vite-plus/test'
import { existsSync, readFileSync } from 'fs'
import JSON5 from 'json5'
import { join } from 'path'

describe('docs quality guards', () => {
  it('keeps the guide onboarding series first for AI-first navigation', () => {
    const guideMetaPath = join(
      import.meta.dirname,
      '..',
      '..',
      '..',
      '..',
      'docs',
      'content',
      'guide',
      'meta.json5',
    )
    expect(existsSync(guideMetaPath)).toBe(true)

    const meta = JSON5.parse(readFileSync(guideMetaPath, 'utf-8')) as {
      series?: Array<{ slug?: string; articles?: string[] }>
    }

    expect(meta.series?.[0]?.slug).toBe('onboarding')
    expect(meta.series?.[0]?.articles).toEqual([
      'choose-your-path',
      'ai-assistants',
      'prompts-cookbook',
      'mcp-setup',
    ])
  })

  it('hosts the setup prompt and schema files on the root docs site config', () => {
    const docsConfigPath = join(
      import.meta.dirname,
      '..',
      '..',
      '..',
      '..',
      'pagesmith.config.json5',
    )
    expect(existsSync(docsConfigPath)).toBe(true)

    const config = JSON5.parse(readFileSync(docsConfigPath, 'utf-8')) as {
      assets?: Record<string, string[]>
    }

    expect(config.assets?.['/prompts']).toEqual(['./packages/docs/ai-guidelines/setup-docs.md'])
    expect(config.assets?.['/']).toEqual(
      expect.arrayContaining(['./llms.txt', './llms-full.txt', './packages/docs/schemas']),
    )
  })

  it('ships published AI guidance and schemas from package manifests', () => {
    const corePackagePath = join(import.meta.dirname, '..', '..', '..', 'core', 'package.json')
    const docsPackagePath = join(import.meta.dirname, '..', '..', 'package.json')

    const corePackage = JSON.parse(readFileSync(corePackagePath, 'utf-8')) as {
      files?: string[]
      exports?: Record<string, string | Record<string, string>>
      ai?: { context?: string; fullContext?: string; agentsDir?: string }
    }
    const docsPackage = JSON.parse(readFileSync(docsPackagePath, 'utf-8')) as {
      files?: string[]
      exports?: Record<string, string | Record<string, string>>
      ai?: { context?: string; fullContext?: string; agentsDir?: string }
    }

    expect(corePackage.files).toContain('ai-guidelines/')
    expect(corePackage.exports?.['./ai-guidelines/*']).toBe('./ai-guidelines/*')
    expect(corePackage.exports?.['./llms']).toBe('./ai-guidelines/llms.txt')
    expect(corePackage.ai).toEqual(
      expect.objectContaining({
        context: './ai-guidelines/llms.txt',
        fullContext: './ai-guidelines/llms-full.txt',
        agentsDir: './ai-guidelines',
      }),
    )

    expect(docsPackage.files).toEqual(expect.arrayContaining(['ai-guidelines/', 'schemas/']))
    expect(docsPackage.exports?.['./ai-guidelines/*']).toBe('./ai-guidelines/*')
    expect(docsPackage.exports?.['./llms']).toBe('./ai-guidelines/llms.txt')
    expect(docsPackage.exports?.['./agents/setup-docs']).toBe('./ai-guidelines/setup-docs.md')
    expect(docsPackage.ai).toEqual(
      expect.objectContaining({
        context: './ai-guidelines/llms.txt',
        fullContext: './ai-guidelines/llms-full.txt',
        agentsDir: './ai-guidelines',
      }),
    )
  })
})
