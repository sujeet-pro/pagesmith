import { createMemo, Show } from 'solid-js'
import pages from 'virtual:content/pages'

export function About() {
  const about = createMemo(() => pages.find((page) => page.contentSlug === 'pages/about'))

  return (
    <Show when={about()} fallback={<p>About page not found.</p>}>
      {(p) => (
        <div>
          <h1>{p().frontmatter.title}</h1>
          <div class="prose" innerHTML={p().html} />
        </div>
      )}
    </Show>
  )
}
