import { Fragment, h } from '@pagesmith/site/jsx-runtime'

type FooterLink = {
  label: string
  path: string
}

type FooterLinkGroup = {
  header?: string
  links: FooterLink[]
}

type FooterLinks = FooterLink[] | FooterLinkGroup[]

type FooterCopyright = {
  projectName: string
  startYear: number
  endYear?: number
}

type Props = {
  links?: FooterLinks
  footerText?: string
  maintainer?: {
    name: string
    link?: string
  }
  copyright?: FooterCopyright
  editUrl?: string
  editLabel?: string
  lastUpdated?: string
  prev?: { title: string; path: string }
  next?: { title: string; path: string }
}

const PAGESMITH_URL = 'https://projects.sujeet.pro/pagesmith/'
const FOOTER_YEAR_ID = 'pagesmith-footer-year-end'

function formatDate(isoDate: string): string {
  const date = new Date(isoDate)
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
}

function isExternalUrl(path: string): boolean {
  return /^https?:\/\//i.test(path) || path.startsWith('//')
}

function getExternalLinkProps(path: string) {
  return isExternalUrl(path) ? { target: '_blank', rel: 'noopener noreferrer' } : {}
}

function isFooterLinkGroup(link: FooterLink | FooterLinkGroup): link is FooterLinkGroup {
  return 'links' in link
}

function isGroupedFooterLinks(links: FooterLinks): links is FooterLinkGroup[] {
  return links.length > 0 && isFooterLinkGroup(links[0]!)
}

function getFooterGridStyle(columnCount: number): string {
  const desktopColumns = Math.min(Math.max(columnCount, 1), 4)
  const compactColumns = Math.min(desktopColumns, 2)
  return `--doc-footer-columns:${desktopColumns};--doc-footer-columns-compact:${compactColumns}`
}

