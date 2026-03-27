import { Link } from 'react-router'
import posts from 'virtual:content/posts'

const sortedPosts = [...posts].sort(
  (a, b) => b.frontmatter.date.getTime() - a.frontmatter.date.getTime(),
)

export function Home() {
  return (
    <div>
      <h1>Posts</h1>
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {sortedPosts.map((post) => (
          <li
            key={post.id}
            style={{
              marginBottom: '1.5rem',
              paddingBottom: '1.5rem',
              borderBottom: '1px solid #f3f4f6',
            }}
          >
            <Link to={`/${post.contentSlug}`} style={{ textDecoration: 'none', color: 'inherit' }}>
              <h2 style={{ margin: '0 0 0.25rem' }}>{post.frontmatter.title}</h2>
            </Link>
            <p style={{ margin: '0 0 0.5rem', color: '#6b7280' }}>{post.frontmatter.description}</p>
            <time
              dateTime={post.frontmatter.date.toISOString()}
              style={{ fontSize: '0.875rem', color: '#9ca3af' }}
            >
              {post.frontmatter.date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </time>
            {post.frontmatter.tags.length > 0 && (
              <span style={{ marginLeft: '1rem', fontSize: '0.875rem', color: '#9ca3af' }}>
                {post.frontmatter.tags.join(', ')}
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}
