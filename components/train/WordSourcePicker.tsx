'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowLeft, BookOpen, Layers, Tag, List, Check, Lock, ChevronRight } from 'lucide-react'
import { useWords } from '@/hooks/useWords'
import { useCollections } from '@/hooks/useCollections'
import { Button } from '@/components/ui/Button'
import { DISCOVER_WORDS, CATEGORY_LABELS } from '@/lib/discover/words'
import type { DiscoverCategory } from '@/lib/discover/words'
import type { Word, Collection } from '@/types'

export function discoverToWord(dw: { word: string; pos: string; snippet: string }): Word {
  return {
    id: `discover-${dw.word.replace(/\s+/g, '-')}`,
    word: dw.word,
    definition: dw.snippet,
    partOfSpeech: dw.pos,
    exampleSentence: '',
    pronunciation: '',
    synonyms: [],
    antonyms: [],
    collections: [],
    notes: '',
    isArchived: false,
    dateAdded: 0,
    lastReviewed: null,
    nextReviewDate: null,
    interval: 0,
    easeFactor: 2.5,
    repetitions: 0,
    timesSeen: 0,
    timesCorrect: 0,
    timesIncorrect: 0,
    masteryScore: 0,
  }
}

// ── Private helpers ────────────────────────────────────────────────────────────

function PickerHeader({
  title,
  subtitle,
  onBack,
  backIsLink,
}: {
  title: string
  subtitle: string
  onBack?: () => void
  backIsLink?: boolean
}) {
  const backBtn = backIsLink ? (
    <Link
      href="/train"
      className="w-9 h-9 flex items-center justify-center rounded-xl text-[var(--color-text-muted)] hover:bg-[var(--color-surface-2)] transition-colors"
    >
      <ArrowLeft className="w-5 h-5" />
    </Link>
  ) : (
    <button
      onClick={onBack}
      className="w-9 h-9 flex items-center justify-center rounded-xl text-[var(--color-text-muted)] hover:bg-[var(--color-surface-2)] transition-colors"
    >
      <ArrowLeft className="w-5 h-5" />
    </button>
  )

  return (
    <div className="flex items-center gap-3 mb-6">
      {backBtn}
      <div>
        <h1 className="text-xl font-black text-[var(--color-text)]">{title}</h1>
        <p className="text-xs text-[var(--color-text-muted)]">{subtitle}</p>
      </div>
    </div>
  )
}

function SourceCard({
  delay,
  icon,
  iconBg,
  title,
  subtitle,
  disabled,
  onClick,
}: {
  delay: number
  icon: React.ReactNode
  iconBg: string
  title: string
  subtitle: string
  disabled?: boolean
  onClick: () => void
}) {
  return (
    <motion.button
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.25, ease: [0.25, 1, 0.5, 1] }}
      onClick={disabled ? undefined : onClick}
      className={`flex items-center gap-4 p-4 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl paper-texture shadow-paper text-left transition-all duration-150 w-full ${
        disabled
          ? 'opacity-50 cursor-default'
          : 'hover:border-[var(--color-primary)]/40 active:scale-[0.99] cursor-pointer'
      }`}
    >
      <div className={`w-10 h-10 rounded-xl ${iconBg} flex items-center justify-center shrink-0`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-bold text-[var(--color-text)] text-sm">{title}</p>
        <p className="text-xs text-[var(--color-text-muted)]">{subtitle}</p>
      </div>
      {disabled ? (
        <Lock className="w-4 h-4 text-[var(--color-text-faint)] shrink-0" />
      ) : (
        <ChevronRight className="w-4 h-4 text-[var(--color-text-faint)] shrink-0" />
      )}
    </motion.button>
  )
}

// ── Main component ─────────────────────────────────────────────────────────────

type Step = 'source' | 'collection' | 'category' | 'custom'

interface WordSourcePickerProps {
  minWords?: number
  modeTitle: string
  onStart: (words: Word[]) => void
}

