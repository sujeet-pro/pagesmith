import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getAllPosts, getPostBySlug } from '../../../lib/content'

export const dynamicParams = false

function formatDate(isoDate) {
  return new Date(isoDate).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export async function generateStaticParams() {
  const posts = await getAllPosts()
  return posts.map((post) => ({ slug: post.slug }))
}

export async function generateMetadata({ params }) {
  const { slug } = await params
  const post = await getPostBySlug(slug)

  if (!post) {
    return { title: 'Not Found' }
  }

  return {
    title: post.title,
    description: post.description,
  }
}

export default async function PostPage({ params }) {
  const { slug } = await params
  const post = await getPostBySlug(slug)

  if (!post) {
    notFound()
  }

  const headings = post.headings.filter((heading) => heading.depth === 2 || heading.depth === 3)

  return (
    <article className="article-shell">
      <Link href="/" className="back-link">
        Back to the article index
      </Link>

      <header className="article-header">
        <div>
          <p className="eyebrow">Markdown article</p>
          <h1>{post.title}</h1>
          {post.description ? <p className="article-description">{post.description}</p> : null}
        </div>

        <div className="article-meta">
          <span>{formatDate(post.date)}</span>
          <span>{post.readTime} min read</span>
        </div>

        {post.tags.length > 0 ? (
          <ul className="tag-list" aria-label="Tags">
            {post.tags.map((tag) => (
              <li key={tag} className="tag-chip">
                {tag}
              </li>
            ))}
          </ul>
        ) : null}
      </header>

      <div className={`article-layout${headings.length > 0 ? ' article-layout--with-toc' : ''}`}>
        <div className="article-panel">
          <div className="prose article-prose" dangerouslySetInnerHTML={{ __html: post.html }} />
        </div>

        {headings.length > 0 ? (
          <aside className="toc-panel">
            <p className="toc-title">On this page</p>
            <nav aria-label="Table of contents">
              <ul className="toc-list">
                {headings.map((heading) => (
                  <li key={heading.slug} className={`toc-item toc-item-depth-${heading.depth}`}>
                    <a href={`#${heading.slug}`}>{heading.text}</a>
                  </li>
                ))}
              </ul>
            </nav>
          </aside>
        ) : null}
      </div>
    </article>
  )
}
