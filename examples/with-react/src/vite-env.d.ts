/// <reference types="vite-plus/client" />

declare module 'virtual:content/posts' {
  interface Post {
    slug: string
    data: {
      title: string
      description: string
      date: string
      tags: string[]
      author?: string
      draft: boolean
      readTime: number
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
    data: {
      name: string
      bio: string
      avatar?: string
    }
  }
  const authors: Author[]
  export default authors
}

declare module 'virtual:content/pages' {
  interface Page {
    slug: string
    data: {
      title: string
      description: string
    }
    html: string
    headings: { depth: number; text: string; id: string }[]
  }
  const pages: Page[]
  export default pages
}

declare module 'virtual:content/styles' {
  const css: string
  export default css
}
