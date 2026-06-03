'use server'

import { getModel } from '@/lib/ai/client'
import { extractJson } from '@/lib/ai/parseJson'

export type StoryPart =
  | { type: 'text'; content: string }
  | { type: 'blank'; word: string; index: number }

export interface GeneratedStory {
  parts: StoryPart[]
  words: string[]
}

// Keys Gemma sometimes uses instead of "parts"
const PARTS_ALIASES = ['parts', 'story', 'sentences', 'segments', 'content', 'items', 'elements']

function looksLikePartsArray(arr: unknown[]): boolean {
  return arr.length > 0 && typeof arr[0] === 'object' && arr[0] !== null && 'type' in arr[0]
}

function extractParts(parsed: unknown): StoryPart[] {
  // Flat array — model skipped the wrapper object entirely
  if (Array.isArray(parsed)) {
    if (looksLikePartsArray(parsed)) return parsed as StoryPart[]
    // Array of arrays (rare but possible)
    for (const item of parsed) {
      if (Array.isArray(item) && looksLikePartsArray(item)) return item as StoryPart[]
    }
  }

  if (typeof parsed !== 'object' || parsed === null) {
    throw new Error(`AI returned unexpected type: ${typeof parsed}`)
  }

  const obj = parsed as Record<string, unknown>

  // Try known key aliases
  for (const key of PARTS_ALIASES) {
    const val = obj[key]
    if (Array.isArray(val) && val.length > 0) return val as StoryPart[]
  }

  // Any array-valued key that looks like StoryParts
  for (const val of Object.values(obj)) {
    if (Array.isArray(val) && looksLikePartsArray(val)) return val as StoryPart[]
  }

  throw new Error(
    `AI response missing "parts" array. Keys found: ${Object.keys(obj).join(', ')}`,
  )
}

export async function generateStory(words: string[]): Promise<GeneratedStory> {
  const model = getModel()
  const wordList = words.join(', ')

  const result = await model.generateContent(`Write an engaging narrative of 4–6 sentences that naturally incorporates ALL of these words: ${wordList}.

Each sentence should be descriptive and provide enough surrounding context that a reader could reasonably guess what word belongs in each blank — without making it trivially obvious. Avoid cramming all the words into one short sentence; spread them across the paragraph with breathing room.

Return ONLY valid JSON in this exact format — no explanation, no markdown, no code fences:
{
  "parts": [
    { "type": "text", "content": "..." },
    { "type": "blank", "word": "EXACT_WORD_FROM_LIST", "index": 0 },
    { "type": "text", "content": "..." }
  ]
}

Rules:
- Every word from the list must appear exactly once as a "blank" part
- "index" values must be 0, 1, 2... in the order blanks appear
- Use each word exactly as provided (same form, same capitalisation)
- Each blank must have meaningful text before and after it as context`)

  const raw = result.response.text()
  const parsed = extractJson<unknown>(raw)
  const parts = extractParts(parsed)

  // Normalise: re-index blanks in order and ensure text parts have content
  let blankCounter = 0
  const normalisedParts: StoryPart[] = parts
    .filter((p) => p && typeof p === 'object' && 'type' in p)
    .map((p) => {
      if (p.type === 'blank') {
        return { type: 'blank' as const, word: String(p.word ?? ''), index: blankCounter++ }
      }
      return { type: 'text' as const, content: String((p as { content?: unknown }).content ?? '') }
    })
    .filter((p) => (p.type === 'text' ? p.content.length > 0 : p.word.length > 0))

  if (!normalisedParts.some((p) => p.type === 'blank')) {
    throw new Error('AI returned no blank slots — please try again.')
  }

  return { parts: normalisedParts, words }
}
