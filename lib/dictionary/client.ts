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

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, '').replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&#39;/g, "'").trim()
}

interface WiktionaryDefinition {
  definition: string
  examples?: string[]
  parsedExamples?: { example: string }[]
}

interface WiktionarySection {
  partOfSpeech: string
  language: string
  definitions: WiktionaryDefinition[]
}

async function lookupWordWiktionary(word: string): Promise<WordLookupResult | null> {
  const candidates = [word, word.charAt(0).toUpperCase() + word.slice(1)]
  for (const candidate of candidates) {
    try {
      const res = await fetch(
        `https://en.wiktionary.org/api/rest_v1/page/definition/${encodeURIComponent(candidate)}`,
        { next: { revalidate: 86400 } }
      )
      if (!res.ok) continue
      const data: Record<string, WiktionarySection[]> = await res.json()
      const sections: WiktionarySection[] = data['en'] ?? []
      if (!sections.length) continue

      const section = sections[0]
      const def = section.definitions[0]
      if (!def) continue

      const definition = stripHtml(def.definition)
      const rawExample = def.parsedExamples?.[0]?.example ?? def.examples?.[0] ?? ''
      const exampleSentence = stripHtml(rawExample)

      return {
        word: word.toLowerCase(),
        pronunciation: '',
        audioUrl: '',
        partOfSpeech: section.partOfSpeech.toLowerCase(),
        definition,
        exampleSentence,
        synonyms: [],
        antonyms: [],
      }
    } catch {
      continue
    }
  }
  return null
}

export async function lookupWord(word: string): Promise<WordLookupResult | null> {
  try {
    const res = await fetch(
      `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word.trim().toLowerCase())}`,
      { next: { revalidate: 86400 } }
    )

    if (!res.ok) return lookupWordWiktionary(word.trim())

    const data: DictionaryEntry[] = await res.json()
    if (!data || data.length === 0) return lookupWordWiktionary(word.trim())

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
    return lookupWordWiktionary(word.trim())
  }
}
