/**
 * Redirect page generator.
 *
 * Generates HTML redirect pages for both content redirects (old -> new paths)
 * and vanity URLs (short URLs -> external targets).
 */

import { existsSync, mkdirSync, writeFileSync } from 'fs'
import { dirname, join } from 'path'
import type { RedirectsConfig } from '../../schemas'

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function escapeJs(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/</g, '\\x3c')
}

/** Generate an HTML redirect page that points to the given URL. */
export function generateRedirectHtml(to: string): string {
  const h = escapeHtml(to)
  const j = escapeJs(to)
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta http-equiv="refresh" content="0; url=${h}">
<link rel="canonical" href="${h}">
<title>Redirecting...</title>
</head>
<body>
<p>Redirecting to <a href="${h}">${h}</a>...</p>
<script>window.location.replace("${j}")</script>
</body>
</html>`
}

/** Generate all redirect and vanity URL pages. */
export function generateRedirects(redirectsConfig: RedirectsConfig, outDir: string): void {
  // Content redirects
  for (const redirect of redirectsConfig.redirects) {
    const html = generateRedirectHtml(redirect.to)
    const outPath = join(outDir, redirect.from.slice(1), 'index.html')
    mkdirSync(dirname(outPath), { recursive: true })
    // Don't overwrite real pages
    if (!existsSync(outPath)) {
      writeFileSync(outPath, html)
    }
  }

  // Vanity URL redirects
  for (const vanity of redirectsConfig.vanity) {
    const html = generateRedirectHtml(vanity.target)
    const outPath = join(outDir, vanity.id, 'index.html')
    mkdirSync(dirname(outPath), { recursive: true })
    if (!existsSync(outPath)) {
      writeFileSync(outPath, html)
    }
  }
}
