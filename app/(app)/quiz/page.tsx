'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { Zap, Settings2, BookOpen, Archive, Check } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { useWordCount, useDueWords, useWords } from '@/hooks/useWords'
import { useCollections } from '@/hooks/useCollections'
import { getWordsForQuiz } from '@/lib/db/words'
import { createQuizSession } from '@/lib/db/sessions'
import { generateQuiz } from '@/lib/quiz/generator'
import { useQuizStore } from '@/stores/quiz'
import { discoverToWord } from '@/components/train/WordSourcePicker'
import { DISCOVER_WORDS, CATEGORY_LABELS } from '@/lib/discover/words'
import type { DiscoverCategory } from '@/lib/discover/words'
import type { QuizConfig, QuestionType, Word } from '@/types'

const QUESTION_TYPE_LABELS: Record<QuestionType, string> = {
  word_to_definition: 'Word → Definition',
  definition_to_word: 'Definition → Word',
  fill_in_blank: 'Fill in the Blank',
  true_or_false: 'True or False',
  synonym_challenge: 'Synonym Challenge',
  antonym_challenge: 'Antonym Challenge',
}

const ALL_TYPES: QuestionType[] = Object.keys(QUESTION_TYPE_LABELS) as QuestionType[]

type QuizSourceType = 'library' | 'category' | 'custom'

function QuizConfigContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const dueMode = searchParams.get('mode') === 'due'

  const wordCount = useWordCount()
  const dueWords = useDueWords()
  const allUserWords = useWords() ?? []
  const collections = useCollections() ?? []

  const [config, setConfig] = useState<QuizConfig>({
    collectionId: null,
    includeArchived: false,
    wordCount: 10,
    questionTypes: ALL_TYPES,
    dueOnly: dueMode,
  })
  const [sourceType, setSourceType] = useState<QuizSourceType>('library')
  const [selectedCategory, setSelectedCategory] = useState<DiscoverCategory | null>(null)
  const [customWordIds, setCustomWordIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(false)
  const { startSession } = useQuizStore()

  const categories = (Object.keys(CATEGORY_LABELS) as DiscoverCategory[]).filter((k) => k !== 'all')

  const available = dueMode ? (dueWords?.length ?? 0) : (wordCount?.active ?? 0)

  const canStart = (() => {
    if (sourceType === 'library') return available >= 4
    if (sourceType === 'category') return selectedCategory !== null
    if (sourceType === 'custom') return customWordIds.size >= 4
    return false
  })()

  function toggleCustomWord(id: string) {
    setCustomWordIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }

  const handleStart = async (overrides?: Partial<QuizConfig>) => {
    setLoading(true)
    const effective = { ...config, ...overrides }
    try {
      let words: Word[]

      if (sourceType === 'category' && selectedCategory) {
        words = DISCOVER_WORDS.filter((w) => w.category === selectedCategory).map(discoverToWord)
        // Slice to wordCount for category
        words = words.sort(() => Math.random() - 0.5).slice(0, effective.wordCount)
      } else if (sourceType === 'custom') {
        words = allUserWords.filter((w) => customWordIds.has(w.id))
      } else {
        words = await getWordsForQuiz(
          effective.collectionId,
          effective.includeArchived,
          effective.wordCount,
          effective.dueOnly
        )
      }

      if (words.length < 4) {
        alert('You need at least 4 words to start a quiz.')
        return
      }

      const questions = generateQuiz(words, config.questionTypes)
      if (questions.length === 0) {
        alert('Could not generate questions. Try adding more words.')
        return
      }

      const session = await createQuizSession(
        words.map((w) => w.id),
        sourceType === 'library' ? config.collectionId : null,
        sourceType === 'library' ? config.includeArchived : false
      )

      startSession(session.id, questions)
      router.push('/quiz/session')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col min-h-full px-4 pt-6 pb-8">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <h1 className="text-2xl font-bold text-[var(--color-text)]">Quiz</h1>
        <p className="text-sm text-[var(--color-text-muted)]">Test what you know</p>
      </motion.div>

      {/* Quick start */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="mb-4">
        <Card padding="none" className="overflow-hidden">
          <div className="relative p-5">
            <div className="absolute inset-0 opacity-10" style={{ background: 'radial-gradient(circle at 70% 30%, #818cf8, transparent 60%)' }} />
            <div className="relative flex items-center justify-between mb-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-[var(--color-text-faint)]">Ready to Review</p>
                <div className="flex items-baseline gap-2 mt-0.5">
                  <span className="text-4xl font-black text-[var(--color-text)]">{dueWords?.length ?? 0}</span>
                  <span className="text-[var(--color-text-muted)] text-sm">due words</span>
                </div>
              </div>
              <div className="w-14 h-14 bg-[var(--color-primary-subtle)] rounded-2xl flex items-center justify-center">
                <Zap className="w-7 h-7 text-[var(--color-primary)]" />
              </div>
            </div>
            <Button
              onClick={() => handleStart({ dueOnly: true })}
              disabled={(dueWords?.length ?? 0) < 4}
              loading={loading}
              size="lg"
              fullWidth
            >
              <Zap className="w-4 h-4" />
              {dueMode ? 'Start Due Review' : 'Quick Review'}
            </Button>
          </div>
        </Card>
      </motion.div>

      {/* Config */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="flex flex-col gap-3">
        <div className="flex items-center gap-2 px-1">
          <Settings2 className="w-4 h-4 text-[var(--color-text-faint)]" />
          <p className="text-sm font-semibold text-[var(--color-text)]">Custom Quiz</p>
        </div>

        {/* Word source */}
        <Card>
          <p className="text-xs font-semibold uppercase tracking-widest text-[var(--color-text-faint)] mb-3">Word Source</p>
          <div className="flex gap-2 mb-3">
            {(['library', 'category', 'custom'] as QuizSourceType[]).map((t) => (
              <button
                key={t}
                onClick={() => setSourceType(t)}
                className={`flex-1 py-2 rounded-xl text-xs font-semibold border capitalize transition-colors ${
                  sourceType === t
                    ? 'bg-[var(--color-primary-subtle)] border-[var(--color-primary)]/40 text-[var(--color-primary)]'
                    : 'border-[var(--color-border)] text-[var(--color-text-muted)]'
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Category sub-picker */}
          {sourceType === 'category' && (
            <div className="flex flex-wrap gap-1.5 mt-1">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                    selectedCategory === cat
                      ? 'bg-[var(--color-primary-subtle)] border-[var(--color-primary)]/40 text-[var(--color-primary)]'
                      : 'border-[var(--color-border)] text-[var(--color-text-muted)]'
                  }`}
                >
                  {CATEGORY_LABELS[cat]}
                </button>
              ))}
            </div>
          )}

          {/* Custom sub-picker */}
          {sourceType === 'custom' && (
            <div className="flex flex-col gap-1.5 mt-1 max-h-48 overflow-y-auto">
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs text-[var(--color-text-muted)]">{customWordIds.size} selected · need at least 4</p>
                {customWordIds.size > 0 && (
                  <button onClick={() => setCustomWordIds(new Set())} className="text-xs text-[var(--color-primary)] font-semibold">
                    Clear
                  </button>
                )}
              </div>
              {allUserWords.map((word) => {
                const sel = customWordIds.has(word.id)
                return (
                  <button
                    key={word.id}
                    onClick={() => toggleCustomWord(word.id)}
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-lg border text-left transition-colors ${
                      sel
                        ? 'bg-[var(--color-primary-subtle)] border-[var(--color-primary)]/40'
                        : 'border-[var(--color-border)]'
                    }`}
                  >
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${sel ? 'bg-[var(--color-primary)] border-[var(--color-primary)]' : 'border-[var(--color-border)]'}`}>
                      {sel && <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />}
                    </div>
                    <span className="text-sm font-medium text-[var(--color-text)] truncate">{word.word}</span>
                  </button>
                )
              })}
            </div>
          )}
        </Card>

        {/* Word count */}
        {sourceType !== 'custom' && (
        <Card>
          <p className="text-xs font-semibold uppercase tracking-widest text-[var(--color-text-faint)] mb-3">Quiz Length</p>
          <div className="flex gap-2">
            {[5, 10, 20, 30].map((n) => (
              <button
                key={n}
                onClick={() => setConfig((c) => ({ ...c, wordCount: n }))}
                className={`flex-1 py-2 rounded-xl text-sm font-medium border transition-colors ${
                  config.wordCount === n
                    ? 'bg-[var(--color-primary-subtle)] border-[var(--color-primary)]/40 text-[var(--color-primary)]'
                    : 'border-[var(--color-border)] text-[var(--color-text-muted)]'
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        </Card>
        )}

        {/* Question types */}
        <Card>
          <p className="text-xs font-semibold uppercase tracking-widest text-[var(--color-text-faint)] mb-3">Question Types</p>
          <div className="flex flex-col gap-1.5">
            {ALL_TYPES.map((type) => {
              const on = config.questionTypes.includes(type)
              return (
                <label key={type} className="flex items-center justify-between cursor-pointer py-0.5">
                  <span className="text-sm text-[var(--color-text)]">{QUESTION_TYPE_LABELS[type]}</span>
                  <div
                    onClick={() =>
                      setConfig((c) => ({
                        ...c,
                        questionTypes: on
                          ? c.questionTypes.filter((t) => t !== type)
                          : [...c.questionTypes, type],
                      }))
                    }
                    className={`w-9 h-5 rounded-full transition-colors relative cursor-pointer ${on ? 'bg-[var(--color-primary)]' : 'bg-[var(--color-surface-3)]'}`}
                  >
                    <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${on ? 'translate-x-4' : ''}`} />
                  </div>
                </label>
              )
            })}
          </div>
        </Card>

        {/* Collections — library mode only */}
        {sourceType === 'library' && collections.length > 0 && (
          <Card>
            <p className="text-xs font-semibold uppercase tracking-widest text-[var(--color-text-faint)] mb-3">Collection</p>
            <div className="flex gap-1.5 flex-wrap">
              <button
                onClick={() => setConfig((c) => ({ ...c, collectionId: null }))}
                className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                  !config.collectionId
                    ? 'bg-[var(--color-primary-subtle)] border-[var(--color-primary)]/40 text-[var(--color-primary)]'
                    : 'border-[var(--color-border)] text-[var(--color-text-muted)]'
                }`}
              >
                All Words
              </button>
              {collections.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setConfig((prev) => ({ ...prev, collectionId: c.id === prev.collectionId ? null : c.id }))}
                  className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                    config.collectionId === c.id
                      ? 'bg-[var(--color-primary-subtle)] border-[var(--color-primary)]/40 text-[var(--color-primary)]'
                      : 'border-[var(--color-border)] text-[var(--color-text-muted)]'
                  }`}
                >
                  {c.icon} {c.name}
                </button>
              ))}
            </div>
          </Card>
        )}

        {/* Include archived — library mode only */}
        {sourceType === 'library' && <label className="flex items-center justify-between px-4 py-3 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl cursor-pointer">
          <div className="flex items-center gap-2">
            <Archive className="w-4 h-4 text-[var(--color-text-faint)]" />
            <span className="text-sm text-[var(--color-text)]">Include archived words</span>
          </div>
          <div
            onClick={() => setConfig((c) => ({ ...c, includeArchived: !c.includeArchived }))}
            className={`w-9 h-5 rounded-full transition-colors relative ${config.includeArchived ? 'bg-[var(--color-primary)]' : 'bg-[var(--color-surface-3)]'}`}
          >
            <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${config.includeArchived ? 'translate-x-4' : ''}`} />
          </div>
        </label>}

        <Button
          onClick={() => handleStart({ dueOnly: false })}
          disabled={!canStart}
          loading={loading}
          size="xl"
          fullWidth
          variant="secondary"
        >
          <BookOpen className="w-4 h-4" />
          Start Custom Quiz
        </Button>

        {!canStart && (
          <p className="text-xs text-center text-[var(--color-text-faint)]">
            {sourceType === 'category'
              ? 'Select a category above to start'
              : sourceType === 'custom'
              ? 'Select at least 4 words above'
              : 'You need at least 4 words to start a quiz'}
          </p>
        )}
      </motion.div>
    </div>
  )
}

export default function QuizPage() {
  return (
    <Suspense>
      <QuizConfigContent />
    </Suspense>
  )
}
