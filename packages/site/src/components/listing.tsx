import { Fragment, h } from '../jsx-runtime/index.js'
import { SITE_CHROME_ASSETS, withComponentAssets } from './assets.js'
import type { SiteListingCard, SiteListingGroup } from './types.js'
import { withTrailingSlash } from './utils.js'

export type ListingCardsProps = {
  cards?: SiteListingCard[]
  groups?: SiteListingGroup[]
  emptyMessage?: string
  showStats?: boolean
}

function renderCard(card: SiteListingCard) {
  return (
    <li class="doc-listing-item">
      <a class="doc-listing-card" href={withTrailingSlash(card.path)}>
        {card.eyebrow ? <span class="doc-listing-card-eyebrow">{card.eyebrow}</span> : null}
        <span class="doc-listing-card-title">{card.title}</span>
        {card.meta && card.meta.length > 0 ? (
          <div class="doc-listing-card-meta">
            {card.meta.map((item) =>
              item.datetime ? (
                <time class="doc-listing-card-meta-item" datetime={item.datetime}>
                  {item.label ? `${item.label}: ${item.value}` : item.value}
                </time>
              ) : (
                <span class="doc-listing-card-meta-item">
                  {item.label ? `${item.label}: ${item.value}` : item.value}
                </span>
              ),
            )}
          </div>
        ) : null}
        {card.description ? <span class="doc-listing-card-desc">{card.description}</span> : null}
        {card.content ? <div class="doc-listing-card-content">{card.content}</div> : null}
      </a>
    </li>
  )
}

function ListingCardsComponent({
  cards = [],
  groups = [],
  emptyMessage = 'No items yet.',
  showStats = true,
}: ListingCardsProps) {
  const hasGroupedListing = groups.length > 0
  const listingTotal = hasGroupedListing
    ? groups.reduce((total, group) => total + group.cards.length, 0)
    : cards.length
  const totalLabel = listingTotal === 1 ? 'item' : 'items'
  const groupLabel = groups.length === 1 ? 'group' : 'groups'

  if (!hasGroupedListing && cards.length === 0) {
    return <p class="doc-listing-empty">{emptyMessage}</p>
  }

  return hasGroupedListing ? (
    <Fragment>
      {showStats ? (
        <p class="doc-listing-stats">
          {listingTotal} {totalLabel} organized into {groups.length} {groupLabel}.
        </p>
      ) : null}
      <div class="doc-listing-groups">
        {groups.map((group) => (
          <section class="doc-listing-group">
            {group.slug ? (
              <h2 class="doc-listing-group-title" id={group.slug}>
                {group.title}
              </h2>
            ) : (
              <h2 class="doc-listing-group-title">{group.title}</h2>
            )}
            {group.description ? <p class="doc-listing-group-desc">{group.description}</p> : null}
            <ul class="doc-listing-grid">{group.cards.map((card) => renderCard(card))}</ul>
          </section>
        ))}
      </div>
    </Fragment>
  ) : (
    <ul class="doc-listing-grid">{cards.map((card) => renderCard(card))}</ul>
  )
}

export const ListingCards = withComponentAssets(ListingCardsComponent, SITE_CHROME_ASSETS)
