const STORAGE_KEY = 'uspg-theme'

export function getStoredThemeDark() {
  if (typeof window === 'undefined') return true
  try {
    return localStorage.getItem(STORAGE_KEY) !== 'light'
  } catch {
    return true
  }
}

export function applyThemeToDocument(isDark) {
  if (typeof document === 'undefined') return
  document.body.classList.toggle('dark-mode', isDark)
  document.body.classList.toggle('theme-dark', isDark)
  try {
    localStorage.setItem(STORAGE_KEY, isDark ? 'dark' : 'light')
  } catch {
    /* ignore */
  }
}
