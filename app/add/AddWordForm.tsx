'use client'

import { useState, useRef, useTransition, useCallback, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Search, Volume2, Bookmark, RefreshCw, X, Sparkles, CornerDownRight } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { fetchWordDefinition } from './actions'
import { createWord } from '@/lib/db/words'
import type { WordLookupResult } from '@/lib/dictionary/client'
import { useUIStore } from '@/stores/ui'

type Stage = 'input' | 'loading' | 'preview' | 'saved' | 'manual'

async function fetchSuggestions(partial: string): Promise<string[]> {
  try {
    const res = await fetch(
      `https://api.datamuse.com/sug?s=${encodeURIComponent(partial)}&max=6`,
      { signal: AbortSignal.timeout(2000) }
    )
    const data: { word: string }[] = await res.json()
    return data.map((d) => d.word)
  } catch {
    return []
  }
}

async function fetchDidYouMean(word: string): Promise<string[]> {
  try {
    const res = await fetch(
      `https://api.datamuse.com/words?sp=${encodeURIComponent(word)}&max=4`,
      { signal: AbortSignal.timeout(2000) }
    )
    const data: { word: string }[] = await res.json()
    return data.map((d) => d.word).filter((w) => w.toLowerCase() !== word.toLowerCase())
  } catch {
    return []
  }
}

