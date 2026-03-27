import { Fragment, h } from '@pagesmith/core/jsx-runtime'
import type { HomeLayoutProps } from './types'
import { Footer } from './components/Footer'
import { Header } from './components/Header'
import { Html } from './components/Html'

export default function Home(props: HomeLayoutProps) {
  const { site, featuredArticles, featuredSeries, stats, frontmatter } = props
  const hasHeroLayout = frontmatter?.hero || frontmatter?.features

  if (hasHeroLayout) {
    return (
      <Html
        title={frontmatter.hero?.name || site.home.pageTitle}
        description={frontmatter.hero?.tagline || site.home.pageDescription}
        url="/"
        site={site}
      >
        <Header site={site} slug="/" />
        <main class="main-content main-home">
          {/* ── VitePress-compatible Hero ── */}
          {frontmatter.hero && (
            <section class="hero">
              {frontmatter.hero.name && <p class="hero-name">{frontmatter.hero.name}</p>}
              {frontmatter.hero.text && <h1 class="hero-text">{frontmatter.hero.text}</h1>}
              {frontmatter.hero.tagline && <p class="hero-tagline">{frontmatter.hero.tagline}</p>}
              {frontmatter.hero.actions && (
                <div class="hero-actions">
                  {frontmatter.hero.actions.map((action: any) => (
                    <a
                      href={action.link}
                      class={`hero-action hero-action-${action.theme || 'brand'}`}
                    >
                      {action.text}
                    </a>
                  ))}
                </div>
              )}
            </section>
          )}

          {/* ── VitePress-compatible Features Grid ── */}
          {frontmatter.features && (
            <section class="features">
              {frontmatter.features.map((feature: any) => (
                <div class="feature-card">
                  {feature.icon && <span class="feature-icon">{feature.icon}</span>}
                  <h3>{feature.title}</h3>
                  <p>{feature.details}</p>
                </div>
              ))}
            </section>
          )}

          <Footer site={site} />
        </main>
      </Html>
    )
  }

  if (!site.home) {
    return (
      <Html title={frontmatter.title ?? site.title} description={frontmatter.description ?? site.description} url="/" site={site}>
        <Header site={site} slug="/" />
        <main class="main-content main-home">
          <Fragment innerHTML={props.content} />
          <Footer site={site} />
        </main>
      </Html>
    )
  }

  const { profile, profileActions } = site.home

  return (
    <Html title={site.home.pageTitle} description={site.home.pageDescription} url="/" site={site}>
      <Header site={site} slug="/" />
      <main class="main-content main-home">
        {/* ── Profile ── */}
        <section class="home-profile">
          <h1 class="home-name">{profile.name}</h1>
          <p class="home-title">{profile.title}</p>
          <p class="home-bio">{profile.bio}</p>
          <div class="home-actions">
            {profileActions.linkedin ? (
              <a href={site.social.linkedin.url} class="home-action" target="_blank" rel="noopener">
                {profileActions.linkedin}
              </a>
            ) : null}
            {profileActions.viewCv ? (
              <a href="/cv" class="home-action">
                {profileActions.viewCv}
              </a>
            ) : null}
            {profileActions.allArticles ? (
              <a href="/articles" class="home-action">
                {profileActions.allArticles}
              </a>
            ) : null}
          </div>
        </section>

        <hr class="home-divider" />

        {/* ── Knowledge Hub (featured series) ── */}
        {featuredSeries && featuredSeries.length > 0 ? (
          <section class="home-section">
            <div class="home-section-header">
              <h2>Knowledge Hub</h2>
              {stats ? (
                <p class="home-stats">
                  {stats.totalArticles} articles &middot; {stats.totalSeries} topics
                </p>
              ) : null}
            </div>
            <p class="home-section-desc">
              Deep-dive articles for engineers who want to understand how things actually work.
            </p>
            <div class="home-series-grid">
              {featuredSeries.map((s) => (
                <a href={`/articles#${s.slug}`} class="home-series-card">
                  <span class="home-series-name">{s.displayName}</span>
                  <span class="home-series-count">{s.articles.length} articles</span>
                  {s.description ? <span class="home-series-desc">{s.description}</span> : null}
                </a>
              ))}
            </div>
            <a href="/articles" class="home-see-all">
              Browse all articles &rarr;
            </a>
          </section>
        ) : null}

        <hr class="home-divider" />

        {/* ── Featured Articles ── */}
        {featuredArticles && featuredArticles.length > 0 ? (
          <section class="home-section">
            <div class="home-section-header">
              <p class="home-section-label">Featured Articles</p>
              <p class="home-section-meta">Hand-picked reads</p>
            </div>
            <ul class="home-featured-list">
              {featuredArticles.map((a) => (
                <li class="home-featured-item">
                  <a href={a.url}>
                    <span class="home-featured-title">{a.title}</span>
                    {a.description ? <span class="home-featured-desc">{a.description}</span> : null}
                  </a>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <Footer site={site} />
      </main>
    </Html>
  )
}
