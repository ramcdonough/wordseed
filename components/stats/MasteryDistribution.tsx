'use client'

import { motion } from 'framer-motion'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/lib/db/schema'
import { Card } from '@/components/ui/Card'
import type { Word } from '@/types'

const BINS = [
  { label: 'New', min: 0, max: 9, color: 'var(--color-mastery-new)' },
  { label: 'Familiar', min: 10, max: 39, color: 'var(--color-mastery-familiar)' },
  { label: 'Learning', min: 40, max: 69, color: 'var(--color-mastery-learning)' },
  { label: 'Strong', min: 70, max: 89, color: 'var(--color-mastery-strong)' },
  { label: 'Mastered', min: 90, max: 100, color: 'var(--color-mastery-mastered)' },
]

export function MasteryDistribution() {
  const words = useLiveQuery(
    () => db.words.where('isArchived').equals(0).toArray(),
    [],
    [] as Word[]
  )

  if (!words?.length) return null

  const counts = BINS.map((b) => ({
    ...b,
    count: words.filter((w) => w.masteryScore >= b.min && w.masteryScore <= b.max).length,
  }))

  const max = Math.max(...counts.map((c) => c.count), 1)

  return (
    <Card>
      <p className="text-xs font-semibold uppercase tracking-widest text-[var(--color-text-faint)] mb-4">Mastery Distribution</p>
      <div className="flex flex-col gap-2.5">
        {counts.map((bin) => (
          <div key={bin.label} className="flex items-center gap-3">
            <span className="text-xs font-medium w-16 shrink-0" style={{ color: bin.color }}>{bin.label}</span>
            <div className="flex-1 h-2 bg-[var(--color-surface-3)] rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${(bin.count / max) * 100}%` }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
                style={{ background: bin.color }}
              />
            </div>
            <span className="text-xs text-[var(--color-text-muted)] w-5 text-right">{bin.count}</span>
          </div>
        ))}
      </div>
    </Card>
  )
}
