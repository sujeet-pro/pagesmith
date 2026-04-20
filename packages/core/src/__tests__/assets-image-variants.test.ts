import { afterEach, describe, expect, it } from "vite-plus/test";
import { existsSync, mkdirSync, mkdtempSync, rmSync, statSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import sharp from "sharp";
import { collectContentAssets, type ContentAssetMap } from "../assets";
import {
  DISPLAY_MAX_WIDTH,
  ZOOM_MAX_WIDTH,
  ZOOM_VARIANT_SUFFIX,
  emitGeneratedImageVariants,
  getGeneratedImageVariantPath,
  getZoomImageVariantPath,
  renderGeneratedImageVariant,
  renderZoomImageVariant,
} from "../assets/images";

describe("image variant emission", () => {
  let rootDir = "";

  afterEach(() => {
    if (rootDir && existsSync(rootDir)) {
      rmSync(rootDir, { recursive: true, force: true });
      rootDir = "";
    }
  });

  it("derives zoom variant path with the .zoom.webp suffix", () => {
    expect(getZoomImageVariantPath("photo.png")).toBe(`photo${ZOOM_VARIANT_SUFFIX}`);
    expect(getZoomImageVariantPath("nested/dir/cover.jpg")).toBe(
      `nested/dir/cover${ZOOM_VARIANT_SUFFIX}`,
    );
  });

  it("emits webp/avif display variants and a separate zoom variant for each convertible source", async () => {
    rootDir = mkdtempSync(join(tmpdir(), "ps-emit-variants-"));
    const contentDir = join(rootDir, "content");
    const assetsDir = join(rootDir, "assets");
    mkdirSync(contentDir, { recursive: true });
    mkdirSync(assetsDir, { recursive: true });

    const sourcePath = join(contentDir, "hero.png");
    await sharp({
      create: { width: 200, height: 100, channels: 3, background: "#774422" },
    })
      .png()
      .toFile(sourcePath);

    const assets: ContentAssetMap = collectContentAssets([contentDir]);
    await emitGeneratedImageVariants(assetsDir, assets);

    const avifPath = join(assetsDir, getGeneratedImageVariantPath("hero.png", "avif"));
    const webpPath = join(assetsDir, getGeneratedImageVariantPath("hero.png", "webp"));
    const zoomPath = join(assetsDir, getZoomImageVariantPath("hero.png"));

    expect(existsSync(avifPath)).toBe(true);
    expect(existsSync(webpPath)).toBe(true);
    expect(existsSync(zoomPath)).toBe(true);

    // All three should be non-empty.
    expect(statSync(avifPath).size).toBeGreaterThan(0);
    expect(statSync(webpPath).size).toBeGreaterThan(0);
    expect(statSync(zoomPath).size).toBeGreaterThan(0);
  });

  it("never upscales: small sources stay at their native dimensions for both display and zoom", async () => {
    rootDir = mkdtempSync(join(tmpdir(), "ps-emit-variants-"));
    const contentDir = join(rootDir, "content");
    mkdirSync(contentDir, { recursive: true });

    const sourcePath = join(contentDir, "tiny.png");
    await sharp({
      create: { width: 60, height: 30, channels: 3, background: "#112233" },
    })
      .png()
      .toFile(sourcePath);

    const display = await renderGeneratedImageVariant(sourcePath, "webp", {
      maxWidth: DISPLAY_MAX_WIDTH,
    });
    const zoom = await renderZoomImageVariant(sourcePath);

    const displayMeta = await sharp(display).metadata();
    const zoomMeta = await sharp(zoom).metadata();

    expect(displayMeta.width).toBe(60);
    expect(displayMeta.height).toBe(30);
    expect(zoomMeta.width).toBe(60);
    expect(zoomMeta.height).toBe(30);
  });

  it("caps oversized sources at the configured display + zoom widths", async () => {
    rootDir = mkdtempSync(join(tmpdir(), "ps-emit-variants-"));
    const contentDir = join(rootDir, "content");
    mkdirSync(contentDir, { recursive: true });

    // 6000px wide so both caps engage.
    const sourcePath = join(contentDir, "wide.png");
    await sharp({
      create: { width: 6000, height: 3000, channels: 3, background: "#557788" },
    })
      .png()
      .toFile(sourcePath);

    const display = await renderGeneratedImageVariant(sourcePath, "webp", {
      maxWidth: DISPLAY_MAX_WIDTH,
    });
    const zoom = await renderZoomImageVariant(sourcePath);

    const displayMeta = await sharp(display).metadata();
    const zoomMeta = await sharp(zoom).metadata();

    expect(displayMeta.width).toBe(DISPLAY_MAX_WIDTH);
    expect(displayMeta.height).toBe(DISPLAY_MAX_WIDTH / 2); // 2:1 source
    expect(zoomMeta.width).toBe(ZOOM_MAX_WIDTH);
    expect(zoomMeta.height).toBe(ZOOM_MAX_WIDTH / 2);
  });
});
