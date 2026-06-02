'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Zap, Flame, ChevronRight, Volume2, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useDueWords, useWords } from '@/hooks/useWords'
import { useStreak } from '@/hooks/useStats'
import { getMasteryLabel } from '@/lib/srs/sm2'
import { Badge } from '@/components/ui/Badge'
import { WordCard } from '@/components/words/WordCard'
import { DiscoverCard } from '@/components/words/DiscoverCard'
import { DISCOVER_WORDS } from '@/lib/discover/words'
import type { Word } from '@/types'

const MASTERY_VARIANT: Record<string, 'new' | 'familiar' | 'learning' | 'strong' | 'mastered'> = {
  New: 'new', Familiar: 'familiar', Learning: 'learning', Strong: 'strong', Mastered: 'mastered',
}

const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  show: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.07, duration: 0.32, ease: [0.25, 1, 0.5, 1] as [number, number, number, number] },
  }),
}

export default function HomePage() {
  const dueWords = useDueWords()
  const words = useWords() ?? []
  const streak = useStreak()
  const dueCount = dueWords?.length ?? 0

  const [featuredIndex, setFeaturedIndex] = useState(0)
  const rotatedFeatured = useMemo<Word | null>(() => {
    if (!words.length) return null
    return words[featuredIndex % words.length]
  }, [words, featuredIndex])

  const refreshFeatured = () => {
    setFeaturedIndex(i => i + 1 + Math.floor(Math.random() * (words.length - 1)))
  }

  // Pick 4 suggestions from global list not already owned
  const suggestions = useMemo(() => {
    const owned = new Set(words.map(w => w.word.toLowerCase()))
    const available = DISCOVER_WORDS.filter(s => !owned.has(s.word.toLowerCase()))
    return [...available].sort(() => Math.random() - 0.5).slice(0, 4)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [words.length])

  const hasWords = words.length > 0

  return (
    <div className="flex flex-col min-h-full pb-6">
      {/* ── Header ──────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex items-center justify-between px-4 pt-6 mb-5"
      >
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-black text-gradient leading-none">Wordseed</h1>
          {(streak ?? 0) > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring', stiffness: 400, damping: 20, delay: 0.2 }}
              className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-[var(--color-warning-subtle)] border border-[var(--color-warning)]/30"
            >
              <Flame className="w-3 h-3 text-[var(--color-warning)]" />
              <span className="text-xs font-bold text-[var(--color-warning)]">{streak}</span>
            </motion.div>
          )}
        </div>
        <motion.div whileTap={{ scale: 0.88 }} transition={{ type: 'spring', stiffness: 500, damping: 18 }}>
          <Link
            href="/add"
            className="w-11 h-11 bg-[var(--color-primary)] rounded-2xl flex items-center justify-center text-[var(--color-primary-foreground)] glow-primary hover:scale-105 transition-transform"
          >
            <Plus className="w-5 h-5" strokeWidth={2.5} />
          </Link>
        </motion.div>
      </motion.div>

      <div className="flex flex-col gap-5 px-4">
        {/* ── Practice Now strip ──────────────────────── */}
        <motion.div custom={0} initial="hidden" animate="show" variants={fadeUp}>
          <Link href={dueCount > 0 ? '/quiz?mode=due' : '/quiz'}>
            <motion.div
              whileTap={{ scale: 0.98 }}
              className="flex items-center justify-between px-4 py-3.5 rounded-xl border border-[var(--color-primary)]/30 cursor-pointer paper-texture shadow-paper"
              style={{ background: 'linear-gradient(135deg, color-mix(in srgb, var(--color-primary) 10%, var(--color-surface)), color-mix(in srgb, var(--color-primary) 5%, var(--color-surface)))' }}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-[var(--color-primary)]/20 flex items-center justify-center">
                  <Zap className="w-4 h-4 text-[var(--color-primary)]" strokeWidth={2.5} />
                </div>
                <div>
                  <p className="text-sm font-bold text-[var(--color-text)]">Practice Now</p>
                  <p className="text-xs text-[var(--color-text-faint)]">
                    {dueCount > 0 ? `${dueCount} word${dueCount === 1 ? '' : 's'} due for review` : 'Keep your skills sharp'}
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-[var(--color-primary)]" />
            </motion.div>
          </Link>
        </motion.div>

        {/* ── Featured word ───────────────────────────── */}
        {hasWords && rotatedFeatured && (
          <motion.div custom={1} initial="hidden" animate="show" variants={fadeUp}>
            <div className="flex items-center justify-between mb-2 px-0.5">
              <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[var(--color-text-faint)]">Word in Focus</p>
              <motion.button
                whileTap={{ scale: 0.85, rotate: 180 }}
                transition={{ duration: 0.3 }}
                onClick={refreshFeatured}
                className="p-1 rounded-lg text-[var(--color-text-faint)] hover:text-[var(--color-text-muted)] transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </motion.button>
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={rotatedFeatured.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.22, ease: [0.25, 1, 0.5, 1] as [number, number, number, number] }}
              >
                <Link href={`/words/${rotatedFeatured.id}`}>
                  <div
                    className="rounded-xl border overflow-hidden relative cursor-pointer group paper-texture shadow-paper"
                    style={{
                      background: 'linear-gradient(160deg, var(--color-surface) 0%, var(--color-surface-2) 50%, var(--color-surface) 100%)',
                      borderColor: 'color-mix(in srgb, var(--color-primary) 20%, var(--color-border))',
                    }}
                  >
                    <div className="absolute top-0 right-0 w-56 h-56 rounded-full blur-3xl pointer-events-none"
                      style={{ background: 'radial-gradient(circle, color-mix(in srgb, var(--color-primary) 18%, transparent) 0%, transparent 70%)', transform: 'translate(30%,-30%)' }} />
                    <div className="absolute bottom-0 left-0 w-40 h-40 rounded-full blur-2xl pointer-events-none"
                      style={{ background: 'radial-gradient(circle, color-mix(in srgb, var(--color-success) 12%, transparent) 0%, transparent 70%)', transform: 'translate(-20%,30%)' }} />

                    <div className="relative p-6">
                      <div className="mb-4">
                        <h2 className="text-4xl font-black text-[var(--color-text)] capitalize leading-none mb-2 font-serif">
                          {rotatedFeatured.word}
                        </h2>
                        <div className="flex items-center gap-2 flex-wrap">
                          {rotatedFeatured.pronunciation && (
                            <span className="font-mono text-sm text-[var(--color-text-muted)]">
                              {rotatedFeatured.pronunciation}
                            </span>
                          )}
                          {rotatedFeatured.partOfSpeech && (
                            <span className="text-xs px-2.5 py-0.5 rounded-full bg-[var(--color-primary-subtle)] text-[var(--color-primary)] capitalize font-medium">
                              {rotatedFeatured.partOfSpeech}
                            </span>
                          )}
                          <Badge variant={MASTERY_VARIANT[getMasteryLabel(rotatedFeatured.masteryScore)] ?? 'new'} size="sm">
                            {getMasteryLabel(rotatedFeatured.masteryScore)}
                          </Badge>
                        </div>
                      </div>

                      <div className="w-full h-px bg-gradient-to-r from-[var(--color-primary)]/20 via-[var(--color-border)] to-transparent mb-4" />

                      <p className="text-[var(--color-text)] leading-relaxed mb-3">
                        {rotatedFeatured.definition}
                      </p>

                      {rotatedFeatured.exampleSentence && (
                        <p className="text-sm text-[var(--color-text-muted)] italic leading-relaxed border-l-2 border-[var(--color-primary)]/30 pl-3">
                          &ldquo;{rotatedFeatured.exampleSentence}&rdquo;
                        </p>
                      )}

                      <div className="flex items-center justify-end mt-4">
                        <span className="text-xs text-[var(--color-primary)] flex items-center gap-1 group-hover:gap-2 transition-all">
                          View word <ChevronRight className="w-3 h-3" />
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            </AnimatePresence>
          </motion.div>
        )}

        {/* ── Your Words ──────────────────────────────── */}
        {hasWords && (
          <motion.div custom={2} initial="hidden" animate="show" variants={fadeUp}>
            <div className="flex items-center justify-between mb-2.5 px-0.5">
              <p className="text-sm font-semibold text-[var(--color-text)]">Your Words</p>
              <Link href="/words" className="text-xs text-[var(--color-primary)] flex items-center gap-0.5 hover:underline">
                See all <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="flex flex-col gap-2.5">
              {words.slice(0, 5).map((word, i) => (
                <WordCard key={word.id} word={word} index={i} />
              ))}
            </div>
          </motion.div>
        )}

        {/* ── Discover section ────────────────────────── */}
        {suggestions.length > 0 && (
          <motion.div custom={3} initial="hidden" animate="show" variants={fadeUp}>
            <div className="flex items-center justify-between mb-2.5 px-0.5">
              <p className="text-sm font-semibold text-[var(--color-text)]">Discover</p>
              <Link href="/discover" className="text-xs text-[var(--color-primary)] flex items-center gap-0.5 hover:underline">
                See all <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              {suggestions.map((s, i) => (
                <DiscoverCard key={s.word} word={s.word} pos={s.pos} snippet={s.snippet} index={i} />
              ))}
            </div>
          </motion.div>
        )}

        {/* ── Empty state ─────────────────────────────── */}
        {!hasWords && (
          <motion.div custom={1} initial="hidden" animate="show" variants={fadeUp}>
            <div className="flex flex-col items-center text-center gap-4 py-12 px-6 rounded-xl border border-dashed border-[var(--color-border)] paper-texture">
              <motion.div
                className="text-5xl"
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
              >
                🌱
              </motion.div>
              <div>
                <p className="font-bold text-[var(--color-text)] text-lg mb-1">Plant your first word</p>
                <p className="text-sm text-[var(--color-text-muted)]">
                  Tap + or pick one below to start building a vocabulary that lasts.
                </p>
              </div>
              <Link href="/add">
                <Button size="md">
                  <Plus className="w-4 h-4" />
                  Add Your First Word
                </Button>
              </Link>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}
