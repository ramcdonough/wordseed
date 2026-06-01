import { nanoid } from 'nanoid'
import type { Word, QuestionType } from '@/types'
import type { GeneratedQuestion } from './types'

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function getDistractors(target: Word, pool: Word[], count = 3): Word[] {
  const others = pool.filter((w) => w.id !== target.id)
  return shuffle(others).slice(0, count)
}

function truncate(str: string, max = 80): string {
  return str.length > max ? str.slice(0, max) + '…' : str
}

export function generateQuestion(
  word: Word,
  pool: Word[],
  type: QuestionType
): GeneratedQuestion | null {
  const distractors = getDistractors(word, pool, 3)
  if (distractors.length < 3) return null

  switch (type) {
    case 'word_to_definition': {
      const options = shuffle([
        word.definition,
        ...distractors.map((d) => d.definition),
      ]).map((d) => truncate(d))
      return {
        id: nanoid(),
        type,
        word,
        prompt: word.word,
        options,
        correctAnswer: truncate(word.definition),
        hint: `(${word.partOfSpeech})`,
      }
    }

    case 'definition_to_word': {
      const options = shuffle([
        word.word,
        ...distractors.map((d) => d.word),
      ])
      return {
        id: nanoid(),
        type,
        word,
        prompt: truncate(word.definition, 120),
        options,
        correctAnswer: word.word,
        hint: `(${word.partOfSpeech})`,
      }
    }

    case 'fill_in_blank': {
      if (!word.exampleSentence) return null
      const blank = word.exampleSentence.replace(
        new RegExp(word.word, 'gi'),
        '________'
      )
      if (!blank.includes('________')) {
        // If word not in sentence, just show the sentence with blank at end
        const options = shuffle([word.word, ...distractors.map((d) => d.word)])
        return {
          id: nanoid(),
          type,
          word,
          prompt: `"${blank}"`,
          options,
          correctAnswer: word.word,
        }
      }
      const options = shuffle([word.word, ...distractors.map((d) => d.word)])
      return {
        id: nanoid(),
        type,
        word,
        prompt: `"${blank}"`,
        options,
        correctAnswer: word.word,
      }
    }

    case 'true_or_false': {
      // Randomly decide: correct definition or a wrong one
      const isTrue = Math.random() > 0.5
      const shownDefinition = isTrue
        ? word.definition
        : distractors[0].definition

      return {
        id: nanoid(),
        type,
        word,
        prompt: `"${word.word}" means: "${truncate(shownDefinition, 100)}"`,
        options: ['True', 'False'],
        correctAnswer: isTrue ? 'True' : 'False',
      }
    }

    case 'synonym_challenge': {
      if (word.synonyms.length === 0) return null
      const correctSynonym = word.synonyms[Math.floor(Math.random() * word.synonyms.length)]
      const wrongOptions = distractors.flatMap((d) => d.antonyms.concat(d.word)).filter(Boolean)
      if (wrongOptions.length < 3) return null
      const options = shuffle([correctSynonym, ...shuffle(wrongOptions).slice(0, 3)])
      return {
        id: nanoid(),
        type,
        word,
        prompt: `Which word is a synonym of "${word.word}"?`,
        options,
        correctAnswer: correctSynonym,
        hint: truncate(word.definition, 60),
      }
    }

    case 'antonym_challenge': {
      if (word.antonyms.length === 0) return null
      const correctAntonym = word.antonyms[Math.floor(Math.random() * word.antonyms.length)]
      const wrongOptions = distractors.flatMap((d) => d.synonyms.concat(d.word)).filter(Boolean)
      if (wrongOptions.length < 3) return null
      const options = shuffle([correctAntonym, ...shuffle(wrongOptions).slice(0, 3)])
      return {
        id: nanoid(),
        type,
        word,
        prompt: `Which word is an antonym of "${word.word}"?`,
        options,
        correctAnswer: correctAntonym,
        hint: truncate(word.definition, 60),
      }
    }

    default:
      return null
  }
}

const ALL_TYPES: QuestionType[] = [
  'word_to_definition',
  'definition_to_word',
  'fill_in_blank',
  'true_or_false',
  'synonym_challenge',
  'antonym_challenge',
]

export function generateQuiz(
  words: Word[],
  allowedTypes: QuestionType[] = ALL_TYPES
): GeneratedQuestion[] {
  const questions: GeneratedQuestion[] = []

  for (const word of words) {
    // Try types in random order until one succeeds
    const typesToTry = shuffle(allowedTypes)
    let generated = false

    for (const type of typesToTry) {
      const q = generateQuestion(word, words, type)
      if (q) {
        questions.push(q)
        generated = true
        break
      }
    }

    // Fallback to word_to_definition which always works
    if (!generated) {
      const fallback = generateQuestion(word, words, 'word_to_definition')
      if (fallback) questions.push(fallback)
    }
  }

  return shuffle(questions)
}
