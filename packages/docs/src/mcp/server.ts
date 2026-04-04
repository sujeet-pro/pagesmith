import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { asTextResource, getPackageVersion, resolvePackageDocPath } from '@pagesmith/core/mcp'
import { existsSync, readFileSync } from 'fs'
import { basename, isAbsolute, resolve } from 'path'
import { z } from 'zod'
import { loadDocsPages, loadSectionMetas } from '../content.js'
import { resolveDocsConfig, validateConfig, type ResolvedDocsConfig } from '../config.js'

export type DocsMcpServerOptions = {
  rootDir?: string
  configPath?: string
}

function withConfigPath(baseRoot: string, configPath?: string): string {
  const candidate = configPath ?? 'pagesmith.config.json5'
  return isAbsolute(candidate) ? candidate : resolve(baseRoot, candidate)
}

function resolveConfigOrThrow(baseRoot: string, configPath?: string): ResolvedDocsConfig {
  const absolutePath = withConfigPath(baseRoot, configPath)
  if (!existsSync(absolutePath)) {
    throw new Error(
      `No pagesmith.config.json5 file found at ${absolutePath}. Pass --config or tool input configPath.`,
    )
  }
  return resolveDocsConfig(absolutePath)
}

export function createDocsMcpServer(options: DocsMcpServerOptions = {}): McpServer {
  const baseRoot = resolve(options.rootDir ?? process.cwd())
  const defaultConfigPath = withConfigPath(baseRoot, options.configPath)

  const server = new McpServer(
    {
      name: '@pagesmith/docs-mcp',
      version: getPackageVersion(import.meta.dirname),
    },
    {
      instructions: [
        'Use docs_* tools to inspect @pagesmith/docs projects.',
        `Default config path: ${defaultConfigPath}`,
      ].join('\n'),
    },
  )

  server.registerTool(
    'docs_validate_config',
    {
      description: 'Validate pagesmith.config.json5 and return warnings/errors.',
      inputSchema: {
        configPath: z.string().optional(),
      },
    },
    async ({ configPath }: { configPath?: string }) => {
      const config = resolveConfigOrThrow(baseRoot, configPath)
      const issues = validateConfig(config)
      const hasErrors = issues.some((issue) => issue.severity === 'error')
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                configPath: withConfigPath(baseRoot, configPath),
                hasErrors,
                issues,
              },
              null,
              2,
            ),
          },
        ],
      }
    },
  )

  server.registerTool(
    'docs_resolve_config',
    {
      description: 'Resolve effective docs config including defaults and inferred values.',
      inputSchema: {
        configPath: z.string().optional(),
      },
    },
    async ({ configPath }: { configPath?: string }) => {
      const config = resolveConfigOrThrow(baseRoot, configPath)
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                rootDir: config.rootDir,
                contentDir: config.contentDir,
                outDir: config.outDir,
                basePath: config.basePath,
                title: config.title,
                name: config.name,
                origin: config.origin,
                search: config.search,
                sidebar: config.sidebar,
                theme: config.theme,
              },
              null,
              2,
            ),
          },
        ],
      }
    },
  )

  server.registerTool(
    'docs_list_pages',
    {
      description: 'List resolved docs pages with route paths and source files.',
      inputSchema: {
        configPath: z.string().optional(),
        section: z.string().optional(),
      },
    },
    async ({ configPath, section }: { configPath?: string; section?: string }) => {
      const config = resolveConfigOrThrow(baseRoot, configPath)
      const sectionMetas = loadSectionMetas(config.contentDir)
      const pages = await loadDocsPages(config, sectionMetas)
      const filtered = section ? pages.filter((page) => page.section === section) : pages

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                count: filtered.length,
                pages: filtered.map((page) => ({
                  title: page.title,
                  routePath: page.routePath,
                  contentSlug: page.contentSlug,
                  section: page.section,
                  sourcePath: page.sourcePath,
                  isHome: page.isHome,
                  lastUpdated: page.lastUpdated,
                })),
              },
              null,
              2,
            ),
          },
        ],
      }
    },
  )

  server.registerTool(
    'docs_get_page',
    {
      description: 'Get one docs page by slug or route and return metadata plus markdown source.',
      inputSchema: {
        slug: z.string(),
        configPath: z.string().optional(),
      },
    },
    async ({ slug, configPath }: { slug: string; configPath?: string }) => {
      const normalized =
        slug === '/' ? '/' : `/${slug}`.replace(/\/+/g, '/').replace(/\/$/, '').replace(/^\//, '')
      const config = resolveConfigOrThrow(baseRoot, configPath)
      const sectionMetas = loadSectionMetas(config.contentDir)
      const pages = await loadDocsPages(config, sectionMetas)

      const page = pages.find((entry) => {
        if (slug === '/') return entry.contentSlug === '/'
        return (
          entry.contentSlug === normalized ||
          entry.routePath === `/${normalized}` ||
          entry.routePath === `/${normalized}/`
        )
      })

      if (!page) {
        throw new Error(`Page not found for slug "${slug}"`)
      }

      const sourceMarkdown = existsSync(page.sourcePath)
        ? readFileSync(page.sourcePath, 'utf-8')
        : ''

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                title: page.title,
                routePath: page.routePath,
                contentSlug: page.contentSlug,
                section: page.section,
                sourcePath: page.sourcePath,
                headings: page.headings,
                sourceMarkdown,
              },
              null,
              2,
            ),
          },
        ],
      }
    },
  )

  server.registerTool(
    'docs_search_pages',
    {
      description:
        'Search docs pages by matching a query string against titles, descriptions, and raw markdown content. Returns up to 20 matching pages with a content snippet. Case-insensitive.',
      inputSchema: {
        query: z.string().describe('Search query string'),
        section: z.string().optional().describe('Filter results to a specific section'),
      },
    },
    async ({ query, section }: { query: string; section?: string }) => {
      if (!query.trim()) {
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ query, matches: [], count: 0 }, null, 2),
            },
          ],
        }
      }

      const config = resolveConfigOrThrow(baseRoot)
      const sectionMetas = loadSectionMetas(config.contentDir)
      const pages = await loadDocsPages(config, sectionMetas)
      const filtered = section ? pages.filter((page) => page.section === section) : pages

      const queryLower = query.toLowerCase()
      const maxResults = 20
      const snippetRadius = 120

      type SearchMatch = {
        slug: string
        title: string
        section: string | undefined
        snippet: string
      }

      const matches: SearchMatch[] = []

      for (const page of filtered) {
        if (matches.length >= maxResults) break

        const titleMatch = page.title.toLowerCase().includes(queryLower)
        const descriptionText =
          typeof page.frontmatter.description === 'string' ? page.frontmatter.description : ''
        const descriptionMatch = descriptionText.toLowerCase().includes(queryLower)

        // Read raw markdown for content search
        const rawMarkdown = existsSync(page.sourcePath)
          ? readFileSync(page.sourcePath, 'utf-8')
          : ''
        const contentMatch = rawMarkdown.toLowerCase().includes(queryLower)

        if (!titleMatch && !descriptionMatch && !contentMatch) continue

        // Build a snippet from the first match location
        let snippet: string
        if (titleMatch) {
          snippet = `[title] ${page.title}`
        } else if (descriptionMatch) {
          snippet = `[description] ${descriptionText}`
        } else {
          // Extract a snippet around the first content match
          const matchIndex = rawMarkdown.toLowerCase().indexOf(queryLower)
          const start = Math.max(0, matchIndex - snippetRadius)
          const end = Math.min(rawMarkdown.length, matchIndex + query.length + snippetRadius)
          const raw = rawMarkdown.slice(start, end).replace(/\n+/g, ' ').trim()
          snippet = (start > 0 ? '...' : '') + raw + (end < rawMarkdown.length ? '...' : '')
        }

        matches.push({
          slug: page.contentSlug,
          title: page.title,
          section: page.section,
          snippet,
        })
      }

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                query,
                section: section ?? null,
                count: matches.length,
                matches,
              },
              null,
              2,
            ),
          },
        ],
      }
    },
  )

  server.registerResource(
    'docs-agent-usage',
    'pagesmith://docs/agents/usage',
    {
      title: '@pagesmith/docs agent usage',
      description: 'Version-matched AI usage guide for @pagesmith/docs.',
      mimeType: 'text/markdown',
    },
    async () =>
      asTextResource(
        'pagesmith://docs/agents/usage',
        resolvePackageDocPath(import.meta.dirname, 'docs/agents/usage.md'),
      ),
  )

  server.registerResource(
    'docs-llms-full',
    'pagesmith://docs/llms-full',
    {
      title: '@pagesmith/docs llms-full',
      description: 'Version-matched full AI reference for @pagesmith/docs.',
      mimeType: 'text/markdown',
    },
    async () =>
      asTextResource(
        'pagesmith://docs/llms-full',
        resolvePackageDocPath(import.meta.dirname, 'docs/llms-full.txt'),
      ),
  )

  server.registerResource(
    'docs-reference',
    'pagesmith://docs/reference',
    {
      title: '@pagesmith/docs reference',
      description: 'Full package reference for docs configuration, CLI, and layouts.',
      mimeType: 'text/markdown',
    },
    async () =>
      asTextResource(
        'pagesmith://docs/reference',
        resolvePackageDocPath(import.meta.dirname, 'REFERENCE.md'),
      ),
  )

  server.registerResource(
    'core-reference',
    'pagesmith://core/reference',
    {
      title: '@pagesmith/core reference',
      description: 'Core package reference for content layer and markdown pipeline.',
      mimeType: 'text/markdown',
    },
    async () =>
      asTextResource(
        'pagesmith://core/reference',
        resolve(import.meta.dirname, '..', '..', '..', 'core', 'REFERENCE.md'),
      ),
  )

  return server
}

export async function startDocsMcpServer(options: DocsMcpServerOptions = {}): Promise<void> {
  const server = createDocsMcpServer(options)
  const transport = new StdioServerTransport()
  await server.connect(transport)
  // Keep logs on stderr; stdout is reserved for MCP protocol messages.
  console.error(
    `[pagesmith:mcp] @pagesmith/docs MCP server started (root=${basename(resolve(options.rootDir ?? process.cwd()))})`,
  )
}
