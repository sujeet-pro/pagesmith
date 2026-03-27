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
import { execSync } from 'child_process'
import { tmpdir } from 'os'

const GITHUB_REPO = 'sujeet-pro/pagesmith'
const PACKAGE_VERSION = '^0.1.0'

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
    scripts: { dev: 'pagesmith dev', build: 'pagesmith build', preview: 'pagesmith preview' },
  },
  {
    name: 'blog',
    description: 'Blog with custom layouts using @pagesmith/core',
    source: 'github',
    path: 'examples/blog-site',
    dependency: '@pagesmith/core',
    scripts: { dev: 'pagesmith dev', build: 'pagesmith build', preview: 'pagesmith preview' },
  },
  {
    name: 'react',
    description: 'React SSG site with react-router',
    source: 'github',
    path: 'examples/with-react',
    dependency: '@pagesmith/core',
    scripts: {
      dev: 'vite dev',
      build: 'node --experimental-strip-types build.ts',
      preview: 'vite preview',
    },
  },
  {
    name: 'solid',
    description: 'SolidJS SSG site',
    source: 'github',
    path: 'examples/with-solid',
    dependency: '@pagesmith/core',
    scripts: {
      dev: 'vite dev',
      build: 'node --experimental-strip-types build.ts',
      preview: 'vite preview',
    },
  },
  {
    name: 'svelte',
    description: 'Svelte SSG site',
    source: 'github',
    path: 'examples/with-svelte',
    dependency: '@pagesmith/core',
    scripts: {
      dev: 'vite dev',
      build: 'node --experimental-strip-types build.ts',
      preview: 'vite preview',
    },
  },
  {
    name: 'ejs',
    description: 'Vanilla Node.js + EJS templates',
    source: 'github',
    path: 'examples/with-vanilla-ejs',
    dependency: '@pagesmith/core',
    scripts: {
      build: 'node --experimental-strip-types build.ts',
    },
  },
  {
    name: 'hbs',
    description: 'Vanilla Node.js + Handlebars templates',
    source: 'github',
    path: 'examples/with-vanilla-hbs',
    dependency: '@pagesmith/core',
    scripts: {
      build: 'node --experimental-strip-types build.ts',
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

    // Also copy shared-content for framework examples
    const sharedContentPath = join(tmpExtract, topDir, 'examples/shared-content')
    if (existsSync(sharedContentPath) && templatePath.startsWith('examples/with-')) {
      const contentDest = join(destination, 'content')
      mkdirSync(contentDest, { recursive: true })

      // Copy markdown/data files from shared-content
      for (const subDir of ['posts', 'pages', 'authors']) {
        const srcDir = join(sharedContentPath, subDir)
        if (existsSync(srcDir)) {
          cpSync(srcDir, join(contentDest, subDir), { recursive: true })
        }
      }

      // Copy content config
      const configSrc = join(sharedContentPath, 'content.config.ts')
      if (existsSync(configSrc)) {
        cpSync(configSrc, join(destination, 'content.config.ts'))
      }
    }
  } finally {
    unlinkSync(tmpFile)
    rmSync(tmpExtract, { recursive: true, force: true })
  }
}

function adaptForStandalone(destination: string, template: Template): void {
  // Update content.config.ts paths (from ./posts to ./content/posts)
  const configPath = join(destination, 'content.config.ts')
  if (existsSync(configPath)) {
    let config = readFileSync(configPath, 'utf-8')
    config = config.replace(/directory: '\.\/posts'/g, "directory: './content/posts'")
    config = config.replace(/directory: '\.\/pages'/g, "directory: './content/pages'")
    config = config.replace(/directory: '\.\/authors'/g, "directory: './content/authors'")
    config = config.replace(/directory: '\.\/config'/g, "directory: './content/config'")
    writeFileSync(configPath, config)
  }

  // Update vite.config.ts (remove shared-content references)
  const viteConfigPath = join(destination, 'vite.config.ts')
  if (existsSync(viteConfigPath)) {
    let config = readFileSync(viteConfigPath, 'utf-8')
    // Replace shared-content import with local import
    config = config.replace(
      /import content from '\.\.\/shared-content\/content\.config'/g,
      "import content from './content.config'",
    )
    // Remove root and configPath overrides
    config = config.replace(/\s*root:.*shared-content.*,?\n?/g, '\n')
    config = config.replace(/\s*configPath:.*shared-content.*,?\n?/g, '\n')
    writeFileSync(viteConfigPath, config)
  }

  // Update build.ts (remove shared-content references)
  const buildPath = join(destination, 'build.ts')
  if (existsSync(buildPath)) {
    let script = readFileSync(buildPath, 'utf-8')
    // Replace shared-content imports
    script = script.replace(
      /import .* from '\.\.\/shared-content\/content\.config\.ts'/g,
      "import content from './content.config.ts'",
    )
    // Simplify content layer setup
    script = script.replace(
      /const contentRoot = resolve\(root, '\.\.\/shared-content'\)/g,
      'const contentRoot = root',
    )
    // Fix named imports
    script = script.replace(
      /import \{ pages, posts \} from '\.\.\/shared-content\/content\.config\.ts'/g,
      "import content from './content.config.ts'\nconst { pages, posts } = content",
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
        pkg.dependencies[name] = PACKAGE_VERSION
      }
    }
  }

  // Ensure the primary dependency is present
  pkg.dependencies = pkg.dependencies ?? {}
  pkg.dependencies[template.dependency] = PACKAGE_VERSION

  // Remove workspace-specific dev dependencies
  if (pkg.devDependencies) {
    delete pkg.devDependencies['vite-plus']
    // Replace vite alias with standard vite
    if (pkg.devDependencies.vite?.startsWith('npm:')) {
      pkg.devDependencies.vite = '^6.0.0'
    }
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
  console.log('  npm install')
  if (template.scripts.dev) {
    console.log(`  npm run dev`)
  } else {
    console.log(`  npm run build`)
  }
  console.log()
}
