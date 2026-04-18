import { afterEach, describe, expect, it } from "vite-plus/test";
import { execSync } from "child_process";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "fs";
import { join } from "path";
import { tmpdir } from "os";
import { resolveDocsConfig } from "../config.js";
import { renderDocs } from "../render.js";

function initGitHistory(cwd: string) {
  execSync("git init", { cwd, stdio: "ignore" });
  execSync("git add .", { cwd, stdio: "ignore" });
  execSync(
    "git -c user.name=Test -c user.email=126489721+sujeet-pro@users.noreply.github.com commit --allow-empty -m init",
    {
      cwd,
      stdio: "ignore",
      env: {
        ...process.env,
        GIT_AUTHOR_DATE: "2024-01-02T00:00:00Z",
        GIT_COMMITTER_DATE: "2024-01-02T00:00:00Z",
      },
    },
  );
}

describe("renderDocs", () => {
  let rootDir = "";

  afterEach(() => {
    if (rootDir && existsSync(rootDir)) {
      rmSync(rootDir, { recursive: true, force: true });
    }
  });

  it("renders a minimal docs site", async () => {
    rootDir = mkdtempSync(join(tmpdir(), "ps-docs-render-"));
    mkdirSync(join(rootDir, "content", "guide"), { recursive: true });

    writeFileSync(
      join(rootDir, "pagesmith.config.json5"),
      '{ name: "Render Test", origin: "https://example.dev", search: { enabled: false } }',
      "utf-8",
    );
    writeFileSync(join(rootDir, "content", "README.md"), "# Home\n\nWelcome!", "utf-8");
    writeFileSync(join(rootDir, "content", "guide", "intro.md"), "# Intro\n\nGuide page.", "utf-8");

    const config = resolveDocsConfig(join(rootDir, "pagesmith.config.json5"));
    mkdirSync(config.outDir, { recursive: true });

    const { pages, model } = await renderDocs(config);

    expect(pages.length).toBe(2);
    expect(model.pageByPath.has("/")).toBe(true);
    expect(model.pageByPath.has("/guide/intro")).toBe(true);
    expect(existsSync(join(config.outDir, "index.html"))).toBe(true);
    expect(existsSync(join(config.outDir, "guide", "intro.html"))).toBe(true);
    expect(existsSync(join(config.outDir, "404.html"))).toBe(true);

    const homeHtml = readFileSync(join(config.outDir, "index.html"), "utf-8");
    const introHtml = readFileSync(join(config.outDir, "guide", "intro.html"), "utf-8");
    const notFoundHtml = readFileSync(join(config.outDir, "404.html"), "utf-8");
    expect(homeHtml).toContain("Skip to main content");
    expect(homeHtml).toContain('href="#doc-main-content"');
    expect(homeHtml).toContain('id="doc-main-content"');
    expect(homeHtml.match(/data-pagefind-body=""/g)).toHaveLength(1);
    expect(homeHtml).toMatch(/<article[^>]*class="doc-home-body"[^>]*data-pagefind-body=""/);
    expect(introHtml).toContain("Made with");
    expect(introHtml).toContain("https://projects.sujeet.pro/pagesmith/");
    expect(introHtml).toContain('id="doc-main-content"');
    expect(introHtml.match(/data-pagefind-body=""/g)).toHaveLength(1);
    expect(introHtml).toMatch(/<article[^>]*id="doc-main-content"[^>]*data-pagefind-body=""/);
    expect(introHtml).not.toContain('class="doc-content" data-pagefind-body=""');
    expect(introHtml).toContain('name="textSize" value="small"');
    expect(introHtml).toContain("Small text size");
    expect(notFoundHtml).toContain('class="site-not-found"');
    expect(notFoundHtml).toContain("Page Not Found");
  });

  it("spreads flat footer links evenly across up to four columns", async () => {
    rootDir = mkdtempSync(join(tmpdir(), "ps-docs-render-"));
    mkdirSync(join(rootDir, "content", "guide"), { recursive: true });

    writeFileSync(
      join(rootDir, "pagesmith.config.json5"),
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
      "utf-8",
    );
    writeFileSync(join(rootDir, "content", "README.md"), "# Home\n\nWelcome!", "utf-8");
    writeFileSync(join(rootDir, "content", "guide", "intro.md"), "# Intro\n\nGuide page.", "utf-8");

    const config = resolveDocsConfig(join(rootDir, "pagesmith.config.json5"));
    mkdirSync(config.outDir, { recursive: true });

    await renderDocs(config);

    const introHtml = readFileSync(join(config.outDir, "guide", "intro.html"), "utf-8");
    expect(introHtml).toContain("doc-footer-links-flat");
    expect(introHtml).toContain('style="--doc-footer-columns:3;--doc-footer-columns-compact:2"');
  });

  it("renders one page-meta row before prev-next and footer links", async () => {
    rootDir = mkdtempSync(join(tmpdir(), "ps-docs-render-"));
    mkdirSync(join(rootDir, "content", "guide"), { recursive: true });

    writeFileSync(
      join(rootDir, "pagesmith.config.json5"),
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
      "utf-8",
    );
    writeFileSync(join(rootDir, "content", "README.md"), "# Home\n\nWelcome!", "utf-8");
    writeFileSync(
      join(rootDir, "content", "guide", "advanced.md"),
      "# Advanced\n\nAdvanced page.",
      "utf-8",
    );
    writeFileSync(join(rootDir, "content", "guide", "intro.md"), "# Intro\n\nGuide page.", "utf-8");
    initGitHistory(rootDir);

    const previousCwd = process.cwd();
    let config;
    try {
      process.chdir(rootDir);
      config = resolveDocsConfig(join(rootDir, "pagesmith.config.json5"));
      mkdirSync(config.outDir, { recursive: true });
      await renderDocs(config);
    } finally {
      process.chdir(previousCwd);
    }

    const introHtml = readFileSync(join(config.outDir, "guide", "intro.html"), "utf-8");
    const pageMetaMatches = introHtml.match(/class="doc-page-meta"/g) ?? [];
    const metaIndex = introHtml.indexOf('class="doc-page-meta"');
    const editIndex = introHtml.indexOf('class="doc-edit-link"');
    const lastUpdatedIndex = introHtml.indexOf('class="doc-last-updated"');
    const navIndex = introHtml.indexOf('class="doc-article-nav"');
    const linksIndex = introHtml.indexOf('class="doc-footer-links doc-footer-links-flat"');

    expect(pageMetaMatches).toHaveLength(1);
    expect(metaIndex).toBeGreaterThan(-1);
    expect(editIndex).toBeGreaterThan(-1);
    expect(lastUpdatedIndex).toBeGreaterThan(editIndex);
    expect(navIndex).toBeGreaterThan(metaIndex);
    expect(linksIndex).toBeGreaterThan(navIndex);
  });

  it("renders grouped footer links and a dynamic copyright year span", async () => {
    rootDir = mkdtempSync(join(tmpdir(), "ps-docs-render-"));
    mkdirSync(join(rootDir, "content", "guide"), { recursive: true });

    writeFileSync(
      join(rootDir, "pagesmith.config.json5"),
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
      "utf-8",
    );
    writeFileSync(join(rootDir, "content", "README.md"), "# Home\n\nWelcome!", "utf-8");
    writeFileSync(join(rootDir, "content", "guide", "intro.md"), "# Intro\n\nGuide page.", "utf-8");

    const config = resolveDocsConfig(join(rootDir, "pagesmith.config.json5"));
    mkdirSync(config.outDir, { recursive: true });

    await renderDocs(config);

    const introHtml = readFileSync(join(config.outDir, "guide", "intro.html"), "utf-8");
    expect(introHtml).toContain("pagesmith-footer-year-end");
    expect(introHtml).toContain('data-auto-update="true"');
    expect(introHtml).toContain("Render Test");
    expect(introHtml).toContain("Docs");
    expect(introHtml).toContain('style="--doc-footer-columns:4;--doc-footer-columns-compact:2"');
  });

  it("renders listing layout with grouped cards, dates, and synthetic toc headings", async () => {
    rootDir = mkdtempSync(join(tmpdir(), "ps-docs-render-listing-"));
    mkdirSync(join(rootDir, "content", "guide"), { recursive: true });

    writeFileSync(
      join(rootDir, "pagesmith.config.json5"),
      '{ name: "Listing Test", origin: "https://example.dev", search: { enabled: false } }',
      "utf-8",
    );
    writeFileSync(join(rootDir, "content", "README.md"), "# Home\n\nWelcome!", "utf-8");
    writeFileSync(
      join(rootDir, "content", "guide", "meta.json5"),
      `{
        series: [
          {
            slug: 'basics',
            displayName: 'Basics',
            description: 'Start with the essentials.',
            articles: ['intro', 'advanced']
          }
        ]
      }`,
      "utf-8",
    );
    writeFileSync(
      join(rootDir, "content", "guide", "README.md"),
      `---
title: Guide Section
description: Section overview
layout: listing
---

# Overview

Pick a topic below.`,
      "utf-8",
    );
    writeFileSync(
      join(rootDir, "content", "guide", "intro.md"),
      "---\ntitle: Intro\ndescription: First steps\npublishedDate: 2024-01-10\n---\n\n# Intro\n\nHello.",
      "utf-8",
    );
    writeFileSync(
      join(rootDir, "content", "guide", "advanced.md"),
      "---\ntitle: Advanced\ndescription: Go deeper\npublishedDate: 2024-01-20\n---\n\n# Advanced\n\nMore.",
      "utf-8",
    );
    writeFileSync(
      join(rootDir, "content", "guide", "appendix.md"),
      "---\ntitle: Appendix\ndescription: Extra details\n---\n\n# Appendix\n\nExtras.",
      "utf-8",
    );

    const config = resolveDocsConfig(join(rootDir, "pagesmith.config.json5"));
    mkdirSync(config.outDir, { recursive: true });

    await renderDocs(config);

    const listingHtml = readFileSync(join(config.outDir, "guide.html"), "utf-8");
    expect(listingHtml).toContain("doc-listing-grid");
    expect(listingHtml).toContain("doc-listing-intro");
    expect(listingHtml).toContain("doc-listing-stats");
    expect(listingHtml).toContain("doc-listing-group-title");
    expect(listingHtml).toContain("Start with the essentials.");
    expect(listingHtml).toContain("doc-listing-card-title");
    expect(listingHtml).toContain("doc-listing-card-meta");
    expect(listingHtml).toContain("Intro");
    expect(listingHtml).toContain("Advanced");
    expect(listingHtml).toContain("Appendix");
    expect(listingHtml).toContain('href="#basics"');
    expect(listingHtml).toContain('href="#other"');
    expect(listingHtml).toContain("January 10, 2024");
    expect(listingHtml).toContain('href="/guide/intro"');
    expect(listingHtml).toContain('href="/guide/advanced"');
    expect(listingHtml).toContain('href="/guide/appendix"');
  });

  it("compiles a custom listing override through the theme layout loader", async () => {
    rootDir = mkdtempSync(join(tmpdir(), "ps-docs-render-custom-listing-"));
    mkdirSync(join(rootDir, "content", "guide"), { recursive: true });
    mkdirSync(join(rootDir, "theme"), { recursive: true });
    mkdirSync(join(rootDir, "node_modules", "@pagesmith"), { recursive: true });
    symlinkSync(
      join(process.cwd(), "packages", "docs"),
      join(rootDir, "node_modules", "@pagesmith", "docs"),
      "dir",
    );
    symlinkSync(
      join(process.cwd(), "packages", "site"),
      join(rootDir, "node_modules", "@pagesmith", "site"),
      "dir",
    );

    writeFileSync(
      join(rootDir, "pagesmith.config.json5"),
      `{
        name: "Custom Listing Test",
        origin: "https://example.dev",
        search: { enabled: false },
        theme: {
          layouts: {
            listing: "./theme/CustomListing.tsx"
          }
        }
      }`,
      "utf-8",
    );
    writeFileSync(join(rootDir, "content", "README.md"), "# Home\n\nWelcome!", "utf-8");
    writeFileSync(
      join(rootDir, "content", "guide", "README.md"),
      "---\ntitle: Guide\nlayout: listing\n---\n\n# Guide\n",
      "utf-8",
    );
    writeFileSync(
      join(rootDir, "content", "guide", "intro.md"),
      "---\ntitle: Intro\n---\n\n# Intro\n",
      "utf-8",
    );
    writeFileSync(
      join(rootDir, "theme", "CustomListing.tsx"),
      [
        "/** @jsxImportSource @pagesmith/docs */",
        "",
        "import { h } from '@pagesmith/docs/jsx-runtime'",
        "",
        "export default function CustomListing(props: any) {",
        "  return (",
        "    <html>",
        "      <body>",
        '        <main data-custom-listing="">',
        "          <h1>{props.frontmatter.title}</h1>",
        "          <p>{props.listingCards?.length ?? 0} cards</p>",
        "        </main>",
        "      </body>",
        "    </html>",
        "  )",
        "}",
        "",
      ].join("\n"),
      "utf-8",
    );

    const config = resolveDocsConfig(join(rootDir, "pagesmith.config.json5"));
    mkdirSync(config.outDir, { recursive: true });

    await renderDocs(config);

    const listingHtml = readFileSync(join(config.outDir, "guide.html"), "utf-8");
    expect(listingHtml).toContain('data-custom-listing=""');
    expect(listingHtml).toContain("1 cards");
  });

  it("honors frontmatter chrome toggles in rendered page shells", async () => {
    rootDir = mkdtempSync(join(tmpdir(), "ps-docs-render-chrome-"));
    mkdirSync(join(rootDir, "content", "guide"), { recursive: true });

    writeFileSync(
      join(rootDir, "pagesmith.config.json5"),
      '{ name: "Chrome Test", origin: "https://example.dev", search: { enabled: false } }',
      "utf-8",
    );
    writeFileSync(join(rootDir, "content", "README.md"), "# Home\n\nWelcome!", "utf-8");
    writeFileSync(
      join(rootDir, "content", "guide", "intro.md"),
      `---
title: Intro
chrome:
  header: false
  sidebar: false
  toc: false
  footer: false
---

# Intro

## Section

Body.`,
      "utf-8",
    );

    const config = resolveDocsConfig(join(rootDir, "pagesmith.config.json5"));
    mkdirSync(config.outDir, { recursive: true });

    await renderDocs(config);

    const pageHtml = readFileSync(join(config.outDir, "guide", "intro.html"), "utf-8");
    expect(pageHtml).not.toContain('class="doc-header"');
    expect(pageHtml).not.toContain('class="doc-sidebar"');
    expect(pageHtml).not.toContain('class="doc-aside"');
    expect(pageHtml).not.toContain('class="doc-footer"');
    expect(pageHtml).toContain('id="doc-main-content"');
  });
});
