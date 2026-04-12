import { z } from 'zod'
import { DocsConfigSchema } from './docs-config.js'
import {
  DocsHomeFrontmatterSchema,
  DocsPageFrontmatterSchema,
  DocsRootMetaSchema,
  DocsSectionMetaSchema,
} from './docs-content.js'

export const DOCS_JSON_SCHEMA_BASE_URL = 'https://projects.sujeet.pro/pagesmith/schemas'

export type DocsJsonSchemaSpec = {
  fileName: string
  title: string
  description: string
  nodeModulesPath: string
  sitePath: string
  schema: Record<string, unknown>
}

function buildJsonSchemaDocument(
  schema: z.ZodType,
  fileName: string,
  title: string,
  description: string,
): Record<string, unknown> {
  return {
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    $id: `${DOCS_JSON_SCHEMA_BASE_URL}/${fileName}`,
    title,
    description,
    ...(z.toJSONSchema(schema) as Record<string, unknown>),
  }
}

export function buildDocsJsonSchemas(): DocsJsonSchemaSpec[] {
  const specs = [
    {
      fileName: 'pagesmith-config.schema.json',
      title: 'Pagesmith Docs Config',
      description: 'Schema for pagesmith.config.json5 in @pagesmith/docs projects.',
      schema: buildJsonSchemaDocument(
        DocsConfigSchema,
        'pagesmith-config.schema.json',
        'Pagesmith Docs Config',
        'Schema for pagesmith.config.json5 in @pagesmith/docs projects.',
      ),
    },
    {
      fileName: 'docs-root-meta.schema.json',
      title: 'Pagesmith Docs Root Meta',
      description: 'Schema for content/meta.json5 root navigation overrides.',
      schema: buildJsonSchemaDocument(
        DocsRootMetaSchema,
        'docs-root-meta.schema.json',
        'Pagesmith Docs Root Meta',
        'Schema for content/meta.json5 root navigation overrides.',
      ),
    },
    {
      fileName: 'docs-section-meta.schema.json',
      title: 'Pagesmith Docs Section Meta',
      description: 'Schema for content/<section>/meta.json5 ordering and series metadata.',
      schema: buildJsonSchemaDocument(
        DocsSectionMetaSchema,
        'docs-section-meta.schema.json',
        'Pagesmith Docs Section Meta',
        'Schema for content/<section>/meta.json5 ordering and series metadata.',
      ),
    },
    {
      fileName: 'docs-page-frontmatter.schema.json',
      title: 'Pagesmith Docs Page Frontmatter',
      description: 'Schema for regular @pagesmith/docs page frontmatter.',
      schema: buildJsonSchemaDocument(
        DocsPageFrontmatterSchema,
        'docs-page-frontmatter.schema.json',
        'Pagesmith Docs Page Frontmatter',
        'Schema for regular @pagesmith/docs page frontmatter.',
      ),
    },
    {
      fileName: 'docs-home-frontmatter.schema.json',
      title: 'Pagesmith Docs Home Frontmatter',
      description: 'Schema for the home page frontmatter used by the default DocHome layout.',
      schema: buildJsonSchemaDocument(
        DocsHomeFrontmatterSchema,
        'docs-home-frontmatter.schema.json',
        'Pagesmith Docs Home Frontmatter',
        'Schema for the home page frontmatter used by the default DocHome layout.',
      ),
    },
  ] as const

  return specs.map((spec) => ({
    ...spec,
    nodeModulesPath: `node_modules/@pagesmith/docs/schemas/${spec.fileName}`,
    sitePath: `/schemas/${spec.fileName}`,
  }))
}
