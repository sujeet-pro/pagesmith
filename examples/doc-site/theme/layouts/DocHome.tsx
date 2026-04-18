import { h } from "@pagesmith/docs/jsx-runtime";
import { Html, InstallSnippet } from "@pagesmith/docs/theme";
import {
  buildHomeSidebarSections,
  DocFooter,
  DocHeader,
  DocSidebar,
  DocSidebarModal,
  resolveSocialImage,
  toHtmlSite,
  type ExampleSite,
} from "./shared";

/**
 * Home layout override — maps `content/README.md` frontmatter (hero, features,
 * packages, install banner, code sample) onto the stock docs home structure while
 * reusing `shared` header/footer/sidebar so search + theme behavior match inner pages.
 */

type Props = {
  content: string;
  frontmatter: Record<string, any>;
  headings: Array<{ depth: number; text: string; slug: string }>;
  slug: string;
  site: ExampleSite;
  [key: string]: any;
};

export default function DocHome(props: Props) {
  const { content, frontmatter, slug, site } = props;

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
      : undefined);

  const features = frontmatter.features;
  const install = frontmatter.install;
  const packages = frontmatter.packages;
  const codeExample = frontmatter.codeExample;
  const sidebarSections = buildHomeSidebarSections(site.navItems);
  const htmlSite = toHtmlSite(site);

  return (
    <Html
      title={hero?.name || frontmatter.title || site.title}
      description={hero?.tagline || frontmatter.description || site.description}
      url={slug}
      socialImage={resolveSocialImage(site, frontmatter.socialImage)}
      site={htmlSite}
    >
      <DocHeader
        siteName={site.name}
        siteIcon={site.icon}
        basePath={site.basePath}
        homeLink={site.homeLink}
        navItems={site.navItems}
        slug={slug}
        searchEnabled={site.search?.enabled}
      />
      <main id="doc-main-content" class="doc-home" tabindex="-1">
        <DocSidebar sections={sidebarSections} currentSlug={slug} />

        <article class="doc-home-body" data-pagefind-body="">
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
                      class={`doc-hero-action doc-hero-action-${action.theme || "brand"}`}
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

          {install ? (
            <div class="doc-home-section doc-home-install">
              <InstallSnippet command={install} />
            </div>
          ) : null}

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

          {packages && packages.length > 0 ? (
            <section class="doc-home-section">
              <p class="doc-home-section-label">Packages</p>
              <div class="doc-packages">
                {packages.map((pkg: any) => {
                  const Tag = pkg.href ? "a" : "div";
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
                  );
                })}
              </div>
            </section>
          ) : null}

          {codeExample ? (
            <section class="doc-home-section">
              <p class="doc-home-section-label">{codeExample.label || "Quick Start"}</p>
              <figure
                class="ps-code-block"
                data-ps-code-frame="terminal"
                data-ps-code-renderer="pagesmith"
                data-ps-code-title={codeExample.title || ""}
                style="--ps-code-light-bg:#fff;--ps-code-dark-bg:#24292e;--ps-code-light-fg:#24292e;--ps-code-dark-fg:#e1e4e8"
              >
                <div class="ps-code-toolbar ps-code-toolbar--terminal">
                  <div class="ps-code-toolbar-main ps-code-toolbar-main--terminal">
                    <span class="ps-code-traffic-lights" aria-hidden="true">
                      <span class="ps-code-traffic-light" />
                      <span class="ps-code-traffic-light" />
                      <span class="ps-code-traffic-light" />
                    </span>
                    {codeExample.title ? (
                      <span class="ps-code-toolbar-chip">
                        <span class="ps-code-toolbar-label">{codeExample.title}</span>
                      </span>
                    ) : null}
                  </div>
                </div>
                <div class="ps-code-body">
                  <pre
                    class="ps-code-pre doc-home-code-pre"
                    tabindex="0"
                    role="region"
                    aria-label={codeExample.title || "Code example"}
                    innerHTML={codeExample.code}
                  />
                </div>
              </figure>
            </section>
          ) : null}

          {content ? (
            <section class="doc-home-content">
              <div class="prose" innerHTML={content} />
            </section>
          ) : null}
        </article>

        <div class="doc-home-footer">
          <DocFooter
            links={site.footerLinks}
            footerText={site.footerText}
            maintainer={site.maintainer}
            copyright={site.copyright}
          />
        </div>
      </main>
      {site.navItems && site.navItems.length > 0 ? (
        <DocSidebarModal
          navItems={site.navItems}
          currentPath={slug}
          collapsible={site.sidebar?.collapsible}
          navLabel="Navigation"
          trailingSlash={site.trailingSlash}
        />
      ) : null}
    </Html>
  );
}
