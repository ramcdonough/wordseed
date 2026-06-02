'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthBoot, useUser, useAuthLoading } from '@/hooks/useAuth'
import { useAuthStore } from '@/stores/auth'
import type { User } from 'firebase/auth'

const DEV_BYPASS = process.env.NEXT_PUBLIC_DEV_BYPASS_AUTH === 'true'

// Boots auth listener, redirects to /login if unauthenticated.
// Set NEXT_PUBLIC_DEV_BYPASS_AUTH=true in .env.local to skip auth in development.
export function AppShell({ children }: { children: React.ReactNode }) {
  useAuthBoot()
  const user = useUser()
  const loading = useAuthLoading()
  const router = useRouter()
  const { setUser, setLoading } = useAuthStore()

  // Dev bypass: inject a local-only mock user so the app renders without real auth.
  // Cloud sync will fail silently; all data is stored in local IndexedDB (Dexie).
  useEffect(() => {
    if (DEV_BYPASS && !loading && !user) {
      setUser({ uid: 'dev-local', displayName: 'Dev User', email: 'dev@local' } as unknown as User)
      setLoading(false)
    }
  }, [loading, user, setUser, setLoading])

  useEffect(() => {
    if (!DEV_BYPASS && !loading && !user) {
      router.replace('/login')
    }
  }, [loading, user, router])

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-background)]">
        <div className="w-8 h-8 border-2 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return <>{children}</>
}
