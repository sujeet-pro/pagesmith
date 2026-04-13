/**
 * DocPage layout.
 *
 * Standard documentation page with 3-column grid:
 * left sidebar (navigation) | content | right TOC
 */

import { Fragment, h } from '@pagesmith/site/jsx-runtime'
import { DocFooter } from '../components/DocFooter'
import { DocHeader } from '../components/DocHeader'
import { DocSidebar } from '../components/DocSidebar'
import { DocTOC } from '../components/DocTOC'
import { Html } from '../components/Html'
import { resolveChrome } from '../utils/chrome'

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

  const chrome = resolveChrome(frontmatter)
  const pageTitle = frontmatter.title ? `${frontmatter.title} \u2014 ${site.title}` : site.title
  const ogImage = frontmatter.socialImage
    ? frontmatter.socialImage.startsWith('http')
      ? frontmatter.socialImage
      : `${site.basePath || ''}/${frontmatter.socialImage.replace(/^\//, '')}`
    : undefined

  return (
    <Html
      title={pageTitle}
      description={frontmatter.description || site.description}
      url={slug}
      socialImage={ogImage}
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
      <div class="doc-layout">
        {chrome.sidebar ? (
          <DocSidebar
            sections={sidebarSections}
            currentSlug={slug}
            collapsible={site.sidebar?.collapsible}
          />
        ) : null}
        <div class="doc-content">
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

          {chrome.toc && headings.length > 0 ? (
            <details class="doc-toc-mobile">
              <summary>On this page</summary>
              <DocTOC headings={headings} />
            </details>
          ) : null}

          <main>
            <article id="doc-main-content" tabindex="-1" data-pagefind-body="">
              <div class="prose" innerHTML={content} />
            </article>
          </main>

          {chrome.footer ? (
            <DocFooter
              links={site.footerLinks}
              footerText={site.footerText}
              maintainer={site.maintainer}
              copyright={site.copyright}
              editUrl={editUrl}
              editLabel={editLabel}
              lastUpdated={lastUpdated}
              prev={prev}
              next={next}
            />
          ) : null}
        </div>
        {chrome.toc ? (
          <aside class="doc-aside">
            <DocTOC headings={headings} />
          </aside>
        ) : null}
      </div>
    </Html>
  )
}
