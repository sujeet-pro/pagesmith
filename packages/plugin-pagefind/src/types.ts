export interface SearchPlugin {
  name: string
  css?: string[]
  runtime?: string[]
  afterBuild?(ctx: { outDir: string; config: any; pages: any[] }): Promise<void>
  headHtml?: string
  searchHtml?: string
}
