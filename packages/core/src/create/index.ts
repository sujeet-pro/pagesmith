/**
 * Project scaffolding for `pagesmith create`.
 *
 * Supports local templates (bundled) and remote templates (GitHub examples).
 */

import {
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  unlinkSync,
  writeFileSync,
} from 'fs'
import { join, resolve } from 'path'
import { execFileSync, execSync } from 'child_process'
import { tmpdir } from 'os'

const GITHUB_REPO = 'sujeet-pro/pagesmith'

function getPackageVersion(): string {
  try {
    const pkgPath = resolve(import.meta.dirname, '..', '..', 'package.json')
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8')) as { version?: string }
    return `^${pkg.version ?? '0.1.0'}`
  } catch {
    return '^0.1.0'
  }
}

export type Template = {
  name: string
  description: string
  source: 'local' | 'github'
  path: string
  dependency: '@pagesmith/core' | '@pagesmith/docs'
  scripts: Record<string, string>
}

export const templates: Template[] = [
  {
    name: 'docs',
    description: 'Documentation site with @pagesmith/docs',
    source: 'local',
    path: 'templates/docs',
    dependency: '@pagesmith/docs',
    scripts: {
      dev: 'pagesmith-docs dev',
      build: 'pagesmith-docs build',
      preview: 'pagesmith-docs preview',
    },
  },
  {
    name: 'blog',
    description: 'Blog with custom layouts using @pagesmith/core',
    source: 'github',
    path: 'examples/blog-site',
    dependency: '@pagesmith/core',
    scripts: { dev: 'vp dev', build: 'vp build', check: 'vp check' },
  },
  {
    name: 'react',
    description: 'React SSG site with react-router',
    source: 'github',
    path: 'examples/with-react',
    dependency: '@pagesmith/core',
    scripts: {
      dev: 'vp dev',
      build: 'vp build',
      check: 'vp check',
      preview: 'vp preview',
    },
  },
  {
    name: 'solid',
    description: 'SolidJS SSG site',
    source: 'github',
    path: 'examples/with-solid',
    dependency: '@pagesmith/core',
    scripts: {
      dev: 'vp dev',
      build: 'vp build',
      check: 'vp check',
      preview: 'vp preview',
    },
  },
  {
    name: 'svelte',
    description: 'Svelte SSG site',
    source: 'github',
    path: 'examples/with-svelte',
    dependency: '@pagesmith/core',
    scripts: {
      dev: 'vp dev',
      build: 'vp build',
      check: 'vp check',
      preview: 'vp preview',
    },
  },
  {
    name: 'ejs',
    description: 'Vanilla Node.js + EJS templates',
    source: 'github',
    path: 'examples/with-vanilla-ejs',
    dependency: '@pagesmith/core',
    scripts: {
      dev: 'vp dev',
      build: 'vp build',
      check: 'vp check',
    },
  },
  {
    name: 'hbs',
    description: 'Vanilla Node.js + Handlebars templates',
    source: 'github',
    path: 'examples/with-vanilla-hbs',
    dependency: '@pagesmith/core',
    scripts: {
      dev: 'vp dev',
      build: 'vp build',
      check: 'vp check',
    },
  },
]

export function listTemplates(): string {
  const maxName = Math.max(...templates.map((t) => t.name.length))
  return templates.map((t) => `  ${t.name.padEnd(maxName + 2)} ${t.description}`).join('\n')
}

async function downloadFromGithub(templatePath: string, destination: string): Promise<void> {
  const tarballUrl = `https://github.com/${GITHUB_REPO}/archive/refs/heads/main.tar.gz`
  console.log('Downloading template from GitHub...')

  const response = await fetch(tarballUrl, { redirect: 'follow' })
  if (!response.ok) {
    throw new Error(`Failed to download: ${response.status} ${response.statusText}`)
  }

  const tmpFile = join(tmpdir(), `pagesmith-${Date.now()}.tar.gz`)
  const tmpExtract = mkdtempSync(join(tmpdir(), 'pagesmith-'))

  try {
    writeFileSync(tmpFile, Buffer.from(await response.arrayBuffer()))

    // Extract full tarball
    execSync(`tar xzf ${tmpFile} -C ${tmpExtract}`, { stdio: 'pipe' })

    // Find the extracted top-level directory
    const dirs = readdirSync(tmpExtract)
    const topDir = dirs[0]
    if (!topDir) throw new Error('Empty tarball')

    const sourcePath = join(tmpExtract, topDir, templatePath)
    if (!existsSync(sourcePath)) {
      throw new Error(`Template path not found in repo: ${templatePath}`)
    }

    mkdirSync(destination, { recursive: true })
    cpSync(sourcePath, destination, { recursive: true })
  } finally {
    unlinkSync(tmpFile)
    rmSync(tmpExtract, { recursive: true, force: true })
  }
}

