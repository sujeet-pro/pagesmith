/**
 * Generate a complete HTML document wrapping content.
 *
 * Produces <!DOCTYPE html><html>...</html> with configurable CSS/JS inclusion.
 */

export type DocumentOptions = {
  title: string
  description?: string
  language?: string
  css?: string | string[]
  js?: string | string[]
  cssMode?: 'inline' | 'reference'
  jsMode?: 'inline' | 'reference'
  head?: string
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function renderCss(css: string | string[] | undefined, mode: 'inline' | 'reference'): string {
  if (!css) return ''
  const items = Array.isArray(css) ? css : [css]
  if (mode === 'reference') {
    return items.map((href) => `<link rel="stylesheet" href="${escapeHtml(href)}">`).join('\n    ')
  }
  return `<style>${items.join('\n')}</style>`
}

function renderJs(js: string | string[] | undefined, mode: 'inline' | 'reference'): string {
  if (!js) return ''
  const items = Array.isArray(js) ? js : [js]
  if (mode === 'reference') {
    return items.map((src) => `<script src="${escapeHtml(src)}" defer></script>`).join('\n    ')
  }
  return `<script>${items.join('\n')}</script>`
}

export function generateDocument(content: string, options: DocumentOptions): string {
  const lang = options.language || 'en'
  const cssMode = options.cssMode || 'inline'
  const jsMode = options.jsMode || 'inline'

  const cssHtml = renderCss(options.css, cssMode)
  const jsHtml = renderJs(options.js, jsMode)

  return `<!DOCTYPE html>
<html lang="${escapeHtml(lang)}">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="color-scheme" content="light dark">
    <title>${escapeHtml(options.title)}</title>${
      options.description
        ? `\n    <meta name="description" content="${escapeHtml(options.description)}">`
        : ''
    }
    ${cssHtml}${options.head ? `\n    ${options.head}` : ''}
  </head>
  <body>
    <article>${content}</article>
    ${jsHtml}
  </body>
</html>`
}
