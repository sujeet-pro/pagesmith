import { execSync } from "child_process";
import { describe, it, expect, afterEach } from "vite-plus/test";
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";
import { withBase, resolveDocsConfig } from "../config.js";

// ---------------------------------------------------------------------------
// withBase
// ---------------------------------------------------------------------------
describe("withBase", () => {
  it("returns path unchanged when basePath is empty", () => {
    expect(withBase("", "/about")).toBe("/about");
  });

  it("prefixes path with basePath", () => {
    expect(withBase("/docs", "/about")).toBe("/docs/about");
  });

  it("strips trailing slash from basePath", () => {
    expect(withBase("/docs/", "/about")).toBe("/docs/about");
  });

  it("does not double-prefix when path already starts with basePath", () => {
    expect(withBase("/docs", "/docs/about")).toBe("/docs/about");
  });

  it("handles path without leading slash", () => {
    expect(withBase("/docs", "about")).toBe("/docs/about");
  });

  it('handles root path "/"', () => {
    expect(withBase("/docs", "/")).toBe("/docs/");
  });

  it("handles multiple trailing slashes on basePath", () => {
    expect(withBase("/docs///", "/page")).toBe("/docs/page");
  });

  it("handles empty path", () => {
    expect(withBase("/docs", "")).toBe("/docs/");
  });
});