export function AddWordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { addToast } = useUIStore()
  const prefill = searchParams.get('word') ?? ''

  const isAutoFetch = !!prefill.trim()
  const [word, setWord] = useState(prefill)
  const [stage, setStage] = useState<Stage>(isAutoFetch ? 'loading' : 'input')
  const [result, setResult] = useState<WordLookupResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const [suggestions, setSuggestions] = useState<string[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [didYouMean, setDidYouMean] = useState<string[]>([])
  const [activeSuggestion, setActiveSuggestion] = useState(-1)

  const [manualPartOfSpeech, setManualPartOfSpeech] = useState('noun')
  const [manualDefinition, setManualDefinition] = useState('')
  const [manualExample, setManualExample] = useState('')

  const inputRef = useRef<HTMLInputElement>(null)
  const audioRef = useRef<HTMLAudioElement>(null)
  const suggestionsRef = useRef<HTMLDivElement>(null)

  // Auto-trigger lookup when arriving from a suggestion link
  useEffect(() => {
    if (prefill.trim()) handleSearch()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Debounced autocomplete
  useEffect(() => {
    if (word.length < 2) { setSuggestions([]); setShowSuggestions(false); return }
    const timer = setTimeout(async () => {
      const results = await fetchSuggestions(word)
      setSuggestions(results)
      setShowSuggestions(results.length > 0)
      setActiveSuggestion(-1)
    }, 280)
    return () => clearTimeout(timer)
  }, [word])

  const pickSuggestion = useCallback((picked: string) => {
    setWord(picked)
    setSuggestions([])
    setShowSuggestions(false)
    setDidYouMean([])
    setError(null)
    // Trigger search immediately
    setStage('loading')
    startTransition(async () => {
      const data = await fetchWordDefinition(picked)
      if (data) { setResult(data); setStage('preview') }
      else {
        const alts = await fetchDidYouMean(picked)
        setDidYouMean(alts)
        setError(`No definition found for "${picked}".`)
        setStage('input')
      }
    })
  }, [])

  const handleSearch = useCallback(() => {
    const trimmed = word.trim()
    if (!trimmed) return
    setError(null)
    setDidYouMean([])
    setSuggestions([])
    setShowSuggestions(false)
    setStage('loading')
    startTransition(async () => {
      const data = await fetchWordDefinition(trimmed)
      if (data) { setResult(data); setStage('preview') }
      else {
        const alts = await fetchDidYouMean(trimmed)
        setDidYouMean(alts)
        setError(`No definition found for "${trimmed}".`)
        setStage('input')
      }
    })
  }, [word])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (showSuggestions && suggestions.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setActiveSuggestion((i) => Math.min(i + 1, suggestions.length - 1))
        return
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault()
        setActiveSuggestion((i) => Math.max(i - 1, -1))
        return
      }
      if (e.key === 'Enter' && activeSuggestion >= 0) {
        e.preventDefault()
        pickSuggestion(suggestions[activeSuggestion])
        return
      }
      if (e.key === 'Escape') {
        setShowSuggestions(false)
        return
      }
    }
    if (e.key === 'Enter') handleSearch()
  }

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

  const handleManualSave = useCallback(async () => {
    if (!manualDefinition.trim()) return
    await createWord({
      word: word.trim(),
      definition: manualDefinition.trim(),
      partOfSpeech: manualPartOfSpeech,
      exampleSentence: manualExample.trim(),
      pronunciation: '',
      audioUrl: '',
      synonyms: [],
      antonyms: [],
      collections: [],
      notes: '',
      isArchived: false,
    })
    setStage('saved')
    setResult({ word: word.trim(), definition: manualDefinition.trim(), partOfSpeech: manualPartOfSpeech, exampleSentence: manualExample.trim(), pronunciation: '', audioUrl: '', synonyms: [], antonyms: [] })
    addToast(`"${word.trim()}" added to your collection`, 'success')
    setTimeout(() => router.push('/'), 1400)
  }, [word, manualDefinition, manualPartOfSpeech, manualExample, router, addToast])

  const handleReset = () => {
    setWord(''); setResult(null); setStage('input'); setError(null)
    setDidYouMean([]); setSuggestions([]); setShowSuggestions(false)
    setManualDefinition(''); setManualExample(''); setManualPartOfSpeech('noun')
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

          {/* ─ Loading ─ */}
          {stage === 'loading' && (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 flex items-center justify-center"
            >
              <div className="w-8 h-8 rounded-full border-2 border-[var(--color-primary)]/30 border-t-[var(--color-primary)] animate-spin" />
            </motion.div>
          )}

          {/* ─ Input stage ─ */}
          {stage === 'input' && (
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
                {/* Input + autocomplete dropdown */}
                <div className="relative">
                  <input
                    ref={inputRef}
                    autoFocus
                    value={word}
                    onChange={(e) => { setWord(e.target.value); setError(null); setDidYouMean([]) }}
                    onKeyDown={handleKeyDown}
                    onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                    onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                    placeholder="e.g. ubiquitous"
                    className="w-full text-2xl font-semibold bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl px-5 py-4 text-[var(--color-text)] placeholder:text-[var(--color-text-faint)] focus:outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20 transition-all duration-200 pr-12"
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck={false}
                    aria-autocomplete="list"
                    aria-expanded={showSuggestions}
                  />
                  {word && (
                    <motion.button
                      whileTap={{ scale: 0.88 }}
                      onClick={() => { setWord(''); setSuggestions([]); setShowSuggestions(false); setDidYouMean([]); setError(null) }}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--color-text-faint)] hover:text-[var(--color-text-muted)]"
                    >
                      <X className="w-5 h-5" />
                    </motion.button>
                  )}

                  {/* Autocomplete dropdown */}
                  <AnimatePresence>
                    {showSuggestions && suggestions.length > 0 && (
                      <motion.div
                        ref={suggestionsRef}
                        initial={{ opacity: 0, y: -6, scaleY: 0.95 }}
                        animate={{ opacity: 1, y: 0, scaleY: 1 }}
                        exit={{ opacity: 0, y: -6, scaleY: 0.95 }}
                        transition={{ duration: 0.15 }}
                        style={{ transformOrigin: 'top' }}
                        className="absolute top-full left-0 right-0 mt-2 z-50 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl overflow-hidden shadow-paper paper-texture"
                      >
                        {suggestions.map((s, i) => (
                          <button
                            key={s}
                            onMouseDown={(e) => { e.preventDefault(); pickSuggestion(s) }}
                            className={`w-full text-left px-5 py-3 flex items-center gap-3 transition-colors ${
                              i === activeSuggestion
                                ? 'bg-[var(--color-primary-subtle)] text-[var(--color-primary)]'
                                : 'text-[var(--color-text)] hover:bg-[var(--color-surface-2)]'
                            }`}
                          >
                            <Search className="w-3.5 h-3.5 shrink-0 text-[var(--color-text-faint)]" />
                            <span className="text-lg font-medium">{s}</span>
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Error + manual entry offer */}
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col gap-2"
                  >
                    <p className="text-sm text-[var(--color-error)] px-1">{error}</p>
                    {word.trim() && (
                      <button
                        onClick={() => setStage('manual')}
                        className="text-sm text-left px-1 text-[var(--color-primary)] underline underline-offset-2 hover:opacity-80 transition-opacity"
                      >
                        Add &ldquo;{word.trim()}&rdquo; with your own definition →
                      </button>
                    )}
                  </motion.div>
                )}

                {/* Did you mean */}
                <AnimatePresence>
                  {didYouMean.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="flex items-start gap-2 px-1"
                    >
                      <CornerDownRight className="w-3.5 h-3.5 mt-0.5 shrink-0 text-[var(--color-text-faint)]" />
                      <p className="text-sm text-[var(--color-text-muted)]">
                        Did you mean{' '}
                        {didYouMean.map((w, i) => (
                          <span key={w}>
                            <button
                              onClick={() => pickSuggestion(w)}
                              className="font-semibold text-[var(--color-primary)] underline underline-offset-2 hover:opacity-80 transition-opacity"
                            >
                              {w}
                            </button>
                            {i < didYouMean.length - 1 && <span className="text-[var(--color-text-faint)]">, </span>}
                          </span>
                        ))}
                        ?
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>

                <Button onClick={handleSearch} disabled={!word.trim()} size="xl" fullWidth>
                  <Search className="w-4 h-4" />Look Up Word
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
                          className="text-xs px-2.5 py-1 rounded-full bg-[var(--color-error-subtle)] border border-[var(--color-error)]/20 text-[var(--color-error)]"
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

          {/* ─ Manual entry stage ─ */}
          {stage === 'manual' && (
            <motion.div
              key="manual"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.28, ease: [0.25, 1, 0.5, 1] }}
              className="flex flex-col gap-6"
            >
              <div>
                <h2 className="text-3xl font-black text-[var(--color-text)] leading-tight mb-1">
                  Define <span className="text-gradient capitalize">{word.trim()}</span>
                </h2>
                <p className="text-[var(--color-text-muted)] text-sm">
                  No dictionary entry found — add your own definition.
                </p>
              </div>

              <div className="flex flex-col gap-4">
                {/* Part of speech */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-[0.15em] text-[var(--color-text-faint)]">
                    Part of speech
                  </label>
                  <select
                    value={manualPartOfSpeech}
                    onChange={(e) => setManualPartOfSpeech(e.target.value)}
                    className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl px-4 py-3 text-[var(--color-text)] focus:outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20 transition-all duration-200"
                  >
                    {['noun', 'verb', 'adjective', 'adverb', 'pronoun', 'preposition', 'conjunction', 'interjection', 'other'].map((pos) => (
                      <option key={pos} value={pos}>{pos}</option>
                    ))}
                  </select>
                </div>

                {/* Definition */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-[0.15em] text-[var(--color-text-faint)]">
                    Definition <span className="text-[var(--color-error)]">*</span>
                  </label>
                  <textarea
                    value={manualDefinition}
                    onChange={(e) => setManualDefinition(e.target.value)}
                    placeholder="What does it mean?"
                    rows={3}
                    className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl px-4 py-3 text-[var(--color-text)] placeholder:text-[var(--color-text-faint)] focus:outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20 transition-all duration-200 resize-none"
                  />
                </div>

                {/* Example */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-[0.15em] text-[var(--color-text-faint)]">
                    Example sentence <span className="text-[var(--color-text-faint)]">(optional)</span>
                  </label>
                  <input
                    value={manualExample}
                    onChange={(e) => setManualExample(e.target.value)}
                    placeholder="Use it in a sentence…"
                    className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl px-4 py-3 text-[var(--color-text)] placeholder:text-[var(--color-text-faint)] focus:outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20 transition-all duration-200"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <Button
                  onClick={handleManualSave}
                  disabled={!manualDefinition.trim()}
                  size="xl"
                  fullWidth
                  className="glow-primary"
                >
                  <Bookmark className="w-4 h-4" />
                  Save Word
                </Button>
                <Button onClick={handleReset} variant="ghost" size="lg" fullWidth>
                  Start Over
                </Button>
              </div>
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
              <div className="relative">
                <motion.div
                  className="absolute inset-0 rounded-full"
                  style={{ background: 'radial-gradient(circle, color-mix(in srgb, var(--color-primary) 30%, transparent), transparent 70%)' }}
                  animate={{ scale: [1, 1.5, 1], opacity: [0.6, 0, 0.6] }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                />
                <div
                  className="relative w-24 h-24 rounded-full flex items-center justify-center"
                  style={{
                    background: 'linear-gradient(135deg, color-mix(in srgb, var(--color-primary) 20%, transparent), color-mix(in srgb, var(--color-success) 20%, transparent))',
                    border: '1px solid color-mix(in srgb, var(--color-primary) 30%, transparent)',
                  }}
                >
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
