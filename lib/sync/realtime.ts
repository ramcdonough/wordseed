'use client'

import { supabase } from '@/lib/supabase/client'
import { db } from '@/lib/db/schema'
import { wordFromCloud, collectionFromCloud } from '@/lib/supabase/transforms'
import type { RealtimeChannel } from '@supabase/supabase-js'

let channel: RealtimeChannel | null = null

export function subscribeToChanges(userId: string): () => void {
  if (channel) channel.unsubscribe()

  channel = supabase
    .channel(`user-${userId}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'words', filter: `user_id=eq.${userId}` },
      async (payload) => {
        if (payload.eventType === 'DELETE') {
          await db.words.delete(payload.old.id as string)
        } else if (payload.new) {
          await db.words.put(wordFromCloud(payload.new as Record<string, unknown>))
        }
      }
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'collections', filter: `user_id=eq.${userId}` },
      async (payload) => {
        if (payload.eventType === 'DELETE') {
          await db.collections.delete(payload.old.id as string)
        } else if (payload.new) {
          await db.collections.put(collectionFromCloud(payload.new as Record<string, unknown>))
        }
      }
    )
    .subscribe()

  return () => {
    channel?.unsubscribe()
    channel = null
  }
}
