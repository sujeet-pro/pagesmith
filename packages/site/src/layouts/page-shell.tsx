import { Fragment, h } from "../jsx-runtime/index.js";
import { SITE_CHROME_ASSETS, withComponentAssets } from "../components/assets.js";
import { SiteFooter } from "../components/footer.js";
import {
  AccordionTableOfContents,
  Breadcrumbs,
  SiteHeader,
  SiteSidebar,
  SiteSidebarModal,
  TableOfContents,
} from "../components/navigation.js";
import type {
  Heading,
  SiteBreadcrumb,
  SiteDocumentData,
  SitePageLink,
  SiteSidebarSection,
  SiteThemeControls,
} from "../components/types.js";

export type PageShellProps = {
  site: SiteDocumentData;
  currentPath: string;
  headings?: Heading[];
  breadcrumbs?: SiteBreadcrumb[];
  sidebarSections?: SiteSidebarSection[];
  sidebarNavLabel?: string;
  mobileNavLabel?: string;
  showHeader?: boolean;
  showSidebar?: boolean;
  showSidebarModal?: boolean;
  showToc?: boolean;
  showMobileToc?: boolean;
  showFooter?: boolean;
  tocTitle?: string;
  tocSummaryLabel?: string;
  mainId?: string;
  articleClass?: string;
  editUrl?: string;
  editLabel?: string;
  lastUpdated?: string;
  prev?: SitePageLink;
  next?: SitePageLink;
  themeControls?: SiteThemeControls;
  children?: unknown;
};

function PageShellComponent({
  site,
  currentPath,
  headings = [],
  breadcrumbs,
  sidebarSections,
  sidebarNavLabel = "Documentation navigation",
  mobileNavLabel = "Navigation",
  showHeader = true,
  showSidebar = true,
  showSidebarModal = true,
  showToc = true,
  showMobileToc = true,
  showFooter = true,
  tocTitle = "On this page",
  tocSummaryLabel = "On this page",
  mainId = "doc-main-content",
  articleClass,
  editUrl,
  editLabel,
  lastUpdated,
  prev,
  next,
  themeControls,
  children,
}: PageShellProps) {
  const trailingSlash = site.trailingSlash;
  const hasSidebarContent = !!sidebarSections?.length;
  const hasNavItems = !!site.navItems?.length;
  const hasToc = showToc && headings.some((heading) => heading.depth >= 2 && heading.depth <= 3);
  const shouldShowSidebarToggle =
    (hasSidebarContent || hasNavItems) && (showSidebar || showSidebarModal);

  return (
    <>
      {showHeader ? (
        <SiteHeader
          siteName={site.name}
          siteIcon={site.icon}
          basePath={site.basePath}
          homeLink={site.homeLink}
          navItems={site.navItems}
          currentPath={currentPath}
          searchEnabled={site.search?.enabled}
          themeControls={themeControls}
          trailingSlash={trailingSlash}
          showSidebarToggle={shouldShowSidebarToggle}
        />
      ) : null}
      <div class="doc-layout">
        {showSidebar && hasSidebarContent ? (
          <SiteSidebar
            sections={sidebarSections}
            currentPath={currentPath}
            collapsible={site.sidebar?.collapsible}
            navLabel={sidebarNavLabel}
            trailingSlash={trailingSlash}
          />
        ) : null}
        <div class="doc-content">
          <Breadcrumbs breadcrumbs={breadcrumbs} trailingSlash={trailingSlash} />
          {hasToc && showMobileToc ? (
            <AccordionTableOfContents
              headings={headings}
              title={tocTitle}
              summaryLabel={tocSummaryLabel}
            />
          ) : null}
          <main>
            <article id={mainId} tabindex="-1" data-pagefind-body="" class={articleClass}>
              {children}
            </article>
          </main>
          {showFooter ? (
            <SiteFooter
              links={site.footerLinks}
              footerText={site.footerText}
              maintainer={site.maintainer}
              copyright={site.copyright}
              editUrl={editUrl}
              editLabel={editLabel}
              lastUpdated={lastUpdated}
              prev={prev}
              next={next}
              themeControls={themeControls}
              trailingSlash={trailingSlash}
            />
          ) : null}
        </div>
        {hasToc ? (
          <aside class="doc-aside">
            <TableOfContents headings={headings} title={tocTitle} />
          </aside>
        ) : null}
      </div>
      {showSidebarModal && (hasSidebarContent || hasNavItems) ? (
        <SiteSidebarModal
          sections={sidebarSections}
          navItems={site.navItems}
          currentPath={currentPath}
          collapsible={site.sidebar?.collapsible}
          navLabel={mobileNavLabel}
          trailingSlash={trailingSlash}
        />
      ) : null}
    </>
  );
}

export const PageShell = withComponentAssets(PageShellComponent, SITE_CHROME_ASSETS);
