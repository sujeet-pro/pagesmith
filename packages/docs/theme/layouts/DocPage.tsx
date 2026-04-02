/**
 * DocPage layout.
 *
 * Standard documentation page with 3-column grid:
 * left sidebar (navigation) | content | right TOC
 */

import { h } from '@pagesmith/core/jsx-runtime'
import { DocFooter } from '../components/DocFooter'
import { DocHeader } from '../components/DocHeader'
import { DocSidebar } from '../components/DocSidebar'
import { DocTOC } from '../components/DocTOC'
import { Html } from '../components/Html'

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
  [key: string]: any
}

export default function DocPage(props: Props) {
  const { content, frontmatter, headings, slug, site, next, prev, sidebarSections } = props

  const pageTitle = frontmatter.title ? `${frontmatter.title} — ${site.title}` : site.title

  return (
    <Html
      title={pageTitle}
      description={frontmatter.description || site.description}
      url={`${slug}/`}
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
          <DocFooter prev={prev} next={next} links={site.footerLinks} copyright={site.copyright} />
        </main>
        <aside class="doc-aside">
          <DocTOC headings={headings} />
        </aside>
      </div>
    </Html>
  )
}
