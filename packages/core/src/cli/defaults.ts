/**
 * Read project-level defaults for the pagesmith-core CLI.
 *
 * Precedence (highest first):
 *   1. Command-line flags.
 *   2. `pagesmith-core.config.{ts,json5}` at the project root.
 *   3. `pagesmith.config.{ts,mts,js,mjs,json5,json}` `cli.core` block.
 *   4. Built-in defaults.
 *
 * The loader is async so it can read TypeScript configs via the shared
 * `loadPagesmithConfig` helper from `@pagesmith/core/cli-kit`.
 */

import { existsSync, readFileSync } from 'fs'
import JSON5 from 'json5'
import { resolve } from 'path'
import { loadPagesmithConfig } from '../cli-kit/load-config.js'

export type CoreCliDefaults = {
  ai?: {
    assistants?: Array<'claude' | 'codex' | 'gemini'>
    scope?: 'project' | 'user'
    profile?: 'default' | 'docs'
    skillName?: string
    includeLlms?: boolean
  }
  create?: {
    template?: string
  }
  skills?: {
    packages?: string[]
    target?: string
  }
}

function readJson5(path: string): unknown {
  try {
    return JSON5.parse(readFileSync(path, 'utf-8'))
  } catch {
    return undefined
  }
}

function pickCliCore(config: Record<string, unknown> | undefined): CoreCliDefaults | undefined {
  if (!config) return undefined
  const cli = config.cli as { core?: CoreCliDefaults } | undefined
  return cli?.core
}

export async function readCoreCliDefaults(cwd = process.cwd()): Promise<CoreCliDefaults> {
  const dedicated = resolve(cwd, 'pagesmith-core.config.json5')
  if (existsSync(dedicated)) {
    const parsed = readJson5(dedicated)
    if (parsed && typeof parsed === 'object') return parsed as CoreCliDefaults
  }

  const dedicatedTs = resolve(cwd, 'pagesmith-core.config.ts')
  if (existsSync(dedicatedTs)) {
    // For dedicated .ts overrides, still go through the unified loader so we
    // get the same TS resolution semantics as the main pagesmith.config.ts.
    const result = await loadPagesmithConfig({ cwd, explicitPath: dedicatedTs })
    if (result.config) return result.config as CoreCliDefaults
  }

  const shared = await loadPagesmithConfig({ cwd })
  return pickCliCore(shared.config) ?? {}
}
