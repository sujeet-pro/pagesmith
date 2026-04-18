import { h } from "../jsx-runtime/index.js";
import { SITE_CHROME_ASSETS, withComponentAssets } from "./assets.js";
import type { SiteThemeControls, SiteThemeOption } from "./types.js";
import { resolveThemeControls } from "../theme/index.js";

const themeIcon =
  '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><circle cx="10" cy="10" r="4"/><path d="M10 2v2M10 16v2M2 10h2M16 10h2M4.93 4.93l1.41 1.41M13.66 13.66l1.41 1.41M4.93 15.07l1.41-1.41M13.66 6.34l1.41-1.41"/></svg>';

function renderRadioOptions(name: string, options: SiteThemeOption[], checkedValue: string) {
  return options.map((option) => (
    <label class="doc-theme-option" data-theme={name === "theme" ? option.value : undefined}>
      <input
        type="radio"
        name={name}
        value={option.value}
        checked={option.value === checkedValue}
      />
      {option.label}
    </label>
  ));
}

function renderColorSchemeOptions(options: SiteThemeOption[]) {
  return options.map((option) => (
    <label class="doc-theme-option" data-scheme={option.value}>
      <input
        type="radio"
        name="colorScheme"
        value={option.value}
        checked={option.value === "auto"}
      />
      {option.label}
    </label>
  ));
}

function isPresetTextSize(value: string): value is "small" | "base" | "large" {
  return value === "small" || value === "base" || value === "large";
}

function renderTextSizeLabel(option: SiteThemeOption) {
  if (isPresetTextSize(option.value)) {
    return (
      <span class="doc-text-size-label" data-size={option.value} aria-hidden="true">
        A
      </span>
    );
  }

  return (
    <span class="doc-text-size-label" data-size="base" aria-hidden="true">
      {option.label}
    </span>
  );
}

function renderTextSizeOptions(options: SiteThemeOption[]) {
  return options.map((option) => (
    <label class="doc-text-size-option" title={option.label}>
      <input
        class="sr-only"
        type="radio"
        name="textSize"
        value={option.value}
        checked={option.value === "base"}
      />
      {renderTextSizeLabel(option)}
      <span class="sr-only">{option.label} text size</span>
    </label>
  ));
}

type ThemeDropdownControlsProps = {
  controls?: SiteThemeControls;
  id?: string;
  buttonIcon?: string;
};

function ThemeDropdownControlsComponent({
  controls,
  id = "doc-theme-dropdown",
  buttonIcon = themeIcon,
}: ThemeDropdownControlsProps) {
  const resolved = resolveThemeControls(controls);

  return (
    <div class="doc-theme-toggle no-js-hidden" data-theme-toggle="" data-ps-theme-controls="">
      <button
        type="button"
        class="doc-theme-toggle-btn"
        aria-label={resolved.dropdownButtonLabel}
        aria-expanded="false"
        aria-haspopup="true"
        aria-controls={id}
        data-theme-toggle-btn=""
        data-ps-theme-toggle-button=""
        innerHTML={buttonIcon}
      />
      <div
        id={id}
        class="doc-theme-dropdown"
        data-theme-dropdown=""
        data-ps-theme-dropdown=""
        hidden
      >
        <fieldset class="doc-theme-group">
          <legend>{resolved.appearanceLabel}</legend>
          {renderColorSchemeOptions(resolved.colorSchemeOptions)}
        </fieldset>
        <fieldset class="doc-theme-group">
          <legend>{resolved.themeLabel}</legend>
          {renderRadioOptions("theme", resolved.themeOptions, "paper")}
        </fieldset>
        <fieldset class="doc-theme-group">
          <legend>{resolved.textSizeLabel}</legend>
          <div class="doc-text-size-options">{renderTextSizeOptions(resolved.textSizeOptions)}</div>
        </fieldset>
      </div>
    </div>
  );
}

type FooterThemeControlsProps = {
  controls?: SiteThemeControls;
};

function FooterThemeControlsComponent({ controls }: FooterThemeControlsProps) {
  const resolved = resolveThemeControls(controls);

  return (
    <div class="doc-footer-theme no-js-hidden" data-footer-theme="">
      <div class="doc-footer-theme-group">
        <span class="doc-footer-theme-label">{resolved.appearanceLabel}</span>
        <div class="doc-footer-theme-options" data-footer-scheme="" data-ps-footer-scheme="">
          {resolved.colorSchemeOptions.map((option) => (
            <button
              type="button"
              data-scheme={option.value}
              class={option.value === "auto" ? "active" : undefined}
              aria-pressed={option.value === "auto" ? "true" : "false"}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
      <div class="doc-footer-theme-group">
        <span class="doc-footer-theme-label">{resolved.themeLabel}</span>
        <div class="doc-footer-theme-options" data-footer-theme-type="" data-ps-footer-theme="">
          {resolved.themeOptions.map((option) => (
            <button
              type="button"
              data-theme={option.value}
              class={option.value === "paper" ? "active" : undefined}
              aria-pressed={option.value === "paper" ? "true" : "false"}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
      <div class="doc-footer-theme-group">
        <span class="doc-footer-theme-label">{resolved.textSizeLabel}</span>
        <div class="doc-footer-theme-options" data-footer-text-size="" data-ps-footer-text-size="">
          {resolved.textSizeOptions.map((option) => (
            <button
              type="button"
              data-size={option.value}
              class={option.value === "base" ? "active" : undefined}
              aria-pressed={option.value === "base" ? "true" : "false"}
              aria-label={`${option.label} text`}
            >
              {renderTextSizeLabel(option)}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export const ThemeDropdownControls = withComponentAssets(
  ThemeDropdownControlsComponent,
  SITE_CHROME_ASSETS,
);
export const FooterThemeControls = withComponentAssets(
  FooterThemeControlsComponent,
  SITE_CHROME_ASSETS,
);
