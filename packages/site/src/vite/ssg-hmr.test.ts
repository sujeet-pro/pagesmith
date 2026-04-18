import { describe, expect, it } from "vite-plus/test";
import { extractAssetRelPath, extractRoutePath } from "./ssg-hmr";

describe("extractAssetRelPath", () => {
  it("keeps the full content-relative path after the first assets segment", () => {
    expect(extractAssetRelPath("/docs/assets/guide/assets/diagram.png")).toBe(
      "guide/assets/diagram.png",
    );
  });

  it("decodes percent-encoded asset paths", () => {
    expect(extractAssetRelPath("/docs/assets/guide/foo%20bar.png")).toBe("guide/foo bar.png");
  });

  it("returns undefined for non-asset requests", () => {
    expect(extractAssetRelPath("/docs/guide/intro")).toBeUndefined();
  });
});

describe("extractRoutePath", () => {
  it("drops the base path and strips query strings", () => {
    expect(extractRoutePath("/docs/guide/intro?draft=1", "/docs")).toBe("guide/intro");
  });

  it("treats root requests with query strings as the empty route behind a non-root base", () => {
    expect(extractRoutePath("/?utm=1", "/docs")).toBe("");
  });

  it("decodes percent-encoded route paths", () => {
    expect(extractRoutePath("/docs/guide/foo%20bar?draft=1", "/docs")).toBe("guide/foo bar");
  });
});
