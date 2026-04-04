import { describe, it, expect } from 'vite-plus/test'
import { getPrevNext, buildSiteModel, getSitePayload } from '../navigation.js'
import type { DocsPage, SidebarSection } from '../content.js'
import type { ResolvedDocsConfig } from '../config.js'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const mockPage = (overrides: Partial<DocsPage>): DocsPage => ({
  title: 'Test Page',
  routePath: '/test',
  contentSlug: 'test',
  section: 'guide',
  frontmatter: {},
  html: '<p>test</p>',
  headings: [],
  sourcePath: '/tmp/test.md',
  isHome: false,
  layoutName: 'page',
  ...overrides,
})

const mockConfig: ResolvedDocsConfig = {
  rootDir: '/tmp',
  contentDir: '/tmp/content',
  outDir: '/tmp/gh-pages',
  publicDir: '/tmp/public',
  basePath: '',
  name: 'Test',
  title: 'Test Docs',
  description: 'Test',
  origin: 'https://example.com',
  language: 'en',
  footerLinks: [],
  sidebar: { collapsible: false },
  search: { enabled: true, showImages: false, showSubResults: true, pagefindFlags: [] },
  favicon: false,
  faviconFallback: false,
  appleTouchIcon: false,
  lastUpdated: false,
  sitemap: true,
  server: { devPort: 3000, previewPort: 4000, strictPort: false },
  assets: new Map(),
}

// ---------------------------------------------------------------------------
// getPrevNext
// ---------------------------------------------------------------------------
describe('getPrevNext', () => {
  const sections: SidebarSection[] = [
    {
      title: 'Guide',
      slug: 'guide',
      items: [
        { title: 'Introduction', path: '/guide/intro' },
        { title: 'Getting Started', path: '/guide/getting-started' },
        { title: 'Advanced', path: '/guide/advanced' },
      ],
    },
  ]

  it('returns both prev and next for a middle item', () => {
    const result = getPrevNext(sections, '/guide/getting-started')

    expect(result.prev).toEqual({ title: 'Introduction', path: '/guide/intro' })
    expect(result.next).toEqual({ title: 'Advanced', path: '/guide/advanced' })
  })

  it('returns only next for the first item', () => {
    const result = getPrevNext(sections, '/guide/intro')

    expect(result.prev).toBeUndefined()
    expect(result.next).toEqual({ title: 'Getting Started', path: '/guide/getting-started' })
  })

  it('returns only prev for the last item', () => {
    const result = getPrevNext(sections, '/guide/advanced')

    expect(result.prev).toEqual({ title: 'Getting Started', path: '/guide/getting-started' })
    expect(result.next).toBeUndefined()
  })

  it('returns empty object for empty sections', () => {
    const result = getPrevNext([], '/guide/intro')

    expect(result).toEqual({})
  })

  it('returns empty object for undefined sections', () => {
    const result = getPrevNext(undefined, '/guide/intro')

    expect(result).toEqual({})
  })

  it('returns empty object when routePath is not found', () => {
    const result = getPrevNext(sections, '/nonexistent')

    expect(result).toEqual({})
  })

  it('handles items with children (nested sidebar)', () => {
    const nestedSections: SidebarSection[] = [
      {
        title: 'Guide',
        slug: 'guide',
        items: [
          { title: 'Overview', path: '/guide/overview' },
          {
            title: 'Setup',
            path: '/guide/setup',
            children: [
              { title: 'Install', path: '/guide/setup/install' },
              { title: 'Configure', path: '/guide/setup/configure' },
            ],
          },
          { title: 'Usage', path: '/guide/usage' },
        ],
      },
    ]

    // The flattened order is: Overview, Setup, Install, Configure, Usage
    const result = getPrevNext(nestedSections, '/guide/setup/install')

    expect(result.prev).toEqual({ title: 'Setup', path: '/guide/setup' })
    expect(result.next).toEqual({ title: 'Configure', path: '/guide/setup/configure' })
  })

  it('navigates across multiple sidebar sections', () => {
    const multiSections: SidebarSection[] = [
      {
        title: 'Guide',
        slug: 'guide',
        items: [{ title: 'Intro', path: '/guide/intro' }],
      },
      {
        title: 'Reference',
        slug: 'reference',
        items: [{ title: 'API', path: '/reference/api' }],
      },
    ]

    const result = getPrevNext(multiSections, '/reference/api')

    expect(result.prev).toEqual({ title: 'Intro', path: '/guide/intro' })
    expect(result.next).toBeUndefined()
  })
})

