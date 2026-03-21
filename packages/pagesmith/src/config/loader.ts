/**
 * Configuration loader.
 *
 * Reads and validates content/site.json5, content/<type>/meta.json5,
 * and content/redirects.json5.
 */

import { existsSync, readFileSync, } from 'fs'
import JSON5 from 'json5'
import { join, } from 'path'
import type { PageTypeMeta, RedirectsConfig, SiteConfig, } from '../../schemas'

export function loadSiteConfig(contentDir: string,): SiteConfig {
  const path = join(contentDir, 'site.json5',)
  if (!existsSync(path,)) {
    throw new Error(`Site config not found: ${path}`,)
  }
  return JSON5.parse(readFileSync(path, 'utf-8',),)
}

export function loadPageTypeMeta(contentDir: string, pageType: string,): PageTypeMeta {
  const path = join(contentDir, pageType, 'meta.json5',)
  if (!existsSync(path,)) {
    throw new Error(`Page type meta not found: ${path}`,)
  }
  return JSON5.parse(readFileSync(path, 'utf-8',),)
}

export function loadRedirects(contentDir: string,): RedirectsConfig {
  const path = join(contentDir, 'redirects.json5',)
  if (!existsSync(path,)) {
    return { vanity: [], redirects: [], }
  }
  return JSON5.parse(readFileSync(path, 'utf-8',),)
}

export function loadAllPageTypeMetas(
  contentDir: string,
  pageTypes: string[],
): Map<string, PageTypeMeta> {
  const metas = new Map<string, PageTypeMeta>()
  for (const type of pageTypes) {
    metas.set(type, loadPageTypeMeta(contentDir, type,),)
  }
  return metas
}
