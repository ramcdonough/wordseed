'use client'

import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/lib/db/schema'

export function useWords(includeArchived = false) {
  return useLiveQuery(
    () =>
      includeArchived
        ? db.words.orderBy('dateAdded').reverse().toArray()
        : db.words.filter((w) => !w.isArchived).reverse().sortBy('dateAdded'),
    [includeArchived],
    []
  )
}

export function useWord(id: string | undefined) {
  return useLiveQuery(() => (id ? db.words.get(id) : undefined), [id])
}

export function useDueWords() {
  return useLiveQuery(() => {
    const now = Date.now()
    return db.words
      .filter((w) => !w.isArchived && (!w.nextReviewDate || w.nextReviewDate <= now))
      .toArray()
  }, [], [])
}

export function useWordCount() {
  return useLiveQuery(async () => {
    const all = await db.words.toArray()
    const archived = all.filter((w) => w.isArchived).length
    return { total: all.length, active: all.length - archived, archived }
  }, [], { total: 0, active: 0, archived: 0 })
}
