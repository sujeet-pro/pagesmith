/**
 * Rehype plugin that groups consecutive titled Expressive Code blocks
 * into a tabbed interface.
 *
 * Runs after rehype-expressive-code in the pipeline. Walks the HAST
 * tree, finds runs of 2+ adjacent `.expressive-code` wrappers where
 * every block has a title, and replaces them with an accessible tab
 * container. The first tab is active by default; the runtime JS in
 * `runtime/code-tabs.ts` handles switching and keyboard navigation.
 */

type HastNode = {
  type: string
  tagName?: string
  properties?: Record<string, unknown>
  children?: HastNode[]
  value?: string
}

function isElement(node: HastNode): boolean {
  return node.type === 'element'
}

function isWhitespace(node: HastNode): boolean {
  return node.type === 'text' && /^\s*$/.test(node.value || '')
}

function hasClass(node: HastNode, cls: string): boolean {
  const className = node.properties?.className
  if (Array.isArray(className)) return className.includes(cls)
  if (typeof className === 'string') return className.split(/\s+/).includes(cls)
  return false
}

function isEcBlock(node: HastNode): boolean {
  return isElement(node) && node.tagName === 'div' && hasClass(node, 'expressive-code')
}

/**
 * Extract the title text from an EC block's rendered output.
 * EC renders: `<figure class="frame has-title"><figcaption class="header"><span class="title">Title</span></figcaption>...`
 */
function extractTitle(ecBlock: HastNode): string | null {
  for (const child of ecBlock.children || []) {
    if (child.tagName !== 'figure' || !hasClass(child, 'has-title')) continue
    for (const figChild of child.children || []) {
      if (figChild.tagName !== 'figcaption' || !hasClass(figChild, 'header')) continue
      for (const capChild of figChild.children || []) {
        if (capChild.tagName === 'span' && hasClass(capChild, 'title')) {
          return getTextContent(capChild)
        }
      }
    }
  }
  return null
}

function getTextContent(node: HastNode): string {
  if (node.type === 'text') return node.value || ''
  if (node.children) return node.children.map(getTextContent).join('')
  return ''
}

function h(tag: string, props: Record<string, unknown>, children: HastNode[] = []): HastNode {
  return { type: 'element', tagName: tag, properties: props, children }
}

/**
 * Identify runs of consecutive EC blocks that all have titles.
 * Whitespace-only text nodes between EC blocks are treated as separators
 * (they don't break a run). Returns start index and count for each run.
 */
function findRuns(children: HastNode[]): { start: number; count: number }[] {
  const runs: { start: number; count: number }[] = []
  let i = 0
  while (i < children.length) {
    if (isEcBlock(children[i]) && extractTitle(children[i]) !== null) {
      const runStart = i
      let ecCount = 1
      let j = i + 1
      while (j < children.length) {
        if (isWhitespace(children[j])) {
          j++
          continue
        }
        if (isEcBlock(children[j]) && extractTitle(children[j]) !== null) {
          ecCount++
          j++
          continue
        }
        break
      }
      if (ecCount >= 2) {
        runs.push({ start: runStart, count: j - runStart })
      }
      i = j
    } else {
      i++
    }
  }
  return runs
}

function buildTabGroup(ecBlocks: HastNode[], groupId: number): HastNode {
  const titles = ecBlocks.map((b) => extractTitle(b)!)
  const tabButtons: HastNode[] = titles.map((title, i) =>
    h(
      'button',
      {
        className: ['ps-code-tab'],
        role: 'tab',
        'aria-selected': i === 0 ? 'true' : 'false',
        'aria-controls': `ct-${groupId}-p${i}`,
        id: `ct-${groupId}-t${i}`,
        tabindex: i === 0 ? 0 : -1,
      },
      [{ type: 'text', value: title }],
    ),
  )

  const tabNav = h('div', { className: ['ps-code-tabs-nav'], role: 'tablist' }, tabButtons)

  const panels: HastNode[] = ecBlocks.map((block, i) =>
    h(
      'div',
      {
        className: ['ps-code-tab-panel'],
        role: 'tabpanel',
        id: `ct-${groupId}-p${i}`,
        'aria-labelledby': `ct-${groupId}-t${i}`,
        ...(i !== 0 ? { hidden: true } : {}),
      },
      [block],
    ),
  )

  return h('div', { className: ['ps-code-tabs'] }, [tabNav, ...panels])
}

export default function rehypeCodeTabs() {
  let groupCounter = 0

  return (tree: HastNode) => {
    groupCounter = 0
    visit(tree)
  }

  function visit(node: HastNode): void {
    if (!node.children) return

    const runs = findRuns(node.children)
    if (runs.length > 0) {
      // Process runs in reverse so indices stay valid
      for (let r = runs.length - 1; r >= 0; r--) {
        const { start, count } = runs[r]
        const span = node.children.slice(start, start + count)
        const ecBlocks = span.filter(isEcBlock)
        const tabGroup = buildTabGroup(ecBlocks, groupCounter++)
        node.children.splice(start, count, tabGroup)
      }
    }

    for (const child of node.children) {
      visit(child)
    }
  }
}
