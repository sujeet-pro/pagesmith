/**
 * DocHome layout.
 *
 * Documentation landing page with hero section and optional features grid.
 */

import { Fragment, h } from '@pagesmith/core/jsx-runtime'
import { DocHeader } from '../components/DocHeader'
import { Html } from '../components/Html'

type Props = {
  content: string
  frontmatter: Record<string, any>
  headings: Array<{ depth: number; text: string; slug: string }>
  slug: string
  site: any
  [key: string]: any
}

export default function DocHome(props: Props) {
  const { content, frontmatter, slug, site } = props

  const hero =
    frontmatter.hero ??
    (frontmatter.title || frontmatter.tagline || frontmatter.actions
      ? {
          name: frontmatter.title || site.name,
          text: frontmatter.tagline || frontmatter.title,
          tagline: frontmatter.description,
          actions: frontmatter.actions,
        }
      : undefined)
  const features = frontmatter.features

  return (
    <Html
      title={hero?.name || frontmatter.title || site.title}
      description={hero?.tagline || frontmatter.description || site.description}
      url="/"
      site={site}
    >
      <DocHeader
        siteName={site.name}
        basePath={site.basePath}
        navItems={site.navItems}
        slug={slug}
        searchEnabled={site.search?.enabled}
      />
      <main class="doc-home">
        {/* Hero section */}
        {hero ? (
          <section class="doc-hero">
            {hero.name ? <p class="doc-hero-name">{hero.name}</p> : null}
            {hero.text ? <h1 class="doc-hero-text">{hero.text}</h1> : null}
            {hero.tagline ? <p class="doc-hero-tagline">{hero.tagline}</p> : null}
            {hero.actions && hero.actions.length > 0 ? (
              <div class="doc-hero-actions">
                {hero.actions.map((action: any) => (
                  <a
                    href={action.link}
                    class={`doc-hero-action doc-hero-action-${action.theme || 'brand'}`}
                  >
                    {action.text}
                  </a>
                ))}
              </div>
            ) : null}
          </section>
        ) : null}

        {/* Features grid */}
        {features && features.length > 0 ? (
          <section class="doc-features">
            {features.map((feature: any) => (
              <div class="doc-feature-card">
                {feature.icon ? <span class="doc-feature-icon">{feature.icon}</span> : null}
                <h3 class="doc-feature-title">{feature.title}</h3>
                <p class="doc-feature-details">{feature.details}</p>
              </div>
            ))}
          </section>
        ) : null}

        {/* Content (if any markdown content is provided) */}
        {content ? (
          <section class="doc-home-content">
            <div class="prose" innerHTML={content} />
          </section>
        ) : null}
      </main>
    </Html>
  )
}
