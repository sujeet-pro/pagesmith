import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import { afterEach, describe, expect, it } from 'vite-plus/test'
import { createDocsMcpServer } from '../mcp/server.js'

function parseTextResult(result: any) {
  expect(result.content).toHaveLength(1)
  expect(result.content[0].type).toBe('text')
  return JSON.parse(result.content[0].text)
}

describe('createDocsMcpServer', () => {
  let rootDir = ''

  afterEach(() => {
    if (rootDir) {
      rmSync(rootDir, { recursive: true, force: true })
      rootDir = ''
    }
  })

  function createDocsFixture() {
    rootDir = mkdtempSync(join(tmpdir(), 'ps-docs-mcp-'))
    const contentDir = join(rootDir, 'content')
    mkdirSync(join(contentDir, 'guide', 'getting-started'), { recursive: true })

    writeFileSync(
      join(rootDir, 'pagesmith.config.json5'),
      [
        '{',
        "  name: 'Docs MCP Test',",
        "  title: 'Docs MCP Test',",
        "  description: 'Docs MCP test site',",
        "  origin: 'https://example.dev',",
        "  contentDir: './content',",
        '  search: { enabled: false },',
        '}',
      ].join('\n'),
      'utf-8',
    )

    writeFileSync(
      join(contentDir, 'README.md'),
      [
        '---',
        'title: Home',
        'description: Home page',
        '---',
        '',
        '# Home',
        '',
        'Welcome home.',
      ].join('\n'),
      'utf-8',
    )

    writeFileSync(
      join(contentDir, 'guide', 'getting-started', 'README.md'),
      [
        '---',
        'title: Getting Started',
        'description: Searchable setup guide',
        '---',
        '',
        '# Getting Started',
        '',
        'This page includes a searchable onboarding phrase.',
      ].join('\n'),
      'utf-8',
    )
  }

  it('creates a docs MCP server instance', () => {
    const server = createDocsMcpServer()
    expect(server).toBeDefined()
  })

  it('registers the documented tools and resources', () => {
    createDocsFixture()
    const server = createDocsMcpServer({ rootDir }) as any

    expect(Object.keys(server._registeredTools)).toEqual(
      expect.arrayContaining([
        'docs_validate_config',
        'docs_resolve_config',
        'docs_list_pages',
        'docs_get_page',
        'docs_search_pages',
      ]),
    )
    expect(Object.keys(server._registeredResources)).toEqual(
      expect.arrayContaining([
        'pagesmith://docs/agents/usage',
        'pagesmith://docs/llms-full',
        'pagesmith://docs/reference',
        'pagesmith://core/reference',
      ]),
    )
  })

  it('validates config and lists resolved pages', async () => {
    createDocsFixture()
    const server = createDocsMcpServer({ rootDir }) as any

    const validation = parseTextResult(
      await server._registeredTools.docs_validate_config.handler({}),
    )
    expect(validation.hasErrors).toBe(false)
    expect(validation.configPath).toBe(join(rootDir, 'pagesmith.config.json5'))

    const listing = parseTextResult(await server._registeredTools.docs_list_pages.handler({}))
    expect(listing.count).toBe(2)
    expect(listing.pages.map((page: any) => page.contentSlug)).toEqual(
      expect.arrayContaining(['/', 'guide/getting-started']),
    )
  })

  it('returns page source and search matches from the docs project', async () => {
    createDocsFixture()
    const server = createDocsMcpServer({ rootDir }) as any

    const page = parseTextResult(
      await server._registeredTools.docs_get_page.handler({ slug: 'guide/getting-started' }),
    )
    expect(page.title).toBe('Getting Started')
    expect(page.sourceMarkdown).toContain('searchable onboarding phrase')

    const search = parseTextResult(
      await server._registeredTools.docs_search_pages.handler({ query: 'onboarding phrase' }),
    )
    expect(search.count).toBe(1)
    expect(search.matches[0]).toMatchObject({
      slug: 'guide/getting-started',
      title: 'Getting Started',
    })
  })

  it('serves docs and core reference resources', async () => {
    createDocsFixture()
    const server = createDocsMcpServer({ rootDir }) as any

    const docsResource =
      await server._registeredResources['pagesmith://docs/llms-full'].readCallback()
    expect(docsResource.contents[0].uri).toBe('pagesmith://docs/llms-full')
    expect(docsResource.contents[0].text).toContain('docs_search_pages')

    const coreResource =
      await server._registeredResources['pagesmith://core/reference'].readCallback()
    expect(coreResource.contents[0].uri).toBe('pagesmith://core/reference')
    expect(coreResource.contents[0].text).toContain('@pagesmith/core')
  })
})
