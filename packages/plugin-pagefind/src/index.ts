/**
 * Pagefind search plugin for Pagesmith.
 *
 * Runs `pagefind --site <outDir>` after build to generate
 * a search index in the output directory.
 */

import type { SearchPlugin, } from './types'

export interface PagefindOptions {
  /** Path to the pagefind binary (default: "pagefind") */
  binary?: string
}

export function pagefindPlugin(options?: PagefindOptions,): SearchPlugin {
  return {
    name: 'pagefind',

    async afterBuild(ctx,) {
      const { execSync, } = await import('child_process',)
      const binary = options?.binary ?? 'pagefind'

      try {
        execSync(`${binary} --site "${ctx.outDir}"`, { stdio: 'inherit', },)
      } catch (err: any) {
        console.warn(`Pagefind indexing failed: ${err.message}`,)
      }
    },

    headHtml: `<link href="/pagefind/pagefind-ui.css" rel="stylesheet">`,

    searchHtml: `
      <div id="search"></div>
      <script src="/pagefind/pagefind-ui.js"></script>
      <script>
        new PagefindUI({ element: "#search", showSubResults: true });
      </script>
    `,
  }
}
