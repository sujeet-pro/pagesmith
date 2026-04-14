import { Fragment, h } from '@pagesmith/docs/jsx-runtime'
import { Html } from '@pagesmith/docs/theme'
import {
  DocFooter,
  DocHeader,
  DocSidebar,
  DocTOC,
  resolveSocialImage,
  toHtmlSite,
  type ExampleSite,
} from './shared'

/**
 * Inner-page layout override — keeps docs article landmarks (breadcrumbs, TOC,
 * `data-pagefind-body` on `<article>`) identical to the default theme expectations
 * while sharing chrome via `shared.tsx`.
 */

type Breadcrumb = {
  label: string
  path: string
}

type Props = {
  content: string
  frontmatter: Record<string, any>
  headings: Array<{ depth: number; text: string; slug: string }>
  slug: string
  site: ExampleSite
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

  const pageTitle = frontmatter.title ? `${frontmatter.title} — ${site.title}` : site.title
  const socialImage = resolveSocialImage(site, frontmatter.socialImage)
  const htmlSite = toHtmlSite(site)

  return (
    <Html
      title={pageTitle}
      description={frontmatter.description || site.description}
      url={slug}
      socialImage={socialImage}
      site={htmlSite}
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
        <div class="doc-content">
          {breadcrumbs && breadcrumbs.length > 1 ? (
            <nav class="doc-breadcrumbs" aria-label="Breadcrumbs">
              {breadcrumbs.map((crumb, index) =>
                crumb.path ? (
                  <Fragment>
                    {index > 0 ? (
                      <span class="doc-breadcrumb-sep" aria-hidden="true">
                        /
                      </span>
                    ) : null}
                    <a href={`${crumb.path}/`}>{crumb.label}</a>
                  </Fragment>
                ) : (
                  <Fragment>
                    {index > 0 ? (
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
              <DocTOC headings={headings as any} />
            </details>
          ) : null}

          <main>
            <article id="doc-main-content" tabindex="-1" data-pagefind-body="">
              <div class="prose" innerHTML={content} />
            </article>
          </main>

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
        </div>
        <aside class="doc-aside">
          <DocTOC headings={headings as any} />
        </aside>
      </div>
    </Html>
  )
}
