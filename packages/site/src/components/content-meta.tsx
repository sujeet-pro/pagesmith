import { Fragment, h } from '../jsx-runtime/index.js'
import { SITE_CHROME_ASSETS, withComponentAssets } from './assets.js'

function formatMetaDate(value: string | Date | undefined): string | null {
  if (!value) return null
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export type ContentMetaProps = {
  publishedDate?: string | Date
  lastUpdatedDate?: string | Date
  isDraft?: boolean
  tags?: string[]
}

function ContentMetaComponent({
  publishedDate,
  lastUpdatedDate,
  isDraft,
  tags = [],
}: ContentMetaProps) {
  const published = formatMetaDate(publishedDate)
  const updated = formatMetaDate(lastUpdatedDate)
  const showUpdated = updated && updated !== published

  if (!isDraft && !published && !showUpdated && tags.length === 0) {
    return <Fragment />
  }

  return (
    <div class="site-content-meta">
      <div class="site-content-meta-row">
        {isDraft ? <span class="site-pill">Draft</span> : null}
        {published ? <span>Published {published}</span> : null}
        {showUpdated ? <span>Updated {updated}</span> : null}
      </div>
      {tags.length > 0 ? (
        <div class="site-tag-list" aria-label="Tags">
          {tags.map((tag) => (
            <span class="site-pill site-pill-subtle">{tag}</span>
          ))}
        </div>
      ) : null}
    </div>
  )
}

export const ContentMeta = withComponentAssets(ContentMetaComponent, SITE_CHROME_ASSETS)
