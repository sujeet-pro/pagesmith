import Link from 'next/link'
import { getAllPosts } from '../lib/content'

function formatDate(isoDate) {
  return new Date(isoDate).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export default async function HomePage() {
  const posts = await getAllPosts()
  const featured = posts.find((post) => post.slug === 'kitchen-sink') ?? posts[0]

  return (
    <div className="home-grid">
      <section className="panel hero-panel">
        <p className="eyebrow">Next.js example</p>
        <h1>Use Pagesmith as a headless markdown engine inside a Next app.</h1>
        <p className="lead">
          This example keeps content loading on <code>@pagesmith/core</code>, layers the shared
          markdown styles from <code>@pagesmith/site/css/content</code>, and mounts a single global
          runtime component for copy buttons, code tabs, and collapsed lines.
        </p>
        {featured ? (
          <p className="hero-actions">
            <Link href={`/posts/${featured.slug}`} className="primary-link">
              Open the kitchen sink article
            </Link>
          </p>
        ) : null}
      </section>

      <section className="panel">
        <h2>What this shows</h2>
        <ul className="feature-list">
          <li>
            Server-side markdown rendering through <code>ContentEntry.render()</code>
          </li>
          <li>Next App Router routes and metadata generated from local content files</li>
          <li>
            Pagesmith code-block titles, tabs, copy actions, collapse, and syntax highlighting
          </li>
          <li>Custom Next.js layout styling layered on top of the shared content bundle</li>
        </ul>
      </section>

      <section className="panel">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Posts</p>
            <h2>Rendered markdown pages</h2>
          </div>
          <span className="section-count">{posts.length} articles</span>
        </div>

        <ul className="post-list">
          {posts.map((post) => (
            <li key={post.slug} className="post-list-item">
              <Link href={`/posts/${post.slug}`} className="post-link">
                <span className="post-link-row">
                  <span className="post-link-title">{post.title}</span>
                  <span className="post-link-meta">
                    {formatDate(post.date)} · {post.readTime} min read
                  </span>
                </span>
                {post.description ? (
                  <span className="post-link-description">{post.description}</span>
                ) : null}
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