export function DocFooter({
  links,
  footerText,
  maintainer,
  copyright,
  editUrl,
  editLabel,
  lastUpdated,
  prev,
  next,
}: Props) {
  const buildYear = new Date().getFullYear()
  const hasPageMeta = editUrl || lastUpdated
  const hasPrevNext = prev || next
  const hasLinks = !!links && links.length > 0
  const groupedLinks =
    hasLinks && links ? (isGroupedFooterLinks(links) ? links : undefined) : undefined
  const flatLinks = hasLinks && links && !groupedLinks ? (links as FooterLink[]) : undefined
  const flatLinkGridStyle = flatLinks ? getFooterGridStyle(flatLinks.length) : undefined
  const groupedLinkGridStyle = groupedLinks ? getFooterGridStyle(groupedLinks.length) : undefined
  const renderedEndYear = copyright
    ? Math.max(copyright.endYear ?? buildYear, copyright.startYear)
    : undefined
  const showCopyrightRange =
    copyright && renderedEndYear !== undefined ? copyright.startYear !== renderedEndYear : false
  const autoUpdateCopyrightYear = !!copyright && copyright.endYear === undefined
  const signoff = footerText ? (
    footerText
  ) : (
    <>
      Made with <span aria-hidden="true">&#10084;</span> using{' '}
      <a href={PAGESMITH_URL} target="_blank" rel="noopener noreferrer">
        Pagesmith
      </a>
      {maintainer ? (
        <span>
          {' '}
          and is maintained by{' '}
          {maintainer.link ? (
            <a href={maintainer.link} {...getExternalLinkProps(maintainer.link)}>
              {maintainer.name}
            </a>
          ) : (
            maintainer.name
          )}
        </span>
      ) : null}
    </>
  )

  return (
    <footer class="doc-footer">
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
      {flatLinks ? (
        <nav
          class="doc-footer-links doc-footer-links-flat"
          aria-label="Footer links"
          style={flatLinkGridStyle}
        >
          {flatLinks.map((link) => (
            <a class="doc-footer-link-item" href={link.path} {...getExternalLinkProps(link.path)}>
              <span class="doc-footer-link-label">{link.label}</span>
            </a>
          ))}
        </nav>
      ) : null}
      {groupedLinks ? (
        <nav
          class="doc-footer-links doc-footer-links-grouped"
          aria-label="Footer links"
          style={groupedLinkGridStyle}
        >
          {groupedLinks.map((group) => (
            <div class="doc-footer-link-group">
              {group.header ? <p class="doc-footer-link-group-header">{group.header}</p> : null}
              <div class="doc-footer-link-group-links">
                {group.links.map((link) => (
                  <a
                    class="doc-footer-group-link"
                    href={link.path}
                    {...getExternalLinkProps(link.path)}
                  >
                    <span class="doc-footer-link-label">{link.label}</span>
                  </a>
                ))}
              </div>
            </div>
          ))}
        </nav>
      ) : null}
      <div class="doc-footer-theme no-js-hidden" data-footer-theme="">
        <div class="doc-footer-theme-group">
          <span class="doc-footer-theme-label">Appearance</span>
          <div class="doc-footer-theme-options" data-footer-scheme="" data-ps-footer-scheme="">
            <button type="button" data-scheme="auto" class="active" aria-pressed="true">
              Auto
            </button>
            <button type="button" data-scheme="light" aria-pressed="false">
              Light
            </button>
            <button type="button" data-scheme="dark" aria-pressed="false">
              Dark
            </button>
          </div>
        </div>
        <div class="doc-footer-theme-group">
          <span class="doc-footer-theme-label">Theme</span>
          <div class="doc-footer-theme-options" data-footer-theme-type="" data-ps-footer-theme="">
            <button type="button" data-theme="paper" class="active" aria-pressed="true">
              Paper
            </button>
            <button type="button" data-theme="high-contrast" aria-pressed="false">
              High Contrast
            </button>
          </div>
        </div>
        <div class="doc-footer-theme-group">
          <span class="doc-footer-theme-label">Text Size</span>
          <div
            class="doc-footer-theme-options"
            data-footer-text-size=""
            data-ps-footer-text-size=""
          >
            <button type="button" data-size="small" aria-pressed="false" aria-label="Small text">
              <span class="doc-text-size-label" data-size="small">
                A
              </span>
            </button>
            <button
              type="button"
              data-size="base"
              class="active"
              aria-pressed="true"
              aria-label="Default text"
            >
              <span class="doc-text-size-label" data-size="base">
                A
              </span>
            </button>
            <button type="button" data-size="large" aria-pressed="false" aria-label="Large text">
              <span class="doc-text-size-label" data-size="large">
                A
              </span>
            </button>
          </div>
        </div>
      </div>
      <div class="doc-footer-legal">
        {copyright && renderedEndYear !== undefined ? (
          <p class="doc-footer-copyright">
            &copy;{' '}
            <span class="doc-footer-year-range" data-current-year-range="">
              <span
                class="doc-footer-year-start"
                hidden={!showCopyrightRange}
                aria-hidden={showCopyrightRange ? undefined : 'true'}
              >
                {copyright.startYear}
              </span>
              <span
                class="doc-footer-year-separator"
                aria-hidden="true"
                hidden={!showCopyrightRange}
              >
                &ndash;
              </span>
              <span
                id={FOOTER_YEAR_ID}
                data-start-year={String(copyright.startYear)}
                data-rendered-year={String(renderedEndYear)}
                data-auto-update={String(autoUpdateCopyrightYear)}
              >
                {renderedEndYear}
              </span>
            </span>{' '}
            {copyright.projectName}
          </p>
        ) : null}
        <p class="doc-footer-signoff">
          {copyright ? (
            <span class="doc-footer-legal-separator" aria-hidden="true">
              |
            </span>
          ) : null}
          {signoff}
        </p>
      </div>
    </footer>
  )
}
