import { nanoid } from 'nanoid'
import { db } from './schema'
import type { QuizSession, QuizResult } from '@/types'
import { todayKey } from '@/lib/utils/date'

export async function createQuizSession(
  wordIds: string[],
  collectionId: string | null,
  includeArchived: boolean
): Promise<QuizSession> {
  const session: QuizSession = {
    id: nanoid(),
    startTime: Date.now(),
    endTime: null,
    wordIds,
    results: [],
    collectionId,
    includeArchived,
    totalQuestions: wordIds.length,
    completed: false,
  }
  await db.quizSessions.add(session)
  return session
}

export async function finishQuizSession(
  id: string,
  results: QuizResult[]
): Promise<void> {
  const correct = results.filter((r) => r.isCorrect).length
  await db.quizSessions.update(id, {
    endTime: Date.now(),
    results,
    completed: true,
  })

  // Bump daily quiz session count
  const date = todayKey()
  const stats = await db.dailyStats.get(date)
  if (stats) {
    await db.dailyStats.update(date, { quizSessions: stats.quizSessions + 1 })
  } else {
    await db.dailyStats.add({
      date,
      wordsReviewed: results.length,
      correctAnswers: correct,
      incorrectAnswers: results.length - correct,
      quizSessions: 1,
    })
  }
}

export async function getRecentSessions(limit = 10): Promise<QuizSession[]> {
  return db.quizSessions
    .orderBy('startTime')
    .reverse()
    .filter((s) => s.completed)
    .limit(limit)
    .toArray()
}

export async function getStats() {
  const allWords = await db.words.toArray()
  const active = allWords.filter((w) => !w.isArchived)
  const archived = allWords.filter((w) => w.isArchived)
  const allDailyStats = await db.dailyStats.toArray()
  const sessions = await db.quizSessions.filter((s) => s.completed).toArray()

  const totalCorrect = allDailyStats.reduce((a, s) => a + s.correctAnswers, 0)
  const totalReviewed = allDailyStats.reduce((a, s) => a + s.wordsReviewed, 0)
  const accuracy = totalReviewed > 0 ? Math.round((totalCorrect / totalReviewed) * 100) : 0

  const streakDates = allDailyStats
    .filter((s) => s.wordsReviewed > 0)
    .map((s) => s.date)

  return {
    totalWords: allWords.length,
    activeWords: active.length,
    archivedWords: archived.length,
    accuracy,
    streakDates,
    sessionsCompleted: sessions.length,
    dailyStats: allDailyStats.sort((a, b) => a.date.localeCompare(b.date)),
  }
}
