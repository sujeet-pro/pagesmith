// Browser entry for the static build: Vite bundles this as the deferred `jsPath` script
// referenced from `renderDocument()` in `src/entry-server.tsx`. Solid never hydrates here —
// load order is global styles, shared Pagesmith runtime for fenced-code UI, then this
// example’s small vanilla enhancements (TOC, sidebar dialog, theme, search trigger tweaks).
import "./src/theme.css";
import "@pagesmith/site/runtime/content";
import "./src/runtime.ts";
