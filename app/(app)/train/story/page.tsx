'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft, RotateCcw, Sparkles, Check, X, Dices, Lightbulb, BookOpen,
} from 'lucide-react'
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  useDroppable,
  useDraggable,
} from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { WordSourcePicker } from '@/components/train/WordSourcePicker'
import { Button } from '@/components/ui/Button'
import { generateStory } from './actions'
import type { GeneratedStory, StoryPart } from './actions'
import type { Word } from '@/types'

const MAX_WORDS = 10
const MIN_WORDS = 3

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// ── Draggable bank word ────────────────────────────────────────────────
function DraggableWord({
  word,
  uid,
  onClick,
}: {
  word: string
  uid: string
  onClick: () => void
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({ id: uid, data: { word } })

  return (
    <motion.button
      ref={setNodeRef}
      layout
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: isDragging ? 0.95 : 1, opacity: isDragging ? 0.4 : 1 }}
      exit={{ scale: 0.9, opacity: 0 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      {...listeners}
      {...attributes}
      style={{ transform: CSS.Translate.toString(transform) }}
      className="px-4 py-2 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] text-sm font-semibold text-[var(--color-text)] shadow-paper paper-texture hover:border-[var(--color-primary)]/50 transition-colors cursor-grab active:cursor-grabbing touch-none select-none"
    >
      {word}
    </motion.button>
  )
}

// ── Droppable blank slot ───────────────────────────────────────────────
function BlankSlot({
  blank,
  placement,
  isSelected,
  hint,
  checked,
  onTap,
  onRemove,
}: {
  blank: Extract<StoryPart, { type: 'blank' }>
  placement: string | null
  isSelected: boolean
  hint: string | null
  checked: boolean
  onTap: () => void
  onRemove: () => void
}) {
  const { setNodeRef, isOver } = useDroppable({ id: `blank-${blank.index}` })
  const isCorrect = checked && placement === blank.word
  const isWrong = checked && placement !== null && placement !== blank.word

  const baseClass =
    'inline-flex items-center mx-0.5 px-3 py-0.5 rounded-lg border-2 font-semibold text-sm transition-all duration-150 align-baseline'

  if (placement) {
    return (
      <button
        ref={setNodeRef}
        onClick={checked ? undefined : onRemove}
        disabled={checked}
        className={[
          baseClass,
          isCorrect
            ? 'bg-[var(--color-success-subtle)] border-[var(--color-success)] text-[var(--color-success)]'
            : isWrong
            ? 'bg-[var(--color-error-subtle)] border-[var(--color-error)] text-[var(--color-error)]'
            : 'bg-[var(--color-primary-subtle)] border-[var(--color-primary)] text-[var(--color-primary)] active:scale-95',
        ].join(' ')}
      >
        {placement}
      </button>
    )
  }

  return (
    <button
      ref={setNodeRef}
      onClick={onTap}
      className={[
        baseClass,
        'min-w-[5rem] justify-center',
        isOver
          ? 'bg-[var(--color-primary-subtle)] border-[var(--color-primary)] scale-105'
          : isSelected
          ? 'bg-[var(--color-primary-subtle)] border-[var(--color-primary)] border-solid'
          : 'bg-transparent border-dashed border-[var(--color-border)]',
      ].join(' ')}
    >
      {hint ? (
        <span className="text-[var(--color-text-faint)] tracking-widest">{hint}</span>
      ) : (
        <span className="opacity-0">{'_'.repeat(Math.max(4, blank.word.length))}</span>
      )}
    </button>
  )
}

// ── Drag overlay chip ──────────────────────────────────────────────────
function DragChip({ word }: { word: string }) {
  return (
    <div className="px-4 py-2 rounded-xl bg-[var(--color-primary)] text-[var(--color-primary-foreground)] text-sm font-semibold shadow-lg rotate-2 scale-105">
      {word}
    </div>
  )
}

type Phase = 'select' | 'loading' | 'play' | 'result'

export default function StoryPage() {
  const router = useRouter()
  const [sessionWords, setSessionWords] = useState<Word[] | null>(null)
  const [selected, setSelected] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (!sessionWords) return
    const sorted = [...sessionWords].sort((a, b) => a.masteryScore - b.masteryScore)
    setSelected(new Set(sorted.slice(0, MAX_WORDS).map((w) => w.id)))
  }, [sessionWords])
  const [phase, setPhase] = useState<Phase>('select')
  const [story, setStory] = useState<GeneratedStory | null>(null)
  const [error, setError] = useState<string | null>(null)

  // play state
  const [placements, setPlacements] = useState<(string | null)[]>([])
  const [bankWords, setBankWords] = useState<{ word: string; uid: string }[]>([])
  const [checked, setChecked] = useState(false)
  const [selectedBlank, setSelectedBlank] = useState<number | null>(null)
  const [hintsOn, setHintsOn] = useState(false)
  const [defsOpen, setDefsOpen] = useState(false)
  const [activeDragWord, setActiveDragWord] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 120, tolerance: 6 } }),
  )

  const selectedWords = useMemo(
    () => (sessionWords ?? []).filter((w) => selected.has(w.id)),
    [sessionWords, selected],
  )

  const wordMap = useMemo(() => {
    const m = new Map<string, Word>()
    for (const w of (sessionWords ?? [])) m.set(w.word.toLowerCase(), w)
    return m
  }, [sessionWords])

  const randomize = useCallback(() => {
    setSelected(new Set(shuffle([...(sessionWords ?? [])]).slice(0, MAX_WORDS).map((w) => w.id)))
  }, [sessionWords])

  const toggle = useCallback((word: Word) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(word.id)) {
        next.delete(word.id)
      } else if (next.size < MAX_WORDS) {
        next.add(word.id)
      }
      return next
    })
  }, [])

  const startGenerate = useCallback(async () => {
    setPhase('loading')
    setError(null)
    try {
      const wordStrings = selectedWords.map((w) => w.word)
      const result = await generateStory(wordStrings)
      if (!result?.parts?.length) throw new Error('AI returned an empty story — please try again.')
      const blanks = result.parts.filter(
        (p): p is Extract<StoryPart, { type: 'blank' }> => p.type === 'blank',
      )
      if (blanks.length === 0) throw new Error('AI returned no blanks — please try again.')
      setPlacements(new Array(blanks.length).fill(null))
      setBankWords(shuffle(blanks.map((b) => ({ word: b.word, uid: `${b.word}-${b.index}` }))))
      setStory(result)
      setSelectedBlank(null)
      setHintsOn(false)
      setDefsOpen(false)
      setChecked(false)
      setPhase('play')
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      setError(
        msg.includes('401') || msg.includes('403')
          ? 'Invalid API key — set GEMINI_API_KEY in .env.local.'
          : `Error: ${msg.slice(0, 200)}`,
      )
      setPhase('select')
    }
  }, [selectedWords])

  // Place a word into a specific blank (from bank)
  const placeWordInBlank = useCallback((word: string, uid: string, blankIndex: number) => {
    // Check that blank is empty
    setPlacements((prev) => {
      if (prev[blankIndex] !== null) return prev
      const next = [...prev]
      next[blankIndex] = word
      return next
    })
    setBankWords((prev) => prev.filter((b) => b.uid !== uid))
    setSelectedBlank(null)
  }, [])

  // Tap a bank word — place into selected blank or first empty
  const handleBankTap = useCallback(
    (word: string, uid: string) => {
      const targetBlank =
        selectedBlank !== null
          ? selectedBlank
          : placements.findIndex((p) => p === null)
      if (targetBlank === -1) return
      placeWordInBlank(word, uid, targetBlank)
    },
    [selectedBlank, placements, placeWordInBlank],
  )

  // Tap an empty blank — select it; tap a filled blank — remove word
  const handleBlankTap = useCallback(
    (blankIndex: number) => {
      if (checked) return
      if (placements[blankIndex] !== null) return // filled blanks handled by onRemove
      setSelectedBlank((prev) => (prev === blankIndex ? null : blankIndex))
    },
    [placements, checked],
  )

  const handleBlankRemove = useCallback(
    (blankIndex: number) => {
      if (checked) return
      const word = placements[blankIndex]
      if (!word) return
      const originalBlank = story?.parts.find(
        (p): p is Extract<StoryPart, { type: 'blank' }> =>
          p.type === 'blank' && p.index === blankIndex,
      )
      if (!originalBlank) return
      setPlacements((prev) => {
        const next = [...prev]
        next[blankIndex] = null
        return next
      })
      setBankWords((prev) => [
        ...prev,
        { word, uid: `${word}-${blankIndex}-${Date.now()}` },
      ])
      setSelectedBlank(null)
    },
    [placements, story, checked],
  )

  // Drag end
  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      setActiveDragWord(null)
      const { active, over } = event
      if (!over) return
      const uid = active.id as string
      const word = (active.data.current as { word: string }).word
      const overId = over.id as string
      if (!overId.startsWith('blank-')) return
      const blankIndex = parseInt(overId.replace('blank-', ''), 10)
      placeWordInBlank(word, uid, blankIndex)
    },
    [placeWordInBlank],
  )

  const checkAnswers = useCallback(() => {
    setChecked(true)
    setSelectedBlank(null)
    setHintsOn(false)
    setDefsOpen(false)
  }, [])

  const replay = useCallback(() => {
    setStory(null)
    setPhase('select')
    setChecked(false)
    setPlacements([])
    setBankWords([])
    setSelectedBlank(null)
    setHintsOn(false)
    setDefsOpen(false)
  }, [])

  // ── Word source picker ───────────────────────────────────────────────
  if (!sessionWords) {
    return <WordSourcePicker minWords={MIN_WORDS} modeTitle="Story" onStart={setSessionWords} />
  }

  // ── Loading ──────────────────────────────────────────────────────────
  if (phase === 'loading') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 gap-5 text-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
        >
          <Sparkles className="w-10 h-10 text-[var(--color-primary)]" />
        </motion.div>
        <div>
          <p className="font-bold text-[var(--color-text)] text-lg">Weaving your story…</p>
          <p className="text-sm text-[var(--color-text-muted)] mt-1">
            Using {selectedWords.length} words
          </p>
        </div>
      </div>
    )
  }

  // ── Play screen ──────────────────────────────────────────────────────
  if (phase === 'play' && story) {
    const blanks = story.parts.filter(
      (p): p is Extract<StoryPart, { type: 'blank' }> => p.type === 'blank',
    )
    const allFilled = placements.every((p) => p !== null)
    const correct = checked ? placements.filter((p, i) => p === blanks[i]?.word).length : 0
    const total = blanks.length
    const unfilledBlanks = blanks.filter((b) => placements[b.index] === null)

    return (
      <DndContext
        sensors={sensors}
        onDragStart={(e) =>
          setActiveDragWord((e.active.data.current as { word: string }).word)
        }
        onDragEnd={handleDragEnd}
        onDragCancel={() => setActiveDragWord(null)}
      >
        <div className="flex flex-col min-h-full" style={{ paddingTop: 'var(--safe-area-top)' }}>
          {/* Header */}
          <div className="flex items-center justify-between px-4 pt-4 pb-3 shrink-0">
            <button
              onClick={replay}
              className="w-9 h-9 flex items-center justify-center rounded-xl text-[var(--color-text-muted)] hover:bg-[var(--color-surface-2)] transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <p className="text-sm font-semibold text-[var(--color-text)]">Fill the blanks</p>
            <div className="w-9" />
          </div>

          <div className="flex-1 flex flex-col px-4 pb-8 gap-4 overflow-y-auto">
            {/* Story card */}
            <div className="p-5 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl paper-texture shadow-paper leading-8 text-[var(--color-text)] text-base">
              {story.parts.map((part, i) => {
                if (part.type === 'text') return <span key={i}>{part.content}</span>
                const hintWord = hintsOn && placements[part.index] === null
                  ? part.word[0] + '_'.repeat(Math.max(0, part.word.length - 1))
                  : null
                return (
                  <BlankSlot
                    key={i}
                    blank={part}
                    placement={placements[part.index]}
                    isSelected={selectedBlank === part.index}
                    hint={hintWord}
                    checked={checked}
                    onTap={() => handleBlankTap(part.index)}
                    onRemove={() => handleBlankRemove(part.index)}
                  />
                )
              })}
            </div>

            {/* Result banner */}
            <AnimatePresence>
              {checked && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex items-center gap-3 p-4 rounded-xl border ${
                    correct === total
                      ? 'bg-[var(--color-success-subtle)] border-[var(--color-success)]/30 text-[var(--color-success)]'
                      : 'bg-[var(--color-warning-subtle)] border-[var(--color-warning)]/30 text-[var(--color-warning)]'
                  }`}
                >
                  {correct === total ? <Check className="w-5 h-5 shrink-0" /> : <X className="w-5 h-5 shrink-0" />}
                  <div>
                    <p className="font-bold text-sm">
                      {correct === total ? 'Perfect! All words correct.' : `${correct} of ${total} correct`}
                    </p>
                    {correct < total && (
                      <p className="text-xs mt-0.5 opacity-80">Wrong blanks are shown below.</p>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Corrections */}
            <AnimatePresence>
              {checked && correct < total && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-wrap gap-2"
                >
                  {blanks.map((blank, i) => {
                    if (placements[i] === blank.word) return null
                    return (
                      <div
                        key={i}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--color-surface-2)] border border-[var(--color-border)] text-sm"
                      >
                        <span className="text-[var(--color-error)] line-through">{placements[i] ?? '—'}</span>
                        <span className="text-[var(--color-text-faint)]">→</span>
                        <span className="text-[var(--color-text)] font-semibold">{blank.word}</span>
                      </div>
                    )
                  })}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Definitions panel */}
            <AnimatePresence>
              {defsOpen && unfilledBlanks.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="flex flex-col gap-2 p-4 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-faint)] mb-1">
                      Definitions for remaining blanks
                    </p>
                    {unfilledBlanks.map((blank) => {
                      const wordObj = wordMap.get(blank.word.toLowerCase())
                      return (
                        <div key={blank.index} className="flex flex-col gap-0.5">
                          <p className="text-xs font-bold text-[var(--color-primary)]">
                            Blank {blank.index + 1}
                          </p>
                          <p className="text-sm text-[var(--color-text)] leading-snug">
                            {wordObj?.definition ?? '—'}
                          </p>
                          {wordObj?.partOfSpeech && (
                            <p className="text-xs text-[var(--color-text-faint)] italic">
                              {wordObj.partOfSpeech}
                            </p>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Word bank */}
            {!checked && (
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-faint)] mb-2">
                  {selectedBlank !== null
                    ? `Placing into blank ${selectedBlank + 1} — tap a word`
                    : 'Word bank — tap or drag into a blank'}
                </p>
                <div className="flex flex-wrap gap-2">
                  <AnimatePresence>
                    {bankWords.map((b) => (
                      <DraggableWord
                        key={b.uid}
                        word={b.word}
                        uid={b.uid}
                        onClick={() => handleBankTap(b.word, b.uid)}
                      />
                    ))}
                  </AnimatePresence>
                  {bankWords.length === 0 && (
                    <p className="text-sm text-[var(--color-text-faint)] italic">
                      All words placed — tap a blank to remove it
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Hint / Definitions toggles + Check */}
            <div className="mt-auto flex flex-col gap-2 pt-2">
              {!checked && (
                <div className="flex gap-2">
                  <button
                    onClick={() => setHintsOn((h) => !h)}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl border text-sm font-semibold transition-all ${
                      hintsOn
                        ? 'bg-[var(--color-warning-subtle)] border-[var(--color-warning)]/40 text-[var(--color-warning)]'
                        : 'bg-[var(--color-surface)] border-[var(--color-border)] text-[var(--color-text-muted)]'
                    }`}
                  >
                    <Lightbulb className="w-4 h-4" />
                    {hintsOn ? 'Hide hints' : 'Hint'}
                  </button>
                  <button
                    onClick={() => setDefsOpen((d) => !d)}
                    disabled={unfilledBlanks.length === 0}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl border text-sm font-semibold transition-all disabled:opacity-40 ${
                      defsOpen
                        ? 'bg-[var(--color-primary-subtle)] border-[var(--color-primary)]/40 text-[var(--color-primary)]'
                        : 'bg-[var(--color-surface)] border-[var(--color-border)] text-[var(--color-text-muted)]'
                    }`}
                  >
                    <BookOpen className="w-4 h-4" />
                    {defsOpen ? 'Hide defs' : 'Definitions'}
                  </button>
                </div>
              )}

              {!checked ? (
                <Button size="xl" fullWidth onClick={checkAnswers} disabled={!allFilled}>
                  <Check className="w-4 h-4" /> Check answers
                </Button>
              ) : (
                <>
                  <Button size="xl" fullWidth onClick={startGenerate}>
                    <RotateCcw className="w-4 h-4" /> New story, same words
                  </Button>
                  <Button variant="ghost" size="lg" fullWidth onClick={replay}>
                    Choose different words
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Floating drag chip */}
        <DragOverlay dropAnimation={null}>
          {activeDragWord ? <DragChip word={activeDragWord} /> : null}
        </DragOverlay>
      </DndContext>
    )
  }

  // ── Word selection screen ────────────────────────────────────────────
  return (
    <div className="flex flex-col min-h-full" style={{ paddingTop: 'var(--safe-area-top)' }}>
      <div className="flex items-center justify-between px-4 pt-4 pb-3">
        <button
          onClick={() => setSessionWords(null)}
          className="w-9 h-9 flex items-center justify-center rounded-xl text-[var(--color-text-muted)] hover:bg-[var(--color-surface-2)] transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <p className="text-sm font-semibold text-[var(--color-text)]">Story</p>
        <div className="w-9" />
      </div>

      <div className="flex-1 flex flex-col px-4 pb-8 gap-5 overflow-y-auto">
        <div>
          <h2 className="text-xl font-black text-[var(--color-text)]">Choose your words</h2>
          <p className="text-sm text-[var(--color-text-muted)] mt-1">
            Select {MIN_WORDS}–{MAX_WORDS} words. AI will weave them into a story with blanks to fill.
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-[var(--color-error-subtle)] border border-[var(--color-error)]/20 text-[var(--color-error)] text-sm">
            {error}
          </div>
        )}

        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-[var(--color-text-faint)]">
            {selected.size}/{MAX_WORDS} selected
          </p>
          <div className="flex items-center gap-3">
            <button
              onClick={randomize}
              className="flex items-center gap-1 text-xs text-[var(--color-primary)] hover:opacity-80 transition-opacity font-semibold"
            >
              <Dices className="w-3.5 h-3.5" /> Random {MAX_WORDS}
            </button>
            <button
              onClick={() => setSelected(new Set())}
              className="text-xs text-[var(--color-text-faint)] hover:text-[var(--color-text)] transition-colors"
            >
              Clear
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          {sessionWords.map((word) => {
            const isSelected = selected.has(word.id)
            const atLimit = selected.size >= MAX_WORDS && !isSelected
            return (
              <motion.button
                key={word.id}
                whileTap={{ scale: 0.98 }}
                onClick={() => toggle(word)}
                disabled={atLimit}
                className={[
                  'flex items-center gap-3 p-3.5 rounded-xl border text-left transition-all duration-150',
                  isSelected
                    ? 'bg-[var(--color-primary-subtle)] border-[var(--color-primary)]/40'
                    : atLimit
                    ? 'opacity-40 cursor-not-allowed bg-[var(--color-surface)] border-[var(--color-border)]'
                    : 'bg-[var(--color-surface)] border-[var(--color-border)] hover:border-[var(--color-primary)]/30',
                ].join(' ')}
              >
                <div
                  className={[
                    'w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors',
                    isSelected
                      ? 'bg-[var(--color-primary)] border-[var(--color-primary)]'
                      : 'border-[var(--color-border)]',
                  ].join(' ')}
                >
                  {isSelected && <Check className="w-3 h-3 text-[var(--color-primary-foreground)]" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-[var(--color-text)] text-sm">{word.word}</p>
                  <p className="text-xs text-[var(--color-text-muted)] truncate mt-0.5">
                    {word.definition}
                  </p>
                </div>
              </motion.button>
            )
          })}
        </div>

        <div className="mt-auto pt-2">
          <Button size="xl" fullWidth onClick={startGenerate} disabled={selected.size < MIN_WORDS}>
            <Sparkles className="w-4 h-4" />
            Generate story ({selected.size} words)
          </Button>
        </div>
      </div>
    </div>
  )
}
