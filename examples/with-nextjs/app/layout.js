import '@pagesmith/site/css/content'
import './globals.css'
import Link from 'next/link'
import { PagesmithContentRuntime } from '../components/pagesmith-content-runtime'

export const metadata = {
  title: {
    default: 'Pagesmith + Next.js',
    template: '%s | Pagesmith + Next.js',
  },
  description:
    'Render local markdown in a Next.js App Router project with @pagesmith/core and Pagesmith shared content runtime helpers.',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="color-scheme-auto theme-paper">
      <body>
        <header className="site-header">
          <div className="site-header-inner">
            <Link href="/" className="brand">
              Pagesmith + Next.js
            </Link>
            <p className="brand-copy">
              App Router pages rendered from local markdown with <code>@pagesmith/core</code>.
            </p>
          </div>
        </header>
        <main className="site-main">{children}</main>
        <footer className="site-footer">
          <p>
            Shared markdown CSS and code-block runtime come from <code>@pagesmith/site</code>.
            Routing, layout, and page chrome stay native to Next.js.
          </p>
        </footer>
        <PagesmithContentRuntime />
      </body>
    </html>
  )
}
