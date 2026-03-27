import type { ReactNode } from 'react'
import { Link } from 'react-router'

export function Layout({ children }: { children: ReactNode }) {
  return (
    <div style={{ maxWidth: '48rem', margin: '0 auto', padding: '1rem 1.5rem' }}>
      <header
        style={{ borderBottom: '1px solid #e5e7eb', paddingBottom: '1rem', marginBottom: '2rem' }}
      >
        <nav style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
          <Link
            to="/"
            style={{
              fontWeight: 700,
              fontSize: '1.25rem',
              textDecoration: 'none',
              color: 'inherit',
            }}
          >
            Pagesmith + React
          </Link>
          <Link to="/" style={{ textDecoration: 'none', color: '#6b7280' }}>
            Home
          </Link>
          <Link to="/about" style={{ textDecoration: 'none', color: '#6b7280' }}>
            About
          </Link>
        </nav>
      </header>
      <main>{children}</main>
    </div>
  )
}
