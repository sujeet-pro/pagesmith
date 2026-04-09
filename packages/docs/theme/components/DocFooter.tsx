import { h } from '@pagesmith/core/jsx-runtime'

type Props = {
  links?: Array<{ label: string; path: string }>
  footerText?: string
  copyright?: {
    holder: string
    startYear: number
  }
  editUrl?: string
  editLabel?: string
  lastUpdated?: string
}

const DEFAULT_FOOTER_TEXT = 'Built with love using pagesmith'
const PAGESMITH_GITHUB_URL = 'https://github.com/sujeet-pro/pagesmith'

function formatDate(isoDate: string): string {
  const date = new Date(isoDate)
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
}

export function DocFooter({
  links,
  footerText,
  copyright,
  editUrl,
  editLabel,
  lastUpdated,
}: Props) {
  const year = new Date().getFullYear()
  const resolvedFooterText = footerText ?? DEFAULT_FOOTER_TEXT
  const hasPageMeta = editUrl || lastUpdated

  return (
    <footer class="doc-footer">
      {hasPageMeta ? (
        <div class="doc-page-meta">
          {editUrl ? (
            <a href={editUrl} class="doc-edit-link" target="_blank" rel="noopener noreferrer">
              {editLabel || 'Edit this page'}
            </a>
          ) : null}
          {lastUpdated ? (
            <span class="doc-last-updated">
              Last updated: <time datetime={lastUpdated}>{formatDate(lastUpdated)}</time>
            </span>
          ) : null}
        </div>
      ) : null}
      {links && links.length > 0 ? (
        <nav class="doc-footer-links" aria-label="Footer links">
          {links.map((link) => (
            <a href={link.path}>{link.label}</a>
          ))}
        </nav>
      ) : null}
      <div class="doc-footer-theme no-js-hidden" data-footer-theme="">
        <div class="doc-footer-theme-group">
          <span class="doc-footer-theme-label">Appearance</span>
          <div class="doc-footer-theme-options" data-footer-scheme="">
            <button type="button" data-scheme="auto" class="active" aria-pressed="true">
              Auto
            </button>
            <button type="button" data-scheme="light" aria-pressed="false">
              Light
            </button>
            <button type="button" data-scheme="dark" aria-pressed="false">
              Dark
            </button>
          </div>
        </div>
        <div class="doc-footer-theme-group">
          <span class="doc-footer-theme-label">Theme</span>
          <div class="doc-footer-theme-options" data-footer-theme-type="">
            <button type="button" data-theme="paper" class="active" aria-pressed="true">
              Paper
            </button>
            <button type="button" data-theme="high-contrast" aria-pressed="false">
              High Contrast
            </button>
          </div>
        </div>
        <div class="doc-footer-theme-group">
          <span class="doc-footer-theme-label">Text Size</span>
          <div class="doc-footer-theme-options" data-footer-text-size="">
            <button type="button" data-size="small" aria-pressed="false" aria-label="Small text">
              <span class="doc-text-size-label" data-size="small">
                A
              </span>
            </button>
            <button
              type="button"
              data-size="base"
              class="active"
              aria-pressed="true"
              aria-label="Default text"
            >
              <span class="doc-text-size-label" data-size="base">
                A
              </span>
            </button>
            <button type="button" data-size="large" aria-pressed="false" aria-label="Large text">
              <span class="doc-text-size-label" data-size="large">
                A
              </span>
            </button>
          </div>
        </div>
      </div>
      {resolvedFooterText === DEFAULT_FOOTER_TEXT ? (
        <p class="doc-footer-signoff">
          Built with <span aria-hidden="true">&#10084;</span> using{' '}
          <a href={PAGESMITH_GITHUB_URL} target="_blank" rel="noopener noreferrer">
            pagesmith
          </a>
        </p>
      ) : (
        <p class="doc-footer-signoff">{resolvedFooterText}</p>
      )}
      {copyright ? (
        <p class="doc-footer-copyright">
          &copy; {copyright.startYear < year ? `${copyright.startYear}\u2013${year}` : `${year}`}{' '}
          {copyright.holder}
        </p>
      ) : null}
    </footer>
  )
}
