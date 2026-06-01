import type { Word } from '@/types'
import { addDays } from '@/lib/utils/date'

export type ReviewQuality = 0 | 1 | 2 | 3 | 4 | 5

// quality 0–2 = incorrect/hard, 3–5 = correct with varying confidence
export function sm2(
  quality: ReviewQuality,
  repetitions: number,
  easeFactor: number,
  interval: number
): { repetitions: number; easeFactor: number; interval: number } {
  if (quality < 3) {
    return {
      repetitions: 0,
      interval: 1,
      easeFactor: Math.max(1.3, easeFactor - 0.2),
    }
  }

  let newInterval: number
  if (repetitions === 0) newInterval = 1
  else if (repetitions === 1) newInterval = 6
  else newInterval = Math.round(interval * easeFactor)

  const newEaseFactor = Math.max(
    1.3,
    easeFactor + 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)
  )

  return {
    repetitions: repetitions + 1,
    interval: newInterval,
    easeFactor: newEaseFactor,
  }
}

export function applyReview(word: Word, isCorrect: boolean): Partial<Word> {
  const quality: ReviewQuality = isCorrect ? 4 : 1
  const { repetitions, easeFactor, interval } = sm2(
    quality,
    word.repetitions,
    word.easeFactor,
    word.interval
  )

  const now = Date.now()
  const masteryScore = calculateMastery({
    ...word,
    repetitions,
    easeFactor,
    interval,
    timesCorrect: word.timesCorrect + (isCorrect ? 1 : 0),
    timesSeen: word.timesSeen + 1,
  })

  return {
    repetitions,
    easeFactor,
    interval,
    lastReviewed: now,
    nextReviewDate: addDays(now, interval),
    timesSeen: word.timesSeen + 1,
    timesCorrect: word.timesCorrect + (isCorrect ? 1 : 0),
    timesIncorrect: word.timesIncorrect + (isCorrect ? 0 : 1),
    masteryScore,
  }
}

export function calculateMastery(word: Pick<Word, 'timesSeen' | 'timesCorrect' | 'repetitions' | 'easeFactor' | 'interval'>): number {
  if (word.timesSeen === 0) return 0

  const accuracy = word.timesCorrect / word.timesSeen
  const repBonus = Math.min(word.repetitions / 10, 1) * 20
  const intervalBonus = Math.min(word.interval / 30, 1) * 20

  return Math.round(Math.min(100, accuracy * 60 + repBonus + intervalBonus))
}

export function isDue(word: Word): boolean {
  if (!word.nextReviewDate) return true
  return word.nextReviewDate <= Date.now()
}

export function getMasteryLabel(score: number): string {
  if (score >= 90) return 'Mastered'
  if (score >= 70) return 'Strong'
  if (score >= 40) return 'Learning'
  if (score >= 10) return 'Familiar'
  return 'New'
}

export function getMasteryColor(score: number): string {
  if (score >= 90) return 'mastery-mastered'
  if (score >= 70) return 'mastery-strong'
  if (score >= 40) return 'mastery-learning'
  if (score >= 10) return 'mastery-familiar'
  return 'mastery-new'
}
