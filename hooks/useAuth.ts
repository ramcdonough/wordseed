'use client'

import { useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useAuthStore } from '@/stores/auth'
import { pullFromCloud, pushLocalDataToCloud } from '@/lib/sync/service'
import { subscribeToChanges } from '@/lib/sync/realtime'

// Boot: wire up auth state listener. Call once at the app shell level.
export function useAuthBoot() {
  const { setSession, setLoading } = useAuthStore()

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)

      if (session?.user) {
        // Upload any locally-stored data, then pull cloud state
        pushLocalDataToCloud(session.user.id).then(() =>
          pullFromCloud(session.user.id)
        )
        subscribeToChanges(session.user.id)
      }
    })

    // Listen for auth state changes (sign in / sign out / token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session)
      setLoading(false)

      if (event === 'SIGNED_IN' && session?.user) {
        pushLocalDataToCloud(session.user.id).then(() =>
          pullFromCloud(session.user.id)
        )
        subscribeToChanges(session.user.id)
      }
    })

    return () => subscription.unsubscribe()
  }, [setSession, setLoading])
}

// Lightweight hook for reading auth state anywhere
export function useUser() {
  return useAuthStore((s) => s.user)
}

export function useAuthLoading() {
  return useAuthStore((s) => s.loading)
}
