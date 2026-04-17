/**
 * Rewrite every internal page link in docs/content and examples content
 * into the canonical ./relative/path/README.md form.
 * Preserves ?query and #anchor suffixes.
 *
 * Rules:
 *   - Links starting with `/guide/`, `/reference/`, or `/deployment` become
 *     the relative path from the source file to the target's `README.md`.
 *   - Relative links like `../bar/baz` get resolved against the source
 *     file, then converted to a canonical `./rel/README.md` form.
 *   - External URLs, mailto:, tel:, #-only, and asset links under
 *     `/prompts`, `/packages`, `/llms`, `/schemas` are left alone.
 *   - `.md` / `.mdx` links are left alone (already canonical).
 */

import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from 'fs'
import { dirname, join, relative, resolve } from 'path'

const repoRoot = resolve(import.meta.dirname, '..')

const CONTENT_ROOTS = [
  resolve(repoRoot, 'docs', 'content'),
  resolve(repoRoot, 'examples', 'blog-site', 'content'),
  resolve(repoRoot, 'examples', 'doc-site', 'content'),
  resolve(repoRoot, 'examples', 'frameworks', 'with-nextjs', 'content'),
  resolve(repoRoot, 'examples', 'frameworks', 'with-react', 'content'),
  resolve(repoRoot, 'examples', 'frameworks', 'with-solid', 'content'),
  resolve(repoRoot, 'examples', 'frameworks', 'with-svelte', 'content'),
  resolve(repoRoot, 'examples', 'frameworks', 'with-vanilla-ejs', 'content'),
  resolve(repoRoot, 'examples', 'frameworks', 'with-vanilla-hbs', 'content'),
]

const ABSOLUTE_PAGE_PREFIXES = ['/guide/', '/reference/', '/deployment', '/docs/', '/blog/']

const ASSET_PREFIXES = ['/prompts/', '/packages/', '/llms', '/schemas/', '/pagesmith/']

function isAbsolutePageLink(href: string): boolean {
  if (!href.startsWith('/')) return false
  for (const p of ASSET_PREFIXES) if (href.startsWith(p)) return false
  for (const p of ABSOLUTE_PAGE_PREFIXES) {
    if (href === p.replace(/\/$/, '') || href.startsWith(p)) return true
  }
  return false
}

function isExternalOrSpecial(href: string): boolean {
  return (
    href.startsWith('http://') ||
    href.startsWith('https://') ||
    href.startsWith('mailto:') ||
    href.startsWith('tel:') ||
    href.startsWith('//') ||
    href.startsWith('#') ||
    href.startsWith('data:')
  )
}

function splitSuffix(href: string): { path: string; suffix: string } {
  const q = href.indexOf('?')
  const h = href.indexOf('#')
  const cands = [q, h].filter((i) => i >= 0)
  const b = cands.length ? Math.min(...cands) : -1
  return b >= 0 ? { path: href.slice(0, b), suffix: href.slice(b) } : { path: href, suffix: '' }
}

type CandidateMap = Record<string, string>

/** Build a set of URL path → absolute file path mappings for an entire content root. */
function collectPageMap(root: string): CandidateMap {
  const map: CandidateMap = {}

  function walk(dir: string, urlParts: string[]): void {
    let entries: string[]
    try {
      entries = readdirSync(dir)
    } catch {
      return
    }
    for (const entry of entries) {
      if (entry.startsWith('.') || entry === 'node_modules' || entry === 'dist') continue
      const full = join(dir, entry)
      const stat = statSync(full)
      if (stat.isDirectory()) {
        if (entry === 'diagrams') continue
        walk(full, [...urlParts, entry])
      } else if (entry === 'README.md' || entry === 'index.md') {
        const urlPath = '/' + urlParts.join('/')
        map[urlPath] = full
      } else if (entry.endsWith('.md') || entry.endsWith('.mdx')) {
        const slug = entry.replace(/\.(md|mdx)$/, '')
        const urlPath = '/' + [...urlParts, slug].join('/')
        map[urlPath] = full
      }
    }
  }
  walk(root, [])
  return map
}

/** Convert an absolute docs URL into a canonical relative link. */
function absoluteToCanonical(
  href: string,
  sourceFile: string,
  pageMap: CandidateMap,
): string | null {
  const { path, suffix } = splitSuffix(href)
  const cleanPath = path.replace(/\/$/, '')
  const target = pageMap[cleanPath] || pageMap[cleanPath + '/']
  if (!target) return null
  let rel = relative(dirname(sourceFile), target).replace(/\\/g, '/')
  if (!rel.startsWith('.')) rel = `./${rel}`
  return rel + suffix
}

/** Convert a relative `../x` link that currently points at a non-canonical form. */
function relativeToCanonical(
  href: string,
  sourceFile: string,
  pageMap: Record<string, string>,
  allTargets: Set<string>,
): string | null {
  const { path, suffix } = splitSuffix(href)
  if (!path.startsWith('./') && !path.startsWith('../')) return null
  if (/\.(md|mdx)$/.test(path)) return null
  const cleanPath = path.replace(/\/$/, '')
  const targetDir = resolve(dirname(sourceFile), cleanPath)
  const readme = join(targetDir, 'README.md')
  const index = join(targetDir, 'index.md')
  const target = existsSync(readme) ? readme : existsSync(index) ? index : null
  if (!target || !allTargets.has(target)) return null
  let rel = relative(dirname(sourceFile), target).replace(/\\/g, '/')
  if (!rel.startsWith('.')) rel = `./${rel}`
  return rel + suffix
}

let totalRewrites = 0
const filesChanged: string[] = []

for (const root of CONTENT_ROOTS) {
  if (!existsSync(root)) continue
  const pageMap = collectPageMap(root)
  const allTargets = new Set(Object.values(pageMap))
  // Gather all markdown files in this root.
  const files: string[] = []
  function collect(dir: string): void {
    for (const entry of readdirSync(dir)) {
      if (
        entry.startsWith('.') ||
        entry === 'node_modules' ||
        entry === 'dist' ||
        entry === 'diagrams'
      )
        continue
      const full = join(dir, entry)
      const stat = statSync(full)
      if (stat.isDirectory()) collect(full)
      else if (entry.endsWith('.md') || entry.endsWith('.mdx')) files.push(full)
    }
  }
  collect(root)

  for (const file of files) {
    const src = readFileSync(file, 'utf8')
    let rewrites = 0

    // Regex matches markdown links `[text](href)` not preceded by `!`.
    const out = src.replace(
      /(!?)\[([^\]]*)\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g,
      (match, bang: string, text: string, href: string) => {
        if (bang === '!') return match // images
        if (isExternalOrSpecial(href)) return match

        if (isAbsolutePageLink(href)) {
          const replacement = absoluteToCanonical(href, file, pageMap)
          if (replacement) {
            rewrites += 1
            return `[${text}](${replacement})`
          }
        } else if (href.startsWith('./') || href.startsWith('../')) {
          // Relative but without .md suffix → try to canonicalize.
          const replacement = relativeToCanonical(href, file, pageMap, allTargets)
          if (replacement) {
            rewrites += 1
            return `[${text}](${replacement})`
          }
        }
        return match
      },
    )

    if (rewrites > 0) {
      writeFileSync(file, out, 'utf8')
      filesChanged.push(relative(repoRoot, file))
      totalRewrites += rewrites
    }
  }
}

console.log(`Rewrote ${totalRewrites} links across ${filesChanged.length} files.`)
for (const f of filesChanged) console.log(`  ${f}`)
