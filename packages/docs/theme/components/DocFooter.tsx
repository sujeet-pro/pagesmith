import { Fragment, h } from '@pagesmith/core/jsx-runtime'

type PrevNext = {
  title: string
  path: string
}

type Props = {
  prev?: PrevNext
  next?: PrevNext
  links?: Array<{ label: string; path: string }>
  footerText?: string
  copyright?: {
    holder: string
    startYear: number
  }
}

const DEFAULT_FOOTER_TEXT = 'Built with love using pagesmith'
const PAGESMITH_GITHUB_URL = 'https://github.com/sujeet-pro/pagesmith'

export function DocFooter({ prev, next, links, footerText, copyright }: Props) {
  const hasPrevNext = prev || next
  const year = new Date().getFullYear()
  const resolvedFooterText = footerText ?? DEFAULT_FOOTER_TEXT

  return (
    <footer class="doc-footer">
      {hasPrevNext ? (
        <nav class="doc-footer-nav" aria-label="Page navigation">
          {prev ? (
            <a href={prev.path + '/'} class="doc-footer-link doc-footer-prev">
              <span class="doc-footer-label">Previous</span>
              <span class="doc-footer-title">{prev.title}</span>
            </a>
          ) : (
            <span />
          )}
          {next ? (
            <a href={next.path + '/'} class="doc-footer-link doc-footer-next">
              <span class="doc-footer-label">Next</span>
              <span class="doc-footer-title">{next.title}</span>
            </a>
          ) : (
            <span />
          )}
        </nav>
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
          &copy; {copyright.startYear < year ? `${copyright.startYear}–${year}` : `${year}`}{' '}
          {copyright.holder}
        </p>
      ) : null}
    </footer>
  )
}
