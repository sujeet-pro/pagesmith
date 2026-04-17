#!/usr/bin/env -S node --strip-types --no-warnings

/**
 * Pagesmith repo validation orchestrator.
 *
 * Runs both content validation (markdown source) and build-output validation
 * (gh-pages) against the in-repo docs site using the workspace
 * `@pagesmith/docs` package. Layers on a few repo-specific checks that
 * matter for this monorepo:
 *
 *   - The published-package guidance files referenced in
 *     `pagesmith.config.json5#assets./prompts/` must each exist on disk so
 *     `/prompts/<name>.md` URLs really resolve at runtime.
 *
 * Usage:
 *   npm run validate:pagesmith              full check
 *   npm run validate:pagesmith -- --content content only
 *   npm run validate:pagesmith -- --build   build output only
 *   npm run validate:pagesmith -- --full    enable opt-in strict checks
 */

import { existsSync } from 'fs'
import { resolve } from 'path'
import { validateDocs } from '@pagesmith/docs'

const repoRoot = resolve(import.meta.dirname, '..')
const args = process.argv.slice(2)

const slice = args.find((arg) => arg === '--content' || arg === '--build')
const skipContent = slice === '--build'
const skipBuild = slice === '--content'
const fullPreset = args.includes('--full')

const result = await validateDocs({
  configPath: resolve(repoRoot, 'pagesmith.config.json5'),
  skipContent,
  skipBuild,
  internalLinksMustBeMarkdown: fullPreset,
  requireBothTrailingSlashForms: fullPreset,
  requireRasterModernFormats: fullPreset,
  // The repo docs site relies on `<picture>` themed diagrams, so leave
  // theme-variant + alt-text + html-img + variant-pair checks at their
  // strict defaults.
})

let totalErrors = result.errors
let totalWarnings = result.warnings

// ── repo-specific cross-reference: assets passthrough must exist ───────
if (!skipContent) {
  console.log(`\n[repo-cross-references]`)
  const projectErrors: string[] = []
  for (const [prefix, sources] of result.config.assets.entries()) {
    for (const source of sources) {
      if (!existsSync(source)) {
        projectErrors.push(
          `pagesmith.config.json5 assets[${JSON.stringify(prefix)}] references missing source: ${source}`,
        )
      }
    }
  }
  if (projectErrors.length === 0) {
    console.log(`  every passthrough asset source exists on disk.`)
  } else {
    for (const message of projectErrors) console.log(`  \u2717 ${message}`)
  }
  totalErrors += projectErrors.length
}

console.log(
  `\nSummary: ${totalErrors} error(s), ${totalWarnings} warning(s) — ${
    totalErrors === 0 ? 'PASSED' : 'FAILED'
  }`,
)
process.exit(totalErrors === 0 ? 0 : 1)
