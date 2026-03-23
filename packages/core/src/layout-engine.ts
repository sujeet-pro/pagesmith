import type { HtmlString } from './jsx-runtime'
import type { Heading } from './schemas/heading'

/**
 * Props passed to core layout functions.
 *
 * This is the minimal prop set for standalone layouts.
 * The site builder extends this with GlobalIndex, series nav, etc.
 */
export type CoreLayoutProps = {
  content: string
  frontmatter: Record<string, any>
  headings: Heading[]
  [key: string]: any
}

/**
 * Apply a layout function to content props.
 *
 * Calls the layout function and returns the resulting HTML string.
 * This is the "core" render — no GlobalIndex, no series nav, no site config.
 */
export function applyLayout(
  layoutFn: (props: CoreLayoutProps) => HtmlString,
  props: CoreLayoutProps,
): string {
  const result = layoutFn(props)
  return result.toString()
}
