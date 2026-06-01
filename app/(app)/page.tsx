'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Zap, Flame, ChevronRight, Volume2, RefreshCw, BookmarkPlus } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useDueWords, useWords } from '@/hooks/useWords'
import { useStreak } from '@/hooks/useStats'
import { getMasteryLabel } from '@/lib/srs/sm2'
import { Badge } from '@/components/ui/Badge'
import type { Word } from '@/types'

// ── Curated word suggestions ──────────────────────────────────────────────
const SUGGESTED_WORDS = [
  { word: 'sanguine',      pos: 'adjective', snippet: 'Optimistic, especially in a difficult situation.' },
  { word: 'laconic',       pos: 'adjective', snippet: 'Using very few words; brief and to the point.' },
  { word: 'equanimity',    pos: 'noun',      snippet: 'Calmness and composure, especially in difficulty.' },
  { word: 'audacious',     pos: 'adjective', snippet: 'Showing bold disregard for normal restraints.' },
  { word: 'alacrity',      pos: 'noun',      snippet: 'Brisk and cheerful readiness.' },
  { word: 'tenacious',     pos: 'adjective', snippet: 'Determined; not giving up easily.' },
  { word: 'eloquent',      pos: 'adjective', snippet: 'Fluent and persuasive in speaking or writing.' },
  { word: 'loquacious',    pos: 'adjective', snippet: 'Tending to talk a great deal; garrulous.' },
  { word: 'perspicacious', pos: 'adjective', snippet: 'Having a ready insight; shrewd.' },
  { word: 'brevity',       pos: 'noun',      snippet: 'Concise and exact use of words.' },
  { word: 'enigmatic',     pos: 'adjective', snippet: 'Difficult to interpret or understand; mysterious.' },
  { word: 'euphoria',      pos: 'noun',      snippet: 'A feeling of intense happiness or excitement.' },
  { word: 'candour',       pos: 'noun',      snippet: 'The quality of being open and honest.' },
  { word: 'pensive',       pos: 'adjective', snippet: 'Engaged in, expressing, or reflecting deep thought.' },
  { word: 'acrimony',      pos: 'noun',      snippet: 'Bitterness or ill feeling, especially in speech.' },
  { word: 'intrepid',      pos: 'adjective', snippet: 'Fearless and adventurous; boldly courageous.' },
  { word: 'ruminate',      pos: 'verb',      snippet: 'To think deeply and at length about something.' },
  { word: 'panache',       pos: 'noun',      snippet: 'A confident, flamboyant, and stylish manner.' },
  { word: 'reticent',      pos: 'adjective', snippet: 'Not revealing one\'s thoughts or feelings readily.' },
  { word: 'insidious',     pos: 'adjective', snippet: 'Proceeding in a gradual, subtle, but harmful way.' },
  { word: 'sagacious',     pos: 'adjective', snippet: 'Having or showing keen mental discernment.' },
  { word: 'torpor',        pos: 'noun',      snippet: 'A state of physical or mental inactivity.' },
  { word: 'ameliorate',    pos: 'verb',      snippet: 'To make something bad or unsatisfactory better.' },
  { word: 'lassitude',     pos: 'noun',      snippet: 'Physical or mental weariness; lack of energy.' },
  { word: 'obfuscate',     pos: 'verb',      snippet: 'To render obscure, unclear, or unintelligible.' },
  { word: 'vacillate',     pos: 'verb',      snippet: 'To waver between different opinions or actions.' },
  { word: 'fastidious',    pos: 'adjective', snippet: 'Very attentive to accuracy and detail.' },
  { word: 'querulous',     pos: 'adjective', snippet: 'Complaining in a petulant or whining manner.' },
  { word: 'magnanimous',   pos: 'adjective', snippet: 'Very generous or forgiving, especially toward a rival.' },
  { word: 'vicissitude',   pos: 'noun',      snippet: 'A change of circumstances, especially unwelcome.' },
  { word: 'corroborate',   pos: 'verb',      snippet: 'To confirm or give support to a statement or theory.' },
  { word: 'penultimate',   pos: 'adjective', snippet: 'Last but one in a series.' },
  { word: 'soliloquy',     pos: 'noun',      snippet: 'An act of speaking thoughts aloud when alone.' },
  { word: 'obstreperous',  pos: 'adjective', snippet: 'Noisy and difficult to control.' },
  { word: 'propitious',    pos: 'adjective', snippet: 'Giving or indicating a good chance of success.' },
  { word: 'verisimilitude',pos: 'noun',      snippet: 'The appearance of being true or real.' },
]

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

  // Pick a random word from the user's collection to feature
  const featuredWord = useMemo<Word | null>(() => {
    if (!words.length) return null
    return words[Math.floor(Math.random() * words.length)]
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [words.length])

  const [featuredIndex, setFeaturedIndex] = useState(0)
  const rotatedFeatured = useMemo<Word | null>(() => {
    if (!words.length) return null
    return words[featuredIndex % words.length]
  }, [words, featuredIndex])

  const refreshFeatured = () => {
    setFeaturedIndex(i => i + 1 + Math.floor(Math.random() * (words.length - 1)))
  }

  // Pick 4 suggested words the user doesn't already have
  const suggestions = useMemo(() => {
    const owned = new Set(words.map(w => w.word.toLowerCase()))
    const available = SUGGESTED_WORDS.filter(s => !owned.has(s.word.toLowerCase()))
    const shuffled = [...available].sort(() => Math.random() - 0.5)
    return shuffled.slice(0, 4)
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
          <h1 className="text-2xl font-black text-gradient leading-none">Worduous</h1>
          {(streak ?? 0) > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring', stiffness: 400, damping: 20, delay: 0.2 }}
              className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-orange-950/60 border border-orange-500/25"
            >
              <Flame className="w-3 h-3 text-orange-400" />
              <span className="text-xs font-bold text-orange-300">{streak}</span>
            </motion.div>
          )}
        </div>
        <motion.div whileTap={{ scale: 0.88 }} transition={{ type: 'spring', stiffness: 500, damping: 18 }}>
          <Link
            href="/add"
            className="w-11 h-11 bg-[var(--color-primary)] rounded-2xl flex items-center justify-center text-[#0f0f14] glow-primary hover:scale-105 transition-transform"
          >
            <Plus className="w-5 h-5" strokeWidth={2.5} />
          </Link>
        </motion.div>
      </motion.div>

      <div className="flex flex-col gap-4 px-4">
        {/* ── Practice Now strip ──────────────────────── */}
        <motion.div custom={0} initial="hidden" animate="show" variants={fadeUp}>
          <Link href={dueCount > 0 ? '/quiz?mode=due' : '/quiz'}>
            <motion.div
              whileTap={{ scale: 0.98 }}
              className="flex items-center justify-between px-4 py-3.5 rounded-2xl border border-[var(--color-primary)]/30 cursor-pointer"
              style={{ background: 'linear-gradient(135deg, rgba(129,140,248,0.12), rgba(232,121,249,0.06))' }}
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
        {hasWords && rotatedFeatured ? (
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
                    className="rounded-2xl border overflow-hidden relative cursor-pointer group"
                    style={{
                      background: 'linear-gradient(160deg, #13131a 0%, #111113 50%, #0e0e1a 100%)',
                      borderColor: 'rgba(129,140,248,0.2)',
                    }}
                  >
                    {/* Glow blobs */}
                    <div className="absolute top-0 right-0 w-56 h-56 rounded-full blur-3xl pointer-events-none"
                      style={{ background: 'radial-gradient(circle, rgba(129,140,248,0.18) 0%, transparent 70%)', transform: 'translate(30%,-30%)' }} />
                    <div className="absolute bottom-0 left-0 w-40 h-40 rounded-full blur-2xl pointer-events-none"
                      style={{ background: 'radial-gradient(circle, rgba(232,121,249,0.12) 0%, transparent 70%)', transform: 'translate(-20%,30%)' }} />

                    <div className="relative p-6">
                      {/* Word + meta */}
                      <div className="mb-4">
                        <h2 className="text-4xl font-black text-[var(--color-text)] capitalize leading-none mb-2">
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

                      {/* Divider */}
                      <div className="w-full h-px bg-gradient-to-r from-[var(--color-primary)]/20 via-[var(--color-border)] to-transparent mb-4" />

                      {/* Definition */}
                      <p className="text-[var(--color-text)] leading-relaxed mb-3">
                        {rotatedFeatured.definition}
                      </p>

                      {/* Example sentence */}
                      {rotatedFeatured.exampleSentence && (
                        <p className="text-sm text-[var(--color-text-muted)] italic leading-relaxed border-l-2 border-[var(--color-primary)]/30 pl-3">
                          &ldquo;{rotatedFeatured.exampleSentence}&rdquo;
                        </p>
                      )}

                      {/* Footer */}
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
        ) : null}

        {/* ── Your Words ──────────────────────────────── */}
        {hasWords && (
          <motion.div custom={2} initial="hidden" animate="show" variants={fadeUp}>
            <div className="flex items-center justify-between mb-2 px-0.5">
              <p className="text-sm font-semibold text-[var(--color-text)]">Your Words</p>
              <Link href="/words" className="text-xs text-[var(--color-primary)] flex items-center gap-0.5 hover:underline">
                See all <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
            <WordList words={words.slice(0, 5)} />
          </motion.div>
        )}

        {/* ── Discover section ────────────────────────── */}
        {suggestions.length > 0 && (
          <motion.div custom={3} initial="hidden" animate="show" variants={fadeUp}>
            <div className="flex items-center justify-between mb-2 px-0.5">
              <p className="text-sm font-semibold text-[var(--color-text)]">Discover</p>
              <p className="text-xs text-[var(--color-text-faint)]">Words worth learning</p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {suggestions.map((s, i) => (
                <motion.div
                  key={s.word}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.28 + i * 0.06, duration: 0.28 }}
                >
                  <SuggestionCard word={s.word} pos={s.pos} snippet={s.snippet} />
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* ── Empty state ─────────────────────────────── */}
        {!hasWords && (
          <motion.div custom={1} initial="hidden" animate="show" variants={fadeUp}>
            <div className="flex flex-col items-center text-center gap-4 py-12 px-6 rounded-2xl border border-dashed border-[var(--color-border)]">
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

// ── Word list ─────────────────────────────────────────────────────────────
function WordList({ words }: { words: Word[] }) {
  return (
    <div className="flex flex-col gap-1.5">
      {words.map((word, i) => {
        const label = getMasteryLabel(word.masteryScore)
        return (
          <motion.div
            key={word.id}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.18 + i * 0.05 }}
          >
            <Link href={`/words/${word.id}`}>
              <motion.div
                whileTap={{ scale: 0.99 }}
                className="flex items-center justify-between px-4 py-3 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl hover:border-[var(--color-primary)]/25 transition-colors group"
              >
                <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                  <span className="font-semibold text-[var(--color-text)] capitalize">{word.word}</span>
                  <span className="text-xs text-[var(--color-text-faint)] truncate">{word.definition}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-3">
                  <Badge variant={MASTERY_VARIANT[label] ?? 'new'} size="sm">{label}</Badge>
                  <ChevronRight className="w-3.5 h-3.5 text-[var(--color-text-faint)] group-hover:text-[var(--color-text-muted)] transition-colors" />
                </div>
              </motion.div>
            </Link>
          </motion.div>
        )
      })}
    </div>
  )
}

// ── Suggestion card ───────────────────────────────────────────────────────
function SuggestionCard({ word, pos, snippet }: { word: string; pos: string; snippet: string }) {
  return (
    <Link href={`/add?word=${encodeURIComponent(word)}`}>
      <motion.div
        whileTap={{ scale: 0.97 }}
        className="h-full flex flex-col justify-between p-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-primary)]/30 transition-colors group cursor-pointer"
      >
        <div className="flex flex-col gap-1.5 mb-3">
          <div className="flex items-start justify-between gap-1">
            <span className="font-bold text-[var(--color-text)] capitalize text-base leading-tight">{word}</span>
          </div>
          <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-primary)] opacity-70">{pos}</span>
          <p className="text-xs text-[var(--color-text-muted)] leading-relaxed line-clamp-3">{snippet}</p>
        </div>
        <div className="flex items-center gap-1 text-xs text-[var(--color-text-faint)] group-hover:text-[var(--color-primary)] transition-colors">
          <BookmarkPlus className="w-3.5 h-3.5" />
          <span>Add word</span>
        </div>
      </motion.div>
    </Link>
  )
}
