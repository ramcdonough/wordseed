'use client'

import { useState, useMemo, useCallback, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, ChevronRight, RotateCcw, Send } from 'lucide-react'
import Link from 'next/link'
import { WordSourcePicker } from '@/components/train/WordSourcePicker'
import { Button } from '@/components/ui/Button'
import { evaluateDefinition } from './actions'
import type { DefinitionEval } from './actions'
import type { Word } from '@/types'

const MAX_ATTEMPTS = 3

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

type WordState = 'waiting' | 'checking' | 'correct' | 'close' | 'failed'

interface RoundResult {
  word: string
  passed: boolean
  attempts: number
}

export default function DefinePage() {
  const router = useRouter()
  const [sessionWords, setSessionWords] = useState<Word[] | null>(null)

  const deck = useMemo<Word[]>(() => shuffle([...(sessionWords ?? [])]), [sessionWords])

  const [index, setIndex] = useState(0)
  const [attempts, setAttempts] = useState(0)
  const [input, setInput] = useState('')
  const [wordState, setWordState] = useState<WordState>('waiting')
  const [evalResult, setEvalResult] = useState<DefinitionEval | null>(null)
  const [results, setResults] = useState<RoundResult[]>([])
  const [finished, setFinished] = useState(false)
  const [showDefinition, setShowDefinition] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const current = deck[index]

  useEffect(() => {
    if (wordState === 'waiting') {
      textareaRef.current?.focus()
    }
  }, [index, wordState])

  const submit = useCallback(async () => {
    if (!current || !input.trim() || wordState === 'checking') return
    setWordState('checking')
    try {
      const ev = await evaluateDefinition(current.word, current.definition, input.trim())
      setEvalResult(ev)

      if (ev.result === 'correct') {
        setWordState('correct')
      } else {
        const nextAttempts = attempts + 1
        setAttempts(nextAttempts)
        setInput('')
        if (nextAttempts >= MAX_ATTEMPTS) {
          setWordState('failed')
        } else {
          setWordState('close')
        }
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      const feedback = msg.includes('API_KEY') || msg.includes('401') || msg.includes('403')
        ? 'Invalid API key — set GEMINI_API_KEY in .env.local.'
        : `AI error: ${msg.slice(0, 200)}`
      setEvalResult({ result: 'incorrect', feedback })
      setWordState('close')
    }
  }, [current, input, wordState, attempts])

  const advance = useCallback(
    (passed: boolean) => {
      if (!current) return
      const next = [...results, { word: current.word, passed, attempts: attempts + (passed ? 0 : 0) }]
      setResults(next)
      if (index + 1 >= deck.length) {
        setFinished(true)
      } else {
        setIndex((i) => i + 1)
        setAttempts(0)
        setInput('')
        setWordState('waiting')
        setEvalResult(null)
        setShowDefinition(false)
      }
    },
    [current, results, index, deck.length, attempts],
  )

  const restart = useCallback(() => {
    setIndex(0)
    setAttempts(0)
    setInput('')
    setWordState('waiting')
    setEvalResult(null)
    setResults([])
    setFinished(false)
    setShowDefinition(false)
  }, [])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        submit()
      }
    },
    [submit],
  )

  // ── Word source picker ───────────────────────────────────────────────
  if (!sessionWords) {
    return <WordSourcePicker minWords={1} modeTitle="Define It" onStart={setSessionWords} />
  }

  // ── Finished screen ─────────────────────────────────────────────────
  if (finished) {
    const passed = results.filter((r) => r.passed).length
    const total = results.length
    const pct = Math.round((passed / total) * 100)
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
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <p className="text-[var(--color-text-faint)] text-sm uppercase tracking-widest font-semibold mb-1">
            Session complete
          </p>
          <h2 className="text-5xl font-black text-[var(--color-text)] mb-3">
            {passed}<span className="text-2xl text-[var(--color-text-faint)]">/{total}</span>
          </h2>
          <p className="text-[var(--color-text-muted)] text-sm">
            {pct >= 80
              ? 'Excellent! You really know these words.'
              : pct >= 50
              ? 'Good effort. Keep practising the tricky ones.'
              : 'Keep going — defining words cements them.'}
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

  const isTerminal = wordState === 'correct' || wordState === 'failed'
  const attemptsLeft = MAX_ATTEMPTS - attempts

  return (
    <div className="flex flex-col min-h-full" style={{ paddingTop: 'var(--safe-area-top)' }}>
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
            {index + 1} of {deck.length}
          </p>
          <div className="w-24 h-1 bg-[var(--color-border)] rounded-full mt-1 overflow-hidden">
            <motion.div
              className="h-full bg-[var(--color-primary)] rounded-full"
              animate={{ width: `${((index + 1) / deck.length) * 100}%` }}
              transition={{ duration: 0.4 }}
            />
          </div>
        </div>
        <div className="w-9 h-9 flex items-center justify-center">
          <span className="text-sm font-bold text-[var(--color-success)]">
            {results.filter((r) => r.passed).length}
          </span>
        </div>
      </div>

      <div className="flex-1 flex flex-col px-4 pb-8 gap-5">
        {/* Word card */}
        <motion.div
          key={current.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="p-6 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl paper-texture shadow-paper text-center"
        >
          <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-primary)] mb-3">
            Define this word
          </p>
          <h2 className="text-4xl font-black text-[var(--color-text)] mb-2">{current.word}</h2>
          {current.partOfSpeech && (
            <span className="inline-block text-[10px] font-semibold uppercase tracking-wider px-3 py-1 rounded-full bg-[var(--color-surface-2)] text-[var(--color-text-muted)] border border-[var(--color-border)]">
              {current.partOfSpeech}
            </span>
          )}
          {!isTerminal && (
            <p className="text-xs text-[var(--color-text-faint)] mt-3">
              {attempts === 0
                ? `${MAX_ATTEMPTS} attempts`
                : `${attemptsLeft} attempt${attemptsLeft === 1 ? '' : 's'} left`}
            </p>
          )}
        </motion.div>

        {/* Feedback banner */}
        <AnimatePresence mode="wait">
          {evalResult && (
            <motion.div
              key={wordState + attempts}
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className={[
                'p-4 rounded-xl border text-sm',
                wordState === 'correct'
                  ? 'bg-[var(--color-success-subtle)] border-[var(--color-success)]/30 text-[var(--color-success)]'
                  : wordState === 'failed'
                  ? 'bg-[var(--color-error-subtle)] border-[var(--color-error)]/30 text-[var(--color-error)]'
                  : 'bg-[var(--color-warning-subtle)] border-[var(--color-warning)]/30 text-[var(--color-warning)]',
              ].join(' ')}
            >
              <p className="font-semibold mb-0.5">
                {wordState === 'correct' ? '✓ Correct!' : wordState === 'failed' ? '✗ Not quite' : '~ Close, but…'}
              </p>
              <p className="opacity-90">{evalResult.feedback}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Real definition (shown after failure or on demand) */}
        <AnimatePresence>
          {(wordState === 'correct' || wordState === 'failed' || showDefinition) && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="p-4 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl">
                <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-faint)] mb-1.5">
                  Definition
                </p>
                <p className="text-[var(--color-text)] leading-relaxed text-sm">{current.definition}</p>
                {current.exampleSentence && (
                  <p className="text-xs text-[var(--color-text-muted)] italic mt-2 border-l-2 border-[var(--color-border)] pl-3">
                    &ldquo;{current.exampleSentence}&rdquo;
                  </p>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Input area */}
        {!isTerminal && (
          <div className="flex flex-col gap-2">
            <div className="relative">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type your definition…"
                rows={3}
                disabled={wordState === 'checking'}
                className="w-full bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-xl px-4 py-3 text-[var(--color-text)] placeholder:text-[var(--color-text-faint)] focus:outline-none focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)]/30 resize-none transition-colors duration-150 text-sm"
              />
            </div>
            <div className="flex gap-2">
              {wordState === 'close' && (
                <Button variant="ghost" size="md" onClick={() => advance(false)} className="flex-1">
                  Skip
                </Button>
              )}
              <Button
                size="md"
                onClick={submit}
                disabled={!input.trim() || wordState === 'checking'}
                loading={wordState === 'checking'}
                className="flex-1"
              >
                <Send className="w-4 h-4" />
                {wordState === 'checking' ? 'Checking…' : 'Submit'}
              </Button>
            </div>
            {!showDefinition && (
              <button
                onClick={() => setShowDefinition(true)}
                className="text-xs text-center text-[var(--color-text-faint)] hover:text-[var(--color-text-muted)] transition-colors"
              >
                Reveal definition
              </button>
            )}
          </div>
        )}

        {/* Next / advance */}
        {isTerminal && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-auto"
          >
            <Button
              size="xl"
              fullWidth
              onClick={() => advance(wordState === 'correct')}
            >
              {index + 1 >= deck.length ? 'See results' : 'Next word'}
              <ChevronRight className="w-4 h-4" />
            </Button>
          </motion.div>
        )}
      </div>
    </div>
  )
}
