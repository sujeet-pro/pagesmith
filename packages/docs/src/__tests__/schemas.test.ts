import { describe, expect, it } from 'vite-plus/test'
import { existsSync, readFileSync } from 'fs'
import { join } from 'path'
import {
  DocsConfigSchema,
  DocsHomeFrontmatterSchema,
  DocsPageFrontmatterSchema,
  buildDocsJsonSchemas,
} from '../schemas/index.js'

describe('docs schemas', () => {
  it('parses docs config fields used during bootstrap', () => {
    const result = DocsConfigSchema.parse({
      name: 'Acme Docs',
      contentDir: './docs',
      outDir: './gh-pages',
      copyright: {
        projectName: 'Acme Docs',
        startYear: 2024,
        endYear: null,
      },
      footerLinks: [{ label: 'Guide', path: '/guide' }],
      server: { host: '127.0.0.1', devPort: 3000, previewPort: 4000 },
      markdown: {
        allowDangerousHtml: false,
        math: 'auto',
        shiki: {
          themes: { light: 'github-light', dark: 'github-dark' },
          defaultShowLineNumbers: false,
        },
      },
    })

    expect(result.contentDir).toBe('./docs')
    expect(result.footerLinks).toEqual([{ label: 'Guide', path: '/guide' }])
    expect(result.copyright?.endYear).toBeNull()
    expect(result.server?.host).toBe('127.0.0.1')
    expect(result.server?.previewPort).toBe(4000)
    expect(result.markdown?.allowDangerousHtml).toBe(false)
    expect(result.markdown?.math).toBe('auto')
    expect(result.markdown?.shiki?.defaultShowLineNumbers).toBe(false)
  })

  it('parses grouped footer links', () => {
    const result = DocsConfigSchema.parse({
      footerLinks: [
        {
          header: 'Docs',
          links: [
            { label: 'Guide', path: '/guide' },
            { label: 'Reference', path: '/reference' },
          ],
        },
      ],
    })

    expect(Array.isArray(result.footerLinks)).toBe(true)
    expect(result.footerLinks?.[0]).toEqual({
      header: 'Docs',
      links: [
        { label: 'Guide', path: '/guide' },
        { label: 'Reference', path: '/reference' },
      ],
    })
  })

  it('parses regular page frontmatter', () => {
    const result = DocsPageFrontmatterSchema.parse({
      title: 'Configuration',
      description: 'Reference page',
      sidebarLabel: 'Config',
      order: 2,
    })

    expect(result.title).toBe('Configuration')
    expect(result.sidebarLabel).toBe('Config')
    expect(result.order).toBe(2)
  })

  it('parses layout and chrome frontmatter', () => {
    const result = DocsPageFrontmatterSchema.parse({
      title: 'Bare',
      layout: 'listing',
      chrome: { header: false, sidebar: true, toc: false, footer: true, customFlag: true },
    })

    expect(result.layout).toBe('listing')
    expect(result.chrome).toMatchObject({
      header: false,
      sidebar: true,
      toc: false,
      footer: true,
      customFlag: true,
    })
  })

  it('parses home page convenience frontmatter', () => {
    const result = DocsHomeFrontmatterSchema.parse({
      title: 'Acme',
      tagline: 'Ship docs fast',
      install: 'npm add @pagesmith/docs',
      actions: [{ text: 'Get Started', link: '/guide/getting-started', theme: 'brand' }],
      features: [{ title: 'Fast setup', details: 'Bootstrap docs in an existing repo.' }],
      packages: [{ name: '@acme/core', description: 'Main package', href: '/reference/api' }],
      codeExample: {
        label: 'Install',
        title: 'Getting started',
        code: 'npm add @pagesmith/docs',
      },
    })

    expect(result.install).toBe('npm add @pagesmith/docs')
    expect(result.actions?.[0]?.theme).toBe('brand')
    expect(result.codeExample?.title).toBe('Getting started')
  })

  it('keeps committed JSON schema files in sync', () => {
    for (const schemaFile of buildDocsJsonSchemas()) {
      const filePath = join(import.meta.dirname, '..', '..', 'schemas', schemaFile.fileName)

      expect(existsSync(filePath)).toBe(true)

      const onDisk = JSON.parse(readFileSync(filePath, 'utf-8'))
      expect(onDisk).toEqual(schemaFile.schema)
    }
  })

  it('publishes installed-package and docs schema paths consistently', () => {
    for (const schemaFile of buildDocsJsonSchemas()) {
      expect(schemaFile.nodeModulesPath).toBe(
        `node_modules/@pagesmith/docs/schemas/${schemaFile.fileName}`,
      )
      expect(schemaFile.sitePath).toBe(`/schemas/${schemaFile.fileName}`)
    }
  })
})
