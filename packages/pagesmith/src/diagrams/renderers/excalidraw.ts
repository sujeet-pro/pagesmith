import { existsSync, readFileSync, writeFileSync, } from 'fs'
import { join, } from 'path'
import { fileURLToPath, } from 'url'
import { type Browser, chromium, type Page, } from 'playwright'
import type { DiagramFile, DiagramRenderer, } from './types'

async function buildExcalidrawBundle(): Promise<string | null> {
  const entryPath = fileURLToPath(new URL('./excalidraw-entry.ts', import.meta.url,),)
  if (!existsSync(entryPath,)) return null

  try {
    const { rolldown, } = await import('rolldown',)
    const bundle = await rolldown({ input: entryPath, logLevel: 'warn', },)
    const { output, } = await bundle.generate({ format: 'iife', },)
    return output[0].code
  } catch {
    return null
  }
}

async function createExcalidrawPage(
  browser: Browser,
  bundleCode: string,
): Promise<Page> {
  const page = await browser.newPage()
  await page.setContent('<!DOCTYPE html><html><body></body></html>',)
  await page.addScriptTag({ content: bundleCode, },)
  await page.waitForFunction(
    () => (globalThis as any).__excalidrawReady === true,
    null,
    { timeout: 30_000, },
  )
  return page
}

export class ExcalidrawRenderer implements DiagramRenderer {
  name = 'excalidraw'
  extensions = ['.excalidraw',]

  async renderBatch(files: DiagramFile[],): Promise<void> {
    if (files.length === 0) return

    const start = performance.now()
    console.log(`Rendering ${files.length} excalidraw diagrams...`,)

    const bundleCode = await buildExcalidrawBundle()
    if (!bundleCode) {
      console.warn(
        '  Excalidraw rendering unavailable.\n'
          + '  Install: bun add -d @excalidraw/excalidraw react react-dom',
      )
      return
    }

    const browser = await chromium.launch()
    const page = await createExcalidrawPage(browser, bundleCode,)

    let rendered = 0
    let failed = 0

    for (const file of files) {
      const json = readFileSync(file.path, 'utf-8',)

      for (const darkMode of [false, true,]) {
        const suffix = darkMode ? 'dark' : 'light'
        try {
          const svg: string = await page.evaluate(
            async ({ json, darkMode, },) => {
              return await (globalThis as any).__renderExcalidraw(json, darkMode,)
            },
            { json, darkMode, },
          )
          writeFileSync(join(file.dir, `${file.name}.${suffix}.svg`,), svg,)
        } catch (err: any) {
          console.warn(`  FAIL: ${file.name}.${suffix} — ${err.message}`,)
          failed++
        }
      }
      rendered++
    }

    await browser.close()

    const elapsed = (performance.now() - start).toFixed(0,)
    console.log(
      `  ${rendered} excalidraw rendered in ${elapsed}ms`
        + (failed > 0 ? ` (${failed} failed)` : ''),
    )
  }

  async renderSingle(file: DiagramFile,): Promise<void> {
    const bundleCode = await buildExcalidrawBundle()
    if (!bundleCode) return

    const browser = await chromium.launch()
    const page = await createExcalidrawPage(browser, bundleCode,)

    const json = readFileSync(file.path, 'utf-8',)

    for (const darkMode of [false, true,]) {
      const suffix = darkMode ? 'dark' : 'light'
      try {
        const svg: string = await page.evaluate(
          async ({ json, darkMode, },) => {
            return await (globalThis as any).__renderExcalidraw(json, darkMode,)
          },
          { json, darkMode, },
        )
        writeFileSync(join(file.dir, `${file.name}.${suffix}.svg`,), svg,)
      } catch (err: any) {
        console.warn(`  FAIL: ${file.name}.${suffix} — ${err.message}`,)
      }
    }

    await browser.close()
    console.log(`  Rendered: ${file.name}`,)
  }
}
