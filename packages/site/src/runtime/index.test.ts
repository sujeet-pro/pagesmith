import { describe, expect, it } from "vite-plus/test";
import {
  getChromeCSSPath,
  getChromeJS,
  getChromeJSPath,
  getContentJS,
  getContentJSPath,
  getRuntimeJS,
  getRuntimeJSPath,
} from "./index.js";

describe("runtime exports", () => {
  it("returns a self-contained chrome runtime source", () => {
    const js = getChromeJS();
    expect(js).toContain("[data-sidebar-toggle]");
    expect(js).toContain('const STORAGE_KEY = "pagesmith-theme"');
    expect(js).toContain("IntersectionObserver");
    expect(js).toContain("initSidebarModal()");
  });

  it("returns a self-contained content runtime source", () => {
    const js = getContentJS();
    expect(js).toContain("data-ps-code-copy");
    expect(js).toContain("ps-code-tabs-ready");
    expect(js).toContain("initCodeBlocks()");
    expect(js).toContain("initCodeTabs()");
  });

  it("returns a self-contained standalone runtime source", () => {
    const js = getRuntimeJS();
    expect(js).toContain("[data-sidebar-toggle]");
    expect(js).toContain("data-ps-code-copy");
    expect(js).toContain("initSidebarModal()");
    expect(js).toContain("initCodeBlocks()");
  });

  it("resolves built runtime entry paths", () => {
    expect(getChromeCSSPath()).toMatch(/chrome\.css$/);
    expect(getChromeJSPath()).toMatch(/runtime[\\/]+chrome\.(mjs|js|ts)$/);
    expect(getContentJSPath()).toMatch(/runtime[\\/]+content\.(mjs|js|ts)$/);
    expect(getRuntimeJSPath()).toMatch(/runtime[\\/]+standalone\.(mjs|js|ts)$/);
  });
});
