'use client'

import { useEffect } from 'react'
import { useThemeStore } from '@/stores/theme'

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const themeId = useThemeStore((s) => s.themeId)

  useEffect(() => {
    const html = document.documentElement
    if (themeId === 'system') {
      html.removeAttribute('data-theme')
    } else {
      html.setAttribute('data-theme', themeId)
    }
  }, [themeId])

  return <>{children}</>
}
