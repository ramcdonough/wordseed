'use client'

import { useState, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, RotateCcw, Check, X } from 'lucide-react'
import Link from 'next/link'
import { useWords } from '@/hooks/useWords'
import { Button } from '@/components/ui/Button'
import type { Word } from '@/types'

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

type CardResult = 'knew' | 'missed'

export default function FlashcardsPage() {
  const router = useRouter()
  const allWords = useWords() ?? []

  const deck = useMemo<Word[]>(
    () => shuffle([...allWords]),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [allWords.length],
  )

  const [index, setIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [results, setResults] = useState<CardResult[]>([])
  const [finished, setFinished] = useState(false)

  const current = deck[index]
  const total = deck.length

  const advance = useCallback(
    (result: CardResult) => {
      const next = [...results, result]
      setResults(next)
      if (index + 1 >= total) {
        setFinished(true)
      } else {
        setFlipped(false)
        setIndex((i) => i + 1)
      }
    },
    [index, total, results],
  )

  const restart = useCallback(() => {
    setIndex(0)
    setFlipped(false)
    setResults([])
    setFinished(false)
  }, [])

  // ── Empty state ──────────────────────────────────────────────────────
  if (total === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center gap-4">
        <div className="text-5xl">🌱</div>
        <h2 className="text-xl font-bold text-[var(--color-text)]">No words yet</h2>
        <p className="text-sm text-[var(--color-text-muted)]">
          Add some words to your collection to start flipping flashcards.
        </p>
        <Link href="/add">
          <Button size="lg">Add words</Button>
        </Link>
      </div>
    )
  }

  // ── Finished screen ──────────────────────────────────────────────────
  if (finished) {
    const knew = results.filter((r) => r === 'knew').length
    const missed = results.filter((r) => r === 'missed').length
    const pct = Math.round((knew / total) * 100)
    const emoji = pct >= 80 ? '🏆' : pct >= 50 ? '✨' : '📖'

    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center px-6 gap-6 text-center"
        style={{ paddingTop: 'var(--safe-area-top)' }}
      >
        <motion.div
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 260, damping: 18 }}
          className="text-7xl"
        >
          {emoji}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <p className="text-[var(--color-text-faint)] text-sm uppercase tracking-widest font-semibold mb-1">
            Deck complete
          </p>
          <h2 className="text-5xl font-black text-[var(--color-text)] mb-3">
            {knew}<span className="text-2xl text-[var(--color-text-faint)]">/{total}</span>
          </h2>
          <div className="flex justify-center gap-4 mb-3">
            <span className="flex items-center gap-1.5 text-sm font-semibold text-[var(--color-success)]">
              <Check className="w-4 h-4" /> {knew} knew it
            </span>
            <span className="flex items-center gap-1.5 text-sm font-semibold text-[var(--color-error)]">
              <X className="w-4 h-4" /> {missed} missed
            </span>
          </div>
          <p className="text-[var(--color-text-muted)] text-sm">
            {pct >= 80
              ? 'Excellent recall! You have these words down.'
              : pct >= 50
              ? 'Good progress. Keep reviewing the ones you missed.'
              : 'Keep flipping — repetition is how it sticks.'}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.28 }}
          className="flex flex-col gap-3 w-full max-w-xs"
        >
          <Button size="xl" fullWidth onClick={restart}>
            <RotateCcw className="w-4 h-4" /> Go again
          </Button>
          <Button variant="ghost" size="lg" fullWidth onClick={() => router.push('/train')}>
            Back to Train
          </Button>
        </motion.div>
      </div>
    )
  }

  if (!current) return null

  // ── Game screen ──────────────────────────────────────────────────────
  return (
    <div
      className="flex flex-col min-h-full"
      style={{ paddingTop: 'var(--safe-area-top)' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-3">
        <Link
          href="/train"
          className="w-9 h-9 flex items-center justify-center rounded-xl text-[var(--color-text-muted)] hover:bg-[var(--color-surface-2)] transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex flex-col items-center">
          <p className="text-xs text-[var(--color-text-faint)] font-medium">
            {index + 1} of {total}
          </p>
          <div className="w-24 h-1 bg-[var(--color-border)] rounded-full mt-1 overflow-hidden">
            <motion.div
              className="h-full bg-[var(--color-warning)] rounded-full"
              animate={{ width: `${((index + 1) / total) * 100}%` }}
              transition={{ duration: 0.4 }}
            />
          </div>
        </div>
        <div className="w-9 h-9 flex items-center justify-center">
          <span className="text-sm font-bold text-[var(--color-success)]">
            {results.filter((r) => r === 'knew').length}
          </span>
        </div>
      </div>

      <div className="flex flex-col px-4 pb-8 gap-5" style={{ flex: 1 }}>
        <p className="text-center text-xs text-[var(--color-text-faint)] font-medium tracking-wide">
          {flipped ? 'How did you do?' : 'Tap the card to reveal the definition'}
        </p>

        {/* Card stack */}
        <div className="relative" style={{ perspective: '1200px' }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={`${index}-${flipped ? 'back' : 'front'}`}
              initial={{ opacity: 0, rotateY: flipped ? -90 : 90, scale: 0.96 }}
              animate={{ opacity: 1, rotateY: 0, scale: 1 }}
              exit={{ opacity: 0, rotateY: flipped ? 90 : -90, scale: 0.96 }}
              transition={{ duration: 0.28, ease: [0.25, 1, 0.5, 1] }}
              style={{ transformOrigin: 'center', transformStyle: 'preserve-3d' }}
            >
              {!flipped ? (
                /* ── Front face ── */
                <button
                  onClick={() => setFlipped(true)}
                  className="w-full text-left p-7 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl paper-texture shadow-paper active:scale-[0.99] transition-transform duration-100"
                  style={{ minHeight: '320px' }}
                >
                  <div className="flex flex-col items-center justify-center h-full gap-4 text-center" style={{ minHeight: '260px' }}>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-warning)]">
                      Word
                    </p>
                    <h2 className="text-4xl font-black text-[var(--color-text)] leading-tight">
                      {current.word}
                    </h2>
                    {current.pronunciation && (
                      <p className="text-sm text-[var(--color-text-faint)] italic">
                        {current.pronunciation}
                      </p>
                    )}
                    {current.partOfSpeech && (
                      <span className="text-[10px] font-semibold uppercase tracking-wider px-3 py-1 rounded-full bg-[var(--color-surface-2)] text-[var(--color-text-muted)] border border-[var(--color-border)]">
                        {current.partOfSpeech}
                      </span>
                    )}
                    <p className="text-xs text-[var(--color-text-faint)] mt-4">
                      Tap to reveal definition
                    </p>
                  </div>
                </button>
              ) : (
                /* ── Back face ── */
                <div
                  className="w-full p-7 bg-[var(--color-surface)] border border-[var(--color-primary)]/40 rounded-2xl paper-texture shadow-paper"
                  style={{ minHeight: '320px' }}
                >
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-primary)]">
                        Definition
                      </p>
                      <span className="text-sm font-bold text-[var(--color-text-muted)]">
                        {current.word}
                      </span>
                    </div>

                    <p className="text-[var(--color-text)] text-lg leading-relaxed font-medium">
                      {current.definition}
                    </p>

                    {current.exampleSentence && (
                      <p className="text-sm text-[var(--color-text-muted)] italic leading-relaxed border-l-2 border-[var(--color-border)] pl-3">
                        &ldquo;{current.exampleSentence}&rdquo;
                      </p>
                    )}

                    {current.synonyms?.length > 0 && (
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-faint)] mb-1.5">
                          Synonyms
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {current.synonyms.slice(0, 5).map((s) => (
                            <span
                              key={s}
                              className="text-xs px-2.5 py-0.5 rounded-full bg-[var(--color-surface-2)] text-[var(--color-text-muted)] border border-[var(--color-border)]"
                            >
                              {s}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Action buttons */}
        <AnimatePresence>
          {flipped && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 12 }}
              transition={{ duration: 0.2 }}
              className="flex gap-3"
            >
              <button
                onClick={() => advance('missed')}
                className="flex-1 flex flex-col items-center gap-1.5 py-4 rounded-2xl bg-[var(--color-error-subtle)] border border-[var(--color-error)]/20 text-[var(--color-error)] active:scale-95 transition-all duration-150 hover:opacity-90"
              >
                <X className="w-6 h-6" strokeWidth={2.5} />
                <span className="text-xs font-bold">Missed it</span>
              </button>
              <button
                onClick={() => advance('knew')}
                className="flex-1 flex flex-col items-center gap-1.5 py-4 rounded-2xl bg-[var(--color-success-subtle)] border border-[var(--color-success)]/20 text-[var(--color-success)] active:scale-95 transition-all duration-150 hover:opacity-90"
              >
                <Check className="w-6 h-6" strokeWidth={2.5} />
                <span className="text-xs font-bold">Knew it</span>
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
