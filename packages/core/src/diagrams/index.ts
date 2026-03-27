import {
  ensureDiagramsDir,
  filterByType,
  filterStaleFiles,
  findDiagramFiles,
  getDiagramsDir,
  getExtensionMap,
  getMatchedExtension,
  isStale,
  loadConfig,
  readManifest,
  renderAll,
  renderDiagramFileToDisk,
  watchDiagrams as watchWithDiagramkit,
} from 'diagramkit'
import { basename, dirname } from 'path'
import type {
  DiagramFile,
  DiagramkitConfig,
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
    const file = toDiagramFile(opts.file, opts.config)
    if (!file) {
      throw new Error(`Unknown diagram type for file: ${opts.file}`)
    }

    const format = opts.format ?? 'svg'
    await renderDiagramFileToDisk(file, { format, config: opts.config as DiagramkitConfig })
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
  ensureDiagramsDir,
  filterByType,
  filterStaleFiles,
  findDiagramFiles,
  getDiagramsDir,
  isStale,
  readManifest,
  renderDiagramFileToDisk,
}
export type {
  DiagramFile,
  DiagramkitConfig,
  DiagramType,
  OutputFormat,
  RenderOptions,
  Theme,
  WatchOptions,
}
