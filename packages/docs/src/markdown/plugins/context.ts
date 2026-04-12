import { AsyncLocalStorage } from 'node:async_hooks'

export type PagesmithDocsTransformContext = {
  basePath: string
  contentDir: string
  filePath: string
}

const contextStorage = new AsyncLocalStorage<PagesmithDocsTransformContext>()

export function runWithDocsTransformContext<T>(
  context: PagesmithDocsTransformContext,
  fn: () => Promise<T>,
): Promise<T> {
  return contextStorage.run(context, fn)
}

export function getDocsTransformContext(): PagesmithDocsTransformContext | undefined {
  return contextStorage.getStore()
}
