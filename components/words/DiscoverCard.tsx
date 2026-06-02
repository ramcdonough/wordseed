'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { BookmarkPlus, Check } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

interface DiscoverCardProps {
  word: string
  pos: string
  snippet: string
  owned?: boolean
  index?: number
  className?: string
}

export function DiscoverCard({ word, pos, snippet, owned = false, index = 0, className }: DiscoverCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.03, 0.4), duration: 0.25 }}
    >
      <Link href={owned ? `/words` : `/add?word=${encodeURIComponent(word)}`}>
        <div
          className={cn(
            'group h-full flex flex-col justify-between p-4 rounded-xl border paper-texture shadow-paper',
            'transition-all duration-150 active:scale-[0.98]',
            owned
              ? 'bg-[var(--color-primary-subtle)] border-[var(--color-primary)]/25 cursor-default'
              : 'bg-[var(--color-surface)] border-[var(--color-border)] hover:border-[var(--color-primary)]/35 cursor-pointer',
            className
          )}
        >
          <div className="flex flex-col gap-1.5 mb-3">
            <div className="flex items-start justify-between gap-1">
              <span className="font-bold text-[var(--color-text)] capitalize text-base leading-tight">{word}</span>
              {owned && <Check className="w-3.5 h-3.5 text-[var(--color-primary)] shrink-0 mt-0.5" />}
            </div>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-primary)] opacity-75">
              {pos}
            </span>
            <p className="text-xs text-[var(--color-text-muted)] leading-relaxed line-clamp-4">{snippet}</p>
          </div>

          {!owned && (
            <div className="flex items-center gap-1 text-xs text-[var(--color-text-faint)] group-hover:text-[var(--color-primary)] transition-colors">
              <BookmarkPlus className="w-3.5 h-3.5" />
              <span>Add word</span>
            </div>
          )}
          {owned && (
            <span className="text-xs text-[var(--color-primary)] opacity-70">In your collection</span>
          )}
        </div>
      </Link>
    </motion.div>
  )
}
