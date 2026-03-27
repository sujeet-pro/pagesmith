import { createMemo, Show } from 'solid-js'
import posts from 'virtual:content/posts'

export function Post(props: { slug: string }) {
  const post = createMemo(() => posts.find((entry) => entry.contentSlug === props.slug))

  return (
    <Show when={post()} fallback={<p>Post not found.</p>}>
      {(p) => (
        <article>
          <header style={{ 'margin-bottom': '1.5rem' }}>
            <h1>{p().frontmatter.title}</h1>
            <p style={{ color: '#666' }}>
              {p().frontmatter.date.toLocaleDateString()}
              {p().frontmatter.tags.length > 0 && ` — ${p().frontmatter.tags.join(', ')}`}
            </p>
          </header>
          <div class="prose" innerHTML={p().html} />
          <footer
            style={{
              'margin-top': '2rem',
              'padding-top': '1rem',
              'border-top': '1px solid #eee',
            }}
          >
            <a href="/">&larr; Back to posts</a>
          </footer>
        </article>
      )}
    </Show>
  )
}
