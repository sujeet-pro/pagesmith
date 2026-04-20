/**
 * Image-zoom runtime.
 *
 * Progressive enhancement: figures emitted by `rehype-local-images` ship a
 * `<button class="ps-img-zoom-btn" hidden>` next to the image. With JS
 * disabled the button stays hidden via the [hidden] attribute. With JS,
 * we unhide every button on init and a delegated click opens a singleton
 * full-screen modal.
 *
 * Zoom level state:
 *   - 100% = the image fits the constrained viewport axis at the source
 *     aspect ratio (e.g. 16:9 viewport + square image → square sized to
 *     100vh on both sides).
 *   - +/- buttons step by 10%; Ctrl/Cmd+wheel zooms toward/away from the
 *     pointer; plain wheel pans (default scroll on the modal container).
 *   - Clamps: 50% min always; 1000% max for SVG, 400% max for raster.
 *
 * Theme awareness:
 *   - `data-zoom-src-light` / `data-zoom-src-dark` (themed raster pairs) take
 *     precedence; a MutationObserver on `<html>.class` swaps the modal img
 *     src when `color-scheme-light` / `color-scheme-dark` toggles.
 *   - Single `data-zoom-src` (raster) is used when present.
 *   - Otherwise we mirror the source `<img>` `currentSrc` / `src`. This is
 *     the SVG path (single + themed) — the displayed `<img>` is already full
 *     quality, and themed `<picture>` swaps `currentSrc` natively. We re-read
 *     `currentSrc` whenever `<html>.class` changes so themed SVG keeps in
 *     sync with the page. The runtime never mutates the source image.
 */

const RUNTIME_KEY = "__pagesmithImageZoomRuntime";
const SCHEME_DARK_CLASS = "color-scheme-dark";
const SCHEME_LIGHT_CLASS = "color-scheme-light";
const DARK_MEDIA_QUERY = "(prefers-color-scheme: dark)";
const ZOOM_STEP = 0.1;
const MIN_ZOOM = 0.5;
const MAX_ZOOM_RASTER = 4;
const MAX_ZOOM_SVG = 10;
const BODY_OPEN_CLASS = "ps-img-zoom-open";

type ZoomScheme = "light" | "dark" | "auto";

type ZoomSource = {
  src: string;
  type: string;
  isSvg: boolean;
  themedLight?: { src: string; type: string };
  themedDark?: { src: string; type: string };
  /**
   * Reference to the source `<img>` in the page. Used as a fallback when no
   * `data-zoom-src*` attrs are present (SVG, themed `<picture>`, or any image
   * we can serve at native resolution from the page DOM).
   */
  sourceImg: HTMLImageElement;
  /**
   * True when the modal img must mirror `sourceImg.currentSrc` (no
   * `data-zoom-src*` was provided). For themed `<picture>` sources this
   * means re-reading currentSrc on every theme change.
   */
  mirrorLiveSrc: boolean;
  baseWidth: number;
  baseHeight: number;
  alt: string;
};

type ModalRefs = {
  root: HTMLElement;
  stage: HTMLElement;
  img: HTMLImageElement;
  level: HTMLElement;
  zoomIn: HTMLButtonElement;
  zoomOut: HTMLButtonElement;
  reset: HTMLButtonElement;
  close: HTMLButtonElement;
};

type ZoomState = {
  scale: number;
  fitWidth: number;
  fitHeight: number;
  source: ZoomSource;
  trigger: HTMLElement | null;
  themeObserver?: MutationObserver;
};

let modalRefs: ModalRefs | undefined;
let activeState: ZoomState | undefined;

function getEffectiveScheme(): "light" | "dark" {
  if (typeof document === "undefined") return "light";
  const cl = document.documentElement.classList;
  if (cl.contains(SCHEME_DARK_CLASS)) return "dark";
  if (cl.contains(SCHEME_LIGHT_CLASS)) return "light";
  if (typeof window !== "undefined" && window.matchMedia) {
    return window.matchMedia(DARK_MEDIA_QUERY).matches ? "dark" : "light";
  }
  return "light";
}

function unhideAllZoomButtons(): void {
  const buttons = document.querySelectorAll<HTMLElement>(".ps-img-zoom-btn[hidden]");
  for (const button of buttons) {
    button.removeAttribute("hidden");
  }
}

function pickImageInsideFigure(figure: HTMLElement): HTMLImageElement | null {
  // Prefer the visible img (the rendered one inside <picture> when present).
  return figure.querySelector<HTMLImageElement>("img");
}

function readDataAttr(el: HTMLElement, name: string): string | undefined {
  const value = el.getAttribute(name);
  return value && value.length > 0 ? value : undefined;
}

