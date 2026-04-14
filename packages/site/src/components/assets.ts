export type SiteComponentAssetBundle = {
  css: string[]
  js: string[]
}

export type SiteAssetAwareComponent<T> = T & {
  assets: SiteComponentAssetBundle
}

export const SITE_CONTENT_ASSETS: SiteComponentAssetBundle = {
  css: ['@pagesmith/site/css/content'],
  js: ['@pagesmith/site/runtime/content'],
}

export const SITE_CHROME_ASSETS: SiteComponentAssetBundle = {
  css: ['@pagesmith/site/css/chrome'],
  js: ['@pagesmith/site/runtime/chrome'],
}

export const SITE_STANDALONE_ASSETS: SiteComponentAssetBundle = {
  css: ['@pagesmith/site/css/standalone'],
  js: ['@pagesmith/site/runtime/standalone'],
}

export function withComponentAssets<T extends object>(
  component: T,
  assets: SiteComponentAssetBundle,
): SiteAssetAwareComponent<T> {
  return Object.assign(component, { assets })
}
