/**
 * Convenience super-plugin that wires `pagesmithContent`, `pagesmithSsg`, and
 * `sharedAssetsPlugin` with sensible defaults. Use this when bootstrapping a
 * new Pagesmith site; drop down to the individual plugins when you need edge-
 * case control.
 *
 * @example
 * ```ts
 * import { defineConfig } from 'vite'
 * import { pagesmithSite } from '@pagesmith/site/vite'
 * import collections from './content.config'
 *
 * export default defineConfig({
 *   plugins: [pagesmithSite({ collections, entry: './src/entry-server.tsx' })],
 * })
 * ```
 */

import type { Plugin } from "vite";
import type { CollectionMap } from "../schemas/index.js";
import { pagesmithContent, type PagesmithContentPluginOptions } from "./index.js";
import { pagesmithSsg, type SsgPluginOptions } from "./ssg-plugin.js";
import { sharedAssetsPlugin } from "./shared-assets.js";

export type PagesmithSitePluginOptions<TCollections extends CollectionMap> = {
  /** Content collections — same shape as `pagesmithContent`. */
  collections: TCollections;
  /** Additional options forwarded to `pagesmithContent`. */
  content?: Omit<PagesmithContentPluginOptions<TCollections>, "collections">;
  /**
   * SSG options. Pass `false` to skip the SSG plugin when embedding Pagesmith
   * inside a framework that owns its own build (e.g. Next.js).
   */
  ssg?: SsgPluginOptions | false;
  /** Disable the shared fonts/assets dev middleware (default: false). */
  disableSharedAssets?: boolean;
};

export function pagesmithSite<TCollections extends CollectionMap>(
  options: PagesmithSitePluginOptions<TCollections>,
): Plugin[] {
  const plugins: Plugin[] = [];

  plugins.push(
    pagesmithContent({
      collections: options.collections,
      ...(options.content ?? {}),
    } as PagesmithContentPluginOptions<TCollections>) as unknown as Plugin,
  );

  if (options.ssg !== false) {
    const ssgOptions = options.ssg ?? { entry: "./src/entry-server.tsx" };
    // `pagesmithSsg` returns a Plugin[] (dev middleware, build hook, preview); spread it in.
    plugins.push(...pagesmithSsg(ssgOptions));
  }

  if (!options.disableSharedAssets) {
    plugins.push(sharedAssetsPlugin());
  }

  return plugins;
}
