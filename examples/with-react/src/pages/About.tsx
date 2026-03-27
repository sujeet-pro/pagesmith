import pages from 'virtual:content/pages'

export function About() {
  const about = pages.find((page) => page.contentSlug === 'pages/about')

  if (!about) {
    return (
      <div>
        <h1>About</h1>
        <p>About page content not found.</p>
      </div>
    )
  }

  return (
    <article>
      <div className="prose" dangerouslySetInnerHTML={{ __html: about.html }} />
    </article>
  )
}
