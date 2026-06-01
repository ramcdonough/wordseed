'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthBoot, useUser, useAuthLoading } from '@/hooks/useAuth'

// Boots auth listener, redirects to /login if unauthenticated.
// Renders nothing (spinner) while the session is being resolved.
export function AppShell({ children }: { children: React.ReactNode }) {
  useAuthBoot()
  const user = useUser()
  const loading = useAuthLoading()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
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
