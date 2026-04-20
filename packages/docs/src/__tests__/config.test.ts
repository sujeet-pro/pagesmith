import { execSync } from "child_process";
import { describe, it, expect, afterEach } from "vite-plus/test";
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";
import {
  detectGitOrigin,
  probeHostedOrigin,
  readJson5File,
  resolveDocsConfig,
  resolveInitOrigin,
  toTitleCase,
  validateConfig,
} from "../config.js";
import type { ResolvedDocsConfig } from "../config.js";

// ---------------------------------------------------------------------------
// toTitleCase
// ---------------------------------------------------------------------------
describe("toTitleCase", () => {
  it("converts a hyphenated string to title case", () => {
    expect(toTitleCase("getting-started")).toBe("Getting Started");
  });

  it("converts an underscored string to title case", () => {
    expect(toTitleCase("api_reference")).toBe("Api Reference");
  });

  it("converts a mix of hyphens and underscores", () => {
    expect(toTitleCase("my-cool_project")).toBe("My Cool Project");
  });

  it("handles a single word without separators", () => {
    expect(toTitleCase("guide")).toBe("Guide");
  });

  it("handles an empty string", () => {
    expect(toTitleCase("")).toBe("");
  });
});

// ---------------------------------------------------------------------------
// readJson5File
// ---------------------------------------------------------------------------
describe("readJson5File", () => {
  it("returns undefined for a non-existent file", () => {
    const result = readJson5File("/tmp/__does_not_exist__.json5");
    expect(result).toBeUndefined();
  });

  it("parses a valid JSON5 file", () => {
    const tmp = mkdtempSync(join(tmpdir(), "ps-readjson5-"));
    const filePath = join(tmp, "test.json5");
    writeFileSync(filePath, '{ name: "test", count: 42 }', "utf-8");

    const result = readJson5File<{ name: string; count: number }>(filePath);
    expect(result).toEqual({ name: "test", count: 42 });

    rmSync(tmp, { recursive: true, force: true });
  });
});

