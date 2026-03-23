import type { ContentLayer } from '../../packages/content/src/content-layer'
import type { Plugin } from 'vite-plus'

const VIRTUAL_PREFIX = 'virtual:content/'
const RESOLVED_PREFIX = '\0virtual:content/'

export type VirtualContentSerializer = () => Promise<string> | string

export function createVirtualContentPlugin(options: {
  serializers: Record<string, VirtualContentSerializer>
  layer?: ContentLayer
}): Plugin {
  const modules = Object.keys(options.serializers)

  return {
    name: 'pagesmith-content',
    enforce: 'pre',

    resolveId(id) {
      for (const mod of modules) {
        if (id === `${VIRTUAL_PREFIX}${mod}`) {
          return `${RESOLVED_PREFIX}${mod}`
        }
      }
    },

    async load(id) {
      if (!id.startsWith(RESOLVED_PREFIX)) return

      const mod = id.slice(RESOLVED_PREFIX.length)
      const serializer = options.serializers[mod]
      if (!serializer) return

      return await serializer()
    },

    handleHotUpdate({ file, server }) {
      if (!options.layer || !file.includes('/content/')) return

      for (const mod of modules) {
        const module = server.moduleGraph.getModuleById(`${RESOLVED_PREFIX}${mod}`)
        if (module) {
          server.moduleGraph.invalidateModule(module)
        }
      }

      options.layer.invalidateAll()
      server.ws.send({ type: 'full-reload' })
    },
  }
}
