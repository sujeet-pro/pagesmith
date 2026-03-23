import posts from 'virtual:content/posts'

export function Post({ slug }: { slug: string }) {
  const post = posts.find((p) => p.slug === slug)

  if (!post) {
    return (
      <div>
        <h1>Post not found</h1>
        <p>
          No post with slug &quot;{slug}&quot;. <a href="#/">Go back home</a>.
        </p>
      </div>
    )
  }

  return (
    <article>
      <header style={{ marginBottom: '2rem' }}>
        <h1 style={{ marginBottom: '0.5rem' }}>{post.data.title}</h1>
        <div style={{ color: '#6b7280', fontSize: '0.875rem' }}>
          <time dateTime={post.data.date}>
            {new Date(post.data.date).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </time>
          {post.readTime > 0 && (
            <span style={{ marginLeft: '1rem' }}>{post.readTime} min read</span>
          )}
        </div>
        {post.data.tags.length > 0 && (
          <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.5rem' }}>
            {post.data.tags.map((tag) => (
              <span
                key={tag}
                style={{
                  fontSize: '0.75rem',
                  padding: '0.125rem 0.5rem',
                  borderRadius: '9999px',
                  backgroundColor: '#f3f4f6',
                  color: '#4b5563',
                }}
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </header>
      <div className="prose" dangerouslySetInnerHTML={{ __html: post.html }} />
      <footer style={{ marginTop: '3rem', paddingTop: '1rem', borderTop: '1px solid #e5e7eb' }}>
        <a href="#/" style={{ color: '#6b7280' }}>
          &larr; Back to all posts
        </a>
      </footer>
    </article>
  )
}
