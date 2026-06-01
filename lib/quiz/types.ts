import type { QuestionType, Word } from '@/types'

export interface GeneratedQuestion {
  id: string
  type: QuestionType
  word: Word
  prompt: string
  options: string[]
  correctAnswer: string
  hint?: string
}
