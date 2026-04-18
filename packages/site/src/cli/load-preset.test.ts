import { afterEach, describe, expect, it } from "vite-plus/test";
import { mkdtempSync, rmSync, writeFileSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { pathToFileURL } from "url";
import { resolveSitePresetSpecifier } from "../config.js";
import {
  defaultPresetSpecifier,
  extractPresetArgv,
  loadSitePreset,
  resolvePresetSpecifier,
} from "./load-preset.js";

describe("site preset loading", () => {
  let tempDir = "";
  const originalPresetEnv = process.env.PAGESMITH_PRESET;

  afterEach(() => {
    process.env.PAGESMITH_PRESET = originalPresetEnv;
    if (tempDir) {
      rmSync(tempDir, { recursive: true, force: true });
      tempDir = "";
    }
  });

  it("extracts preset flags and keeps the remaining argv intact", () => {
    expect(
      extractPresetArgv([
        "build",
        "--preset",
        "@pagesmith/custom",
        "--config",
        "./pagesmith.config.json5",
      ]),
    ).toEqual({
      specifier: "@pagesmith/custom",
      rest: ["build", "--config", "./pagesmith.config.json5"],
    });

    expect(extractPresetArgv(["dev", "--preset=@pagesmith/docs", "--open"])).toEqual({
      specifier: "@pagesmith/docs",
      rest: ["dev", "--open"],
    });
  });

  it("resolves preset specifiers from config and environment", () => {
    tempDir = mkdtempSync(join(tmpdir(), "ps-site-preset-config-"));
    const configPath = join(tempDir, "pagesmith.config.json5");

    writeFileSync(configPath, `{ preset: '@pagesmith/site', presets: ['ignored'] }`, "utf-8");
    expect(resolveSitePresetSpecifier(configPath)).toBe("@pagesmith/site/preset");
    expect(defaultPresetSpecifier(configPath)).toBe("@pagesmith/site/preset");

    writeFileSync(configPath, `{ presets: ['@pagesmith/docs'] }`, "utf-8");
    expect(resolveSitePresetSpecifier(configPath)).toBe("@pagesmith/docs/preset");

    process.env.PAGESMITH_PRESET = "@pagesmith/example";
    expect(resolveSitePresetSpecifier(join(tempDir, "missing.config.json5"))).toBe(
      "@pagesmith/example",
    );
    expect(defaultPresetSpecifier(join(tempDir, "missing.config.json5"))).toBe(
      "@pagesmith/example",
    );
    expect(resolvePresetSpecifier(undefined, join(tempDir, "missing.config.json5"))).toBe(
      "@pagesmith/example",
    );
  });

  it("falls back to the site preset when nothing else selects a preset", () => {
    tempDir = mkdtempSync(join(tmpdir(), "ps-site-preset-default-"));
    const missingConfigPath = join(tempDir, "pagesmith.config.json5");

    delete process.env.PAGESMITH_PRESET;

    expect(defaultPresetSpecifier(missingConfigPath)).toBe("@pagesmith/site/preset");
    expect(resolvePresetSpecifier(undefined, missingConfigPath)).toBe("@pagesmith/site/preset");
  });

  it("loads preset factories from alternate export names", async () => {
    tempDir = mkdtempSync(join(tmpdir(), "ps-site-preset-module-"));
    const presetPath = join(tempDir, "preset.mjs");
    writeFileSync(
      presetPath,
      [
        "export function docsPreset() {",
        "  return {",
        "    build: async () => 'ok',",
        "    preview: async () => undefined,",
        "  }",
        "}",
        "",
      ].join("\n"),
      "utf-8",
    );

    const preset = await loadSitePreset(pathToFileURL(presetPath).href);
    expect(typeof preset.build).toBe("function");
    expect(typeof preset.preview).toBe("function");
  });

  it("rejects modules without a valid preset factory", async () => {
    tempDir = mkdtempSync(join(tmpdir(), "ps-site-preset-invalid-"));
    const presetPath = join(tempDir, "preset.mjs");
    writeFileSync(presetPath, "export const preset = { build() {} }\n", "utf-8");

    await expect(loadSitePreset(pathToFileURL(presetPath).href)).rejects.toThrow(
      "must export default, docsPreset, sitePreset, or preset as a function",
    );
  });
});
