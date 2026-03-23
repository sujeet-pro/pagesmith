/** Default configuration values for Pagesmith. */
export const DEFAULTS = {
  contentDir: './content',
  layoutsDir: './layouts',
  stylesDir: './styles',
  publicDir: './public',
  outDir: './dist',
  css: {
    entries: ['./styles/main.css'],
    minify: true,
  },
  runtime: {
    entries: ['./runtime/main.ts'],
    target: 'browser' as const,
    minify: true,
  },
  generators: {
    tagListingLayout: 'TagListing',
    tagIndexLayout: 'TagIndex',
    notFoundLayout: 'NotFound',
  },
  parallel: false,
} as const
