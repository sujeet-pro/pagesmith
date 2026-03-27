import { For } from 'solid-js'
import posts from 'virtual:content/posts'

const sortedPosts = [...posts].sort(
  (a, b) => b.frontmatter.date.getTime() - a.frontmatter.date.getTime(),
)

export function Home() {
  return (
    <div>
      <h1>Posts</h1>
      <ul style={{ 'list-style': 'none', padding: '0' }}>
        <For each={sortedPosts}>
          {(post) => (
            <li style={{ 'margin-bottom': '1.5rem' }}>
              <a href={`/${post.contentSlug}`}>
                <h2 style={{ margin: '0 0 0.25rem' }}>{post.frontmatter.title}</h2>
              </a>
              <p style={{ margin: '0 0 0.25rem', color: '#666' }}>{post.frontmatter.description}</p>
              <small style={{ color: '#999' }}>
                {post.frontmatter.date.toLocaleDateString()}
                {post.frontmatter.tags.length > 0 && ` — ${post.frontmatter.tags.join(', ')}`}
              </small>
            </li>
          )}
        </For>
      </ul>
    </div>
  )
}
