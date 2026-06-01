'use client'

import { onSnapshot } from 'firebase/firestore'
import { db as dexie } from '@/lib/db/schema'
import { wordsCol, colsCol } from '@/lib/firebase/schema'
import type { Word, Collection } from '@/types'

type Unsubscribe = () => void
let unsubs: Unsubscribe[] = []

export function subscribeToChanges(userId: string): Unsubscribe {
  // Clean up any existing listeners
  unsubs.forEach(u => u())
  unsubs = []

  // Words — real-time mirror into Dexie
  const unsubWords = onSnapshot(wordsCol(userId), (snap) => {
    snap.docChanges().forEach(async (change) => {
      if (change.type === 'removed') {
        await dexie.words.delete(change.doc.id)
      } else {
        await dexie.words.put(change.doc.data() as Word)
      }
    })
  })

  // Collections — real-time mirror into Dexie
  const unsubCols = onSnapshot(colsCol(userId), (snap) => {
    snap.docChanges().forEach(async (change) => {
      if (change.type === 'removed') {
        await dexie.collections.delete(change.doc.id)
      } else {
        await dexie.collections.put(change.doc.data() as Collection)
      }
    })
  })

  unsubs = [unsubWords, unsubCols]

  return () => {
    unsubs.forEach(u => u())
    unsubs = []
  }
}
