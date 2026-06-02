import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { ThemeId } from '@/lib/themes'

interface ThemeStore {
  themeId: ThemeId
  setTheme: (id: ThemeId) => void
}

export const useThemeStore = create<ThemeStore>()(
  persist(
    (set) => ({
      themeId: 'system',
      setTheme: (themeId) => set({ themeId }),
    }),
    { name: 'wordseed-theme' }
  )
)
