import { nanoid } from 'nanoid'
import { db } from './schema'
import type { Word } from '@/types'
import { todayKey } from '@/lib/utils/date'
import { syncWord, deleteCloudWord, syncStats } from '@/lib/sync/service'
import { useAuthStore } from '@/stores/auth'

// Helper: get current user id (may be null if not signed in)
function userId() {
  return useAuthStore.getState().user?.id ?? null
}

export async function createWord(
  data: Omit<Word, 'id' | 'dateAdded' | 'interval' | 'easeFactor' | 'repetitions' | 'timesSeen' | 'timesCorrect' | 'timesIncorrect' | 'masteryScore' | 'lastReviewed' | 'nextReviewDate'>
): Promise<Word> {
  const word: Word = {
    ...data,
    id: nanoid(),
    dateAdded: Date.now(),
    lastReviewed: null,
    nextReviewDate: null,
    interval: 0,
    easeFactor: 2.5,
    repetitions: 0,
    timesSeen: 0,
    timesCorrect: 0,
    timesIncorrect: 0,
    masteryScore: 0,
  }
  await db.words.add(word)
  const uid = userId()
  if (uid) syncWord(uid, word.id)
  return word
}

export async function updateWord(id: string, updates: Partial<Word>): Promise<void> {
  await db.words.update(id, updates)
  const uid = userId()
  if (uid) syncWord(uid, id)
}

export async function deleteWord(id: string): Promise<void> {
  await db.words.delete(id)
  const uid = userId()
  if (uid) deleteCloudWord(uid, id)
}

export async function archiveWord(id: string): Promise<void> {
  await db.words.update(id, { isArchived: true })
  const uid = userId()
  if (uid) syncWord(uid, id)
}

export async function restoreWord(id: string): Promise<void> {
  await db.words.update(id, { isArchived: false })
  const uid = userId()
  if (uid) syncWord(uid, id)
}

export async function getWord(id: string): Promise<Word | undefined> {
  return db.words.get(id)
}

export async function getAllWords(includeArchived = false): Promise<Word[]> {
  if (includeArchived) return db.words.orderBy('dateAdded').reverse().toArray()
  return db.words.filter((w) => !w.isArchived).reverse().sortBy('dateAdded')
}

export async function getDueWords(): Promise<Word[]> {
  const now = Date.now()
  return db.words
    .filter((w) => !w.isArchived && (!w.nextReviewDate || w.nextReviewDate <= now))
    .toArray()
}

export async function getWordsByCollection(collectionId: string): Promise<Word[]> {
  return db.words
    .where('collections').equals(collectionId)
    .filter((w) => !w.isArchived)
    .toArray()
}

export async function getWordsForQuiz(
  collectionId: string | null,
  includeArchived: boolean,
  limit: number,
  dueOnly: boolean
): Promise<Word[]> {
  const now = Date.now()
  let query = db.words.filter((w) => includeArchived ? true : !w.isArchived)

  if (collectionId) {
    query = query.filter((w) => w.collections.includes(collectionId))
  }
  if (dueOnly) {
    query = query.filter((w) => !w.nextReviewDate || w.nextReviewDate <= now)
  }

  const all = await query.toArray()
  const due = all.filter((w) => !w.nextReviewDate || w.nextReviewDate <= now)
  const notDue = all.filter((w) => w.nextReviewDate && w.nextReviewDate > now)
  return [...due.sort(() => Math.random() - 0.5), ...notDue.sort(() => Math.random() - 0.5)].slice(0, limit)
}

export async function recordReview(id: string, updates: Partial<Word>): Promise<void> {
  await db.words.update(id, updates)
  const uid = userId()
  if (uid) {
    syncWord(uid, id)
    const date = todayKey()
    await updateDailyStats(typeof updates.timesCorrect !== 'undefined')
    syncStats(uid, date)
  }
}

async function updateDailyStats(wasCorrect: boolean): Promise<void> {
  const date = todayKey()
  const existing = await db.dailyStats.get(date)
  if (existing) {
    await db.dailyStats.update(date, {
      wordsReviewed: existing.wordsReviewed + 1,
      correctAnswers: existing.correctAnswers + (wasCorrect ? 1 : 0),
      incorrectAnswers: existing.incorrectAnswers + (wasCorrect ? 0 : 1),
    })
  } else {
    await db.dailyStats.add({
      date,
      wordsReviewed: 1,
      correctAnswers: wasCorrect ? 1 : 0,
      incorrectAnswers: wasCorrect ? 0 : 1,
      quizSessions: 0,
    })
  }
}
