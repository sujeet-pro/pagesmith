export function normalizePath(path: string): string {
  const normalized = path.replace(/\/+$/, '')
  return normalized === '' ? '/' : normalized
}

export function isExternalUrl(path: string): boolean {
  return (
    /^https?:\/\//i.test(path) ||
    path.startsWith('//') ||
    path.startsWith('mailto:') ||
    path.startsWith('tel:')
  )
}

export function hasFileExtension(path: string): boolean {
  return /\/[^/?#]+\.[^/?#]+(?:[?#].*)?$/u.test(path)
}

export function withTrailingSlash(path: string): string {
  if (!path || path === '/') return '/'
  if (path.startsWith('#') || isExternalUrl(path) || hasFileExtension(path) || path.endsWith('/')) {
    return path
  }
  return `${path}/`
}

export function getExternalLinkProps(path: string) {
  return isExternalUrl(path) ? { target: '_blank', rel: 'noopener noreferrer' } : {}
}

export function formatDate(isoDate: string): string {
  const date = new Date(isoDate)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  })
}
