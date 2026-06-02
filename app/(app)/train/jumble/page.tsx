'use client'

import { useState, useMemo, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, RotateCcw, Lightbulb, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { useWords } from '@/hooks/useWords'
import { Button } from '@/components/ui/Button'
import type { Word } from '@/types'

const ROUND_COUNT = 10
const MAX_WORD_LENGTH = 14 // longer words get unwieldy on mobile

interface Tile {
  id: string   // letter + position index to handle duplicate letters
  letter: string
  placed: boolean
}

type RoundState = 'playing' | 'correct' | 'wrong' | 'revealed'

// Scramble letters, never leave them in original order
function scramble(word: string): string[] {
  const letters = word.split('')
  let shuffled: string[]
  let attempts = 0
  do {
    shuffled = [...letters].sort(() => Math.random() - 0.5)
    attempts++
  } while (shuffled.join('') === word && attempts < 20)
  return shuffled
}

function buildTiles(word: string): Tile[] {
  return scramble(word).map((letter, i) => ({
    id: `${letter}-${i}`,
    letter,
    placed: false,
  }))
}

// Pick a round pool from user's words, preferring lower mastery
function selectRoundWords(words: Word[]): Word[] {
  const eligible = words.filter(
    (w) =>
      /^[a-zA-Z]+$/.test(w.word) &&
      w.word.length >= 4 &&
      w.word.length <= MAX_WORD_LENGTH,
  )
  if (!eligible.length) return []
  // Sort: lower mastery first, then shuffle within score groups
  const sorted = [...eligible].sort(
    (a, b) => a.masteryScore - b.masteryScore + (Math.random() - 0.5) * 0.5,
  )
  return sorted.slice(0, ROUND_COUNT)
}

export default function JumblePage() {
  const router = useRouter()
  const allWords = useWords() ?? []

  const roundWords = useMemo(() => selectRoundWords(allWords), [allWords])

  const [roundIndex, setRoundIndex] = useState(0)
  const [score, setScore] = useState(0)
  const [roundState, setRoundState] = useState<RoundState>('playing')
  const [pool, setPool] = useState<Tile[]>([])
  const [answer, setAnswer] = useState<Tile[]>([])
  const [showHint, setShowHint] = useState(false)
  const [wrongCount, setWrongCount] = useState(0) // wrong attempts this word
  const [finished, setFinished] = useState(false)

  const currentWord = roundWords[roundIndex]
  const totalRounds = roundWords.length

  // Initialise tiles when word changes
  useEffect(() => {
    if (!currentWord) return
    setPool(buildTiles(currentWord.word.toLowerCase()))
    setAnswer([])
    setRoundState('playing')
    setShowHint(false)
    setWrongCount(0)
  }, [currentWord])

  // Check answer whenever answer fills all slots
  useEffect(() => {
    if (!currentWord) return
    if (answer.length !== currentWord.word.length) return
    if (roundState !== 'playing') return

    const attempt = answer.map((t) => t.letter).join('')
    if (attempt === currentWord.word.toLowerCase()) {
      const points = wrongCount === 0 ? 3 : wrongCount === 1 ? 2 : 1
      setScore((s) => s + points)
      setRoundState('correct')
    } else {
      setWrongCount((n) => n + 1)
      setRoundState('wrong')
      // Shake then reset after 800ms
      setTimeout(() => {
        setPool(buildTiles(currentWord.word.toLowerCase()))
        setAnswer([])
        setRoundState('playing')
      }, 900)
    }
  }, [answer, currentWord, roundState, wrongCount])

  const tapTile = useCallback((tile: Tile) => {
    if (roundState !== 'playing') return
    setPool((prev) => prev.filter((t) => t.id !== tile.id))
    setAnswer((prev) => [...prev, { ...tile, placed: true }])
  }, [roundState])

  const tapAnswer = useCallback((tile: Tile) => {
    if (roundState !== 'playing') return
    setAnswer((prev) => prev.filter((t) => t.id !== tile.id))
    setPool((prev) => [...prev, { ...tile, placed: false }])
  }, [roundState])

  const clearAnswer = useCallback(() => {
    if (!currentWord || roundState !== 'playing') return
    setPool(buildTiles(currentWord.word.toLowerCase()))
    setAnswer([])
  }, [currentWord, roundState])

  const revealAnswer = useCallback(() => {
    setRoundState('revealed')
  }, [])

  const nextRound = useCallback(() => {
    if (roundIndex + 1 >= totalRounds) {
      setFinished(true)
    } else {
      setRoundIndex((i) => i + 1)
    }
  }, [roundIndex, totalRounds])

  // ── Not enough words ────────────────────────────────────────────────
  if (roundWords.length < 3) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center gap-4">
        <div className="text-5xl">🌱</div>
        <h2 className="text-xl font-bold text-[var(--color-text)]">Need more words</h2>
        <p className="text-sm text-[var(--color-text-muted)]">
          Add at least 3 words to your collection to play Jumble.
        </p>
        <Link href="/add">
          <Button size="lg">Add words</Button>
        </Link>
      </div>
    )
  }

  // ── Finished screen ─────────────────────────────────────────────────
  if (finished) {
    const maxScore = totalRounds * 3
    const pct = Math.round((score / maxScore) * 100)
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
            Round complete
          </p>
          <h2 className="text-5xl font-black text-[var(--color-text)] mb-2">
            {score}<span className="text-2xl text-[var(--color-text-faint)]">/{maxScore}</span>
          </h2>
          <p className="text-[var(--color-text-muted)] text-sm">
            {pct >= 80
              ? 'Outstanding! You know these words cold.'
              : pct >= 50
              ? 'Solid effort. Keep drilling the tricky ones.'
              : 'Keep going — repetition is how it sticks.'}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.28 }}
          className="flex flex-col gap-3 w-full max-w-xs"
        >
          <Button
            size="xl"
            fullWidth
            onClick={() => {
              setRoundIndex(0)
              setScore(0)
              setFinished(false)
            }}
          >
            <RotateCcw className="w-4 h-4" /> Play again
          </Button>
          <Button variant="ghost" size="lg" fullWidth onClick={() => router.push('/train')}>
            Back to Train
          </Button>
        </motion.div>
      </div>
    )
  }

  if (!currentWord) return null

  const wordLength = currentWord.word.length

  // ── Game screen ─────────────────────────────────────────────────────
  return (
    <div
      className="flex flex-col min-h-full"
      style={{ paddingTop: 'var(--safe-area-top)' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-3">
        <Link href="/train" className="w-9 h-9 flex items-center justify-center rounded-xl text-[var(--color-text-muted)] hover:bg-[var(--color-surface-2)] transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex flex-col items-center">
          <p className="text-xs text-[var(--color-text-faint)] font-medium">
            {roundIndex + 1} of {totalRounds}
          </p>
          {/* Progress bar */}
          <div className="w-24 h-1 bg-[var(--color-border)] rounded-full mt-1 overflow-hidden">
            <motion.div
              className="h-full bg-[var(--color-primary)] rounded-full"
              animate={{ width: `${((roundIndex + 1) / totalRounds) * 100}%` }}
              transition={{ duration: 0.4 }}
            />
          </div>
        </div>
        <div className="w-9 h-9 flex items-center justify-center">
          <span className="text-sm font-bold text-[var(--color-primary)]">{score}pt</span>
        </div>
      </div>

      <div className="flex-1 flex flex-col px-4 pb-8 gap-6">
        {/* Definition clue */}
        <motion.div
          key={currentWord.id + '-clue'}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="p-4 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl paper-texture shadow-paper"
        >
          <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-primary)] mb-2">
            Definition
          </p>
          <p className="text-[var(--color-text)] leading-relaxed text-base">
            {currentWord.definition}
          </p>
          {currentWord.partOfSpeech && (
            <p className="text-xs text-[var(--color-text-faint)] mt-1.5 italic">
              {currentWord.partOfSpeech}
            </p>
          )}
        </motion.div>

        {/* Answer slots */}
        <div className="flex flex-col items-center gap-3">
          <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-faint)]">
            {wordLength} letters
          </p>
          <motion.div
            className="flex flex-wrap justify-center gap-1.5"
            animate={roundState === 'wrong' ? { x: [-6, 6, -5, 5, -3, 3, 0] } : {}}
            transition={{ duration: 0.45 }}
          >
            {Array.from({ length: wordLength }).map((_, i) => {
              const tile = answer[i]
              return (
                <AnimatePresence key={i} mode="popLayout">
                  {tile ? (
                    <motion.button
                      key={tile.id}
                      initial={{ scale: 0.6, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.6, opacity: 0 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                      onClick={() => tapAnswer(tile)}
                      className={`w-10 h-10 rounded-lg flex items-center justify-center text-base font-bold uppercase border-2 transition-colors ${
                        roundState === 'correct'
                          ? 'bg-[var(--color-success-subtle)] border-[var(--color-success)] text-[var(--color-success)]'
                          : roundState === 'wrong'
                          ? 'bg-[var(--color-error-subtle)] border-[var(--color-error)] text-[var(--color-error)]'
                          : roundState === 'revealed'
                          ? 'bg-[var(--color-warning-subtle)] border-[var(--color-warning)] text-[var(--color-warning)]'
                          : 'bg-[var(--color-primary-subtle)] border-[var(--color-primary)] text-[var(--color-primary)]'
                      }`}
                    >
                      {roundState === 'revealed' ? currentWord.word[i]?.toLowerCase() : tile.letter}
                    </motion.button>
                  ) : (
                    <motion.div
                      key={`empty-${i}`}
                      className="w-10 h-10 rounded-lg border-2 border-dashed border-[var(--color-border)]"
                    />
                  )}
                </AnimatePresence>
              )
            })}
          </motion.div>

          {/* Revealed word label */}
          {roundState === 'revealed' && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-sm text-[var(--color-warning)] font-semibold capitalize"
            >
              {currentWord.word}
            </motion.p>
          )}
        </div>

        {/* Letter pool */}
        <AnimatePresence>
          {roundState === 'playing' && (
            <motion.div
              key="pool"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              className="flex flex-wrap justify-center gap-2"
            >
              {pool.map((tile) => (
                <motion.button
                  key={tile.id}
                  layout
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  whileTap={{ scale: 0.9 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 22 }}
                  onClick={() => tapTile(tile)}
                  className="w-11 h-11 rounded-xl bg-[var(--color-surface)] border-2 border-[var(--color-border)] flex items-center justify-center text-base font-bold uppercase text-[var(--color-text)] shadow-paper paper-texture hover:border-[var(--color-primary)]/50 active:scale-95 transition-colors"
                >
                  {tile.letter}
                </motion.button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Actions */}
        <div className="mt-auto flex flex-col gap-2">
          {(roundState === 'correct' || roundState === 'revealed') && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col gap-2"
            >
              {roundState === 'correct' && (
                <p className="text-center text-sm font-semibold text-[var(--color-success)]">
                  {wrongCount === 0 ? '⭐ Perfect! +3 pts' : wrongCount === 1 ? '✓ Got it! +2 pts' : '✓ Got there! +1 pt'}
                </p>
              )}
              <Button size="xl" fullWidth onClick={nextRound}>
                {roundIndex + 1 >= totalRounds ? 'See results' : 'Next word'}
                <ChevronRight className="w-4 h-4" />
              </Button>
            </motion.div>
          )}

          {roundState === 'playing' && (
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="md"
                onClick={clearAnswer}
                disabled={answer.length === 0}
                className="flex-1"
              >
                <RotateCcw className="w-4 h-4" /> Clear
              </Button>
              <Button
                variant="ghost"
                size="md"
                onClick={revealAnswer}
                className="flex-1 text-[var(--color-text-faint)]"
              >
                <Lightbulb className="w-4 h-4" /> Reveal
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