// ---------------------------------------------------------------------------
// buildSiteModel
// ---------------------------------------------------------------------------
describe('buildSiteModel', () => {
  it('builds nav items and sidebar from pages', () => {
    const pages = [
      mockPage({
        title: 'Home',
        routePath: '/',
        contentSlug: '/',
        section: undefined,
        isHome: true,
        layoutName: 'home',
      }),
      mockPage({
        title: 'Introduction',
        routePath: '/guide/intro',
        contentSlug: 'guide/intro',
        section: 'guide',
      }),
      mockPage({
        title: 'API',
        routePath: '/reference/api',
        contentSlug: 'reference/api',
        section: 'reference',
      }),
    ]

    const model = buildSiteModel(mockConfig, pages)

    // Nav items should include guide and reference but not home
    expect(model.navItems.length).toBe(2)
    expect(model.navItems[0].label).toBe('Guide')
    expect(model.navItems[1].label).toBe('Reference')

    // Sidebar should have entries for both sections
    expect(model.sidebarBySection.has('guide')).toBe(true)
    expect(model.sidebarBySection.has('reference')).toBe(true)
  })

  it('excludes home page from sidebar sections', () => {
    const pages = [
      mockPage({
        title: 'Home',
        routePath: '/',
        contentSlug: '/',
        section: undefined,
        isHome: true,
        layoutName: 'home',
      }),
      mockPage({
        title: 'Getting Started',
        routePath: '/guide/getting-started',
        contentSlug: 'guide/getting-started',
        section: 'guide',
      }),
    ]

    const model = buildSiteModel(mockConfig, pages)

    // Home page has no section, so it should not appear in sidebarBySection
    expect(model.sidebarBySection.has('guide')).toBe(true)
    expect(model.sidebarBySection.size).toBe(1)

    // pageByPath should contain both
    expect(model.pageByPath.size).toBe(2)
    expect(model.pageByPath.has('/')).toBe(true)
    expect(model.pageByPath.has('/guide/getting-started')).toBe(true)
  })

  it('uses basePath in nav item paths', () => {
    const config = { ...mockConfig, basePath: '/docs' }
    const pages = [
      mockPage({
        title: 'Intro',
        routePath: '/guide/intro',
        contentSlug: 'guide/intro',
        section: 'guide',
      }),
    ]

    const model = buildSiteModel(config, pages)

    expect(model.navItems[0].path).toBe('/docs/guide/intro')
  })

  it('uses section meta displayName for nav label', () => {
    const pages = [
      mockPage({
        title: 'Intro',
        routePath: '/guide/intro',
        contentSlug: 'guide/intro',
        section: 'guide',
      }),
    ]
    const sectionMetas = new Map([['guide', { displayName: 'User Guide' }]])

    const model = buildSiteModel(mockConfig, pages, undefined, sectionMetas)

    expect(model.navItems[0].label).toBe('User Guide')
  })

  it('uses toTitleCase for nav label when no meta or landing page', () => {
    const pages = [
      mockPage({
        title: 'Intro',
        routePath: '/getting-started/intro',
        contentSlug: 'getting-started/intro',
        section: 'getting-started',
      }),
    ]

    const model = buildSiteModel(mockConfig, pages)

    // toTitleCase('getting-started') → 'Getting Started'
    expect(model.navItems[0].label).toBe('Getting Started')
  })

  it('builds sidebar items from section pages', () => {
    const pages = [
      mockPage({
        title: 'First Page',
        routePath: '/guide/first',
        contentSlug: 'guide/first',
        section: 'guide',
      }),
      mockPage({
        title: 'Second Page',
        routePath: '/guide/second',
        contentSlug: 'guide/second',
        section: 'guide',
      }),
    ]

    const model = buildSiteModel(mockConfig, pages)
    const guideSidebar = model.sidebarBySection.get('guide')

    expect(guideSidebar).toBeDefined()
    expect(guideSidebar!.length).toBe(1) // One SidebarSection with slug 'guide'
    expect(guideSidebar![0].items.length).toBe(2)
  })

  it('stores rootMeta and sectionMetas on the model', () => {
    const pages = [
      mockPage({
        title: 'Intro',
        routePath: '/guide/intro',
        contentSlug: 'guide/intro',
        section: 'guide',
      }),
    ]
    const rootMeta = { displayName: 'My Docs' }
    const sectionMetas = new Map([['guide', { displayName: 'Guide Section' }]])

    const model = buildSiteModel(mockConfig, pages, rootMeta, sectionMetas)

    expect(model.rootMeta).toBe(rootMeta)
    expect(model.sectionMetas).toBe(sectionMetas)
  })
})

