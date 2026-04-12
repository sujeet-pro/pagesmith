import { mkdirSync, writeFileSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath, pathToFileURL } from 'url'

const scriptDir = dirname(fileURLToPath(import.meta.url))
const packageDir = dirname(scriptDir)
const distSchemasEntry = join(packageDir, 'dist', 'schemas', 'index.mjs')
const outputDir = join(packageDir, 'schemas')

const { buildDocsJsonSchemas } = await import(pathToFileURL(distSchemasEntry).href)

mkdirSync(outputDir, { recursive: true })

for (const schemaFile of buildDocsJsonSchemas()) {
  const outputPath = join(outputDir, schemaFile.fileName)
  writeFileSync(outputPath, `${JSON.stringify(schemaFile.schema, null, 2)}\n`)
  console.log(`Generated ${schemaFile.fileName}`)
}
