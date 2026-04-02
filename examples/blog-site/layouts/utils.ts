import type { SiteConfig } from './types'

export function withBase(site: Pick<SiteConfig, 'baseUrl'> | string, path: string): string {
  if (!path) return path
  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('//')) {
    return path
  }
  if (path.startsWith('#')) return path

  const base = typeof site === 'string' ? site : site.baseUrl
  const normalizedBase = base && base !== '/' ? base.replace(/\/+$/, '') : ''

  if (!path.startsWith('/')) {
    return normalizedBase ? `${normalizedBase}/${path.replace(/^\/+/, '')}` : path
  }

  return normalizedBase ? `${normalizedBase}${path}` : path
}
