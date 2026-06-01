'use server'

import { lookupWord } from '@/lib/dictionary/client'
import type { WordLookupResult } from '@/lib/dictionary/client'

export async function fetchWordDefinition(word: string): Promise<WordLookupResult | null> {
  if (!word.trim()) return null
  return lookupWord(word.trim())
}
