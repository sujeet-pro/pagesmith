import { afterEach, describe, expect, it } from 'vite-plus/test'
import { execSync } from 'child_process'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'fs'
import { join } from 'path'
import { tmpdir } from 'os'
import { resolveDocsConfig } from '../config.js'
import { renderDocs } from '../render.js'

function initGitHistory(cwd: string) {
  execSync('git init', { cwd, stdio: 'ignore' })
  execSync('git add .', { cwd, stdio: 'ignore' })
  execSync(
    'git -c user.name=Test -c user.email=126489721+sujeet-pro@users.noreply.github.com commit --allow-empty -m init',
    {
      cwd,
      stdio: 'ignore',
      env: {
        ...process.env,
        GIT_AUTHOR_DATE: '2024-01-02T00:00:00Z',
        GIT_COMMITTER_DATE: '2024-01-02T00:00:00Z',
      },
    },
  )
}

describe('renderDocs', () => {
  let rootDir = ''

  afterEach(() => {
    if (rootDir && existsSync(rootDir)) {
      rmSync(rootDir, { recursive: true, force: true })
    }
  })

  it('renders a minimal docs site', async () => {
    rootDir = mkdtempSync(join(tmpdir(), 'ps-docs-render-'))
    mkdirSync(join(rootDir, 'content', 'guide'), { recursive: true })

    writeFileSync(
      join(rootDir, 'pagesmith.config.json5'),
      '{ name: "Render Test", origin: "https://example.dev", search: { enabled: false } }',
      'utf-8',
    )
    writeFileSync(join(rootDir, 'content', 'README.md'), '# Home\n\nWelcome!', 'utf-8')
    writeFileSync(join(rootDir, 'content', 'guide', 'intro.md'), '# Intro\n\nGuide page.', 'utf-8')

    const config = resolveDocsConfig(join(rootDir, 'pagesmith.config.json5'))
    mkdirSync(config.outDir, { recursive: true })

    const { pages, model } = await renderDocs(config)

    expect(pages.length).toBe(2)
    expect(model.pageByPath.has('/')).toBe(true)
    expect(model.pageByPath.has('/guide/intro')).toBe(true)
    expect(existsSync(join(config.outDir, 'index.html'))).toBe(true)
    expect(existsSync(join(config.outDir, 'guide', 'intro', 'index.html'))).toBe(true)
    expect(existsSync(join(config.outDir, '404.html'))).toBe(true)

    const homeHtml = readFileSync(join(config.outDir, 'index.html'), 'utf-8')
    const introHtml = readFileSync(join(config.outDir, 'guide', 'intro', 'index.html'), 'utf-8')
    const notFoundHtml = readFileSync(join(config.outDir, '404.html'), 'utf-8')
    expect(homeHtml).toContain('Skip to main content')
    expect(homeHtml).toContain('href="#doc-main-content"')
    expect(homeHtml).toContain('id="doc-main-content"')
    expect(homeHtml.match(/data-pagefind-body=""/g)).toHaveLength(1)
    expect(homeHtml).toMatch(/<article[^>]*class="doc-home-body"[^>]*data-pagefind-body=""/)
    expect(introHtml).toContain('Made with')
    expect(introHtml).toContain('https://projects.sujeet.pro/pagesmith/')
    expect(introHtml).toContain('id="doc-main-content"')
    expect(introHtml.match(/data-pagefind-body=""/g)).toHaveLength(1)
    expect(introHtml).toMatch(/<article[^>]*id="doc-main-content"[^>]*data-pagefind-body=""/)
    expect(introHtml).not.toContain('class="doc-content" data-pagefind-body=""')
    expect(introHtml).toContain('name="textSize" value="small"')
    expect(introHtml).toContain('Small text size')
    expect(notFoundHtml.match(/data-pagefind-body=""/g)).toHaveLength(1)
    expect(notFoundHtml).toMatch(
      /<article[^>]*class="doc-not-found-container"[^>]*data-pagefind-body=""/,
    )
  })

  it('spreads flat footer links evenly across up to four columns', async () => {
    rootDir = mkdtempSync(join(tmpdir(), 'ps-docs-render-'))
    mkdirSync(join(rootDir, 'content', 'guide'), { recursive: true })

    writeFileSync(
      join(rootDir, 'pagesmith.config.json5'),
      `{
        name: "Render Test",
        origin: "https://example.dev",
        search: { enabled: false },
        footerLinks: [
          { label: "Guide", path: "/guide" },
          { label: "Reference", path: "/reference" },
          { label: "API", path: "/api" }
        ]
      }`,
      'utf-8',
    )
    writeFileSync(join(rootDir, 'content', 'README.md'), '# Home\n\nWelcome!', 'utf-8')
    writeFileSync(join(rootDir, 'content', 'guide', 'intro.md'), '# Intro\n\nGuide page.', 'utf-8')

    const config = resolveDocsConfig(join(rootDir, 'pagesmith.config.json5'))
    mkdirSync(config.outDir, { recursive: true })

    await renderDocs(config)

    const introHtml = readFileSync(join(config.outDir, 'guide', 'intro', 'index.html'), 'utf-8')
    expect(introHtml).toContain('doc-footer-links-flat')
    expect(introHtml).toContain('style="--doc-footer-columns:3;--doc-footer-columns-compact:2"')
  })

  it('renders one page-meta row before prev-next and footer links', async () => {
    rootDir = mkdtempSync(join(tmpdir(), 'ps-docs-render-'))
    mkdirSync(join(rootDir, 'content', 'guide'), { recursive: true })

    writeFileSync(
      join(rootDir, 'pagesmith.config.json5'),
      `{
        name: "Render Test",
        origin: "https://example.dev",
        search: { enabled: false },
        editLink: { repo: "https://github.com/example/repo" },
        footerLinks: [
          { label: "Guide", path: "/guide" },
          { label: "Reference", path: "/reference" }
        ]
      }`,
      'utf-8',
    )
    writeFileSync(join(rootDir, 'content', 'README.md'), '# Home\n\nWelcome!', 'utf-8')
    writeFileSync(
      join(rootDir, 'content', 'guide', 'advanced.md'),
      '# Advanced\n\nAdvanced page.',
      'utf-8',
    )
    writeFileSync(join(rootDir, 'content', 'guide', 'intro.md'), '# Intro\n\nGuide page.', 'utf-8')
    initGitHistory(rootDir)

    const previousCwd = process.cwd()
    let config
    try {
      process.chdir(rootDir)
      config = resolveDocsConfig(join(rootDir, 'pagesmith.config.json5'))
      mkdirSync(config.outDir, { recursive: true })
      await renderDocs(config)
    } finally {
      process.chdir(previousCwd)
    }

    const introHtml = readFileSync(join(config.outDir, 'guide', 'intro', 'index.html'), 'utf-8')
    const pageMetaMatches = introHtml.match(/class="doc-page-meta"/g) ?? []
    const metaIndex = introHtml.indexOf('class="doc-page-meta"')
    const editIndex = introHtml.indexOf('class="doc-edit-link"')
    const lastUpdatedIndex = introHtml.indexOf('class="doc-last-updated"')
    const navIndex = introHtml.indexOf('class="doc-article-nav"')
    const linksIndex = introHtml.indexOf('class="doc-footer-links doc-footer-links-flat"')

    expect(pageMetaMatches).toHaveLength(1)
    expect(metaIndex).toBeGreaterThan(-1)
    expect(editIndex).toBeGreaterThan(-1)
    expect(lastUpdatedIndex).toBeGreaterThan(editIndex)
    expect(navIndex).toBeGreaterThan(metaIndex)
    expect(linksIndex).toBeGreaterThan(navIndex)
  })

  it('renders grouped footer links and a dynamic copyright year span', async () => {
    rootDir = mkdtempSync(join(tmpdir(), 'ps-docs-render-'))
    mkdirSync(join(rootDir, 'content', 'guide'), { recursive: true })

    writeFileSync(
      join(rootDir, 'pagesmith.config.json5'),
      `{
        name: "Render Test",
        origin: "https://example.dev",
        search: { enabled: false },
        copyright: { projectName: "Render Test", startYear: 2024, endYear: null },
        footerLinks: [
          {
            header: "Docs",
            links: [{ label: "Guide", path: "/guide" }]
          },
          {
            header: "API",
            links: [{ label: "Reference", path: "/reference" }]
          },
          {
            header: "Community",
            links: [{ label: "Discord", path: "https://example.dev/discord" }]
          },
          {
            header: "Company",
            links: [{ label: "About", path: "/about" }]
          },
          {
            header: "More",
            links: [{ label: "Blog", path: "/blog" }]
          }
        ]
      }`,
      'utf-8',
    )
    writeFileSync(join(rootDir, 'content', 'README.md'), '# Home\n\nWelcome!', 'utf-8')
    writeFileSync(join(rootDir, 'content', 'guide', 'intro.md'), '# Intro\n\nGuide page.', 'utf-8')

    const config = resolveDocsConfig(join(rootDir, 'pagesmith.config.json5'))
    mkdirSync(config.outDir, { recursive: true })

    await renderDocs(config)

    const introHtml = readFileSync(join(config.outDir, 'guide', 'intro', 'index.html'), 'utf-8')
    expect(introHtml).toContain('pagesmith-footer-year-end')
    expect(introHtml).toContain('data-auto-update="true"')
    expect(introHtml).toContain('Render Test')
    expect(introHtml).toContain('Docs')
    expect(introHtml).toContain('style="--doc-footer-columns:4;--doc-footer-columns-compact:2"')
  })
})
