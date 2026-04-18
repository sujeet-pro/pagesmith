import { afterEach, describe, expect, it } from "vite-plus/test";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import sharp from "sharp";
import { convert } from "../convert";
import { processMarkdown } from "../markdown/pipeline";

describe("local image markdown enhancements", () => {
  let rootDir = "";

  afterEach(() => {
    if (rootDir) {
      rmSync(rootDir, { recursive: true, force: true });
      rootDir = "";
    }
  });

  it("wraps local JPEG images in figure+picture with avif/webp sources", async () => {
    rootDir = mkdtempSync(join(tmpdir(), "ps-core-images-"));
    const contentDir = join(rootDir, "content");
    mkdirSync(contentDir, { recursive: true });

    const markdownPath = join(contentDir, "post.md");
    const imagePath = join(contentDir, "hero.jpg");
    writeFileSync(markdownPath, "![Hero](./hero.jpg)\n", "utf-8");

    await sharp({
      create: { width: 40, height: 20, channels: 3, background: "#ff0066" },
    })
      .jpeg()
      .toFile(imagePath);

    const result = await processMarkdown("![Hero](./hero.jpg)", undefined, {
      content: "![Hero](./hero.jpg)",
      frontmatter: {},
      fileData: { pagesmithFilePath: markdownPath },
    });

    expect(result.html).toContain('<figure class="ps-figure">');
    expect(result.html).toContain("<picture>");
    expect(result.html).toContain('srcset="./hero.avif"');
    expect(result.html).toContain('type="image/avif"');
    expect(result.html).toContain('srcset="./hero.webp"');
    expect(result.html).toContain('type="image/webp"');
    // Fallback img src uses webp
    expect(result.html).toContain(
      '<img src="./hero.webp" alt="Hero" width="40" height="20" style="max-width:min(40px,100%)">',
    );
  });

  it("wraps local PNG images in figure+picture with avif/webp sources", async () => {
    rootDir = mkdtempSync(join(tmpdir(), "ps-core-images-"));
    const contentDir = join(rootDir, "content");
    mkdirSync(contentDir, { recursive: true });

    const markdownPath = join(contentDir, "post.md");
    const imagePath = join(contentDir, "chart.png");

    await sharp({
      create: { width: 100, height: 50, channels: 4, background: "#00ff0066" },
    })
      .png()
      .toFile(imagePath);

    const result = await processMarkdown("![Chart](./chart.png)", undefined, {
      content: "![Chart](./chart.png)",
      frontmatter: {},
      fileData: { pagesmithFilePath: markdownPath },
    });

    expect(result.html).toContain('<figure class="ps-figure">');
    expect(result.html).toContain('srcset="./chart.avif"');
    expect(result.html).toContain('srcset="./chart.webp"');
    expect(result.html).toContain('src="./chart.webp"');
  });

  it("adds figcaption from markdown title attribute", async () => {
    rootDir = mkdtempSync(join(tmpdir(), "ps-core-images-"));
    const contentDir = join(rootDir, "content");
    mkdirSync(contentDir, { recursive: true });

    const markdownPath = join(contentDir, "post.md");
    const imagePath = join(contentDir, "hero.jpg");

    await sharp({
      create: { width: 40, height: 20, channels: 3, background: "#ff0066" },
    })
      .jpeg()
      .toFile(imagePath);

    const result = await processMarkdown('![Hero](./hero.jpg "My caption")', undefined, {
      content: '![Hero](./hero.jpg "My caption")',
      frontmatter: {},
      fileData: { pagesmithFilePath: markdownPath },
    });

    expect(result.html).toContain("<figcaption>My caption</figcaption>");
    expect(result.html).toContain('alt="Hero"');
    // title should NOT be on the img element
    expect(result.html).not.toContain('title="My caption"');
  });

  it("wraps SVG in figure without picture element", async () => {
    rootDir = mkdtempSync(join(tmpdir(), "ps-core-images-"));
    const contentDir = join(rootDir, "content");
    mkdirSync(contentDir, { recursive: true });

    const markdownPath = join(contentDir, "post.md");
    const imagePath = join(contentDir, "icon.svg");
    writeFileSync(
      imagePath,
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 60"><rect width="120" height="60" fill="#111"/></svg>',
      "utf-8",
    );

    const result = await processMarkdown("![Icon](./icon.svg)", undefined, {
      content: "![Icon](./icon.svg)",
      frontmatter: {},
      fileData: { pagesmithFilePath: markdownPath },
    });

    expect(result.html).toContain('<figure class="ps-figure">');
    expect(result.html).toContain('src="./icon.svg"');
    expect(result.html).toContain('width="120"');
    expect(result.html).not.toContain("<picture>");
  });

  it("derives SVG intrinsic dimensions from viewBox for raw html img tags", async () => {
    rootDir = mkdtempSync(join(tmpdir(), "ps-core-images-"));
    const contentDir = join(rootDir, "content");
    mkdirSync(contentDir, { recursive: true });

    const markdownPath = join(contentDir, "icons.md");
    const imagePath = join(contentDir, "icon.svg");
    writeFileSync(markdownPath, '<img src="./icon.svg" alt="Icon">\n', "utf-8");
    writeFileSync(
      imagePath,
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 60"><rect width="120" height="60" fill="#111"/></svg>',
      "utf-8",
    );

    const result = await processMarkdown('<img src="./icon.svg" alt="Icon">', undefined, {
      content: '<img src="./icon.svg" alt="Icon">',
      frontmatter: {},
      fileData: { pagesmithFilePath: markdownPath },
    });

    expect(result.html).toContain('width="120"');
    expect(result.html).toContain('height="60"');
    expect(result.html).not.toContain("<picture>");
  });

  it("lets convert() reuse local image enhancements when sourcePath is provided", async () => {
    rootDir = mkdtempSync(join(tmpdir(), "ps-core-images-"));
    const contentDir = join(rootDir, "content");
    mkdirSync(contentDir, { recursive: true });

    const markdownPath = join(contentDir, "post.md");
    const imagePath = join(contentDir, "hero.jpg");

    await sharp({
      create: { width: 48, height: 24, channels: 3, background: "#00aa66" },
    })
      .jpeg()
      .toFile(imagePath);

    const result = await convert("![Hero](./hero.jpg)", { sourcePath: markdownPath });

    expect(result.html).toContain('<figure class="ps-figure">');
    expect(result.html).toContain('srcset="./hero.avif"');
    expect(result.html).toContain('srcset="./hero.webp"');
    expect(result.html).toContain('src="./hero.webp"');
  });

  it("lets convert() match entry-style parent refs when assetRoot is provided", async () => {
    rootDir = mkdtempSync(join(tmpdir(), "ps-core-images-"));
    const contentDir = join(rootDir, "content");
    const guideDir = join(contentDir, "guide");
    const sharedDir = join(contentDir, "shared");
    mkdirSync(guideDir, { recursive: true });
    mkdirSync(sharedDir, { recursive: true });

    const markdownPath = join(guideDir, "post.md");
    const imagePath = join(sharedDir, "hero.jpg");

    await sharp({
      create: { width: 52, height: 26, channels: 3, background: "#1144aa" },
    })
      .jpeg()
      .toFile(imagePath);

    const result = await convert("![Hero](../shared/hero.jpg)", {
      sourcePath: markdownPath,
      assetRoot: contentDir,
    });

    expect(result.html).toContain('srcset="../shared/hero.avif"');
    expect(result.html).toContain('src="../shared/hero.webp"');
  });

  it("treats bare relative image filenames as local refs", async () => {
    rootDir = mkdtempSync(join(tmpdir(), "ps-core-images-"));
    const contentDir = join(rootDir, "content");
    mkdirSync(contentDir, { recursive: true });

    const markdownPath = join(contentDir, "post.md");
    const imagePath = join(contentDir, "hero.jpg");

    await sharp({
      create: { width: 36, height: 18, channels: 3, background: "#008866" },
    })
      .jpeg()
      .toFile(imagePath);

    const result = await processMarkdown("![Hero](hero.jpg)", undefined, {
      content: "![Hero](hero.jpg)",
      frontmatter: {},
      fileData: { pagesmithFilePath: markdownPath },
    });

    expect(result.html).toContain('<figure class="ps-figure">');
    expect(result.html).toContain('srcset="hero.avif"');
    expect(result.html).toContain('src="hero.webp"');
  });

  it("allows parent-directory image refs when they stay inside the declared asset root", async () => {
    rootDir = mkdtempSync(join(tmpdir(), "ps-core-images-"));
    const contentDir = join(rootDir, "content");
    const guideDir = join(contentDir, "guide");
    const sharedDir = join(contentDir, "shared");
    mkdirSync(guideDir, { recursive: true });
    mkdirSync(sharedDir, { recursive: true });

    const markdownPath = join(guideDir, "post.md");
    const imagePath = join(sharedDir, "hero.jpg");

    await sharp({
      create: { width: 64, height: 32, channels: 3, background: "#3355ff" },
    })
      .jpeg()
      .toFile(imagePath);

    const result = await processMarkdown("![Hero](../shared/hero.jpg)", undefined, {
      content: "![Hero](../shared/hero.jpg)",
      frontmatter: {},
      fileData: {
        pagesmithFilePath: markdownPath,
        pagesmithAssetRoot: contentDir,
      },
    });

    expect(result.html).toContain('srcset="../shared/hero.avif"');
    expect(result.html).toContain('src="../shared/hero.webp"');
  });

  it("does not resolve image refs that escape the declared asset root", async () => {
    rootDir = mkdtempSync(join(tmpdir(), "ps-core-images-"));
    const contentDir = join(rootDir, "content");
    const guideDir = join(contentDir, "guide");
    const outsideDir = join(rootDir, "outside");
    mkdirSync(guideDir, { recursive: true });
    mkdirSync(outsideDir, { recursive: true });

    const markdownPath = join(guideDir, "post.md");
    const imagePath = join(outsideDir, "secret.jpg");

    await sharp({
      create: { width: 50, height: 25, channels: 3, background: "#222222" },
    })
      .jpeg()
      .toFile(imagePath);

    const result = await processMarkdown("![Secret](../../outside/secret.jpg)", undefined, {
      content: "![Secret](../../outside/secret.jpg)",
      frontmatter: {},
      fileData: {
        pagesmithFilePath: markdownPath,
        pagesmithAssetRoot: contentDir,
      },
    });

    expect(result.html).not.toContain("<picture>");
    expect(result.html).not.toContain('width="50"');
    expect(result.html).toContain('src="../../outside/secret.jpg"');
  });

  it("only skips picture wrapping for raw html images already inside a picture element", async () => {
    rootDir = mkdtempSync(join(tmpdir(), "ps-core-images-"));
    const contentDir = join(rootDir, "content");
    mkdirSync(contentDir, { recursive: true });

    const markdownPath = join(contentDir, "post.md");
    const imagePath = join(contentDir, "hero.jpg");

    await sharp({
      create: { width: 44, height: 22, channels: 3, background: "#aa5500" },
    })
      .jpeg()
      .toFile(imagePath);

    const result = await processMarkdown(
      '<picture><img src="./hero.jpg" alt="Inside"></picture>\n<img src="./hero.jpg" alt="Outside">',
      undefined,
      {
        content:
          '<picture><img src="./hero.jpg" alt="Inside"></picture>\n<img src="./hero.jpg" alt="Outside">',
        frontmatter: {},
        fileData: { pagesmithFilePath: markdownPath },
      },
    );

    // Inside picture: img stays as-is (no figure wrapping since inside picture already)
    expect(result.html).toContain('alt="Inside"');
    // Outside picture: gets figure + picture wrapping
    expect(result.html).toContain('alt="Outside"');
    expect(result.html).toContain('<figure class="ps-figure">');
  });

  it("never nests a <figure> inside a user-authored <picture> (diagramkit pattern)", async () => {
    rootDir = mkdtempSync(join(tmpdir(), "ps-core-images-"));
    const contentDir = join(rootDir, "content");
    mkdirSync(contentDir, { recursive: true });

    const markdownPath = join(contentDir, "post.md");

    // Theme-aware diagram as authored by diagramkit consumers: a raw
    // <picture> with a dark <source> and a light <img> fallback. Pagesmith
    // must enrich the img (dimensions) but must NOT wrap it in a <figure>
    // while it's still inside the <picture>.
    await sharp({
      create: { width: 90, height: 45, channels: 3, background: "#ffffff" },
    })
      .png()
      .toFile(join(contentDir, "flow-light.png"));
    await sharp({
      create: { width: 90, height: 45, channels: 3, background: "#000000" },
    })
      .png()
      .toFile(join(contentDir, "flow-dark.png"));

    const raw = [
      "<picture>",
      '  <source srcset="./flow-dark.png" media="(prefers-color-scheme: dark)">',
      '  <img src="./flow-light.png" alt="Flow diagram">',
      "</picture>",
    ].join("\n");

    const result = await processMarkdown(raw, undefined, {
      content: raw,
      frontmatter: {},
      fileData: { pagesmithFilePath: markdownPath },
    });

    // Sanity: picture is preserved and the img picked up dimensions.
    expect(result.html).toContain("<picture>");
    expect(result.html).toContain('alt="Flow diagram"');
    expect(result.html).toContain('width="90"');
    expect(result.html).toContain('height="45"');

    // The critical guarantee: no <figure> nested inside the <picture>.
    const pictureBlock = result.html.match(/<picture[\s\S]*?<\/picture>/i)?.[0] ?? "";
    expect(pictureBlock).not.toContain("<figure");
    expect(pictureBlock).not.toContain("</figure>");
  });

  it("preserves author-written <figure><picture> wrappers without double-wrapping", async () => {
    rootDir = mkdtempSync(join(tmpdir(), "ps-core-images-"));
    const contentDir = join(rootDir, "content");
    mkdirSync(contentDir, { recursive: true });

    const markdownPath = join(contentDir, "post.md");

    await sharp({
      create: { width: 60, height: 30, channels: 3, background: "#223344" },
    })
      .jpeg()
      .toFile(join(contentDir, "cover.jpg"));

    const raw = [
      "<figure>",
      "  <picture>",
      '    <source srcset="./cover.jpg" type="image/jpeg">',
      '    <img src="./cover.jpg" alt="Cover">',
      "  </picture>",
      "  <figcaption>Author caption</figcaption>",
      "</figure>",
    ].join("\n");

    const result = await processMarkdown(raw, undefined, {
      content: raw,
      frontmatter: {},
      fileData: { pagesmithFilePath: markdownPath },
    });

    // Exactly one <figure> — no extra wrap.
    expect(result.html.match(/<figure\b/g)?.length).toBe(1);
    expect(result.html).toContain("Author caption");
    // Dimensions applied on the inner <img>.
    expect(result.html).toContain('width="60"');
    expect(result.html).toContain('height="30"');
    const pictureBlock = result.html.match(/<picture[\s\S]*?<\/picture>/i)?.[0] ?? "";
    expect(pictureBlock).not.toContain("<figure");
  });

  it("merges consecutive light/dark image pairs into themed figure", async () => {
    rootDir = mkdtempSync(join(tmpdir(), "ps-core-images-"));
    const contentDir = join(rootDir, "content");
    mkdirSync(contentDir, { recursive: true });

    const markdownPath = join(contentDir, "post.md");

    await sharp({
      create: { width: 80, height: 40, channels: 3, background: "#ffffff" },
    })
      .png()
      .toFile(join(contentDir, "chart-light.png"));

    await sharp({
      create: { width: 80, height: 40, channels: 3, background: "#000000" },
    })
      .png()
      .toFile(join(contentDir, "chart-dark.png"));

    const result = await processMarkdown(
      "![Chart](./chart-light.png)\n![Chart](./chart-dark.png)",
      undefined,
      {
        content: "![Chart](./chart-light.png)\n![Chart](./chart-dark.png)",
        frontmatter: {},
        fileData: { pagesmithFilePath: markdownPath },
      },
    );

    // Should produce a single themed figure, not two separate figures
    expect(result.html).toContain("ps-figure-themed");
    // Dark sources should have prefers-color-scheme media query and data-scheme
    expect(result.html).toContain('media="(prefers-color-scheme: dark)" data-scheme="dark"');
    // Light sources should have data-scheme but no media query
    expect(result.html).toContain(
      'srcset="./chart-light.avif" type="image/avif" data-scheme="light"',
    );
    // Dark sources
    expect(result.html).toContain('srcset="./chart-dark.avif"');
    expect(result.html).toContain('srcset="./chart-dark.webp"');
    // Fallback img uses original light source (not a generated variant)
    expect(result.html).toContain('src="./chart-light.png"');
    // Only one figure
    expect(result.html.match(/ps-figure/g)?.length).toBe(2); // ps-figure + ps-figure-themed
  });
});
