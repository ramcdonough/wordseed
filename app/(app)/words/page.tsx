'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Plus, SlidersHorizontal, X } from 'lucide-react'
import { useWords, useWordCount } from '@/hooks/useWords'
import { useCollections } from '@/hooks/useCollections'
import { WordCard } from '@/components/words/WordCard'
import type { Word } from '@/types'

type SortKey = 'newest' | 'oldest' | 'alpha' | 'mastery'

export default function WordsPage() {
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState<SortKey>('newest')
  const [collectionFilter, setCollectionFilter] = useState<string | null>(null)
  const [showArchived, setShowArchived] = useState(false)
  const [showFilters, setShowFilters] = useState(false)

  const words = useWords(showArchived) ?? []
  const wordCount = useWordCount()
  const collections = useCollections() ?? []

  const filtered = useMemo(() => {
    let result = [...words]

    if (query) {
      const q = query.toLowerCase()
      result = result.filter(
        (w) =>
          w.word.toLowerCase().includes(q) ||
          w.definition.toLowerCase().includes(q) ||
          w.synonyms.some((s) => s.toLowerCase().includes(q))
      )
    }

    if (collectionFilter) {
      result = result.filter((w) => w.collections.includes(collectionFilter))
    }

    switch (sort) {
      case 'oldest': result.sort((a, b) => a.dateAdded - b.dateAdded); break
      case 'alpha': result.sort((a, b) => a.word.localeCompare(b.word)); break
      case 'mastery': result.sort((a, b) => b.masteryScore - a.masteryScore); break
      default: result.sort((a, b) => b.dateAdded - a.dateAdded)
    }

    return result
  }, [words, query, sort, collectionFilter])

  const activeCount = wordCount?.active ?? 0
  const archivedCount = wordCount?.archived ?? 0

  return (
    <div className="flex flex-col min-h-full">
      {/* Header */}
      <div className="sticky top-0 z-10 glass border-b border-[var(--color-border)] px-4 pt-4 pb-3">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-xl font-bold text-[var(--color-text)]">Words</h1>
            <p className="text-xs text-[var(--color-text-faint)]">{activeCount} active · {archivedCount} archived</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`w-9 h-9 flex items-center justify-center rounded-xl transition-colors ${
                showFilters || collectionFilter || sort !== 'newest' || showArchived
                  ? 'bg-[var(--color-primary-subtle)] text-[var(--color-primary)]'
                  : 'text-[var(--color-text-muted)] hover:bg-[var(--color-surface-2)]'
              }`}
            >
              <SlidersHorizontal className="w-4 h-4" />
            </button>
            <Link
              href="/add"
              className="w-9 h-9 bg-[var(--color-primary)] rounded-xl flex items-center justify-center text-[var(--color-primary-foreground)] hover:opacity-90 active:scale-95 transition-all"
            >
              <Plus className="w-4 h-4" strokeWidth={2.5} />
            </Link>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-faint)]" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search words or definitions…"
            className="w-full bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-xl pl-10 pr-10 py-2.5 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-faint)] focus:outline-none focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)]/20 transition-colors"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--color-text-faint)]"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Filters panel */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="flex flex-col gap-3 pt-3">
                {/* Sort */}
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--color-text-faint)] mb-1.5">Sort</p>
                  <div className="flex gap-1.5 flex-wrap">
                    {(['newest', 'oldest', 'alpha', 'mastery'] as SortKey[]).map((s) => (
                      <button
                        key={s}
                        onClick={() => setSort(s)}
                        className={`text-xs px-3 py-1.5 rounded-full border transition-colors capitalize ${
                          sort === s
                            ? 'bg-[var(--color-primary-subtle)] border-[var(--color-primary)]/40 text-[var(--color-primary)]'
                            : 'border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-[var(--color-border)]'
                        }`}
                      >
                        {s === 'alpha' ? 'A–Z' : s === 'mastery' ? 'Mastery' : s}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Collections filter */}
                {collections.length > 0 && (
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--color-text-faint)] mb-1.5">Collection</p>
                    <div className="flex gap-1.5 flex-wrap">
                      <button
                        onClick={() => setCollectionFilter(null)}
                        className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                          !collectionFilter
                            ? 'bg-[var(--color-primary-subtle)] border-[var(--color-primary)]/40 text-[var(--color-primary)]'
                            : 'border-[var(--color-border)] text-[var(--color-text-muted)]'
                        }`}
                      >
                        All
                      </button>
                      {collections.map((c) => (
                        <button
                          key={c.id}
                          onClick={() => setCollectionFilter(c.id === collectionFilter ? null : c.id)}
                          className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                            collectionFilter === c.id
                              ? 'bg-[var(--color-primary-subtle)] border-[var(--color-primary)]/40 text-[var(--color-primary)]'
                              : 'border-[var(--color-border)] text-[var(--color-text-muted)]'
                          }`}
                        >
                          {c.icon} {c.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Archived toggle */}
                <label className="flex items-center gap-2 cursor-pointer">
                  <div
                    onClick={() => setShowArchived(!showArchived)}
                    className={`w-9 h-5 rounded-full transition-colors relative ${showArchived ? 'bg-[var(--color-primary)]' : 'bg-[var(--color-surface-3)]'}`}
                  >
                    <span
                      className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${showArchived ? 'translate-x-4' : ''}`}
                    />
                  </div>
                  <span className="text-sm text-[var(--color-text-muted)]">Show archived</span>
                </label>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Word list */}
      <div className="flex-1 px-4 py-3">
        {filtered.length === 0 ? (
          <EmptyState query={query} hasWords={words.length > 0} />
        ) : (
          <div className="flex flex-col gap-2.5">
            {filtered.map((word, i) => (
              <WordCard key={word.id} word={word} index={i} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}


function EmptyState({ query, hasWords }: { query: string; hasWords: boolean }) {
  return (
    <div className="flex flex-col items-center text-center gap-3 py-16">
      <div className="text-4xl">{query ? '🔍' : '🌱'}</div>
      <div>
        <p className="font-semibold text-[var(--color-text)] mb-1">
          {query ? 'No results found' : 'No words yet'}
        </p>
        <p className="text-sm text-[var(--color-text-muted)]">
          {query
            ? `No words match "${query}"`
            : 'Start adding words to build your vocabulary collection.'}
        </p>
      </div>
      {!hasWords && (
        <Link href="/add" className="text-sm text-[var(--color-primary)] font-medium">
          Add your first word →
        </Link>
      )}
    </div>
  )
}
