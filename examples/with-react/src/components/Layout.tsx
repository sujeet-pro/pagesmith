import type { ReactNode } from 'react'

export function Layout({ children }: { children: ReactNode }) {
  return (
    <div style={{ maxWidth: '48rem', margin: '0 auto', padding: '1rem 1.5rem' }}>
      <header
        style={{ borderBottom: '1px solid #e5e7eb', paddingBottom: '1rem', marginBottom: '2rem' }}
      >
        <nav style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
          <a
            href="#/"
            style={{
              fontWeight: 700,
              fontSize: '1.25rem',
              textDecoration: 'none',
              color: 'inherit',
            }}
          >
            Pagesmith + React
          </a>
          <a href="#/" style={{ textDecoration: 'none', color: '#6b7280' }}>
            Home
          </a>
          <a href="#/about" style={{ textDecoration: 'none', color: '#6b7280' }}>
            About
          </a>
        </nav>
      </header>
      <main>{children}</main>
    </div>
  )
}
