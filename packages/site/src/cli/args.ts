export type ServerCliArgs = {
  port?: number
  config?: string
  open?: boolean
  outDir?: string
  basePath?: string
  logLevel?: 'silent' | 'error' | 'warn' | 'info' | 'verbose'
  _help?: boolean
}

export type BuildCliArgs = {
  config?: string
  outDir?: string
  basePath?: string
  _help?: boolean
}

function parseLogLevel(input: string): ServerCliArgs['logLevel'] {
  const normalized = input.trim().toLowerCase()
  if (normalized === 'silent') return 'silent'
  if (normalized === 'error' || normalized === 'errors') return 'error'
  if (normalized === 'warn' || normalized === 'warning' || normalized === 'warnings') return 'warn'
  if (normalized === 'info' || normalized === 'log') return 'info'
  if (normalized === 'verbose' || normalized === 'debug') return 'verbose'
  throw new Error(`--log-level must be one of: silent, error, warn, info, verbose (got "${input}")`)
}

export function parseServerArgs(argv: string[]): ServerCliArgs {
  const args: ServerCliArgs = {}

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index]!

    if (arg === '--help' || arg === '-h') {
      return { ...args, _help: true } as ServerCliArgs & { _help: true }
    }

    if (arg === '--port' || arg === '-p') {
      const value = argv[++index]
      if (!value) throw new Error('--port requires a number')
      args.port = parseInt(value, 10)
      if (Number.isNaN(args.port)) throw new Error('--port must be a valid number')
      if (args.port < 1 || args.port > 65535) throw new Error('--port must be between 1 and 65535')
      continue
    }

    if (arg.startsWith('--port=')) {
      const value = arg.slice('--port='.length)
      if (!value) throw new Error('--port= requires a number')
      args.port = parseInt(value, 10)
      if (Number.isNaN(args.port)) throw new Error('--port must be a valid number')
      if (args.port < 1 || args.port > 65535) throw new Error('--port must be between 1 and 65535')
      continue
    }

    if (arg === '--config') {
      const value = argv[++index]
      if (!value) throw new Error('--config requires a path')
      args.config = value
      continue
    }

    if (arg === '--open') {
      args.open = true
      continue
    }

    if (arg === '--out-dir') {
      const value = argv[++index]
      if (!value) throw new Error('--out-dir requires a path')
      args.outDir = value
      continue
    }

    if (arg === '--base-path') {
      const value = argv[++index]
      if (!value) throw new Error('--base-path requires a value')
      args.basePath = value
      continue
    }

    if (arg === '--log-level') {
      const value = argv[++index]
      if (!value) throw new Error('--log-level requires a value')
      args.logLevel = parseLogLevel(value)
      continue
    }

    if (arg.startsWith('-')) {
      throw new Error(`Unknown option: ${arg}. Run 'pagesmith-site --help' for usage.`)
    }
  }

  return args
}

export function parseBuildArgs(argv: string[]): BuildCliArgs {
  const args: BuildCliArgs = {}

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index]!

    if (arg === '--help' || arg === '-h') {
      return { ...args, _help: true } as BuildCliArgs & { _help: true }
    }

    if (arg === '--config') {
      const value = argv[++index]
      if (!value) throw new Error('--config requires a path')
      args.config = value
      continue
    }

    if (arg === '--out-dir') {
      const value = argv[++index]
      if (!value) throw new Error('--out-dir requires a path')
      args.outDir = value
      continue
    }

    if (arg === '--base-path') {
      const value = argv[++index]
      if (!value) throw new Error('--base-path requires a value')
      args.basePath = value
      continue
    }

    if (arg.startsWith('-')) {
      throw new Error(`Unknown option: ${arg}. Run 'pagesmith-site --help' for usage.`)
    }
  }

  return args
}
