import { Fragment, h } from '@pagesmith/core/jsx-runtime'
import type { Heading } from '@pagesmith/core/schemas'

type Props = {
  headings: Heading[]
  title?: string
}

export function DocTOC({ headings, title = 'On this page' }: Props) {
  const filtered = headings.filter((h) => h.depth >= 2 && h.depth <= 3)
  if (filtered.length === 0) return <Fragment />

  return (
    <nav class="doc-toc" aria-label="Table of contents">
      <p class="doc-toc-title">{title}</p>
      <ul class="doc-toc-list">
        {filtered.map((heading) => (
          <li class={`doc-toc-item depth-${heading.depth}`}>
            <a href={`#${heading.slug}`}>{heading.text}</a>
          </li>
        ))}
      </ul>
    </nav>
  )
}
