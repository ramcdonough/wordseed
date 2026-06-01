'use client'

import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/lib/db/schema'
import { calculateStreak, getLast7Days } from '@/lib/utils/date'

export function useStats() {
  return useLiveQuery(async () => {
    const [allWords, allDailyStats, sessions] = await Promise.all([
      db.words.toArray(),
      db.dailyStats.toArray(),
      db.quizSessions.filter((s) => s.completed).toArray(),
    ])

    const active = allWords.filter((w) => !w.isArchived)
    const archived = allWords.filter((w) => w.isArchived)

    const totalCorrect = allDailyStats.reduce((a, s) => a + s.correctAnswers, 0)
    const totalReviewed = allDailyStats.reduce((a, s) => a + s.wordsReviewed, 0)
    const accuracy = totalReviewed > 0 ? Math.round((totalCorrect / totalReviewed) * 100) : 0

    const streakDates = allDailyStats.filter((s) => s.wordsReviewed > 0).map((s) => s.date)
    const streak = calculateStreak(streakDates)

    const last7 = getLast7Days()
    const weeklyActivity = last7.map((date) => {
      const day = allDailyStats.find((s) => s.date === date)
      return { date, count: day?.wordsReviewed ?? 0 }
    })

    const hardestWords = [...active]
      .filter((w) => w.timesSeen > 0)
      .sort((a, b) => {
        const aRate = a.timesIncorrect / a.timesSeen
        const bRate = b.timesIncorrect / b.timesSeen
        return bRate - aRate
      })
      .slice(0, 5)

    const masteredWords = [...active]
      .filter((w) => w.masteryScore >= 70)
      .sort((a, b) => b.masteryScore - a.masteryScore)
      .slice(0, 5)

    return {
      totalWords: allWords.length,
      activeWords: active.length,
      archivedWords: archived.length,
      accuracy,
      streak,
      streakDates,
      sessionsCompleted: sessions.length,
      dailyStats: allDailyStats.sort((a, b) => a.date.localeCompare(b.date)),
      weeklyActivity,
      hardestWords,
      masteredWords,
    }
  }, [], null)
}

export function useStreak() {
  return useLiveQuery(async () => {
    const stats = await db.dailyStats.filter((s) => s.wordsReviewed > 0).toArray()
    return calculateStreak(stats.map((s) => s.date))
  }, [], 0)
}
