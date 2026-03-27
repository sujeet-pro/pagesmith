/**
 * DocNotFound layout.
 *
 * 404 page for documentation sites.
 */

import { h } from '@pagesmith/core/jsx-runtime'
import { DocHeader } from '../components/DocHeader'
import { Html } from '../components/Html'

type Props = {
  content: string
  frontmatter: Record<string, any>
  headings: Array<{ depth: number; text: string; slug: string }>
  slug: string
  site: any
  [key: string]: any
}

export default function DocNotFound(props: Props) {
  const { site } = props

  return (
    <Html
      title={`Page Not Found — ${site.title}`}
      description="The requested page could not be found."
      site={site}
    >
      <DocHeader
        siteName={site.name}
        navItems={site.navItems}
        slug="/404"
        searchEnabled={site.search?.enabled}
      />
      <main class="doc-not-found">
        <div class="doc-not-found-container">
          <p class="doc-not-found-code">404</p>
          <h1 class="doc-not-found-title">Page Not Found</h1>
          <p class="doc-not-found-text">
            The page you are looking for might have been moved or no longer exists.
          </p>
          <div class="doc-not-found-actions">
            <a href="/" class="doc-not-found-btn doc-not-found-btn-primary">
              Go Home
            </a>
          </div>
        </div>
      </main>
    </Html>
  )
}
