import { Fragment, h, type HtmlString } from '../jsx-runtime'
import type { CoreLayoutProps } from '../layout-engine'
import type { Heading } from '../schemas/heading'
import { Document } from './components/Document'
import { TOCSidebar } from './components/TOCSidebar'

function ThemeToggle() {
  return (
    <div class="theme-toggle">
      <label for="theme-auto" class="theme-label theme-label-auto" title="System theme">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
        </svg>
      </label>
      <label for="theme-light" class="theme-label theme-label-light" title="Light theme">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <circle cx="12" cy="12" r="5" />
          <line x1="12" y1="1" x2="12" y2="3" />
          <line x1="12" y1="21" x2="12" y2="23" />
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
          <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
          <line x1="1" y1="12" x2="3" y2="12" />
          <line x1="21" y1="12" x2="23" y2="12" />
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
          <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
        </svg>
      </label>
      <label for="theme-dark" class="theme-label theme-label-dark" title="Dark theme">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      </label>
    </div>
  )
}

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
          <ThemeToggle />
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
