/**
 * Algolia DocSearch plugin for Pagesmith.
 *
 * Injects the DocSearch CSS and JS into the page,
 * configured with the provided API key and index name.
 */

export interface AlgoliaOptions {
  appId: string
  apiKey: string
  indexName: string
  container?: string
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function escapeJs(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/</g, '\\x3c')
}

export function algoliaPlugin(options: AlgoliaOptions) {
  const container = escapeHtml(options.container ?? 'docsearch')
  const containerJs = escapeJs(options.container ?? 'docsearch')

  return {
    name: 'algolia',

    css: ['https://cdn.jsdelivr.net/npm/@docsearch/css@3'],
    runtime: ['https://cdn.jsdelivr.net/npm/@docsearch/js@3'],

    headHtml: `<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@docsearch/css@3" />`,

    searchHtml: `
      <div id="${container}"></div>
      <script src="https://cdn.jsdelivr.net/npm/@docsearch/js@3"></script>
      <script>
        docsearch({
          appId: '${escapeJs(options.appId)}',
          apiKey: '${escapeJs(options.apiKey)}',
          indexName: '${escapeJs(options.indexName)}',
          container: '#${containerJs}',
        });
      </script>
    `,
  }
}
