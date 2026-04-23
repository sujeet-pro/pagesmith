/**
 * InstallSnippet — legacy JSX wrapper that renders an install command using
 * the same DOM contract as the Pagesmith markdown code renderer's frame chrome.
 *
 * The default `DocHome` layout no longer uses this component — it now
 * pre-renders the home `install` block through `processMarkdown` (see
 * `@pagesmith/docs/src/install.ts`) so the home snippet shares Shiki
 * highlighting, multi-line line numbers, frame chrome, and copy behavior with
 * `\`\`\`<lang>` blocks elsewhere on the site.
 *
 * This component is retained for downstream consumers that import it directly
 * and was extended to accept multi-line scripts and a configurable frame so
 * its visual contract can match the new pipeline output.
 */

import { h } from "@pagesmith/docs/jsx-runtime";

type Props = {
  command: string;
  title?: string;
  /** Defaults to `bash` so the legacy single-line install case stays a shell command. */
  lang?: string;
  /** Defaults to `terminal` to preserve the legacy chrome — switch to `code` for non-shell snippets. */
  frame?: "terminal" | "code" | "plain";
  /** Defaults to `true` for multi-line scripts and `false` for single-line input. */
  showLineNumbers?: boolean;
};

const TERMINAL_ICON = (
  <svg
    class="ps-code-language-icon ps-code-language-icon--terminal"
    viewBox="0 0 20 20"
    fill="none"
    stroke="currentColor"
    stroke-width="1.5"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    <rect x="3" y="4" width="14" height="12" rx="2" />
    <path d="M6.5 8.5 8.75 10.5 6.5 12.5" />
    <path d="M10.5 12.5h3" />
  </svg>
);

const COPY_ICON = (
  <svg
    class="ps-code-copy-icon"
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    stroke-width="1.5"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    <rect x="5.5" y="5.5" width="8" height="8" rx="1.5" />
    <path d="M10.5 5.5V4a1.5 1.5 0 0 0-1.5-1.5H4A1.5 1.5 0 0 0 2.5 4v5A1.5 1.5 0 0 0 4 10.5h1.5" />
  </svg>
);

const COPIED_ICON = (
  <svg
    class="ps-code-copy-icon ps-code-copy-icon--copied"
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    stroke-width="1.5"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    <path d="M3.5 9 6.5 12 12.5 4.5" />
  </svg>
);

function splitLines(command: string): string[] {
  const normalized = command.replace(/\r\n/g, "\n").replace(/\s+$/, "");
  return normalized.length > 0 ? normalized.split("\n") : [""];
}

export function InstallSnippet({
  command,
  title = "Terminal",
  lang = "bash",
  frame = "terminal",
  showLineNumbers,
}: Props) {
  const lines = splitLines(command);
  const includeLineNumbers = showLineNumbers ?? lines.length > 1;
  const isTerminal = frame === "terminal";

  return (
    <figure
      class="ps-code-block"
      data-ps-code-lang={lang}
      data-ps-code-wrap="false"
      data-ps-code-line-numbers={includeLineNumbers ? "true" : "false"}
      data-ps-code-renderer="pagesmith"
      data-ps-code-title={title}
      data-ps-code-frame={frame}
      style="--ps-code-light-bg:#fff;--ps-code-dark-bg:#24292e;--ps-code-light-fg:#24292e;--ps-code-dark-fg:#e1e4e8"
    >
      <div class={`ps-code-toolbar ps-code-toolbar--${frame}`}>
        <div
          class={`ps-code-toolbar-main ps-code-toolbar-main--${isTerminal ? "terminal" : "code"}`}
        >
          {isTerminal ? (
            <span class="ps-code-traffic-lights" aria-hidden="true">
              <span class="ps-code-traffic-light" />
              <span class="ps-code-traffic-light" />
              <span class="ps-code-traffic-light" />
            </span>
          ) : null}
          <span class="ps-code-toolbar-chip">
            {isTerminal ? (
              <span
                class="ps-code-language-badge ps-code-language-badge--icon"
                data-ps-code-language={lang}
                style="--ps-code-language-badge-bg:#111827;--ps-code-language-badge-fg:#86efac"
                aria-hidden="true"
                title="Shell"
              >
                {TERMINAL_ICON}
              </span>
            ) : null}
            <span class="ps-code-toolbar-label">{title}</span>
          </span>
        </div>
        <button
          class="ps-code-copy"
          type="button"
          data-ps-code-copy="true"
          data-copy-label="Copy"
          data-copied-label="Copied"
          data-error-label="Retry"
          aria-label="Copy code block"
          title="Copy"
        >
          {COPY_ICON}
          {COPIED_ICON}
        </button>
      </div>
      <div class="ps-code-body">
        <pre
          class="ps-code-pre shiki shiki-themes"
          tabindex="0"
          role="region"
          aria-label={title}
          style="background-color:#fff;--shiki-dark-bg:#24292e;color:#24292e;--shiki-dark:#e1e4e8"
        >
          <code class={`ps-code-code language-${lang}`}>
            {lines.map((line, index) => (
              <span class="ps-code-line" data-ps-code-line={String(index + 1)}>
                {includeLineNumbers ? (
                  <span class="ps-code-line-number" aria-hidden="true">
                    {String(index + 1)}
                  </span>
                ) : null}
                <span class="ps-code-line-content">{line}</span>
              </span>
            ))}
          </code>
        </pre>
      </div>
    </figure>
  );
}
