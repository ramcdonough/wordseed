'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Zap, Shuffle, ChevronRight, Lock } from 'lucide-react'
import { useDueWords, useWordCount } from '@/hooks/useWords'

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.08, duration: 0.3, ease: [0.25, 1, 0.5, 1] as const },
  }),
}

export default function TrainPage() {
  const dueWords = useDueWords()
  const wordCount = useWordCount()
  const dueCount = dueWords?.length ?? 0
  const totalActive = wordCount?.active ?? 0

  return (
    <div className="flex flex-col min-h-full px-4 pt-6 pb-8">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="mb-7"
      >
        <h1 className="text-2xl font-black text-[var(--color-text)] mb-1">Train</h1>
        <p className="text-sm text-[var(--color-text-muted)]">
          Choose how you want to sharpen your vocabulary.
        </p>
      </motion.div>

      <div className="flex flex-col gap-3">
        {/* ── Quiz ── */}
        <motion.div custom={0} initial="hidden" animate="show" variants={fadeUp}>
          <Link href="/quiz">
            <div className="group flex items-center gap-4 p-5 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl paper-texture shadow-paper hover:border-[var(--color-primary)]/40 active:scale-[0.99] transition-all duration-150">
              <div className="w-12 h-12 rounded-xl bg-[var(--color-primary)]/15 flex items-center justify-center shrink-0">
                <Zap className="w-6 h-6 text-[var(--color-primary)]" strokeWidth={2} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="font-bold text-[var(--color-text)] text-base">Quiz</span>
                  {dueCount > 0 && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[var(--color-primary-subtle)] text-[var(--color-primary)]">
                      {dueCount} due
                    </span>
                  )}
                </div>
                <p className="text-sm text-[var(--color-text-muted)] leading-snug">
                  Spaced repetition across multiple question types. The core of how your words stick.
                </p>
              </div>
              <ChevronRight className="w-4 h-4 text-[var(--color-text-faint)] group-hover:text-[var(--color-primary)] transition-colors shrink-0" />
            </div>
          </Link>
        </motion.div>

        {/* ── Jumble ── */}
        <motion.div custom={1} initial="hidden" animate="show" variants={fadeUp}>
          <Link href={totalActive >= 3 ? '/train/jumble' : '#'}>
            <div className={`group flex items-center gap-4 p-5 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl paper-texture shadow-paper active:scale-[0.99] transition-all duration-150 ${totalActive >= 3 ? 'hover:border-[var(--color-primary)]/40 cursor-pointer' : 'opacity-60 cursor-default'}`}>
              <div className="w-12 h-12 rounded-xl bg-[var(--color-success)]/15 flex items-center justify-center shrink-0">
                <Shuffle className="w-6 h-6 text-[var(--color-success)]" strokeWidth={2} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="font-bold text-[var(--color-text)] text-base">Jumble</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[var(--color-success-subtle)] text-[var(--color-success)]">
                    New
                  </span>
                </div>
                <p className="text-sm text-[var(--color-text-muted)] leading-snug">
                  Scrambled letters, your clue is the definition. Tap to build the word from scratch.
                </p>
                {totalActive < 3 && (
                  <p className="text-xs text-[var(--color-text-faint)] mt-1 flex items-center gap-1">
                    <Lock className="w-3 h-3" /> Add at least 3 words to unlock
                  </p>
                )}
              </div>
              <ChevronRight className="w-4 h-4 text-[var(--color-text-faint)] group-hover:text-[var(--color-primary)] transition-colors shrink-0" />
            </div>
          </Link>
        </motion.div>

        {/* ── Coming soon placeholder ── */}
        <motion.div custom={2} initial="hidden" animate="show" variants={fadeUp}>
          <div className="flex items-center gap-4 p-5 bg-[var(--color-surface)]/60 border border-dashed border-[var(--color-border)] rounded-xl opacity-50">
            <div className="w-12 h-12 rounded-xl bg-[var(--color-surface-3)] flex items-center justify-center shrink-0">
              <span className="text-xl">🎯</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="font-bold text-[var(--color-text)] text-base">More coming</span>
              </div>
              <p className="text-sm text-[var(--color-text-muted)] leading-snug">
                New games and challenges on the way.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
