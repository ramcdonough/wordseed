import { create } from 'zustand'
import type { QuizResult } from '@/types'
import type { GeneratedQuestion } from '@/lib/quiz/types'

interface QuizStore {
  sessionId: string | null
  questions: GeneratedQuestion[]
  currentIndex: number
  results: QuizResult[]
  isFinished: boolean
  startSession: (sessionId: string, questions: GeneratedQuestion[]) => void
  recordAnswer: (result: QuizResult) => void
  nextQuestion: () => void
  reset: () => void
}

export const useQuizStore = create<QuizStore>((set, get) => ({
  sessionId: null,
  questions: [],
  currentIndex: 0,
  results: [],
  isFinished: false,

  startSession: (sessionId, questions) =>
    set({ sessionId, questions, currentIndex: 0, results: [], isFinished: false }),

  recordAnswer: (result) =>
    set((s) => ({ results: [...s.results, result] })),

  nextQuestion: () =>
    set((s) => {
      const next = s.currentIndex + 1
      return { currentIndex: next, isFinished: next >= s.questions.length }
    }),

  reset: () =>
    set({ sessionId: null, questions: [], currentIndex: 0, results: [], isFinished: false }),
}))