// ---------------------------------------------------------------------------
// resolveDocsConfig — explicit config values (no git detection)
// ---------------------------------------------------------------------------
describe("resolveDocsConfig smart defaults", () => {
  let tmpDir: string;

  afterEach(() => {
    if (tmpDir && existsSync(tmpDir)) {
      rmSync(tmpDir, { recursive: true, force: true });
    }
    delete process.env.BASE_URL;
  });

  function setupTmpConfig(json5Content: string): string {
    tmpDir = mkdtempSync(join(tmpdir(), "ps-smart-"));
    const configPath = join(tmpDir, "pagesmith.config.json5");
    writeFileSync(configPath, json5Content, "utf-8");
    mkdirSync(join(tmpDir, "content"), { recursive: true });
    return configPath;
  }

  it("uses name as title fallback", () => {
    const configPath = setupTmpConfig('{ name: "MyLib" }');
    const resolved = resolveDocsConfig(configPath);

    expect(resolved.name).toBe("MyLib");
    expect(resolved.title).toBe("MyLib");
  });

  it("uses title as name fallback", () => {
    const configPath = setupTmpConfig('{ title: "My Library Docs" }');
    const resolved = resolveDocsConfig(configPath);

    expect(resolved.name).toBe("My Library Docs");
    expect(resolved.title).toBe("My Library Docs");
  });

  it("keeps name and title separate when both specified", () => {
    const configPath = setupTmpConfig('{ name: "mylib", title: "My Library Documentation" }');
    const resolved = resolveDocsConfig(configPath);

    expect(resolved.name).toBe("mylib");
    expect(resolved.title).toBe("My Library Documentation");
  });

  it("uses package.json description as fallback", () => {
    const configPath = setupTmpConfig("{}");
    writeFileSync(
      join(tmpDir, "package.json"),
      JSON.stringify({ description: "A great library" }),
      "utf-8",
    );

    const resolved = resolveDocsConfig(configPath);

    expect(resolved.description).toBe("A great library");
  });

  it("uses default description when nothing else is available", () => {
    const configPath = setupTmpConfig("{}");

    const resolved = resolveDocsConfig(configPath);

    expect(resolved.description).toBe("Documentation site powered by @pagesmith/docs");
  });

  it("uses package.json homepage as origin fallback", () => {
    const configPath = setupTmpConfig("{}");
    writeFileSync(
      join(tmpDir, "package.json"),
      JSON.stringify({ homepage: "https://myproject.dev" }),
      "utf-8",
    );

    const resolved = resolveDocsConfig(configPath);

    expect(resolved.origin).toBe("https://myproject.dev");
  });

  it("prefers explicit origin over package.json homepage", () => {
    const configPath = setupTmpConfig('{ origin: "https://custom.dev" }');
    writeFileSync(
      join(tmpDir, "package.json"),
      JSON.stringify({ homepage: "https://pkg-homepage.dev" }),
      "utf-8",
    );

    const resolved = resolveDocsConfig(configPath);

    expect(resolved.origin).toBe("https://custom.dev");
  });

  it("defaults lastUpdated to true", () => {
    const configPath = setupTmpConfig("{}");
    const resolved = resolveDocsConfig(configPath);

    expect(resolved.lastUpdated).toBe(true);
  });

  it("uses package.json author as maintainer fallback", () => {
    const configPath = setupTmpConfig("{}");
    writeFileSync(
      join(tmpDir, "package.json"),
      JSON.stringify({ author: "Sujeet Jaiswal <hello@sujeet.pro> (https://sujeet.pro)" }),
      "utf-8",
    );

    const resolved = resolveDocsConfig(configPath);

    expect(resolved.maintainer).toEqual({
      name: "Sujeet Jaiswal",
      link: "https://sujeet.pro",
    });
  });

  it("prefers explicit maintainer over package.json author", () => {
    const configPath = setupTmpConfig(
      '{ maintainer: { name: "Docs Team", link: "https://example.com/docs" } }',
    );
    writeFileSync(
      join(tmpDir, "package.json"),
      JSON.stringify({ author: "Sujeet Jaiswal <hello@sujeet.pro> (https://sujeet.pro)" }),
      "utf-8",
    );

    const resolved = resolveDocsConfig(configPath);

    expect(resolved.maintainer).toEqual({
      name: "Docs Team",
      link: "https://example.com/docs",
    });
  });

  it("resolves copyright defaults from the site name and first git commit year", () => {
    const configPath = setupTmpConfig('{ name: "Acme Docs", copyright: {} }');
    execSync("git init", { cwd: tmpDir, stdio: "ignore" });
    execSync("git add .", { cwd: tmpDir, stdio: "ignore" });
    execSync(
      "git -c user.name=Test -c user.email=126489721+sujeet-pro@users.noreply.github.com commit --allow-empty -m init",
      {
        cwd: tmpDir,
        stdio: "ignore",
        env: {
          ...process.env,
          GIT_AUTHOR_DATE: "2022-01-02T00:00:00Z",
          GIT_COMMITTER_DATE: "2022-01-02T00:00:00Z",
        },
      },
    );

    const resolved = resolveDocsConfig(configPath);

    expect(resolved.copyright).toEqual({
      projectName: "Acme Docs",
      startYear: 2022,
    });
  });

  it("keeps an explicit copyright end year when provided", () => {
    const configPath = setupTmpConfig(
      '{ copyright: { projectName: "Acme Docs", startYear: 2020, endYear: 2025 } }',
    );
    const resolved = resolveDocsConfig(configPath);

    expect(resolved.copyright).toEqual({
      projectName: "Acme Docs",
      startYear: 2020,
      endYear: 2025,
    });
  });

  it("defaults sitemap to true", () => {
    const configPath = setupTmpConfig("{}");
    const resolved = resolveDocsConfig(configPath);

    expect(resolved.sitemap).toBe(true);
  });

  it("resolves homeConfigFile relative to content dir", () => {
    const configPath = setupTmpConfig('{ home: { configFile: "home-data.json5" } }');
    const resolved = resolveDocsConfig(configPath);

    expect(resolved.homeConfigFile).toBe(join(tmpDir, "home-data.json5"));
  });
});

