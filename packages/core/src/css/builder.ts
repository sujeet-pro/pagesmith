import { bundle } from 'lightningcss'
import { resolve } from 'path'

export type CssBuildOptions = {
  minify?: boolean
  targets?: {
    chrome?: number
    firefox?: number
    safari?: number
  }
}

export function buildCss(entryPath: string, config?: CssBuildOptions): string {
  const targets = config?.targets ?? {}
  const { code } = bundle({
    filename: resolve(entryPath),
    minify: config?.minify ?? true,
    targets: {
      chrome: (targets.chrome ?? 123) << 16,
      firefox: (targets.firefox ?? 120) << 16,
      safari: (targets.safari ?? 18) << 16,
    },
  })
  return new TextDecoder().decode(code)
}
