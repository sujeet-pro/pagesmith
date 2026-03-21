/**
 * Config validator.
 *
 * Validates site.json5 against SiteConfigSchema.
 */

import { existsSync, readFileSync, } from 'fs'
import JSON5 from 'json5'
import { join, relative, } from 'path'
import { SiteConfigSchema, } from '../../schemas'
import type { Issue, ValidationContext, Validator, } from './types'

export const configValidator: Validator = {
  name: 'config',

  async validate(ctx,): Promise<Issue[]> {
    const issues: Issue[] = []
    const configPath = join(ctx.contentDir, 'site.json5',)
    const relPath = relative(process.cwd(), configPath,)

    if (!existsSync(configPath,)) {
      issues.push({
        file: relPath,
        severity: 'error',
        rule: 'config/missing',
        message: 'site.json5 not found',
      },)
      return issues
    }

    try {
      const raw = readFileSync(configPath, 'utf-8',)
      const data = JSON5.parse(raw,)
      const result = SiteConfigSchema.safeParse(data,)
      if (!result.success) {
        for (const error of result.error.issues) {
          issues.push({
            file: relPath,
            severity: 'error',
            rule: 'config/schema',
            message: `${error.path.join('.',)}: ${error.message}`,
          },)
        }
      }
    } catch (err: any) {
      issues.push({
        file: relPath,
        severity: 'error',
        rule: 'config/parse',
        message: `Failed to parse: ${err.message}`,
      },)
    }

    return issues
  },
}
