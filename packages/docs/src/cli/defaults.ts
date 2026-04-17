/**
 * Read prompt defaults for `pagesmith-docs init` (and surfaces dev/build/preview
 * options where useful) from any supported `pagesmith.config.{ts,...}` file.
 *
 * Goes through `loadPagesmithConfig` from `@pagesmith/core/cli-kit` so users
 * can author their config in JSON5 today and graduate to TypeScript later
 * without changing the CLI surface.
 */

import { basename } from 'path'
import { findPagesmithConfig, loadPagesmithConfig } from '@pagesmith/core/cli-kit'
import {
  detectFirstCommitYear,
  detectGitOrigin,
  resolveInitOrigin,
  toTitleCase,
} from '../config.js'
import type { DocsUserConfig } from '../config.js'
import { existsSync, readFileSync } from 'fs'
import { resolve } from 'path'
import type { InitAnswers } from './init-fs.js'
import { applyExistingConfigDefaults } from './init-fs.js'

function readPackageName(projectDir: string): string | undefined {
  try {
    const pkg = JSON.parse(readFileSync(resolve(projectDir, 'package.json'), 'utf-8')) as {
      name?: string
    }
    return pkg.name?.replace(/^@[^/]+\//, '')
  } catch {
    return undefined
  }
}

export type ResolvedInitDefaults = {
  /** Detected/merged answers used as prompt defaults. */
  defaults: InitAnswers
  /**
   * Path to the existing config file (if any) and its format. The docs init
   * command writes back to this path so users keep authoring in their chosen
   * format. JSON5/JSON files round-trip cleanly; .ts/.js/.mjs files are kept
   * read-only by init (the user owns code-shaped configs).
   */
  configPath: string
  configIsCode: boolean
  hasPackageJson: boolean
}

export async function resolveInitDefaults(options: {
  projectDir: string
  configPath?: string
}): Promise<ResolvedInitDefaults> {
  const { projectDir } = options
  const gitInfo = detectGitOrigin(projectDir)
  const pkgName = readPackageName(projectDir)
  const name = gitInfo?.repoName ?? pkgName ?? basename(projectDir)
  const basePath = gitInfo?.basePath ?? `/${name}`
  const origin =
    (await resolveInitOrigin(projectDir, gitInfo)) ?? gitInfo?.origin ?? 'https://example.com'
  const copyrightStartYear = detectFirstCommitYear(projectDir) ?? new Date().getFullYear()

  let defaults: InitAnswers = {
    name,
    title: toTitleCase(name),
    origin,
    basePath,
    contentDir: 'docs',
    copyrightStartYear,
    search: true,
    ai: false,
    starterContent: true,
  }

  // Look for an existing config — explicit --config path wins, otherwise
  // auto-discover using the unified loader's resolution order.
  const found = findPagesmithConfig({ cwd: projectDir, explicitPath: options.configPath })
  let resolvedConfigPath = found.configPath
  let configIsCode = false

  if (found.configPath && found.format) {
    const loaded = await loadPagesmithConfig({
      cwd: projectDir,
      explicitPath: found.configPath,
    })
    if (loaded.config) {
      defaults = applyExistingConfigDefaults(defaults, loaded.config as DocsUserConfig)
    }
    configIsCode =
      found.format === 'ts' ||
      found.format === 'mts' ||
      found.format === 'js' ||
      found.format === 'mjs'
  }

  // When no config exists yet, default to writing pagesmith.config.json5 next
  // to the project so init produces something the schema can validate.
  if (!resolvedConfigPath) {
    resolvedConfigPath = resolve(projectDir, 'pagesmith.config.json5')
  }

  return {
    defaults,
    configPath: resolvedConfigPath,
    configIsCode,
    hasPackageJson: existsSync(resolve(projectDir, 'package.json')),
  }
}
