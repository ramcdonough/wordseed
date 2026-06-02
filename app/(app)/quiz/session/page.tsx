'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence, useAnimate } from 'framer-motion'
import { X, ArrowRight, Check, ChevronRight, RefreshCw, Home, Star } from 'lucide-react'
import { useQuizStore } from '@/stores/quiz'
import { finishQuizSession } from '@/lib/db/sessions'
import { applyReview } from '@/lib/srs/sm2'
import { recordReview, getWord } from '@/lib/db/words'
import { Button } from '@/components/ui/Button'
import type { QuizResult, QuestionType } from '@/types'
import type { GeneratedQuestion } from '@/lib/quiz/types'
import Link from 'next/link'

const TYPE_LABELS: Record<QuestionType, string> = {
  word_to_definition: 'Choose the definition',
  definition_to_word: 'Choose the word',
  fill_in_blank: 'Fill in the blank',
  true_or_false: 'True or false?',
  synonym_challenge: 'Synonym',
  antonym_challenge: 'Antonym',
}

const OPTION_LABELS = ['A', 'B', 'C', 'D']

// ── Confetti particle ──────────────────────────────────────────────────────
const CONFETTI_COLORS = ['#818cf8', '#e879f9', '#34d399', '#fbbf24', '#f87171', '#60a5fa']

function ConfettiBurst({ active }: { active: boolean }) {
  const particles = Array.from({ length: 28 }, (_, i) => ({
    id: i,
    color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
    x: (Math.random() - 0.5) * 320,
    y: -Math.random() * 260 - 40,
    rotate: Math.random() * 720 - 360,
    size: Math.random() * 8 + 5,
    delay: Math.random() * 0.15,
  }))

  if (!active) return null

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          initial={{ x: 0, y: 0, opacity: 1, rotate: 0, scale: 1 }}
          animate={{ x: p.x, y: p.y, opacity: 0, rotate: p.rotate, scale: 0.3 }}
          transition={{ duration: 0.9 + p.delay, ease: [0.25, 1, 0.5, 1], delay: p.delay }}
          className="absolute left-1/2 top-1/2 rounded-sm"
          style={{ width: p.size, height: p.size * 0.5, background: p.color }}
        />
      ))}
    </div>
  )
}

