import { useEffect, useState, type ReactNode } from 'react'
import type { UserPreferences } from '../types'
import { PreferencesContext } from './preferencesContext'

const STORAGE_KEY = 'inclusive-classroom-preferences'

const defaultPreferences: UserPreferences = {
  fontSize: 16,
  highContrast: false,
  reducedMotion: false,
  defaultLanguage: 'en',
  speechRate: 1,
  speechVoiceURI: '',
}

function loadPreferences(): UserPreferences {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    return saved ? { ...defaultPreferences, ...JSON.parse(saved) as Partial<UserPreferences> } : defaultPreferences
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
    document.documentElement.dataset.motion = preferences.reducedMotion ? 'reduced' : 'full'
  }, [preferences])

  const updatePreferences = (changes: Partial<UserPreferences>) => {
    setPreferences((current) => ({ ...current, ...changes }))
  }

  return <PreferencesContext.Provider value={{ preferences, updatePreferences }}>{children}</PreferencesContext.Provider>
}