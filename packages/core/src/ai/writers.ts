import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs'
import { dirname } from 'path'
import type { AiArtifact, AiInstallStatus } from './types'

export function withManagedBlock(id: string, content: string): string {
  return [
    `<!-- pagesmith-ai:${id}:start -->`,
    content.trim(),
    `<!-- pagesmith-ai:${id}:end -->`,
  ].join('\n')
}

export function writeArtifact(artifact: AiArtifact, force = false): AiInstallStatus {
  mkdirSync(dirname(artifact.path), { recursive: true })

  if (!existsSync(artifact.path)) {
    writeFileSync(artifact.path, artifact.content)
    return 'written'
  }

  const current = readFileSync(artifact.path, 'utf-8')
  if (current === artifact.content) {
    return 'unchanged'
  }

  if (artifact.mode === 'replace') {
    writeFileSync(artifact.path, artifact.content)
    return 'replaced'
  }

  const markerId = `${artifact.assistant ?? 'shared'}-${artifact.kind}`
  const start = `<!-- pagesmith-ai:${markerId}:start -->`
  const end = `<!-- pagesmith-ai:${markerId}:end -->`

  if (current.includes(start) && current.includes(end)) {
    const pattern = new RegExp(`${escapeForRegExp(start)}[\\s\\S]*?${escapeForRegExp(end)}`, 'm')
    const next = current.replace(pattern, artifact.content)
    if (next === current) return 'unchanged'
    writeFileSync(artifact.path, next)
    return 'merged'
  }

  if (force) {
    writeFileSync(artifact.path, artifact.content)
    return 'replaced'
  }

  const next = `${current.trimEnd()}\n\n${artifact.content}\n`
  writeFileSync(artifact.path, next)
  return 'merged'
}

export function escapeForRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