function adaptForStandalone(destination: string, template: Template): void {
  // Update content.config.mjs paths (from ./posts to ./content/posts)
  const configPath = join(destination, 'content.config.mjs')
  if (existsSync(configPath)) {
    let config = readFileSync(configPath, 'utf-8')
    config = config.replace(/directory: '\.\/posts'/g, "directory: './content/posts'")
    config = config.replace(/directory: '\.\/pages'/g, "directory: './content/pages'")
    config = config.replace(/directory: '\.\/authors'/g, "directory: './content/authors'")
    config = config.replace(/directory: '\.\/config'/g, "directory: './content/config'")
    writeFileSync(configPath, config)
  }

  // Update vite.config.ts shared-content references
  const viteConfigPath = join(destination, 'vite.config.ts')
  if (existsSync(viteConfigPath)) {
    let config = readFileSync(viteConfigPath, 'utf-8')
    config = config.replace(
      /import content from '\.\.\/shared-content\/content\.config'/g,
      "import content from './content.config.mjs'",
    )
    config = config.replace(
      /configPath:\s*'\.\.\/shared-content\/content\.config\.ts'/g,
      "configPath: './content.config.mjs'",
    )
    config = config.replace(
      /root:\s*resolve\(import\.meta\.dirname,\s*'\.\.\/shared-content'\)/g,
      'root: import.meta.dirname',
    )
    writeFileSync(viteConfigPath, config)
  }

  // Update build.mjs (remove shared-content references)
  const buildPath = join(destination, 'build.mjs')
  if (existsSync(buildPath)) {
    let script = readFileSync(buildPath, 'utf-8')
    // Replace shared-content imports
    script = script.replace(
      /import .* from '\.\.\/shared-content\/content\.config\.mjs'/g,
      "import content from './content.config.mjs'",
    )
    // Simplify content layer setup
    script = script.replace(
      /const contentRoot = resolve\(root, '\.\.\/shared-content'\)/g,
      'const contentRoot = root',
    )
    // Fix named imports
    script = script.replace(
      /import \{ pages, posts \} from '\.\.\/shared-content\/content\.config\.mjs'/g,
      "import content from './content.config.mjs'\nconst { pages, posts } = content",
    )
    writeFileSync(buildPath, script)
  }

  // Remove workspace-specific tsconfig paths
  const tsconfigPath = join(destination, 'tsconfig.json')
  if (existsSync(tsconfigPath)) {
    const tsconfig = JSON.parse(readFileSync(tsconfigPath, 'utf-8'))
    if (tsconfig.compilerOptions?.paths) {
      delete tsconfig.compilerOptions.paths
    }
    writeFileSync(tsconfigPath, JSON.stringify(tsconfig, null, 2) + '\n')
  }
}

function writePackageJson(destination: string, projectName: string, template: Template): void {
  const existingPkg = join(destination, 'package.json')
  let pkg: Record<string, any> = {}

  if (existsSync(existingPkg)) {
    pkg = JSON.parse(readFileSync(existingPkg, 'utf-8'))
  }

  pkg.name = projectName
  pkg.private = true
  pkg.type = 'module'
  pkg.version = '0.0.0'
  pkg.scripts = template.scripts

  // Replace workspace "*" deps with actual versions
  if (pkg.dependencies) {
    for (const [name, version] of Object.entries(pkg.dependencies)) {
      if (version === '*' && name.startsWith('@pagesmith/')) {
        pkg.dependencies[name] = getPackageVersion()
      }
    }
  }

  // Ensure the primary dependency is present
  pkg.dependencies = pkg.dependencies ?? {}
  pkg.dependencies[template.dependency] = getPackageVersion()

  // Keep Vite+ in standalone examples that already use it
  if (pkg.devDependencies?.vite && !pkg.devDependencies['vite-plus']) {
    pkg.devDependencies['vite-plus'] = '^0.1.13'
  }

  try {
    const npmVersion = execFileSync('npm', ['--version'], { encoding: 'utf-8' }).trim()
    pkg.packageManager = `npm@${npmVersion}`
  } catch {
    // Omit packageManager if npm version cannot be detected
  }

  writeFileSync(existingPkg, JSON.stringify(pkg, null, 2) + '\n')
}

export async function createProject(projectName: string, templateName: string): Promise<void> {
  const template = templates.find((t) => t.name === templateName)
  if (!template) {
    throw new Error(`Unknown template "${templateName}". Available templates:\n${listTemplates()}`)
  }

  const destination = resolve(projectName)
  if (existsSync(destination) && readdirSync(destination).length > 0) {
    throw new Error(`Directory "${projectName}" already exists and is not empty.`)
  }

  if (template.source === 'local') {
    const templateDir = resolve(
      import.meta.dirname,
      '../../templates',
      template.path.split('/').pop()!,
    )
    mkdirSync(destination, { recursive: true })
    cpSync(templateDir, destination, { recursive: true })
  } else {
    await downloadFromGithub(template.path, destination)
    adaptForStandalone(destination, template)
  }

  writePackageJson(destination, projectName, template)

  console.log(`\nCreated "${projectName}" from the "${template.name}" template.\n`)
  console.log('Next steps:')
  console.log(`  cd ${projectName}`)
  console.log('  vp install')
  if (template.scripts.dev) {
    console.log(`  vp run dev`)
  } else {
    console.log(`  vp run build`)
  }
  console.log()
}
