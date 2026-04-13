import Link from 'next/link'

export default function NotFound() {
  return (
    <section className="panel not-found-panel">
      <p className="eyebrow">404</p>
      <h1>That page does not exist.</h1>
      <p>
        The route may not have been generated from the local markdown collection. Head back to the
        article index and pick a rendered page.
      </p>
      <p>
        <Link href="/" className="primary-link">
          Return home
        </Link>
      </p>
    </section>
  )
}
