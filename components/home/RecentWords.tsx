'use client'

import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Card } from '@/components/ui/Card'
import { db } from '@/lib/db/schema'
import { getMasteryLabel } from '@/lib/srs/sm2'
import type { Word } from '@/types'

export function RecentWords() {
  const words = useLiveQuery(
    () => db.words.filter((w) => !w.isArchived).reverse().sortBy('dateAdded').then((w) => w.slice(0, 3)),
    [],
    [] as Word[]
  )

  if (!words?.length) return null

  return (
    <div className="flex flex-col gap-1.5">
      {words.map((word) => (
        <Link key={word.id} href={`/words/${word.id}`}>
          <Card interactive padding="sm">
            <div className="flex items-center justify-between gap-3">
              <div className="flex flex-col gap-0.5 min-w-0">
                <span className="font-semibold text-[var(--color-text)] capitalize truncate">{word.word}</span>
                <span className="text-xs text-[var(--color-text-faint)] truncate">{word.definition}</span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs text-[var(--color-text-faint)]">{getMasteryLabel(word.masteryScore)}</span>
                <ChevronRight className="w-3.5 h-3.5 text-[var(--color-text-faint)]" />
              </div>
            </div>
          </Card>
        </Link>
      ))}
    </div>
  )
}