function readZoomSource(img: HTMLImageElement): ZoomSource | null {
  const themedLightSrc = readDataAttr(img, "data-zoom-src-light");
  const themedDarkSrc = readDataAttr(img, "data-zoom-src-dark");
  const explicitZoomSrc = readDataAttr(img, "data-zoom-src");
  // Use || not ?? because img.currentSrc is "" (not null) before the browser
  // selects a source — jsdom and pre-load states both fall under that case.
  const fallbackSrc = explicitZoomSrc || img.currentSrc || img.src;
  const mirrorLiveSrc = !explicitZoomSrc && !themedLightSrc && !themedDarkSrc;

  if (!fallbackSrc && !themedLightSrc && !themedDarkSrc) return null;

  const themedLightType =
    readDataAttr(img, "data-zoom-type-light") ?? guessZoomType(themedLightSrc);
  const themedDarkType = readDataAttr(img, "data-zoom-type-dark") ?? guessZoomType(themedDarkSrc);

  const initialSrc = pickThemedSrc(
    { src: themedLightSrc, type: themedLightType },
    { src: themedDarkSrc, type: themedDarkType },
    fallbackSrc,
    readDataAttr(img, "data-zoom-type"),
  );

  const baseDims = readImageBaseDimensions(img);

  return {
    src: initialSrc.src,
    type: initialSrc.type,
    isSvg: initialSrc.type === "image/svg+xml" || isSvgPath(initialSrc.src),
    themedLight:
      themedLightSrc != null
        ? { src: themedLightSrc, type: themedLightType ?? "image/webp" }
        : undefined,
    themedDark:
      themedDarkSrc != null
        ? { src: themedDarkSrc, type: themedDarkType ?? "image/webp" }
        : undefined,
    sourceImg: img,
    mirrorLiveSrc,
    baseWidth: baseDims.width,
    baseHeight: baseDims.height,
    alt: img.getAttribute("alt") ?? "",
  };
}

function pickThemedSrc(
  light: { src?: string; type?: string },
  dark: { src?: string; type?: string },
  fallbackSrc: string,
  fallbackType?: string,
): { src: string; type: string } {
  if (light.src && dark.src) {
    const scheme = getEffectiveScheme();
    return scheme === "dark"
      ? {
          src: dark.src,
          type: dark.type ?? guessZoomType(dark.src) ?? "image/webp",
        }
      : {
          src: light.src,
          type: light.type ?? guessZoomType(light.src) ?? "image/webp",
        };
  }
  if (light.src) return { src: light.src, type: light.type ?? "image/webp" };
  if (dark.src) return { src: dark.src, type: dark.type ?? "image/webp" };
  return {
    src: fallbackSrc,
    type: fallbackType ?? guessZoomType(fallbackSrc) ?? "image/webp",
  };
}

function guessZoomType(src: string | undefined): string | undefined {
  if (!src) return undefined;
  return isSvgPath(src) ? "image/svg+xml" : "image/webp";
}

