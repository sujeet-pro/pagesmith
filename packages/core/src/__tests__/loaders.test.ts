import { mkdirSync, rmSync, writeFileSync } from 'fs'
import { join } from 'path'
import { afterAll, beforeAll, describe, expect, it } from 'vite-plus/test'
import { JsonLoader } from '../loaders/json'
import { TomlLoader } from '../loaders/toml'
import { YamlLoader } from '../loaders/yaml'

const TMP = join(import.meta.dirname, '__fixtures__')

// Setup / teardown via describe hooks
describe('loaders', () => {
  beforeAll(() => {
    mkdirSync(TMP, { recursive: true })
  })

  afterAll(() => {
    rmSync(TMP, { recursive: true, force: true })
  })

  describe('JsonLoader', () => {
    const loader = new JsonLoader()

    it('loads a .json file', async () => {
      const file = join(TMP, 'test.json')
      writeFileSync(file, JSON.stringify({ title: 'Hello', count: 42 }))

      const result = await loader.load(file)
      expect(result.data.title).toBe('Hello')
      expect(result.data.count).toBe(42)
      expect(result.content).toBeUndefined()
    })

    it('loads a .json5 file with comments and trailing commas', async () => {
      const file = join(TMP, 'test.json5')
      writeFileSync(
        file,
        `{
  // This is a comment
  title: 'JSON5 works',
  tags: ['a', 'b',],
}`,
      )

      const result = await loader.load(file)
      expect(result.data.title).toBe('JSON5 works')
      expect(result.data.tags).toEqual(['a', 'b'])
    })
  })

  describe('YamlLoader', () => {
    const loader = new YamlLoader()

    it('loads a .yaml file', async () => {
      const file = join(TMP, 'test.yaml')
      writeFileSync(
        file,
        `title: YAML Test
nested:
  key: value
`,
      )

      const result = await loader.load(file)
      expect(result.data.title).toBe('YAML Test')
      expect(result.data.nested.key).toBe('value')
    })
  })

  describe('TomlLoader', () => {
    const loader = new TomlLoader()

    it('loads a .toml file', async () => {
      const file = join(TMP, 'test.toml')
      writeFileSync(
        file,
        `title = "TOML Test"

[metadata]
version = 1
`,
      )

      const result = await loader.load(file)
      expect(result.data.title).toBe('TOML Test')
      expect(result.data.metadata.version).toBe(1)
    })
  })
})
