export interface Word {
  id: string
  word: string
  definition: string
  partOfSpeech: string
  exampleSentence: string
  pronunciation: string
  audioUrl?: string
  synonyms: string[]
  antonyms: string[]
  collections: string[]
  notes: string
  isArchived: boolean
  dateAdded: number
  lastReviewed: number | null
  nextReviewDate: number | null
  // SM-2
  interval: number
  easeFactor: number
  repetitions: number
  // Stats
  timesSeen: number
  timesCorrect: number
  timesIncorrect: number
  masteryScore: number
}

export interface Collection {
  id: string
  name: string
  color: string
  icon: string
  dateCreated: number
}

export type QuestionType =
  | 'word_to_definition'
  | 'definition_to_word'
  | 'fill_in_blank'
  | 'true_or_false'
  | 'synonym_challenge'
  | 'antonym_challenge'

export interface Question {
  type: QuestionType
  word: Word
  prompt: string
  options?: string[]
  correctAnswer: string
  explanation?: string
}

export interface QuizResult {
  wordId: string
  word: string
  questionType: QuestionType
  isCorrect: boolean
  userAnswer: string
  correctAnswer: string
  timeSpent: number
}

export interface QuizSession {
  id: string
  startTime: number
  endTime: number | null
  wordIds: string[]
  results: QuizResult[]
  collectionId: string | null
  includeArchived: boolean
  totalQuestions: number
  completed: boolean
}

export interface DailyStats {
  date: string
  wordsReviewed: number
  correctAnswers: number
  incorrectAnswers: number
  quizSessions: number
}

export interface QuizConfig {
  collectionId: string | null
  includeArchived: boolean
  wordCount: number
  questionTypes: QuestionType[]
  dueOnly: boolean
}
