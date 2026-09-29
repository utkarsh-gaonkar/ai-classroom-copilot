import { createContext } from 'react'
import type { UserPreferences } from '../types'

export interface PreferencesContextValue {
  preferences: UserPreferences
  updatePreferences: (changes: Partial<UserPreferences>) => void
}

export const PreferencesContext = createContext<PreferencesContextValue | null>(null)