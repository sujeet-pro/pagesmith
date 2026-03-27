import { Fragment, h } from '@pagesmith/core/jsx-runtime'

type PrevNext = {
  title: string
  path: string
}

type Props = {
  prev?: PrevNext
  next?: PrevNext
  links?: Array<{ label: string; path: string }>
  copyright?: {
    holder: string
    startYear: number
  }
}

export function DocFooter({ prev, next, links, copyright }: Props) {
  const hasPrevNext = prev || next
  const year = new Date().getFullYear()

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
      {copyright ? (
        <p class="doc-footer-copyright">
          &copy; {copyright.startYear < year ? `${copyright.startYear}–${year}` : `${year}`}{' '}
          {copyright.holder}
        </p>
      ) : null}
    </footer>
  )
}
