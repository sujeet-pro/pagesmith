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

  const pageTitle = frontmatter.title ? `${frontmatter.title} \u2014 ${site.title}` : site.title
  const ogImage = frontmatter.socialImage
    ? frontmatter.socialImage.startsWith('http')
      ? frontmatter.socialImage
      : `${site.basePath || ''}/${frontmatter.socialImage.replace(/^\//, '')}`
    : undefined
  const hasPrevNext = prev || next

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
        siteIcon={site.icon}
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
        <div class="doc-content" data-pagefind-body="">
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

          {headings.length > 0 ? (
            <details class="doc-toc-mobile">
              <summary>On this page</summary>
              <DocTOC headings={headings} />
            </details>
          ) : null}

          <main>
            <article>
              <div class="prose" innerHTML={content} />
            </article>

            {hasPrevNext ? (
              <nav class="doc-article-nav" aria-label="Page navigation">
                {prev ? (
                  <a href={prev.path + '/'} class="doc-article-link doc-article-prev">
                    <span class="doc-article-label">Previous</span>
                    <span class="doc-article-title">{prev.title}</span>
                  </a>
                ) : (
                  <span />
                )}
                {next ? (
                  <a href={next.path + '/'} class="doc-article-link doc-article-next">
                    <span class="doc-article-label">Next</span>
                    <span class="doc-article-title">{next.title}</span>
                  </a>
                ) : (
                  <span />
                )}
              </nav>
            ) : null}
          </main>

          <DocFooter
            links={site.footerLinks}
            footerText={site.footerText}
            copyright={site.copyright}
            editUrl={editUrl}
            editLabel={editLabel}
            lastUpdated={lastUpdated}
          />
        </div>
        <aside class="doc-aside">
          <DocTOC headings={headings} />
        </aside>
      </div>
    </Html>
  )
}
