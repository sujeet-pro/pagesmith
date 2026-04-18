/**
 * Rehype plugin that groups consecutive titled Pagesmith code blocks
 * into a tabbed interface.
 *
 * Runs after the built-in code renderer in the pipeline. Walks the HAST
 * tree, finds runs of 2+ adjacent Pagesmith-owned code block wrappers
 * where every block has a title, and replaces them with an accessible
 * tab container. The runtime JS in `runtime/code-tabs.ts` handles
 * switching, keyboard navigation, and keeping the active tab scrolled
 * into view.
 */

import {
  type HastNode,
  getPagesmithCodeBlockLanguage,
  getPagesmithCodeBlockTitle,
  isPagesmithCodeBlock,
} from "../code/contract";
import { createLanguageBadge } from "../code/language-badges";

function isWhitespace(node: HastNode): boolean {
  return node.type === "text" && /^\s*$/.test(node.value || "");
}

function h(tag: string, props: Record<string, unknown>, children: HastNode[] = []): HastNode {
  return { type: "element", tagName: tag, properties: props, children };
}

function createTabLabel(title: string, lang: string | null): HastNode {
  return h("span", { className: ["ps-code-tab-inner"] }, [
    createLanguageBadge(lang ?? undefined),
    h("span", { className: ["ps-code-tab-label"] }, [{ type: "text", value: title }]),
  ]);
}

function createCopyButton(): HastNode {
  return h(
    "button",
    {
      className: ["ps-code-copy"],
      type: "button",
      "data-ps-code-copy": "true",
      "data-copy-label": "Copy",
      "data-copied-label": "Copied",
      "data-error-label": "Retry",
      "aria-label": "Copy active code tab",
    },
    [h("span", { "data-ps-code-copy-label": "true" }, [{ type: "text", value: "Copy" }])],
  );
}

/**
 * Identify runs of consecutive Pagesmith code blocks that all have titles.
 * Whitespace-only text nodes between blocks are treated as separators
 * (they don't break a run). Returns start index and count for each run.
 */
function findRuns(children: HastNode[]): { start: number; count: number }[] {
  const runs: { start: number; count: number }[] = [];
  let i = 0;
  while (i < children.length) {
    if (isPagesmithCodeBlock(children[i]) && getPagesmithCodeBlockTitle(children[i]) !== null) {
      const runStart = i;
      let codeBlockCount = 1;
      let j = i + 1;
      while (j < children.length) {
        if (isWhitespace(children[j])) {
          j++;
          continue;
        }
        if (isPagesmithCodeBlock(children[j]) && getPagesmithCodeBlockTitle(children[j]) !== null) {
          codeBlockCount++;
          j++;
          continue;
        }
        break;
      }
      if (codeBlockCount >= 2) {
        runs.push({ start: runStart, count: j - runStart });
      }
      i = j;
    } else {
      i++;
    }
  }
  return runs;
}

function buildTabGroup(codeBlocks: HastNode[], groupId: number): HastNode {
  const titles = codeBlocks.map((block) => getPagesmithCodeBlockTitle(block)!);
  const languages = codeBlocks.map((block) => getPagesmithCodeBlockLanguage(block));
  const inheritedStyle =
    typeof codeBlocks[0]?.properties?.style === "string" &&
    codeBlocks[0].properties.style.length > 0
      ? codeBlocks[0].properties.style
      : undefined;
  const tabButtons: HastNode[] = titles.map((title, i) =>
    h(
      "button",
      {
        className: ["ps-code-tab"],
        role: "tab",
        "aria-selected": i === 0 ? "true" : "false",
        "aria-controls": `ct-${groupId}-p${i}`,
        id: `ct-${groupId}-t${i}`,
        tabindex: i === 0 ? 0 : -1,
        type: "button",
      },
      [createTabLabel(title, languages[i])],
    ),
  );

  const panels: HastNode[] = codeBlocks.map((block, i) =>
    h(
      "div",
      {
        className: ["ps-code-tab-panel"],
        role: "tabpanel",
        id: `ct-${groupId}-p${i}`,
        "aria-labelledby": `ct-${groupId}-t${i}`,
      },
      [block],
    ),
  );

  return h(
    "div",
    {
      className: ["ps-code-tabs"],
      style: inheritedStyle,
    },
    [
      h("div", { className: ["ps-code-tabs-header"] }, [
        h("div", { className: ["ps-code-tabs-nav"], role: "tablist" }, tabButtons),
        h("div", { className: ["ps-code-tabs-actions"] }, [createCopyButton()]),
      ]),
      h("div", { className: ["ps-code-tabs-panels"] }, panels),
    ],
  );
}

export default function rehypeCodeTabs() {
  let groupCounter = 0;

  return (tree: HastNode) => {
    groupCounter = 0;
    visit(tree);
  };

  function visit(node: HastNode): void {
    if (!node.children) return;

    const runs = findRuns(node.children);
    if (runs.length > 0) {
      // Process runs in reverse so indices stay valid
      for (let r = runs.length - 1; r >= 0; r--) {
        const { start, count } = runs[r];
        const span = node.children.slice(start, start + count);
        const codeBlocks = span.filter(isPagesmithCodeBlock);
        const tabGroup = buildTabGroup(codeBlocks, groupCounter++);
        node.children.splice(start, count, tabGroup);
      }
    }

    for (const child of node.children) {
      visit(child);
    }
  }
}
