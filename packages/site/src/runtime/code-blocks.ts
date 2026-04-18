const CODE_BLOCKS_RUNTIME_KEY = "__pagesmithCodeBlocksRuntime";

const copyTimers = new WeakMap<HTMLElement, number>();

function getCopySource(button: HTMLElement): HTMLElement | null {
  const block = button.closest<HTMLElement>(".ps-code-block");
  if (block) return block;

  const tabs = button.closest<HTMLElement>(".ps-code-tabs");
  if (!tabs) return null;

  return (
    tabs.querySelector<HTMLElement>(".ps-code-tab-panel:not([hidden]) .ps-code-block") ||
    tabs.querySelector<HTMLElement>(".ps-code-tab-panel .ps-code-block")
  );
}

function getCodeText(block: ParentNode): string {
  return Array.from(block.querySelectorAll<HTMLElement>(".ps-code-line-content"))
    .map((line) => line.textContent || "")
    .join("\n");
}

async function writeClipboard(text: string): Promise<void> {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand("copy");
  textarea.remove();
}

function getCopyLabel(button: HTMLElement, state: "idle" | "copied" | "error"): string {
  switch (state) {
    case "copied":
      return button.getAttribute("data-copied-label") || "Copied";
    case "error":
      return button.getAttribute("data-error-label") || "Retry";
    case "idle":
    default:
      return button.getAttribute("data-copy-label") || "Copy";
  }
}

function setCopyLabel(button: HTMLElement, state: "idle" | "copied" | "error"): void {
  const nextLabel = getCopyLabel(button, state);
  button.title = nextLabel;
  button.setAttribute("aria-label", nextLabel);
}

function toggleCollapsedGroup(toggle: HTMLElement): void {
  const group = toggle.closest<HTMLElement>("[data-ps-code-collapse]");
  if (!group) return;

  const lines = group.querySelector<HTMLElement>("[data-ps-code-collapse-lines]");
  if (!lines) return;

  const expanded = toggle.getAttribute("aria-expanded") === "true";
  toggle.setAttribute("aria-expanded", expanded ? "false" : "true");
  lines.hidden = expanded;
  toggle.textContent = expanded
    ? toggle.getAttribute("data-expand-label") || "Show hidden lines"
    : toggle.getAttribute("data-collapse-label") || "Hide hidden lines";
}

async function handleCopyClick(button: HTMLElement): Promise<void> {
  const source = getCopySource(button);
  if (!source) return;

  try {
    await writeClipboard(getCodeText(source));
    button.dataset.copyState = "copied";
    setCopyLabel(button, "copied");

    const existingTimer = copyTimers.get(button);
    if (existingTimer !== undefined) window.clearTimeout(existingTimer);

    const timer = window.setTimeout(() => {
      button.dataset.copyState = "idle";
      setCopyLabel(button, "idle");
      copyTimers.delete(button);
    }, 1500);
    copyTimers.set(button, timer);
  } catch {
    button.dataset.copyState = "error";
    setCopyLabel(button, "error");
  }
}

export function initCodeBlocks(): void {
  if (typeof window === "undefined" || typeof document === "undefined") return;

  const runtimeState = window as Window & { [CODE_BLOCKS_RUNTIME_KEY]?: boolean };
  if (runtimeState[CODE_BLOCKS_RUNTIME_KEY]) return;
  runtimeState[CODE_BLOCKS_RUNTIME_KEY] = true;

  document.addEventListener("click", async (event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;

    const copyButton = target.closest<HTMLElement>("[data-ps-code-copy]");
    if (copyButton) {
      await handleCopyClick(copyButton);
      return;
    }

    const collapseButton = target.closest<HTMLElement>("[data-ps-code-collapse-toggle]");
    if (collapseButton) toggleCollapsedGroup(collapseButton);
  });
}
