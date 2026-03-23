import { createMemo, Show } from 'solid-js'
import posts from 'virtual:content/posts'

export function Post(props: { slug: string }) {
  const post = createMemo(() => posts.find((p) => p.slug === props.slug))

  return (
    <Show when={post()} fallback={<p>Post not found.</p>}>
      {(p) => (
        <article>
          <header style={{ 'margin-bottom': '1.5rem' }}>
            <h1>{p().title}</h1>
            <p style={{ color: '#666' }}>
              {new Date(p().date).toLocaleDateString()}
              {p().tags.length > 0 && ` — ${p().tags.join(', ')}`}
            </p>
          </header>
          <div class="content" innerHTML={p().html} />
        </article>
      )}
    </Show>
  )
}
