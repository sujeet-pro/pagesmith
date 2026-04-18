// Client bundle for SSG: Vite emits hashed assets; pagesmithSsg injects their URLs into render().
// Keep this entry tiny — static HTML already contains the page; this only loads theme + enhancements.
import "./src/theme.css";
import "./src/runtime.ts";
