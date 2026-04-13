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

  it('keeps repo docs configs pointing at the version-matched package schema', () => {
    const rootConfigPath = join(
      import.meta.dirname,
      '..',
      '..',
      '..',
      '..',
      'pagesmith.config.json5',
    )
    const exampleConfigPath = join(
      import.meta.dirname,
      '..',
      '..',
      '..',
      '..',
      'examples',
      'doc-site',
      'pagesmith.config.json5',
    )

    const rootConfig = JSON5.parse(readFileSync(rootConfigPath, 'utf-8')) as {
      $schema?: string
    }
    const exampleConfig = JSON5.parse(readFileSync(exampleConfigPath, 'utf-8')) as {
      $schema?: string
    }

    expect(rootConfig.$schema).toBe(
      './node_modules/@pagesmith/docs/schemas/pagesmith-config.schema.json',
    )
    expect(exampleConfig.$schema).toBe(
      '../../node_modules/@pagesmith/docs/schemas/pagesmith-config.schema.json',
    )
  })

  it('ships package-owned bins, AI guidance, and schemas from package manifests', () => {
    const corePackageDir = join(import.meta.dirname, '..', '..', '..', 'core')
    const sitePackageDir = join(import.meta.dirname, '..', '..', '..', 'site')
    const docsPackageDir = join(import.meta.dirname, '..', '..')
    const corePackagePath = join(corePackageDir, 'package.json')
    const sitePackagePath = join(sitePackageDir, 'package.json')
    const docsPackagePath = join(docsPackageDir, 'package.json')

    const corePackage = JSON.parse(readFileSync(corePackagePath, 'utf-8')) as {
      bin?: Record<string, string>
      files?: string[]
      exports?: Record<string, string | Record<string, string>>
      ai?: { context?: string; fullContext?: string; agentsDir?: string }
    }
    const sitePackage = JSON.parse(readFileSync(sitePackagePath, 'utf-8')) as {
      bin?: Record<string, string>
      files?: string[]
      exports?: Record<string, string | Record<string, string>>
      ai?: { context?: string; fullContext?: string; agentsDir?: string }
    }
    const docsPackage = JSON.parse(readFileSync(docsPackagePath, 'utf-8')) as {
      bin?: Record<string, string>
      files?: string[]
      exports?: Record<string, string | Record<string, string>>
      ai?: {
        context?: string
        fullContext?: string
        agentsDir?: string
        mcp?: { command?: string }
      }
    }

    expect(corePackage.bin?.['pagesmith-core']).toBe('./dist/cli/bin.mjs')
    expect(sitePackage.bin?.pagesmith).toBe('./dist/cli/bin.mjs')
    expect(sitePackage.bin?.['pagesmith-site']).toBe('./dist/cli/bin.mjs')
    expect(docsPackage.bin?.['pagesmith-docs']).toBe('./dist/cli/bin.mjs')

    expect(corePackage.files).toContain('ai-guidelines/')
    expect(corePackage.exports?.['./ai-guidelines/*']).toBe('./ai-guidelines/*')
    expect(corePackage.exports?.['./llms']).toBe('./ai-guidelines/llms.txt')
    expect(corePackage.exports?.['./llms-full']).toBe('./ai-guidelines/llms-full.txt')
    expect(corePackage.exports?.['./agents/setup-core']).toBe('./ai-guidelines/setup-core.md')
    expect(corePackage.ai).toEqual(
      expect.objectContaining({
        context: './ai-guidelines/llms.txt',
        fullContext: './ai-guidelines/llms-full.txt',
        agentsDir: './ai-guidelines',
      }),
    )

    expect(sitePackage.files).toContain('ai-guidelines/')
    expect(sitePackage.exports?.['./ai-guidelines/*']).toBe('./ai-guidelines/*')
    expect(sitePackage.exports?.['./llms']).toBe('./ai-guidelines/llms.txt')
    expect(sitePackage.exports?.['./llms-full']).toBe('./ai-guidelines/llms-full.txt')
    expect(sitePackage.exports?.['./agents/setup-site']).toBe('./ai-guidelines/setup-site.md')
    expect(sitePackage.ai).toEqual(
      expect.objectContaining({
        context: './ai-guidelines/llms.txt',
        fullContext: './ai-guidelines/llms-full.txt',
        agentsDir: './ai-guidelines',
      }),
    )

    expect(docsPackage.files).toEqual(expect.arrayContaining(['ai-guidelines/', 'schemas/']))
    expect(docsPackage.exports?.['./ai-guidelines/*']).toBe('./ai-guidelines/*')
    expect(docsPackage.exports?.['./llms']).toBe('./ai-guidelines/llms.txt')
    expect(docsPackage.exports?.['./llms-full']).toBe('./ai-guidelines/llms-full.txt')
    expect(docsPackage.exports?.['./agents/setup-docs']).toBe('./ai-guidelines/setup-docs.md')
    expect(docsPackage.ai).toEqual(
      expect.objectContaining({
        context: './ai-guidelines/llms.txt',
        fullContext: './ai-guidelines/llms-full.txt',
        agentsDir: './ai-guidelines',
      }),
    )
    expect(docsPackage.ai?.mcp?.command).toBe('pagesmith-docs mcp --stdio')

    expect(existsSync(join(corePackageDir, 'ai-guidelines', 'setup-core.md'))).toBe(true)
    expect(existsSync(join(sitePackageDir, 'ai-guidelines', 'setup-site.md'))).toBe(true)
    expect(existsSync(join(docsPackageDir, 'ai-guidelines', 'setup-docs.md'))).toBe(true)
    expect(existsSync(join(corePackageDir, 'ai-guidelines', 'llms.txt'))).toBe(true)
    expect(existsSync(join(sitePackageDir, 'ai-guidelines', 'llms.txt'))).toBe(true)
    expect(existsSync(join(docsPackageDir, 'ai-guidelines', 'llms.txt'))).toBe(true)
    expect(existsSync(join(docsPackageDir, 'schemas', 'pagesmith-config.schema.json'))).toBe(true)
  })
})
