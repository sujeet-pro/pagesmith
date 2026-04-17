import type { Command } from 'cac'
import { existsSync } from 'fs'
import { resolve } from 'path'
import {
  formatContentValidationReport,
  validateContent,
} from '../../validation/content-validator.js'
import { CliError } from '../../cli-kit/index.js'

type ValidateOpts = {
  root?: string
  basePath?: string
  include?: string | string[]
  exclude?: string | string[]
  checkExternal?: boolean
  timeoutMs?: number
  concurrency?: number
  showClean?: boolean
}

function normalize(input: string | string[] | undefined): string[] | undefined {
  if (!input) return undefined
  return Array.isArray(input) ? input : [input]
}

export function registerValidateCommand(command: Command): Command {
  return command
    .option(
      '--root <path>',
      'Content root for resolving absolute-path links (default: the provided content-dir)',
    )
    .option('--base-path <path>', 'Site base path (e.g. /pagesmith)')
    .option('--include <glob>', 'Include pattern (repeatable, default: **/*.md, **/*.mdx)')
    .option('--exclude <glob>', 'Exclude pattern (repeatable)')
    .option('--check-external', 'Fetch external URLs and report non-2xx as warnings')
    .option('--timeout-ms <number>', 'Fetch timeout (default: 10000)')
    .option('--concurrency <number>', 'Fetch concurrency (default: 8)')
    .option('--show-clean', 'Also list files that pass validation')
    .action(async (contentDirInput: string | undefined, options: ValidateOpts) => {
      if (!contentDirInput) {
        throw new CliError('pagesmith-core validate requires a content directory.', {
          hint: 'Example: pagesmith-core validate ./docs',
        })
      }
      const contentDir = resolve(contentDirInput)
      if (!existsSync(contentDir)) {
        throw new CliError(`Content directory not found: ${contentDir}`)
      }
      const rootDir = options.root ? resolve(options.root) : contentDir

      const summary = await validateContent({
        contentDir,
        include: normalize(options.include),
        exclude: normalize(options.exclude),
        linkValidator: {
          rootDir,
          basePath: options.basePath,
          checkExternalReachability: options.checkExternal,
          fetchTimeoutMs: options.timeoutMs,
          fetchConcurrency: options.concurrency,
        },
      })

      console.log(formatContentValidationReport(summary, { showClean: options.showClean }))
      if (summary.errors > 0) process.exit(1)
    })
}
