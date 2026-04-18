type HastNode = {
  type: string;
  tagName?: string;
  properties?: Record<string, unknown>;
  children?: HastNode[];
};

function isElement(node: HastNode): boolean {
  return node.type === "element";
}

function hasClass(node: HastNode, cls: string): boolean {
  const className = node.properties?.className;
  if (Array.isArray(className)) return className.includes(cls);
  if (typeof className === "string") return className.split(/\s+/).includes(cls);
  return false;
}

function h(tag: string, props: Record<string, unknown>, children: HastNode[] = []): HastNode {
  return { type: "element", tagName: tag, properties: props, children };
}

export default function rehypeScrollableTables() {
  return (tree: HastNode) => {
    visit(tree);
  };

  function visit(node: HastNode): void {
    if (!node.children || hasClass(node, "ps-table-scroll")) return;

    for (let index = 0; index < node.children.length; index++) {
      const child = node.children[index];

      if (isElement(child) && child.tagName === "table") {
        // WCAG 2.2 AA — `scrollable-region-focusable`: any horizontally
        // scrollable container must be reachable by keyboard. The wrapper
        // becomes a tab stop with an accessible region role + label so
        // keyboard users can scroll wide tables without a pointer.
        node.children[index] = h(
          "div",
          {
            className: ["ps-table-scroll"],
            tabIndex: 0,
            role: "region",
            "aria-label": "Scrollable table",
          },
          [child],
        );
        continue;
      }

      visit(child);
    }
  }
}
