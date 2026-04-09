const STORAGE_KEY = 'pagesmith-theme'
const SCHEME_PREFIX = 'color-scheme-'
const THEME_PREFIX = 'theme-'

type ThemePrefs = {
  colorScheme: string
  theme: string
  textSize: string
}

function getPrefs(): ThemePrefs {
  const root = document.documentElement
  const classes = root.className
  const schemeMatch = classes.match(/color-scheme-(\w+)/)
  const themeMatch = classes.match(/theme-([\w-]+)/)
  return {
    colorScheme: schemeMatch?.[1] || 'auto',
    theme: themeMatch?.[1] || 'paper',
    textSize: root.dataset.textSize || 'base',
  }
}

function setColorScheme(scheme: string): void {
  const root = document.documentElement
  root.className = root.className.replace(/color-scheme-\w+/, SCHEME_PREFIX + scheme)
  persist()
  syncUI()
}

function setTheme(theme: string): void {
  const root = document.documentElement
  root.className = root.className.replace(/theme-[\w-]+/, THEME_PREFIX + theme)
  persist()
  syncUI()
}

function setTextSize(size: string): void {
  const root = document.documentElement
  if (size === 'base') {
    delete root.dataset.textSize
  } else {
    root.dataset.textSize = size
  }
  persist()
  syncUI()
}

function persist(): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(getPrefs()))
  } catch {
    // localStorage unavailable
  }
}

function syncUI(): void {
  const prefs = getPrefs()

  // Header dropdown radios
  document
    .querySelectorAll<HTMLInputElement>('[data-theme-dropdown] input[name="colorScheme"]')
    .forEach((input) => {
      input.checked = input.value === prefs.colorScheme
    })
  document
    .querySelectorAll<HTMLInputElement>('[data-theme-dropdown] input[name="theme"]')
    .forEach((input) => {
      input.checked = input.value === prefs.theme
    })
  document
    .querySelectorAll<HTMLInputElement>('[data-theme-dropdown] input[name="textSize"]')
    .forEach((input) => {
      input.checked = input.value === prefs.textSize
    })

  // Footer scheme buttons
  document.querySelectorAll<HTMLButtonElement>('[data-footer-scheme] button').forEach((btn) => {
    const active = btn.dataset.scheme === prefs.colorScheme
    btn.classList.toggle('active', active)
    btn.setAttribute('aria-pressed', String(active))
  })

  // Footer theme buttons
  document.querySelectorAll<HTMLButtonElement>('[data-footer-theme-type] button').forEach((btn) => {
    const active = btn.dataset.theme === prefs.theme
    btn.classList.toggle('active', active)
    btn.setAttribute('aria-pressed', String(active))
  })

  // Footer text size buttons
  document.querySelectorAll<HTMLButtonElement>('[data-footer-text-size] button').forEach((btn) => {
    const active = btn.dataset.size === prefs.textSize
    btn.classList.toggle('active', active)
    btn.setAttribute('aria-pressed', String(active))
  })
}

function initHeaderToggle(): void {
  const toggleBtn = document.querySelector<HTMLButtonElement>('[data-theme-toggle-btn]')
  const dropdown = document.querySelector<HTMLElement>('[data-theme-dropdown]')
  if (!toggleBtn || !dropdown) return

  toggleBtn.addEventListener('click', () => {
    const open = !dropdown.hidden
    dropdown.hidden = open
    toggleBtn.setAttribute('aria-expanded', String(!open))
  })

  dropdown.addEventListener('change', (e) => {
    const input = e.target as HTMLInputElement
    if (input.name === 'colorScheme') setColorScheme(input.value)
    if (input.name === 'theme') setTheme(input.value)
    if (input.name === 'textSize') setTextSize(input.value)
  })

  document.addEventListener('click', (e) => {
    const target = e.target as HTMLElement
    if (!target.closest('[data-theme-toggle]')) {
      dropdown.hidden = true
      toggleBtn.setAttribute('aria-expanded', 'false')
    }
  })

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !dropdown.hidden) {
      dropdown.hidden = true
      toggleBtn.setAttribute('aria-expanded', 'false')
      toggleBtn.focus()
    }
  })
}

function initFooterSelector(): void {
  document.querySelectorAll<HTMLButtonElement>('[data-footer-scheme] button').forEach((btn) => {
    btn.addEventListener('click', () => {
      if (btn.dataset.scheme) setColorScheme(btn.dataset.scheme)
    })
  })

  document.querySelectorAll<HTMLButtonElement>('[data-footer-theme-type] button').forEach((btn) => {
    btn.addEventListener('click', () => {
      if (btn.dataset.theme) setTheme(btn.dataset.theme)
    })
  })

  document.querySelectorAll<HTMLButtonElement>('[data-footer-text-size] button').forEach((btn) => {
    btn.addEventListener('click', () => {
      if (btn.dataset.size) setTextSize(btn.dataset.size)
    })
  })
}

export function initTheme(): void {
  syncUI()
  initHeaderToggle()
  initFooterSelector()
}
