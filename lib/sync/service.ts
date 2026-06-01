'use client'

import { supabase } from '@/lib/supabase/client'
import { db } from '@/lib/db/schema'
import {
  wordToCloud, wordFromCloud,
  collectionToCloud, collectionFromCloud,
  statsToCloud, statsFromCloud,
} from '@/lib/supabase/transforms'

// ── Pull: Cloud → Local ───────────────────────────────────────────────────────
// Called on sign-in and on app focus. Merges cloud into local Dexie.
export async function pullFromCloud(userId: string): Promise<void> {
  try {
    const [wordsRes, collectionsRes, statsRes] = await Promise.all([
      supabase.from('words').select('*').eq('user_id', userId),
      supabase.from('collections').select('*').eq('user_id', userId),
      supabase.from('daily_stats').select('*').eq('user_id', userId),
    ])

    if (wordsRes.data?.length) {
      await db.words.bulkPut(wordsRes.data.map(wordFromCloud))
    }
    if (collectionsRes.data?.length) {
      await db.collections.bulkPut(collectionsRes.data.map(collectionFromCloud))
    }
    if (statsRes.data?.length) {
      await db.dailyStats.bulkPut(statsRes.data.map(statsFromCloud))
    }
  } catch (err) {
    console.warn('[sync] pull failed:', err)
  }
}

// ── Push: Local → Cloud ───────────────────────────────────────────────────────
// Called once after sign-in to upload any pre-existing local data.
export async function pushLocalDataToCloud(userId: string): Promise<void> {
  try {
    const [words, collections, stats] = await Promise.all([
      db.words.toArray(),
      db.collections.toArray(),
      db.dailyStats.toArray(),
    ])

    if (words.length) {
      await supabase.from('words').upsert(
        words.map(w => wordToCloud(w, userId)),
        { onConflict: 'id' }
      )
    }
    if (collections.length) {
      await supabase.from('collections').upsert(
        collections.map(c => collectionToCloud(c, userId)),
        { onConflict: 'id' }
      )
    }
    if (stats.length) {
      await supabase.from('daily_stats').upsert(
        stats.map(s => statsToCloud(s, userId)),
        { onConflict: 'date,user_id' }
      )
    }
  } catch (err) {
    console.warn('[sync] push failed:', err)
  }
}

// ── Sync single word ──────────────────────────────────────────────────────────
export async function syncWord(userId: string, wordId: string): Promise<void> {
  try {
    const word = await db.words.get(wordId)
    if (!word) return
    await supabase.from('words').upsert(wordToCloud(word, userId), { onConflict: 'id' })
  } catch (err) {
    console.warn('[sync] word sync failed:', err)
  }
}

// ── Sync delete word ──────────────────────────────────────────────────────────
export async function deleteCloudWord(userId: string, wordId: string): Promise<void> {
  try {
    await supabase.from('words').delete().eq('id', wordId).eq('user_id', userId)
  } catch (err) {
    console.warn('[sync] word delete failed:', err)
  }
}

// ── Sync single collection ────────────────────────────────────────────────────
export async function syncCollection(userId: string, collectionId: string): Promise<void> {
  try {
    const col = await db.collections.get(collectionId)
    if (!col) return
    await supabase.from('collections').upsert(collectionToCloud(col, userId), { onConflict: 'id' })
  } catch (err) {
    console.warn('[sync] collection sync failed:', err)
  }
}

// ── Sync daily stats ──────────────────────────────────────────────────────────
export async function syncStats(userId: string, date: string): Promise<void> {
  try {
    const stat = await db.dailyStats.get(date)
    if (!stat) return
    await supabase.from('daily_stats').upsert(statsToCloud(stat, userId), { onConflict: 'date,user_id' })
  } catch (err) {
    console.warn('[sync] stats sync failed:', err)
  }
}
