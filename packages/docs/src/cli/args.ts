export type ServerCliArgs = {
  port?: number
  config?: string
  open?: boolean
  outDir?: string
  basePath?: string
  logLevel?: 'silent' | 'error' | 'warn' | 'info' | 'verbose'
  _help?: boolean
}

export type InitCliArgs = {
  ai?: boolean
  config?: string
  name?: string
  title?: string
  origin?: string
  basePath?: string
  contentDir?: string
  search?: boolean
  starterContent?: boolean
  yes?: boolean
  noLlms?: boolean
  _help?: boolean
}

export type McpCliArgs = {
  config?: string
  root?: string
  stdio?: boolean
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

export type BuildCliArgs = {
  config?: string
  outDir?: string
  basePath?: string
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
      throw new Error(`Unknown option: ${arg}. Run 'pagesmith --help' for usage.`)
    }
  }

  return args
}

export function parseBuildArgs(argv: string[]): BuildCliArgs & { _help?: boolean } {
  const args: BuildCliArgs & { _help?: boolean } = {}

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index]!

    if (arg === '--help' || arg === '-h') {
      return { ...args, _help: true }
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
      throw new Error(`Unknown option: ${arg}. Run 'pagesmith --help' for usage.`)
    }
  }

  return args
}

export function parseInitArgs(argv: string[]): InitCliArgs {
  const args: InitCliArgs = {}

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index]!

    if (arg === '--help' || arg === '-h') {
      return { ...args, _help: true }
    }

    if (arg === '--ai') {
      args.ai = true
      continue
    }

    if (arg === '--yes' || arg === '-y') {
      args.yes = true
      continue
    }

    if (arg === '--config') {
      const value = argv[++index]
      if (!value) throw new Error('--config requires a path')
      args.config = value
      continue
    }

    if (arg === '--name') {
      const value = argv[++index]
      if (!value) throw new Error('--name requires a value')
      args.name = value
      continue
    }

    if (arg === '--title') {
      const value = argv[++index]
      if (!value) throw new Error('--title requires a value')
      args.title = value
      continue
    }

    if (arg === '--origin') {
      const value = argv[++index]
      if (!value) throw new Error('--origin requires a value')
      args.origin = value
      continue
    }

    if (arg === '--base-path') {
      const value = argv[++index]
      if (!value) throw new Error('--base-path requires a value')
      args.basePath = value
      continue
    }

    if (arg === '--content-dir') {
      const value = argv[++index]
      if (!value) throw new Error('--content-dir requires a path')
      args.contentDir = value
      continue
    }

    if (arg === '--search') {
      args.search = true
      continue
    }

    if (arg === '--no-search') {
      args.search = false
      continue
    }

    if (arg === '--starter-content') {
      args.starterContent = true
      continue
    }

    if (arg === '--no-starter-content') {
      args.starterContent = false
      continue
    }

    if (arg === '--no-llms') {
      args.noLlms = true
      continue
    }

    if (arg.startsWith('-')) {
      throw new Error(`Unknown option: ${arg}. Run 'pagesmith --help' for usage.`)
    }
  }

  return args
}

export function parseMcpArgs(argv: string[]): McpCliArgs {
  const args: McpCliArgs = { stdio: true }

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index]!

    if (arg === '--help' || arg === '-h') {
      return { ...args, _help: true }
    }

    if (arg === '--config') {
      const value = argv[++index]
      if (!value) throw new Error('--config requires a path')
      args.config = value
      continue
    }

    if (arg === '--root') {
      const value = argv[++index]
      if (!value) throw new Error('--root requires a path')
      args.root = value
      continue
    }

    if (arg === '--stdio') {
      args.stdio = true
      continue
    }

    if (arg.startsWith('-')) {
      throw new Error(`Unknown option: ${arg}. Run 'pagesmith --help' for usage.`)
    }
  }

  return args
}
