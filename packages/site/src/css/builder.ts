import { readFileSync, rmSync, writeFileSync } from 'fs'
import { bundle } from 'lightningcss'
import { dirname, relative, resolve } from 'path'
import { fileURLToPath } from 'url'

export type CssBuildOptions = {
  minify?: boolean
  targets?: {
    chrome?: number
    firefox?: number
    safari?: number
  }
}

function toImportPath(fromDir: string, targetPath: string): string {
  const rel = relative(fromDir, targetPath).replace(/\\/g, '/')
  return rel.startsWith('.') ? rel : `./${rel}`
}

function rewriteBarePackageImports(entryPath: string): {
  entryPath: string
  cleanup?: () => void
} {
  const resolvedEntry = resolve(entryPath)
  const source = readFileSync(resolvedEntry, 'utf-8')
  const entryDir = dirname(resolvedEntry)
  let changed = false

  const rewritten = source.replace(
    /@import\s+(url\(\s*)?["']([^"']+)["'](\s*\))?([^;]*);/g,
    (full, urlOpen = '', specifier: string, urlClose = '', tail = '') => {
      if (
        specifier.startsWith('.') ||
        specifier.startsWith('/') ||
        specifier.startsWith('data:') ||
        specifier.startsWith('http://') ||
        specifier.startsWith('https://')
      ) {
        return full
      }

      const resolvedSpecifier = import.meta.resolve(specifier)
      const targetPath = fileURLToPath(resolvedSpecifier)
      changed = true
      return `@import ${urlOpen}"${toImportPath(entryDir, targetPath)}"${urlClose}${tail};`
    },
  )

  if (!changed) return { entryPath: resolvedEntry }

  const rewrittenEntry = resolve(entryDir, `.pagesmith-build-css-${process.pid}-${Date.now()}.css`)
  writeFileSync(rewrittenEntry, rewritten)
  return {
    entryPath: rewrittenEntry,
    cleanup: () => rmSync(rewrittenEntry, { force: true }),
  }
}

export function buildCss(entryPath: string, config?: CssBuildOptions): string {
  const targets = config?.targets ?? {}
  const rewritten = rewriteBarePackageImports(entryPath)
  try {
    const { code } = bundle({
      filename: rewritten.entryPath,
      minify: config?.minify ?? true,
      targets: {
        chrome: (targets.chrome ?? 123) << 16,
        firefox: (targets.firefox ?? 120) << 16,
        safari: (targets.safari ?? 18) << 16,
      },
    })
    return new TextDecoder().decode(code)
  } catch (err) {
    throw new Error(
      `CSS build failed for ${entryPath}: ${err instanceof Error ? err.message : String(err)}`,
      { cause: err },
    )
  } finally {
    rewritten.cleanup?.()
  }
}
