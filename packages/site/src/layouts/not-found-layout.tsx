import { h } from '../jsx-runtime/index.js'
import { SITE_CHROME_ASSETS, withComponentAssets } from '../components/assets.js'
import { SiteDocument } from '../components/document.js'
import {
  SiteHeader,
  SiteSidebarModal,
  buildSidebarModalSections,
} from '../components/navigation.js'
import type { SiteAction } from '../components/hero.js'
import { ActionButtons } from '../components/hero.js'
import type { SiteDocumentData } from '../components/types.js'

export type NotFoundLayoutProps = {
  slug: string
  site: SiteDocumentData
  code?: string
  title?: string
  message?: string
  actions?: SiteAction[]
}

function NotFoundLayoutComponent({
  slug,
  site,
  code = '404',
  title = 'Page Not Found',
  message = 'The page you are looking for might have been moved or no longer exists.',
  actions,
}: NotFoundLayoutProps) {
  const modalSections = buildSidebarModalSections(site.navItems)
  const defaultActions: SiteAction[] = actions ?? [
    { label: 'Go Home', href: site.homeLink || site.basePath || '/', variant: 'primary' },
  ]

  return (
    <SiteDocument
      title={`${title} — ${site.title ?? site.name}`}
      description={message}
      url={slug}
      site={site}
    >
      <SiteHeader
        siteName={site.name}
        basePath={site.basePath}
        homeLink={site.homeLink}
        navItems={site.navItems}
        currentPath={slug}
        searchEnabled={site.search?.enabled}
        trailingSlash={site.trailingSlash}
        showSidebarToggle={!!site.navItems?.length}
      />
      <main id="doc-main-content" class="site-not-found" tabindex="-1">
        <p class="site-not-found-code">{code}</p>
        <h1>{title}</h1>
        <p>{message}</p>
        <ActionButtons actions={defaultActions} trailingSlash={site.trailingSlash} />
      </main>
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

export const NotFoundLayout = withComponentAssets(NotFoundLayoutComponent, SITE_CHROME_ASSETS)
