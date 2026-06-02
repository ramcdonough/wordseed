'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { ChevronRight } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { getMasteryLabel } from '@/lib/srs/sm2'
import { cn } from '@/lib/utils/cn'
import type { Word } from '@/types'

const MASTERY_VARIANT: Record<string, 'new' | 'familiar' | 'learning' | 'strong' | 'mastered'> = {
  New: 'new', Familiar: 'familiar', Learning: 'learning', Strong: 'strong', Mastered: 'mastered',
}

interface WordCardProps {
  word: Word
  index?: number
  className?: string
}

export function WordCard({ word, index = 0, className }: WordCardProps) {
  const label = getMasteryLabel(word.masteryScore)
  const variant = MASTERY_VARIANT[label] ?? 'new'

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.04, 0.3), duration: 0.25 }}
    >
      <Link href={`/words/${word.id}`}>
        <div
          className={cn(
            'group flex flex-col gap-2 p-4 bg-[var(--color-surface)] border border-[var(--color-border)]',
            'rounded-xl paper-texture shadow-paper',
            'hover:border-[var(--color-primary)]/30 active:scale-[0.99] transition-all duration-150',
            word.isArchived && 'opacity-60',
            className
          )}
        >
          {/* Top row: word + mastery badge */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex flex-col gap-0.5 min-w-0">
              <span className="font-bold text-base text-[var(--color-text)] capitalize leading-tight">
                {word.word}
              </span>
              {word.partOfSpeech && (
                <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-primary)] opacity-80">
                  {word.partOfSpeech}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5 shrink-0 mt-0.5">
              <Badge variant={variant} size="sm">{label}</Badge>
              <ChevronRight className="w-3.5 h-3.5 text-[var(--color-text-faint)] group-hover:text-[var(--color-primary)] transition-colors" />
            </div>
          </div>

          {/* Definition */}
          <p className="text-sm text-[var(--color-text-muted)] leading-relaxed line-clamp-3">
            {word.definition}
          </p>

          {/* Example sentence if available */}
          {word.exampleSentence && (
            <p className="text-xs text-[var(--color-text-faint)] italic leading-relaxed line-clamp-2 border-l-2 border-[var(--color-border)] pl-2.5">
              &ldquo;{word.exampleSentence}&rdquo;
            </p>
          )}
        </div>
      </Link>
    </motion.div>
  )
}
