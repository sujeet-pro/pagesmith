/**
 * DocNotFound layout.
 *
 * 404 page for documentation sites.
 */

import { h } from '@pagesmith/docs/jsx-runtime'
import { DocHeader } from '../components/DocHeader'
import { Html } from '../components/Html'
import { resolveChrome } from '../utils/chrome'

type Props = {
  content: string
  frontmatter: Record<string, any>
  headings: Array<{ depth: number; text: string; slug: string }>
  slug: string
  site: any
  [key: string]: any
}

export default function DocNotFound(props: Props) {
  const { site, slug, frontmatter } = props
  const homePath = site.homeLink || site.basePath || '/'
  const chrome = resolveChrome(frontmatter)

  return (
    <Html
      title={`Page Not Found — ${site.title}`}
      description="The requested page could not be found."
      url={slug}
      site={site}
    >
      {chrome.header ? (
        <DocHeader
          siteName={site.name}
          siteIcon={site.icon}
          basePath={site.basePath}
          homeLink={site.homeLink}
          navItems={site.navItems}
          slug={slug}
          searchEnabled={site.search?.enabled}
        />
      ) : null}
      <main id="doc-main-content" class="doc-not-found" tabindex="-1">
        <article class="doc-not-found-container" data-pagefind-body="">
          <p class="doc-not-found-code">404</p>
          <h1 class="doc-not-found-title">Page Not Found</h1>
          <p class="doc-not-found-text">
            The page you are looking for might have been moved or no longer exists.
          </p>
          <div class="doc-not-found-actions">
            <a href={homePath} class="doc-not-found-btn doc-not-found-btn-primary">
              Go Home
            </a>
          </div>
        </article>
      </main>
    </Html>
  )
}
