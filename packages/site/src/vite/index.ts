import {
  pagesmithContent as corePagesmithContent,
  type BaseContentModuleEntry,
  type ContentCollectionModule,
  type ContentModuleMap,
  type DataContentModuleEntry,
  type MarkdownContentModuleEntry,
  type PagesmithContentPluginOptions as CorePagesmithContentPluginOptions,
  type PagesmithVitePlugin,
} from "@pagesmith/core/vite";
import type { CollectionMap } from "../schemas/index.js";

export type {
  BaseContentModuleEntry,
  ContentCollectionModule,
  ContentModuleMap,
  DataContentModuleEntry,
  MarkdownContentModuleEntry,
  PagesmithVitePlugin,
} from "@pagesmith/core/vite";
export type PagesmithContentPluginOptions<TCollections extends CollectionMap> = Omit<
  CorePagesmithContentPluginOptions<TCollections>,
  "dtsImportSource"
>;

export function pagesmithContent<TCollections extends CollectionMap>(
  collections: TCollections,
  options?: Omit<PagesmithContentPluginOptions<TCollections>, "collections">,
): PagesmithVitePlugin;
export function pagesmithContent<TCollections extends CollectionMap>(
  options: PagesmithContentPluginOptions<TCollections>,
): PagesmithVitePlugin;
export function pagesmithContent<TCollections extends CollectionMap>(
  collectionsOrOptions: TCollections | PagesmithContentPluginOptions<TCollections>,
  maybeOptions: Omit<PagesmithContentPluginOptions<TCollections>, "collections"> = {},
): PagesmithVitePlugin {
  if ("collections" in collectionsOrOptions) {
    return corePagesmithContent({
      ...collectionsOrOptions,
      dtsImportSource: "@pagesmith/site/vite",
    } as CorePagesmithContentPluginOptions<TCollections>);
  }

  return corePagesmithContent(collectionsOrOptions, {
    ...maybeOptions,
    dtsImportSource: "@pagesmith/site/vite",
  } as Omit<CorePagesmithContentPluginOptions<TCollections>, "collections">);
}

export { prerenderRoutes } from "./ssg";
export type { PrerenderOptions } from "./ssg";
export { sharedAssetsPlugin } from "./shared-assets.js";
export { pagesmithSsg } from "./ssg-plugin.js";
export type { SsgPluginOptions, SsgRenderConfig } from "./ssg-plugin.js";
export { pagesmithSite } from "./site-plugin.js";
export type { PagesmithSitePluginOptions } from "./site-plugin.js";
export type { ContentAssetMap } from "../assets/index.js";