// ---------------------------------------------------------------------------
// getSitePayload
// ---------------------------------------------------------------------------
describe('getSitePayload', () => {
  it('returns config fields in the payload', () => {
    const model = buildSiteModel(mockConfig, [])
    const payload = getSitePayload(mockConfig, model)

    expect(payload.name).toBe('Test')
    expect(payload.title).toBe('Test Docs')
    expect(payload.description).toBe('Test')
    expect(payload.language).toBe('en')
    expect(payload.basePath).toBe('')
  })

  it('prefixes internal footer link paths with basePath', () => {
    const config = {
      ...mockConfig,
      basePath: '/docs',
      footerLinks: [
        { label: 'About', path: '/about' },
        { label: 'External', path: 'https://example.com' },
      ],
    }
    const model = buildSiteModel(config, [])
    const payload = getSitePayload(config, model)

    expect(payload.footerLinks[0].path).toBe('/docs/about')
    // External links should not be prefixed
    expect(payload.footerLinks[1].path).toBe('https://example.com')
  })

  it('does not double-prefix footer links that already have basePath', () => {
    const config = {
      ...mockConfig,
      basePath: '/docs',
      footerLinks: [{ label: 'About', path: '/docs/about' }],
    }
    const model = buildSiteModel(config, [])
    const payload = getSitePayload(config, model)

    expect(payload.footerLinks[0].path).toBe('/docs/about')
  })

  it('leaves footer links unchanged when basePath is empty', () => {
    const config = {
      ...mockConfig,
      basePath: '',
      footerLinks: [{ label: 'About', path: '/about' }],
    }
    const model = buildSiteModel(config, [])
    const payload = getSitePayload(config, model)

    expect(payload.footerLinks[0].path).toBe('/about')
  })

  it('uses rootMeta footer links when available', () => {
    const config = {
      ...mockConfig,
      basePath: '/docs',
      footerLinks: [{ label: 'Config Link', path: '/config' }],
    }
    const rootMeta = {
      footerLinks: [{ label: 'Meta Link', path: '/meta' }],
    }
    const model = buildSiteModel(config, [], rootMeta)
    const payload = getSitePayload(config, model)

    expect(payload.footerLinks.length).toBe(1)
    expect(payload.footerLinks[0].label).toBe('Meta Link')
    expect(payload.footerLinks[0].path).toBe('/docs/meta')
  })

  it('includes favicon path with basePath prefix when favicon is set', () => {
    const config = {
      ...mockConfig,
      basePath: '/docs',
      favicon: '/tmp/public/favicon.svg',
    }
    const model = buildSiteModel(config, [])
    const payload = getSitePayload(config, model)

    expect(payload.favicon).toBe('/docs/favicon.svg')
  })

  it('returns false for favicon when disabled', () => {
    const config = {
      ...mockConfig,
      favicon: false as const,
    }
    const model = buildSiteModel(config, [])
    const payload = getSitePayload(config, model)

    expect(payload.favicon).toBe(false)
  })

  it('includes nav items from the site model', () => {
    const pages = [
      mockPage({
        title: 'Intro',
        routePath: '/guide/intro',
        contentSlug: 'guide/intro',
        section: 'guide',
      }),
    ]
    const model = buildSiteModel(mockConfig, pages)
    const payload = getSitePayload(mockConfig, model)

    expect(payload.navItems).toEqual(model.navItems)
  })

  it('includes search and sidebar config', () => {
    const model = buildSiteModel(mockConfig, [])
    const payload = getSitePayload(mockConfig, model)

    expect(payload.search).toEqual(mockConfig.search)
    expect(payload.sidebar).toEqual(mockConfig.sidebar)
  })
})
