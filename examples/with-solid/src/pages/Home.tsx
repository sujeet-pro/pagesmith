import { For } from 'solid-js'
import posts from 'virtual:content/posts'

export function Home() {
  return (
    <div>
      <h1>Posts</h1>
      <ul style={{ 'list-style': 'none', padding: '0' }}>
        <For each={posts}>
          {(post) => (
            <li style={{ 'margin-bottom': '1.5rem' }}>
              <a href={`#/posts/${post.slug}`}>
                <h2 style={{ margin: '0 0 0.25rem' }}>{post.title}</h2>
              </a>
              <p style={{ margin: '0 0 0.25rem', color: '#666' }}>{post.description}</p>
              <small style={{ color: '#999' }}>
                {new Date(post.date).toLocaleDateString()}
                {post.tags.length > 0 && ` — ${post.tags.join(', ')}`}
              </small>
            </li>
          )}
        </For>
      </ul>
    </div>
  )
}
