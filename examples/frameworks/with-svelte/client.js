/**
 * Vite browser entry: runs after static HTML is already in the DOM.
 * Order matters: site CSS first, then core markdown UX (code tabs / copy), then this
 * example's vanilla enhancements (TOC, sidebar, theme) — all optional progressive layers.
 */
import "./src/theme.css";
import "@pagesmith/site/runtime/content";
import "./src/runtime.ts";
