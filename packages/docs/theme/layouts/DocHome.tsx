/**
 * DocHome layout.
 *
 * Documentation landing page with hero, install snippet, features grid,
 * packages grid, code example, and optional markdown content.
 *
 * All sections are optional — omit the frontmatter key and the section
 * is not rendered. Supports both single-package and monorepo projects.
 */

import { h } from '@pagesmith/docs/jsx-runtime'
import { DocFooter } from '../components/DocFooter'
import { DocHeader } from '../components/DocHeader'
import { DocSidebar } from '../components/DocSidebar'
import { Html } from '../components/Html'
import { resolveChrome } from '../utils/chrome'

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
  const chrome = resolveChrome(frontmatter)

  const hero =
    frontmatter.hero ??
    (frontmatter.title || frontmatter.tagline || frontmatter.actions
      ? {
          name: frontmatter.title || site.name,
          text: frontmatter.tagline || frontmatter.title,
          tagline: frontmatter.description,
          badge: frontmatter.badge,
          actions: frontmatter.actions,
        }
      : undefined)
  const features = frontmatter.features
  const install = frontmatter.install
  const packages = frontmatter.packages
  const codeExample = frontmatter.codeExample

  // Build sidebar sections from navItems for mobile hamburger menu
  const navItems = site.navItems as Array<{ path: string; label: string }> | undefined
  const sidebarSections =
    navItems && navItems.length > 0
      ? [
          {
            title: 'Navigation',
            items: navItems.map((item: { path: string; label: string }) => ({
              title: item.label,
              slug: item.path,
              path: item.path,
            })),
          },
        ]
      : undefined

  return (
    <Html
      title={hero?.name || frontmatter.title || site.title}
      description={hero?.tagline || frontmatter.description || site.description}
      url={slug}
      socialImage={
        frontmatter.socialImage
          ? frontmatter.socialImage.startsWith('http')
            ? frontmatter.socialImage
            : `${site.basePath || ''}/${frontmatter.socialImage.replace(/^\//, '')}`
          : undefined
      }
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
          trailingSlash={site.trailingSlash}
        />
      ) : null}
      <main id="doc-main-content" class="doc-home" tabindex="-1">
        {chrome.sidebar ? <DocSidebar sections={sidebarSections} currentSlug={slug} /> : null}

        <article class="doc-home-body" data-pagefind-body="">
          {/* Hero section */}
          {hero ? (
            <section class="doc-home-section doc-hero">
              {hero.badge ? (
                <div class="doc-hero-badge">
                  <span class="doc-hero-badge-dot" />
                  {hero.badge}
                </div>
              ) : null}
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
                      {action.icon ? (
                        <span class="doc-hero-action-icon" innerHTML={action.icon} />
                      ) : null}
                      {action.text}
                    </a>
                  ))}
                </div>
              ) : null}
            </section>
          ) : null}

          {/* Install snippet */}
          {install ? (
            <div class="doc-home-section doc-home-install">
              <div class="doc-install-bar">
                <div class="doc-install-header">
                  <span class="doc-install-dot doc-install-dot-r" />
                  <span class="doc-install-dot doc-install-dot-y" />
                  <span class="doc-install-dot doc-install-dot-g" />
                  <span class="doc-install-title">Terminal</span>
                  <span style="width:36px" />
                </div>
                <div class="doc-install-body">
                  <code>
                    <span class="doc-install-prompt">$ </span>
                    {install}
                  </code>
                  <button
                    type="button"
                    class="doc-install-copy"
                    data-copy-text={install}
                    onclick={`navigator.clipboard.writeText(this.dataset.copyText);this.textContent='Copied!';setTimeout(()=>this.textContent='Copy',1500)`}
                  >
                    Copy
                  </button>
                </div>
              </div>
            </div>
          ) : null}

          {/* Features grid */}
          {features && features.length > 0 ? (
            <section class="doc-home-section">
              <p class="doc-home-section-label">Features</p>
              <div class="doc-features">
                {features.map((feature: any) => (
                  <div class="doc-feature-card">
                    {feature.icon ? (
                      <span class="doc-feature-icon" innerHTML={feature.icon} />
                    ) : null}
                    <h3 class="doc-feature-title">{feature.title}</h3>
                    <p class="doc-feature-details">{feature.details}</p>
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          {/* Packages grid (monorepo) */}
          {packages && packages.length > 0 ? (
            <section class="doc-home-section">
              <p class="doc-home-section-label">Packages</p>
              <div class="doc-packages">
                {packages.map((pkg: any) => {
                  const Tag = pkg.href ? 'a' : 'div'
                  return (
                    <Tag class="doc-package-card" href={pkg.href || undefined}>
                      <div class="doc-package-name">{pkg.name}</div>
                      <p class="doc-package-desc">{pkg.description}</p>
                      {pkg.version || pkg.tag ? (
                        <div class="doc-package-meta">
                          {pkg.version ? (
                            <span class="doc-package-version">{pkg.version}</span>
                          ) : null}
                          {pkg.tag ? <span class="doc-package-tag">{pkg.tag}</span> : null}
                        </div>
                      ) : null}
                    </Tag>
                  )
                })}
              </div>
            </section>
          ) : null}

          {/* Code example */}
          {codeExample ? (
            <section class="doc-home-section">
              <p class="doc-home-section-label">{codeExample.label || 'Quick Start'}</p>
              <div class="doc-home-code">
                <div class="doc-home-code-header">
                  <span class="doc-install-dot doc-install-dot-r" />
                  <span class="doc-install-dot doc-install-dot-y" />
                  <span class="doc-install-dot doc-install-dot-g" />
                  <span class="doc-home-code-title">{codeExample.title || ''}</span>
                  <span style="width:36px" />
                </div>
                <pre innerHTML={codeExample.code} />
              </div>
            </section>
          ) : null}

          {/* Content (if any markdown content is provided) */}
          {content ? (
            <section class="doc-home-content">
              <div class="prose" innerHTML={content} />
            </section>
          ) : null}
        </article>

        {chrome.footer ? (
          <div class="doc-home-footer">
            <DocFooter
              links={site.footerLinks}
              footerText={site.footerText}
              maintainer={site.maintainer}
              copyright={site.copyright}
            />
          </div>
        ) : null}
      </main>
    </Html>
  )
}
