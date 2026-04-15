import { Fragment, h } from '../jsx-runtime/index.js'
import { SITE_CHROME_ASSETS, withComponentAssets } from '../components/assets.js'
import { SiteDocument } from '../components/document.js'
import { SiteFooter } from '../components/footer.js'
import {
  SiteHeader,
  SiteSidebarModal,
  buildSidebarModalSections,
} from '../components/navigation.js'
import type { SiteAction } from '../components/hero.js'
import { HeroSection } from '../components/hero.js'
import type { SiteDocumentData, SiteThemeControls } from '../components/types.js'

export type HomeLayoutProps = {
  slug: string
  site: SiteDocumentData
  title?: string
  description?: string
  socialImage?: string
  hero?: {
    badge?: string
    name?: string
    tagline?: string
    description?: string
    actions?: SiteAction[]
  }
  themeControls?: SiteThemeControls
  children?: unknown
}

function HomeLayoutComponent({
  slug,
  site,
  title,
  description,
  socialImage,
  hero,
  themeControls,
  children,
}: HomeLayoutProps) {
  const pageTitle = title ?? site.title ?? site.name
  const pageDescription = description ?? site.description
  const modalSections = buildSidebarModalSections(site.navItems)

  return (
    <SiteDocument
      title={pageTitle}
      description={pageDescription}
      url={slug}
      socialImage={socialImage}
      site={site}
    >
      <SiteHeader
        siteName={site.name}
        siteIcon={site.icon}
        basePath={site.basePath}
        homeLink={site.homeLink}
        navItems={site.navItems}
        currentPath={slug}
        searchEnabled={site.search?.enabled}
        themeControls={themeControls}
        trailingSlash={site.trailingSlash}
        showSidebarToggle={!!site.navItems?.length}
      />
      <main id="doc-main-content" tabindex="-1" data-pagefind-body="">
        {hero ? (
          <HeroSection
            badge={hero.badge}
            name={hero.name}
            tagline={hero.tagline}
            description={hero.description}
            actions={hero.actions}
            trailingSlash={site.trailingSlash}
          />
        ) : null}
        {children}
      </main>
      <SiteFooter
        links={site.footerLinks}
        footerText={site.footerText}
        maintainer={site.maintainer}
        copyright={site.copyright}
        themeControls={themeControls}
        trailingSlash={site.trailingSlash}
      />
      {modalSections.length > 0 ? (
        <SiteSidebarModal
          sections={modalSections}
          currentPath={slug}
          collapsible={site.sidebar?.collapsible}
          navLabel="Navigation"
          trailingSlash={site.trailingSlash}
        />
      ) : null}
    </SiteDocument>
  )
}

export const HomeLayout = withComponentAssets(HomeLayoutComponent, SITE_CHROME_ASSETS)
