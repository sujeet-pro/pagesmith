import { describe, expect, it } from 'vite-plus/test'
import {
  SiteUserConfigSchema,
  normalizeBasePath,
  parseSiteConfig,
  stripBasePath,
  withBasePath,
  withTrailingSlash,
} from './config.js'

describe('@pagesmith/site config helpers', () => {
  it('parses the common custom-site config surface and preserves unknown top-level keys', () => {
    const parsed = parseSiteConfig({
      name: 'Custom Site',
      title: 'Custom Site',
      description: 'Reusable site shell',
      origin: 'https://example.com',
      basePath: '/docs',
      footerLinks: [{ label: 'Guide', path: '/guide' }],
      search: { enabled: true, showImages: false, showSubResults: true },
      theme: {
        defaultColorScheme: 'auto',
        defaultTheme: 'paper',
        defaultTextSize: 'base',
      },
      server: { devPort: 3000, previewPort: 4173 },
      customPresetData: { featureFlag: true },
    })

    expect(parsed.name).toBe('Custom Site')
    expect(parsed.basePath).toBe('/docs')
    expect(parsed.customPresetData).toEqual({ featureFlag: true })
    expect(SiteUserConfigSchema.safeParse(parsed).success).toBe(true)
  })

  it('normalizes and applies base paths consistently', () => {
    expect(normalizeBasePath(undefined)).toBe('')
    expect(normalizeBasePath('/')).toBe('')
    expect(normalizeBasePath('docs/')).toBe('/docs')

    expect(withBasePath('/docs', '/guide')).toBe('/docs/guide')
    expect(withBasePath('/docs', '/docs/guide')).toBe('/docs/guide')
    expect(withBasePath('/docs', 'guide')).toBe('guide')
    expect(withBasePath('/docs', 'https://example.com/guide')).toBe('https://example.com/guide')

    expect(stripBasePath('/docs/guide/getting-started', '/docs')).toBe('/guide/getting-started')
    expect(stripBasePath('/docs', '/docs')).toBe('/')
    expect(stripBasePath('/guide/getting-started', '/docs')).toBe('/guide/getting-started')
  })

  it('ensures trailing slashes for route hrefs', () => {
    expect(withTrailingSlash('/')).toBe('/')
    expect(withTrailingSlash('/guide')).toBe('/guide/')
    expect(withTrailingSlash('/guide/')).toBe('/guide/')
  })
})
