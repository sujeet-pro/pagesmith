/**
 * DocPage layout.
 *
 * Standard documentation page with 3-column grid:
 * left sidebar (navigation) | content | right TOC
 */

import { h } from '@pagesmith/docs/jsx-runtime'
import { Html } from '@pagesmith/docs/components'
import { PageShell } from '@pagesmith/docs/layouts'
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
      <PageShell
        site={site}
        currentPath={slug}
        headings={headings}
        breadcrumbs={breadcrumbs && breadcrumbs.length > 1 ? breadcrumbs : undefined}
        sidebarSections={sidebarSections}
        showHeader={chrome.header}
        showSidebar={chrome.sidebar}
        showSidebarModal={chrome.header && chrome.sidebar}
        showToc={chrome.toc}
        showMobileToc={chrome.toc}
        showFooter={chrome.footer}
        editUrl={editUrl}
        editLabel={editLabel}
        lastUpdated={lastUpdated}
        prev={prev}
        next={next}
      >
        <div class="prose" innerHTML={content} />
      </PageShell>
    </Html>
  )
}
