/**
 * Image-zoom runtime tests — exercises modal lifecycle, dimension fitting,
 * zoom clamps, Ctrl+wheel zoom, and the data-zoom-src-light/-dark theme swap.
 * Uses a real jsdom window/document so the runtime behaves as it would in a
 * browser without us having to mock every DOM surface it touches.
 */

import { JSDOM } from "jsdom";
import { afterEach, beforeEach, describe, expect, it } from "vite-plus/test";

type RuntimeGlobals = typeof globalThis & {
  window?: Window & typeof globalThis;
  document?: Document;
  HTMLElement?: typeof HTMLElement;
  HTMLImageElement?: typeof HTMLImageElement;
  HTMLButtonElement?: typeof HTMLButtonElement;
  Element?: typeof Element;
  Node?: typeof Node;
  MutationObserver?: typeof MutationObserver;
  WheelEvent?: typeof WheelEvent;
  KeyboardEvent?: typeof KeyboardEvent;
  MouseEvent?: typeof MouseEvent;
  Event?: typeof Event;
  navigator?: Navigator;
};

const globals = globalThis as RuntimeGlobals;
const original: Partial<RuntimeGlobals> = {};
const RUNTIME_FLAG = "__pagesmithImageZoomRuntime";

function installDom(html: string): void {
  const dom = new JSDOM(html, {
    url: "https://test.local/",
    pretendToBeVisual: true,
  });
  // navigator is a non-writable getter on Node's global; we deliberately skip
  // it. The runtime only reads navigator via matchMedia (window) and clipboard
  // (we don't touch clipboard here).
  for (const key of [
    "window",
    "document",
    "HTMLElement",
    "HTMLImageElement",
    "HTMLButtonElement",
    "Element",
    "Node",
    "MutationObserver",
    "WheelEvent",
    "KeyboardEvent",
    "MouseEvent",
    "Event",
  ] as const) {
    original[key] = (globals as Record<string, unknown>)[key] as never;
    try {
      Object.defineProperty(globals, key, {
        configurable: true,
        writable: true,
        value: (dom.window as unknown as Record<string, unknown>)[key],
      });
    } catch {
      // Some globals (e.g. navigator) are read-only — just skip them.
    }
  }
  Object.defineProperty(dom.window, "innerWidth", {
    value: 1600,
    configurable: true,
  });
  Object.defineProperty(dom.window, "innerHeight", {
    value: 900,
    configurable: true,
  });
  // Make naturalWidth/Height settable for our test images.
  Object.defineProperty(dom.window.HTMLImageElement.prototype, "naturalWidth", {
    configurable: true,
    get() {
      return Number(this.getAttribute("data-test-natural-width") ?? "0");
    },
  });
  Object.defineProperty(dom.window.HTMLImageElement.prototype, "naturalHeight", {
    configurable: true,
    get() {
      return Number(this.getAttribute("data-test-natural-height") ?? "0");
    },
  });
}

function teardownDom(): void {
  for (const key of Object.keys(original) as (keyof RuntimeGlobals)[]) {
    try {
      if (original[key] === undefined) {
        delete (globals as Record<string, unknown>)[key];
      } else {
        Object.defineProperty(globals, key, {
          configurable: true,
          writable: true,
          value: original[key],
        });
      }
    } catch {
      // Ignore: some globals can't be cleaned up across runs.
    }
  }
  for (const key of Object.keys(original)) delete (original as Record<string, unknown>)[key];
}

function resetRuntime(): void {
  delete (globals as Record<string, unknown>)[RUNTIME_FLAG];
  if (typeof document !== "undefined") {
    for (const node of document.querySelectorAll(".ps-img-zoom-modal")) node.remove();
    document.documentElement.classList.remove(
      "ps-img-zoom-open",
      "color-scheme-dark",
      "color-scheme-light",
    );
    document.body?.classList.remove("ps-img-zoom-open");
  }
}

// Imported once because vite-plus / vite can't dynamically import with cache
// busting. Each test resets the runtime flag + DOM in resetRuntime() and the
// runtime's `ensureModal` re-creates the singleton when its DOM was removed.
import * as imageZoomModule from "./image-zoom.js";

function loadRuntime(): typeof import("./image-zoom.js") {
  resetRuntime();
  return imageZoomModule;
}

