import {
  cleanOrphans,
  createRenderers,
  DIAGRAMS_DIR,
  ensureDiagramsDir,
  filterByType,
  filterStaleFiles,
  findDiagramFiles,
  getDiagramsDir,
  getExtensionMap,
  getMatchedExtension,
  hashFile,
  isStale,
  loadConfig,
  readManifest,
  renderAll,
  updateManifest,
  watchDiagrams as watchWithDiagramkit,
  writeManifest,
} from 'diagramkit'
import { basename, dirname } from 'path'
import type {
  DiagramFile,
  DiagramkitConfig,
  DiagramRenderer,
  DiagramType,
  OutputFormat,
  RenderOptions,
  Theme,
  WatchOptions,
} from 'diagramkit'

export type RenderDiagramsOptions = Omit<RenderOptions, 'config'> & {
  contentDir: string
  force?: boolean
  file?: string
  type?: DiagramType
  config?: Partial<DiagramkitConfig>
}

export type WatchDiagramsOptions = {
  contentDir: string
  onChange?: (file: string) => void
  config?: Partial<DiagramkitConfig>
}

function toDiagramFile(path: string, config?: Partial<DiagramkitConfig>): DiagramFile | null {
  const extensionMap = getExtensionMap(config?.extensionMap)
  const ext = getMatchedExtension(basename(path), extensionMap)
  if (!ext) return null

  return {
    path,
    name: basename(path, ext),
    dir: dirname(path),
    ext,
  }
}

export async function renderDiagrams(opts: RenderDiagramsOptions): Promise<void> {
  if (opts.file) {
    const config = loadConfig(opts.config, dirname(opts.file))
    const file = toDiagramFile(opts.file, config)
    if (!file) {
      throw new Error(`Unknown diagram type for file: ${opts.file}`)
    }

    const renderer = createRenderers().find((candidate) => candidate.extensions.includes(file.ext))
    if (!renderer) {
      throw new Error(`No diagram renderer registered for extension: ${file.ext}`)
    }

    const format = opts.format ?? config.defaultFormat ?? 'svg'
    await renderer.renderSingle(file, { force: true, format, config })
    updateManifest([file], format, config)
    return
  }

  await renderAll({
    dir: opts.contentDir,
    force: opts.force,
    type: opts.type,
    format: opts.format,
    config: opts.config,
  })
}

export function watchDiagrams(opts: WatchDiagramsOptions): () => void {
  return watchWithDiagramkit({
    dir: opts.contentDir,
    onChange: opts.onChange,
    config: opts.config,
  })
}

export {
  type DiagramImageMode,
  rehypeDiagramImages,
  type RehypeDiagramImagesOptions,
} from './rehype-diagram-images'
export {
  cleanOrphans,
  createRenderers,
  DIAGRAMS_DIR,
  ensureDiagramsDir,
  filterByType,
  filterStaleFiles,
  findDiagramFiles,
  getDiagramsDir,
  hashFile,
  isStale,
  readManifest,
  updateManifest,
  writeManifest,
}
export type {
  DiagramFile,
  DiagramkitConfig,
  DiagramRenderer,
  DiagramType,
  OutputFormat,
  RenderOptions,
  Theme,
  WatchOptions,
}
