import { describe, expect, it } from "vite-plus/test";
import { existsSync, readFileSync, readdirSync } from "fs";
import JSON5 from "json5";
import { join } from "path";

function collectFiles(rootDir: string, predicate: (filePath: string) => boolean): string[] {
  const entries = readdirSync(rootDir, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const entryPath = join(rootDir, entry.name);

    if (entry.isDirectory()) {
      files.push(...collectFiles(entryPath, predicate));
      continue;
    }

    if (predicate(entryPath)) {
      files.push(entryPath);
    }
  }

  return files;
}

describe("docs quality guards", () => {
  it("keeps the guide onboarding series first for AI-first navigation", () => {
    const guideMetaPath = join(
      import.meta.dirname,
      "..",
      "..",
      "..",
      "..",
      "docs",
      "content",
      "guide",
      "meta.json5",
    );
    expect(existsSync(guideMetaPath)).toBe(true);

    const meta = JSON5.parse(readFileSync(guideMetaPath, "utf-8")) as {
      series?: Array<{ slug?: string; articles?: string[] }>;
    };

    expect(meta.series?.[0]?.slug).toBe("onboarding");
    expect(meta.series?.[0]?.articles).toEqual([
      "choose-your-path",
      "ai-assistants",
      "prompts-cookbook",
      "mcp-setup",
    ]);
  });

  it("hosts the package setup prompts and schema files on the root docs site config", () => {
    const docsConfigPath = join(
      import.meta.dirname,
      "..",
      "..",
      "..",
      "..",
      "pagesmith.config.json5",
    );
    expect(existsSync(docsConfigPath)).toBe(true);

    const config = JSON5.parse(readFileSync(docsConfigPath, "utf-8")) as {
      assets?: Record<string, string[]>;
    };

    expect(config.assets?.["/prompts"]).toEqual([
      "./packages/core/skills/pagesmith-core-setup/references/setup-core.md",
      "./packages/site/skills/pagesmith-site-setup/references/setup-site.md",
      "./packages/docs/skills/pagesmith-docs-setup/references/setup-docs.md",
    ]);
    expect(config.assets?.["/"]).toEqual(
      expect.arrayContaining(["./llms.txt", "./llms-full.txt", "./packages/docs/schemas"]),
    );
  });

  it("keeps repo docs configs pointing at the version-matched package schema", () => {
    const rootConfigPath = join(
      import.meta.dirname,
      "..",
      "..",
      "..",
      "..",
      "pagesmith.config.json5",
    );
    const exampleConfigPath = join(
      import.meta.dirname,
      "..",
      "..",
      "..",
      "..",
      "examples",
      "doc-site",
      "pagesmith.config.json5",
    );

    const rootConfig = JSON5.parse(readFileSync(rootConfigPath, "utf-8")) as {
      $schema?: string;
    };
    const exampleConfig = JSON5.parse(readFileSync(exampleConfigPath, "utf-8")) as {
      $schema?: string;
    };

    expect(rootConfig.$schema).toBe(
      "./node_modules/@pagesmith/docs/schemas/pagesmith-config.schema.json",
    );
    expect(exampleConfig.$schema).toBe(
      "../../node_modules/@pagesmith/docs/schemas/pagesmith-config.schema.json",
    );
  });

  it("keeps internal package dependency pins aligned with sibling package versions", () => {
    const corePackagePath = join(import.meta.dirname, "..", "..", "..", "core", "package.json");
    const sitePackagePath = join(import.meta.dirname, "..", "..", "..", "site", "package.json");
    const docsPackagePath = join(import.meta.dirname, "..", "..", "package.json");

    const corePackage = JSON.parse(readFileSync(corePackagePath, "utf-8")) as {
      version?: string;
    };
    const sitePackage = JSON.parse(readFileSync(sitePackagePath, "utf-8")) as {
      version?: string;
      dependencies?: Record<string, string>;
    };
    const docsPackage = JSON.parse(readFileSync(docsPackagePath, "utf-8")) as {
      version?: string;
      dependencies?: Record<string, string>;
    };

    expect(corePackage.version).toMatch(/^\d+\.\d+\.\d+/);
    expect(sitePackage.version).toMatch(/^\d+\.\d+\.\d+/);
    expect(docsPackage.version).toMatch(/^\d+\.\d+\.\d+/);
    expect(sitePackage.dependencies?.["@pagesmith/core"]).toBe(corePackage.version);
    expect(docsPackage.dependencies?.["@pagesmith/core"]).toBe(corePackage.version);
    expect(docsPackage.dependencies?.["@pagesmith/site"]).toBe(sitePackage.version);
  });

  it("keeps the publish workflow using the shared version sync and full release validation", () => {
    const publishWorkflowPath = join(
      import.meta.dirname,
      "..",
      "..",
      "..",
      "..",
      ".github",
      "workflows",
      "publish.yml",
    );
    const publishWorkflow = readFileSync(publishWorkflowPath, "utf-8");

    expect(publishWorkflow).toContain('npm run sync:versions -- "$VERSION"');
    expect(publishWorkflow).toContain("npm install --package-lock-only --ignore-scripts");
    expect(publishWorkflow).toContain("scripts/resolve-release-version.ts");
    expect(publishWorkflow).toContain("Partial publish detected");
    expect(publishWorkflow).toContain("packages:");
    expect(publishWorkflow).toContain("default: auto");
    expect(publishWorkflow).toContain("Selective publish requires an explicit version");
    expect(publishWorkflow).toContain("Skipping @pagesmith/site@${VERSION}; already published.");
    expect(publishWorkflow).toContain("Check final published versions");
    expect(publishWorkflow).toContain("npm run validate:diagrams");
    expect(publishWorkflow).toContain("npm run validate:examples");
    expect(publishWorkflow).toContain("npm run validate:pagesmith");
    expect(publishWorkflow).toContain("if: needs.prepare.outputs.publish_core == 'true'");
    expect(publishWorkflow).toContain("if: needs.publish.outputs.all_published == 'true'");
  });

  it("keeps the hosted markdown guide aligned with the docs-package markdown surface", () => {
    const markdownGuidePath = join(
      import.meta.dirname,
      "..",
      "..",
      "..",
      "..",
      "docs",
      "content",
      "guide",
      "markdown-features",
      "README.md",
    );
    const markdownGuide = readFileSync(markdownGuidePath, "utf-8");

    expect(markdownGuide).toContain("pagesmith.config.json5");
    expect(markdownGuide).toContain("JSON-safe");
    expect(markdownGuide).toContain("Docs-Specific Link And Asset Transforms");
    expect(markdownGuide).toContain("docs link/asset transforms");
    expect(markdownGuide).toContain("Local Images");
    expect(markdownGuide).toContain("rehype-local-images");
    expect(markdownGuide).toContain("sourcePath");
    expect(markdownGuide).toContain("@pagesmith/core");
  });

  it("keeps framework and MCP guides aligned to site-first integrations", () => {
    const frameworksGuidePath = join(
      import.meta.dirname,
      "..",
      "..",
      "..",
      "..",
      "docs",
      "content",
      "guide",
      "frameworks",
      "README.md",
    );
    const mcpGuidePath = join(
      import.meta.dirname,
      "..",
      "..",
      "..",
      "..",
      "docs",
      "content",
      "guide",
      "mcp-setup",
      "README.md",
    );

    const frameworksGuide = readFileSync(frameworksGuidePath, "utf-8");
    const mcpGuide = readFileSync(mcpGuidePath, "utf-8");

    expect(frameworksGuide).toContain("use `@pagesmith/site` as the app-facing Pagesmith package");
    expect(frameworksGuide).toMatch(
      /\|\s*\[Next\.js\]\(\.\.\/framework-nextjs\/README\.md\)[^|]*\|\s*`@pagesmith\/site`[^|]*\|\s*Next\.js App Router[^|]*\|\s*`createContentLayer`/,
    );
    expect(mcpGuide).toContain("pagesmith://core/llms-full");
    expect(mcpGuide).toContain("core_search_entries");
    expect(mcpGuide).not.toContain("maxResults");
  });

  it("keeps the blog-site and doc-site framework guides aligned with the shipped examples", () => {
    const blogGuidePath = join(
      import.meta.dirname,
      "..",
      "..",
      "..",
      "..",
      "docs",
      "content",
      "guide",
      "framework-blog-site",
      "README.md",
    );
    const docGuidePath = join(
      import.meta.dirname,
      "..",
      "..",
      "..",
      "..",
      "docs",
      "content",
      "guide",
      "framework-doc-site",
      "README.md",
    );

    const blogGuide = readFileSync(blogGuidePath, "utf-8");
    const docGuide = readFileSync(docGuidePath, "utf-8");

    expect(blogGuide).toContain("Node.js 24+");
    expect(blogGuide).toContain("src/content.ts");
    expect(blogGuide).toContain("src/components.tsx");
    expect(blogGuide).toContain("@pagesmith/site/css/standalone");
    expect(blogGuide).toContain("content-layer.md");
    expect(blogGuide).toContain("jsx-runtime.md");
    expect(blogGuide).toContain("build-and-deploy.md");
    expect(blogGuide).toContain("pluginTimings: false");
    expect(blogGuide).toContain("serves the bundled fonts during development");
    expect(blogGuide).not.toContain("/guide/framework-nextjs");
    expect(blogGuide).not.toContain("site.json5");
    expect(blogGuide).not.toContain("pageTypes");
    expect(blogGuide).not.toContain("TagIndex");

    expect(docGuide).toContain("Node.js 24+");
    expect(docGuide).toContain("@pagesmith/docs/jsx-runtime");
    expect(docGuide).toContain("series: [");
    expect(docGuide).toContain('contentDir: "./content"');
    expect(docGuide).toContain("maintainer:");
    expect(docGuide).toContain("footerLinks:");
    expect(docGuide).toContain("editLink:");
    expect(docGuide).toContain("lastUpdated: true");
    expect(docGuide).toContain("node ../../packages/docs/dist/cli/bin.mjs dev");
    expect(docGuide).not.toContain("content/blog/");
  });

  it("keeps the repo llms-full docs schema section aligned with shipped docs schemas", () => {
    const llmsFullPath = join(import.meta.dirname, "..", "..", "..", "..", "llms-full.txt");
    const llmsFull = readFileSync(llmsFullPath, "utf-8");

    expect(llmsFull).toContain("pagesmith-config.schema.json");
    expect(llmsFull).toContain("docs-root-meta.schema.json");
    expect(llmsFull).toContain("DocsConfigSchema");
    expect(llmsFull).toContain("DocsPageFrontmatterSchema");
    expect(llmsFull).toContain("remark-math (when `markdown.math` is enabled or auto-detected)");
    expect(llmsFull).not.toContain("SiteConfigSchema");
    expect(llmsFull).not.toContain("TagIndexLayoutPropsSchema");
  });

  it("keeps loader docs aligned with the built-in JSON and JSONC loaders", () => {
    const coreReadmePath = join(import.meta.dirname, "..", "..", "..", "core", "README.md");
    const collectionsGuidePath = join(
      import.meta.dirname,
      "..",
      "..",
      "..",
      "..",
      "docs",
      "content",
      "guide",
      "collections-and-loaders",
      "README.md",
    );
    const llmsFullPath = join(import.meta.dirname, "..", "..", "..", "..", "llms-full.txt");

    const coreReadme = readFileSync(coreReadmePath, "utf-8");
    const collectionsGuide = readFileSync(collectionsGuidePath, "utf-8");
    const llmsFull = readFileSync(llmsFullPath, "utf-8");

    expect(coreReadme).toMatch(/\|\s*`json5`\s*\|\s*`\.json5`\s*\|/);
    expect(coreReadme).toMatch(/\|\s*`jsonc`\s*\|\s*`\.jsonc`\s*\|/);
    expect(collectionsGuide).toMatch(
      /\|\s*`JsonLoader`\s*\|\s*`json`\s*\/\s*`json5`\s*\|\s*`\.json`,\s*`\.json5`\s*\|/,
    );
    expect(collectionsGuide).toMatch(/\|\s*`JsoncLoader`\s*\|\s*`jsonc`\s*\|\s*`\.jsonc`\s*\|/);
    expect(llmsFull).toContain("`JsonLoader` (.json, .json5)");
    expect(llmsFull).toContain("`JsoncLoader` (.jsonc)");
    expect(llmsFull).not.toContain("JSON with comments via json5");
  });

  it("keeps theme and runtime references aligned to the shared site shell", () => {
    const docsThemePath = join(
      import.meta.dirname,
      "..",
      "..",
      "..",
      "..",
      "docs",
      "content",
      "reference",
      "docs-theme",
      "README.md",
    );
    const runtimePath = join(
      import.meta.dirname,
      "..",
      "..",
      "..",
      "..",
      "docs",
      "content",
      "reference",
      "runtime",
      "README.md",
    );
    const architecturePath = join(
      import.meta.dirname,
      "..",
      "..",
      "..",
      "..",
      "docs",
      "content",
      "reference",
      "architecture",
      "README.md",
    );

    const docsThemeGuide = readFileSync(docsThemePath, "utf-8");
    const runtimeGuide = readFileSync(runtimePath, "utf-8");
    const architectureGuide = readFileSync(architecturePath, "utf-8");

    expect(docsThemeGuide.match(/^---$/gm) ?? []).toHaveLength(2);
    expect(docsThemeGuide).toContain("PageShell");
    expect(docsThemeGuide).toContain("data-sidebar-modal");
    expect(docsThemeGuide).toContain("@pagesmith/site/runtime/standalone");
    expect(runtimeGuide).toContain("getChromeJS()");
    expect(runtimeGuide).toContain("Sidebar modal");
    expect(architectureGuide).toContain("rehype-local-images");
  });

  it("keeps local image examples visible in the shipped example sites", () => {
    const blogExamplePath = join(
      import.meta.dirname,
      "..",
      "..",
      "..",
      "..",
      "examples",
      "blog-site",
      "content",
      "guide",
      "content-layer.md",
    );
    const docsExamplePath = join(
      import.meta.dirname,
      "..",
      "..",
      "..",
      "..",
      "examples",
      "doc-site",
      "content",
      "guide",
      "content-collections.md",
    );

    const blogExample = readFileSync(blogExamplePath, "utf-8");
    const docsExample = readFileSync(docsExamplePath, "utf-8");

    expect(blogExample).toContain("./content-layer-local.svg");
    expect(docsExample).toContain("./content-collections-local.svg");
    expect(docsExample).toContain("layout: page");
  });

  it("ships package-owned bins, AI guidance, and schemas from package manifests", () => {
    const corePackageDir = join(import.meta.dirname, "..", "..", "..", "core");
    const sitePackageDir = join(import.meta.dirname, "..", "..", "..", "site");
    const docsPackageDir = join(import.meta.dirname, "..", "..");
    const corePackagePath = join(corePackageDir, "package.json");
    const sitePackagePath = join(sitePackageDir, "package.json");
    const docsPackagePath = join(docsPackageDir, "package.json");

    const corePackage = JSON.parse(readFileSync(corePackagePath, "utf-8")) as {
      bin?: Record<string, string>;
      files?: string[];
      exports?: Record<string, string | Record<string, string>>;
      ai?: { context?: string; fullContext?: string; agentsDir?: string };
    };
    const sitePackage = JSON.parse(readFileSync(sitePackagePath, "utf-8")) as {
      bin?: Record<string, string>;
      files?: string[];
      exports?: Record<string, string | Record<string, string>>;
      ai?: { context?: string; fullContext?: string; agentsDir?: string };
    };
    const docsPackage = JSON.parse(readFileSync(docsPackagePath, "utf-8")) as {
      bin?: Record<string, string>;
      files?: string[];
      exports?: Record<string, string | Record<string, string>>;
      ai?: {
        context?: string;
        fullContext?: string;
        agentsDir?: string;
        mcp?: { command?: string };
      };
    };

    expect(corePackage.bin?.["pagesmith-core"]).toBe("dist/cli/bin.mjs");
    expect(sitePackage.bin?.pagesmith).toBe("dist/cli/bin.mjs");
    expect(sitePackage.bin?.["pagesmith-site"]).toBe("dist/cli/bin.mjs");
    expect(docsPackage.bin?.["pagesmith-docs"]).toBe("dist/cli/bin.mjs");

    expect(corePackage.files).toContain("skills/");
    expect(corePackage.files).toContain("llms.txt");
    expect(corePackage.files).toContain("llms-full.txt");
    expect(corePackage.exports?.["./skills/*"]).toBe("./skills/*");
    expect(corePackage.exports?.["./llms"]).toBe("./llms.txt");
    expect(corePackage.exports?.["./llms-full"]).toBe("./llms-full.txt");
    expect(corePackage.exports?.["./agents/setup-core"]).toBe(
      "./skills/pagesmith-core-setup/references/setup-core.md",
    );
    expect(corePackage.ai).toEqual(
      expect.objectContaining({
        context: "./llms.txt",
        fullContext: "./llms-full.txt",
        agentsDir: "./skills/pagesmith-core-setup/references",
      }),
    );

    expect(sitePackage.files).toContain("skills/");
    expect(sitePackage.files).toContain("llms.txt");
    expect(sitePackage.files).toContain("llms-full.txt");
    expect(sitePackage.exports?.["./skills/*"]).toBe("./skills/*");
    expect(sitePackage.exports?.["./llms"]).toBe("./llms.txt");
    expect(sitePackage.exports?.["./llms-full"]).toBe("./llms-full.txt");
    expect(sitePackage.exports?.["./agents/setup-site"]).toBe(
      "./skills/pagesmith-site-setup/references/setup-site.md",
    );
    expect(sitePackage.ai).toEqual(
      expect.objectContaining({
        context: "./llms.txt",
        fullContext: "./llms-full.txt",
        agentsDir: "./skills/pagesmith-site-setup/references",
      }),
    );

    expect(docsPackage.files).toEqual(expect.arrayContaining(["skills/", "schemas/"]));
    expect(docsPackage.exports?.["./skills/*"]).toBe("./skills/*");
    expect(docsPackage.exports?.["./llms"]).toBe("./llms.txt");
    expect(docsPackage.exports?.["./llms-full"]).toBe("./llms-full.txt");
    expect(docsPackage.exports?.["./agents/setup-docs"]).toBe(
      "./skills/pagesmith-docs-setup/references/setup-docs.md",
    );
    expect(docsPackage.ai).toEqual(
      expect.objectContaining({
        context: "./llms.txt",
        fullContext: "./llms-full.txt",
        agentsDir: "./skills/pagesmith-docs-setup/references",
      }),
    );
    expect(docsPackage.ai?.mcp?.command).toBe("pagesmith-docs mcp --stdio");

    expect(
      existsSync(join(corePackageDir, "skills/pagesmith-core-setup/references/setup-core.md")),
    ).toBe(true);
    expect(
      existsSync(join(sitePackageDir, "skills/pagesmith-site-setup/references/setup-site.md")),
    ).toBe(true);
    expect(
      existsSync(join(docsPackageDir, "skills/pagesmith-docs-setup/references/setup-docs.md")),
    ).toBe(true);
    expect(existsSync(join(corePackageDir, "llms.txt"))).toBe(true);
    expect(existsSync(join(sitePackageDir, "llms.txt"))).toBe(true);
    expect(existsSync(join(docsPackageDir, "llms.txt"))).toBe(true);
    expect(existsSync(join(docsPackageDir, "schemas", "pagesmith-config.schema.json"))).toBe(true);
  });

  it("keeps committed docs diagram SVGs compatible with img embedding", () => {
    const docsContentDir = join(import.meta.dirname, "..", "..", "..", "..", "docs", "content");
    const diagramsSegment = join("diagrams", "");
    const diagramSvgFiles = collectFiles(
      docsContentDir,
      (filePath) => /(?:-light|-dark)\.svg$/.test(filePath) && filePath.includes(diagramsSegment),
    );

    expect(diagramSvgFiles.length).toBeGreaterThan(0);

    for (const svgFile of diagramSvgFiles) {
      const svg = readFileSync(svgFile, "utf-8");
      expect(svg).not.toContain("<foreignObject");
    }
  });

  it("enforces every internal link in docs/content uses the canonical ./relative/path.md form", () => {
    const docsContentDir = join(import.meta.dirname, "..", "..", "..", "..", "docs", "content");
    const mdFiles = collectFiles(docsContentDir, (p) => p.endsWith(".md"));
    expect(mdFiles.length).toBeGreaterThan(0);

    const FENCED = /```[\s\S]*?```|~~~[\s\S]*?~~~/g;
    const violations: string[] = [];

    for (const file of mdFiles) {
      const src = readFileSync(file, "utf-8").replace(FENCED, (m) => m.replace(/[^\n]/g, " "));
      const linkRe = /(!?)\[[^\]]*\]\(([^)\s]+)\)/g;
      let m: RegExpExecArray | null;
      while ((m = linkRe.exec(src)) !== null) {
        if (m[1] === "!") continue;
        const href = m[2]!;
        if (
          href.startsWith("http://") ||
          href.startsWith("https://") ||
          href.startsWith("mailto:") ||
          href.startsWith("tel:") ||
          href.startsWith("//") ||
          href.startsWith("#") ||
          href.startsWith("data:")
        )
          continue;
        // Exempt site-absolute asset passthrough URLs (bundled prompts,
        // llms indexes, schemas, per-package indexes, static assets).
        if (
          href.startsWith("/prompts/") ||
          href.startsWith("/packages/") ||
          href.startsWith("/schemas/") ||
          href.startsWith("/llms")
        )
          continue;
        // Exempt any site-absolute URL ending in a non-markdown file
        // extension (favicon.svg, static images, etc.).
        const cleanHref = href.split("#")[0]!.split("?")[0]!;
        if (
          href.startsWith("/") &&
          /\.[a-z0-9]+$/i.test(cleanHref) &&
          !/\.(md|mdx)$/i.test(cleanHref)
        )
          continue;
        if (href.startsWith("/") || !/\.(md|mdx)(?:[?#]|$)/.test(href)) {
          violations.push(`${file}: ${href}`);
        }
      }
    }

    expect(violations, violations.slice(0, 10).join("\n")).toEqual([]);
  });

  it("requires every pagesmith.config.json5 assets URL to be referenced from docs/content", () => {
    const repoRoot = join(import.meta.dirname, "..", "..", "..", "..");
    const docsConfigPath = join(repoRoot, "pagesmith.config.json5");
    const config = JSON5.parse(readFileSync(docsConfigPath, "utf-8")) as {
      basePath?: string;
      assets?: Record<string, string[]>;
    };
    const basePath = (config.basePath ?? "").replace(/\/$/, "");
    const contentDir = join(repoRoot, "docs", "content");
    const mdFiles = collectFiles(contentDir, (p) => p.endsWith(".md"));
    const haystack = mdFiles.map((f) => readFileSync(f, "utf-8")).join("\n");

    const missing: string[] = [];
    for (const [prefix, sources] of Object.entries(config.assets ?? {})) {
      const cleanPrefix = prefix === "/" ? "" : prefix.replace(/\/$/, "");
      for (const src of sources) {
        const base = src.split("/").pop() ?? src;
        const publicUrl = `${cleanPrefix}/${base}`;
        if (!haystack.includes(publicUrl) && !haystack.includes(`${basePath}${publicUrl}`)) {
          missing.push(`${prefix}: ${publicUrl}`);
        }
      }
    }
    expect(missing).toEqual([]);
  });
});