function isSvgPath(src: string): boolean {
  return /\.svg(?:[?#]|$)/i.test(src);
}

function readImageBaseDimensions(img: HTMLImageElement): {
  width: number;
  height: number;
} {
  // Prefer naturalWidth/Height for raster (already loaded); fall back to
  // width/height attributes; finally fall back to the rendered box. SVGs may
  // not have natural dims so the attribute fallback matters there.
  const naturalW = img.naturalWidth || 0;
  const naturalH = img.naturalHeight || 0;
  if (naturalW > 0 && naturalH > 0) return { width: naturalW, height: naturalH };

  const attrW = Number(img.getAttribute("width") ?? "");
  const attrH = Number(img.getAttribute("height") ?? "");
  if (Number.isFinite(attrW) && attrW > 0 && Number.isFinite(attrH) && attrH > 0) {
    return { width: attrW, height: attrH };
  }

  const rect = img.getBoundingClientRect();
  if (rect.width > 0 && rect.height > 0) return { width: rect.width, height: rect.height };

  return { width: 1, height: 1 };
}

function computeFitDimensions(baseW: number, baseH: number): { width: number; height: number } {
  const vw = window.innerWidth || document.documentElement.clientWidth || baseW;
  const vh = window.innerHeight || document.documentElement.clientHeight || baseH;
  if (baseW <= 0 || baseH <= 0) return { width: vw, height: vh };

  const scale = Math.min(vw / baseW, vh / baseH);
  return {
    width: Math.max(1, Math.round(baseW * scale)),
    height: Math.max(1, Math.round(baseH * scale)),
  };
}

function getMaxZoomFor(source: ZoomSource): number {
  return source.isSvg ? MAX_ZOOM_SVG : MAX_ZOOM_RASTER;
}

function clampScale(scale: number, source: ZoomSource): number {
  return Math.min(getMaxZoomFor(source), Math.max(MIN_ZOOM, scale));
}

function ensureModal(): ModalRefs {
  if (modalRefs && modalRefs.root.isConnected) return modalRefs;
  modalRefs = undefined;

  const root = document.createElement("div");
  root.className = "ps-img-zoom-modal";
  root.setAttribute("role", "dialog");
  root.setAttribute("aria-modal", "true");
  root.setAttribute("aria-label", "Zoomed image");
  root.hidden = true;
  root.tabIndex = -1;

  const toolbar = document.createElement("div");
  toolbar.className = "ps-img-zoom-toolbar";

  const zoomOut = createToolbarButton("Zoom out", "−");
  const level = document.createElement("span");
  level.className = "ps-img-zoom-level";
  level.setAttribute("aria-live", "polite");
  level.textContent = "100%";
  const zoomIn = createToolbarButton("Zoom in", "+");
  const reset = createToolbarButton("Reset zoom", "100%");
  const close = createToolbarButton("Close", "×");

  toolbar.append(zoomOut, level, zoomIn, reset, close);

  const stage = document.createElement("div");
  stage.className = "ps-img-zoom-stage";

  const img = document.createElement("img");
  img.className = "ps-img-zoom-img";
  img.alt = "";
  img.draggable = false;

  stage.appendChild(img);
  root.append(toolbar, stage);
  document.body.appendChild(root);

  modalRefs = { root, stage, img, level, zoomIn, zoomOut, reset, close };
  attachModalListeners(modalRefs);
  return modalRefs;
}

function createToolbarButton(label: string, glyph: string): HTMLButtonElement {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.setAttribute("aria-label", label);
  btn.title = label;
  btn.textContent = glyph;
  return btn;
}

function attachModalListeners(refs: ModalRefs): void {
  refs.zoomIn.addEventListener("click", () => adjustZoom(+ZOOM_STEP));
  refs.zoomOut.addEventListener("click", () => adjustZoom(-ZOOM_STEP));
  refs.reset.addEventListener("click", () => setZoom(1));
  refs.close.addEventListener("click", () => closeModal());

  refs.root.addEventListener(
    "wheel",
    (event: WheelEvent) => {
      if (!activeState) return;
      if (!(event.ctrlKey || event.metaKey)) return;
      event.preventDefault();
      const direction = event.deltaY < 0 ? +1 : -1;
      adjustZoom(direction * ZOOM_STEP);
    },
    { passive: false },
  );

  refs.root.addEventListener("keydown", (event: KeyboardEvent) => {
    if (!activeState) return;
    switch (event.key) {
      case "Escape":
        event.preventDefault();
        closeModal();
        return;
      case "+":
      case "=":
        event.preventDefault();
        adjustZoom(+ZOOM_STEP);
        return;
      case "-":
      case "_":
        event.preventDefault();
        adjustZoom(-ZOOM_STEP);
        return;
      case "0":
        event.preventDefault();
        setZoom(1);
        return;
      default:
        return;
    }
  });

  refs.root.addEventListener("click", (event: MouseEvent) => {
    // Click on backdrop (root itself, not on toolbar/img) closes the modal.
    if (event.target === refs.root || event.target === refs.stage) {
      closeModal();
    }
  });
}

function adjustZoom(delta: number): void {
  if (!activeState) return;
  setZoom(activeState.scale + delta);
}

function setZoom(next: number): void {
  if (!activeState || !modalRefs) return;
  const clamped = clampScale(next, activeState.source);
  activeState.scale = clamped;
  applyDimensions();
  updateToolbar();
}

function applyDimensions(): void {
  if (!activeState || !modalRefs) return;
  const w = Math.max(1, Math.round(activeState.fitWidth * activeState.scale));
  const h = Math.max(1, Math.round(activeState.fitHeight * activeState.scale));
  modalRefs.img.style.width = `${w}px`;
  modalRefs.img.style.height = `${h}px`;
}

function updateToolbar(): void {
  if (!activeState || !modalRefs) return;
  const max = getMaxZoomFor(activeState.source);
  modalRefs.level.textContent = `${Math.round(activeState.scale * 100)}%`;
  modalRefs.zoomIn.disabled = activeState.scale >= max - 1e-6;
  modalRefs.zoomOut.disabled = activeState.scale <= MIN_ZOOM + 1e-6;
}

function pickThemedSrcForCurrentScheme(source: ZoomSource): {
  src: string;
  type: string;
} {
  if (source.themedLight && source.themedDark) {
    const scheme = getEffectiveScheme();
    return scheme === "dark" ? source.themedDark : source.themedLight;
  }
  if (source.themedLight) return source.themedLight;
  if (source.themedDark) return source.themedDark;
  if (source.mirrorLiveSrc) {
    // No data-zoom-src* on the source img — read the visible img's currently
    // displayed URL. For themed `<picture>` elements this updates as soon as
    // the themed-images runtime toggles `<source>` `media` attrs (its observer
    // registers earlier than ours, so it runs first on the same tick).
    const liveSrc =
      source.sourceImg.currentSrc || source.sourceImg.getAttribute("src") || source.src;
    return { src: liveSrc, type: guessZoomType(liveSrc) ?? source.type };
  }
  return { src: source.src, type: source.type };
}

function applyThemedSrc(): void {
  if (!activeState || !modalRefs) return;
  const next = pickThemedSrcForCurrentScheme(activeState.source);
  if (modalRefs.img.getAttribute("src") !== next.src) {
    modalRefs.img.src = next.src;
  }
  activeState.source.isSvg = next.type === "image/svg+xml" || isSvgPath(next.src);
  // Re-clamp in case the source switched between raster (4x) and svg (10x).
  activeState.scale = clampScale(activeState.scale, activeState.source);
  applyDimensions();
  updateToolbar();
}

function attachThemeObserver(): void {
  if (!activeState) return;
  if (activeState.themeObserver) return;
  // Always observe while open: themed light/dark zoom attrs need it directly,
  // and so do themed `<picture>` sources whose `currentSrc` we mirror.
  const observer = new MutationObserver(() => applyThemedSrc());
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["class"],
  });
  activeState.themeObserver = observer;
}

