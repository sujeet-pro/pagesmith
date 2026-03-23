import posts from 'virtual:content/posts'

const sortedPosts = [...posts].sort(
  (a, b) => new Date(b.data.date).getTime() - new Date(a.data.date).getTime(),
)

export function Home() {
  return (
    <div>
      <h1>Posts</h1>
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {sortedPosts.map((post) => (
          <li
            key={post.slug}
            style={{
              marginBottom: '1.5rem',
              paddingBottom: '1.5rem',
              borderBottom: '1px solid #f3f4f6',
            }}
          >
            <a href={`#/posts/${post.slug}`} style={{ textDecoration: 'none', color: 'inherit' }}>
              <h2 style={{ margin: '0 0 0.25rem' }}>{post.data.title}</h2>
            </a>
            <p style={{ margin: '0 0 0.5rem', color: '#6b7280' }}>{post.data.description}</p>
            <time dateTime={post.data.date} style={{ fontSize: '0.875rem', color: '#9ca3af' }}>
              {new Date(post.data.date).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </time>
            {post.data.tags.length > 0 && (
              <span style={{ marginLeft: '1rem', fontSize: '0.875rem', color: '#9ca3af' }}>
                {post.data.tags.join(', ')}
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}