// ── Main session page ───────────────────────────────────────────────────────
export default function QuizSessionPage() {
  const router = useRouter()
  const { sessionId, questions, currentIndex, results, isFinished, recordAnswer, nextQuestion, reset } = useQuizStore()
  const [ready, setReady] = useState(false)

  useEffect(() => {
    // Wait one tick for Zustand to hydrate before checking
    const t = setTimeout(() => {
      setReady(true)
      if (!useQuizStore.getState().sessionId || useQuizStore.getState().questions.length === 0) {
        router.replace('/quiz')
      }
    }, 50)
    return () => clearTimeout(t)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleQuit = async () => {
    if (sessionId && results.length > 0) await finishQuizSession(sessionId, results)
    reset()
    router.replace('/quiz')
  }

  if (!ready) return null

  if (isFinished) {
    return (
      <ResultsScreen
        results={results}
        questions={questions}
        onDone={() => { reset(); router.replace('/') }}
        onRetry={() => { reset(); router.replace('/quiz') }}
      />
    )
  }

  if (!questions[currentIndex]) return null

  return (
    <QuestionScreen
      question={questions[currentIndex]}
      index={currentIndex}
      total={questions.length}
      onAnswer={async (answer, isCorrect) => {
        const q = questions[currentIndex]
        const t = Date.now()
        const word = await getWord(q.word.id)
        if (word) await recordReview(word.id, applyReview(word, isCorrect))
        recordAnswer({
          wordId: q.word.id,
          word: q.word.word,
          questionType: q.type,
          isCorrect,
          userAnswer: answer,
          correctAnswer: q.correctAnswer,
          timeSpent: Date.now() - t,
        })
      }}
      onNext={() => {
        nextQuestion()
        if (currentIndex + 1 >= questions.length && sessionId) {
          finishQuizSession(sessionId, [...results])
        }
      }}
      onQuit={handleQuit}
    />
  )
}

// ── Question screen ─────────────────────────────────────────────────────────
function QuestionScreen({
  question, index, total, onAnswer, onNext, onQuit,
}: {
  question: GeneratedQuestion
  index: number
  total: number
  onAnswer: (answer: string, isCorrect: boolean) => Promise<void>
  onNext: () => void
  onQuit: () => void
}) {
  const [selected, setSelected] = useState<string | null>(null)
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null)
  const [answering, setAnswering] = useState(false)
  const [confettiActive, setConfettiActive] = useState(false)
  const [scope, animate] = useAnimate()
  const progress = (index + 1) / total

  const handleSelect = async (option: string) => {
    if (selected !== null || answering) return
    setAnswering(true)
    const correct = option === question.correctAnswer
    setSelected(option)
    setIsCorrect(correct)
    await onAnswer(option, correct)

    if (correct) {
      setConfettiActive(true)
      setTimeout(() => setConfettiActive(false), 1000)
    } else {
      if (scope.current) {
        animate(scope.current, { x: [0, -8, 8, -5, 5, 0] }, { duration: 0.35 })
      }
    }
    setAnswering(false)
  }

  const handleNext = () => {
    setSelected(null)
    setIsCorrect(null)
    setConfettiActive(false)
    onNext()
  }

  return (
    <div className="flex flex-col min-h-screen" style={{ paddingTop: 'var(--safe-area-top)' }}>
      {/* Progress */}
      <div className="px-4 pt-4 pb-2">
        <div className="flex items-center gap-3 mb-3">
          <motion.button
            whileTap={{ scale: 0.88 }}
            onClick={onQuit}
            className="w-8 h-8 flex items-center justify-center rounded-xl text-[var(--color-text-faint)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-2)] transition-colors"
          >
            <X className="w-4 h-4" />
          </motion.button>

          <div className="flex-1 h-2 bg-[var(--color-surface-3)] rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              initial={{ width: `${(index / total) * 100}%` }}
              animate={{ width: `${progress * 100}%` }}
              transition={{ duration: 0.5, ease: [0.34, 1.2, 0.64, 1] }}
              style={{ background: 'linear-gradient(90deg, #818cf8, #e879f9)' }}
            />
          </div>

          <span className="text-xs text-[var(--color-text-faint)] font-medium w-10 text-right tabular-nums">
            {index + 1}/{total}
          </span>
        </div>

        <motion.p
          key={question.type}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-[10px] font-bold uppercase tracking-[0.15em] text-[var(--color-primary)]"
        >
          {TYPE_LABELS[question.type]}
        </motion.p>
      </div>

      {/* Question body */}
      <div className="flex-1 flex flex-col px-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={question.id}
            initial={{ opacity: 0, x: 28 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -28 }}
            transition={{ duration: 0.22, ease: [0.25, 1, 0.5, 1] }}
            className="flex flex-col gap-5 flex-1"
          >
            {/* Prompt */}
            <div className="pt-2 pb-4 border-b border-[var(--color-border)]">
              <p className="text-2xl font-bold text-[var(--color-text)] leading-snug capitalize">
                {question.prompt}
              </p>
              {question.hint && (
                <p className="text-sm text-[var(--color-text-faint)] mt-1">{question.hint}</p>
              )}
            </div>

            {/* Options */}
            <div ref={scope} className="flex flex-col gap-2.5 relative">
              <ConfettiBurst active={confettiActive} />

              {question.options.map((option, i) => {
                const isSelected = selected === option
                const isRight = option === question.correctAnswer
                let state: 'default' | 'correct' | 'incorrect' | 'reveal' = 'default'
                if (selected !== null) {
                  if (isSelected && isCorrect) state = 'correct'
                  else if (isSelected && !isCorrect) state = 'incorrect'
                  else if (isRight && !isCorrect) state = 'reveal'
                }

                return (
                  <motion.button
                    key={option}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{
                      opacity: 1, y: 0,
                      scale: state === 'correct' ? [1, 1.03, 1] : 1,
                    }}
                    transition={{
                      opacity: { delay: i * 0.06 },
                      y: { delay: i * 0.06 },
                      scale: state === 'correct' ? { duration: 0.4, ease: [0.34, 1.56, 0.64, 1] } : {},
                    }}
                    onClick={() => handleSelect(option)}
                    disabled={selected !== null}
                    className={[
                      'w-full text-left px-4 py-3.5 rounded-2xl border transition-all duration-200 relative overflow-hidden',
                      state === 'correct'
                        ? 'bg-emerald-950/60 border-emerald-500/60 text-emerald-300 glow-success'
                        : state === 'incorrect'
                        ? 'bg-red-950/60 border-red-500/50 text-red-300'
                        : state === 'reveal'
                        ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-400'
                        : 'bg-[var(--color-surface)] border-[var(--color-border)] text-[var(--color-text)] hover:border-[var(--color-primary)]/50 hover:bg-[var(--color-surface-2)] active:scale-[0.98]',
                    ].join(' ')}
                  >
                    <div className="flex items-center gap-3">
                      {/* Letter badge */}
                      <span className={[
                        'w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-bold shrink-0 transition-colors',
                        state === 'correct' ? 'bg-emerald-500/20 text-emerald-300'
                        : state === 'incorrect' ? 'bg-red-500/20 text-red-300'
                        : state === 'reveal' ? 'bg-emerald-500/15 text-emerald-400'
                        : 'bg-[var(--color-surface-3)] text-[var(--color-text-faint)]',
                      ].join(' ')}>
                        {OPTION_LABELS[i]}
                      </span>

                      <span className="flex-1 text-sm font-medium leading-snug">{option}</span>

                      <AnimatePresence>
                        {(state === 'correct' || state === 'reveal') && (
                          <motion.div
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ type: 'spring', stiffness: 500, damping: 20 }}
                          >
                            <Check className="w-4 h-4 shrink-0" strokeWidth={2.5} />
                          </motion.div>
                        )}
                        {state === 'incorrect' && (
                          <motion.div
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ type: 'spring', stiffness: 500, damping: 20 }}
                          >
                            <X className="w-4 h-4 shrink-0" strokeWidth={2.5} />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </motion.button>
                )
              })}
            </div>

            {/* Feedback bar + Next */}
            <AnimatePresence>
              {selected !== null && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ type: 'spring', stiffness: 320, damping: 26 }}
                  className="mt-auto pb-4 flex flex-col gap-2"
                >
                  {!isCorrect && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.96 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="p-3 bg-[var(--color-surface-2)] rounded-xl border border-[var(--color-border)]"
                    >
                      <p className="text-[10px] text-[var(--color-text-faint)] uppercase tracking-widest mb-0.5">Correct answer</p>
                      <p className="text-sm text-[var(--color-text)] font-semibold">{question.correctAnswer}</p>
                    </motion.div>
                  )}
                  <motion.div whileTap={{ scale: 0.97 }}>
                    <Button
                      onClick={handleNext}
                      size="xl"
                      fullWidth
                      className={isCorrect ? 'glow-success' : ''}
                      variant={isCorrect ? 'success' : 'secondary'}
                    >
                      {isCorrect ? (
                        <><Star className="w-4 h-4" /> Keep going <ArrowRight className="w-4 h-4" /></>
                      ) : (
                        <>Next <ArrowRight className="w-4 h-4" /></>
                      )}
                    </Button>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}

