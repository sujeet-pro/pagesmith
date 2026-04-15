import { h } from '../jsx-runtime/index.js'
import { SITE_CHROME_ASSETS, withComponentAssets } from '../components/assets.js'
import { SiteDocument, type SitePageMeta } from '../components/document.js'
import type { SiteDocumentData, SiteThemeControls } from '../components/types.js'
import { PageShell } from './page-shell.js'
import type { PageShellProps } from './page-shell.js'

export type ListingLayoutProps = Omit<PageShellProps, 'children'> & {
  title?: string
  description?: string
  socialImage?: string
  meta?: SitePageMeta
  children?: unknown
}

function ListingLayoutComponent({
  title,
  description,
  socialImage,
  meta,
  site,
  ...shellProps
}: ListingLayoutProps) {
  const pageTitle = title ?? site.title ?? site.name
  const pageDescription = description ?? site.description

  return (
    <SiteDocument
      title={pageTitle}
      description={pageDescription}
      url={shellProps.currentPath}
      socialImage={socialImage}
      meta={meta}
      site={site}
    >
      <PageShell site={site} {...shellProps} />
    </SiteDocument>
  )
}

export const ListingLayout = withComponentAssets(ListingLayoutComponent, SITE_CHROME_ASSETS)
