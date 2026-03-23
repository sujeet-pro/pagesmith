/**
 * Meta validator.
 *
 * Validates each meta.json5 file and checks that series article slug refs
 * point to existing content files.
 */

import { existsSync, readFileSync } from 'fs'
import JSON5 from 'json5'
import { join, relative } from 'path'
import { PageTypeMetaSchema } from '../../schemas'
import type { Issue, ValidationContext, Validator } from './types'

export const metaValidator: Validator = {
  name: 'meta',

  async validate(ctx): Promise<Issue[]> {
    const issues: Issue[] = []
    const pageTypes = ctx.config.pageTypes as string[] | undefined
    if (!pageTypes) return issues

    for (const pageType of pageTypes) {
      const metaPath = join(ctx.contentDir, pageType, 'meta.json5')
      const relPath = relative(process.cwd(), metaPath)

      if (!existsSync(metaPath)) {
        issues.push({
          file: relPath,
          severity: 'error',
          rule: 'meta/missing',
          message: `meta.json5 not found for page type "${pageType}"`,
        })
        continue
      }

      let meta: any
      try {
        const raw = readFileSync(metaPath, 'utf-8')
        meta = JSON5.parse(raw)
        const result = PageTypeMetaSchema.safeParse(meta)
        if (!result.success) {
          for (const error of result.error.issues) {
            issues.push({
              file: relPath,
              severity: 'error',
              rule: 'meta/schema',
              message: `${error.path.join('.')}: ${error.message}`,
            })
          }
        }
      } catch (err: any) {
        issues.push({
          file: relPath,
          severity: 'error',
          rule: 'meta/parse',
          message: `Failed to parse: ${err.message}`,
        })
        continue
      }

      // Check series article slugs point to existing content
      if (meta.series && Array.isArray(meta.series)) {
        for (const series of meta.series) {
          if (!series.articles || !Array.isArray(series.articles)) continue
          for (const slug of series.articles) {
            const articleDir = join(ctx.contentDir, pageType, slug)
            const articleFile = join(articleDir, 'README.md')
            if (!existsSync(articleFile)) {
              issues.push({
                file: relPath,
                severity: 'error',
                rule: 'meta/missing-article',
                message: `Series "${series.slug}" references article "${slug}" but ${pageType}/${slug}/README.md not found`,
              })
            }
          }
        }
      }
    }

    return issues
  },
}
