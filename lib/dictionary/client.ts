'use server'

interface DictionaryPhonetic {
  text?: string
  audio?: string
}

interface DictionaryDefinition {
  definition: string
  example?: string
  synonyms: string[]
  antonyms: string[]
}

interface DictionaryMeaning {
  partOfSpeech: string
  definitions: DictionaryDefinition[]
  synonyms: string[]
  antonyms: string[]
}

interface DictionaryEntry {
  word: string
  phonetic?: string
  phonetics: DictionaryPhonetic[]
  meanings: DictionaryMeaning[]
}

export interface WordLookupResult {
  word: string
  pronunciation: string
  audioUrl: string
  partOfSpeech: string
  definition: string
  exampleSentence: string
  synonyms: string[]
  antonyms: string[]
}

export async function lookupWord(word: string): Promise<WordLookupResult | null> {
  try {
    const res = await fetch(
      `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word.trim().toLowerCase())}`,
      { next: { revalidate: 86400 } }
    )

    if (!res.ok) return null

    const data: DictionaryEntry[] = await res.json()
    if (!data || data.length === 0) return null

    const entry = data[0]

    const phonetic =
      entry.phonetic ||
      entry.phonetics.find((p) => p.text)?.text ||
      ''

    const audioUrl =
      entry.phonetics.find((p) => p.audio && p.audio.length > 0)?.audio || ''

    const allSynonyms: string[] = []
    const allAntonyms: string[] = []
    let definition = ''
    let exampleSentence = ''
    let partOfSpeech = ''

    for (const meaning of entry.meanings) {
      if (!partOfSpeech) partOfSpeech = meaning.partOfSpeech

      allSynonyms.push(...meaning.synonyms)
      allAntonyms.push(...meaning.antonyms)

      for (const def of meaning.definitions) {
        if (!definition) definition = def.definition
        if (!exampleSentence && def.example) exampleSentence = def.example
        allSynonyms.push(...def.synonyms)
        allAntonyms.push(...def.antonyms)
      }
    }

    return {
      word: entry.word,
      pronunciation: phonetic,
      audioUrl,
      partOfSpeech,
      definition,
      exampleSentence,
      synonyms: [...new Set(allSynonyms)].slice(0, 8),
      antonyms: [...new Set(allAntonyms)].slice(0, 8),
    }
  } catch {
    return null
  }
}