// ---------------------------------------------------------------------------
// resolveDocsConfig
// ---------------------------------------------------------------------------
describe("resolveDocsConfig", () => {
  let tmpDir: string;
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    if (tmpDir && existsSync(tmpDir)) {
      rmSync(tmpDir, { recursive: true, force: true });
    }
    delete process.env.BASE_URL;
    globalThis.fetch = originalFetch;
  });

  function setupTmpConfig(json5Content: string): string {
    tmpDir = mkdtempSync(join(tmpdir(), "ps-resolve-"));
    const configPath = join(tmpDir, "pagesmith.config.json5");
    writeFileSync(configPath, json5Content, "utf-8");
    // Create a content dir so it exists
    mkdirSync(join(tmpDir, "content"), { recursive: true });
    return configPath;
  }

  it("applies default values when config is minimal", () => {
    const configPath = setupTmpConfig("{}");
    const resolved = resolveDocsConfig(configPath);

    expect(resolved.language).toBe("en");
    expect(resolved.description).toBe("Documentation site powered by @pagesmith/docs");
    expect(resolved.origin).toBe("https://example.com");
    expect(resolved.footerLinks).toEqual([]);
    expect(resolved.footerText).toBeUndefined();
    expect(resolved.copyright).toBeUndefined();
    expect(resolved.search.enabled).toBe(true);
    expect(resolved.search.showImages).toBe(false);
    expect(resolved.search.showSubResults).toBe(true);
    expect(resolved.sidebar.collapsible).toBe(true);
    expect(resolved.server).toEqual({
      host: "127.0.0.1",
      devPort: 3000,
      previewPort: 4000,
      strictPort: false,
      logLevel: "info",
    });
  });

  it("preserves user-supplied server fields", () => {
    const configPath = setupTmpConfig(
      "{ server: { host: '0.0.0.0', devPort: 5000, previewPort: 5050, strictPort: true, logLevel: 'verbose' } }",
    );
    const resolved = resolveDocsConfig(configPath);

    expect(resolved.server).toEqual({
      host: "0.0.0.0",
      devPort: 5000,
      previewPort: 5050,
      strictPort: true,
      logLevel: "verbose",
    });
  });

  it("accepts the literal 'auto' for devPort and previewPort", () => {
    const configPath = setupTmpConfig("{ server: { devPort: 'auto', previewPort: 'auto' } }");
    const resolved = resolveDocsConfig(configPath);

    expect(resolved.server.devPort).toBe("auto");
    expect(resolved.server.previewPort).toBe("auto");
  });

  it("throws when devPort is a string that is not a number and not 'auto'", () => {
    const configPath = setupTmpConfig("{ server: { devPort: 'random' } }");
    expect(() => resolveDocsConfig(configPath)).toThrow(/server\.devPort.*"auto".*1.*65535/);
  });

  it("throws when previewPort is out of range", () => {
    const configPath = setupTmpConfig("{ server: { previewPort: 70000 } }");
    expect(() => resolveDocsConfig(configPath)).toThrow(/server\.previewPort.*1.*65535/);
  });

  it("defaults logLevel to 'info' and accepts overrides", () => {
    const defaultPath = setupTmpConfig("{}");
    expect(resolveDocsConfig(defaultPath).server.logLevel).toBe("info");

    rmSync(tmpDir, { recursive: true, force: true });
    const overridePath = setupTmpConfig("{ server: { logLevel: 'warn' } }");
    expect(resolveDocsConfig(overridePath).server.logLevel).toBe("warn");
  });

  it("uses docs and gh-pages defaults when the config file is missing", () => {
    tmpDir = mkdtempSync(join(tmpdir(), "ps-resolve-"));
    mkdirSync(join(tmpDir, "docs"), { recursive: true });

    const resolved = resolveDocsConfig(join(tmpDir, "pagesmith.config.json5"));

    expect(resolved.rootDir).toBe(tmpDir);
    expect(resolved.contentDir).toBe(join(tmpDir, "docs"));
    expect(resolved.outDir).toBe(join(tmpDir, "gh-pages"));
  });

  it("generates a theme-aware default header icon from the site name", () => {
    const configPath = setupTmpConfig('{ name: "Pagesmith" }');
    const resolved = resolveDocsConfig(configPath);

    expect(resolved.icon).toContain('class="doc-default-icon"');
    expect(resolved.icon).toContain('class="doc-default-icon-bg"');
    expect(resolved.icon).toContain('class="doc-default-icon-letter"');
    expect(resolved.icon).toContain(">P</text>");
  });

  it("strips trailing slash from basePath", () => {
    const configPath = setupTmpConfig('{ basePath: "/docs/" }');
    const resolved = resolveDocsConfig(configPath);

    expect(resolved.basePath).toBe("/docs");
  });

  it('normalizes bare "/" basePath to empty string', () => {
    const configPath = setupTmpConfig('{ basePath: "/" }');
    const resolved = resolveDocsConfig(configPath);

    expect(resolved.basePath).toBe("");
  });

  it("uses BASE_URL env variable over config basePath", () => {
    process.env.BASE_URL = "/from-env/";
    const configPath = setupTmpConfig('{ basePath: "/from-config" }');
    const resolved = resolveDocsConfig(configPath);

    expect(resolved.basePath).toBe("/from-env");
  });

  it("resolves asset mappings to absolute paths", () => {
    const configPath = setupTmpConfig('{ assets: { "/": ["llms.txt"] } }');
    const resolved = resolveDocsConfig(configPath);

    expect(resolved.assets.size).toBe(1);
    const rootAssets = resolved.assets.get("/");
    expect(rootAssets).toBeDefined();
    expect(rootAssets![0]).toBe(join(tmpDir, "llms.txt"));
  });

  it("resolves contentDir relative to config root", () => {
    const configPath = setupTmpConfig('{ contentDir: "docs-content" }');
    const resolved = resolveDocsConfig(configPath);

    expect(resolved.contentDir).toBe(join(tmpDir, "docs-content"));
  });

  it("resolves outDir default to gh-pages", () => {
    const configPath = setupTmpConfig("{}");
    const resolved = resolveDocsConfig(configPath);

    expect(resolved.outDir).toBe(join(tmpDir, "gh-pages"));
  });

  it("applies CLI overrides for basePath over env and config", () => {
    process.env.BASE_URL = "/from-env";
    const configPath = setupTmpConfig('{ basePath: "/from-config" }');
    const resolved = resolveDocsConfig(configPath, { basePath: "/from-cli/" });

    expect(resolved.basePath).toBe("/from-cli");
  });

  it("applies CLI overrides for outDir", () => {
    const configPath = setupTmpConfig("{}");
    const resolved = resolveDocsConfig(configPath, { outDir: "/custom/output" });

    expect(resolved.outDir).toBe("/custom/output");
  });

  it("uses name as fallback for title and vice versa", () => {
    const configPath = setupTmpConfig('{ name: "MyProject" }');
    const resolved = resolveDocsConfig(configPath);

    expect(resolved.name).toBe("MyProject");
    expect(resolved.title).toBe("MyProject");
  });

  it("prefers git-derived GitHub Pages origin over package homepage fallback", () => {
    const configPath = setupTmpConfig("{}");
    writeFileSync(
      join(tmpDir, "package.json"),
      JSON.stringify({ homepage: "https://custom.dev" }),
      "utf-8",
    );
    execSync("git init", { cwd: tmpDir, stdio: "ignore" });
    execSync("git remote add origin git@github.com:owner/repo.git", {
      cwd: tmpDir,
      stdio: "ignore",
    });

    const resolved = resolveDocsConfig(configPath);

    expect(resolved.origin).toBe("https://owner.github.io");
  });
});

