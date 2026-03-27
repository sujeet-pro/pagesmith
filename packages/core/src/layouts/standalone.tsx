import { Fragment, h, type HtmlString } from '../jsx-runtime'
import type { CoreLayoutProps } from '../layout-engine'
import type { Heading } from '../schemas/heading'
import { Document } from './components/Document'
import { TOCSidebar } from './components/TOCSidebar'

function ContentMeta({ frontmatter }: { frontmatter: Record<string, any> }) {
  const published = frontmatter.publishedDate
  const updated = frontmatter.lastUpdatedOn
  const readTime = frontmatter.readTime

  if (!published && !readTime) return <></>

  return (
    <div class="content-meta">
      {published ? (
        <time datetime={new Date(published).toISOString()}>
          {new Date(published).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </time>
      ) : null}
      {updated && String(updated) !== String(published) ? (
        <span class="meta-updated">
          Updated{' '}
          {new Date(updated).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </span>
      ) : null}
      {readTime ? <span class="meta-read-time">{readTime} min read</span> : null}
    </div>
  )
}

export function standaloneLayout(props: CoreLayoutProps): HtmlString {
  const { content, frontmatter, headings } = props
  const css = props.css as string | undefined
  const cssMode = (props.cssMode as 'inline' | 'reference') || 'inline'
  const js = props.js as string | undefined
  const jsMode = (props.jsMode as 'inline' | 'reference') || 'inline'
  const noToc = props.noToc as boolean | undefined
  const filteredHeadings = headings.filter((h: Heading) => h.depth >= 2 && h.depth <= 3)
  const showToc = !noToc && filteredHeadings.length > 0

  return (
    <Document
      title={frontmatter.title || 'Untitled'}
      description={frontmatter.description}
      css={css}
      cssMode={cssMode}
      js={js}
      jsMode={jsMode}
    >
      <header class="site-header">
        <div class="header-inner">
          <span class="header-title">{frontmatter.title || 'Untitled'}</span>
        </div>
      </header>
      <div class="layout-two-col">
        <div class="main-content">
          <main>
            <article>
              <ContentMeta frontmatter={frontmatter} />
              {showToc ? (
                <details class="toc-mobile">
                  <summary>On this page</summary>
                  <TOCSidebar headings={headings} />
                </details>
              ) : null}
              <div class="prose" innerHTML={content} />
            </article>
          </main>
        </div>
        {showToc ? (
          <aside class="sidebar sidebar-right">
            <TOCSidebar headings={headings} />
          </aside>
        ) : null}
      </div>
    </Document>
  )
}
