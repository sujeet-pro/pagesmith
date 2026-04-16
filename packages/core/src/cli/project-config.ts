/**
 * Read project-level defaults for the pagesmith-core CLI.
 *
 * Precedence (highest first):
 *   1. Command-line flags.
 *   2. `pagesmith-core.config.json5` at the project root.
 *   3. `pagesmith.config.json5` `cli.core` block.
 *   4. Built-in defaults.
 */

import { existsSync, readFileSync } from 'fs'
import { resolve } from 'path'
import JSON5 from 'json5'

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

export function readCoreCliDefaults(cwd = process.cwd()): CoreCliDefaults {
  const dedicated = resolve(cwd, 'pagesmith-core.config.json5')
  if (existsSync(dedicated)) {
    const parsed = readJson5(dedicated)
    if (parsed && typeof parsed === 'object') {
      return parsed as CoreCliDefaults
    }
  }

  const shared = resolve(cwd, 'pagesmith.config.json5')
  if (existsSync(shared)) {
    const parsed = readJson5(shared)
    if (parsed && typeof parsed === 'object') {
      const cli = (parsed as { cli?: { core?: CoreCliDefaults } }).cli
      if (cli?.core) return cli.core
    }
  }

  return {}
}
