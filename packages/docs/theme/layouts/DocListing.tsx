/**
 * Built-in listing layout: markdown intro body plus cards for child pages in the
 * same section folder (see `getDocsListingCards` in navigation).
 */

import { Fragment, h } from '@pagesmith/site/jsx-runtime'
import { DocFooter } from '../components/DocFooter'
import { DocHeader } from '../components/DocHeader'
import { DocSidebar } from '../components/DocSidebar'
import { DocTOC } from '../components/DocTOC'
import { Html } from '../components/Html'
import { resolveChrome } from '../utils/chrome'

type ListingCard = {
  title: string
  path: string
  description?: string
  publishedDate?: string
}

type ListingGroup = {
  slug: string
  title: string
  description?: string
  cards: ListingCard[]
}

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
  listingCards?: ListingCard[]
  listingGroups?: ListingGroup[]
  listingTotal?: number
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
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  })
}

function renderCard(card: ListingCard) {
  return (
    <li class="doc-listing-item">
      <a class="doc-listing-card" href={`${card.path.replace(/\/?$/, '')}/`}>
        <span class="doc-listing-card-title">{card.title}</span>
        {card.publishedDate ? (
          <time class="doc-listing-card-meta" datetime={card.publishedDate}>
            {formatDate(card.publishedDate)}
          </time>
        ) : null}
        {card.description ? <span class="doc-listing-card-desc">{card.description}</span> : null}
      </a>
    </li>
  )
}

export default function DocListing(props: Props) {
  const {
    content,
    frontmatter,
    headings,
    slug,
    site,
    listingCards = [],
    listingGroups = [],
    listingTotal = listingCards.length,
    sidebarSections,
    prev,
    next,
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
  const hasGroupedListing = listingGroups.length > 0
  const visibleGroupCount = listingGroups.length
  const totalLabel = listingTotal === 1 ? 'page' : 'pages'
  const groupLabel = visibleGroupCount === 1 ? 'group' : 'groups'

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
              {content ? <div class="doc-listing-intro prose" innerHTML={content} /> : null}
              {hasGroupedListing ? (
                <Fragment>
                  <p class="doc-listing-stats">
                    {listingTotal} {totalLabel} organized into {visibleGroupCount} {groupLabel}.
                  </p>
                  <div class="doc-listing-groups">
                    {listingGroups.map((group) => (
                      <section class="doc-listing-group">
                        <h2 class="doc-listing-group-title" id={group.slug}>
                          {group.title}
                        </h2>
                        {group.description ? (
                          <p class="doc-listing-group-desc">{group.description}</p>
                        ) : null}
                        <ul class="doc-listing-grid">
                          {group.cards.map((card) => renderCard(card))}
                        </ul>
                      </section>
                    ))}
                  </div>
                </Fragment>
              ) : listingCards.length > 0 ? (
                <ul class="doc-listing-grid">{listingCards.map((card) => renderCard(card))}</ul>
              ) : (
                <p class="doc-listing-empty">No pages in this section yet.</p>
              )}
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
