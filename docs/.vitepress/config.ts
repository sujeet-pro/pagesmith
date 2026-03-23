import { defineConfig } from 'vitepress'

const base = process.env.BASE_URL || process.env.DOCS_BASE || '/pagesmith/docs/'

export default defineConfig({
  base,
  title: 'Pagesmith',
  description:
    'File-based CMS with typed collections, diagramkit-powered diagrams, and AI-ready install flows.',
  lastUpdated: true,
  themeConfig: {
    nav: [
      { text: 'Guide', link: '/guide/getting-started' },
      { text: 'Reference', link: '/reference/api' },
      { text: 'AI', link: '/guide/ai-assistants' },
      { text: 'Architecture', link: '/reference/architecture' },
    ],
    sidebar: {
      '/guide/': [
        { text: 'Getting Started', link: '/guide/getting-started' },
        { text: 'Collections and Loaders', link: '/guide/collections-and-loaders' },
        { text: 'Validation and Rendering', link: '/guide/validation-and-rendering' },
        { text: 'Diagramkit Integration', link: '/guide/diagramkit' },
        { text: 'AI Assistants', link: '/guide/ai-assistants' },
        { text: 'Examples', link: '/guide/examples' },
      ],
      '/reference/': [
        { text: 'API', link: '/reference/api' },
        { text: 'Configuration', link: '/reference/configuration' },
        { text: 'Runtime', link: '/reference/runtime' },
        { text: 'Architecture', link: '/reference/architecture' },
      ],
    },
    outline: 'deep',
  },
})
