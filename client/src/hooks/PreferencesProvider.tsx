import { useEffect, useState, type ReactNode } from 'react'
import type { UserPreferences } from '../types'
import { PreferencesContext } from './preferencesContext'

const STORAGE_KEY = 'inclusive-classroom-preferences'

const defaultPreferences: UserPreferences = {
  fontSize: 16,
  highContrast: false,
  dyslexiaFriendly: false,
  focusMode: false,
  reducedMotion: false,
  speechRate: 1,
  speechVoiceURI: '',
}

function loadPreferences(): UserPreferences {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (!saved) return defaultPreferences
    const savedPreferences = JSON.parse(saved) as Partial<UserPreferences> & { defaultLanguage?: unknown }
    delete savedPreferences.defaultLanguage
    return { ...defaultPreferences, ...savedPreferences }
  } catch {
    return defaultPreferences
  }
}

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const [preferences, setPreferences] = useState<UserPreferences>(loadPreferences)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences))
    document.documentElement.style.setProperty('--user-font-size', `${preferences.fontSize}px`)
    document.documentElement.dataset.contrast = preferences.highContrast ? 'high' : 'normal'
    document.documentElement.dataset.dyslexia = preferences.dyslexiaFriendly ? 'true' : 'false'
    document.documentElement.dataset.focus = preferences.focusMode ? 'true' : 'false'
    document.documentElement.dataset.motion = preferences.reducedMotion ? 'reduced' : 'full'
  }, [preferences])

  const updatePreferences = (changes: Partial<UserPreferences>) => {
    setPreferences((current) => ({ ...current, ...changes }))
  }

  return <PreferencesContext.Provider value={{ preferences, updatePreferences }}>{children}</PreferencesContext.Provider>
}