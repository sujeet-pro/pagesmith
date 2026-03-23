/// <reference types="svelte" />
/// <reference types="vite-plus/client" />

declare module 'virtual:content/posts' {
  interface Post {
    slug: string
    collection: string
    data: {
      title: string
      date: string
      description?: string
      author?: string
      tags?: string[]
    }
    html: string
    headings: { depth: number; text: string; id: string }[]
    readTime: number
  }
  const posts: Post[]
  export default posts
}

declare module 'virtual:content/authors' {
  interface Author {
    slug: string
    collection: string
    data: {
      name: string
      bio?: string
      avatar?: string
    }
  }
  const authors: Author[]
  export default authors
}

declare module 'virtual:content/pages' {
  interface Page {
    slug: string
    collection: string
    data: {
      title: string
      date: string
      description?: string
    }
    html: string
    headings: { depth: number; text: string; id: string }[]
    readTime: number
  }
  const pages: Page[]
  export default pages
}

declare module 'virtual:content/styles' {
  // Side-effect import — injects runtime CSS
}
