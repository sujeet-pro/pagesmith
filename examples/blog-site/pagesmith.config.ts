/** Blog site config — uses SSG-specific fields not in ContentLayerConfig */
export default {
  contentDir: './content',
  outDir: '../../gh-pages/examples/blog-site',
  basePath: '/pagesmith/examples/blog-site',
  css: {
    entries: ['./styles/main.css'],
    minify: true,
  },
  runtime: {
    entries: ['./runtime/main.ts'],
    minify: true,
  },
  layouts: {
    Article: () => import('./layouts/Article.tsx'),
    Blog: () => import('./layouts/Blog.tsx'),
    Home: () => import('./layouts/Home.tsx'),
    Listing: () => import('./layouts/Listing.tsx'),
    NotFound: () => import('./layouts/NotFound.tsx'),
    Page: () => import('./layouts/Page.tsx'),
    Project: () => import('./layouts/Project.tsx'),
    TagIndex: () => import('./layouts/TagIndex.tsx'),
    TagListing: () => import('./layouts/TagListing.tsx'),
  },
}
