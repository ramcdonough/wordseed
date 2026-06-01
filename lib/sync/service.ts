'use client'

/**
 * Sync service — Dexie (local) ↔ Firestore (cloud)
 *
 * Firestore SDK caches everything in IndexedDB automatically, so the app
 * works offline without any extra effort. This layer only exists to keep
 * Dexie (used for live queries in the UI) in sync with Firestore.
 *
 * Flow:
 *  write  → Dexie first (instant UI) → Firestore in background
 *  read   → Dexie (fast, local)
 *  sync   → on sign-in pull Firestore → populate Dexie
 *  realtime → Firestore onSnapshot → update Dexie → UI re-renders
 */

import {
  getDocs, setDoc, deleteDoc, writeBatch,
} from 'firebase/firestore'
import { db as dexie } from '@/lib/db/schema'
import { db as firestore } from '@/lib/firebase/client'
import { wordsCol, wordDoc, colsCol, colDoc, statsCol, statDoc } from '@/lib/firebase/schema'
import type { Word, Collection, DailyStats } from '@/types'

// ── Helpers: strip undefined so Firestore doesn't complain ───────────────────
function clean<T extends object>(obj: T): T {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== undefined)
  ) as T
}

// ── Pull: Firestore → Dexie ──────────────────────────────────────────────────
export async function pullFromCloud(userId: string): Promise<void> {
  try {
    const [wordsSnap, colsSnap, statsSnap] = await Promise.all([
      getDocs(wordsCol(userId)),
      getDocs(colsCol(userId)),
      getDocs(statsCol(userId)),
    ])

    if (wordsSnap.size) {
      await dexie.words.bulkPut(wordsSnap.docs.map(d => d.data() as Word))
    }
    if (colsSnap.size) {
      await dexie.collections.bulkPut(colsSnap.docs.map(d => d.data() as Collection))
    }
    if (statsSnap.size) {
      await dexie.dailyStats.bulkPut(statsSnap.docs.map(d => d.data() as DailyStats))
    }
  } catch (err) {
    console.warn('[sync] pull failed:', err)
  }
}

// ── Push: Dexie → Firestore (first-time migration) ──────────────────────────
export async function pushLocalDataToCloud(userId: string): Promise<void> {
  try {
    const [words, cols, stats] = await Promise.all([
      dexie.words.toArray(),
      dexie.collections.toArray(),
      dexie.dailyStats.toArray(),
    ])

    // Use batched writes (max 500 per batch)
    const batch = writeBatch(firestore)

    words.forEach(w => batch.set(wordDoc(userId, w.id), clean(w)))
    cols.forEach(c => batch.set(colDoc(userId, c.id), clean(c)))
    stats.forEach(s => batch.set(statDoc(userId, s.date), clean(s)))

    await batch.commit()
  } catch (err) {
    console.warn('[sync] push failed:', err)
  }
}

// ── Sync helpers (called after every local write) ────────────────────────────
export async function syncWord(userId: string, wordId: string): Promise<void> {
  try {
    const word = await dexie.words.get(wordId)
    if (!word) return
    await setDoc(wordDoc(userId, wordId), clean(word))
  } catch (err) {
    console.warn('[sync] word upsert failed:', err)
  }
}

export async function deleteCloudWord(userId: string, wordId: string): Promise<void> {
  try {
    await deleteDoc(wordDoc(userId, wordId))
  } catch (err) {
    console.warn('[sync] word delete failed:', err)
  }
}

export async function syncCollection(userId: string, colId: string): Promise<void> {
  try {
    const col = await dexie.collections.get(colId)
    if (!col) return
    await setDoc(colDoc(userId, colId), clean(col))
  } catch (err) {
    console.warn('[sync] collection upsert failed:', err)
  }
}

export async function syncStats(userId: string, date: string): Promise<void> {
  try {
    const stat = await dexie.dailyStats.get(date)
    if (!stat) return
    await setDoc(statDoc(userId, date), clean(stat))
  } catch (err) {
    console.warn('[sync] stats upsert failed:', err)
  }
}