function detachThemeObserver(): void {
  if (!activeState?.themeObserver) return;
  activeState.themeObserver.disconnect();
  activeState.themeObserver = undefined;
}

function openModalFor(button: HTMLElement): void {
  const figure = button.closest<HTMLElement>(".ps-figure-zoomable") ?? button.closest("figure");
  if (!figure) return;
  const sourceImg = pickImageInsideFigure(figure);
  if (!sourceImg) return;
  const source = readZoomSource(sourceImg);
  if (!source) return;

  const refs = ensureModal();

  refs.img.alt = source.alt;

  const fit = computeFitDimensions(source.baseWidth, source.baseHeight);

  activeState = {
    scale: 1,
    fitWidth: fit.width,
    fitHeight: fit.height,
    source,
    trigger: button,
  };

  // Pick the actual src now that activeState is set so themed/SVG sources
  // resolve through the same path as theme-change updates.
  const initial = pickThemedSrcForCurrentScheme(source);
  refs.img.src = initial.src;
  source.isSvg = initial.type === "image/svg+xml" || isSvgPath(initial.src);

  applyDimensions();
  updateToolbar();
  attachThemeObserver();

  refs.root.hidden = false;
  document.documentElement.classList.add(BODY_OPEN_CLASS);
  document.body.classList.add(BODY_OPEN_CLASS);
  // Focus the close button so Tab cycles inside the toolbar / Esc works.
  refs.close.focus();
}

function closeModal(): void {
  if (!modalRefs) return;
  modalRefs.root.hidden = true;
  document.documentElement.classList.remove(BODY_OPEN_CLASS);
  document.body.classList.remove(BODY_OPEN_CLASS);
  detachThemeObserver();

  const trigger = activeState?.trigger;
  activeState = undefined;
  // Reset modal img src so we don't keep large bitmaps in memory.
  modalRefs.img.removeAttribute("src");
  modalRefs.img.style.width = "";
  modalRefs.img.style.height = "";

  trigger?.focus();
}

function handleResize(): void {
  if (!activeState) return;
  const { source } = activeState;
  const fit = computeFitDimensions(source.baseWidth, source.baseHeight);
  activeState.fitWidth = fit.width;
  activeState.fitHeight = fit.height;
  applyDimensions();
}

export function initImageZoom(): void {
  if (typeof window === "undefined" || typeof document === "undefined") return;

  const runtimeState = window as Window & { [RUNTIME_KEY]?: boolean };
  if (runtimeState[RUNTIME_KEY]) {
    unhideAllZoomButtons();
    return;
  }
  runtimeState[RUNTIME_KEY] = true;

  unhideAllZoomButtons();

  document.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    const button = target.closest<HTMLElement>("[data-ps-img-zoom-btn]");
    if (!button) return;
    event.preventDefault();
    openModalFor(button);
  });

  window.addEventListener("resize", handleResize, { passive: true });
}
