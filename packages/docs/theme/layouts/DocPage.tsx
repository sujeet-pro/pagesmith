/**
 * DocPage layout.
 *
 * Standard documentation page with 3-column grid:
 * left sidebar (navigation) | content | right TOC
 */

import { Fragment, h } from '@pagesmith/core/jsx-runtime'
import { DocFooter } from '../components/DocFooter'
import { DocHeader } from '../components/DocHeader'
import { DocSidebar } from '../components/DocSidebar'
import { DocTOC } from '../components/DocTOC'
import { Html } from '../components/Html'

type Breadcrumb = {
  label: string
  path: string
}

type Props = {
  content: string
  frontmatter: Record<string, any>
  headings: Array<{ depth: number; text: string; slug: string }>
  slug: string
  site: any
  pages?: any[]
  sidebarSections?: any[]
  prev?: { title: string; path: string }
  next?: { title: string; path: string }
  breadcrumbs?: Breadcrumb[]
  editUrl?: string
  editLabel?: string
  lastUpdated?: string
  [key: string]: any
}

function formatDate(isoDate: string): string {
  const date = new Date(isoDate)
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
}

export default function DocPage(props: Props) {
  const {
    content,
    frontmatter,
    headings,
    slug,
    site,
    next,
    prev,
    sidebarSections,
    breadcrumbs,
    editUrl,
    editLabel,
    lastUpdated,
  } = props

  const pageTitle = frontmatter.title ? `${frontmatter.title} — ${site.title}` : site.title
  const ogImage = frontmatter.socialImage
    ? frontmatter.socialImage.startsWith('http')
      ? frontmatter.socialImage
      : `${site.basePath || ''}/${frontmatter.socialImage.replace(/^\//, '')}`
    : undefined
  const hasPageMeta = editUrl || lastUpdated

  return (
    <Html
      title={pageTitle}
      description={frontmatter.description || site.description}
      url={`${slug}/`}
      socialImage={ogImage}
      site={site}
    >
      <DocHeader
        siteName={site.name}
        basePath={site.basePath}
        homeLink={site.homeLink}
        navItems={site.navItems}
        slug={slug}
        searchEnabled={site.search?.enabled}
      />
      <div class="doc-layout">
        <DocSidebar
          sections={sidebarSections}
          currentSlug={slug}
          collapsible={site.sidebar?.collapsible}
        />
        <main class="doc-main" data-pagefind-body="">
          {/* Breadcrumbs */}
          {breadcrumbs && breadcrumbs.length > 1 ? (
            <nav class="doc-breadcrumbs" aria-label="Breadcrumbs">
              {breadcrumbs.map((crumb, i) =>
                crumb.path ? (
                  <Fragment>
                    {i > 0 ? (
                      <span class="doc-breadcrumb-sep" aria-hidden="true">
                        /
                      </span>
                    ) : null}
                    <a href={`${crumb.path}/`}>{crumb.label}</a>
                  </Fragment>
                ) : (
                  <Fragment>
                    {i > 0 ? (
                      <span class="doc-breadcrumb-sep" aria-hidden="true">
                        /
                      </span>
                    ) : null}
                    <span aria-current="page">{crumb.label}</span>
                  </Fragment>
                ),
              )}
            </nav>
          ) : null}

          {/* Mobile TOC — always at top of content area */}
          {headings.length > 0 ? (
            <details class="doc-toc-mobile">
              <summary>On this page</summary>
              <DocTOC headings={headings} />
            </details>
          ) : null}

          <article>
            <div class="prose" innerHTML={content} />
          </article>

          {/* Page meta: edit link + last updated */}
          {hasPageMeta ? (
            <div class="doc-page-meta">
              {editUrl ? (
                <a href={editUrl} class="doc-edit-link" target="_blank" rel="noopener noreferrer">
                  {editLabel || 'Edit this page'}
                </a>
              ) : null}
              {lastUpdated ? (
                <span class="doc-last-updated">
                  Last updated: <time datetime={lastUpdated}>{formatDate(lastUpdated)}</time>
                </span>
              ) : null}
            </div>
          ) : null}

          <DocFooter prev={prev} next={next} links={site.footerLinks} copyright={site.copyright} />
        </main>
        <aside class="doc-aside">
          <DocTOC headings={headings} />
        </aside>
      </div>
    </Html>
  )
}
