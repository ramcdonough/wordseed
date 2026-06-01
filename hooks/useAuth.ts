'use client'

import { useEffect } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from '@/lib/firebase/client'
import { useAuthStore } from '@/stores/auth'
import { pullFromCloud, pushLocalDataToCloud } from '@/lib/sync/service'
import { subscribeToChanges } from '@/lib/sync/realtime'

// Boot: wire up Firebase auth listener. Call once at the app shell level.
export function useAuthBoot() {
  const { setUser, setLoading } = useAuthStore()

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, async (user) => {
      setUser(user)
      setLoading(false)

      if (user) {
        // Upload any pre-existing local data, then pull cloud state
        await pushLocalDataToCloud(user.uid)
        await pullFromCloud(user.uid)
        subscribeToChanges(user.uid)
      }
    })

    return () => unsubAuth()
  }, [setUser, setLoading])
}

export function useUser() {
  return useAuthStore((s) => s.user)
}

export function useAuthLoading() {
  return useAuthStore((s) => s.loading)
}
