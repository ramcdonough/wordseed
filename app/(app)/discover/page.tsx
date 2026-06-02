'use client'

import { useState, useMemo, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useWords } from '@/hooks/useWords'
import { DiscoverCard } from '@/components/words/DiscoverCard'
import { DISCOVER_WORDS, CATEGORY_LABELS, type DiscoverCategory } from '@/lib/discover/words'
import { fetchRemoteWords, type RemoteWord } from './actions'

const CATEGORIES = Object.keys(CATEGORY_LABELS) as DiscoverCategory[]
const PAGE_SIZE = 16

interface DisplayWord {
  word: string
  pos: string
  snippet: string
}

export default function DiscoverPage() {
  const [activeCategory, setActiveCategory] = useState<DiscoverCategory>('all')
  const words = useWords() ?? []
  const ownedSet = useMemo(() => new Set(words.map((w) => w.word.toLowerCase())), [words])

  // ── Curated pool for active category ─────────────────────────────────
  const curatedPool = useMemo<DisplayWord[]>(() => {
    const pool =
      activeCategory === 'all'
        ? DISCOVER_WORDS
        : DISCOVER_WORDS.filter((w) => w.category === activeCategory)
    // Owned words last
    return [...pool].sort((a, b) => {
      const aO = ownedSet.has(a.word.toLowerCase())
      const bO = ownedSet.has(b.word.toLowerCase())
      return aO === bO ? 0 : aO ? 1 : -1
    })
  }, [activeCategory, ownedSet])

  // ── Displayed words (curated + remote) ───────────────────────────────
  const [displayed, setDisplayed] = useState<DisplayWord[]>([])
  const [curatedOffset, setCuratedOffset] = useState(0)
  const [remoteWords, setRemoteWords] = useState<RemoteWord[]>([])
  const [remoteSeedIndex, setRemoteSeedIndex] = useState(0)
  const [consecutiveEmpty, setConsecutiveEmpty] = useState(0)
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const sentinelRef = useRef<HTMLDivElement>(null)
  const loadingRef = useRef(false)

  // Reset when category changes
  useEffect(() => {
    setDisplayed([])
    setCuratedOffset(0)
    setRemoteWords([])
    setRemoteSeedIndex(0)
    setConsecutiveEmpty(0)
    setHasMore(true)
    loadingRef.current = false
  }, [activeCategory])

  // Initial load + category-change load
  useEffect(() => {
    if (displayed.length === 0 && curatedPool.length > 0 && hasMore) {
      const first = curatedPool.slice(0, PAGE_SIZE)
      setDisplayed(first)
      setCuratedOffset(PAGE_SIZE)
    }
  }, [curatedPool, displayed.length, hasMore])

  // ── Load next batch ───────────────────────────────────────────────────
  const loadMore = useCallback(async () => {
    if (loadingRef.current || !hasMore) return
    loadingRef.current = true
    setLoading(true)

    // Still have curated words left?
    const nextCurated = curatedPool.slice(curatedOffset, curatedOffset + PAGE_SIZE)
    if (nextCurated.length > 0) {
      setDisplayed((prev) => {
        const seen = new Set(prev.map((w) => w.word.toLowerCase()))
        const fresh = nextCurated.filter((w) => !seen.has(w.word.toLowerCase()))
        return [...prev, ...fresh]
      })
      setCuratedOffset((o) => o + PAGE_SIZE)
      setLoading(false)
      loadingRef.current = false
      return
    }

    // Curated exhausted — fetch remote
    const excludeList = [
      ...DISCOVER_WORDS.map((w) => w.word),
      ...remoteWords.map((w) => w.word),
    ]
    const batch = await fetchRemoteWords(activeCategory, excludeList, remoteSeedIndex)

    if (batch.length === 0) {
      // Try up to 3 consecutive seeds before giving up
      const newEmpty = consecutiveEmpty + 1
      setConsecutiveEmpty(newEmpty)
      setRemoteSeedIndex((i) => i + 1)
      if (newEmpty >= 3) setHasMore(false)
    } else {
      setConsecutiveEmpty(0)
      setRemoteWords((prev) => [...prev, ...batch])
      setDisplayed((prev) => {
        const seen = new Set(prev.map((w) => w.word.toLowerCase()))
        const fresh = batch.filter((w) => !seen.has(w.word.toLowerCase()))
        return [...prev, ...fresh]
      })
      setRemoteSeedIndex((i) => i + 1)
    }

    setLoading(false)
    loadingRef.current = false
  }, [activeCategory, consecutiveEmpty, curatedOffset, curatedPool, hasMore, remoteWords, remoteSeedIndex])

  // ── IntersectionObserver on sentinel ─────────────────────────────────
  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel) return

    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) loadMore() },
      { rootMargin: '200px' },
    )
    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [loadMore])

  return (
    <div className="flex flex-col min-h-full">
      {/* Header */}
      <div className="sticky top-0 z-10 glass border-b border-[var(--color-border)]">
        <div className="px-4 pt-4 pb-2">
          <h1 className="text-xl font-bold text-[var(--color-text)]">Discover</h1>
          <p className="text-xs text-[var(--color-text-faint)]">Words worth adding to your vocabulary</p>
        </div>

        {/* Category chips */}
        <div className="flex gap-2 px-4 pb-3 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`shrink-0 text-xs px-3.5 py-1.5 rounded-full border font-medium transition-all duration-150 ${
                activeCategory === cat
                  ? 'bg-[var(--color-primary)] text-[var(--color-primary-foreground)] border-transparent'
                  : 'bg-[var(--color-surface)] border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-[var(--color-primary)]/40 hover:text-[var(--color-text)]'
              }`}
            >
              {CATEGORY_LABELS[cat]}
            </button>
          ))}
        </div>
      </div>

      {/* Word grid */}
      <div className="flex-1 px-4 py-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeCategory}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.18 }}
            className="grid grid-cols-2 gap-2.5"
          >
            {displayed.map((item, i) => (
              <DiscoverCard
                key={item.word}
                word={item.word}
                pos={item.pos}
                snippet={item.snippet}
                owned={ownedSet.has(item.word.toLowerCase())}
                index={i}
              />
            ))}
          </motion.div>
        </AnimatePresence>

        {/* Loading skeletons */}
        {loading && (
          <div className="grid grid-cols-2 gap-2.5 mt-2.5">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="h-36 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] shimmer paper-texture"
              />
            ))}
          </div>
        )}

        {/* End of results */}
        {!hasMore && !loading && displayed.length > 0 && (
          <p className="text-center text-xs text-[var(--color-text-faint)] py-8">
            You&apos;ve seen everything in this category.
          </p>
        )}

        {/* Sentinel — triggers next load */}
        <div ref={sentinelRef} className="h-1" />
      </div>
    </div>
  )
}
