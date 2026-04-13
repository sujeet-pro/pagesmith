export type ResolvedChrome = {
  header: boolean
  sidebar: boolean
  toc: boolean
  footer: boolean
}

/**
 * Resolve docs `chrome` frontmatter flags. Omitted keys default to true so the
 * full shell renders unless explicitly disabled.
 */
export function resolveChrome(frontmatter: Record<string, unknown>): ResolvedChrome {
  const raw = frontmatter.chrome
  const obj =
    raw && typeof raw === 'object' && !Array.isArray(raw) ? (raw as Record<string, unknown>) : {}
  const flag = (key: string, defaultOn: boolean): boolean => {
    if (!(key in obj)) return defaultOn
    const v = obj[key]
    return typeof v === 'boolean' ? v : defaultOn
  }

  return {
    header: flag('header', true),
    sidebar: flag('sidebar', true),
    toc: flag('toc', true),
    footer: flag('footer', true),
  }
}
