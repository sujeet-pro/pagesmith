import { createMemo, Show } from 'solid-js'
import pages from 'virtual:content/pages'

export function About() {
  const about = createMemo(() => pages.find((p) => p.slug === 'about'))

  return (
    <Show when={about()} fallback={<p>About page not found.</p>}>
      {(p) => (
        <div>
          <h1>{p().title}</h1>
          <div class="content" innerHTML={p().html} />
        </div>
      )}
    </Show>
  )
}
