/// <reference types="vite-plus/client" />

declare module 'virtual:content/posts' {
  const posts: Array<{
    slug: string
    title: string
    description: string
    date: string
    tags: string[]
    html: string
  }>
  export default posts
}

declare module 'virtual:content/authors' {
  const authors: Array<{
    slug: string
    name: string
    bio: string
    avatar?: string
  }>
  export default authors
}

declare module 'virtual:content/pages' {
  const pages: Array<{
    slug: string
    title: string
    html: string
  }>
  export default pages
}

declare module 'virtual:content/styles' {
  const css: string
  export default css
}
