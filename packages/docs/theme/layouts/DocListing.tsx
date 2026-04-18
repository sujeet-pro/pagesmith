/**
 * Built-in listing layout: markdown intro body plus cards for child pages in the
 * same section folder (see `getDocsListingCards` in navigation).
 */

import { Fragment, h } from "@pagesmith/docs/jsx-runtime";
import { ListingCards, Html } from "@pagesmith/docs/components";
import { PageShell } from "@pagesmith/docs/layouts";
import { resolveChrome } from "../utils/chrome";

type ListingCard = {
  title: string;
  path: string;
  description?: string;
  publishedDate?: string;
};

type ListingGroup = {
  slug: string;
  title: string;
  description?: string;
  cards: ListingCard[];
};

type Breadcrumb = {
  label: string;
  path: string;
};

type Props = {
  content: string;
  frontmatter: Record<string, any>;
  headings: Array<{ depth: number; text: string; slug: string }>;
  slug: string;
  site: any;
  listingCards?: ListingCard[];
  listingGroups?: ListingGroup[];
  listingTotal?: number;
  sidebarSections?: any[];
  prev?: { title: string; path: string };
  next?: { title: string; path: string };
  breadcrumbs?: Breadcrumb[];
  editUrl?: string;
  editLabel?: string;
  lastUpdated?: string;
  [key: string]: any;
};

function formatDate(isoDate: string): string {
  const date = new Date(isoDate);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
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
  } = props;

  const chrome = resolveChrome(frontmatter);
  const pageTitle = frontmatter.title ? `${frontmatter.title} \u2014 ${site.title}` : site.title;
  const ogImage = frontmatter.socialImage
    ? frontmatter.socialImage.startsWith("http")
      ? frontmatter.socialImage
      : `${site.basePath || ""}/${frontmatter.socialImage.replace(/^\//, "")}`
    : undefined;
  const hasGroupedListing = listingGroups.length > 0;
  const visibleGroupCount = listingGroups.length;
  const totalLabel = listingTotal === 1 ? "page" : "pages";
  const groupLabel = visibleGroupCount === 1 ? "group" : "groups";
  const groupedCards = listingGroups.map((group) => ({
    slug: group.slug,
    title: group.title,
    description: group.description,
    cards: group.cards.map((card) => ({
      title: card.title,
      path: card.path,
      description: card.description,
      meta: card.publishedDate
        ? [{ value: formatDate(card.publishedDate), datetime: card.publishedDate }]
        : undefined,
    })),
  }));
  const flatCards = listingCards.map((card) => ({
    title: card.title,
    path: card.path,
    description: card.description,
    meta: card.publishedDate
      ? [{ value: formatDate(card.publishedDate), datetime: card.publishedDate }]
      : undefined,
  }));

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
        {content ? <div class="doc-listing-intro prose" innerHTML={content} /> : null}
        {hasGroupedListing ? (
          <Fragment>
            <p class="doc-listing-stats">
              {listingTotal} {totalLabel} organized into {visibleGroupCount} {groupLabel}.
            </p>
            <ListingCards groups={groupedCards} showStats={false} />
          </Fragment>
        ) : listingCards.length > 0 ? (
          <ListingCards cards={flatCards} />
        ) : (
          <ListingCards emptyMessage="No pages in this section yet." />
        )}
      </PageShell>
    </Html>
  );
}
