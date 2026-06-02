'use server'

import type { DiscoverCategory } from '@/lib/discover/words'

export interface RemoteWord {
  word: string
  pos: string
  snippet: string
}

// Each entry is [queryType, seedValue].
// Query types: 'topics' | 'ml' (means like) | 'rel_trg' (triggers)
type QuerySpec = ['topics' | 'ml' | 'rel_trg', string]

const SEEDS: Record<DiscoverCategory, QuerySpec[]> = {
  all: [
    ['ml',     'eloquent'],
    ['ml',     'erudite'],
    ['ml',     'perspicacious'],
    ['topics', 'rhetoric discourse eloquence'],
    ['ml',     'sagacious'],
    ['rel_trg','vocabulary'],
    ['ml',     'loquacious'],
    ['topics', 'linguistics semantics grammar'],
    ['ml',     'articulate'],
    ['rel_trg','intellect'],
    ['ml',     'verbose'],
    ['topics', 'wisdom knowledge learning'],
  ],
  politics: [
    ['topics', 'politics government democracy'],
    ['ml',     'sovereignty'],
    ['rel_trg','parliament'],
    ['ml',     'demagogue'],
    ['topics', 'law jurisprudence civil'],
    ['ml',     'oligarchy'],
    ['rel_trg','election'],
    ['ml',     'sedition'],
    ['topics', 'authority power governance'],
    ['ml',     'manifesto'],
    ['rel_trg','diplomacy'],
    ['ml',     'hegemony'],
  ],
  philosophy: [
    ['ml',     'epistemology'],
    ['topics', 'philosophy ethics metaphysics'],
    ['ml',     'dialectic'],
    ['rel_trg','consciousness'],
    ['ml',     'solipsism'],
    ['topics', 'logic reason argument'],
    ['ml',     'teleology'],
    ['rel_trg','morality'],
    ['ml',     'phenomenology'],
    ['topics', 'virtue wisdom stoicism'],
    ['ml',     'nihilism'],
    ['rel_trg','existence'],
  ],
  science: [
    ['ml',     'empirical'],
    ['topics', 'science discovery research'],
    ['ml',     'entropy'],
    ['rel_trg','hypothesis'],
    ['ml',     'synthesis'],
    ['topics', 'physics chemistry biology'],
    ['ml',     'taxonomy'],
    ['rel_trg','evolution'],
    ['ml',     'stochastic'],
    ['topics', 'mathematics statistics probability'],
    ['ml',     'parsimony'],
    ['rel_trg','experiment'],
  ],
  literature: [
    ['ml',     'allegory'],
    ['topics', 'literature poetry narrative'],
    ['ml',     'denouement'],
    ['rel_trg','metaphor'],
    ['ml',     'hubris'],
    ['topics', 'symbolism rhetoric writing'],
    ['ml',     'didactic'],
    ['rel_trg','narrative'],
    ['ml',     'verisimilitude'],
    ['topics', 'drama verse fiction'],
    ['ml',     'anachronism'],
    ['rel_trg','prose'],
  ],
  psychology: [
    ['ml',     'catharsis'],
    ['topics', 'psychology cognition behaviour'],
    ['ml',     'narcissism'],
    ['rel_trg','emotion'],
    ['ml',     'sublimation'],
    ['topics', 'perception memory learning'],
    ['ml',     'ambivalence'],
    ['rel_trg','consciousness'],
    ['ml',     'resilience'],
    ['topics', 'personality motivation instinct'],
    ['ml',     'dissociation'],
    ['rel_trg','therapy'],
  ],
  arts: [
    ['ml',     'aesthetic'],
    ['topics', 'art aesthetics culture'],
    ['ml',     'baroque'],
    ['rel_trg','painting'],
    ['ml',     'chiaroscuro'],
    ['topics', 'music composition rhythm'],
    ['ml',     'gestalt'],
    ['rel_trg','sculpture'],
    ['ml',     'mimesis'],
    ['topics', 'design form beauty'],
    ['ml',     'avant-garde'],
    ['rel_trg','architecture'],
  ],
  nature: [
    ['ml',     'sylvan'],
    ['topics', 'nature ecology wilderness'],
    ['ml',     'ephemeral'],
    ['rel_trg','forest'],
    ['ml',     'verdant'],
    ['topics', 'flora fauna habitat'],
    ['ml',     'riparian'],
    ['rel_trg','ocean'],
    ['ml',     'endemic'],
    ['topics', 'weather climate geology'],
    ['ml',     'fecund'],
    ['rel_trg','mountain'],
  ],
  legal: [
    ['ml',     'jurisprudence'],
    ['topics', 'law court justice'],
    ['ml',     'litigation'],
    ['rel_trg','trial'],
    ['ml',     'culpable'],
    ['topics', 'legal statute rights'],
    ['ml',     'indictment'],
    ['rel_trg','lawyer'],
    ['ml',     'acquittal'],
    ['topics', 'criminal civil procedure'],
    ['ml',     'malfeasance'],
    ['rel_trg','verdict'],
  ],
}

export async function fetchRemoteWords(
  category: DiscoverCategory,
  exclude: string[],
  seedIndex: number = 0,
): Promise<RemoteWord[]> {
  try {
    const specs = SEEDS[category]
    const [queryType, seed] = specs[seedIndex % specs.length]
    const excludeSet = new Set(exclude.map((w) => w.toLowerCase()))

    // 1. Fetch 200 candidates from Datamuse
    const url = `https://api.datamuse.com/words?${queryType}=${encodeURIComponent(seed)}&max=200`
    const datamuse = await fetch(url, { next: { revalidate: 3600 } })
    if (!datamuse.ok) return []
    const candidates: { word: string; score?: number }[] = await datamuse.json()

    // Filter: not excluded, 4–20 chars, only letters (or one hyphen)
    const filtered = candidates
      .filter(
        (c) =>
          !excludeSet.has(c.word.toLowerCase()) &&
          c.word.length >= 4 &&
          c.word.length <= 20 &&
          /^[a-z]+(-[a-z]+)?$/i.test(c.word),
      )
      .slice(0, 50)
      .map((c) => c.word)

    if (filtered.length === 0) return []

    // 2. Fetch definitions in parallel from Free Dictionary
    const results = await Promise.all(
      filtered.map(async (word) => {
        try {
          const res = await fetch(
            `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`,
            { next: { revalidate: 86400 } },
          )
          if (!res.ok) return null
          const data = await res.json()
          const entry = data?.[0]
          const meaning = entry?.meanings?.[0]
          const definition = meaning?.definitions?.[0]?.definition ?? ''
          if (!definition || definition.length < 20) return null
          return {
            word: entry.word as string,
            pos: (meaning.partOfSpeech as string) ?? 'noun',
            snippet: definition,
          }
        } catch {
          return null
        }
      }),
    )

    return results.filter((r): r is RemoteWord => r !== null).slice(0, 20)
  } catch {
    return []
  }
}
