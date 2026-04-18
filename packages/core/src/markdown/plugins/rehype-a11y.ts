/**
 * `rehype-a11y` — fix common WCAG 2.2 AA gaps that the upstream remark/rehype
 * pipeline leaves in place after rendering Markdown into HTML.
 *
 * Today it patches two specific shapes:
 *
 *   1. **GFM task-list checkboxes** (`- [ ] text`)
 *      `remark-gfm` emits `<input type="checkbox" disabled>` with no label.
 *      Screen readers announce them as nameless form controls. We add
 *      `aria-label` derived from the sibling text so the control is
 *      announced as e.g. "checkbox, unchecked, configure CI".
 *
 *   2. **MathJax SVG output** (`rehype-mathjax/svg`)
 *      MathJax emits `<svg role="img">` elements with no `<title>` or
 *      `aria-label`. Browsers and screen readers therefore have no
 *      accessible name for the equation. We attach `aria-label` derived
 *      from the math source preserved in `data-original` / `aria-hidden`
 *      siblings, falling back to `"Math equation"` so the control still
 *      has a name.
 *
 * Both patches are idempotent and safe to apply more than once.
 */

import { visit } from "unist-util-visit";
import type { Element, Root } from "hast";
import type { Plugin } from "unified";

function getText(node: any): string {
  if (!node) return "";
  if (node.type === "text") return String(node.value ?? "");
  if (Array.isArray(node.children)) return node.children.map(getText).join("");
  return "";
}

function findCheckboxLabel(parent: Element | undefined, checkboxIndex: number): string {
  if (!parent || !Array.isArray(parent.children)) return "";
  // Look at every sibling AFTER the checkbox; that is where remark-gfm
  // puts the actual task text.
  const tail = parent.children.slice(checkboxIndex + 1);
  return tail.map(getText).join("").trim();
}

const rehypeA11y: Plugin<[], Root> = () => {
  return (tree) => {
    visit(tree, "element", (node, index, parent) => {
      // ── 1. Task-list checkboxes ─────────────────────────────────────
      if (
        node.tagName === "input" &&
        (node.properties?.type === "checkbox" || node.properties?.type === "CHECKBOX")
      ) {
        const props = node.properties ?? {};
        if (!props["ariaLabel"] && !props["aria-label"]) {
          const labelText =
            findCheckboxLabel(parent as Element | undefined, index ?? -1) || "Task item";
          const checked = Boolean(props["checked"]);
          const label = checked ? `Completed: ${labelText}` : `Pending: ${labelText}`;
          node.properties = { ...props, ariaLabel: label };
        }
      }

      // ── 2. MathJax-style SVGs without an accessible name ────────────
      if (
        node.tagName === "svg" &&
        node.properties &&
        (node.properties["role"] === "img" || node.properties["role"] === "IMG")
      ) {
        const props = node.properties;
        const hasName =
          Boolean(props["ariaLabel"]) ||
          Boolean(props["aria-label"]) ||
          Boolean(props["ariaLabelledby"]) ||
          Boolean(props["aria-labelledby"]) ||
          (Array.isArray(node.children) &&
            node.children.some(
              (c) => (c as Element).type === "element" && (c as Element).tagName === "title",
            ));
        if (!hasName) {
          // Try to read the original LaTeX source MathJax preserves on
          // `data-original` (when configured); fall back to a stable label
          // so the SVG always has a name.
          const original =
            (props["dataOriginal"] as string | undefined) ||
            (props["data-original"] as string | undefined) ||
            "";
          const label = original.trim() || "Math equation";
          node.properties = { ...props, ariaLabel: label };
        }
      }
    });
  };
};

export default rehypeA11y;
