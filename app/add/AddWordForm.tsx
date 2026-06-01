'use client'

import { useState, useRef, useTransition, useCallback, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Search, Volume2, Bookmark, RefreshCw, X, Sparkles } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { fetchWordDefinition } from './actions'
import { createWord } from '@/lib/db/words'
import type { WordLookupResult } from '@/lib/dictionary/client'
import { useUIStore } from '@/stores/ui'

type Stage = 'input' | 'loading' | 'preview' | 'saved'

export function AddWordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { addToast } = useUIStore()
  const prefill = searchParams.get('word') ?? ''
  const [word, setWord] = useState(prefill)
  const [stage, setStage] = useState<Stage>('input')
  const [result, setResult] = useState<WordLookupResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const inputRef = useRef<HTMLInputElement>(null)
  const audioRef = useRef<HTMLAudioElement>(null)

  // Auto-trigger lookup when arriving from a suggestion link
  useEffect(() => {
    if (prefill.trim()) {
      handleSearch()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleSearch = useCallback(() => {
    const trimmed = word.trim()
    if (!trimmed) return
    setError(null)
    setStage('loading')
    startTransition(async () => {
      const data = await fetchWordDefinition(trimmed)
      if (data) { setResult(data); setStage('preview') }
      else { setError(`No definition found for "${trimmed}". Try another word.`); setStage('input') }
    })
  }, [word])

  const handleKeyDown = (e: React.KeyboardEvent) => { if (e.key === 'Enter') handleSearch() }

  const handleSave = useCallback(async () => {
    if (!result) return
    await createWord({
      word: result.word, definition: result.definition, partOfSpeech: result.partOfSpeech,
      exampleSentence: result.exampleSentence, pronunciation: result.pronunciation,
      audioUrl: result.audioUrl, synonyms: result.synonyms, antonyms: result.antonyms,
      collections: [], notes: '', isArchived: false,
    })
    setStage('saved')
    addToast(`"${result.word}" added to your collection`, 'success')
    setTimeout(() => router.push('/'), 1400)
  }, [result, router, addToast])

  const handlePlayAudio = () => {
    if (result?.audioUrl && audioRef.current) {
      audioRef.current.src = result.audioUrl
      audioRef.current.play()
    }
  }

  const handleReset = () => {
    setWord(''); setResult(null); setStage('input'); setError(null)
    setTimeout(() => inputRef.current?.focus(), 100)
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ paddingTop: 'var(--safe-area-top)' }}>
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-4 pb-2">
        <Link href="/" className="w-9 h-9 flex items-center justify-center rounded-xl text-[var(--color-text-muted)] hover:bg-[var(--color-surface-2)] transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-lg font-semibold text-[var(--color-text)]">Add Word</h1>
      </div>

      <div className="flex-1 flex flex-col px-4 pt-6 pb-8 max-w-lg mx-auto w-full">
        <AnimatePresence mode="wait">

          {/* ─ Input stage ─ */}
          {(stage === 'input' || stage === 'loading') && (
            <motion.div
              key="input"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.28, ease: [0.25, 1, 0.5, 1] }}
              className="flex flex-col gap-7"
            >
              <div>
                <h2 className="text-3xl font-black text-[var(--color-text)] leading-tight mb-2">
                  What word did<br />
                  <span className="text-gradient">you discover?</span>
                </h2>
                <p className="text-[var(--color-text-muted)] text-sm">
                  We&apos;ll look up the definition for you.
                </p>
              </div>

              <div className="flex flex-col gap-3">
                <div className="relative">
                  <input
                    ref={inputRef}
                    autoFocus
                    value={word}
                    onChange={(e) => setWord(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="e.g. ubiquitous"
                    className="w-full text-2xl font-semibold bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl px-5 py-4 text-[var(--color-text)] placeholder:text-[var(--color-text-faint)] focus:outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20 transition-all duration-200 pr-12"
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck={false}
                  />
                  {word && (
                    <motion.button
                      whileTap={{ scale: 0.88 }}
                      onClick={() => setWord('')}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--color-text-faint)] hover:text-[var(--color-text-muted)]"
                    >
                      <X className="w-5 h-5" />
                    </motion.button>
                  )}
                </div>

                {error && (
                  <motion.p
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-sm text-[var(--color-error)] px-1"
                  >
                    {error}
                  </motion.p>
                )}

                <Button onClick={handleSearch} disabled={!word.trim()} loading={stage === 'loading'} size="xl" fullWidth>
                  {stage === 'loading' ? 'Looking up…' : (
                    <><Search className="w-4 h-4" />Look Up Word</>
                  )}
                </Button>
              </div>

              <p className="text-xs text-center text-[var(--color-text-faint)]">
                Definition, pronunciation, and examples are fetched automatically
              </p>
            </motion.div>
          )}

          {/* ─ Preview stage ─ */}
          {stage === 'preview' && result && (
            <motion.div
              key="preview"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.3, ease: [0.25, 1, 0.5, 1] }}
              className="flex flex-col gap-5"
            >
              {/* Word header */}
              <div>
                <div className="flex items-start justify-between gap-2">
                  <motion.h2
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.05 }}
                    className="text-5xl font-black text-[var(--color-text)] leading-tight capitalize"
                  >
                    {result.word}
                  </motion.h2>
                  <motion.button
                    whileTap={{ scale: 0.88, rotate: 180 }}
                    transition={{ duration: 0.3 }}
                    onClick={handleReset}
                    className="mt-2 p-2 rounded-xl text-[var(--color-text-faint)] hover:text-[var(--color-text-muted)] hover:bg-[var(--color-surface-2)] transition-colors"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </motion.button>
                </div>

                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.1 }}
                  className="flex items-center gap-2 mt-1.5"
                >
                  {result.pronunciation && (
                    <span className="text-[var(--color-text-muted)] font-mono text-sm">{result.pronunciation}</span>
                  )}
                  {result.audioUrl && (
                    <motion.button
                      whileTap={{ scale: 0.85 }}
                      onClick={handlePlayAudio}
                      className="p-1.5 rounded-lg text-[var(--color-primary)] hover:bg-[var(--color-primary-subtle)] transition-colors"
                    >
                      <Volume2 className="w-4 h-4" />
                    </motion.button>
                  )}
                  <span className="text-xs px-2.5 py-1 rounded-full bg-[var(--color-primary-subtle)] text-[var(--color-primary)] capitalize font-medium">
                    {result.partOfSpeech}
                  </span>
                </motion.div>
              </div>

              {/* Definition card */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.12 }}
                className="gradient-border rounded-2xl p-5 flex flex-col gap-4"
              >
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[var(--color-text-faint)] mb-1.5">Definition</p>
                  <p className="text-[var(--color-text)] text-lg leading-relaxed">{result.definition}</p>
                </div>

                {result.exampleSentence && (
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[var(--color-text-faint)] mb-1.5">Example</p>
                    <p className="text-[var(--color-text-muted)] italic leading-relaxed">
                      &ldquo;{result.exampleSentence}&rdquo;
                    </p>
                  </div>
                )}

                {result.synonyms.length > 0 && (
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[var(--color-text-faint)] mb-2">Synonyms</p>
                    <div className="flex flex-wrap gap-1.5">
                      {result.synonyms.slice(0, 6).map((s, i) => (
                        <motion.span
                          key={s}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.15 + i * 0.04 }}
                          className="text-xs px-2.5 py-1 rounded-full bg-[var(--color-primary-subtle)] border border-[var(--color-primary)]/20 text-[var(--color-primary)]"
                        >
                          {s}
                        </motion.span>
                      ))}
                    </div>
                  </div>
                )}

                {result.antonyms.length > 0 && (
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[var(--color-text-faint)] mb-2">Antonyms</p>
                    <div className="flex flex-wrap gap-1.5">
                      {result.antonyms.slice(0, 4).map((a, i) => (
                        <motion.span
                          key={a}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.2 + i * 0.04 }}
                          className="text-xs px-2.5 py-1 rounded-full bg-rose-950/50 border border-rose-500/20 text-rose-400"
                        >
                          {a}
                        </motion.span>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="flex flex-col gap-2"
              >
                <Button onClick={handleSave} size="xl" fullWidth className="glow-primary">
                  <Bookmark className="w-4 h-4" />
                  Save Word
                </Button>
                <Button onClick={handleReset} variant="ghost" size="lg" fullWidth>
                  Try Different Word
                </Button>
              </motion.div>
            </motion.div>
          )}

          {/* ─ Saved stage ─ */}
          {stage === 'saved' && result && (
            <motion.div
              key="saved"
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, type: 'spring', stiffness: 280, damping: 18 }}
              className="flex-1 flex flex-col items-center justify-center gap-6 text-center"
            >
              {/* Pulsing ring + emoji */}
              <div className="relative">
                <motion.div
                  className="absolute inset-0 rounded-full"
                  style={{ background: 'radial-gradient(circle, rgba(129,140,248,0.3), transparent 70%)' }}
                  animate={{ scale: [1, 1.5, 1], opacity: [0.6, 0, 0.6] }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                />
                <div className="relative w-24 h-24 rounded-full flex items-center justify-center"
                  style={{ background: 'linear-gradient(135deg, rgba(129,140,248,0.2), rgba(232,121,249,0.2))', border: '1px solid rgba(129,140,248,0.3)' }}>
                  <motion.span
                    animate={{ rotate: [0, -10, 10, 0], scale: [1, 1.1, 1] }}
                    transition={{ delay: 0.2, duration: 0.6 }}
                    className="text-4xl"
                  >
                    🌱
                  </motion.span>
                </div>
              </div>

              <div>
                <motion.h2
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                  className="text-3xl font-black text-gradient capitalize mb-1"
                >
                  {result.word}
                </motion.h2>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.25 }}
                  className="text-[var(--color-text-muted)] flex items-center justify-center gap-1.5"
                >
                  <Sparkles className="w-4 h-4 text-[var(--color-primary)]" />
                  Planted in your collection
                </motion.p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {result?.audioUrl && <audio ref={audioRef} className="hidden" />}
    </div>
  )
}
