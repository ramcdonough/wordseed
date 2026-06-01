import type { Word, Collection, DailyStats } from '@/types'

// ── Word ──────────────────────────────────────────────────────────────────────
export function wordToCloud(word: Word, userId: string) {
  return {
    id:               word.id,
    user_id:          userId,
    word:             word.word,
    definition:       word.definition,
    part_of_speech:   word.partOfSpeech,
    example_sentence: word.exampleSentence,
    pronunciation:    word.pronunciation,
    audio_url:        word.audioUrl ?? '',
    synonyms:         word.synonyms,
    antonyms:         word.antonyms,
    collections:      word.collections,
    notes:            word.notes,
    is_archived:      word.isArchived,
    date_added:       word.dateAdded,
    last_reviewed:    word.lastReviewed,
    next_review_date: word.nextReviewDate,
    interval:         word.interval,
    ease_factor:      word.easeFactor,
    repetitions:      word.repetitions,
    times_seen:       word.timesSeen,
    times_correct:    word.timesCorrect,
    times_incorrect:  word.timesIncorrect,
    mastery_score:    word.masteryScore,
    updated_at:       new Date().toISOString(),
  }
}

export function wordFromCloud(row: Record<string, unknown>): Word {
  return {
    id:              row.id as string,
    word:            row.word as string,
    definition:      (row.definition as string) ?? '',
    partOfSpeech:    (row.part_of_speech as string) ?? '',
    exampleSentence: (row.example_sentence as string) ?? '',
    pronunciation:   (row.pronunciation as string) ?? '',
    audioUrl:        (row.audio_url as string) ?? '',
    synonyms:        (row.synonyms as string[]) ?? [],
    antonyms:        (row.antonyms as string[]) ?? [],
    collections:     (row.collections as string[]) ?? [],
    notes:           (row.notes as string) ?? '',
    isArchived:      (row.is_archived as boolean) ?? false,
    dateAdded:       (row.date_added as number) ?? 0,
    lastReviewed:    (row.last_reviewed as number | null) ?? null,
    nextReviewDate:  (row.next_review_date as number | null) ?? null,
    interval:        (row.interval as number) ?? 0,
    easeFactor:      Number(row.ease_factor ?? 2.5),
    repetitions:     (row.repetitions as number) ?? 0,
    timesSeen:       (row.times_seen as number) ?? 0,
    timesCorrect:    (row.times_correct as number) ?? 0,
    timesIncorrect:  (row.times_incorrect as number) ?? 0,
    masteryScore:    (row.mastery_score as number) ?? 0,
  }
}

// ── Collection ────────────────────────────────────────────────────────────────
export function collectionToCloud(c: Collection, userId: string) {
  return {
    id:           c.id,
    user_id:      userId,
    name:         c.name,
    color:        c.color,
    icon:         c.icon,
    date_created: c.dateCreated,
    updated_at:   new Date().toISOString(),
  }
}

export function collectionFromCloud(row: Record<string, unknown>): Collection {
  return {
    id:          row.id as string,
    name:        row.name as string,
    color:       (row.color as string) ?? '#818cf8',
    icon:        (row.icon as string) ?? '📚',
    dateCreated: (row.date_created as number) ?? 0,
  }
}

// ── Daily stats ───────────────────────────────────────────────────────────────
export function statsToCloud(s: DailyStats, userId: string) {
  return {
    date:              s.date,
    user_id:           userId,
    words_reviewed:    s.wordsReviewed,
    correct_answers:   s.correctAnswers,
    incorrect_answers: s.incorrectAnswers,
    quiz_sessions:     s.quizSessions,
    updated_at:        new Date().toISOString(),
  }
}

export function statsFromCloud(row: Record<string, unknown>): DailyStats {
  return {
    date:              row.date as string,
    wordsReviewed:     (row.words_reviewed as number) ?? 0,
    correctAnswers:    (row.correct_answers as number) ?? 0,
    incorrectAnswers:  (row.incorrect_answers as number) ?? 0,
    quizSessions:      (row.quiz_sessions as number) ?? 0,
  }
}