describe("git origin helpers", () => {
  let tmpDir: string;
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    if (tmpDir && existsSync(tmpDir)) {
      rmSync(tmpDir, { recursive: true, force: true });
    }
    globalThis.fetch = originalFetch;
  });

  it("detects repo owner and repo name from a GitHub origin remote", () => {
    tmpDir = mkdtempSync(join(tmpdir(), "ps-git-origin-"));
    execSync("git init", { cwd: tmpDir, stdio: "ignore" });
    execSync("git remote add origin git@github.com:pagesmith-owner/pagesmith-repo.git", {
      cwd: tmpDir,
      stdio: "ignore",
    });

    const gitInfo = detectGitOrigin(tmpDir);

    expect(gitInfo?.repoOwner).toBe("pagesmith-owner");
    expect(gitInfo?.repoName).toBe("pagesmith-repo");
    expect(gitInfo?.origin).toBe("https://pagesmith-owner.github.io");
    expect(gitInfo?.basePath).toBe("/pagesmith-repo");
  });

  it("uses the redirected hosted origin when probing GitHub Pages", async () => {
    globalThis.fetch = (async () =>
      ({
        url: "https://docs.example.com/landing",
      }) as Response) as typeof fetch;

    await expect(probeHostedOrigin("https://owner.github.io")).resolves.toBe(
      "https://docs.example.com",
    );
  });

  it("falls back to the default GitHub Pages host when probing fails", async () => {
    globalThis.fetch = (async () => {
      throw new Error("network unavailable");
    }) as typeof fetch;

    await expect(probeHostedOrigin("https://owner.github.io")).resolves.toBe(
      "https://owner.github.io",
    );
  });

  it("resolves init origin from a probed GitHub Pages host", async () => {
    tmpDir = mkdtempSync(join(tmpdir(), "ps-init-origin-"));
    execSync("git init", { cwd: tmpDir, stdio: "ignore" });
    execSync("git remote add origin git@github.com:pagesmith-owner/pagesmith-repo.git", {
      cwd: tmpDir,
      stdio: "ignore",
    });

    globalThis.fetch = (async () =>
      ({
        url: "https://docs.example.com/project",
      }) as Response) as typeof fetch;

    await expect(resolveInitOrigin(tmpDir)).resolves.toBe("https://docs.example.com");
  });
});

