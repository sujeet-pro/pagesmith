import type { PagesmithCodeFrame } from './contract'

export type LineRange = {
  start: number
  end: number
}

export type ParsedCodeFenceMeta = {
  title?: string
  showLineNumbers: boolean
  startLineNumber: number
  wrap: boolean
  frame: PagesmithCodeFrame
  mark: LineRange[]
  ins: LineRange[]
  del: LineRange[]
  collapse: LineRange[]
}

type RawMetaValue = true | string

const TERMINAL_LANGUAGES = new Set([
  'bash',
  'console',
  'fish',
  'powershell',
  'ps',
  'ps1',
  'pwsh',
  'shell',
  'sh',
  'zsh',
])

export function isTerminalLanguage(lang: string | undefined): boolean {
  return typeof lang === 'string' && TERMINAL_LANGUAGES.has(lang.toLowerCase())
}

export function parseCodeFenceMeta(
  metaString: string | undefined,
  options: { defaultShowLineNumbers?: boolean; lang?: string } = {},
): ParsedCodeFenceMeta {
  const rawMeta = parseRawMeta(metaString)
  const defaultShowLineNumbers = options.defaultShowLineNumbers ?? true

  return {
    title: normalizeTitle(rawMeta.title),
    showLineNumbers: parseBoolean(rawMeta.showLineNumbers, defaultShowLineNumbers),
    startLineNumber: parsePositiveInteger(rawMeta.startLineNumber, 1),
    wrap: parseBoolean(rawMeta.wrap, false),
    frame: resolveCodeFrame(rawMeta.frame, options.lang),
    mark: parseLineRanges(rawMeta.mark),
    ins: parseLineRanges(rawMeta.ins),
    del: parseLineRanges(rawMeta.del),
    collapse: parseLineRanges(rawMeta.collapse),
  }
}

export function lineInRanges(lineNumber: number, ranges: LineRange[]): boolean {
  return ranges.some((range) => lineNumber >= range.start && lineNumber <= range.end)
}

function parseRawMeta(metaString: string | undefined): Record<string, RawMetaValue> {
  const meta: Record<string, RawMetaValue> = {}
  if (!metaString) return meta

  const tokenRegex = /(\w+)(?:=(\{[^}]*\}|"[^"]*"|'[^']*'|\S+))?/g
  let match: RegExpExecArray | null

  while ((match = tokenRegex.exec(metaString)) !== null) {
    const key = match[1]
    const rawValue = match[2]
    meta[key] = rawValue === undefined ? true : stripMetaWrapper(rawValue)
  }

  return meta
}

function stripMetaWrapper(value: string): string {
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'")) ||
    (value.startsWith('{') && value.endsWith('}'))
  ) {
    return value.slice(1, -1)
  }
  return value
}

function normalizeTitle(value: RawMetaValue | undefined): string | undefined {
  if (typeof value !== 'string') return undefined
  const title = value.trim()
  return title.length > 0 ? title : undefined
}

function parseBoolean(value: RawMetaValue | undefined, fallback: boolean): boolean {
  if (value === true) return true
  if (typeof value !== 'string') return fallback

  const normalized = value.trim().toLowerCase()
  if (normalized === 'true' || normalized === '1' || normalized === 'yes' || normalized === 'on') {
    return true
  }
  if (normalized === 'false' || normalized === '0' || normalized === 'no' || normalized === 'off') {
    return false
  }
  return fallback
}

function parsePositiveInteger(value: RawMetaValue | undefined, fallback: number): number {
  if (typeof value !== 'string') return fallback
  const parsed = Number.parseInt(value, 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}

function resolveCodeFrame(
  value: RawMetaValue | undefined,
  lang: string | undefined,
): PagesmithCodeFrame {
  if (typeof value === 'string') {
    const frame = value.trim().toLowerCase()
    if (frame === 'terminal') return 'terminal'
    if (frame === 'code') return 'code'
    if (frame === 'plain' || frame === 'none') return 'plain'
  }

  return isTerminalLanguage(lang) ? 'terminal' : 'code'
}

function parseLineRanges(value: RawMetaValue | undefined): LineRange[] {
  if (typeof value !== 'string') return []
  const ranges: LineRange[] = []

  for (const part of value.split(',')) {
    const token = part.trim()
    if (!token) continue

    const singleLineMatch = /^(\d+)$/.exec(token)
    if (singleLineMatch) {
      const singleLine = Number.parseInt(singleLineMatch[1], 10)
      ranges.push({ start: singleLine, end: singleLine })
      continue
    }

    const rangeMatch = /^(\d+)\s*-\s*(\d+)$/.exec(token)
    if (!rangeMatch) continue

    const start = Number.parseInt(rangeMatch[1], 10)
    const end = Number.parseInt(rangeMatch[2], 10)
    if (!Number.isFinite(start) || !Number.isFinite(end)) continue

    ranges.push(start <= end ? { start, end } : { start: end, end: start })
  }

  return mergeRanges(ranges)
}

function mergeRanges(ranges: LineRange[]): LineRange[] {
  if (ranges.length === 0) return []

  const sorted = [...ranges].sort((left, right) => left.start - right.start || left.end - right.end)
  const merged: LineRange[] = [sorted[0]!]

  for (let index = 1; index < sorted.length; index++) {
    const current = sorted[index]!
    const last = merged[merged.length - 1]!

    if (current.start <= last.end + 1) {
      last.end = Math.max(last.end, current.end)
      continue
    }

    merged.push({ ...current })
  }

  return merged
}
