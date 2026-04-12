import { basename, resolve } from 'path'
import { existsSync } from 'fs'
import type { ConfigValidationIssue, ResolvedDocsConfig } from './types'
import { DocsConfigSchema } from '../schemas/index.js'

/**
 * Validate a resolved docs config. Returns issues found.
 * Checks required fields, verifies referenced directories and asset files exist.
 */
export function validateConfig(config: ResolvedDocsConfig): ConfigValidationIssue[] {
  const issues: ConfigValidationIssue[] = []

  const uc = config._userConfig
  const schemaResult = DocsConfigSchema.safeParse(uc ?? {})
  if (!schemaResult.success) {
    for (const issue of schemaResult.error.issues) {
      const field = issue.path.length > 0 ? issue.path.join('.') : 'config'
      issues.push({
        field,
        message: issue.message,
        severity: 'error',
      })
    }
  }
  const hasExplicitName = uc ? !!(uc.name || uc.title) : config.name !== basename(config.rootDir)
  const hasExplicitTitle = uc ? !!(uc.title || uc.name) : config.title !== basename(config.rootDir)

  if (!hasExplicitName) {
    issues.push({
      field: 'name',
      message: 'Missing "name" in pagesmith.config.json5 — using directory name as fallback.',
      severity: 'warn',
    })
  }

  if (!hasExplicitTitle) {
    issues.push({
      field: 'title',
      message: 'Missing "title" in pagesmith.config.json5 — using directory name as fallback.',
      severity: 'warn',
    })
  }

  if (config.description === 'Documentation site powered by @pagesmith/docs') {
    issues.push({
      field: 'description',
      message: 'Missing "description" in pagesmith.config.json5 — using default placeholder.',
      severity: 'warn',
    })
  }

  if (config.origin === 'https://example.com') {
    issues.push({
      field: 'origin',
      message:
        'Missing "origin" in pagesmith.config.json5 — canonical URLs will use https://example.com. Set this to your production URL.',
      severity: 'warn',
    })
  }

  if (!existsSync(config.contentDir)) {
    issues.push({
      field: 'contentDir',
      message: `Content directory does not exist: ${config.contentDir}`,
      severity: 'error',
    })
  }

  for (const [outputPath, sources] of config.assets) {
    for (const sourcePath of sources) {
      if (!existsSync(sourcePath)) {
        issues.push({
          field: `assets["${outputPath}"]`,
          message: `Asset source does not exist: ${sourcePath}`,
          severity: 'error',
        })
      }
    }
  }

  if (typeof config.favicon === 'string' && !existsSync(config.favicon)) {
    issues.push({
      field: 'favicon',
      message: `Favicon file does not exist: ${config.favicon}`,
      severity: 'warn',
    })
  }

  if (config.theme?.layouts) {
    for (const [layoutName, layoutPath] of Object.entries(config.theme.layouts)) {
      const resolvedLayout = resolve(config.rootDir, layoutPath)
      if (!existsSync(resolvedLayout)) {
        issues.push({
          field: `theme.layouts.${layoutName}`,
          message: `Layout file does not exist: ${resolvedLayout}`,
          severity: 'error',
        })
      }
    }
  }

  return issues
}

/**
 * Log validation issues to console. Returns true if there are any errors (severity: 'error').
 */
export function reportConfigIssues(issues: ConfigValidationIssue[]): boolean {
  let hasErrors = false
  for (const issue of issues) {
    if (issue.severity === 'error') {
      console.error(`\x1b[31m✗ [${issue.field}]\x1b[0m ${issue.message}`)
      hasErrors = true
    } else {
      console.warn(`\x1b[33m⚠ [${issue.field}]\x1b[0m ${issue.message}`)
    }
  }
  return hasErrors
}