// ---------------------------------------------------------------------------
// validateConfig
// ---------------------------------------------------------------------------
describe("validateConfig", () => {
  let tmpDir: string;

  afterEach(() => {
    if (tmpDir && existsSync(tmpDir)) {
      rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  function makeConfig(overrides: Partial<ResolvedDocsConfig> = {}): ResolvedDocsConfig {
    tmpDir = mkdtempSync(join(tmpdir(), "ps-validate-"));
    const contentDir = join(tmpDir, "content");
    mkdirSync(contentDir, { recursive: true });

    return {
      rootDir: tmpDir,
      contentDir,
      outDir: join(tmpDir, "gh-pages"),
      publicDir: join(tmpDir, "public"),
      basePath: "",
      trailingSlash: false,
      name: "Test",
      title: "Test Docs",
      description: "A real description",
      origin: "https://mysite.com",
      language: "en",
      footerLinks: [],
      footerText: undefined,
      sidebar: { collapsible: false },
      search: { enabled: true, showImages: false, showSubResults: true, pagefindFlags: [] },
      favicon: false,
      icon: false,
      faviconFallback: false,
      appleTouchIcon: false,
      lastUpdated: true,
      sitemap: true,
      server: {
        host: "127.0.0.1",
        devPort: 3000,
        previewPort: 4000,
        strictPort: false,
        logLevel: "info",
      },
      assets: new Map(),
      ...overrides,
    };
  }

  it("returns no issues for a fully specified valid config", () => {
    const config = makeConfig();
    const issues = validateConfig(config);

    const errors = issues.filter((i) => i.severity === "error");
    expect(errors).toHaveLength(0);
  });

  it("warns when neither name nor title is set by user", () => {
    const config = makeConfig({
      _userConfig: {},
    });
    config.name = config.rootDir.split("/").pop()!;
    config.title = config.rootDir.split("/").pop()!;
    const issues = validateConfig(config);

    const nameIssue = issues.find((i) => i.field === "name");
    expect(nameIssue).toBeDefined();
    expect(nameIssue!.severity).toBe("warn");

    const titleIssue = issues.find((i) => i.field === "title");
    expect(titleIssue).toBeDefined();
    expect(titleIssue!.severity).toBe("warn");
  });

  it("does not warn when name matches directory name but was explicitly set", () => {
    const config = makeConfig();
    const dirName = config.rootDir.split("/").pop()!;
    config.name = dirName;
    config.title = dirName;
    config._userConfig = { name: dirName };
    const issues = validateConfig(config);

    const nameIssue = issues.find((i) => i.field === "name");
    expect(nameIssue).toBeUndefined();

    const titleIssue = issues.find((i) => i.field === "title");
    expect(titleIssue).toBeUndefined();
  });

  it("warns when description is the default placeholder", () => {
    const config = makeConfig({ description: "Documentation site powered by @pagesmith/docs" });
    const issues = validateConfig(config);

    const descIssue = issues.find((i) => i.field === "description");
    expect(descIssue).toBeDefined();
    expect(descIssue!.severity).toBe("warn");
  });

  it("warns when origin is the default example.com", () => {
    const config = makeConfig({ origin: "https://example.com" });
    const issues = validateConfig(config);

    const originIssue = issues.find((i) => i.field === "origin");
    expect(originIssue).toBeDefined();
    expect(originIssue!.severity).toBe("warn");
  });

  it("errors when contentDir does not exist", () => {
    const config = makeConfig({ contentDir: join(tmpDir, "nonexistent-content") });
    const issues = validateConfig(config);

    const contentIssue = issues.find((i) => i.field === "contentDir");
    expect(contentIssue).toBeDefined();
    expect(contentIssue!.severity).toBe("error");
  });

  it("errors when asset source does not exist", () => {
    const assets = new Map<string, string[]>();
    assets.set("/", [join(tmpDir, "missing-file.txt")]);
    const config = makeConfig({ assets });
    const issues = validateConfig(config);

    const assetIssue = issues.find((i) => i.field.startsWith("assets"));
    expect(assetIssue).toBeDefined();
    expect(assetIssue!.severity).toBe("error");
    expect(assetIssue!.message).toContain("missing-file.txt");
  });

  it("errors when a layout file does not exist", () => {
    const config = makeConfig({
      theme: { layouts: { home: "layouts/Home.tsx" } },
    });
    const issues = validateConfig(config);

    const layoutIssue = issues.find((i) => i.field === "theme.layouts.home");
    expect(layoutIssue).toBeDefined();
    expect(layoutIssue!.severity).toBe("error");
    expect(layoutIssue!.message).toContain("Layout file does not exist");
  });

  it("does not error when a layout file exists", () => {
    const config = makeConfig({
      theme: { layouts: { home: "layouts/Home.tsx" } },
    });

    // Create the layout file in the config's rootDir (which makeConfig just set as tmpDir)
    mkdirSync(join(config.rootDir, "layouts"), { recursive: true });
    writeFileSync(
      join(config.rootDir, "layouts", "Home.tsx"),
      "export default () => null",
      "utf-8",
    );

    const issues = validateConfig(config);

    const layoutIssue = issues.find((i) => i.field === "theme.layouts.home");
    expect(layoutIssue).toBeUndefined();
  });

  it("warns when favicon path does not exist", () => {
    const config = makeConfig({ favicon: join(tmpDir, "missing-favicon.svg") });
    const issues = validateConfig(config);

    const faviconIssue = issues.find((i) => i.field === "favicon");
    expect(faviconIssue).toBeDefined();
    expect(faviconIssue!.severity).toBe("warn");
  });
});
