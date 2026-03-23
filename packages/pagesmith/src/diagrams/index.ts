import {
  createRenderers,
  getExtensionMap,
  getMatchedExtension,
  loadConfig,
  renderAll,
  watchDiagrams as watchWithDiagramkit,
  updateManifest,
  type DiagramFile,
  type DiagramkitConfig,
  type DiagramType,
  type OutputFormat,
} from 'diagramkit'
import { basename, dirname, join } from 'path'

export type DiagramOptions = {
  contentDir?: string
  watch?: boolean
  force?: boolean
  file?: string
  type?: DiagramType
  format?: OutputFormat
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

export async function renderDiagrams(opts: DiagramOptions = {}): Promise<void> {
  const contentDir = opts.contentDir ?? join(process.cwd(), 'content')

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
    dir: contentDir,
    force: opts.force,
    type: opts.type,
    format: opts.format,
    config: opts.config,
  })
}

export function watchDiagrams(
  contentDir?: string,
  options?: { onChange?: (file: string) => void; config?: Partial<DiagramkitConfig> },
): () => void {
  return watchWithDiagramkit({
    dir: contentDir ?? join(process.cwd(), 'content'),
    onChange: options?.onChange,
    config: options?.config,
  })
}

export type { DiagramFile, DiagramkitConfig, DiagramType, OutputFormat }
