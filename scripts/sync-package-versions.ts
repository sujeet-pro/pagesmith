#!/usr/bin/env -S node --strip-types --no-warnings

import { readFileSync, writeFileSync } from 'fs'
import { join } from 'path'

type PackageJson = {
  name?: string
  version?: string
  dependencies?: Record<string, string>
  devDependencies?: Record<string, string>
  optionalDependencies?: Record<string, string>
  peerDependencies?: Record<string, string>
}

const PUBLIC_PACKAGES = [
  { name: '@pagesmith/core', dir: 'packages/core' },
  { name: '@pagesmith/site', dir: 'packages/site' },
  { name: '@pagesmith/docs', dir: 'packages/docs' },
] as const

const INTERNAL_DEP_FIELDS = [
  'dependencies',
  'devDependencies',
  'optionalDependencies',
  'peerDependencies',
] as const

const VERSION_PATTERN = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/

function readJson(path: string): PackageJson {
  return JSON.parse(readFileSync(path, 'utf-8')) as PackageJson
}

function writeJson(path: string, value: PackageJson): void {
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`)
}

function syncDependencyField(
  pkg: PackageJson,
  field: (typeof INTERNAL_DEP_FIELDS)[number],
  targetVersion: string,
  packageName: string,
): boolean {
  const deps = pkg[field]
  if (!deps || !(packageName in deps)) return false
  if (deps[packageName] === targetVersion) return false
  deps[packageName] = targetVersion
  return true
}

function main(): void {
  const targetVersion = process.argv[2]?.trim()
  if (!targetVersion || !VERSION_PATTERN.test(targetVersion)) {
    throw new Error(
      'Usage: npm run sync:versions -- <semver>\n' + 'Example: npm run sync:versions -- 1.0.0',
    )
  }

  const repoRoot = process.cwd()
  const packageNames = new Set(PUBLIC_PACKAGES.map((pkg) => pkg.name))

  for (const pkgInfo of PUBLIC_PACKAGES) {
    const packageJsonPath = join(repoRoot, pkgInfo.dir, 'package.json')
    const pkg = readJson(packageJsonPath)
    let changed = false

    if (pkg.version !== targetVersion) {
      pkg.version = targetVersion
      changed = true
    }

    for (const dependencyName of packageNames) {
      if (dependencyName === pkgInfo.name) continue
      for (const field of INTERNAL_DEP_FIELDS) {
        changed = syncDependencyField(pkg, field, targetVersion, dependencyName) || changed
      }
    }

    if (changed) {
      writeJson(packageJsonPath, pkg)
      console.log(`synced ${pkgInfo.dir}/package.json -> ${targetVersion}`)
    }
  }
}

main()
