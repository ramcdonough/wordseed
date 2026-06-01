'use client'

import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/lib/db/schema'

export function useCollections() {
  return useLiveQuery(() => db.collections.orderBy('name').toArray(), [], [])
}

export function useCollection(id: string | undefined) {
  return useLiveQuery(() => (id ? db.collections.get(id) : undefined), [id])
}
