import { useCallback, useEffect, useState } from 'react'
import { ThemeContext } from './themeContextObject.js'

const STORAGE_KEY = 'cairn-theme-preference'

function getSystemPrefersDark() {
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false
}

function resolveEffectiveTheme(preference) {
  if (preference === 'system') return getSystemPrefersDark() ? 'dark' : 'light'
  return preference
}

export function ThemeProvider({ children }) {
  // Cached in localStorage purely so the correct theme paints immediately
  // on load, before the authenticated user's saved preference is fetched —
  // not used for anything sensitive. See index.html for the matching
  // inline script that applies this before React even mounts.
  const [preference, setPreferenceState] = useState(
    () => localStorage.getItem(STORAGE_KEY) || 'system'
  )

  const effectiveTheme = resolveEffectiveTheme(preference)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', effectiveTheme)
  }, [effectiveTheme])

  // Live-update if the OS-level preference changes while "system" is selected.
  useEffect(() => {
    if (preference !== 'system') return
    const mql = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = () => {
      document.documentElement.setAttribute('data-theme', resolveEffectiveTheme('system'))
    }
    mql.addEventListener('change', handler)
    return () => mql.removeEventListener('change', handler)
  }, [preference])

  const setPreference = useCallback((next) => {
    setPreferenceState(next)
    localStorage.setItem(STORAGE_KEY, next)
  }, [])

  return (
    <ThemeContext.Provider value={{ preference, effectiveTheme, setPreference }}>
      {children}
    </ThemeContext.Provider>
  )
}