// ── Results screen ──────────────────────────────────────────────────────────
function ResultsScreen({
  results, questions, onDone, onRetry,
}: {
  results: QuizResult[]
  questions: GeneratedQuestion[]
  onDone: () => void
  onRetry: () => void
}) {
  const correct = results.filter((r) => r.isCorrect).length
  const accuracy = Math.round((correct / results.length) * 100)
  const missed = results.filter((r) => !r.isCorrect)
  const [count, setCount] = useState(0)
  const [showConfetti, setShowConfetti] = useState(false)

  const grade = accuracy >= 90 ? '🏆' : accuracy >= 70 ? '⭐' : accuracy >= 50 ? '💪' : '📚'
  const message = accuracy >= 90 ? 'Outstanding!' : accuracy >= 70 ? 'Great work!' : accuracy >= 50 ? 'Keep going!' : 'Every mistake counts!'
  const accentColor = accuracy >= 70 ? 'var(--color-success)' : accuracy >= 50 ? 'var(--color-warning)' : 'var(--color-primary)'

  useEffect(() => {
    setShowConfetti(accuracy >= 70)
    let start = 0
    const end = accuracy
    const step = () => {
      start += Math.ceil((end - start) / 6)
      setCount(Math.min(start, end))
      if (start < end) requestAnimationFrame(step)
    }
    const timer = setTimeout(() => requestAnimationFrame(step), 350)
    return () => clearTimeout(timer)
  }, [accuracy])

  return (
    <div className="flex flex-col min-h-screen px-4 pb-8 relative overflow-hidden"
      style={{ paddingTop: 'max(32px, var(--safe-area-top))' }}>

      {/* Full-screen confetti */}
      {showConfetti && (
        <div className="absolute inset-0 pointer-events-none">
          {Array.from({ length: 40 }, (_, i) => ({
            color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
            x: Math.random() * 100,
            delay: Math.random() * 0.5,
            dur: 1.2 + Math.random() * 0.8,
            size: 6 + Math.random() * 8,
            rotate: Math.random() * 720,
          })).map((p, i) => (
            <motion.div
              key={i}
              initial={{ y: '-10%', x: `${p.x}vw`, opacity: 1, rotate: 0 }}
              animate={{ y: '110vh', opacity: 0, rotate: p.rotate }}
              transition={{ duration: p.dur, delay: p.delay, ease: 'easeIn' }}
              className="absolute top-0 rounded-sm"
              style={{ width: p.size, height: p.size * 0.5, background: p.color }}
            />
          ))}
        </div>
      )}

      {/* Grade + message */}
      <motion.div
        initial={{ opacity: 0, scale: 0.7 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, type: 'spring', stiffness: 300, damping: 18 }}
        className="flex flex-col items-center gap-2 text-center mb-8 mt-4"
      >
        <motion.span
          animate={{ rotate: [0, -10, 10, -6, 6, 0], scale: [1, 1.2, 1] }}
          transition={{ delay: 0.3, duration: 0.7 }}
          className="text-7xl"
        >
          {grade}
        </motion.span>
        <h1 className="text-3xl font-black text-gradient">{message}</h1>
        <p className="text-[var(--color-text-muted)] text-sm">Quiz complete · {results.length} questions</p>
      </motion.div>

      {/* Big accuracy number */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="flex flex-col items-center mb-6"
      >
        <div className="relative w-36 h-36 flex items-center justify-center">
          <svg className="absolute -rotate-90" width="144" height="144">
            <circle cx="72" cy="72" r="60" fill="none" stroke="var(--color-border)" strokeWidth="8" />
            <motion.circle
              cx="72" cy="72" r="60"
              fill="none"
              stroke={accentColor}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={2 * Math.PI * 60}
              initial={{ strokeDashoffset: 2 * Math.PI * 60 }}
              animate={{ strokeDashoffset: 2 * Math.PI * 60 * (1 - accuracy / 100) }}
              transition={{ delay: 0.3, duration: 1, ease: [0.34, 1.2, 0.64, 1] }}
            />
          </svg>
          <div className="flex flex-col items-center">
            <span className="text-4xl font-black" style={{ color: accentColor }}>{count}%</span>
            <span className="text-xs text-[var(--color-text-faint)]">accuracy</span>
          </div>
        </div>
      </motion.div>

      {/* Score cards */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-2 gap-2 mb-5"
      >
        <ScoreCard label="Correct" value={`${correct}`} icon="✅" accent />
        <ScoreCard label="Missed" value={`${missed.length}`} icon="❌" />
      </motion.div>

      {/* Missed words */}
      {missed.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.28 }}
          className="mb-5"
        >
          <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[var(--color-text-faint)] mb-2 px-1">
            Review These Words
          </p>
          <div className="flex flex-col gap-1.5">
            {missed.slice(0, 5).map((r, i) => (
              <motion.div
                key={r.wordId}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.32 + i * 0.07 }}
              >
                <Link href={`/words/${r.wordId}`}>
                  <div className="flex items-center justify-between px-4 py-3 bg-[var(--color-surface)] border border-[var(--color-error)]/20 rounded-2xl hover:bg-[var(--color-surface-2)] transition-colors group">
                    <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                      <span className="font-semibold text-[var(--color-text)] capitalize">{r.word}</span>
                      <span className="text-xs text-[var(--color-text-faint)]">{r.correctAnswer}</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-[var(--color-text-faint)] shrink-0 group-hover:text-[var(--color-text-muted)] transition-colors" />
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        className="mt-auto flex flex-col gap-2"
      >
        <Button onClick={onRetry} size="xl" fullWidth className="glow-primary">
          <RefreshCw className="w-4 h-4" />
          Quiz Again
        </Button>
        <Button onClick={onDone} variant="ghost" size="lg" fullWidth>
          <Home className="w-4 h-4" />
          Go Home
        </Button>
      </motion.div>
    </div>
  )
}

function ScoreCard({ label, value, icon, accent }: { label: string; value: string; icon: string; accent?: boolean }) {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className={`flex flex-col items-center gap-1.5 rounded-2xl py-5 border ${
        accent ? 'bg-emerald-950/40 border-emerald-500/25' : 'bg-[var(--color-surface)] border-[var(--color-border)]'
      }`}
    >
      <span className="text-2xl">{icon}</span>
      <span className={`text-3xl font-black ${accent ? 'text-[var(--color-success)]' : 'text-[var(--color-text)]'}`}>{value}</span>
      <span className="text-[10px] text-[var(--color-text-faint)] uppercase tracking-wide">{label}</span>
    </motion.div>
  )
}
