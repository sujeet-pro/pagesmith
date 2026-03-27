import { bundle } from 'lightningcss'
import { resolve } from 'path'

export function buildCss(entryPath: string, config?: { minify?: boolean }): string {
  const { code } = bundle({
    filename: resolve(entryPath),
    minify: config?.minify ?? true,
    targets: {
      chrome: 123 << 16,
      firefox: 120 << 16,
      safari: 18 << 16,
    },
  })
  return new TextDecoder().decode(code)
}
