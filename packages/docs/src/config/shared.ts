import { existsSync, readFileSync } from 'fs'
import JSON5 from 'json5'
import { dirname, resolve } from 'path'
import { fileURLToPath } from 'url'

export function readJson5File<T>(filePath: string): T | undefined {
  if (!existsSync(filePath)) return undefined
  return JSON5.parse(readFileSync(filePath, 'utf-8')) as T
}

export function toTitleCase(value: string): string {
  return value.replace(/[-_]/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase())
}

export function getPackageDir(): string {
  try {
    // Resolve from the package entry so this remains correct after bundling.
    const entryPath = fileURLToPath(import.meta.resolve('@pagesmith/docs'))
    return resolve(dirname(entryPath), '..')
  } catch {
    return resolve(import.meta.dirname, '..', '..')
  }
}

export function getThemeRoot(): string {
  return resolve(getPackageDir(), 'theme')
}

export function getThemeStylesEntry(): string {
  return resolve(getThemeRoot(), 'styles/main.css')
}

export function getThemeRuntimeEntry(): string {
  return resolve(getThemeRoot(), 'runtime/main.ts')
}

/** Prefix a path with a base path, avoiding double slashes. */
export function withBase(basePath: string, path: string): string {
  const base = basePath.replace(/\/+$/, '')
  if (!base) return path
  if (path.startsWith(base)) return path
  return `${base}${path.startsWith('/') ? '' : '/'}${path}`
}
