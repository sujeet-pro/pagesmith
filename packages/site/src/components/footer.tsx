import { Fragment, h } from '../jsx-runtime/index.js'
import { SITE_CHROME_ASSETS, withComponentAssets } from './assets.js'
import { FooterThemeControls } from './theme.js'
import type {
  SiteCopyright,
  SiteFooterLink,
  SiteFooterLinkGroup,
  SiteFooterLinks,
  SiteMaintainer,
  SitePageLink,
  SiteThemeControls,
} from './types.js'
import { formatDate, getExternalLinkProps, isExternalUrl, withTrailingSlash } from './utils.js'

const PAGESMITH_URL = 'https://projects.sujeet.pro/pagesmith/'
const FOOTER_YEAR_ID = 'pagesmith-footer-year-end'

function isFooterLinkGroup(
  link: SiteFooterLink | SiteFooterLinkGroup,
): link is SiteFooterLinkGroup {
  return 'links' in link
}

function isGroupedFooterLinks(links: SiteFooterLinks): links is SiteFooterLinkGroup[] {
  return links.length > 0 && isFooterLinkGroup(links[0]!)
}

function getFooterGridStyle(columnCount: number): string {
  const desktopColumns = Math.min(Math.max(columnCount, 1), 4)
  const compactColumns = Math.min(desktopColumns, 2)
  return `--doc-footer-columns:${desktopColumns};--doc-footer-columns-compact:${compactColumns}`
}

function getLinkHref(path: string): string {
  return isExternalUrl(path) ? path : withTrailingSlash(path)
}

export type SiteFooterProps = {
  links?: SiteFooterLinks
  footerText?: string
  maintainer?: SiteMaintainer
  copyright?: SiteCopyright
  editUrl?: string
  editLabel?: string
  lastUpdated?: string
  prev?: SitePageLink
  next?: SitePageLink
  themeControls?: SiteThemeControls
  showThemeControls?: boolean
}

function SiteFooterComponent({
  links,
  footerText,
  maintainer,
  copyright,
  editUrl,
  editLabel,
  lastUpdated,
  prev,
  next,
  themeControls,
  showThemeControls = true,
}: SiteFooterProps) {
  const buildYear = new Date().getFullYear()
  const hasPageMeta = !!editUrl || !!lastUpdated
  const hasPrevNext = !!prev || !!next
  const hasLinks = !!links && links.length > 0
  const groupedLinks =
    hasLinks && links ? (isGroupedFooterLinks(links) ? links : undefined) : undefined
  const flatLinks = hasLinks && links && !groupedLinks ? (links as SiteFooterLink[]) : undefined
  const flatLinkGridStyle = flatLinks ? getFooterGridStyle(flatLinks.length) : undefined
  const groupedLinkGridStyle = groupedLinks ? getFooterGridStyle(groupedLinks.length) : undefined
  const renderedEndYear = copyright
    ? Math.max(copyright.endYear ?? buildYear, copyright.startYear)
    : undefined
  const showCopyrightRange =
    copyright && renderedEndYear !== undefined ? copyright.startYear !== renderedEndYear : false
  const autoUpdateCopyrightYear = !!copyright && copyright.endYear == null
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
            <a href={withTrailingSlash(prev.path)} class="doc-article-link doc-article-prev">
              <span class="doc-article-label">Previous</span>
              <span class="doc-article-title">{prev.title}</span>
            </a>
          ) : (
            <span />
          )}
          {next ? (
            <a href={withTrailingSlash(next.path)} class="doc-article-link doc-article-next">
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
            <a
              class="doc-footer-link-item"
              href={getLinkHref(link.path)}
              {...getExternalLinkProps(link.path)}
            >
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
                    href={getLinkHref(link.path)}
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
      {showThemeControls ? <FooterThemeControls controls={themeControls} /> : null}
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

export const SiteFooter = withComponentAssets(SiteFooterComponent, SITE_CHROME_ASSETS)
