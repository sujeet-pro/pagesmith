import { z } from 'zod'

export const DocsLinkSchema = z.object({
  label: z.string().describe('Display label for a navigation or footer link.'),
  path: z.string().describe('Destination URL or site-relative path.'),
})

export type DocsLink = z.infer<typeof DocsLinkSchema>

export const DocsFooterLinkGroupSchema = z.object({
  header: z.string().optional().describe('Optional column header for a grouped footer section.'),
  links: z
    .array(DocsLinkSchema)
    .describe('Links rendered vertically within a grouped footer column.'),
})

export type DocsFooterLinkGroup = z.infer<typeof DocsFooterLinkGroupSchema>

export const DocsFooterLinksSchema = z.union([
  z.array(DocsLinkSchema),
  z.array(DocsFooterLinkGroupSchema),
])

export type DocsFooterLinks = z.infer<typeof DocsFooterLinksSchema>

export const DocsMaintainerSchema = z.object({
  name: z.string().describe('Maintainer name shown in the default footer sign-off.'),
  link: z.string().optional().describe('Optional maintainer URL.'),
})

export type DocsMaintainer = z.infer<typeof DocsMaintainerSchema>

export const DocsCopyrightSchema = z.object({
  projectName: z
    .string()
    .optional()
    .describe('Project name shown in the copyright line. Defaults to the site name when omitted.'),
  startYear: z
    .int()
    .optional()
    .describe('Starting copyright year. Defaults to the first git commit year when available.'),
  endYear: z
    .union([z.int(), z.null()])
    .optional()
    .describe(
      'Optional fixed end year. Use null or omit it to render the build year and let the browser update it when needed.',
    ),
})

export type DocsCopyright = z.infer<typeof DocsCopyrightSchema>

export const DocsSidebarConfigSchema = z.object({
  collapsible: z.boolean().optional(),
})

export type DocsSidebarConfig = z.infer<typeof DocsSidebarConfigSchema>

export const DocsSearchConfigSchema = z.object({
  enabled: z.boolean().optional(),
  showImages: z.boolean().optional(),
  showSubResults: z.boolean().optional(),
  pagefindFlags: z.array(z.string()).optional(),
})

export type DocsSearchConfig = z.infer<typeof DocsSearchConfigSchema>

export const DocsThemeConfigSchema = z.object({
  lightColor: z.string().optional(),
  darkColor: z.string().optional(),
  layouts: z.record(z.string(), z.string()).optional(),
  socialImage: z.string().optional(),
  defaultColorScheme: z.enum(['auto', 'light', 'dark']).optional(),
  defaultTheme: z.enum(['paper', 'high-contrast']).optional(),
  defaultTextSize: z.enum(['small', 'base', 'large']).optional(),
})

export type DocsThemeConfig = z.infer<typeof DocsThemeConfigSchema>

export const DocsAnalyticsConfigSchema = z.object({
  googleAnalytics: z.string().optional(),
})

export type DocsAnalyticsConfig = z.infer<typeof DocsAnalyticsConfigSchema>

export const DocsEditLinkSchema = z.object({
  repo: z.string(),
  branch: z.string().optional(),
  label: z.string().optional(),
})

export type DocsEditLink = z.infer<typeof DocsEditLinkSchema>

export const DocsHomeConfigSchema = z.object({
  configFile: z.string().optional(),
})

export type DocsHomeConfig = z.infer<typeof DocsHomeConfigSchema>

export const DocsServerConfigSchema = z
  .object({
    host: z.string().optional(),
    devPort: z.number().optional(),
    previewPort: z.number().optional(),
    strictPort: z.boolean().optional(),
  })
  .strict()

export type DocsServerConfig = z.infer<typeof DocsServerConfigSchema>

export const DocsPackagesConfigSchema = z.record(
  z.string(),
  z.object({
    label: z.string(),
  }),
)

export type DocsPackagesConfig = z.infer<typeof DocsPackagesConfigSchema>

export const DocsMarkdownConfigSchema = z
  .object({
    allowDangerousHtml: z
      .boolean()
      .optional()
      .describe(
        'Whether to preserve raw HTML in markdown output. Defaults to true for trusted content sources.',
      ),
    math: z
      .union([z.boolean(), z.literal('auto')])
      .optional()
      .describe(
        'Math processing mode. Use "auto" to enable remark-math and MathJax only for pages that contain math markers.',
      ),
    shiki: z
      .object({
        themes: z
          .object({
            light: z.string(),
            dark: z.string(),
          })
          .optional()
          .describe('Dual Shiki theme names used for light and dark syntax highlighting.'),
        langAlias: z
          .record(z.string(), z.string())
          .optional()
          .describe('Map custom language aliases to Shiki-supported languages.'),
        defaultShowLineNumbers: z
          .boolean()
          .optional()
          .describe('Whether code blocks show line numbers by default.'),
      })
      .strict()
      .optional(),
  })
  .strict()

export type DocsMarkdownConfig = z.infer<typeof DocsMarkdownConfigSchema>

export const DocsConfigSchema = z.object({
  preset: z.string().optional(),
  presets: z.array(z.string()).optional(),
  name: z.string().optional(),
  title: z.string().optional(),
  description: z.string().optional(),
  origin: z.string().optional(),
  language: z.string().optional(),
  contentDir: z.string().optional(),
  outDir: z.string().optional(),
  publicDir: z.string().optional(),
  basePath: z.string().optional(),
  homeLink: z.string().optional(),
  trailingSlash: z
    .boolean()
    .optional()
    .describe('Use trailing slashes in generated links (default: false).'),
  maintainer: DocsMaintainerSchema.optional(),
  footerLinks: DocsFooterLinksSchema.optional(),
  footerText: z.string().optional(),
  copyright: DocsCopyrightSchema.optional(),
  sidebar: DocsSidebarConfigSchema.optional(),
  search: DocsSearchConfigSchema.optional(),
  theme: DocsThemeConfigSchema.optional(),
  analytics: DocsAnalyticsConfigSchema.optional(),
  favicon: z.union([z.string(), z.literal(false)]).optional(),
  icon: z.union([z.string(), z.literal(false)]).optional(),
  editLink: z.union([DocsEditLinkSchema, z.literal(false)]).optional(),
  lastUpdated: z.boolean().optional(),
  sitemap: z.boolean().optional(),
  markdown: DocsMarkdownConfigSchema.optional(),
  home: DocsHomeConfigSchema.optional(),
  packages: DocsPackagesConfigSchema.optional(),
  assets: z.record(z.string(), z.array(z.string())).optional(),
  server: DocsServerConfigSchema.optional(),
})

export type DocsConfig = z.infer<typeof DocsConfigSchema>
