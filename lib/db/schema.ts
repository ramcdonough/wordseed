import Dexie, { type Table } from 'dexie'
import type { Word, Collection, QuizSession, DailyStats } from '@/types'

export class WordSeedDB extends Dexie {
  words!: Table<Word>
  collections!: Table<Collection>
  quizSessions!: Table<QuizSession>
  dailyStats!: Table<DailyStats>

  constructor() {
    super('wordseed')

    this.version(1).stores({
      words: 'id, word, isArchived, nextReviewDate, dateAdded, masteryScore, *collections',
      collections: 'id, name, dateCreated',
      quizSessions: 'id, startTime, completed',
      dailyStats: 'date',
    })
  }
}

export const db = new WordSeedDB()