// ---------------------------------------------------------------------------
// resolveDocsConfig — editLink pattern detection
// ---------------------------------------------------------------------------
describe("resolveDocsConfig editLink patterns", () => {
  let tmpDir: string;

  afterEach(() => {
    if (tmpDir && existsSync(tmpDir)) {
      rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  function setupTmpConfig(json5Content: string): string {
    tmpDir = mkdtempSync(join(tmpdir(), "ps-editlink-"));
    const configPath = join(tmpDir, "pagesmith.config.json5");
    writeFileSync(configPath, json5Content, "utf-8");
    mkdirSync(join(tmpDir, "content"), { recursive: true });
    return configPath;
  }

  it("generates GitHub-style edit pattern", () => {
    const configPath = setupTmpConfig('{ editLink: { repo: "https://github.com/user/repo" } }');
    const resolved = resolveDocsConfig(configPath);

    expect(resolved.editLink).toBeDefined();
    expect(resolved.editLink!.editPattern).toBe("https://github.com/user/repo/edit/main");
    expect(resolved.editLink!.branch).toBe("main");
    expect(resolved.editLink!.label).toBe("Edit this page");
  });

  it("generates GitLab-style edit pattern", () => {
    const configPath = setupTmpConfig('{ editLink: { repo: "https://gitlab.com/user/repo" } }');
    const resolved = resolveDocsConfig(configPath);

    expect(resolved.editLink).toBeDefined();
    expect(resolved.editLink!.editPattern).toBe("https://gitlab.com/user/repo/-/edit/main");
  });

  it("generates Bitbucket-style edit pattern", () => {
    const configPath = setupTmpConfig('{ editLink: { repo: "https://bitbucket.org/user/repo" } }');
    const resolved = resolveDocsConfig(configPath);

    expect(resolved.editLink).toBeDefined();
    expect(resolved.editLink!.editPattern).toBe("https://bitbucket.org/user/repo/src/main");
  });

  it("respects custom branch name", () => {
    const configPath = setupTmpConfig(
      '{ editLink: { repo: "https://github.com/user/repo", branch: "develop" } }',
    );
    const resolved = resolveDocsConfig(configPath);

    expect(resolved.editLink!.editPattern).toBe("https://github.com/user/repo/edit/develop");
    expect(resolved.editLink!.branch).toBe("develop");
  });

  it("respects custom label", () => {
    const configPath = setupTmpConfig(
      '{ editLink: { repo: "https://github.com/user/repo", label: "Suggest an edit" } }',
    );
    const resolved = resolveDocsConfig(configPath);

    expect(resolved.editLink!.label).toBe("Suggest an edit");
  });

  it("strips trailing slash from repo URL", () => {
    const configPath = setupTmpConfig('{ editLink: { repo: "https://github.com/user/repo/" } }');
    const resolved = resolveDocsConfig(configPath);

    expect(resolved.editLink!.editPattern).toBe("https://github.com/user/repo/edit/main");
  });

  it("does not set editLink when not configured", () => {
    const configPath = setupTmpConfig("{}");
    const resolved = resolveDocsConfig(configPath);

    expect(resolved.editLink).toBeUndefined();
  });

  it("auto-detects editLink from the git remote when not configured", () => {
    const configPath = setupTmpConfig("{}");
    execSync("git init", { cwd: tmpDir, stdio: "ignore" });
    execSync("git remote add origin git@github.com:user/repo.git", {
      cwd: tmpDir,
      stdio: "ignore",
    });

    const resolved = resolveDocsConfig(configPath);

    expect(resolved.editLink).toBeDefined();
    expect(resolved.editLink!.editPattern).toBe("https://github.com/user/repo/edit/main");
    expect(resolved.editLink!.branch).toBe("main");
    expect(resolved.editLink!.label).toBe("Edit this page");
  });

  it("allows editLink auto-detection to be explicitly disabled", () => {
    const configPath = setupTmpConfig("{ editLink: false }");
    execSync("git init", { cwd: tmpDir, stdio: "ignore" });
    execSync("git remote add origin git@github.com:user/repo.git", {
      cwd: tmpDir,
      stdio: "ignore",
    });

    const resolved = resolveDocsConfig(configPath);

    expect(resolved.editLink).toBeUndefined();
  });
});
