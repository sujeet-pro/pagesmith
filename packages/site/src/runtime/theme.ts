const STORAGE_KEY = "pagesmith-theme";
const SCHEME_PREFIX = "color-scheme-";
const THEME_PREFIX = "theme-";

type ThemePrefs = {
  colorScheme: string;
  theme: string;
  textSize: string;
};

function queryAll<T extends Element>(selectors: string): T[] {
  return Array.from(document.querySelectorAll<T>(selectors));
}

function getPrefs(): ThemePrefs {
  const root = document.documentElement;
  const classes = root.className;
  const schemeMatch = classes.match(/color-scheme-(\w+)/);
  const themeMatch = classes.match(/theme-([\w-]+)/);
  return {
    colorScheme: schemeMatch?.[1] || "auto",
    theme: themeMatch?.[1] || "paper",
    textSize: root.dataset.textSize || "base",
  };
}

function persist(): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(getPrefs()));
  } catch {
    // localStorage unavailable
  }
}

function setColorScheme(scheme: string): void {
  const root = document.documentElement;
  root.className = root.className.replace(/color-scheme-\w+/, SCHEME_PREFIX + scheme);
  persist();
  syncUI();
}

function setTheme(theme: string): void {
  const root = document.documentElement;
  root.className = root.className.replace(/theme-[\w-]+/, THEME_PREFIX + theme);
  persist();
  syncUI();
}

function setTextSize(size: string): void {
  const root = document.documentElement;
  if (size === "base") {
    delete root.dataset.textSize;
  } else {
    root.dataset.textSize = size;
  }
  persist();
  syncUI();
}

function syncUI(): void {
  const prefs = getPrefs();

  queryAll<HTMLInputElement>(
    '[data-ps-theme-dropdown] input[name="colorScheme"], [data-theme-dropdown] input[name="colorScheme"]',
  ).forEach((input) => {
    input.checked = input.value === prefs.colorScheme;
  });

  queryAll<HTMLInputElement>(
    '[data-ps-theme-dropdown] input[name="theme"], [data-theme-dropdown] input[name="theme"]',
  ).forEach((input) => {
    input.checked = input.value === prefs.theme;
  });

  queryAll<HTMLInputElement>(
    '[data-ps-theme-dropdown] input[name="textSize"], [data-theme-dropdown] input[name="textSize"]',
  ).forEach((input) => {
    input.checked = input.value === prefs.textSize;
  });

  queryAll<HTMLButtonElement>(
    "[data-ps-footer-scheme] button, [data-footer-scheme] button",
  ).forEach((button) => {
    const active = button.dataset.scheme === prefs.colorScheme;
    button.classList.toggle("active", active);
    button.setAttribute("aria-pressed", String(active));
  });

  queryAll<HTMLButtonElement>(
    "[data-ps-footer-theme] button, [data-footer-theme-type] button",
  ).forEach((button) => {
    const active = button.dataset.theme === prefs.theme;
    button.classList.toggle("active", active);
    button.setAttribute("aria-pressed", String(active));
  });

  queryAll<HTMLButtonElement>(
    "[data-ps-footer-text-size] button, [data-footer-text-size] button",
  ).forEach((button) => {
    const active = button.dataset.size === prefs.textSize;
    button.classList.toggle("active", active);
    button.setAttribute("aria-pressed", String(active));
  });
}

function initHeaderToggle(): void {
  const toggleButton = document.querySelector<HTMLButtonElement>(
    "[data-ps-theme-toggle-button], [data-theme-toggle-btn]",
  );
  const dropdown = document.querySelector<HTMLElement>(
    "[data-ps-theme-dropdown], [data-theme-dropdown]",
  );
  if (!toggleButton || !dropdown) return;

  toggleButton.addEventListener("click", () => {
    const open = !dropdown.hidden;
    dropdown.hidden = open;
    toggleButton.setAttribute("aria-expanded", String(!open));
  });

  dropdown.addEventListener("change", (event) => {
    const input = event.target as HTMLInputElement;
    if (input.name === "colorScheme") setColorScheme(input.value);
    if (input.name === "theme") setTheme(input.value);
    if (input.name === "textSize") setTextSize(input.value);
  });

  document.addEventListener("click", (event) => {
    const target = event.target as HTMLElement;
    if (!target.closest("[data-ps-theme-controls], [data-theme-toggle]")) {
      dropdown.hidden = true;
      toggleButton.setAttribute("aria-expanded", "false");
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !dropdown.hidden) {
      dropdown.hidden = true;
      toggleButton.setAttribute("aria-expanded", "false");
      toggleButton.focus();
    }
  });
}

function initFooterSelector(): void {
  queryAll<HTMLButtonElement>(
    "[data-ps-footer-scheme] button, [data-footer-scheme] button",
  ).forEach((button) => {
    button.addEventListener("click", () => {
      if (button.dataset.scheme) setColorScheme(button.dataset.scheme);
    });
  });

  queryAll<HTMLButtonElement>(
    "[data-ps-footer-theme] button, [data-footer-theme-type] button",
  ).forEach((button) => {
    button.addEventListener("click", () => {
      if (button.dataset.theme) setTheme(button.dataset.theme);
    });
  });

  queryAll<HTMLButtonElement>(
    "[data-ps-footer-text-size] button, [data-footer-text-size] button",
  ).forEach((button) => {
    button.addEventListener("click", () => {
      if (button.dataset.size) setTextSize(button.dataset.size);
    });
  });
}

export function initTheme(): void {
  syncUI();
  initHeaderToggle();
  initFooterSelector();
}
