import { nanoid } from 'nanoid'
import { db } from './schema'
import type { Collection } from '@/types'

const COLLECTION_COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e',
  '#f97316', '#eab308', '#22c55e', '#14b8a6', '#3b82f6',
]

const COLLECTION_ICONS = ['📚', '💼', '✍️', '🎓', '📝', '🌟', '💡', '🔬', '🎯']

export async function createCollection(name: string): Promise<Collection> {
  const existing = await db.collections.count()
  const collection: Collection = {
    id: nanoid(),
    name,
    color: COLLECTION_COLORS[existing % COLLECTION_COLORS.length],
    icon: COLLECTION_ICONS[existing % COLLECTION_ICONS.length],
    dateCreated: Date.now(),
  }
  await db.collections.add(collection)
  return collection
}

export async function getAllCollections(): Promise<Collection[]> {
  return db.collections.orderBy('name').toArray()
}

export async function getCollection(id: string): Promise<Collection | undefined> {
  return db.collections.get(id)
}

export async function deleteCollection(id: string): Promise<void> {
  await db.collections.delete(id)
  // Remove from all words
  const words = await db.words.where('collections').equals(id).toArray()
  for (const word of words) {
    await db.words.update(word.id, {
      collections: word.collections.filter((c) => c !== id),
    })
  }
}

export async function addWordToCollection(wordId: string, collectionId: string): Promise<void> {
  const word = await db.words.get(wordId)
  if (!word || word.collections.includes(collectionId)) return
  await db.words.update(wordId, { collections: [...word.collections, collectionId] })
}

export async function removeWordFromCollection(wordId: string, collectionId: string): Promise<void> {
  const word = await db.words.get(wordId)
  if (!word) return
  await db.words.update(wordId, {
    collections: word.collections.filter((c) => c !== collectionId),
  })
}
