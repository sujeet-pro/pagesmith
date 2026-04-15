import { Fragment, h } from '../jsx-runtime/index.js'
import { SITE_CHROME_ASSETS, withComponentAssets } from './assets.js'
import { formatPath, getExternalLinkProps, isExternalUrl } from './utils.js'

export type SiteAction = {
  label: string
  href: string
  variant?: 'primary' | 'secondary'
}

export type HeroSectionProps = {
  badge?: string
  name?: string
  tagline?: string
  description?: string
  actions?: SiteAction[]
  trailingSlash?: boolean
}

function HeroSectionComponent({
  badge,
  name,
  tagline,
  description,
  actions,
  trailingSlash,
}: HeroSectionProps) {
  return (
    <section class="site-hero">
      {badge ? <span class="site-hero-badge">{badge}</span> : null}
      {name ? <h1 class="site-hero-name">{name}</h1> : null}
      {tagline ? <p class="site-hero-tagline">{tagline}</p> : null}
      {description ? <p class="site-hero-description">{description}</p> : null}
      {actions && actions.length > 0 ? (
        <ActionButtonsComponent actions={actions} trailingSlash={trailingSlash} />
      ) : null}
    </section>
  )
}

export type ActionButtonsProps = {
  actions: SiteAction[]
  trailingSlash?: boolean
}

function ActionButtonsComponent({ actions, trailingSlash }: ActionButtonsProps) {
  if (!actions || actions.length === 0) return <Fragment />

  return (
    <div class="site-actions">
      {actions.map((action) => {
        const href = isExternalUrl(action.href)
          ? action.href
          : formatPath(action.href, trailingSlash)
        const variant =
          action.variant === 'secondary' ? 'site-action-secondary' : 'site-action-primary'

        return (
          <a href={href} class={`site-action ${variant}`} {...getExternalLinkProps(action.href)}>
            {action.label}
          </a>
        )
      })}
    </div>
  )
}

export const HeroSection = withComponentAssets(HeroSectionComponent, SITE_CHROME_ASSETS)
export const ActionButtons = withComponentAssets(ActionButtonsComponent, SITE_CHROME_ASSETS)
