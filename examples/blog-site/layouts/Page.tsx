import { h } from '@pagesmith/core/jsx-runtime'
import type { PageLayoutProps } from './types'
import { Footer } from './components/Footer'
import { Header } from './components/Header'
import { Html } from './components/Html'
import { TOC } from './components/TOC'

export default function Page(props: PageLayoutProps) {
  const { content, frontmatter, headings, slug, site } = props

  return (
    <Html
      title={frontmatter.title ? `${frontmatter.title} — ${site.title}` : site.title}
      description={frontmatter.description || site.description}
      url={`${slug}/`}
      site={site}
    >
      <Header site={site} slug={slug} />
      <div class="layout-two-col">
        <main class="main-content">
          <article>
            <div class="prose" innerHTML={content} />
          </article>
          <Footer site={site} />
        </main>
        <aside class="sidebar sidebar-right">
          <TOC headings={headings} />
        </aside>
      </div>
    </Html>
  )
}