function makeFigure(opts: {
  src?: string;
  zoomSrc?: string;
  zoomType?: string;
  themedLight?: { src: string; type: string };
  themedDark?: { src: string; type: string };
  width?: number;
  height?: number;
}): HTMLElement {
  const figure = document.createElement("figure");
  figure.className = "ps-figure ps-figure-zoomable";

  const img = document.createElement("img");
  img.alt = "Test";
  img.src = opts.src ?? "/img/hero.webp";
  if (opts.zoomSrc) img.setAttribute("data-zoom-src", opts.zoomSrc);
  if (opts.zoomType) img.setAttribute("data-zoom-type", opts.zoomType);
  if (opts.themedLight) {
    img.setAttribute("data-zoom-src-light", opts.themedLight.src);
    img.setAttribute("data-zoom-type-light", opts.themedLight.type);
  }
  if (opts.themedDark) {
    img.setAttribute("data-zoom-src-dark", opts.themedDark.src);
    img.setAttribute("data-zoom-type-dark", opts.themedDark.type);
  }
  if (opts.width) img.setAttribute("data-test-natural-width", String(opts.width));
  if (opts.height) img.setAttribute("data-test-natural-height", String(opts.height));

  const button = document.createElement("button");
  button.type = "button";
  button.className = "ps-img-zoom-btn";
  button.toggleAttribute("hidden", true);
  button.setAttribute("data-ps-img-zoom-btn", "");
  button.setAttribute("aria-label", "Zoom image");

  figure.append(img, button);
  document.body.appendChild(figure);
  return figure;
}

function getModal(): HTMLElement | null {
  return document.querySelector<HTMLElement>(".ps-img-zoom-modal");
}

function getModalImg(): HTMLImageElement | null {
  return document.querySelector<HTMLImageElement>(".ps-img-zoom-img");
}

function getZoomLevelText(): string {
  return document.querySelector<HTMLElement>(".ps-img-zoom-level")?.textContent ?? "";
}

function clickButtonInsideFigure(figure: HTMLElement): void {
  const btn = figure.querySelector<HTMLButtonElement>("[data-ps-img-zoom-btn]");
  btn?.click();
}

function clickToolbarButton(label: string): void {
  const buttons = document.querySelectorAll<HTMLButtonElement>(".ps-img-zoom-toolbar button");
  for (const btn of buttons) {
    if (btn.getAttribute("aria-label") === label) {
      btn.click();
      return;
    }
  }
}

