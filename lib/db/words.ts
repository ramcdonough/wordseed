import { nanoid } from 'nanoid'
import { db } from './schema'
import type { Word } from '@/types'
import { calculateMastery } from '@/lib/srs/sm2'
import { todayKey } from '@/lib/utils/date'

const DEFAULT_WORD: Omit<Word, 'id' | 'word' | 'definition' | 'partOfSpeech' | 'exampleSentence' | 'pronunciation'> = {
  audioUrl: '',
  synonyms: [],
  antonyms: [],
  collections: [],
  notes: '',
  isArchived: false,
  dateAdded: 0,
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

export async function createWord(data: Omit<Word, 'id' | 'dateAdded' | 'interval' | 'easeFactor' | 'repetitions' | 'timesSeen' | 'timesCorrect' | 'timesIncorrect' | 'masteryScore' | 'lastReviewed' | 'nextReviewDate'>): Promise<Word> {
  const word: Word = {
    ...DEFAULT_WORD,
    ...data,
    id: nanoid(),
    dateAdded: Date.now(),
  }
  await db.words.add(word)
  return word
}

export async function updateWord(id: string, updates: Partial<Word>): Promise<void> {
  await db.words.update(id, updates)
}

export async function deleteWord(id: string): Promise<void> {
  await db.words.delete(id)
}

export async function archiveWord(id: string): Promise<void> {
  await db.words.update(id, { isArchived: true })
}

export async function restoreWord(id: string): Promise<void> {
  await db.words.update(id, { isArchived: false })
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

  // Prioritize due words, then shuffle the rest
  const due = all.filter((w) => !w.nextReviewDate || w.nextReviewDate <= now)
  const notDue = all.filter((w) => w.nextReviewDate && w.nextReviewDate > now)

  const shuffled = [...due.sort(() => Math.random() - 0.5), ...notDue.sort(() => Math.random() - 0.5)]
  return shuffled.slice(0, limit)
}

export async function incrementWordSeen(id: string): Promise<void> {
  const word = await db.words.get(id)
  if (!word) return
  await db.words.update(id, { timesSeen: word.timesSeen + 1 })
}

export async function recordReview(id: string, updates: Partial<Word>): Promise<void> {
  await db.words.update(id, updates)
  await updateDailyStats(updates.timesCorrect !== undefined)
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
