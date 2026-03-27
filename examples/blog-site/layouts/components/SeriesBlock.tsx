import { Fragment, h } from '@pagesmith/core/jsx-runtime'
import type { SeriesNav } from '../types'

type Props = {
  seriesNav: SeriesNav
  currentSlug: string
}

export function SeriesBlock({ seriesNav, currentSlug }: Props) {
  const { series, articles } = seriesNav
  return (
    <details class="series-block">
      <summary>Series: {series.displayName}</summary>
      <ul class="series-block-list">
        {articles.map((a) => (
          <li class={a.url === currentSlug ? 'current' : ''}>
            {a.url === currentSlug ? (
              <span>
                {a.title} <span class="series-here">&mdash; You are here</span>
              </span>
            ) : (
              <a href={a.url}>{a.title}</a>
            )}
          </li>
        ))}
      </ul>
    </details>
  )
}
