/**
 * Plugin registration and execution.
 */

import type { ContentPlugin } from '../schemas/config'

/** Collect all remark plugins from content plugins. */
export function collectRemarkPlugins(plugins: ContentPlugin[]): any[] {
  return plugins.filter((p) => p.remarkPlugin).map((p) => p.remarkPlugin!)
}

/** Collect all rehype plugins from content plugins. */
export function collectRehypePlugins(plugins: ContentPlugin[]): any[] {
  return plugins.filter((p) => p.rehypePlugin).map((p) => p.rehypePlugin!)
}

/** Run all plugin validators against an entry. */
export function runPluginValidators(
  plugins: ContentPlugin[],
  entry: { data: Record<string, any>; content?: string },
): string[] {
  const issues: string[] = []
  for (const plugin of plugins) {
    if (plugin.validate) {
      issues.push(...plugin.validate(entry))
    }
  }
  return issues
}

export type { ContentPlugin } from '../schemas/config'
