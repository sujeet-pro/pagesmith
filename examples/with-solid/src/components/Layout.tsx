import type { JSX } from 'solid-js'

export function Layout(props: { children: JSX.Element }) {
  return (
    <div style={{ 'max-width': '48rem', margin: '0 auto', padding: '2rem 1rem' }}>
      <nav
        style={{
          'margin-bottom': '2rem',
          'padding-bottom': '1rem',
          'border-bottom': '1px solid #eee',
        }}
      >
        <a href="#/" style={{ 'margin-right': '1rem' }}>
          Home
        </a>
        <a href="#/about">About</a>
      </nav>
      <main>{props.children}</main>
    </div>
  )
}
