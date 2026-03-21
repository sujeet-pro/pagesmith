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

export function algoliaPlugin(options: AlgoliaOptions,) {
  return {
    name: 'algolia',

    css: ['https://cdn.jsdelivr.net/npm/@docsearch/css@3',],
    runtime: ['https://cdn.jsdelivr.net/npm/@docsearch/js@3',],

    headHtml: `<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@docsearch/css@3" />`,

    searchHtml: `
      <div id="${options.container ?? 'docsearch'}"></div>
      <script src="https://cdn.jsdelivr.net/npm/@docsearch/js@3"></script>
      <script>
        docsearch({
          appId: '${options.appId}',
          apiKey: '${options.apiKey}',
          indexName: '${options.indexName}',
          container: '#${options.container ?? 'docsearch'}',
        });
      </script>
    `,
  }
}