export function WordSourcePicker({ minWords = 1, modeTitle, onStart }: WordSourcePickerProps) {
  const allUserWords = useWords() ?? []
  const collections = useCollections() ?? []
  const [step, setStep] = useState<Step>('source')
  const [selectedWordIds, setSelectedWordIds] = useState<Set<string>>(new Set())

  const categories = (Object.keys(CATEGORY_LABELS) as DiscoverCategory[]).filter((k) => k !== 'all')

  function toggleWord(id: string) {
    setSelectedWordIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  // ── Source selection ─────────────────────────────────────────────────────
  if (step === 'source') {
    return (
      <div className="flex flex-col min-h-full px-4 pt-6 pb-8">
        <PickerHeader title={modeTitle} subtitle="Choose your word source" backIsLink />

        <div className="flex flex-col gap-2.5">
          <SourceCard
            delay={0}
            icon={<BookOpen className="w-5 h-5 text-[var(--color-primary)]" />}
            iconBg="bg-[var(--color-primary)]/15"
            title="All My Words"
            subtitle={`${allUserWords.length} word${allUserWords.length !== 1 ? 's' : ''} in your library`}
            disabled={allUserWords.length < minWords}
            onClick={() => onStart(allUserWords)}
          />
          <SourceCard
            delay={0.06}
            icon={<Layers className="w-5 h-5 text-[var(--color-success)]" />}
            iconBg="bg-[var(--color-success)]/15"
            title="Collection"
            subtitle={
              collections.length > 0
                ? `${collections.length} collection${collections.length !== 1 ? 's' : ''} available`
                : 'No collections yet'
            }
            disabled={collections.length === 0}
            onClick={() => setStep('collection')}
          />
          <SourceCard
            delay={0.12}
            icon={<Tag className="w-5 h-5 text-[var(--color-warning)]" />}
            iconBg="bg-[var(--color-warning)]/15"
            title="Category"
            subtitle="Explore curated words from a topic area"
            onClick={() => setStep('category')}
          />
          <SourceCard
            delay={0.18}
            icon={<List className="w-5 h-5 text-[var(--color-error)]" />}
            iconBg="bg-[var(--color-error)]/10"
            title="Custom"
            subtitle="Hand-pick specific words from your library"
            disabled={allUserWords.length < minWords}
            onClick={() => setStep('custom')}
          />
        </div>
      </div>
    )
  }

  // ── Collection picker ────────────────────────────────────────────────────
  if (step === 'collection') {
    return (
      <div className="flex flex-col min-h-full px-4 pt-6 pb-8">
        <PickerHeader title="Choose Collection" subtitle={modeTitle} onBack={() => setStep('source')} />

        <div className="flex flex-col gap-2">
          {collections.map((col: Collection, i: number) => {
            const count = allUserWords.filter((w) => w.collections.includes(col.id)).length
            const canUse = count >= minWords
            return (
              <motion.button
                key={col.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05, duration: 0.22 }}
                onClick={() => {
                  if (!canUse) return
                  onStart(allUserWords.filter((w) => w.collections.includes(col.id)))
                }}
                className={`flex items-center gap-4 p-4 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl paper-texture shadow-paper text-left transition-all duration-150 ${
                  canUse
                    ? 'hover:border-[var(--color-primary)]/40 active:scale-[0.99] cursor-pointer'
                    : 'opacity-50 cursor-default'
                }`}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0"
                  style={{ backgroundColor: col.color + '26' }}
                >
                  {col.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-[var(--color-text)] text-sm">{col.name}</p>
                  <p className="text-xs text-[var(--color-text-muted)]">
                    {count} word{count !== 1 ? 's' : ''}
                    {!canUse && minWords > 1 && ` · need at least ${minWords}`}
                  </p>
                </div>
                {canUse ? (
                  <ChevronRight className="w-4 h-4 text-[var(--color-text-faint)] shrink-0" />
                ) : (
                  <Lock className="w-4 h-4 text-[var(--color-text-faint)] shrink-0" />
                )}
              </motion.button>
            )
          })}
        </div>
      </div>
    )
  }

  // ── Category picker ──────────────────────────────────────────────────────
  if (step === 'category') {
    return (
      <div className="flex flex-col min-h-full px-4 pt-6 pb-8">
        <PickerHeader title="Choose Category" subtitle={modeTitle} onBack={() => setStep('source')} />

        <div className="flex flex-col gap-2">
          {categories.map((cat, i) => {
            const label = CATEGORY_LABELS[cat]
            const count = DISCOVER_WORDS.filter((w) => w.category === cat).length
            return (
              <motion.button
                key={cat}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04, duration: 0.22 }}
                onClick={() => {
                  onStart(DISCOVER_WORDS.filter((w) => w.category === cat).map(discoverToWord))
                }}
                className="flex items-center gap-4 p-4 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl paper-texture shadow-paper hover:border-[var(--color-primary)]/40 active:scale-[0.99] cursor-pointer text-left transition-all duration-150"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-[var(--color-text)] text-sm">{label}</p>
                  <p className="text-xs text-[var(--color-text-muted)]">{count} words</p>
                </div>
                <ChevronRight className="w-4 h-4 text-[var(--color-text-faint)] shrink-0" />
              </motion.button>
            )
          })}
        </div>
      </div>
    )
  }

  // ── Custom word picker ───────────────────────────────────────────────────
  if (step === 'custom') {
    const selectedCount = selectedWordIds.size
    const canStart = selectedCount >= minWords

    return (
      <div className="flex flex-col min-h-full px-4 pt-6 pb-8">
        <PickerHeader title="Pick Words" subtitle={modeTitle} onBack={() => setStep('source')} />

        <div className="flex items-center justify-between mb-3">
          <p className="text-xs text-[var(--color-text-muted)]">
            {selectedCount} selected
            {minWords > 1 && ` · need at least ${minWords}`}
          </p>
          {selectedCount > 0 && (
            <button
              onClick={() => setSelectedWordIds(new Set())}
              className="text-xs text-[var(--color-primary)] font-semibold"
            >
              Clear all
            </button>
          )}
        </div>

        <div className="flex flex-col gap-2 flex-1 overflow-y-auto pb-4">
          {allUserWords.map((word, i) => {
            const selected = selectedWordIds.has(word.id)
            return (
              <button
                key={word.id}
                onClick={() => toggleWord(word.id)}
                className={`flex items-center gap-3 p-3.5 rounded-xl border text-left transition-all duration-150 active:scale-[0.99] ${
                  selected
                    ? 'bg-[var(--color-primary-subtle)] border-[var(--color-primary)]/40'
                    : 'bg-[var(--color-surface)] border-[var(--color-border)] paper-texture shadow-paper'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                    selected
                      ? 'bg-[var(--color-primary)] border-[var(--color-primary)]'
                      : 'border-[var(--color-border-strong,var(--color-border))]'
                  }`}
                >
                  {selected && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-[var(--color-text)] text-sm">{word.word}</p>
                  <p className="text-xs text-[var(--color-text-muted)] truncate">{word.definition}</p>
                </div>
              </button>
            )
          })}
        </div>

        <div className="pt-2">
          <Button
            onClick={() => onStart(allUserWords.filter((w) => selectedWordIds.has(w.id)))}
            disabled={!canStart}
            size="xl"
            fullWidth
          >
            Start with {selectedCount} word{selectedCount !== 1 ? 's' : ''}
          </Button>
        </div>
      </div>
    )
  }

  return null
}