describe("initImageZoom", () => {
  beforeEach(() => {
    installDom("<!doctype html><html><body></body></html>");
  });

  afterEach(() => {
    resetRuntime();
    teardownDom();
  });

  it("unhides every zoom button when JS initializes", async () => {
    const figure = makeFigure({
      zoomSrc: "/img/hero.zoom.webp",
      zoomType: "image/webp",
      width: 800,
      height: 400,
    });
    const button = figure.querySelector<HTMLButtonElement>("[data-ps-img-zoom-btn]")!;
    expect(button.hasAttribute("hidden")).toBe(true);

    const { initImageZoom } = loadRuntime();
    initImageZoom();

    expect(button.hasAttribute("hidden")).toBe(false);
  });

  it("opens the singleton modal and fits the image into the constrained viewport axis", async () => {
    const figure = makeFigure({
      zoomSrc: "/img/hero.zoom.webp",
      zoomType: "image/webp",
      // Square image in a 16:9 viewport (1600x900) → constrained by height (900).
      width: 1000,
      height: 1000,
    });

    const { initImageZoom } = loadRuntime();
    initImageZoom();
    clickButtonInsideFigure(figure);

    const modal = getModal();
    expect(modal).not.toBeNull();
    expect(modal!.hidden).toBe(false);

    const img = getModalImg()!;
    expect(img.src).toContain("/img/hero.zoom.webp");
    // 100% should equal min(vw/w, vh/h) * w = 900 in both dimensions for a square.
    expect(img.style.width).toBe("900px");
    expect(img.style.height).toBe("900px");
    expect(getZoomLevelText()).toBe("100%");
  });

  it("clamps zoom out at 50% and raster zoom in at 400%", async () => {
    const figure = makeFigure({
      zoomSrc: "/img/hero.zoom.webp",
      zoomType: "image/webp",
      width: 1000,
      height: 1000,
    });

    const { initImageZoom } = loadRuntime();
    initImageZoom();
    clickButtonInsideFigure(figure);

    // Zoom in 100 times (way past the 400% raster cap).
    for (let i = 0; i < 100; i += 1) clickToolbarButton("Zoom in");
    expect(getZoomLevelText()).toBe("400%");

    // Zoom out 100 times (way past the 50% min).
    for (let i = 0; i < 100; i += 1) clickToolbarButton("Zoom out");
    expect(getZoomLevelText()).toBe("50%");
  });

  it("allows SVG sources to zoom up to 1000%", async () => {
    const figure = makeFigure({
      src: "/img/diagram.svg",
      zoomSrc: "/img/diagram.svg",
      zoomType: "image/svg+xml",
      width: 800,
      height: 400,
    });

    const { initImageZoom } = loadRuntime();
    initImageZoom();
    clickButtonInsideFigure(figure);

    for (let i = 0; i < 200; i += 1) clickToolbarButton("Zoom in");
    expect(getZoomLevelText()).toBe("1000%");
  });

  it("falls back to the source img's src when no data-zoom-src is present (SVG path)", async () => {
    const figure = makeFigure({
      src: "/img/diagram.svg",
      // Intentionally no zoomSrc / zoomType — SVG should resolve via the
      // displayed src directly.
      width: 800,
      height: 400,
    });

    const { initImageZoom } = loadRuntime();
    initImageZoom();
    clickButtonInsideFigure(figure);

    const modalImg = getModalImg()!;
    expect(modalImg.src).toContain("/img/diagram.svg");
    // SVG limits should still apply via .svg extension detection.
    for (let i = 0; i < 200; i += 1) clickToolbarButton("Zoom in");
    expect(getZoomLevelText()).toBe("1000%");
  });

  it("zooms via Ctrl+wheel and does not zoom on plain wheel", async () => {
    const figure = makeFigure({
      zoomSrc: "/img/hero.zoom.webp",
      zoomType: "image/webp",
      width: 1000,
      height: 1000,
    });

    const { initImageZoom } = loadRuntime();
    initImageZoom();
    clickButtonInsideFigure(figure);

    const modal = getModal()!;
    const startLevel = getZoomLevelText();

    // Plain wheel: should not zoom.
    modal.dispatchEvent(new window.WheelEvent("wheel", { deltaY: -100, bubbles: true }));
    expect(getZoomLevelText()).toBe(startLevel);

    // Ctrl+wheel up: zoom in by ~10%.
    modal.dispatchEvent(
      new window.WheelEvent("wheel", {
        deltaY: -100,
        ctrlKey: true,
        bubbles: true,
        cancelable: true,
      }),
    );
    expect(getZoomLevelText()).toBe("110%");

    modal.dispatchEvent(
      new window.WheelEvent("wheel", {
        deltaY: 100,
        ctrlKey: true,
        bubbles: true,
        cancelable: true,
      }),
    );
    expect(getZoomLevelText()).toBe("100%");
  });

  it("closes on the close button and restores body scroll", async () => {
    const figure = makeFigure({
      zoomSrc: "/img/hero.zoom.webp",
      zoomType: "image/webp",
      width: 800,
      height: 400,
    });

    const { initImageZoom } = loadRuntime();
    initImageZoom();
    clickButtonInsideFigure(figure);
    expect(document.body.classList.contains("ps-img-zoom-open")).toBe(true);

    clickToolbarButton("Close");

    const modal = getModal()!;
    expect(modal.hidden).toBe(true);
    expect(document.body.classList.contains("ps-img-zoom-open")).toBe(false);
  });

  it("picks the dark themed source when color-scheme-dark is forced and swaps on theme change", async () => {
    const figure = makeFigure({
      themedLight: { src: "/img/chart-light.zoom.webp", type: "image/webp" },
      themedDark: { src: "/img/chart-dark.zoom.webp", type: "image/webp" },
      width: 800,
      height: 400,
    });

    const { initImageZoom } = loadRuntime();
    document.documentElement.classList.add("color-scheme-dark");
    initImageZoom();
    clickButtonInsideFigure(figure);

    const modalImg = getModalImg()!;
    expect(modalImg.src).toContain("/img/chart-dark.zoom.webp");

    // Switch theme → MutationObserver swaps the modal image src.
    document.documentElement.classList.remove("color-scheme-dark");
    document.documentElement.classList.add("color-scheme-light");

    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(modalImg.src).toContain("/img/chart-light.zoom.webp");
  });
});
